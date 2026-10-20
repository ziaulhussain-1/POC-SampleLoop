import type { Clock } from '../../../shared/clock/showroom-clock.ts';
import type { IdGenerator } from '../../../shared/ids/uuidv7.ts';
import { applySampleEdit, draftSample, retireSample } from '../domain/sample.ts';
import type { NewSample, Principal, Sample, SampleEdit } from '../domain/sample.ts';
import { SampleError } from '../domain/sample-error.ts';
import { visibilityFor } from './ports.ts';
import type { SampleRepository } from './ports.ts';

interface Deps {
  samples: SampleRepository;
  clock: Clock;
  ids: IdGenerator;
}

/** FR-1: Manager creates a Sample. */
export class CreateSample {
  #samples: SampleRepository;
  #clock: Clock;
  #ids: IdGenerator;

  constructor(deps: Deps) {
    this.#samples = deps.samples;
    this.#clock = deps.clock;
    this.#ids = deps.ids;
  }

  async execute(principal: Principal, input: NewSample): Promise<Sample> {
    const sample = draftSample(input, principal, this.#ids.newId(), this.#clock.now());

    // Reported ahead of the insert so the conflict envelope can name the Sample
    // that holds the code (FR-1). The unique index is still the backstop: on a
    // race the repository raises the same error without a pre-read.
    const taken = await this.#samples.findByReferenceCode(sample.referenceCode);
    if (taken) throw referenceCodeTaken(taken);

    await this.#samples.insert(sample);
    return sample;
  }
}

/** FR-1: Manager edits a Sample. */
export class EditSample {
  #samples: SampleRepository;
  #clock: Clock;

  constructor(deps: Pick<Deps, 'samples' | 'clock'>) {
    this.#samples = deps.samples;
    this.#clock = deps.clock;
  }

  async execute(principal: Principal, id: string, edit: SampleEdit): Promise<Sample> {
    const sample = await this.#load(principal, id);
    const edited = applySampleEdit(sample, edit, principal, this.#clock.now());
    await this.#samples.update(edited);
    return edited;
  }

  async #load(principal: Principal, id: string): Promise<Sample> {
    const sample = await this.#samples.findById(id, visibilityFor(principal));
    if (!sample) throw new SampleError('SAMPLE_NOT_FOUND', 'No such Sample.');
    return sample;
  }
}

/**
 * FR-1: Manager retires a Sample. A named operation rather than a field write
 * (AD-13) — `POST /samples/{id}/retirement`, never a PATCH of a status column.
 */
export class RetireSample {
  #samples: SampleRepository;
  #clock: Clock;

  constructor(deps: Pick<Deps, 'samples' | 'clock'>) {
    this.#samples = deps.samples;
    this.#clock = deps.clock;
  }

  async execute(principal: Principal, id: string): Promise<Sample> {
    const sample = await this.#samples.findById(id, visibilityFor(principal));
    if (!sample) throw new SampleError('SAMPLE_NOT_FOUND', 'No such Sample.');
    const retired = retireSample(sample, principal, this.#clock.now());
    await this.#samples.update(retired);
    return retired;
  }
}

/**
 * FR-1: read one Sample. Staff and Manager see every field including retired
 * entries; a Designer cannot reach a retired one at all.
 */
export class GetSample {
  #samples: SampleRepository;

  constructor(deps: Pick<Deps, 'samples'>) {
    this.#samples = deps.samples;
  }

  async execute(principal: Principal, id: string): Promise<Sample> {
    const sample = await this.#samples.findById(id, visibilityFor(principal));
    if (!sample) throw new SampleError('SAMPLE_NOT_FOUND', 'No such Sample.');
    return sample;
  }
}

export function referenceCodeTaken(existing: Sample): SampleError {
  return new SampleError(
    'REFERENCE_CODE_TAKEN',
    `Reference code ${existing.referenceCode} already belongs to another Sample.`,
    { entity: 'sample', id: existing.id, label: existing.referenceCode },
  );
}

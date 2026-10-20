import { normaliseReferenceCode } from '../domain/sample.ts';
import type { Sample } from '../domain/sample.ts';
import { SampleError } from '../domain/sample-error.ts';
import { visible } from '../application/ports.ts';
import type { CatalogueVisibility, SampleRepository } from '../application/ports.ts';

/**
 * In-process SampleRepository for tests and local runs. It enforces the same
 * case-insensitive uniqueness the SQL adapter gets from its unique index on
 * `upper(reference_code)`, so a test cannot pass against a weaker rule than
 * production runs under.
 */
export class InMemorySampleRepository implements SampleRepository {
  readonly samples = new Map<string, Sample>();

  async insert(sample: Sample): Promise<void> {
    const clash = this.#byCode(sample.referenceCode);
    if (clash) {
      throw new SampleError(
        'REFERENCE_CODE_TAKEN',
        `Reference code ${clash.referenceCode} already belongs to another Sample.`,
        { entity: 'sample', id: clash.id, label: clash.referenceCode },
      );
    }
    this.samples.set(sample.id, structuredClone(sample));
  }

  async update(sample: Sample): Promise<void> {
    if (!this.samples.has(sample.id)) throw new SampleError('SAMPLE_NOT_FOUND', 'No such Sample.');
    this.samples.set(sample.id, structuredClone(sample));
  }

  async findById(id: string, visibility: CatalogueVisibility): Promise<Sample | null> {
    const sample = this.samples.get(id);
    return sample && visible(sample, visibility) ? structuredClone(sample) : null;
  }

  async findByReferenceCode(referenceCode: string): Promise<Sample | null> {
    const sample = this.#byCode(referenceCode);
    return sample ? structuredClone(sample) : null;
  }

  #byCode(referenceCode: string): Sample | undefined {
    const wanted = normaliseReferenceCode(referenceCode);
    for (const sample of this.samples.values()) {
      if (normaliseReferenceCode(sample.referenceCode) === wanted) return sample;
    }
    return undefined;
  }
}

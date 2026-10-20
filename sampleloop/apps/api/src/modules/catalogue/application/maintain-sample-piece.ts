import type { Clock } from '../../../shared/clock/showroom-clock.ts';
import type { IdGenerator } from '../../../shared/ids/uuidv7.ts';
import { isRetired } from '../domain/sample.ts';
import type { Principal, Sample } from '../domain/sample.ts';
import { draftPieces, isLendable, isRemoved, removePiece, requirePieceCount } from '../domain/sample-piece.ts';
import type { SamplePiece } from '../domain/sample-piece.ts';
import { SampleError } from '../domain/sample-error.ts';
import { visibilityFor } from './ports.ts';
import type { PieceCommitments, SamplePieceRepository, SampleRepository } from './ports.ts';

interface Deps {
  samples: SampleRepository;
  pieces: SamplePieceRepository;
  commitments: PieceCommitments;
  clock: Clock;
  ids: IdGenerator;
}

async function loadSample(samples: SampleRepository, principal: Principal, id: string): Promise<Sample> {
  const sample = await samples.findById(id, visibilityFor(principal));
  if (!sample) throw new SampleError('SAMPLE_NOT_FOUND', 'No such Sample.');
  return sample;
}

/**
 * FR-2: Manager records the pieces that physically exist for a Sample. Recording
 * "there are four" on a new Sample and adding one more later are the same
 * operation — `POST /samples/{id}/pieces` with a count (AD-13).
 */
export class AddSamplePieces {
  #samples: SampleRepository;
  #pieces: SamplePieceRepository;
  #clock: Clock;
  #ids: IdGenerator;

  constructor(deps: Omit<Deps, 'commitments'>) {
    this.#samples = deps.samples;
    this.#pieces = deps.pieces;
    this.#clock = deps.clock;
    this.#ids = deps.ids;
  }

  async execute(principal: Principal, sampleId: string, count = 1): Promise<SamplePiece[]> {
    const ids = Array.from({ length: requirePieceCount(count) }, () => this.#ids.newId());
    const sample = await loadSample(this.#samples, principal, sampleId);
    const now = this.#clock.now();
    return this.#pieces.append(sample.id, (first) => draftPieces(sample, first, ids, principal, now));
  }
}

/**
 * FR-2: Manager removes one piece from the catalogue — `POST /sample-pieces/{id}/removal`.
 * The piece is marked removed, never deleted, so its history survives (FR-33).
 */
export class RemoveSamplePiece {
  #samples: SampleRepository;
  #pieces: SamplePieceRepository;
  #commitments: PieceCommitments;
  #clock: Clock;

  constructor(deps: Omit<Deps, 'ids'>) {
    this.#samples = deps.samples;
    this.#pieces = deps.pieces;
    this.#commitments = deps.commitments;
    this.#clock = deps.clock;
  }

  async execute(principal: Principal, pieceId: string): Promise<SamplePiece> {
    const piece = await this.#pieces.findById(pieceId);
    if (!piece) throw new SampleError('SAMPLE_PIECE_NOT_FOUND', 'No such Sample Piece.');
    const sample = await loadSample(this.#samples, principal, piece.sampleId);

    const commitment = await this.#commitments.find(piece.id);
    const removed = removePiece(piece, sample, commitment, principal, this.#clock.now());
    await this.#pieces.update(removed);
    return removed;
  }
}

export interface SamplePieceList {
  sample: Sample;
  /** Pieces still in the catalogue, in piece-number order. Removed pieces are FR-33 history. */
  pieces: SamplePiece[];
  /** Pieces in the catalogue and usable. Free-on-a-date is FR-4's question, not this one. */
  lendableCount: number;
  /**
   * True when nothing can be lent: no usable piece is left (including after the last
   * one was removed), or the Sample is retired. The Sample itself stays either way.
   */
  unavailable: boolean;
}

/** FR-2: the pieces a Sample has, under the same visibility as the Sample itself (FR-1). */
export class ListSamplePieces {
  #samples: SampleRepository;
  #pieces: SamplePieceRepository;

  constructor(deps: Pick<Deps, 'samples' | 'pieces'>) {
    this.#samples = deps.samples;
    this.#pieces = deps.pieces;
  }

  async execute(principal: Principal, sampleId: string): Promise<SamplePieceList> {
    const sample = await loadSample(this.#samples, principal, sampleId);
    const pieces = (await this.#pieces.listBySample(sample.id)).filter((piece) => !isRemoved(piece));
    const lendableCount = pieces.filter(isLendable).length;
    return { sample, pieces, lendableCount, unavailable: lendableCount === 0 || isRetired(sample) };
  }
}

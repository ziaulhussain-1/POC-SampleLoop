import { isRetired } from '../domain/sample.ts';
import type { Principal, Sample } from '../domain/sample.ts';
import type { PieceCommitment, SamplePiece } from '../domain/sample-piece.ts';

/**
 * FR-1: a retired Sample is hidden from Designer search but stays visible to Staff
 * and Manager and in all history. Like `StudioScope` in `kits` (AD-6), the rule is
 * a required argument on every read rather than a filter each caller remembers —
 * an endpoint that forgets it will not compile.
 */
export type CatalogueVisibility = 'active-only' | 'including-retired';

export function visibilityFor(principal: Principal): CatalogueVisibility {
  return principal.role === 'designer' ? 'active-only' : 'including-retired';
}

export function visible(sample: Sample, visibility: CatalogueVisibility): boolean {
  return visibility === 'including-retired' || !isRetired(sample);
}

export interface SampleRepository {
  insert(sample: Sample): Promise<void>;
  update(sample: Sample): Promise<void>;
  findById(id: string, visibility: CatalogueVisibility): Promise<Sample | null>;
  /**
   * Uniqueness is checked across the whole catalogue, retired entries included, so
   * a retired code is never handed out twice. Visibility does not apply here.
   */
  findByReferenceCode(referenceCode: string): Promise<Sample | null>;
}

export interface SamplePieceRepository {
  /**
   * FR-2: append pieces to a Sample. `build` receives the next unused piece number
   * and returns the pieces to insert. Numbering and insert happen as one step —
   * the SQL adapter takes `SELECT … FOR UPDATE` on the `sample` row first — so two
   * Managers adding at once cannot be handed the same number. The unique index on
   * `(sample_id, piece_number)` is the backstop.
   */
  append(sampleId: string, build: (firstNumber: number) => SamplePiece[]): Promise<SamplePiece[]>;
  update(piece: SamplePiece): Promise<void>;
  /** Removed pieces included: they are still referenced by history (FR-33). */
  findById(id: string): Promise<SamplePiece | null>;
  /** Every piece the Sample has ever had, removed ones included, in piece-number order. */
  listBySample(sampleId: string): Promise<SamplePiece[]>;
}

/**
 * FR-2: whether a piece is held or on Loan. Holds belong to `kits` and Loan Lines to
 * `lending` (AD-15), so `catalogue` asks through this port rather than reading their
 * tables; the adapter composes those modules' application services.
 */
export interface PieceCommitments {
  /**
   * The open Loan Line or active Hold on the piece, if any. NFR-7 allows at most one
   * of each; handover releases the Hold, so if both are ever seen the Loan is reported.
   */
  find(pieceId: string): Promise<PieceCommitment | null>;
}

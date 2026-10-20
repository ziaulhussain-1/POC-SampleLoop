import { addDays } from '../../../shared/clock/showroom-clock.ts';
import type { IsoDate } from '../../../shared/clock/showroom-clock.ts';

export type HoldReleaseReason = 'expiry' | 'cancelled';

/**
 * A Hold is a first-class record, not a flag (PRD addendum): one Sample Piece
 * promised to one Kit. At most one active Hold per piece (NFR-7, AD-4).
 */
export interface Hold {
  id: string;
  kitId: string;
  sampleId: string;
  samplePieceId: string;
  /** Last showroom day the Hold survives; it lapses once this day has passed (FR-8). */
  expiresOn: IsoDate;
  createdBy: string;
  createdAt: string;
  releasedAt?: string;
  /** null when the system released it. */
  releasedBy?: string | null;
  releaseReason?: HoldReleaseReason;
}

/** What the catalogue tells the kits module about one physical piece. */
export interface SamplePiece {
  id: string;
  sampleId: string;
  usable: boolean;
  /** Expected return date when the piece is on an open Loan Line. */
  onLoanUntil?: IsoDate;
}

/** FR-8: a Hold lasts until the end of the day after its Kit's collection date. */
export const HOLD_GRACE_DAYS = 1;

export function holdExpiresOn(collectionDate: IsoDate): IsoDate {
  return addDays(collectionDate, HOLD_GRACE_DAYS);
}

/**
 * FR-4 / FR-7: a piece can be held for a date when it is usable and not on a Loan
 * Line expected back after that date. Active Holds are checked separately.
 */
export function pieceUsableOn(piece: SamplePiece, date: IsoDate): boolean {
  return piece.usable && (piece.onLoanUntil === undefined || piece.onLoanUntil <= date);
}

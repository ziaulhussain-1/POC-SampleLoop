import type { IsoDate } from '../../../shared/clock/showroom-clock.ts';
import { isRetired, requireManager } from './sample.ts';
import type { Principal, Sample } from './sample.ts';
import { SampleError } from './sample-error.ts';

/** PRD §3: only a *usable* piece can be lent. */
export type Condition = 'usable' | 'damaged' | 'missing';

/**
 * One physical copy of a Sample (PRD §3, AD-2). Availability, Holds, Loan Lines,
 * Condition and Cases attach here, never to the Sample.
 *
 * Its business identity is `(sample.reference_code, piece_number)` (AR-15). The
 * reference code is fixed once set (FR-1) and a piece number is never reused, so
 * the pair is stable for the piece's lifetime (FR-2).
 */
export interface SamplePiece {
  id: string;
  sampleId: string;
  pieceNumber: number;
  condition: Condition;
  /**
   * A removed piece leaves the catalogue but not the record: its Holds, Loan Lines
   * and Cases still point at it, and FR-33 shows its history. Never hard-deleted.
   */
  removedAt: string | null;
  removedBy: string | null;
  createdBy: string;
  createdAt: string;
}

/**
 * What keeps a piece in use, as reported by the module that owns it — a Hold by
 * `kits`, an open Loan Line by `lending` (AD-15). The fields are the ones the
 * conflict envelope needs to say *"held for Noor Studio, collecting Mon 20 Oct"*.
 */
export interface PieceCommitment {
  kind: 'hold' | 'loan';
  /** The Kit holding the piece, or the Loan it is out on. */
  id: string;
  label: string;
  /** Collection date for a Hold; due date for a Loan Line. */
  date?: IsoDate;
}

/** A guard against a mistyped count, not a business limit. */
export const MAX_PIECES_PER_ADD = 50;

export function requirePieceCount(count: unknown): number {
  if (typeof count !== 'number' || !Number.isInteger(count) || count < 1 || count > MAX_PIECES_PER_ADD) {
    throw new SampleError('VALIDATION', `Add between 1 and ${MAX_PIECES_PER_ADD} pieces at a time.`);
  }
  return count;
}

/** How the UI and every conflict message name a piece: `FB-2214 / 2`. */
export function pieceLabel(sample: Pick<Sample, 'referenceCode'>, piece: Pick<SamplePiece, 'pieceNumber'>): string {
  return `${sample.referenceCode} / ${piece.pieceNumber}`;
}

export function isRemoved(piece: SamplePiece): boolean {
  return piece.removedAt !== null;
}

/** In the catalogue and usable. Whether it is free on a given date is FR-4's question. */
export function isLendable(piece: SamplePiece): boolean {
  return !isRemoved(piece) && piece.condition === 'usable';
}

/**
 * FR-2: the next piece number for a Sample. Counted over every piece the Sample has
 * ever had, removed ones included, so a number is never handed out twice.
 */
export function nextPieceNumber(existing: readonly SamplePiece[]): number {
  return existing.reduce((max, piece) => Math.max(max, piece.pieceNumber), 0) + 1;
}

/**
 * FR-2: add `ids.length` new pieces to a Sample, numbered on from `firstNumber`.
 * A new piece is usable. A retired Sample takes no new pieces — it is no longer
 * lent, so a piece added to it could never go out.
 */
export function draftPieces(
  sample: Sample,
  firstNumber: number,
  ids: readonly string[],
  by: Principal,
  now: Date,
): SamplePiece[] {
  requireManager(by, 'add a Sample Piece');

  requirePieceCount(ids.length);
  if (isRetired(sample)) {
    throw new SampleError('SAMPLE_RETIRED', `${sample.referenceCode} is retired and takes no new pieces.`, {
      entity: 'sample',
      id: sample.id,
      label: sample.referenceCode,
      date: sample.retiredAt ?? undefined,
    });
  }

  const at = now.toISOString();
  return ids.map((id, i) => ({
    id,
    sampleId: sample.id,
    pieceNumber: firstNumber + i,
    condition: 'usable',
    removedAt: null,
    removedBy: null,
    createdBy: by.userId,
    createdAt: at,
  }));
}

/**
 * FR-2: remove a piece from the catalogue. Refused while the piece is on Loan or
 * held, naming the Loan or Kit that blocks it. Removing the last usable piece is
 * allowed; the Sample stays and simply has nothing to lend.
 */
export function removePiece(
  piece: SamplePiece,
  sample: Sample,
  commitment: PieceCommitment | null,
  by: Principal,
  now: Date,
): SamplePiece {
  requireManager(by, 'remove a Sample Piece');

  const label = pieceLabel(sample, piece);
  if (isRemoved(piece)) {
    throw new SampleError('SAMPLE_PIECE_ALREADY_REMOVED', `${label} has already been removed.`, {
      entity: 'sample_piece',
      id: piece.id,
      label,
      date: piece.removedAt ?? undefined,
    });
  }
  if (commitment?.kind === 'loan') {
    throw new SampleError('SAMPLE_PIECE_ON_LOAN', `${label} is out on Loan ${commitment.label} and cannot be removed.`, {
      entity: 'loan',
      id: commitment.id,
      label: commitment.label,
      date: commitment.date,
    });
  }
  if (commitment?.kind === 'hold') {
    throw new SampleError('SAMPLE_PIECE_HELD', `${label} is held for Kit ${commitment.label} and cannot be removed.`, {
      entity: 'kit',
      id: commitment.id,
      label: commitment.label,
      date: commitment.date,
    });
  }

  return { ...piece, removedAt: now.toISOString(), removedBy: by.userId };
}

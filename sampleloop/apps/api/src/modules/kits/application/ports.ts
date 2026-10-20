import type { IsoDate } from '../../../shared/clock/showroom-clock.ts';
import type { Hold, SamplePiece } from '../domain/hold.ts';
import type { Kit, Principal } from '../domain/kit.ts';
import { KitError } from '../domain/kit-error.ts';

/**
 * Studio scoping lives in the data-access layer (AD-6): every repository method
 * touching Studio-owned data takes a required scope that cannot be defaulted.
 */
export type StudioScope = { kind: 'all' } | { kind: 'studio'; studioId: string };

export function scopeFor(principal: Principal): StudioScope {
  if (principal.role !== 'designer') return { kind: 'all' };
  if (!principal.studioId) throw new KitError('FORBIDDEN', 'Designer has no Studio.');
  return { kind: 'studio', studioId: principal.studioId };
}

export function inScope(kit: Kit, scope: StudioScope): boolean {
  return scope.kind === 'all' || kit.studioId === scope.studioId;
}

export interface KitRepository {
  insert(kit: Kit, scope: StudioScope): Promise<void>;
  findById(id: string, scope: StudioScope): Promise<Kit | null>;
  update(kit: Kit, scope: StudioScope): Promise<void>;
}

/**
 * Holds are reached only through their Kit, so Studio scoping is applied when the
 * Kit is loaded. `insert` must refuse a second active Hold on a piece with
 * HOLD_CONFLICT, as the partial unique index does (AD-4).
 */
export interface HoldRepository {
  insert(hold: Hold): Promise<void>;
  activeForPiece(samplePieceId: string): Promise<Hold | null>;
  activeForKit(kitId: string): Promise<Hold[]>;
  release(holdId: string, release: Required<Pick<Hold, 'releasedAt' | 'releasedBy' | 'releaseReason'>>): Promise<void>;
}

export interface KitTransaction {
  kits: KitRepository;
  holds: HoldRepository;
}

/**
 * Contended writes run as one transaction (AD-5). The SQL adapter takes
 * SELECT ... FOR UPDATE on candidate sample_piece rows in ascending id order;
 * on any throw nothing is committed.
 */
export interface Transactor {
  run<T>(work: (tx: KitTransaction) => Promise<T>): Promise<T>;
}

/** Catalogue-owned data the kits module reads (AD-1: through a port, not its tables). */
export interface PieceCatalogue {
  piecesOf(sampleId: string): Promise<SamplePiece[]>;
}

/** FR-5 alternatives: at most five Sample ids with a piece available on the date. */
export interface AlternativeSuggester {
  suggest(sampleId: string, date: IsoDate): Promise<string[]>;
}

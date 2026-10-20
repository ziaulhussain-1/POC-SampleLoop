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
}

import { isRetired } from '../domain/sample.ts';
import type { Principal, Sample } from '../domain/sample.ts';

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

import { addDays, isIsoDate } from '../../../shared/clock/showroom-clock.ts';
import type { IsoDate } from '../../../shared/clock/showroom-clock.ts';
import { KitError } from './kit-error.ts';

/** Kit lifecycle (PRD §4.2). A Designer's Kit arrives as `requested`; Staff reserve it. */
export type KitState = 'requested' | 'reserved' | 'collected' | 'cancelled';

export type Role = 'designer' | 'staff' | 'manager';

/** The one principal shape the auth guard resolves (spine §Auth). */
export interface Principal {
  userId: string;
  role: Role;
  studioId?: string;
}

export interface KitLine {
  sampleId: string;
}

export interface Kit {
  id: string;
  studioId: string;
  clientProject: string;
  collectionDate: IsoDate;
  expectedReturnDate: IsoDate;
  state: KitState;
  lines: KitLine[];
  createdBy: string;
  createdAt: string;
}

export interface NewKit {
  studioId: string;
  clientProject: string;
  collectionDate: IsoDate;
  expectedReturnDate?: IsoDate;
  sampleIds: string[];
}

/** FR-6: the expected return date defaults to the collection date plus 7 days. */
export const DEFAULT_LOAN_DAYS = 7;

/** FR-6: validate a new Kit request and build it in the `requested` state. */
export function draftKit(input: NewKit, by: Principal, today: IsoDate, id: string, now: Date): Kit {
  if (by.role === 'manager') {
    throw new KitError('FORBIDDEN', 'Only a Designer or Staff can create a Kit.');
  }
  if (by.role === 'designer' && by.studioId !== input.studioId) {
    throw new KitError('FORBIDDEN', 'A Designer can only create a Kit for their own Studio.');
  }

  const clientProject = input.clientProject?.trim() ?? '';
  if (!clientProject) throw new KitError('VALIDATION', 'A Kit needs a Client Project.');

  if (!isIsoDate(input.collectionDate)) {
    throw new KitError('VALIDATION', 'Collection date must be a valid date.');
  }
  if (input.collectionDate < today) {
    throw new KitError('COLLECTION_DATE_IN_PAST', 'Collection date cannot be in the past.');
  }

  const expectedReturnDate = input.expectedReturnDate ?? addDays(input.collectionDate, DEFAULT_LOAN_DAYS);
  if (!isIsoDate(expectedReturnDate)) {
    throw new KitError('VALIDATION', 'Expected return date must be a valid date.');
  }
  if (expectedReturnDate < input.collectionDate) {
    throw new KitError('RETURN_BEFORE_COLLECTION', 'Expected return date cannot be before the collection date.');
  }

  const sampleIds = input.sampleIds ?? [];
  if (sampleIds.length === 0) throw new KitError('KIT_EMPTY', 'Add at least one Sample to the Kit.');
  if (new Set(sampleIds).size !== sampleIds.length) {
    throw new KitError('DUPLICATE_SAMPLE', 'Each Sample can appear in a Kit only once.');
  }

  return {
    id,
    studioId: input.studioId,
    clientProject,
    collectionDate: input.collectionDate,
    expectedReturnDate,
    state: 'requested',
    lines: sampleIds.map((sampleId) => ({ sampleId })),
    createdBy: by.userId,
    createdAt: now.toISOString(),
  };
}

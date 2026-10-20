import type { PhotoKey } from '../../../shared/ports/photo-store.ts';
import { SampleError } from './sample-error.ts';

export type Role = 'designer' | 'staff' | 'manager';

/** The one principal shape the auth guard resolves (spine §Auth). */
export interface Principal {
  userId: string;
  role: Role;
  studioId?: string;
}

/**
 * A Sample is a *design*, not a physical object (PRD §3, AD-2). It carries no
 * count, no quantity and no availability column — those belong to Sample Piece
 * (FR-2) and are computed, never stored (AD-11).
 */
export interface Sample {
  id: string;
  referenceCode: string;
  name: string;
  material: string;
  supplier: string;
  colour: string;
  description: string;
  /** Key into the PhotoStore (AD-9); the image itself never enters PostgreSQL. */
  photoKey: PhotoKey | null;
  retiredAt: string | null;
  retiredBy: string | null;
  createdBy: string;
  createdAt: string;
  updatedBy: string;
  updatedAt: string;
}

export interface NewSample {
  referenceCode: string;
  name: string;
  material: string;
  supplier: string;
  colour: string;
  description?: string;
  photoKey?: PhotoKey | null;
}

/**
 * The fields an edit may move. `referenceCode` is deliberately absent: a Sample
 * Piece's business identity is `(sample.reference_code, piece_number)` and FR-2
 * requires it to be stable for the piece's lifetime (AR-15), so the code is set
 * once at creation.
 */
export interface SampleEdit {
  name?: string;
  material?: string;
  supplier?: string;
  colour?: string;
  description?: string;
  photoKey?: PhotoKey | null;
  /** Accepted only when unchanged, so a client that round-trips the whole Sample still works. */
  referenceCode?: string;
}

/** Catalogue maintenance is the Manager's (FR-1, FR-37). Staff read every field and write none. */
function requireManager(by: Principal, action: string): void {
  if (by.role !== 'manager') {
    throw new SampleError('FORBIDDEN', `Only a Manager can ${action} a Sample.`);
  }
}

/**
 * Reference codes are compared case-insensitively, matching the case-insensitive
 * search FR-3 promises. The database carries the same rule as a unique index on
 * `upper(reference_code)`.
 */
export function normaliseReferenceCode(code: string): string {
  return code.trim().toUpperCase();
}

function required(value: unknown, field: string): string {
  const text = typeof value === 'string' ? value.trim() : '';
  if (!text) throw new SampleError('VALIDATION', `${field} is required.`);
  return text;
}

const REFERENCE_CODE = /^[A-Za-z0-9][A-Za-z0-9-]{1,31}$/;

/** FR-1: validate a new Sample and build it. Uniqueness is the repository's to enforce. */
export function draftSample(input: NewSample, by: Principal, id: string, now: Date): Sample {
  requireManager(by, 'create');

  const referenceCode = required(input.referenceCode, 'Reference code');
  if (!REFERENCE_CODE.test(referenceCode)) {
    throw new SampleError(
      'VALIDATION',
      'Reference code must be 2–32 characters of letters, digits or hyphens.',
    );
  }

  const at = now.toISOString();
  return {
    id,
    referenceCode,
    name: required(input.name, 'Name'),
    material: required(input.material, 'Material'),
    supplier: required(input.supplier, 'Supplier'),
    colour: required(input.colour, 'Colour'),
    description: input.description?.trim() ?? '',
    photoKey: input.photoKey ?? null,
    retiredAt: null,
    retiredBy: null,
    createdBy: by.userId,
    createdAt: at,
    updatedBy: by.userId,
    updatedAt: at,
  };
}

/**
 * FR-1: apply an edit to an existing Sample, returning a new Sample rather than
 * mutating the one given. A retired Sample stays editable — the showroom still
 * has to be able to correct a supplier on something it no longer lends.
 */
export function applySampleEdit(sample: Sample, edit: SampleEdit, by: Principal, now: Date): Sample {
  requireManager(by, 'edit');

  if (
    edit.referenceCode !== undefined &&
    normaliseReferenceCode(edit.referenceCode) !== normaliseReferenceCode(sample.referenceCode)
  ) {
    throw new SampleError(
      'REFERENCE_CODE_IMMUTABLE',
      'A Sample\'s reference code is fixed once set, because its Sample Pieces are identified by it.',
    );
  }

  return {
    ...sample,
    name: edit.name === undefined ? sample.name : required(edit.name, 'Name'),
    material: edit.material === undefined ? sample.material : required(edit.material, 'Material'),
    supplier: edit.supplier === undefined ? sample.supplier : required(edit.supplier, 'Supplier'),
    colour: edit.colour === undefined ? sample.colour : required(edit.colour, 'Colour'),
    description: edit.description === undefined ? sample.description : edit.description.trim(),
    photoKey: edit.photoKey === undefined ? sample.photoKey : edit.photoKey,
    updatedBy: by.userId,
    updatedAt: now.toISOString(),
  };
}

/**
 * FR-1: retire a Sample. Retiring is allowed while pieces are out on Loan — those
 * Loan Lines stay open and chaseable, which is why nothing here consults `lending`
 * (AD-1, AD-15). Retirement hides the Sample from Designers, never from history.
 */
export function retireSample(sample: Sample, by: Principal, now: Date): Sample {
  requireManager(by, 'retire');
  if (sample.retiredAt) {
    throw new SampleError('SAMPLE_ALREADY_RETIRED', `${sample.referenceCode} is already retired.`, {
      entity: 'sample',
      id: sample.id,
      label: sample.referenceCode,
      date: sample.retiredAt,
    });
  }

  const at = now.toISOString();
  return { ...sample, retiredAt: at, retiredBy: by.userId, updatedBy: by.userId, updatedAt: at };
}

export function isRetired(sample: Sample): boolean {
  return sample.retiredAt !== null;
}

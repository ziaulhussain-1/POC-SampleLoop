/**
 * Closed enumeration of catalogue error codes (AR-14). The HTTP layer maps a
 * SampleError onto the shared envelope `{ code, message, conflict? }`.
 */
export type SampleErrorCode =
  | 'FORBIDDEN'
  | 'VALIDATION'
  | 'SAMPLE_NOT_FOUND'
  | 'REFERENCE_CODE_TAKEN'
  | 'REFERENCE_CODE_IMMUTABLE'
  | 'SAMPLE_ALREADY_RETIRED'
  | 'SAMPLE_RETIRED'
  | 'SAMPLE_PIECE_NOT_FOUND'
  | 'SAMPLE_PIECE_ALREADY_REMOVED'
  | 'SAMPLE_PIECE_ON_LOAN'
  | 'SAMPLE_PIECE_HELD';

export interface Conflict {
  entity: string;
  id: string;
  label: string;
  date?: string;
}

export class SampleError extends Error {
  readonly code: SampleErrorCode;
  readonly conflict?: Conflict;

  constructor(code: SampleErrorCode, message: string, conflict?: Conflict) {
    super(message);
    this.name = 'SampleError';
    this.code = code;
    this.conflict = conflict;
  }
}

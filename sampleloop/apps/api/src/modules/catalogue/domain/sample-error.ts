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
  | 'SAMPLE_ALREADY_RETIRED';

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

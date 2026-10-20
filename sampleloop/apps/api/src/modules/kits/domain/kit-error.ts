/**
 * Closed enumeration of Kit error codes (AR-14). The HTTP layer maps a KitError
 * onto the shared envelope `{ code, message, conflict? }`.
 */
export type KitErrorCode =
  | 'FORBIDDEN'
  | 'VALIDATION'
  | 'KIT_EMPTY'
  | 'DUPLICATE_SAMPLE'
  | 'COLLECTION_DATE_IN_PAST'
  | 'RETURN_BEFORE_COLLECTION'
  | 'KIT_NOT_FOUND';

export interface Conflict {
  entity: string;
  id: string;
  label: string;
  date?: string;
}

export class KitError extends Error {
  readonly code: KitErrorCode;
  readonly conflict?: Conflict;

  constructor(code: KitErrorCode, message: string, conflict?: Conflict) {
    super(message);
    this.name = 'KitError';
    this.code = code;
    this.conflict = conflict;
  }
}

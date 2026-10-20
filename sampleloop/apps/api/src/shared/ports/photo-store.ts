/**
 * Photographs sit behind a port (AD-9): images never enter PostgreSQL, and a read
 * is a short-lived signed URL minted only after the owning record's authorisation
 * check passes. The provider is unselected (Technology Discussion, Pending), so the
 * adapter is chosen by configuration.
 *
 * FR-1 stores only the key a Sample's photograph lives under. Upload, signed reads
 * and the type/size caps arrive with FR-17, which is what first needs them.
 */

/** Opaque handle to a stored image. The only thing a database row ever holds. */
export type PhotoKey = string;

export interface PhotoStore {
  put(bytes: Uint8Array, contentType: string): Promise<PhotoKey>;
  signedRead(key: PhotoKey): Promise<string>;
  delete(key: PhotoKey): Promise<void>;
}

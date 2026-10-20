import { nextPieceNumber } from '../domain/sample-piece.ts';
import type { PieceCommitment, SamplePiece } from '../domain/sample-piece.ts';
import { SampleError } from '../domain/sample-error.ts';
import type { PieceCommitments, SamplePieceRepository } from '../application/ports.ts';

/**
 * In-process SamplePieceRepository for tests and local runs. `append` numbers and
 * inserts in one synchronous step, which is what the SQL adapter's row lock buys,
 * and it refuses a duplicate `(sample_id, piece_number)` just as the unique index does.
 */
export class InMemorySamplePieceRepository implements SamplePieceRepository {
  readonly pieces = new Map<string, SamplePiece>();

  async append(sampleId: string, build: (firstNumber: number) => SamplePiece[]): Promise<SamplePiece[]> {
    const drafted = build(nextPieceNumber(this.#ofSample(sampleId)));
    const taken = new Set(this.#ofSample(sampleId).map((piece) => piece.pieceNumber));
    for (const piece of drafted) {
      if (piece.sampleId !== sampleId || taken.has(piece.pieceNumber)) {
        throw new SampleError('VALIDATION', `Piece number ${piece.pieceNumber} is already in use.`);
      }
      taken.add(piece.pieceNumber);
    }
    for (const piece of drafted) this.pieces.set(piece.id, structuredClone(piece));
    return structuredClone(drafted);
  }

  async update(piece: SamplePiece): Promise<void> {
    const stored = this.pieces.get(piece.id);
    if (!stored) throw new SampleError('SAMPLE_PIECE_NOT_FOUND', 'No such Sample Piece.');
    if (stored.sampleId !== piece.sampleId || stored.pieceNumber !== piece.pieceNumber) {
      throw new SampleError('VALIDATION', 'A Sample Piece keeps its identity for its lifetime.');
    }
    this.pieces.set(piece.id, structuredClone(piece));
  }

  async findById(id: string): Promise<SamplePiece | null> {
    const piece = this.pieces.get(id);
    return piece ? structuredClone(piece) : null;
  }

  async listBySample(sampleId: string): Promise<SamplePiece[]> {
    return structuredClone(this.#ofSample(sampleId));
  }

  #ofSample(sampleId: string): SamplePiece[] {
    return [...this.pieces.values()]
      .filter((piece) => piece.sampleId === sampleId)
      .sort((a, b) => a.pieceNumber - b.pieceNumber);
  }
}

/**
 * Stand-in for the adapter over `kits` and `lending`, neither of which can answer
 * yet. Tests place Holds and Loans on it directly.
 */
export class InMemoryPieceCommitments implements PieceCommitments {
  readonly byPiece = new Map<string, PieceCommitment>();

  async find(pieceId: string): Promise<PieceCommitment | null> {
    return this.byPiece.get(pieceId) ?? null;
  }
}

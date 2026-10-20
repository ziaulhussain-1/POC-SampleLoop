import type { Hold } from '../domain/hold.ts';
import { KitError } from '../domain/kit-error.ts';
import type { HoldRepository, KitTransaction, Transactor } from '../application/ports.ts';
import { InMemoryKitRepository } from './in-memory-kit-repository.ts';

/** In-process HoldRepository; refuses a second active Hold per piece like the partial unique index (AD-4). */
export class InMemoryHoldRepository implements HoldRepository {
  readonly holds = new Map<string, Hold>();

  async insert(hold: Hold): Promise<void> {
    const existing = await this.activeForPiece(hold.samplePieceId);
    if (existing) {
      throw new KitError('HOLD_CONFLICT', 'That Sample Piece is already held for another Kit.', {
        entity: 'kit',
        id: existing.kitId,
        label: existing.samplePieceId,
      });
    }
    this.holds.set(hold.id, structuredClone(hold));
  }

  async activeForPiece(samplePieceId: string): Promise<Hold | null> {
    for (const hold of this.holds.values()) {
      if (hold.samplePieceId === samplePieceId && !hold.releasedAt) return structuredClone(hold);
    }
    return null;
  }

  async activeForKit(kitId: string): Promise<Hold[]> {
    return [...this.holds.values()].filter((h) => h.kitId === kitId && !h.releasedAt).map((h) => structuredClone(h));
  }

  async release(holdId: string, release: Required<Pick<Hold, 'releasedAt' | 'releasedBy' | 'releaseReason'>>) {
    const hold = this.holds.get(holdId);
    if (hold && !hold.releasedAt) Object.assign(hold, release);
  }
}

function restore<V>(target: Map<string, V>, snapshot: Map<string, V>): void {
  target.clear();
  for (const [key, value] of snapshot) target.set(key, value);
}

/**
 * In-process Transactor (AD-5): transactions run one at a time and a throw rolls
 * back every write made inside it, so a partial reservation is never committed.
 */
export class InMemoryKitStore implements Transactor {
  readonly kits = new InMemoryKitRepository();
  readonly holds = new InMemoryHoldRepository();
  #tail: Promise<unknown> = Promise.resolve();

  run<T>(work: (tx: KitTransaction) => Promise<T>): Promise<T> {
    const result = this.#tail.then(async () => {
      const kits = structuredClone(this.kits.kits);
      const holds = structuredClone(this.holds.holds);
      try {
        return await work({ kits: this.kits, holds: this.holds });
      } catch (error) {
        restore(this.kits.kits, kits);
        restore(this.holds.holds, holds);
        throw error;
      }
    });
    this.#tail = result.catch(() => undefined);
    return result;
  }
}

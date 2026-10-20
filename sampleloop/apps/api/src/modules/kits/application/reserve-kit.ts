import type { Clock } from '../../../shared/clock/showroom-clock.ts';
import type { IdGenerator } from '../../../shared/ids/uuidv7.ts';
import { holdExpiresOn, pieceUsableOn } from '../domain/hold.ts';
import type { Hold } from '../domain/hold.ts';
import type { Kit, KitLine, Principal } from '../domain/kit.ts';
import { KitError } from '../domain/kit-error.ts';
import { scopeFor } from './ports.ts';
import type { AlternativeSuggester, PieceCatalogue, StudioScope, Transactor } from './ports.ts';

export interface Reservation {
  kit: Kit;
  holds: Hold[];
  /** Samples with no piece available, each with up to five alternatives (FR-5). */
  unfulfilled: { sampleId: string; alternatives: string[] }[];
}

/** FR-7: Staff reserve a Kit, placing a Hold on one Sample Piece per requested Sample. */
export class ReserveKit {
  #tx: Transactor;
  #pieces: PieceCatalogue;
  #alternatives: AlternativeSuggester;
  #clock: Clock;
  #ids: IdGenerator;

  constructor(deps: {
    tx: Transactor;
    pieces: PieceCatalogue;
    alternatives: AlternativeSuggester;
    clock: Clock;
    ids: IdGenerator;
  }) {
    this.#tx = deps.tx;
    this.#pieces = deps.pieces;
    this.#alternatives = deps.alternatives;
    this.#clock = deps.clock;
    this.#ids = deps.ids;
  }

  async execute(principal: Principal, kitId: string): Promise<Reservation> {
    if (principal.role !== 'staff') throw new KitError('FORBIDDEN', 'Only Staff can reserve a Kit.');
    const scope = scopeFor(principal);
    try {
      return await this.#attempt(principal, kitId, scope);
    } catch (error) {
      // AD-5: a unique violation rolls the whole transaction back; retry once, then surface the conflict.
      if (error instanceof KitError && error.code === 'HOLD_CONFLICT') return this.#attempt(principal, kitId, scope);
      throw error;
    }
  }

  #attempt(principal: Principal, kitId: string, scope: StudioScope): Promise<Reservation> {
    return this.#tx.run(async ({ kits, holds }) => {
      const kit = await kits.findById(kitId, scope);
      if (!kit) throw new KitError('KIT_NOT_FOUND', 'Kit not found.');
      if (kit.state !== 'requested') {
        throw new KitError('KIT_NOT_RESERVABLE', `A ${kit.state} Kit cannot be reserved.`);
      }

      const createdAt = this.#clock.now().toISOString();
      const placed: Hold[] = [];
      const lines: KitLine[] = [];
      const unfulfilled: Reservation['unfulfilled'] = [];

      for (const line of kit.lines) {
        const candidates = (await this.#pieces.piecesOf(line.sampleId))
          .filter((piece) => pieceUsableOn(piece, kit.collectionDate))
          .sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));

        let chosen: string | undefined;
        for (const piece of candidates) {
          if (!(await holds.activeForPiece(piece.id))) {
            chosen = piece.id;
            break;
          }
        }

        if (!chosen) {
          lines.push({ sampleId: line.sampleId, unfulfilled: true });
          unfulfilled.push({
            sampleId: line.sampleId,
            alternatives: (await this.#alternatives.suggest(line.sampleId, kit.collectionDate)).slice(0, 5),
          });
          continue;
        }

        const hold: Hold = {
          id: this.#ids.newId(),
          kitId: kit.id,
          sampleId: line.sampleId,
          samplePieceId: chosen,
          expiresOn: holdExpiresOn(kit.collectionDate),
          createdBy: principal.userId,
          createdAt,
        };
        await holds.insert(hold);
        placed.push(hold);
        lines.push({ sampleId: line.sampleId, samplePieceId: chosen });
      }

      if (placed.length === 0) {
        throw new KitError('NO_PIECE_AVAILABLE', 'No Sample in this Kit has a piece available on the collection date.');
      }

      const reserved: Kit = { ...kit, state: 'reserved', lines };
      await kits.update(reserved, scope);
      return { kit: reserved, holds: placed, unfulfilled };
    });
  }
}

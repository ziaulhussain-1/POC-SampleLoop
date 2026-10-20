import { showroomToday } from '../../../shared/clock/showroom-clock.ts';
import type { Clock } from '../../../shared/clock/showroom-clock.ts';
import type { IdGenerator } from '../../../shared/ids/uuidv7.ts';
import { draftKit } from '../domain/kit.ts';
import type { Kit, NewKit, Principal } from '../domain/kit.ts';
import { KitError } from '../domain/kit-error.ts';
import { scopeFor } from './ports.ts';
import type { KitRepository } from './ports.ts';

/** FR-6: Designer or Staff creates a Kit. */
export class CreateKit {
  #kits: KitRepository;
  #clock: Clock;
  #ids: IdGenerator;

  constructor(deps: { kits: KitRepository; clock: Clock; ids: IdGenerator }) {
    this.#kits = deps.kits;
    this.#clock = deps.clock;
    this.#ids = deps.ids;
  }

  async execute(principal: Principal, input: NewKit): Promise<Kit> {
    const kit = draftKit(input, principal, showroomToday(this.#clock), this.#ids.newId(), this.#clock.now());
    const scope = scopeFor(principal);
    if (scope.kind === 'studio' && scope.studioId !== kit.studioId) {
      throw new KitError('FORBIDDEN', 'A Designer can only create a Kit for their own Studio.');
    }
    await this.#kits.insert(kit, scope);
    return kit;
  }
}

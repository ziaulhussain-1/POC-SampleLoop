import type { Kit } from '../domain/kit.ts';
import { KitError } from '../domain/kit-error.ts';
import { inScope } from '../application/ports.ts';
import type { KitRepository, StudioScope } from '../application/ports.ts';

/** In-process KitRepository for tests and local runs; honours StudioScope like the SQL adapter must. */
export class InMemoryKitRepository implements KitRepository {
  readonly kits = new Map<string, Kit>();

  async insert(kit: Kit, scope: StudioScope): Promise<void> {
    if (!inScope(kit, scope)) throw new KitError('FORBIDDEN', 'Kit is outside the caller\'s Studio.');
    this.kits.set(kit.id, structuredClone(kit));
  }

  async findById(id: string, scope: StudioScope): Promise<Kit | null> {
    const kit = this.kits.get(id);
    return kit && inScope(kit, scope) ? structuredClone(kit) : null;
  }

  async update(kit: Kit, scope: StudioScope): Promise<void> {
    const existing = this.kits.get(kit.id);
    if (!existing || !inScope(existing, scope)) throw new KitError('KIT_NOT_FOUND', 'Kit not found.');
    this.kits.set(kit.id, structuredClone(kit));
  }
}

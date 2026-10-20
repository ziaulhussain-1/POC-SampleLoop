import type { Clock } from '../../shared/clock/showroom-clock.ts';
import type { IdGenerator } from '../../shared/ids/uuidv7.ts';
import type { Principal } from './domain/kit.ts';

/** 20 Oct 2026, 10:00 in Karachi. */
export const fixedClock = (iso = '2026-10-20T10:00:00+05:00'): Clock => ({ now: () => new Date(iso) });

export function sequentialIds(prefix = 'id'): IdGenerator {
  let n = 0;
  return { newId: () => `${prefix}-${++n}` };
}

export const staff: Principal = { userId: 'u-staff', role: 'staff' };
export const manager: Principal = { userId: 'u-manager', role: 'manager' };
export const designerA: Principal = { userId: 'u-des-a', role: 'designer', studioId: 'studio-a' };
export const designerB: Principal = { userId: 'u-des-b', role: 'designer', studioId: 'studio-b' };

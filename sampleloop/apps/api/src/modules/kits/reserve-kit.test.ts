import { test } from 'node:test';
import assert from 'node:assert/strict';
import type { SamplePiece } from './domain/hold.ts';
import type { Kit } from './domain/kit.ts';
import { ReserveKit } from './application/reserve-kit.ts';
import { InMemoryKitStore } from './infrastructure/in-memory-kit-store.ts';
import { designerA, fixedClock, manager, sequentialIds, staff } from './test-support.ts';

const kitFor = (id: string, sampleIds: string[], overrides: Partial<Kit> = {}): Kit => ({
  id,
  studioId: 'studio-a',
  clientProject: 'Gulberg Residence',
  collectionDate: '2026-10-22',
  expectedReturnDate: '2026-10-29',
  state: 'requested',
  lines: sampleIds.map((sampleId) => ({ sampleId })),
  createdBy: designerA.userId,
  createdAt: '2026-10-20T05:00:00.000Z',
  ...overrides,
});

const piece = (id: string, sampleId: string, extra: Partial<SamplePiece> = {}): SamplePiece => ({
  id,
  sampleId,
  usable: true,
  ...extra,
});

function setup(catalogue: SamplePiece[], ...kits: Kit[]) {
  const store = new InMemoryKitStore();
  for (const kit of kits) store.kits.kits.set(kit.id, kit);
  const reserveKit = new ReserveKit({
    tx: store,
    pieces: { piecesOf: async (sampleId) => catalogue.filter((p) => p.sampleId === sampleId) },
    alternatives: { suggest: async (sampleId) => [`${sampleId}-alt-1`, `${sampleId}-alt-2`] },
    clock: fixedClock(),
    ids: sequentialIds('hold'),
  });
  return { store, reserveKit };
}

test('FR-7: reserving holds one usable piece per Sample and names the pieces', async () => {
  const { store, reserveKit } = setup(
    [piece('p-1b', 's-1'), piece('p-1a', 's-1', { usable: false }), piece('p-2a', 's-2')],
    kitFor('k-1', ['s-1', 's-2']),
  );
  const { kit, holds, unfulfilled } = await reserveKit.execute(staff, 'k-1');
  assert.equal(kit.state, 'reserved');
  assert.deepEqual(kit.lines, [
    { sampleId: 's-1', samplePieceId: 'p-1b' },
    { sampleId: 's-2', samplePieceId: 'p-2a' },
  ]);
  assert.equal(holds.length, 2);
  assert.equal(holds[0].expiresOn, '2026-10-23');
  assert.deepEqual(unfulfilled, []);
  assert.equal(store.kits.kits.get('k-1')?.state, 'reserved');
});

test('FR-7: a held piece is excluded for every other Kit; the Sample is unfulfilled with alternatives', async () => {
  const { reserveKit } = setup([piece('p-1a', 's-1'), piece('p-2a', 's-2')], kitFor('k-1', ['s-1']), kitFor('k-2', ['s-1', 's-2']));
  await reserveKit.execute(staff, 'k-1');
  const { kit, unfulfilled } = await reserveKit.execute(staff, 'k-2');
  assert.equal(kit.state, 'reserved');
  assert.deepEqual(kit.lines, [
    { sampleId: 's-1', unfulfilled: true },
    { sampleId: 's-2', samplePieceId: 'p-2a' },
  ]);
  assert.deepEqual(unfulfilled, [{ sampleId: 's-1', alternatives: ['s-1-alt-1', 's-1-alt-2'] }]);
});

test('FR-7: a piece on loan past the collection date is not held', async () => {
  const { reserveKit } = setup(
    [piece('p-1a', 's-1', { onLoanUntil: '2026-10-25' }), piece('p-1b', 's-1', { onLoanUntil: '2026-10-22' })],
    kitFor('k-1', ['s-1']),
  );
  const { kit } = await reserveKit.execute(staff, 'k-1');
  assert.equal(kit.lines[0].samplePieceId, 'p-1b');
});

test('FR-7: two Staff competing for the last piece cannot both get it', async () => {
  const { store, reserveKit } = setup([piece('p-1a', 's-1'), piece('p-2a', 's-2')], kitFor('k-1', ['s-1', 's-2']), kitFor('k-2', ['s-1']));
  const results = await Promise.allSettled([reserveKit.execute(staff, 'k-1'), reserveKit.execute(staff, 'k-2')]);
  const holders = [...store.holds.holds.values()].filter((h) => h.samplePieceId === 'p-1a' && !h.releasedAt);
  assert.equal(holders.length, 1);
  assert.equal(results[0].status, 'fulfilled');
  assert.equal(results[1].status, 'rejected');
  assert.equal((results[1] as PromiseRejectedResult).reason.code, 'NO_PIECE_AVAILABLE');
  assert.equal(store.kits.kits.get('k-2')?.state, 'requested');
});

test('FR-7: nothing available leaves the Kit requested and places no Hold', async () => {
  const { store, reserveKit } = setup([piece('p-1a', 's-1', { usable: false })], kitFor('k-1', ['s-1']));
  await assert.rejects(reserveKit.execute(staff, 'k-1'), { code: 'NO_PIECE_AVAILABLE' });
  assert.equal(store.kits.kits.get('k-1')?.state, 'requested');
  assert.equal(store.holds.holds.size, 0);
});

test('FR-7: a failure mid-reservation commits nothing (AD-5)', async () => {
  const { store, reserveKit } = setup([piece('p-1a', 's-1'), piece('p-2a', 's-2')], kitFor('k-1', ['s-1', 's-2']));
  const insert = store.holds.insert.bind(store.holds);
  let calls = 0;
  store.holds.insert = async (hold) => {
    if (++calls === 2) throw new Error('connection lost');
    return insert(hold);
  };
  await assert.rejects(reserveKit.execute(staff, 'k-1'), /connection lost/);
  assert.equal(store.holds.holds.size, 0);
  assert.equal(store.kits.kits.get('k-1')?.state, 'requested');
});

test('FR-7: only Staff reserve, only a requested Kit, only a Kit that exists', async () => {
  const { reserveKit } = setup([piece('p-1a', 's-1')], kitFor('k-1', ['s-1']), kitFor('k-2', ['s-1'], { state: 'cancelled' }));
  await assert.rejects(reserveKit.execute(designerA, 'k-1'), { code: 'FORBIDDEN' });
  await assert.rejects(reserveKit.execute(manager, 'k-1'), { code: 'FORBIDDEN' });
  await assert.rejects(reserveKit.execute(staff, 'k-2'), { code: 'KIT_NOT_RESERVABLE' });
  await assert.rejects(reserveKit.execute(staff, 'nope'), { code: 'KIT_NOT_FOUND' });
});

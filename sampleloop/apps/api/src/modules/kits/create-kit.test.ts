import { test } from 'node:test';
import assert from 'node:assert/strict';
import { showroomToday } from '../../shared/clock/showroom-clock.ts';
import { CreateKit } from './application/create-kit.ts';
import { InMemoryKitRepository } from './infrastructure/in-memory-kit-repository.ts';
import { designerA, fixedClock, manager, sequentialIds, staff } from './test-support.ts';

const setup = () => {
  const kits = new InMemoryKitRepository();
  return { kits, createKit: new CreateKit({ kits, clock: fixedClock(), ids: sequentialIds('kit') }) };
};

const request = {
  studioId: 'studio-a',
  clientProject: 'Gulberg Residence',
  collectionDate: '2026-10-22',
  sampleIds: ['s-1', 's-2'],
};

test('FR-6: Designer creates a requested Kit for their own Studio', async () => {
  const { kits, createKit } = setup();
  const kit = await createKit.execute(designerA, request);
  assert.equal(kit.state, 'requested');
  assert.deepEqual(kit.lines, [{ sampleId: 's-1' }, { sampleId: 's-2' }]);
  assert.equal(kit.createdBy, designerA.userId);
  assert.ok(kits.kits.has(kit.id));
});

test('FR-6: expected return defaults to collection date + 7 days', async () => {
  const { createKit } = setup();
  const kit = await createKit.execute(staff, request);
  assert.equal(kit.expectedReturnDate, '2026-10-29');
});

test('FR-6: expected return date can be overridden', async () => {
  const { createKit } = setup();
  const kit = await createKit.execute(staff, { ...request, expectedReturnDate: '2026-11-05' });
  assert.equal(kit.expectedReturnDate, '2026-11-05');
});

test('FR-6: collection today is allowed, yesterday is not', async () => {
  const { createKit } = setup();
  await createKit.execute(staff, { ...request, collectionDate: '2026-10-20' });
  await assert.rejects(createKit.execute(staff, { ...request, collectionDate: '2026-10-19' }), {
    code: 'COLLECTION_DATE_IN_PAST',
  });
});

test('FR-6: expected return cannot precede collection', async () => {
  const { createKit } = setup();
  await assert.rejects(createKit.execute(staff, { ...request, expectedReturnDate: '2026-10-21' }), {
    code: 'RETURN_BEFORE_COLLECTION',
  });
});

test('FR-6: a Kit with no Samples cannot be submitted', async () => {
  const { createKit } = setup();
  await assert.rejects(createKit.execute(staff, { ...request, sampleIds: [] }), { code: 'KIT_EMPTY' });
});

test('FR-6: a Sample cannot appear twice', async () => {
  const { createKit } = setup();
  await assert.rejects(createKit.execute(staff, { ...request, sampleIds: ['s-1', 's-1'] }), {
    code: 'DUPLICATE_SAMPLE',
  });
});

test('FR-6: Designer cannot create a Kit for another Studio', async () => {
  const { kits, createKit } = setup();
  await assert.rejects(createKit.execute(designerA, { ...request, studioId: 'studio-b' }), { code: 'FORBIDDEN' });
  assert.equal(kits.kits.size, 0);
});

test('FR-6: Manager cannot create a Kit; Client Project is required', async () => {
  const { createKit } = setup();
  await assert.rejects(createKit.execute(manager, request), { code: 'FORBIDDEN' });
  await assert.rejects(createKit.execute(staff, { ...request, clientProject: '  ' }), { code: 'VALIDATION' });
  await assert.rejects(createKit.execute(staff, { ...request, collectionDate: '2026-02-30' }), { code: 'VALIDATION' });
});

test('AD-8: today resolves in Asia/Karachi, not server time', () => {
  // 20:30 UTC on 20 Oct is already 21 Oct in Karachi (UTC+5).
  assert.equal(showroomToday(fixedClock('2026-10-20T20:30:00Z')), '2026-10-21');
  assert.equal(showroomToday(fixedClock('2026-10-20T18:59:59Z')), '2026-10-20');
});

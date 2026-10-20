import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CreateSample, EditSample, GetSample, RetireSample } from './application/maintain-sample.ts';
import { InMemorySampleRepository } from './infrastructure/in-memory-sample-repository.ts';
import { designerA, fixedClock, manager, sequentialIds, staff, velvet } from './test-support.ts';

const setup = (clock = fixedClock()) => {
  const samples = new InMemorySampleRepository();
  return {
    samples,
    createSample: new CreateSample({ samples, clock, ids: sequentialIds('sample') }),
    editSample: new EditSample({ samples, clock }),
    retireSample: new RetireSample({ samples, clock }),
    getSample: new GetSample({ samples }),
  };
};

test('FR-1: Manager creates a Sample with every catalogue field', async () => {
  const { samples, createSample } = setup();
  const sample = await createSample.execute(manager, { ...velvet, photoKey: 'photos/fb-2214.jpg' });

  assert.equal(sample.referenceCode, 'FB-2214');
  assert.equal(sample.material, 'Fabric');
  assert.equal(sample.supplier, 'Karachi Textiles');
  assert.equal(sample.colour, 'Warm neutral');
  assert.equal(sample.description, 'Heavy pile upholstery velvet.');
  assert.equal(sample.photoKey, 'photos/fb-2214.jpg');
  assert.equal(sample.retiredAt, null);
  assert.equal(sample.createdBy, manager.userId);
  assert.ok(samples.samples.has(sample.id));
});

test('AD-2: a Sample carries no piece count, quantity or availability', async () => {
  const { createSample } = setup();
  const sample = await createSample.execute(manager, velvet);
  for (const forbidden of ['pieceCount', 'quantity', 'available', 'isAvailable', 'onLoan']) {
    assert.ok(!(forbidden in sample), `Sample must not carry ${forbidden} — it belongs to Sample Piece`);
  }
});

test('AD-9: a photograph is a PhotoStore key, defaulting to none', async () => {
  const { createSample } = setup();
  const sample = await createSample.execute(manager, velvet);
  assert.equal(sample.photoKey, null);
});

test('FR-1: a duplicate reference code is rejected and names the conflicting Sample', async () => {
  const { createSample } = setup();
  const first = await createSample.execute(manager, velvet);

  await assert.rejects(
    createSample.execute(manager, { ...velvet, name: 'Another velvet' }),
    (error: unknown) => {
      const e = error as { code: string; conflict?: { entity: string; id: string; label: string } };
      assert.equal(e.code, 'REFERENCE_CODE_TAKEN');
      assert.deepEqual(e.conflict, { entity: 'sample', id: first.id, label: 'FB-2214' });
      return true;
    },
  );
});

test('FR-1: reference codes collide case-insensitively, matching FR-3 search', async () => {
  const { createSample } = setup();
  await createSample.execute(manager, velvet);
  await assert.rejects(createSample.execute(manager, { ...velvet, referenceCode: 'fb-2214' }), {
    code: 'REFERENCE_CODE_TAKEN',
  });
});

test('FR-1: a retired code stays taken — uniqueness spans the whole catalogue', async () => {
  const { createSample, retireSample } = setup();
  const sample = await createSample.execute(manager, velvet);
  await retireSample.execute(manager, sample.id);

  await assert.rejects(createSample.execute(manager, velvet), { code: 'REFERENCE_CODE_TAKEN' });
});

test('FR-1: required fields are required and whitespace is trimmed', async () => {
  const { createSample } = setup();
  for (const blank of ['referenceCode', 'name', 'material', 'supplier', 'colour'] as const) {
    await assert.rejects(createSample.execute(manager, { ...velvet, [blank]: '   ' }), {
      code: 'VALIDATION',
    });
  }
  const sample = await createSample.execute(manager, { ...velvet, referenceCode: '  FB-2214  ' });
  assert.equal(sample.referenceCode, 'FB-2214');
});

test('FR-1: Manager edits a Sample and the edit is attributed', async () => {
  const { editSample, createSample } = setup();
  const sample = await createSample.execute(manager, velvet);

  const edited = await editSample.execute({ userId: 'u-farah', role: 'manager' }, sample.id, {
    supplier: 'Lahore Looms',
    description: '  Reissued 2026.  ',
    photoKey: null,
  });

  assert.equal(edited.supplier, 'Lahore Looms');
  assert.equal(edited.description, 'Reissued 2026.');
  assert.equal(edited.photoKey, null);
  assert.equal(edited.material, velvet.material, 'fields left out of the edit are untouched');
  assert.equal(edited.updatedBy, 'u-farah');
  assert.equal(edited.createdBy, manager.userId, 'creation attribution survives an edit');
});

test('FR-1: a reference code cannot be edited, because Sample Pieces are named by it', async () => {
  const { createSample, editSample } = setup();
  const sample = await createSample.execute(manager, velvet);

  await assert.rejects(editSample.execute(manager, sample.id, { referenceCode: 'FB-9999' }), {
    code: 'REFERENCE_CODE_IMMUTABLE',
  });

  const unchanged = await editSample.execute(manager, sample.id, { referenceCode: 'fb-2214', colour: 'Oat' });
  assert.equal(unchanged.colour, 'Oat', 'an unchanged code round-tripped by the client is accepted');
});

test('FR-1: retiring records who retired it and when', async () => {
  const { createSample, retireSample } = setup();
  const sample = await createSample.execute(manager, velvet);
  const retired = await retireSample.execute(manager, sample.id);

  assert.equal(retired.retiredBy, manager.userId);
  assert.equal(retired.retiredAt, '2026-10-20T05:00:00.000Z');
  await assert.rejects(retireSample.execute(manager, sample.id), { code: 'SAMPLE_ALREADY_RETIRED' });
});

test('FR-1: a retired Sample is hidden from a Designer and visible to Staff', async () => {
  const { createSample, retireSample, getSample } = setup();
  const sample = await createSample.execute(manager, velvet);

  assert.ok(await getSample.execute(designerA, sample.id), 'visible before retirement');

  await retireSample.execute(manager, sample.id);
  await assert.rejects(getSample.execute(designerA, sample.id), { code: 'SAMPLE_NOT_FOUND' });

  const staffView = await getSample.execute(staff, sample.id);
  assert.equal(staffView.referenceCode, 'FB-2214');
  assert.ok(staffView.retiredAt, 'Staff see the retirement, not a hidden row');
});

test('FR-1: Staff see every field but can create, edit or retire nothing', async () => {
  const { createSample, editSample, retireSample, getSample } = setup();
  const sample = await createSample.execute(manager, velvet);

  const staffView = await getSample.execute(staff, sample.id);
  assert.equal(staffView.supplier, 'Karachi Textiles');

  await assert.rejects(createSample.execute(staff, { ...velvet, referenceCode: 'FB-3000' }), {
    code: 'FORBIDDEN',
  });
  await assert.rejects(editSample.execute(staff, sample.id, { colour: 'Oat' }), { code: 'FORBIDDEN' });
  await assert.rejects(retireSample.execute(staff, sample.id), { code: 'FORBIDDEN' });
});

test('FR-1: a Designer can neither maintain the catalogue nor reach another role\'s writes', async () => {
  const { createSample, editSample, retireSample } = setup();
  const sample = await createSample.execute(manager, velvet);

  await assert.rejects(createSample.execute(designerA, { ...velvet, referenceCode: 'FB-3001' }), {
    code: 'FORBIDDEN',
  });
  await assert.rejects(editSample.execute(designerA, sample.id, { colour: 'Oat' }), { code: 'FORBIDDEN' });
  await assert.rejects(retireSample.execute(designerA, sample.id), { code: 'FORBIDDEN' });
});

test('FR-1: an unknown Sample reads and writes as not found', async () => {
  const { editSample, retireSample, getSample } = setup();
  await assert.rejects(getSample.execute(staff, 'nope'), { code: 'SAMPLE_NOT_FOUND' });
  await assert.rejects(editSample.execute(manager, 'nope', { colour: 'Oat' }), { code: 'SAMPLE_NOT_FOUND' });
  await assert.rejects(retireSample.execute(manager, 'nope'), { code: 'SAMPLE_NOT_FOUND' });
});

test('FR-1: the reference code format is bounded', async () => {
  const { createSample } = setup();
  for (const bad of ['X', 'FB 2214', 'FB/2214', '-FB2214', 'F'.repeat(33)]) {
    await assert.rejects(createSample.execute(manager, { ...velvet, referenceCode: bad }), {
      code: 'VALIDATION',
    });
  }
});

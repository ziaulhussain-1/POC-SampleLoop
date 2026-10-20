import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CreateSample, RetireSample } from './application/maintain-sample.ts';
import { AddSamplePieces, ListSamplePieces, RemoveSamplePiece } from './application/maintain-sample-piece.ts';
import { pieceLabel } from './domain/sample-piece.ts';
import { InMemorySampleRepository } from './infrastructure/in-memory-sample-repository.ts';
import {
  InMemoryPieceCommitments,
  InMemorySamplePieceRepository,
} from './infrastructure/in-memory-sample-piece-repository.ts';
import { designerA, fixedClock, linen, manager, sequentialIds, staff, velvet } from './test-support.ts';

const setup = async () => {
  const clock = fixedClock();
  const samples = new InMemorySampleRepository();
  const pieces = new InMemorySamplePieceRepository();
  const commitments = new InMemoryPieceCommitments();
  const ids = sequentialIds('piece');
  const createSample = new CreateSample({ samples, clock, ids: sequentialIds('sample') });
  const sample = await createSample.execute(manager, velvet);
  return {
    sample,
    createSample,
    pieces,
    commitments,
    retireSample: new RetireSample({ samples, clock }),
    addPieces: new AddSamplePieces({ samples, pieces, clock, ids }),
    removePiece: new RemoveSamplePiece({ samples, pieces, commitments, clock }),
    listPieces: new ListSamplePieces({ samples, pieces }),
  };
};

test('FR-2: Manager records how many pieces exist for a Sample', async () => {
  const { sample, addPieces, listPieces } = await setup();
  const added = await addPieces.execute(manager, sample.id, 4);

  assert.deepEqual(added.map((p) => p.pieceNumber), [1, 2, 3, 4]);
  assert.ok(added.every((p) => p.condition === 'usable' && p.sampleId === sample.id));
  assert.ok(added.every((p) => p.createdBy === manager.userId));

  const list = await listPieces.execute(staff, sample.id);
  assert.equal(list.pieces.length, 4);
  assert.equal(list.lendableCount, 4);
  assert.equal(list.unavailable, false);
});

test('FR-2: Manager adds a piece individually; it takes the next number', async () => {
  const { sample, addPieces } = await setup();
  await addPieces.execute(manager, sample.id, 2);
  const [third] = await addPieces.execute(manager, sample.id);
  assert.equal(third.pieceNumber, 3);
  assert.equal(pieceLabel(sample, third), 'FB-2214 / 3');
});

test('FR-2: piece numbers are per Sample', async () => {
  const { sample, createSample, addPieces } = await setup();
  const other = await createSample.execute(manager, linen);
  await addPieces.execute(manager, sample.id, 3);
  const [first] = await addPieces.execute(manager, other.id);
  assert.equal(first.pieceNumber, 1);
});

test('FR-2: a removed piece number is never reused, so identity is stable for life', async () => {
  const { sample, addPieces, removePiece, pieces } = await setup();
  const [, , third] = await addPieces.execute(manager, sample.id, 3);
  await removePiece.execute(manager, third.id);

  const [next] = await addPieces.execute(manager, sample.id);
  assert.equal(next.pieceNumber, 4);
  const kept = await pieces.findById(third.id);
  assert.equal(kept?.pieceNumber, 3, 'the removed piece keeps its number and its row');
});

test('FR-2: removing a piece marks it removed, attributed, and drops it from the catalogue', async () => {
  const { sample, addPieces, removePiece, listPieces } = await setup();
  const [first, second] = await addPieces.execute(manager, sample.id, 2);
  const removed = await removePiece.execute(manager, second.id);

  assert.equal(removed.removedAt, '2026-10-20T05:00:00.000Z');
  assert.equal(removed.removedBy, manager.userId);
  const list = await listPieces.execute(staff, sample.id);
  assert.deepEqual(list.pieces.map((p) => p.id), [first.id]);
});

test('FR-2: removing a piece on Loan is refused, naming the Loan', async () => {
  const { sample, addPieces, removePiece, commitments } = await setup();
  const [piece] = await addPieces.execute(manager, sample.id);
  commitments.byPiece.set(piece.id, { kind: 'loan', id: 'loan-7', label: 'Noor Studio — Gulberg', date: '2026-10-27' });

  await assert.rejects(removePiece.execute(manager, piece.id), {
    code: 'SAMPLE_PIECE_ON_LOAN',
    conflict: { entity: 'loan', id: 'loan-7', label: 'Noor Studio — Gulberg', date: '2026-10-27' },
  });
});

test('FR-2: removing a held piece is refused, naming the Kit', async () => {
  const { sample, addPieces, removePiece, commitments, pieces } = await setup();
  const [piece] = await addPieces.execute(manager, sample.id);
  commitments.byPiece.set(piece.id, { kind: 'hold', id: 'kit-3', label: 'Noor Studio — DHA villa', date: '2026-10-22' });

  await assert.rejects(removePiece.execute(manager, piece.id), {
    code: 'SAMPLE_PIECE_HELD',
    conflict: { entity: 'kit', id: 'kit-3', label: 'Noor Studio — DHA villa', date: '2026-10-22' },
  });
  assert.equal((await pieces.findById(piece.id))?.removedAt, null, 'a refused removal changes nothing');
});

test('FR-2: removing the last usable piece leaves the Sample, shown as unavailable', async () => {
  const { sample, addPieces, removePiece, listPieces, pieces } = await setup();
  const [usable, damaged] = await addPieces.execute(manager, sample.id, 2);
  pieces.pieces.set(damaged.id, { ...damaged, condition: 'damaged' });

  await removePiece.execute(manager, usable.id);

  const list = await listPieces.execute(staff, sample.id);
  assert.equal(list.sample.id, sample.id);
  assert.equal(list.pieces.length, 1, 'the damaged piece is still in the catalogue');
  assert.equal(list.lendableCount, 0);
  assert.equal(list.unavailable, true);
});

test('FR-2: a piece cannot be removed twice', async () => {
  const { sample, addPieces, removePiece } = await setup();
  const [piece] = await addPieces.execute(manager, sample.id);
  await removePiece.execute(manager, piece.id);
  await assert.rejects(removePiece.execute(manager, piece.id), { code: 'SAMPLE_PIECE_ALREADY_REMOVED' });
});

test('FR-2: a retired Sample takes no new pieces and lists as unavailable', async () => {
  const { sample, addPieces, retireSample, listPieces } = await setup();
  await addPieces.execute(manager, sample.id, 2);
  await retireSample.execute(manager, sample.id);

  await assert.rejects(addPieces.execute(manager, sample.id), {
    code: 'SAMPLE_RETIRED',
    conflict: { entity: 'sample', id: sample.id, label: 'FB-2214', date: '2026-10-20T05:00:00.000Z' },
  });
  const list = await listPieces.execute(staff, sample.id);
  assert.equal(list.pieces.length, 2);
  assert.equal(list.unavailable, true);
});

test('FR-2: piece count must be a whole number between 1 and 50', async () => {
  const { sample, addPieces } = await setup();
  for (const count of [0, -1, 1.5, 51, Number.NaN]) {
    await assert.rejects(addPieces.execute(manager, sample.id, count), { code: 'VALIDATION' }, String(count));
  }
  const fifty = await addPieces.execute(manager, sample.id, 50);
  assert.equal(fifty.at(-1)?.pieceNumber, 50);
});

test('FR-2 / FR-37: only a Manager adds or removes pieces', async () => {
  const { sample, addPieces, removePiece } = await setup();
  const [piece] = await addPieces.execute(manager, sample.id);
  for (const who of [staff, designerA]) {
    await assert.rejects(addPieces.execute(who, sample.id), { code: 'FORBIDDEN' });
    await assert.rejects(removePiece.execute(who, piece.id), { code: 'FORBIDDEN' });
  }
});

test('FR-1 / FR-2: a Designer cannot reach the pieces of a retired Sample', async () => {
  const { sample, addPieces, retireSample, listPieces } = await setup();
  await addPieces.execute(manager, sample.id);
  assert.equal((await listPieces.execute(designerA, sample.id)).pieces.length, 1);

  await retireSample.execute(manager, sample.id);
  await assert.rejects(listPieces.execute(designerA, sample.id), { code: 'SAMPLE_NOT_FOUND' });
});

test('FR-2: unknown Sample or piece is reported as not found', async () => {
  const { addPieces, removePiece } = await setup();
  await assert.rejects(addPieces.execute(manager, 'nope'), { code: 'SAMPLE_NOT_FOUND' });
  await assert.rejects(removePiece.execute(manager, 'nope'), { code: 'SAMPLE_PIECE_NOT_FOUND' });
});

test('AD-2 / AD-11: a Sample Piece stores Condition, not availability', async () => {
  const { sample, addPieces } = await setup();
  const [piece] = await addPieces.execute(manager, sample.id);
  for (const forbidden of ['available', 'isAvailable', 'onLoan', 'held', 'status']) {
    assert.ok(!(forbidden in piece), `Sample Piece must not store ${forbidden} — availability is computed`);
  }
});

import { expect, test } from 'vitest'
import TimerState from './TimerState';
import { initStages } from './TimerState';

test('can be constructed', () => {
  const timerState = new TimerState();
  expect(timerState).toBeDefined();
});

test('has initial state', () => {
  const timerState = new TimerState();
  expect(timerState.stages).toHaveLength(17);
  expect(timerState.stageIndex).toBe(-1);
  expect(timerState.remainingStageTimeMs).toBe(0);
});

test('advances', () => {
  let timerState = new TimerState();

  timerState = timerState.next(1);
  expect(timerState.stageIndex).toBe(0);
  expect(timerState.remainingStageTimeMs).toBe(9999);

  timerState = timerState.next(9999);
  expect(timerState.stageIndex).toBe(0);
  expect(timerState.remainingStageTimeMs).toBe(0);

  timerState = timerState.next(1);
  expect(timerState.stageIndex).toBe(1);
  expect(timerState.remainingStageTimeMs).toBe(29999);

  timerState = timerState.next(29999);
  expect(timerState.stageIndex).toBe(1);
  expect(timerState.remainingStageTimeMs).toBe(0);

  timerState = timerState.next(1);
  expect(timerState.stageIndex).toBe(2);
  expect(timerState.remainingStageTimeMs).toBe(9999);
});

test('ends', () => {
  let timerState = new TimerState();

  while (!timerState.reachedEnd) {
    timerState = timerState.next(1000);
  }

  timerState = timerState.next(1000);
  expect(timerState.stageIndex).toBe(17);

  timerState = timerState.next(1000);
  expect(timerState.stageIndex).toBe(17);
});

test('issues events', () => {
  let timerState = new TimerState(initStages(2));

  expect(timerState.events).toHaveLength(0);
  timerState = timerState.next(1000);
  expect(timerState.events).toHaveLength(0);
  timerState = timerState.next(5900);
  expect(timerState.events).toHaveLength(0);
  timerState = timerState.next(100);
  expect(timerState.events).toStrictEqual(['prepare']);
  timerState = timerState.next(100);
  expect(timerState.events).toHaveLength(0);
  timerState = timerState.next(2900);
  expect(timerState.events).toHaveLength(0);

  timerState = timerState.next(30000);
  expect(timerState.events).toHaveLength(0);
  timerState = timerState.next(100);
  expect(timerState.events).toStrictEqual(['stop']);

  timerState = timerState.next(900);
  expect(timerState.events).toHaveLength(0);
  timerState = timerState.next(5900);
  expect(timerState.events).toHaveLength(0);
  timerState = timerState.next(100);
  expect(timerState.events).toStrictEqual(['prepare']);
  timerState = timerState.next(100);
  expect(timerState.events).toHaveLength(0);
  timerState = timerState.next(2900);
  expect(timerState.events).toHaveLength(0);

  timerState = timerState.next(30000);
  expect(timerState.events).toHaveLength(0);
  timerState = timerState.next(100);
  expect(timerState.events).toStrictEqual(['finish']);
});

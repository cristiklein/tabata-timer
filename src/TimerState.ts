export interface Stage {
  name: string;
  durationMs: number;
}

export function initStages(numCycles: number = 8): Stage[] {
  const stages: Stage[] = [];

  for (let cycle: number = 0; cycle < numCycles; cycle++) {
    const restName = (cycle === 0) ? 'Prepare' : 'Rest';
    stages.push({ name: restName, durationMs: 10000 });
    stages.push({ name: 'Work', durationMs: 30000 });
  }

  stages.push({ name: 'Finish', durationMs: 10000 });

  return stages;
}

const DEFAULT_STAGES = initStages();

export default class TimerState {
  remainingStageTimeMs = 0;
  stageIndex = -1;
  reachedEnd = false;
  stages: Stage[];
  events: string[] = [];

  constructor(stages: Stage[] = DEFAULT_STAGES) {
    this.stages = stages;
  }

  /* Return a new TimerState from the current state */
  next(deltaMs: number): TimerState {
    const stages = this.stages;

    const next: TimerState = Object.create(this);

    next.remainingStageTimeMs -= deltaMs;
    while (next.remainingStageTimeMs < 0) {
      next.stageIndex = Math.min(this.stageIndex + 1, stages.length);
      if (next.stageIndex < stages.length) {
        next.remainingStageTimeMs += stages[next.stageIndex].durationMs;
      }
      else {
        next.remainingStageTimeMs = 0;
        next.reachedEnd = true;
      }
    }

    next.events = [];
    const thisStageName = (this.stages[this.stageIndex] || { name: "---" }).name;
    const nextStageName = (this.stages[next.stageIndex] || { name: "---" }).name;
    const futureStageName = (this.stages[next.stageIndex+1] || { name: "---" }).name;

    if (
      [ "Prepare", "Rest" ].includes(nextStageName) &&
      this.remainingStageTimeMs > 3000 &&
      next.remainingStageTimeMs <= 3000
    ) {
      next.events.push('prepare');
    }

    if (
      "Work" === thisStageName &&
      this.remainingStageTimeMs - deltaMs <= 0
    ) {
      if (nextStageName === "Finish") {
        next.events.push('finish');
      } else {
        next.events.push('stop');
      }
    }

    return next;
  }

  gotoStageRel(amount: number): TimerState {
    const next: TimerState = Object.create(this);

    next.stageIndex = this.stageIndex + amount;

    next.stageIndex = Math.max(0, next.stageIndex);
    next.stageIndex = Math.min(next.stageIndex, next.stages.length - 1);
    next.remainingStageTimeMs = this.stages[next.stageIndex].durationMs;
    next.reachedEnd = false;

    return next;
  }
}

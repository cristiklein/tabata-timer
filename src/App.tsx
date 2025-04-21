import { useState, useEffect, useRef } from 'react';

import styled from 'styled-components';


import { formatDuration } from './utils';

import prepareSoundMp3 from './assets/prepare-sound.mp3';
import stopSoundMp3 from './assets/stop-sound.mp3';
import finishSoundMp3 from './assets/finish-sound.mp3';

const prepareAudio = new Audio(prepareSoundMp3);
const stopAudio = new Audio(stopSoundMp3);
const finishAudio = new Audio(finishSoundMp3);

const version = require('../package.json').version;

export interface Stage {
  name: string;
  durationMs: number;
}

function initStages(): Stage[] {
  const stages: Stage[] = [];

  for (let cycle: number = 0; cycle < 8; cycle++) {
    const restName = (cycle === 0) ? 'Prepare' : 'Rest';
    stages.push({ name: restName, durationMs: 10000 });
    stages.push({ name: 'Work', durationMs: 30000 });
  }

  stages.push({ name: 'Finish', durationMs: 10000 });

  return stages;
}

const MainContainer = styled.div`
  display: grid;

  grid-template-areas:
    "header"
    "version"
    "buttons"
    "timers"
    "stages";
  grid-template-rows: auto auto auto auto 1fr;
  gap: 10px;
  box-sizing: border-box;
  padding: 0;

  height: 100%;
  max-width: 800px;
  margin: auto;

  h1 {
    grid-area: header;
    margin: 0px;
    padding: 0px;
    text-align: center;
  }

  .version {
    grid-area: version;
    text-align: center;
  }

  .buttons {
    grid-area: buttons;

    & button {
      width: 50%;
      min-height: 50px;
      font-size: 20px;
    }
  }

  .timers {
    grid-area: timers;
    font-size: 50px;
    font-family: monospace;
    text-align: center;

    & .rest {
      background-color: green;
    }

    & .work {
      background-color: red;
    }
  }

  .stageListContainer {
    grid-area: stages;
    overflow: auto;

    & ul {
      padding: 0;
      margin: 0;
      font-size: 32px;
    }

    & li {
      display: flex;
      justify-content: space-between;
      padding: 8px 12px;
      border-bottom: 1px solid #ddd;

      &.active {
        background-color: #f0f8ff;
        font-weight: bold;
      }
    }
  }

  /* Responsive Adjustments */
  @media (min-width: 640px) {
    & {
      grid-template-areas:
        "header stages"
        "version stages"
        "buttons stages"
        "timers stages";
      grid-template-columns: 350px 1fr;
      grid-template-rows: auto auto auto 1fr;
    }
  }
`;

class TimerState {
  elapsedTimeMs = 0;
  stageIndex = -1;
  stageEndTimeMs = 0;
  reachedEnd = false;
  stages: Stage[];

  constructor(stages: Stage[]) {
    this.stages = stages;
  }

  /* Return a new TimerState from the current state */
  next(deltaMs: number): TimerState {
    const stages = this.stages;

    let prev: TimerState = this;
    const next = new TimerState(stages);

    /* Have we been restarted after the last stage? Reset! */
    if (prev.stageIndex >= stages.length) {
      prev = new TimerState(stages);
    }

    next.elapsedTimeMs = prev.elapsedTimeMs + deltaMs;
    next.stageIndex = prev.stageIndex;
    next.stageEndTimeMs = prev.stageEndTimeMs;

    /* Check if we went over a stage */
    if (next.elapsedTimeMs >= prev.stageEndTimeMs) {
      next.stageIndex += 1;

      /* Check if we reached the end */
      if (next.stageIndex >= stages.length) {
        next.reachedEnd = true;
        next.elapsedTimeMs = next.stageEndTimeMs;
      }
      else {
        next.stageEndTimeMs += stages[next.stageIndex].durationMs;
      }
    }

    return next;
  }
}

function shouldAudioStop(
  stages: Stage[],
  prev: TimerState,
  next: TimerState,
): boolean {
  if (prev.stageIndex === next.stageIndex)
    return false;

  if (prev.stageIndex < 0 || stages.length <= prev.stageIndex)
    return false;

  if (stages[prev.stageIndex].name !== "Work")
    return false;

  return true;
}

function shouldAudioPrepare(
  stages: Stage[],
  prev: TimerState,
  next: TimerState,
): boolean {
  if (prev.stageIndex < 0 || stages.length <= prev.stageIndex)
    return false;

  if (stages[prev.stageIndex].name === "Work")
    return false;

  if (stages.length <= prev.stageIndex+1)
    return false;

  if (stages[prev.stageIndex+1].name !== "Work")
    return false;

  const prevTimeToEnd = prev.stageEndTimeMs - prev.elapsedTimeMs;
  const nextTimeToEnd = next.stageEndTimeMs - next.elapsedTimeMs;
  if (prev.stageEndTimeMs !== next.stageEndTimeMs)
    /* Stage changed; not our call */
    return false;

  if (prevTimeToEnd > 3000 && nextTimeToEnd <= 3000)
    return true;

  return false;
}

function shouldAudioFinish(
  stages: Stage[],
  prev: TimerState,
  next: TimerState,
): boolean {
  if (prev.stageIndex === next.stageIndex)
    return false;

  if (prev.stageIndex < 0 || stages.length <= prev.stageIndex)
    return false;

  if (stages[prev.stageIndex].name !== "Finish")
    return false;

  return true;
}

const DEFAULT_STAGES = initStages();

interface AppProps {
  stages?: Stage[];
}

const App: React.FC<AppProps> = ({ stages = DEFAULT_STAGES }) => {
  const [isRunning, setIsRunning] = useState(false);
  const [timerState, setTimerState] = useState<TimerState>(new TimerState(stages));
  const lastUpdatedRef = useRef<number>(0);

  useEffect(() => {
    let timerId: NodeJS.Timeout;

    if (isRunning) {
      console.log('Timer running');

      lastUpdatedRef.current = Date.now();

      timerId = setInterval(() => {
        const now = Date.now();
        const delta = now - lastUpdatedRef.current;
        setTimerState((prev) => {
          const next = prev.next(delta);

          if (next.reachedEnd)
            setIsRunning(() => false);

          if (shouldAudioPrepare(stages, prev, next)) {
            prepareAudio.play();
            if (navigator.vibrate)
              navigator.vibrate([200, 800, 200, 800, 200, 800, 200]);
            const i = next.stageIndex;
            const el = document.getElementById('stage-'+i);
            if (el)
              el.scrollIntoView({ behavior: "smooth" });
            else
              console.log("Couldn't scroll into view");
          }
          if (shouldAudioStop(stages, prev, next)) {
            if (navigator.vibrate)
              navigator.vibrate(500);
            stopAudio.play();
          }
          if (shouldAudioFinish(stages, prev, next)) {
            if (navigator.vibrate)
              navigator.vibrate([100, 200, 500]);
            finishAudio.play();
          }

          return next;
        });
        lastUpdatedRef.current = now;
      }, 1000/60); // 60Hz
    }

    return () => {
      console.log('Timer cleared');
      clearInterval(timerId);
    };
  }, [isRunning, stages]);

  const handleStartPauseResume = () => {
    setIsRunning(!isRunning);
  };

  const handleReset = () => {
    setIsRunning(false);
    setTimerState(new TimerState(stages));
  };

  const stageName = (stages[timerState.stageIndex] || { name: "Click start" }).name;

  return (
    <MainContainer>
      <h1>Tabata Timer</h1>
      <div className="version">{ version }</div>
      <div className="buttons">
        <button onClick={handleStartPauseResume}>{
          isRunning ? "Pause" : (
            (timerState.stageIndex < 0) ||
            (timerState.reachedEnd) ? "Start" : "Resume"
          )
        }</button>
        <button onClick={handleReset}>Reset</button>
      </div>
      <div className="timers">
        <div className={
          stageName === "Work" ? "work" :
          stageName === "Rest" ? "rest" :
          ""
        }>{ stageName }</div>
        <div>{ formatDuration(timerState.stageEndTimeMs - timerState.elapsedTimeMs) }</div>
      </div>
      <div className="stageListContainer">
      <ul>
        {stages.map((stage, i) => (
          <li
            key={i}
            id={"stage-"+(i)}
            className={ i === timerState.stageIndex ? "active" : ""}
          >
            <span>{i+1}</span>
            <span>{stage.name}</span>
            <span>{stage.durationMs / 1000}s</span>
          </li>
        ))}
      </ul>
      </div>
    </MainContainer>
  );
}

export default App;

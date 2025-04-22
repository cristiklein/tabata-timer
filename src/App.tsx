import { useState, useEffect, useRef } from 'react';

import styled from 'styled-components';

import { formatDuration } from './utils';

import prepareSoundMp3 from './assets/prepare-sound.mp3';
import stopSoundMp3 from './assets/stop-sound.mp3';
import finishSoundMp3 from './assets/finish-sound.mp3';

const prepareAudio = new Audio(prepareSoundMp3);
const stopAudio = new Audio(stopSoundMp3);
const finishAudio = new Audio(finishSoundMp3);

import TimerState from './TimerState';

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
    display: flex;

    & button {
      width: 50%;
      min-height: 50px;
      font-size: 20px;

      &.small {
        width: auto;
      }
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

function scrollMe(next: TimerState) {
  const i = next.stageIndex;
  const el = document.getElementById('stage-'+i);
  if (el)
    el.scrollIntoView({ behavior: "smooth" });
  else
    console.log("Couldn't scroll into view");
}

function scrollMeIfNeeded(next: TimerState) {
  const i = next.stageIndex;
  const el = document.getElementById('stage-'+i);
  if (el)
    el.scrollIntoView({ behavior: "smooth", block: "nearest" });
  else
    console.log("Couldn't scroll into view");
}

const App: React.FC = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [timerState, setTimerState] = useState<TimerState>(new TimerState());
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

          if (next.events.includes('prepare')) {
            prepareAudio.play();
            if (navigator.vibrate)
              navigator.vibrate([200, 800, 200, 800, 200, 800, 200]);
            scrollMe(next);
          }

          if (next.events.includes('stop')) {
            if (navigator.vibrate)
              navigator.vibrate(500);
            stopAudio.play();
          }

          if (next.events.includes('finish')) {
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
  }, [isRunning]);

  const handleStartPauseResume = () => {
    setIsRunning(!isRunning);
  };

  const handleReset = () => {
    setIsRunning(false);
    setTimerState(new TimerState(stages));
  };

  const handleGotoStageRel = (amount) => {
    const next = timerState.gotoStageRel(amount);
    setTimerState(next);
    scrollMeIfNeeded(next);
  }

  const handlePrev = () => {
    handleGotoStageRel(-1);
  };

  const handleNext = () => {;
    handleGotoStageRel(+1);
  };

  const stageName = (timerState.stages[timerState.stageIndex] || { name: "Click start" }).name;

  return (
    <MainContainer>
      <h1>Tabata Timer</h1>
      <div className="version">{ __APP_VERSION__ }</div>
      <div className="buttons">
        <button onClick={handlePrev} className="small">&lt;</button>
        <button onClick={handleStartPauseResume}>{
          isRunning ? "Pause" : (
            (timerState.stageIndex < 0) ||
            (timerState.reachedEnd) ? "Start" : "Resume"
          )
        }</button>
        <button onClick={handleReset}>Reset</button>
        <button onClick={handleNext} className="small">&gt;</button>
      </div>
      <div className="timers">
        <div className={
          stageName === "Work" ? "work" :
          stageName === "Rest" ? "rest" :
          ""
        }>{ stageName }</div>
        <div>{ formatDuration(timerState.remainingStageTimeMs) }</div>
      </div>
      <div className="stageListContainer">
      <ul>
        {timerState.stages.map((stage, i) => (
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

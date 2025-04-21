import { useState, useEffect, useRef } from 'react';

import styled from 'styled-components';


import { formatDuration } from './utils';

import prepareSoundMp3 from './assets/prepare-sound.mp3';
import stopSoundMp3 from './assets/stop-sound.mp3';

const prepareAudio = new Audio(prepareSoundMp3);
const stopAudio = new Audio(stopSoundMp3);

const version = require('../package.json').version;

export interface Stage {
  name: string;
  durationMs: number;
}

function initStages(): Stage[] {
  const stages: Stage[] = [];

  for (let cycle: number = 0; cycle < 8; cycle++) {
    stages.push({ name: 'Prep', durationMs: 10000 });
    stages.push({ name: 'Work', durationMs: 30000 });
  }

  return stages;
}

const FlexContainer = styled.div`
  height: 100%;
  display: flex;
  flex-direction: column;
`;

const StageList = styled.ul`
  padding: 0;
  margin: 0;
  font-size: 32px;
`;

const StageItem = styled.li<{ $active: boolean }>`
  display: flex;
  justify-content: space-between;
  padding: 8px 12px;
  border-bottom: 1px solid #ddd;
  background-color: ${({ $active }) => ($active ? '#f0f8ff' : 'transparent')};
  font-weight: ${({ $active }) => ($active ? 'bold' : 'normal')};
`;

const StageName = styled.span`
  text-align: left;
`;

const StageDuration = styled.span`
  text-align: right;
  min-width: 40px;
`;

const Button = styled.button`
  width: 50%;
  min-height: 50px;
  font-size: 20px;
`;

const Title = styled.h1`
  margin: 0px;
  padding: 5px 0px;
  text-align: center;
`;

const Timer = styled.div<{ $stageName?: string }>`
  font-size: 50px;
  font-family: monospace;
  text-align: center;

  margin: 10px 0;

  background-color: ${ props => (
    props.$stageName === "Work" ? "red" :
    props.$stageName === "Prep" ? "green" :
    '' ) };
`;

const VerticalScrollContainer = styled.div<{ $height: string }>`
  overflow-y: scroll;
  height: ${props => props.$height};
  flex-grow: 1;
`;

class TimerState {
  elapsedTimeMs = 0;
  stageIndex = -1;
  stageEndTimeMs = 0;
  reachedEnd = false;

  /* Return a new TimerState from the current state */
  next(stages: Stage[], deltaMs: number): TimerState {
    let prev: TimerState = this;
    const next = new TimerState();

    /* Have we been restarted after the last stage? Reset! */
    if (prev.stageIndex >= stages.length) {
      prev = new TimerState();
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

  const prevTimeToEnd = prev.stageEndTimeMs - prev.elapsedTimeMs;
  const nextTimeToEnd = next.stageEndTimeMs - next.elapsedTimeMs;
  if (prev.stageEndTimeMs !== next.stageEndTimeMs)
    /* Stage changed; not our call */
    return false;

  if (prevTimeToEnd > 3000 && nextTimeToEnd <= 3000)
    return true;

  return false;
}

const App: React.FC = () => {
  const [stages] = useState<Stage[]>(initStages());
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
          const next = prev.next(stages, delta);

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
    setTimerState(new TimerState());
  };

  const stageName = (stages[timerState.stageIndex] || { name: "Click start" }).name;

  return (
    <FlexContainer>
      <Title>Tabata Timer</Title>
      <div>
        <Button onClick={handleStartPauseResume}>{
          isRunning ? "Pause" : (
            (timerState.stageIndex < 0) ||
            (timerState.reachedEnd) ? "Start" : "Resume"
          )
        }</Button>
        <Button onClick={handleReset}>Reset</Button>
      </div>
      <Timer $stageName={stageName}>{ stageName }</Timer>
      <Timer>{ formatDuration(timerState.stageEndTimeMs - timerState.elapsedTimeMs) }</Timer>
      <VerticalScrollContainer $height="450px">
      <StageList>
        {stages.map((stage, i) => (
          <StageItem
            key={i}
            $active={i === timerState.stageIndex}
            id={"stage-"+(i)}
          >
            <StageName>{i+1}</StageName>
            <StageName>{stage.name}</StageName>
            <StageDuration>{stage.durationMs / 1000}s</StageDuration>
          </StageItem>
        ))}
      </StageList>
      </VerticalScrollContainer>
      <div>
        Version: { version }
      </div>
    </FlexContainer>
  );
}

export default App;

import { useState, useEffect, useRef } from 'react';

import styled from 'styled-components';

import { formatDuration } from './utils';

import startSoundMp3 from './assets/start-sound.mp3';
import stopSoundMp3 from './assets/stop-sound.mp3';
import prepareSoundMp3 from './assets/prepare-sound.mp3';

const startAudio = new Audio(startSoundMp3);
const stopAudio = new Audio(stopSoundMp3);
const prepareAudio = new Audio(prepareSoundMp3);

export interface Stage {
  name: string;
  durationMs: number;
}

function initStages(): Stage[] {
  const stages: Stage[] = [];

  for (let cycle: number = 0; cycle < 8; cycle++) {
    stages.push({ name: 'Prep', durationMs: 10000 });
    stages.push({ name: 'Work', durationMs: 10000 });
  }

  return stages;
}

function getStageIndex(stages: Stage[], elapsedTimeMs: number) {
  let endTimeMs = 0;
  for (let i: number = 0; i < stages.length; i++) {
    endTimeMs += stages[i].durationMs;
    if (endTimeMs > elapsedTimeMs)
      return i;
  }

  return -1;
}

const StageList = styled.ul`
  padding: 0;
  margin: 0;
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
`;

const Title = styled.h1`
  margin-block-start: 5px;
  margin-block-end: 5px;
`;

const Timer = styled.div`
  font-size: 30px;
  font-family: monospace;
  text-align: center;

  margin: 10px 0;
`;

function getPrevNextStage(
  stages: Stage[],
  prevMs: number,
  nextMs: number,
  offsetMs: number,
): [ number, number ] {
  const prevIndex = getStageIndex(stages, prevMs - offsetMs);
  const nextIndex = getStageIndex(stages, nextMs - offsetMs);

  return [ prevIndex, nextIndex ];
}

function shouldAudioStart(
  stages: Stage[],
  prevMs: number,
  nextMs: number,
): boolean {
  const [ prevIndex, nextIndex ] = getPrevNextStage(
    stages,
    prevMs,
    nextMs,
    0,
  );

  if (nextIndex === -1)
    return false;

  if (prevIndex === nextIndex)
    return false;

  return (stages[nextIndex].name === "Work");
}

function shouldAudioStop(
  stages: Stage[],
  prevMs: number,
  nextMs: number,
): boolean {
  const [ prevIndex, nextIndex ] = getPrevNextStage(
    stages,
    prevMs,
    nextMs,
    0,
  );

  if (prevIndex === -1)
    return false;

  if (prevIndex === nextIndex)
    return false;

  return (stages[prevIndex].name === "Work");
}

function shouldAudioPrepare(
  stages: Stage[],
  prevMs: number,
  nextMs: number,
): boolean {
  for (let i : number = 1; i <= 3; i++) {
    const [ prevIndex, nextIndex ] = getPrevNextStage(
      stages,
      prevMs,
      nextMs,
      -1000*i,
    );

    if (nextIndex === -1)
      continue;

    if (prevIndex === nextIndex)
      continue;

    if (stages[nextIndex].name === "Work")
      return true;
  }

  return false;
}

const App: React.FC = () => {
  const [stages] = useState<Stage[]>(initStages());
  const [isRunning, setIsRunning] = useState(false);
  const [elapsedTimeMs, setElapsedTimeMs] = useState(0);
  const lastUpdatedRef = useRef<number>(Date.now());

  useEffect(() => {
    let timerId: NodeJS.Timeout;

    if (isRunning) {
      console.log('Timer running');
      timerId = setInterval(() => {
        const now = Date.now();
        const delta = now - lastUpdatedRef.current;
        setElapsedTimeMs((prev) => {
          const next = prev + delta;

          const nextStageIndex = getStageIndex(stages, next);

          if (shouldAudioStart(stages, prev, next)) {
            startAudio.play();
          }
          if (shouldAudioPrepare(stages, prev, next)) {
            prepareAudio.play();
          }
          if (shouldAudioStop(stages, prev, next)) {
            stopAudio.play();
          }

          if (nextStageIndex === -1) {
            setIsRunning(false);
            return Math.floor(next / 1000) * 1000;
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
    setElapsedTimeMs(0);
  };

  return (
    <div>
      <Title>Tabata Timer</Title>
      <Button onClick={handleStartPauseResume}>{
        isRunning ? "Pause" : (
          (elapsedTimeMs === 0) ? "Start" : "Resume"
        )
      }</Button>
      <Button onClick={handleReset}>Reset</Button>
      <Timer>{ formatDuration(elapsedTimeMs) }</Timer>
      <StageList>
        {stages.map((stage, i) => (
          <StageItem
            key={i}
            $active={i === getStageIndex(stages, elapsedTimeMs)}
          >
            <StageName>{i+1}</StageName>
            <StageName>{stage.name}</StageName>
            <StageDuration>{stage.durationMs / 1000}s</StageDuration>
          </StageItem>
        ))}
      </StageList>
    </div>
  );
}

export default App;

import { useState, useEffect, useRef } from 'react';

import styled from 'styled-components';

import { formatDuration } from './utils';

export interface Stage {
  name: string;
  durationMs: number;
  startTimeMs?: number;
  endTimeMs?: number;
}

function initStages(): Stage[] {
  const stages: Stage[] = [];

  for (let cycle: number = 0; cycle < 8; cycle++) {
    stages.push({ name: 'Prep', durationMs: 10000 });
    stages.push({ name: 'Work', durationMs: 30000 });
  }

  return stages;
}

function withStageStartEnd(stages: Stage[]) {
  const outStages: Stage[] = [];

  let startTimeMs = 0;
  let endTimeMs = 0;
  for (let i: number = 0; i < stages.length; i++) {
    endTimeMs += stages[i].durationMs;
    outStages.push({startTimeMs, endTimeMs, ...stages[i]});
    startTimeMs = endTimeMs;
  }

  return outStages;
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
  font-family: fixed-width;
  text-align: center;

  margin: 10px 0;
`;

const App: React.FC = () => {
  const [stages] = useState<Stage[]>(withStageStartEnd(initStages()));
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
        setElapsedTimeMs((prev) => prev + delta);
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
            $active={stages[i].startTimeMs! <= elapsedTimeMs && elapsedTimeMs < stages[i].endTimeMs!}
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

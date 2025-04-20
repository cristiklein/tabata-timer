import { useState, useEffect, useRef } from 'react';

import styled from 'styled-components';

import { formatDuration } from './utils';

export interface Stage {
  name: string;
  duration: number; // Duration in seconds
}

function initStages(): Stage[] {
  const stages: Stage[] = [];

  for (let cycle: number = 0; cycle < 8; cycle++) {
    stages.push({ name: 'Prep', duration: 10 });
    stages.push({ name: 'Work', duration: 30 });
  }

  return stages;
}

const StageList = styled.ul`
  padding: 0;
  margin: 0;
`;

interface StageItemProps {
  active: boolean;
}

const StageItem = styled.li<StageItemProps>`
  display: flex;
  justify-content: space-between;
  padding: 8px 12px;
  border-bottom: 1px solid #ddd;
  background-color: ${({ active }) => (active ? '#f0f8ff' : 'transparent')};
  font-weight: ${({ active }) => (active ? 'bold' : 'normal')};
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
  const [stages, setStages] = useState<Stage[]>(initStages());
  const [currentStageIndex, setCurrentStageIndex] = useState<number>(0);
  const [isRunning, setIsRunning] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);

  useEffect(() => {
    let timerId: NodeJS.Timeout;
    let lastUpdated: number;

    if (isRunning) {
      console.log('Timer running');
      lastUpdated = Date.now();
      timerId = setInterval(() => {
        setElapsedTime((elapsedTime) => elapsedTime + Date.now() - lastUpdated);
        lastUpdated = Date.now();
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
    setElapsedTime(0);
  };

  return (
    <div>
      <Title>Tabata Timer</Title>
      <Button onClick={handleStartPauseResume}>{
        isRunning ? "Pause" : (
          (elapsedTime === 0) ? "Start" : "Resume"
        )
      }</Button>
      <Button onClick={handleReset}>Reset</Button>
      <Timer>{ formatDuration(elapsedTime) }</Timer>
      <StageList>
        {stages.map((stage, index) => (
          <StageItem
            key={index}
            active={index === currentStageIndex}
          >
            <StageName>{index+1}</StageName>
            <StageName>{stage.name}</StageName>
            <StageDuration>{stage.duration}s</StageDuration>
          </StageItem>
        ))}
      </StageList>
    </div>
  );
}

export default App;

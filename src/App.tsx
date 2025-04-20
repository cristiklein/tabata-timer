import { useState, useEffect, useRef } from 'react';

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

const App: React.FC = () => {
  const [stages, setStages] = useState<Stage[]>(initStages());
  const [currentStageIndex, setCurrentStageIndex] = useState<number>(0);

  return (
    <div>
      <h1>Tabata Timer</h1>
      <ul>
        {stages.map((stage, index) => (
          <li
            key={index}
            className={index === currentStageIndex ? 'active' : ''}
          >
            <span className="stage-index">{index+1}</span>
            <span className="stage-name">{stage.name}</span>
            <span className="stage-duration">{stage.duration}s</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default App;

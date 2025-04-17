import { useState, useEffect, useRef } from 'react';

const STAGES = ['Prep', 'Work', 'Rest'];
const DURATIONS = {
  Prep: 10,
  Work: 30,
  Rest: 10,
};

const TOTAL_ROUNDS = 8;

export default function App() {
  const [stage, setStage] = useState('Prep');
  const [timeLeft, setTimeLeft] = useState(DURATIONS['Prep']);
  const [round, setRound] = useState(1);
  const [running, setRunning] = useState(false);
  const timerRef = useRef(null);

  const playBeep = () => {
    const audio = new Audio('/assets/beep.mp3');
    audio.play();
  };

  useEffect(() => {
    if (!running) return;

    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev > 1) return prev - 1;

        playBeep();

        clearInterval(timerRef.current);
        setStage(prevStage => {
          if (prevStage === 'Prep') return 'Work';
          if (prevStage === 'Work') return 'Rest';
          if (prevStage === 'Rest') {
            if (round < TOTAL_ROUNDS) {
              setRound(r => r + 1);
              return 'Work';
            } else {
              setRunning(false);
              return 'Done';
            }
          }
        });
        return 0;
      });
    }, 1000);

    return () => clearInterval(timerRef.current);
  }, [running, stage]);

  useEffect(() => {
    if (stage === 'Done') return;
    setTimeLeft(DURATIONS[stage]);
  }, [stage]);

  const handleStart = () => setRunning(true);
  const handlePause = () => {
    clearInterval(timerRef.current);
    setRunning(false);
  };
  const handleReset = () => {
    clearInterval(timerRef.current);
    setRunning(false);
    setStage('Prep');
    setTimeLeft(DURATIONS['Prep']);
    setRound(1);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-black text-white text-center p-4">
      <h1 className="text-4xl mb-4">Tabata Timer</h1>
      <h2 className="text-2xl">{stage} {stage !== 'Done' && `(Round ${round}/${TOTAL_ROUNDS})`}</h2>
      <div className="text-6xl my-6">{timeLeft}s</div>
      <div className="flex gap-4">
        {!running && stage !== 'Done' && (
          <button onClick={handleStart} className="bg-green-500 px-4 py-2 rounded">Start</button>
        )}
        {running && (
          <button onClick={handlePause} className="bg-yellow-500 px-4 py-2 rounded">Pause</button>
        )}
        <button onClick={handleReset} className="bg-red-500 px-4 py-2 rounded">Reset</button>
      </div>
    </div>
  );
}

import { useState, useCallback } from 'react';

export interface ProgressStep {
  label: string;
  value: number;
  completed?: boolean;
}

export interface ProgressConfig {
  steps: ProgressStep[];
  totalDuration?: number; // Total time in ms
  stepDelays?: number[]; // Custom delays for each step
}

export const useProgressSteps = () => {
  const [progressValue, setProgressValue] = useState(0);
  const [progressLabel, setProgressLabel] = useState('');
  const [progressSteps, setProgressSteps] = useState<ProgressStep[]>([]);

  const startProgress = useCallback(async (config: ProgressConfig, apiPromise?: Promise<any>) => {
    const { steps, totalDuration = 3000, stepDelays } = config;
    
    // Set initial state immediately
    setProgressValue(0);
    setProgressLabel('Starting...');
    setProgressSteps(steps);
    
    // Use requestAnimationFrame to ensure the modal is rendered before starting animation
    await new Promise(resolve => requestAnimationFrame(resolve));
    
    // Start immediately with first step
    if (steps.length > 0) {
      setProgressLabel(steps[0].label);
      setProgressValue(steps[0].value);
      setProgressSteps(prev => prev.map((s, idx) => ({
        ...s,
        completed: idx < 1
      })));
    }
    
    // If we have an API promise, sync progress with it
    if (apiPromise) {
      // Start a race between progress animation and API completion
      const progressPromise = new Promise<void>((resolve) => {
        let currentStep = 1;
        const maxSteps = steps.length;
        
        const progressInterval = setInterval(() => {
          if (currentStep < maxSteps) {
            const step = steps[currentStep];
            setProgressLabel(step.label);
            setProgressValue(step.value);
            setProgressSteps(prev => prev.map((s, idx) => ({
              ...s,
              completed: idx < currentStep + 1
            })));
            currentStep++;
          } else {
            clearInterval(progressInterval);
            // Don't complete yet, wait for API
          }
        }, Math.max(400, totalDuration / maxSteps)); // Minimum 400ms per step, adjusted for 4-5s API
        
        // Clean up interval when API completes
        apiPromise.finally(() => {
          clearInterval(progressInterval);
          // Complete the progress
          setProgressLabel('Finalizing...');
          setProgressValue(95);
          setProgressSteps(prev => prev.map(step => ({ ...step, completed: true })));
          setTimeout(() => {
            setProgressValue(100);
            setProgressLabel('Completed');
            resolve();
          }, 200);
        });
      });
      
      return progressPromise;
    }
    
    // Fallback to original behavior if no API promise
    const delays = stepDelays || steps.map((_, index) => {
      const baseDelay = totalDuration / steps.length;
      return baseDelay + (Math.random() * 200 - 100);
    });
    
    for (let i = 1; i < steps.length; i++) {
      const step = steps[i];
      await new Promise(resolve => setTimeout(resolve, delays[i]));
      setProgressLabel(step.label);
      setProgressValue(step.value);
      setProgressSteps(prev => prev.map((s, idx) => ({
        ...s,
        completed: idx < i + 1
      })));
      await new Promise(resolve => setTimeout(resolve, 50));
    }
    
    await new Promise(resolve => setTimeout(resolve, 150));
    setProgressLabel('Finalizing...');
    setProgressValue(95);
    setProgressSteps(prev => prev.map(step => ({ ...step, completed: true })));
    await new Promise(resolve => setTimeout(resolve, 200));
    
    setProgressValue(100);
    setProgressLabel('Completed');
  }, []);

  const resetProgress = useCallback(() => {
    setProgressValue(0);
    setProgressLabel('');
    setProgressSteps([]);
  }, []);

  return {
    progressValue,
    progressLabel,
    progressSteps,
    setProgressSteps,
    startProgress,
    resetProgress
  };
};

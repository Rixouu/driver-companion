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

  const startProgress = useCallback(async (config: ProgressConfig) => {
    const { steps, totalDuration = 2000, stepDelays } = config;
    
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
    
    // Calculate delays if not provided
    const delays = stepDelays || steps.map((_, index) => {
      const baseDelay = totalDuration / steps.length;
      return baseDelay + (Math.random() * 200 - 100); // Add some variation
    });
    
    // Execute remaining steps with smooth progression
    for (let i = 1; i < steps.length; i++) {
      const step = steps[i];
      
      // Wait for this step's delay
      await new Promise(resolve => setTimeout(resolve, delays[i]));
      
      // Update progress with smooth transition
      setProgressLabel(step.label);
      setProgressValue(step.value);
      setProgressSteps(prev => prev.map((s, idx) => ({
        ...s,
        completed: idx < i + 1
      })));
      
      // Small delay to make animation more visible
      await new Promise(resolve => setTimeout(resolve, 50));
    }
    
    // Final completion step (90% → 100%)
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

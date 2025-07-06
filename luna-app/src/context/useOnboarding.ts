import { useContext } from 'react';
import { OnboardingContext } from './OnboardingContext';

const useOnboarding = () => {
  const ctx = useContext(OnboardingContext);
  if (!ctx) throw new Error('useOnboarding must be used within OnboardingProvider');
  return ctx;
};

export default useOnboarding;

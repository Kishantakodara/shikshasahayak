import { useContext } from 'react';
import { BetaFeatureContext, BetaFeatureState } from '../contexts/BetaFeatureContext';

export function useBetaFeatures(): BetaFeatureState {
  const context = useContext(BetaFeatureContext);
  if (!context) {
    throw new Error('useBetaFeatures must be used within a BetaFeatureProvider');
  }
  return context;
}

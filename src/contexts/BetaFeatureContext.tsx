import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getStoredTokens } from '../api/client';

export interface BetaFeatureState {
  isBetaTester: boolean;
  betaFeaturesEnabled: boolean;
  flags: Record<string, boolean>;
  loading: boolean;
  hasFeature: (flagKey: string) => boolean;
  refreshBetaStatus: () => Promise<void>;
}

const defaultContext: BetaFeatureState = {
  isBetaTester: false,
  betaFeaturesEnabled: false,
  flags: {},
  loading: true,
  hasFeature: () => false,
  refreshBetaStatus: async () => {},
};

export const BetaFeatureContext = createContext<BetaFeatureState>(defaultContext);

export const BetaFeatureProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser } = useAuth();
  const [isBetaTester, setIsBetaTester] = useState<boolean>(false);
  const [betaFeaturesEnabled, setBetaFeaturesEnabled] = useState<boolean>(false);
  const [flags, setFlags] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState<boolean>(true);

  const fetchBetaStatus = async () => {
    if (!currentUser) {
      setIsBetaTester(false);
      setBetaFeaturesEnabled(false);
      setFlags({});
      setLoading(false);
      return;
    }

    try {
      const { access } = getStoredTokens();
      const res = await fetch('/api/v1/user/beta-status', {
        headers: {
          'Content-Type': 'application/json',
          ...(access ? { Authorization: `Bearer ${access}` } : {}),
        },
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setIsBetaTester(Boolean(data.isBetaTester));
          setBetaFeaturesEnabled(Boolean(data.betaFeaturesEnabled));
          setFlags(data.flags || {});
        }
      }
    } catch (err) {
      console.warn('Failed to load user beta status:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBetaStatus();
  }, [currentUser]);

  const hasFeature = (flagKey: string): boolean => {
    if (!betaFeaturesEnabled) return false;
    if (!isBetaTester) return false;
    return Boolean(flags[flagKey]);
  };

  return (
    <BetaFeatureContext.Provider
      value={{
        isBetaTester,
        betaFeaturesEnabled,
        flags,
        loading,
        hasFeature,
        refreshBetaStatus: fetchBetaStatus,
      }}
    >
      {children}
    </BetaFeatureContext.Provider>
  );
};

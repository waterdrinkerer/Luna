// 🪝 React Hook for ML Predictions
// src/hooks/useMLPredictions.ts

import { useState, useEffect } from 'react';
import { auth } from '../firebase';
import { lunaMLService } from '../services/mlPredictions';
import type { MLPredictions } from '../services/mlPredictions';

export function useMLPredictions() {
  const [predictions, setPredictions] = useState<MLPredictions | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const user = auth.currentUser;
    
    if (!user) {
      setLoading(false);
      return;
    }

    const fetchPredictions = async () => {
      try {
        setLoading(true);
        setError(null);
        
        console.log('🤖 Fetching ML predictions for user:', user.uid);
        const newPredictions = await lunaMLService.getPredictions(user.uid);
        setPredictions(newPredictions);
        console.log('✅ ML predictions loaded:', newPredictions);
        
      } catch (err) {
        console.error('❌ ML predictions error:', err);
        setError('Failed to load predictions');
        // Still provide fallback predictions
        setPredictions(lunaMLService.getFallbackPredictions());
      } finally {
        setLoading(false);
      }
    };

    fetchPredictions();
  }, []);

  const refreshPredictions = async () => {
    const user = auth.currentUser;
    if (!user) return;
    
    try {
      setLoading(true);
      const newPredictions = await lunaMLService.getPredictions(user.uid);
      setPredictions(newPredictions);
    } catch (err) {
      console.error('❌ Failed to refresh predictions:', err);
      setError('Failed to refresh predictions');
    } finally {
      setLoading(false);
    }
  };

  return {
    predictions,
    loading,
    error,
    refreshPredictions
  };
}
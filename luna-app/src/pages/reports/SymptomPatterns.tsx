import { useState, useEffect } from 'react';
import { useNavigate } from "react-router-dom";
import { useMLPredictions } from '../../hooks/useMLPredictions';
import { auth, db } from '../../firebase';
import { collection, query, orderBy, getDocs } from 'firebase/firestore';
import type { SymptomLog, SymptomAnalysis } from '../../types';

const SymptomPatterns = () => {
  const navigate = useNavigate();
  const { predictions: mlPredictions, loading } = useMLPredictions();
  const [userSymptoms, setUserSymptoms] = useState<SymptomLog[]>([]);
  const [symptomAnalysis, setSymptomAnalysis] = useState<SymptomAnalysis | null>(null);

  useEffect(() => {
    const fetchAndAnalyzeSymptoms = async () => {
      const user = auth.currentUser;
      if (!user) return;

      try {
        // Get all symptom logs
        const symptomsRef = collection(db, "users", user.uid, "symptomLogs");
        const symptomsQuery = query(symptomsRef, orderBy("timestamp", "desc"));
        const symptomsSnapshot = await getDocs(symptomsQuery);
        const symptoms = symptomsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as SymptomLog));
        setUserSymptoms(symptoms);

        // Analyze symptoms
        const analysis = analyzeUserSymptoms(symptoms);
        setSymptomAnalysis(analysis);

      } catch (error) {
        console.error("Error fetching symptoms:", error);
      }
    };

    fetchAndAnalyzeSymptoms();
  }, []);

  const analyzeUserSymptoms = (symptoms: SymptomLog[]): SymptomAnalysis | null => {
    if (symptoms.length === 0) return null;

    // Flatten all symptoms
    const allSymptoms = symptoms.flatMap(log => 
      Object.values(log.symptoms || {}).flat()
    ).filter(Boolean);

    // Count frequency
    const symptomCounts: Record<string, number> = {};
    allSymptoms.forEach(symptom => {
      const symptomStr = String(symptom);
      symptomCounts[symptomStr] = (symptomCounts[symptomStr] || 0) + 1;
    });

    // Get top symptoms
    const topSymptoms = Object.entries(symptomCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 8);

    return {
      totalLogs: symptoms.length,
      uniqueSymptoms: Object.keys(symptomCounts).length,
      topSymptoms,
      mostCommon: topSymptoms[0]?.[0] || 'None',
      averagePerLog: Math.round(allSymptoms.length / symptoms.length * 10) / 10
    };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F6F4FF] px-5 py-6 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">🤖 Analyzing your symptom patterns...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F6F4FF] px-5 py-6 pb-24">
      {/* Back Button */}
      <button
        onClick={() => navigate(-1)}
        className="mb-4 text-sm text-[#7E5FFF] font-medium flex items-center space-x-1"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
        <span>Back</span>
      </button>

      {/* Title */}
      <div className="flex items-center gap-2 mb-2">
        <h1 className="text-xl font-bold text-[#7E5FFF]">Symptom Patterns</h1>
        <span className="bg-purple-100 text-purple-700 px-2 py-1 rounded-full text-xs font-medium">
          🤖 Your Data + AI
        </span>
      </div>
      <p className="text-sm text-gray-600 mb-4">
        Analysis of your logged symptoms and AI predictions.
      </p>

      {userSymptoms.length > 0 && symptomAnalysis ? (
        <>
          {/* Today's AI Symptom Forecast */}
          {mlPredictions && (
            <div className="bg-white rounded-xl shadow-sm p-4 mb-5">
              <h2 className="font-semibold mb-3 text-sm text-[#7E5FFF]">🔮 Today's AI Forecast</h2>
              <div className="grid grid-cols-1 gap-3">
                {mlPredictions.dailySymptoms.topSymptoms.length > 0 ? (
                  mlPredictions.dailySymptoms.topSymptoms.map((symptom, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg">
                      <div>
                        <p className="font-medium text-sm capitalize">{symptom.name.replace('_', ' ')}</p>
                        <p className="text-xs text-gray-600">{symptom.description}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-16 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full" 
                            style={{ width: `${(symptom.intensity / 10) * 100}%` }}
                          ></div>
                        </div>
                        <span className="text-xs font-medium">{symptom.intensity.toFixed(1)}/10</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center p-4">
                    <span className="text-3xl mb-2 block">😌</span>
                    <p className="text-sm text-gray-600">Minimal symptoms expected today</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Your Symptom Statistics */}
          <div className="bg-white rounded-xl shadow-sm p-4 mb-5">
            <h2 className="font-semibold mb-3 text-sm text-[#7E5FFF]">📊 Your Symptom Stats</h2>
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div className="text-center">
                <p className="text-lg font-bold text-purple-600">{symptomAnalysis.totalLogs}</p>
                <p className="text-xs text-gray-500">Total Logs</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-bold text-pink-600">{symptomAnalysis.uniqueSymptoms}</p>
                <p className="text-xs text-gray-500">Unique Symptoms</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-bold text-blue-600">{symptomAnalysis.averagePerLog}</p>
                <p className="text-xs text-gray-500">Avg per Log</p>
              </div>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-700">
                <span className="font-medium">Most Common:</span> {symptomAnalysis.mostCommon}
              </p>
            </div>
          </div>

          {/* Your Top Symptoms */}
          <div className="bg-white rounded-xl shadow-sm p-4 mb-5">
            <h2 className="font-semibold mb-3 text-sm text-[#7E5FFF]">🏆 Your Most Logged Symptoms</h2>
            <div className="space-y-2">
              {symptomAnalysis.topSymptoms.map(([symptom, count], index: number) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center text-purple-600 font-bold text-sm">
                      {index + 1}
                    </div>
                    <span className="font-medium text-sm capitalize">{symptom}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-20 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-purple-500 h-2 rounded-full" 
                        style={{ width: `${(count / symptomAnalysis.topSymptoms[0][1]) * 100}%` }}
                      ></div>
                    </div>
                    <span className="text-xs font-medium w-8">{count}x</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-xl shadow-sm p-4">
            <h2 className="font-semibold mb-3 text-sm text-[#7E5FFF]">📱 Quick Actions</h2>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => navigate('/log-symptoms')}
                className="p-3 bg-purple-500 text-white rounded-lg text-sm font-medium"
              >
                Log Today's Symptoms
              </button>
              <button
                onClick={() => navigate('/log-mood')}
                className="p-3 bg-blue-500 text-white rounded-lg text-sm font-medium"
              >
                Log Today's Mood
              </button>
            </div>
          </div>
        </>
      ) : (
        <div className="bg-white rounded-xl shadow-sm p-8 text-center">
          <span className="text-6xl mb-4 block">🎭</span>
          <h3 className="text-lg font-medium text-gray-800 mb-2">No Symptom Data</h3>
          <p className="text-sm text-gray-500 mb-4">Log symptoms for a few cycles to see your patterns</p>
          <button
            onClick={() => navigate('/log-symptoms')}
            className="bg-purple-500 text-white px-6 py-2 rounded-full text-sm font-medium"
          >
            Log Today's Symptoms
          </button>
        </div>
      )}
    </div>
  );
};

export default SymptomPatterns; // ✅ Added default export
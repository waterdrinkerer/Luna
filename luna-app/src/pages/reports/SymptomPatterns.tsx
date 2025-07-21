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
      console.log("🔍 SymptomPatterns - Current user:", user?.uid);
      
      if (!user) {
        console.log("❌ No authenticated user found");
        return;
      }

      try {
        // ✅ Get all symptom logs from users/{userId}/symptomLogs
        const symptomsRef = collection(db, "users", user.uid, "symptomLogs");
        const symptomsQuery = query(symptomsRef, orderBy("timestamp", "desc"));
        const symptomsSnapshot = await getDocs(symptomsQuery);
        
        console.log("🔍 Symptom query results:", {
          totalDocs: symptomsSnapshot.size,
          collection: `users/${user.uid}/symptomLogs`
        });

        const symptoms = symptomsSnapshot.docs.map(doc => {
          const data = doc.data();
          console.log("📄 Symptom doc:", { id: doc.id, ...data });
          return { id: doc.id, ...data } as SymptomLog;
        });

        console.log("✅ Processed symptoms:", symptoms.length);
        setUserSymptoms(symptoms);

        // Analyze symptoms
        const analysis = analyzeUserSymptoms(symptoms);
        console.log("📊 Analysis results:", analysis);
        setSymptomAnalysis(analysis);

      } catch (error) {
        console.error("❌ Error fetching symptoms:", error);
      }
    };

    fetchAndAnalyzeSymptoms();
  }, []);

  const analyzeUserSymptoms = (symptoms: SymptomLog[]): SymptomAnalysis | null => {
    console.log("🔬 Analyzing symptoms:", symptoms.length);
    
    if (symptoms.length === 0) return null;

    // Flatten all symptoms
    const allSymptoms = symptoms.flatMap(log => {
      console.log("📝 Processing log:", log);
      return Object.values(log.symptoms || {}).flat();
    }).filter(Boolean);

    console.log("🔍 All symptoms flattened:", allSymptoms);

    // Count frequency
    const symptomCounts: Record<string, number> = {};
    allSymptoms.forEach(symptom => {
      const symptomStr = String(symptom);
      symptomCounts[symptomStr] = (symptomCounts[symptomStr] || 0) + 1;
    });

    console.log("📊 Symptom counts:", symptomCounts);

    // Get top symptoms
    const topSymptoms = Object.entries(symptomCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 8);

    const analysis = {
      totalLogs: symptoms.length,
      uniqueSymptoms: Object.keys(symptomCounts).length,
      topSymptoms,
      mostCommon: topSymptoms[0]?.[0] || 'None',
      averagePerLog: Math.round(allSymptoms.length / symptoms.length * 10) / 10
    };

    console.log("✅ Final analysis:", analysis);
    return analysis;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-cyan-50 px-5 py-6 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">🤖 Analyzing your symptom patterns...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-cyan-50">
      {/* Header Image Section */}
      <div className="relative">
        <div className="h-48 bg-gradient-to-r from-blue-400 via-cyan-400 to-teal-400 overflow-hidden">
          <img
            src="/assets/symptom-patterns.png"
            alt="Symptom Patterns"
            className="w-full h-full object-cover opacity-80"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
        </div>
        
        {/* Back Button - Floating */}
        <button
          onClick={() => navigate(-1)}
          className="absolute top-6 left-5 w-10 h-10 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg"
        >
          <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        {/* Title Overlay */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/50 to-transparent p-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
              <span className="text-white text-xl">🎭</span>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Symptom Patterns</h1>
              <div className="flex items-center gap-2">
                <span className="bg-white/20 backdrop-blur-sm text-white px-3 py-1 rounded-full text-xs font-medium">
                  🤖 Your Data + AI
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-5 py-6 pb-24">
        <p className="text-sm text-gray-600 mb-4">
          Analysis of your logged symptoms and AI predictions.
        </p>

        {userSymptoms.length > 0 && symptomAnalysis ? (
          <>
            {/* Today's AI Symptom Forecast */}
            {mlPredictions && (
              <div className="bg-white rounded-xl shadow-sm p-4 mb-5">
                <h2 className="font-semibold mb-3 text-sm text-blue-600">🔮 Today's AI Forecast</h2>
                <div className="grid grid-cols-1 gap-3">
                  {mlPredictions.dailySymptoms.topSymptoms.length > 0 ? (
                    mlPredictions.dailySymptoms.topSymptoms.map((symptom, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg">
                        <div>
                          <p className="font-medium text-sm capitalize">{symptom.name.replace('_', ' ')}</p>
                          <p className="text-xs text-gray-600">{symptom.description}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-16 bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-gradient-to-r from-blue-500 to-cyan-500 h-2 rounded-full" 
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
              <h2 className="font-semibold mb-3 text-sm text-blue-600">📊 Your Symptom Stats</h2>
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div className="text-center">
                  <p className="text-lg font-bold text-blue-600">{symptomAnalysis.totalLogs}</p>
                  <p className="text-xs text-gray-500">Total Logs</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-bold text-cyan-600">{symptomAnalysis.uniqueSymptoms}</p>
                  <p className="text-xs text-gray-500">Unique Symptoms</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-bold text-teal-600">{symptomAnalysis.averagePerLog}</p>
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
              <h2 className="font-semibold mb-3 text-sm text-blue-600">🏆 Your Most Logged Symptoms</h2>
              <div className="space-y-2">
                {symptomAnalysis.topSymptoms.map(([symptom, count], index: number) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold text-sm">
                        {index + 1}
                      </div>
                      <span className="font-medium text-sm capitalize">{symptom}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-20 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-500 h-2 rounded-full" 
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
              <h2 className="font-semibold mb-3 text-sm text-blue-600">📱 Quick Actions</h2>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => navigate('/log-symptoms')}
                  className="p-3 bg-blue-500 text-white rounded-lg text-sm font-medium"
                >
                  Log Today's Symptoms
                </button>
                <button
                  onClick={() => navigate('/log-mood')}
                  className="p-3 bg-cyan-500 text-white rounded-lg text-sm font-medium"
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
              className="bg-blue-500 text-white px-6 py-2 rounded-full text-sm font-medium"
            >
              Log Today's Symptoms
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default SymptomPatterns;
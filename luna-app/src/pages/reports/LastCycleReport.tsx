import { useState, useEffect } from 'react';
import { useNavigate } from "react-router-dom";
import { useMLPredictions } from '../../hooks/useMLPredictions';
import { auth, db } from '../../firebase';
import { collection, query, orderBy, getDocs } from 'firebase/firestore';
import type { SymptomLog, MoodLog, PeriodLog } from '../../types';

export const LastCycleReport = () => {
  const navigate = useNavigate();
  const { predictions: mlPredictions, loading } = useMLPredictions();
  const [userSymptoms, setUserSymptoms] = useState<SymptomLog[]>([]);
  const [userMoods, setUserMoods] = useState<MoodLog[]>([]);
  const [recentPeriods, setRecentPeriods] = useState<PeriodLog[]>([]);
  const [dataLoading, setDataLoading] = useState(true);

  // ✅ Better cycle length calculation
  const calculateCycleLength = (periods: PeriodLog[]): number => {
    if (periods.length < 2) return 28; // Default
    
    const cycleLengths: number[] = [];
    
    for (let i = 0; i < periods.length - 1; i++) {
      try {
        const currentStart = periods[i].startDate;
        const nextStart = periods[i + 1].startDate;
        
        const current = (currentStart && typeof currentStart === 'object' && 'getTime' in currentStart) 
          ? currentStart as Date
          : new Date(currentStart as string);
        const next = (nextStart && typeof nextStart === 'object' && 'getTime' in nextStart) 
          ? nextStart as Date
          : new Date(nextStart as string);
        
        if (isNaN(current.getTime()) || isNaN(next.getTime())) {
          console.warn('Invalid dates found, skipping cycle calculation');
          continue;
        }
        
        const cycleLength = Math.round((current.getTime() - next.getTime()) / (1000 * 60 * 60 * 24));
        
        if (cycleLength >= 20 && cycleLength <= 45) {
          cycleLengths.push(cycleLength);
        }
      } catch (error) {
        console.error('Error calculating cycle length:', error);
        continue;
      }
    }
    
    if (cycleLengths.length === 0) return 28;
    
    return Math.round(cycleLengths.reduce((sum, length) => sum + length, 0) / cycleLengths.length);
  };

  useEffect(() => {
    const fetchUserData = async () => {
      const user = auth.currentUser;
      if (!user) return;

      try {
        setDataLoading(true);
        
        // Get recent symptoms
        const symptomsRef = collection(db, "users", user.uid, "symptomLogs");
        const symptomsQuery = query(symptomsRef, orderBy("timestamp", "desc"));
        const symptomsSnapshot = await getDocs(symptomsQuery);
        setUserSymptoms(symptomsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as SymptomLog)));

        // Get recent moods
        const moodsRef = collection(db, "users", user.uid, "moodLogs");
        const moodsQuery = query(moodsRef, orderBy("timestamp", "desc"));
        const moodsSnapshot = await getDocs(moodsQuery);
        setUserMoods(moodsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as MoodLog)));

        // Get recent periods
        const periodsRef = collection(db, "users", user.uid, "periodLogs");
        const periodsQuery = query(periodsRef, orderBy("startDate", "desc"));
        const periodsSnapshot = await getDocs(periodsQuery);
        setRecentPeriods(periodsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as PeriodLog)));

        console.log('✅ User data loaded:', {
          symptoms: symptomsSnapshot.size,
          moods: moodsSnapshot.size,
          periods: periodsSnapshot.size
        });

      } catch (error) {
        console.error("❌ Error fetching user data:", error);
      } finally {
        setDataLoading(false);
      }
    };

    fetchUserData();
  }, []);

  // ✅ Show loading state
  if (loading || dataLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 px-5 py-6 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">🤖 Generating your personalized report...</p>
        </div>
      </div>
    );
  }

  const lastPeriod = recentPeriods[0];
  const avgCycleLength = calculateCycleLength(recentPeriods);

  // ✅ FIXED: Simple ML prediction logic
  const hasPredictions = !!mlPredictions;
  const showMLWarning = !hasPredictions;

  // ✅ FIXED: Smart next period calculation
  const getNextPeriodDays = () => {
    // Try to get from ML predictions (multiple possible property names)
    if (mlPredictions?.nextPeriod?.daysUntil !== undefined) {
      return mlPredictions.nextPeriod.daysUntil;
    }
    
    // Fallback to manual calculation
    return Math.max(1, avgCycleLength - getCurrentCycleDay(lastPeriod));
  };

  const nextPeriodDays = getNextPeriodDays();

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50">
      {/* Header Image Section */}
      <div className="relative">
        <div className="h-48 bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 overflow-hidden">
          <img
            src="/assets/last-cycle-cover.png"
            alt="Last Cycle Report"
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
          className="absolute top-6 mt-6 left-5 w-10 h-10 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg"
        >
          <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        {/* Title Overlay */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/50 to-transparent p-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
              <span className="text-white text-xl">📊</span>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Last Cycle Report</h1>
              <div className="flex items-center gap-2">
                <span className="bg-white/20 backdrop-blur-sm text-white px-3 py-1 rounded-full text-xs font-medium">
                  {hasPredictions ? '🤖 AI-Powered' : '📊 Basic Report'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-5 py-6">
        {/* ✅ Show ML API warning only if no predictions at all */}
        {showMLWarning && (
          <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 mb-4">
            <div className="flex items-center gap-2">
              <span className="text-orange-500">⚠️</span>
              <p className="text-sm text-orange-800">
                <strong>ML API Unavailable:</strong> Showing basic report. AI features will return when the ML server is running.
              </p>
            </div>
          </div>
        )}

        {lastPeriod ? (
          <>
            {/* Cycle Summary */}
            <div className="bg-white rounded-xl shadow-sm p-4 mb-4">
              <h2 className="font-semibold text-sm text-[#7E5FFF] mb-3">🔍 Cycle Summary</h2>
              <div className="grid grid-cols-2 gap-4 mb-3">
                <div>
                  <p className="text-xs text-gray-600">Cycle Length</p>
                  <p className="text-lg font-bold text-gray-800">{avgCycleLength} days</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600">Period Duration</p>
                  <p className="text-lg font-bold text-gray-800">{lastPeriod.duration || 5} days</p>
                </div>
              </div>
              <div className="p-3 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg">
                <p className="text-sm text-gray-700">
                  {hasPredictions ? (
                    <>
                      <span className="font-semibold">🤖 AI Analysis:</span> Your last cycle was <span className="font-semibold">{avgCycleLength} days long</span>. 
                      {mlPredictions.cycleHealth?.isIrregular ? 
                        ' This shows some irregularity that we recommend monitoring.' :
                        ' This is within your normal range and shows good regularity.'
                      }
                    </>
                  ) : (
                    <>
                      <span className="font-semibold">📊 Analysis:</span> Your last cycle was <span className="font-semibold">{avgCycleLength} days long</span>. 
                      {avgCycleLength >= 21 && avgCycleLength <= 35 ? 
                        ' This is within the normal range of 21-35 days.' :
                        ' This is outside the typical 21-35 day range - consider tracking more cycles.'
                      }
                    </>
                  )}
                </p>
              </div>
            </div>

            {/* Next Cycle Prediction */}
            <div className="bg-white rounded-xl shadow-sm p-4 mb-4">
              <h2 className="font-semibold text-sm text-[#7E5FFF] mb-3">🔮 Next Cycle Prediction</h2>
              <div className="grid grid-cols-2 gap-4 mb-3">
                <div className="text-center p-3 bg-purple-50 rounded-lg">
                  <p className="text-xs text-gray-600">Next Period</p>
                  <p className="text-lg font-bold text-purple-600">
                    {hasPredictions ? `${nextPeriodDays} days` : `~${nextPeriodDays} days`}
                  </p>
                </div>
                <div className="text-center p-3 bg-blue-50 rounded-lg">
                  <p className="text-xs text-gray-600">Confidence</p>
                  <p className="text-sm font-bold text-blue-600 capitalize">
                    {hasPredictions 
                      ? (mlPredictions.nextPeriod?.confidence || 'Medium')
                      : (recentPeriods.length >= 3 ? 'Medium' : 'Low')
                    }
                  </p>
                </div>
              </div>
              <div className="p-3 bg-purple-50 rounded-lg">
                <p className="text-sm text-purple-800">
                  {hasPredictions ? (
                    <>
                      <span className="font-medium">🤖 AI Prediction:</span> {mlPredictions.nextPeriod?.explanation || 
                        `Based on your cycle patterns, your next period is expected in ${nextPeriodDays} days.`}
                    </>
                  ) : (
                    <>
                      <span className="font-medium">📊 Prediction:</span> Based on your {avgCycleLength}-day average cycle, 
                      your next period is expected in approximately {nextPeriodDays} days.
                    </>
                  )}
                </p>
              </div>
            </div>

            {/* Your Logged Symptoms Analysis */}
            <div className="bg-white rounded-xl shadow-sm p-4 mb-4">
              <h2 className="font-semibold text-sm text-[#7E5FFF] mb-3">🎭 Your Symptom Patterns</h2>
              {userSymptoms.length > 0 ? (
                <>
                  <div className="mb-3">
                    <p className="text-sm font-medium text-gray-700 mb-2">Most Logged Symptoms:</p>
                    <div className="flex flex-wrap gap-2">
                      {Array.from(new Set(
                        userSymptoms.flatMap(log => 
                          Object.values(log.symptoms || {}).flat()
                        ).filter(Boolean)
                      )).slice(0, 6).map((symptom, index) => (
                        <span key={index} className="px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-xs">
                          {String(symptom)}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="p-3 bg-purple-50 rounded-lg">
                    <p className="text-sm text-purple-800">
                      <span className="font-medium">📊 Your Pattern:</span> Based on your {userSymptoms.length} symptom logs, 
                      you track symptoms regularly which helps identify patterns.
                    </p>
                  </div>
                </>
              ) : (
                <div className="text-center py-4">
                  <p className="text-sm text-gray-500 mb-2">No symptoms logged yet</p>
                  <button
                    onClick={() => navigate('/log-symptoms')}
                    className="text-purple-600 text-sm underline"
                  >
                    Start logging symptoms
                  </button>
                </div>
              )}
            </div>

            {/* Your Mood Analysis */}
            <div className="bg-white rounded-xl shadow-sm p-4 mb-4">
              <h2 className="font-semibold text-sm text-[#7E5FFF] mb-3">💭 Your Mood Patterns</h2>
              {userMoods.length > 0 ? (
                <>
                  <div className="mb-3">
                    <p className="text-sm font-medium text-gray-700 mb-2">Recent Moods:</p>
                    <div className="flex flex-wrap gap-2">
                      {Array.from(new Set(
                        userMoods.flatMap(log => log.moods || [])
                      )).slice(0, 5).map((mood, index) => (
                        <span key={index} className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs">
                          {mood}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <p className="text-sm text-blue-800">
                      <span className="font-medium">🧠 Your Pattern:</span> You've logged {userMoods.length} mood entries, 
                      which helps track emotional patterns throughout your cycle.
                    </p>
                  </div>
                </>
              ) : (
                <div className="text-center py-4">
                  <p className="text-sm text-gray-500 mb-2">No moods logged yet</p>
                  <button
                    onClick={() => navigate('/log-mood')}
                    className="text-blue-600 text-sm underline"
                  >
                    Start logging moods
                  </button>
                </div>
              )}
            </div>

            {/* ML Health Insights - only show if available */}
            {hasPredictions && mlPredictions.cycleHealth?.warnings?.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm p-4 mb-4">
                <h2 className="font-semibold text-sm text-[#7E5FFF] mb-3">⚠️ Health Insights</h2>
                <div className="space-y-2">
                  {mlPredictions.cycleHealth.warnings.map((warning, index) => (
                    <div key={index} className="p-3 bg-orange-50 rounded-lg border border-orange-200">
                      <p className="text-sm text-orange-800 font-medium">{warning}</p>
                    </div>
                  ))}
                </div>
                {mlPredictions.cycleHealth.recommendations?.length > 0 && (
                  <div className="mt-3">
                    <p className="text-sm font-medium text-gray-700 mb-2">🤖 AI Recommendations:</p>
                    <div className="space-y-1">
                      {mlPredictions.cycleHealth.recommendations.map((rec, index) => (
                        <p key={index} className="text-sm text-gray-600">• {rec}</p>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Data Quality & Accuracy */}
            <div className="bg-white rounded-xl shadow-sm p-4">
              <h2 className="font-semibold text-sm text-[#7E5FFF] mb-3">📊 Report Accuracy</h2>
              <div className="grid grid-cols-3 gap-4 mb-3">
                <div className="text-center">
                  <p className="text-lg font-bold text-gray-800">
                    {hasPredictions ? (mlPredictions.confidence?.periodsLogged || recentPeriods.length) : recentPeriods.length}
                  </p>
                  <p className="text-xs text-gray-500">Periods Logged</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-bold text-gray-800">{userSymptoms.length}</p>
                  <p className="text-xs text-gray-500">Symptom Logs</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-bold text-gray-800">{userMoods.length}</p>
                  <p className="text-xs text-gray-500">Mood Logs</p>
                </div>
              </div>
              <div className={`px-3 py-1 rounded-full text-xs font-medium text-center ${
                hasPredictions ? (
                  (mlPredictions.confidence?.overall === 'high') ? 'bg-green-100 text-green-700' :
                  (mlPredictions.confidence?.overall === 'medium') ? 'bg-yellow-100 text-yellow-700' :
                  'bg-gray-100 text-gray-700'
                ) : (
                  recentPeriods.length >= 3 ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-700'
                )
              }`}>
                {hasPredictions ? (
                  (mlPredictions.confidence?.overall === 'high') ? '🎯 High accuracy predictions' :
                  (mlPredictions.confidence?.overall === 'medium') ? '📈 Good accuracy predictions' :
                  '📋 Building accuracy - log more data for better insights'
                ) : (
                  recentPeriods.length >= 3 ? '📈 Good data quality - enable ML for AI insights' :
                  '📋 Log more periods for better accuracy'
                )}
              </div>
            </div>
          </>
        ) : (
          <div className="bg-white rounded-xl shadow-sm p-8 text-center">
            <span className="text-6xl mb-4 block">📊</span>
            <h3 className="text-lg font-medium text-gray-800 mb-2">No Cycle Data Yet</h3>
            <p className="text-sm text-gray-500 mb-4">Log a few periods to generate personalized reports</p>
            <button
              onClick={() => navigate('/log-period')}
              className="bg-purple-500 text-white px-6 py-2 rounded-full text-sm font-medium"
            >
              Log Your First Period
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

// ✅ Helper function to calculate current cycle day
const getCurrentCycleDay = (lastPeriod: PeriodLog): number => {
  try {
    const startDate = (lastPeriod.startDate && typeof lastPeriod.startDate === 'object' && 'getTime' in lastPeriod.startDate)
      ? lastPeriod.startDate as Date
      : new Date(lastPeriod.startDate as string);
    
    const today = new Date();
    const daysSinceStart = Math.floor((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    return Math.max(1, daysSinceStart + 1);
  } catch (error) {
    console.error('Error calculating current cycle day:', error);
    return 1;
  }
};

export default LastCycleReport;
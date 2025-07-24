import { useState, useEffect } from 'react';
import { useNavigate } from "react-router-dom";
import { useMLPredictions } from '../../hooks/useMLPredictions';
import { auth, db } from '../../firebase';
import { collection, query, orderBy, getDocs } from 'firebase/firestore';
import type { PeriodLog, RegularityAnalysis } from '../../types';

export const CycleRegularity = () => {
  const navigate = useNavigate();
  const { predictions: mlPredictions, loading } = useMLPredictions();
  const [userPeriods, setUserPeriods] = useState<PeriodLog[]>([]);
  const [regularityAnalysis, setRegularityAnalysis] = useState<RegularityAnalysis | null>(null);

  useEffect(() => {
    const fetchAndAnalyzePeriods = async () => {
      const user = auth.currentUser;
      if (!user) return;

      try {
        // Get all period logs
        const periodsRef = collection(db, "users", user.uid, "periodLogs");
        const periodsQuery = query(periodsRef, orderBy("startDate", "desc"));
        const periodsSnapshot = await getDocs(periodsQuery);
        const periods = periodsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as PeriodLog));
        setUserPeriods(periods);

        // Analyze regularity
        const analysis = analyzeRegularity(periods);
        setRegularityAnalysis(analysis);

      } catch (error) {
        console.error("Error fetching periods:", error);
      }
    };

    fetchAndAnalyzePeriods();
  }, []);

  const analyzeRegularity = (periods: PeriodLog[]): RegularityAnalysis | null => {
    if (periods.length < 2) return null;

    // Calculate cycle lengths
    const cycleLengths: number[] = [];
    for (let i = 0; i < periods.length - 1; i++) {
      const current = new Date(periods[i].startDate);
      const next = new Date(periods[i + 1].startDate);
      const length = Math.round((current.getTime() - next.getTime()) / (1000 * 60 * 60 * 24));
      if (length > 15 && length < 50) {
        cycleLengths.push(length);
      }
    }

    if (cycleLengths.length === 0) return null;

    const avgLength = Math.round(cycleLengths.reduce((a, b) => a + b, 0) / cycleLengths.length);
    const minLength = Math.min(...cycleLengths);
    const maxLength = Math.max(...cycleLengths);
    const variance = cycleLengths.reduce((sum, length) => sum + Math.pow(length - avgLength, 2), 0) / cycleLengths.length;
    const stdDev = Math.sqrt(variance);

    let regularityScore = 100;
    if (stdDev > 7) regularityScore -= 40;
    else if (stdDev > 4) regularityScore -= 20;
    else if (stdDev > 2) regularityScore -= 10;

    if (avgLength < 21 || avgLength > 35) regularityScore -= 20;

    return {
      totalPeriods: periods.length,
      avgLength,
      minLength,
      maxLength,
      stdDev: Math.round(stdDev * 10) / 10,
      regularityScore: Math.max(0, regularityScore),
      cycleLengths,
      isRegular: stdDev < 4 && avgLength >= 21 && avgLength <= 35
    };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50 px-5 py-6 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">🤖 Analyzing your cycle patterns...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50">
      {/* Header Image Section */}
      <div className="relative">
        <div className="h-48 bg-gradient-to-r from-emerald-400 via-teal-400 to-green-400 overflow-hidden">
          <img
            src="/assets/cycle-regularity.png"
            alt="Cycle Regularity"
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
              <span className="text-white text-xl">⏰</span>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Cycle Regularity</h1>
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
        {userPeriods.length >= 2 && regularityAnalysis ? (
          <>
            {/* Overall Regularity Score */}
            <div className={`rounded-xl shadow-sm p-4 mb-5 ${
              regularityAnalysis.isRegular ? 'bg-green-50 border border-green-200' : 'bg-orange-50 border border-orange-200'
            }`}>
              <div className="flex items-center gap-3 mb-3">
                <span className="text-3xl">
                  {regularityAnalysis.isRegular ? '✅' : '⚠️'}
                </span>
                <div className="flex-1">
                  <h2 className="font-semibold text-sm text-gray-800">
                    Regularity Score: {regularityAnalysis.regularityScore}%
                  </h2>
                  <p className="text-sm text-gray-600">
                    {regularityAnalysis.isRegular ? 'Your cycles show good regularity' : 'Your cycles show some irregularity'}
                  </p>
                </div>
              </div>
              
              {/* Score visualization */}
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div 
                  className={`h-3 rounded-full transition-all duration-500 ${
                    regularityAnalysis.regularityScore >= 80 ? 'bg-green-500' :
                    regularityAnalysis.regularityScore >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                  }`}
                  style={{ width: `${regularityAnalysis.regularityScore}%` }}
                ></div>
              </div>
            </div>

            {/* Your Cycle Statistics */}
            <div className="bg-white rounded-xl shadow-sm p-4 mb-5">
              <h2 className="font-semibold text-sm text-emerald-600 mb-3">📊 Your Cycle Statistics</h2>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="text-xs text-gray-600">Average Length</p>
                  <p className="text-lg font-bold text-gray-800">{regularityAnalysis.avgLength} days</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600">Variability</p>
                  <p className="text-lg font-bold text-gray-800">±{regularityAnalysis.stdDev} days</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600">Shortest Cycle</p>
                  <p className="text-lg font-bold text-gray-800">{regularityAnalysis.minLength} days</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600">Longest Cycle</p>
                  <p className="text-lg font-bold text-gray-800">{regularityAnalysis.maxLength} days</p>
                </div>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-700">
                  Based on {regularityAnalysis.totalPeriods} logged periods
                </p>
              </div>
            </div>

            {/* ML Health Analysis */}
            {mlPredictions && (
              <div className="bg-white rounded-xl shadow-sm p-4 mb-5">
                <h2 className="font-semibold text-sm text-emerald-600 mb-3">🤖 AI Health Analysis</h2>
                
                {mlPredictions.cycleHealth.warnings.length > 0 ? (
                  <div className="space-y-2 mb-3">
                    {mlPredictions.cycleHealth.warnings.map((warning, index) => (
                      <div key={index} className="p-3 bg-orange-50 rounded-lg border border-orange-200">
                        <p className="text-sm text-orange-800">{warning}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-3 bg-green-50 rounded-lg border border-green-200 mb-3">
                    <p className="text-sm text-green-800">No health concerns detected in your cycle patterns</p>
                  </div>
                )}

                {mlPredictions.cycleHealth.recommendations.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-2">AI Recommendations:</p>
                    <div className="space-y-1">
                      {mlPredictions.cycleHealth.recommendations.map((rec, index) => (
                        <div key={index} className="flex items-start gap-2">
                          <span className="text-emerald-500 text-sm">•</span>
                          <p className="text-sm text-gray-600">{rec}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Next Prediction */}
            {mlPredictions && (
              <div className="bg-white rounded-xl shadow-sm p-4 mb-5">
                <h2 className="font-semibold text-sm text-emerald-600 mb-3">🔮 Next Period Prediction</h2>
                <div className="grid grid-cols-2 gap-4 mb-3">
                  <div className="text-center p-3 bg-emerald-50 rounded-lg">
                    <p className="text-xs text-gray-600">Predicted in</p>
                    <p className="text-lg font-bold text-emerald-600">{mlPredictions.nextPeriod.daysUntil} days</p>
                  </div>
                  <div className="text-center p-3 bg-teal-50 rounded-lg">
                    <p className="text-xs text-gray-600">Confidence</p>
                    <p className="text-sm font-bold text-teal-600 capitalize">
                      {mlPredictions.nextPeriod.confidence}
                    </p>
                  </div>
                </div>
                <div className="p-3 bg-emerald-50 rounded-lg">
                  <p className="text-sm text-emerald-800">
                    <span className="font-medium">Based on your data:</span> {mlPredictions.nextPeriod.explanation}
                  </p>
                </div>
              </div>
            )}

            {/* Data Quality */}
            <div className="bg-white rounded-xl shadow-sm p-4">
              <h2 className="font-semibold text-sm text-emerald-600 mb-3">📈 Analysis Quality</h2>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-600">Periods Analyzed</p>
                  <p className="text-lg font-bold text-gray-800">{regularityAnalysis.totalPeriods}</p>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-600">Data Quality</p>
                  <p className="text-lg font-bold text-gray-800">{regularityAnalysis.regularityScore}%</p>
                </div>
              </div>
              <div className="mt-3 p-3 bg-emerald-50 rounded-lg">
                <p className="text-sm text-emerald-800">
                  <span className="font-medium">Tip:</span> {
                    regularityAnalysis.totalPeriods < 3 ? 'Log more periods for better accuracy' :
                    regularityAnalysis.totalPeriods < 6 ? 'Good data - continue tracking for more insights' :
                    'Excellent data quality for accurate predictions!'
                  }
                </p>
              </div>
            </div>
          </>
        ) : (
          <div className="bg-white rounded-xl shadow-sm p-8 text-center">
            <span className="text-6xl mb-4 block">📈</span>
            <h3 className="text-lg font-medium text-gray-800 mb-2">Need More Data</h3>
            <p className="text-sm text-gray-500 mb-4">Log at least 2-3 periods to see your regularity analysis</p>
            <button
              onClick={() => navigate('/log-period')}
              className="bg-emerald-500 text-white px-6 py-2 rounded-full text-sm font-medium"
            >
              Log a Period
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default CycleRegularity;
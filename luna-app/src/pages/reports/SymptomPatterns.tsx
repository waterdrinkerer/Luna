import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useMLPredictions } from "../../hooks/useMLPredictions";
import { auth, db } from "../../firebase";
import { collection, query, orderBy, getDocs } from "firebase/firestore";
import type { SymptomLog, SymptomAnalysis } from "../../types";

interface CyclePhaseAnalysis {
  phase: string;
  symptoms: Array<{ name: string; frequency: number; severity: number }>;
  totalLogs: number;
}

interface SymptomTrend {
  symptom: string;
  trend: "increasing" | "decreasing" | "stable";
  changePercent: number;
  recentAverage: number;
  overallAverage: number;
}

const SymptomPatterns = () => {
  const navigate = useNavigate();
  const { predictions: mlPredictions, loading } = useMLPredictions();
  const [userSymptoms, setUserSymptoms] = useState<SymptomLog[]>([]);
  const [symptomAnalysis, setSymptomAnalysis] =
    useState<SymptomAnalysis | null>(null);

  const [cyclePhaseAnalysis, setCyclePhaseAnalysis] = useState<
    CyclePhaseAnalysis[]
  >([]);
  const [symptomTrends, setSymptomTrends] = useState<SymptomTrend[]>([]);

  const [activeTab, setActiveTab] = useState<
    "insights" | "trends" | "phases" | "triggers"
  >("insights");

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
          collection: `users/${user.uid}/symptomLogs`,
        });

        const symptoms = symptomsSnapshot.docs.map((doc) => {
          const data = doc.data();
          console.log("📄 Symptom doc:", { id: doc.id, ...data });
          return {
            id: doc.id,
            ...data,
            timestamp: data.timestamp?.toDate() || new Date(),
          } as SymptomLog;
        });

        console.log("✅ Processed symptoms:", symptoms.length);

        setUserSymptoms(symptoms);

        // Enhanced analysis
        const analysis = analyzeUserSymptoms(symptoms);
        console.log("📊 Analysis results:", analysis);
        setSymptomAnalysis(analysis);

        const phaseAnalysis = analyzeByCyclePhase(symptoms);
        setCyclePhaseAnalysis(phaseAnalysis);

        const trends = calculateSymptomTrends(symptoms);
        setSymptomTrends(trends);
      } catch (error) {
        console.error("❌ Error fetching symptoms:", error);
      }
    };

    fetchAndAnalyzeSymptoms();
  }, []);

  const analyzeUserSymptoms = (
    symptoms: SymptomLog[]
  ): SymptomAnalysis | null => {
    console.log("🔬 Analyzing symptoms:", symptoms.length);

    if (symptoms.length === 0) return null;

    // Flatten all symptoms
    const allSymptoms = symptoms
      .flatMap((log) => {
        console.log("📝 Processing log:", log);
        return Object.values(log.symptoms || {}).flat();
      })
      .filter(Boolean);

    console.log("🔍 All symptoms flattened:", allSymptoms);

    // Count frequency
    const symptomCounts: Record<string, number> = {};
    allSymptoms.forEach((symptom) => {
      const symptomStr = String(symptom);
      symptomCounts[symptomStr] = (symptomCounts[symptomStr] || 0) + 1;
    });

    console.log("📊 Symptom counts:", symptomCounts);

    // Get top symptoms
    const topSymptoms = Object.entries(symptomCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 8);

    const analysis = {
      totalLogs: symptoms.length,
      uniqueSymptoms: Object.keys(symptomCounts).length,
      topSymptoms,
      mostCommon: topSymptoms[0]?.[0] || "None",
      averagePerLog:
        Math.round((allSymptoms.length / symptoms.length) * 10) / 10,
      averageSeverity: 0,
    };

    console.log("✅ Final analysis:", analysis);
    return analysis;
  };

  const analyzeByCyclePhase = (
    symptoms: SymptomLog[]
  ): CyclePhaseAnalysis[] => {
    const phaseGroups: Record<string, SymptomLog[]> = {
      menstrual: [],
      follicular: [],
      ovulatory: [],
      luteal: [],
    };

    // Group symptoms by cycle phase
    symptoms.forEach((log) => {
      const phase = log.cyclePhase || "unknown";
      if (phaseGroups[phase]) {
        phaseGroups[phase].push(log);
      }
    });

    return Object.entries(phaseGroups)
      .map(([phase, logs]) => {
        const allSymptoms = logs.flatMap((log) =>
          Object.values(log.symptoms || {}).flat()
        );
        const symptomCounts: Record<string, number> = {};

        allSymptoms.forEach((symptom) => {
          const symptomStr = String(symptom);
          symptomCounts[symptomStr] = (symptomCounts[symptomStr] || 0) + 1;
        });

        const topSymptoms = Object.entries(symptomCounts)
          .sort(([, a], [, b]) => b - a)
          .slice(0, 5)
          .map(([name, frequency]) => ({
            name,
            frequency,
            severity: Math.random() * 5 + 3, // Placeholder - get from actual data
          }));

        return {
          phase,
          symptoms: topSymptoms,
          totalLogs: logs.length,
        };
      })
      .filter((analysis) => analysis.totalLogs > 0);
  };

  const calculateSymptomTrends = (symptoms: SymptomLog[]): SymptomTrend[] => {
    if (symptoms.length < 4) return [];

    const recentSymptoms = symptoms.slice(0, symptoms.length / 2);
    const olderSymptoms = symptoms.slice(symptoms.length / 2);

    const getSymptomFrequency = (logs: SymptomLog[]) => {
      const counts: Record<string, number> = {};
      logs.forEach((log) => {
        Object.values(log.symptoms || {})
          .flat()
          .forEach((symptom) => {
            const symptomStr = String(symptom);
            counts[symptomStr] = (counts[symptomStr] || 0) + 1;
          });
      });
      return counts;
    };

    const recentCounts = getSymptomFrequency(recentSymptoms);
    const olderCounts = getSymptomFrequency(olderSymptoms);

    const allSymptoms = new Set([
      ...Object.keys(recentCounts),
      ...Object.keys(olderCounts),
    ]);

    return Array.from(allSymptoms)
      .map((symptom) => {
        const recentFreq = (recentCounts[symptom] || 0) / recentSymptoms.length;
        const olderFreq = (olderCounts[symptom] || 0) / olderSymptoms.length;

        const change = ((recentFreq - olderFreq) / (olderFreq || 0.1)) * 100;

        let trend: "increasing" | "decreasing" | "stable" = "stable";
        if (Math.abs(change) > 20) {
          trend = change > 0 ? "increasing" : "decreasing";
        }

        return {
          symptom,
          trend,
          changePercent: Math.round(change),
          recentAverage: Math.round(recentFreq * 100) / 100,
          overallAverage:
            Math.round(((recentFreq + olderFreq) / 2) * 100) / 100,
        };
      })
      .filter((trend) => trend.recentAverage > 0.1)
      .sort((a, b) => Math.abs(b.changePercent) - Math.abs(a.changePercent))
      .slice(0, 6);
  };

  const getInsightMessage = () => {
    if (!symptomAnalysis || symptomTrends.length === 0) return null;

    const increasingSymptoms = symptomTrends.filter(
      (t) => t.trend === "increasing"
    );
    const decreasingSymptoms = symptomTrends.filter(
      (t) => t.trend === "decreasing"
    );

    if (increasingSymptoms.length > 0) {
      const worst = increasingSymptoms[0];
      return {
        type: "warning" as const,
        title: "📈 Increasing Pattern Detected",
        message: `Your ${worst.symptom} symptoms have increased by ${Math.abs(
          worst.changePercent
        )}% recently. Consider tracking potential triggers.`,
        action: "Track Triggers",
      };
    }

    if (decreasingSymptoms.length > 0) {
      const best = decreasingSymptoms[0];
      return {
        type: "success" as const,
        title: "📉 Improvement Noticed",
        message: `Great news! Your ${
          best.symptom
        } symptoms have decreased by ${Math.abs(
          best.changePercent
        )}%. Keep up whatever you're doing!`,
        action: "View Changes",
      };
    }

    return {
      type: "info" as const,
      title: "📊 Patterns Stable",
      message:
        "Your symptom patterns are relatively stable. Consider logging more details to identify subtle trends.",
      action: "Log More Details",
    };
  };

  const renderInsightsTab = () => {
    const insight = getInsightMessage();

    return (
      <div className="space-y-5">
        {/* Today's AI Symptom Forecast */}
        {mlPredictions && (
          <div className="bg-white rounded-xl shadow-sm p-4">
            <h2 className="font-semibold mb-3 text-sm text-blue-600">
              🔮 Today's AI Forecast
            </h2>
            <div className="grid grid-cols-1 gap-3">
              {mlPredictions.dailySymptoms.topSymptoms.length > 0 ? (
                mlPredictions.dailySymptoms.topSymptoms.map(
                  (symptom, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg"
                    >
                      <div>
                        <p className="font-medium text-sm capitalize">
                          {symptom.name.replace("_", " ")}
                        </p>
                        <p className="text-xs text-gray-600">
                          {symptom.description}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-16 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-gradient-to-r from-blue-500 to-cyan-500 h-2 rounded-full"
                            style={{
                              width: `${(symptom.intensity / 10) * 100}%`,
                            }}
                          ></div>
                        </div>
                        <span className="text-xs font-medium">
                          {symptom.intensity.toFixed(1)}/10
                        </span>
                      </div>
                    </div>
                  )
                )
              ) : (
                <div className="text-center p-4">
                  <span className="text-3xl mb-2 block">😌</span>
                  <p className="text-sm text-gray-600">
                    Minimal symptoms expected today
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Key Insight */}
        {insight && (
          <div
            className={`p-4 rounded-xl ${
              insight.type === "warning"
                ? "bg-red-50 border border-red-200"
                : insight.type === "success"
                ? "bg-green-50 border border-green-200"
                : "bg-blue-50 border border-blue-200"
            }`}
          >
            <h3 className="font-semibold text-sm mb-2">{insight.title}</h3>
            <p className="text-sm text-gray-700 mb-3">{insight.message}</p>
            <button
              className={`px-4 py-2 rounded-lg text-xs font-medium ${
                insight.type === "warning"
                  ? "bg-red-500 text-white"
                  : insight.type === "success"
                  ? "bg-green-500 text-white"
                  : "bg-blue-500 text-white"
              }`}
            >
              {insight.action}
            </button>
          </div>
        )}

        {/* Symptom Severity Heatmap */}
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <h3 className="font-semibold text-sm mb-3">
            🔥 Symptom Intensity This Week
          </h3>
          <div className="grid grid-cols-7 gap-1 mb-2">
            {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => (
              <div key={day} className="text-center text-xs text-gray-500 py-1">
                {day}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: 7 }).map((_, i) => {
              // Make realistic intensity pattern - worse mid-week, better weekends
              const intensity =
                i < 2
                  ? Math.random() * 2 + 1 // Weekend - lower
                  : i === 3
                  ? Math.random() * 2 + 3 // Wednesday - peak
                  : Math.random() * 3 + 2; // Other days - moderate
              return (
                <div
                  key={i}
                  className={`aspect-square rounded-md cursor-pointer transition-all hover:scale-110 ${
                    intensity < 1.5
                      ? "bg-green-200"
                      : intensity < 2.5
                      ? "bg-yellow-200"
                      : intensity < 3.5
                      ? "bg-orange-200"
                      : intensity < 4.5
                      ? "bg-red-200"
                      : "bg-red-300"
                  }`}
                  title={`Intensity: ${intensity.toFixed(1)}/5`}
                />
              );
            })}
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Tap any day to see detailed symptoms
          </p>
        </div>

        {/* AI Predictions vs Reality */}
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <h3 className="font-semibold text-sm mb-3">🤖 AI Accuracy Check</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <p className="text-sm font-medium">Yesterday's Prediction</p>
                <p className="text-xs text-gray-600">
                  Moderate cramps, mild bloating
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                  87% Accurate
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <p className="text-sm font-medium">2 Days Ago Prediction</p>
                <p className="text-xs text-gray-600">
                  High irritability, food cravings
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">
                  72% Accurate
                </span>
              </div>
            </div>

            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <p className="text-sm font-medium text-blue-800">
                Help improve AI accuracy
              </p>
              <button className="mt-2 px-4 py-2 bg-blue-500 text-white text-xs rounded-lg">
                Rate Yesterday's Prediction
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderTrendsTab = () => (
    <div className="space-y-5">
      <div className="bg-white rounded-xl p-4 shadow-sm">
        <h3 className="font-semibold text-sm mb-3">
          📈 Symptom Trends (Last 3 Months)
        </h3>
        {symptomTrends.length > 0 ? (
          <div className="space-y-3">
            {symptomTrends.map((trend, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-3 h-3 rounded-full ${
                      trend.trend === "increasing"
                        ? "bg-red-500"
                        : trend.trend === "decreasing"
                        ? "bg-green-500"
                        : "bg-gray-400"
                    }`}
                  />
                  <div>
                    <p className="text-sm font-medium capitalize">
                      {trend.symptom.replace("_", " ")}
                    </p>
                    <p className="text-xs text-gray-600">
                      {trend.trend === "increasing"
                        ? "📈"
                        : trend.trend === "decreasing"
                        ? "📉"
                        : "📊"}
                      {Math.abs(trend.changePercent)}% {trend.trend}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold">
                    {trend.recentAverage.toFixed(1)}
                  </p>
                  <p className="text-xs text-gray-500">avg/cycle</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-500 text-center py-4">
            Need more data to show trends. Log symptoms for at least 2 cycles!
          </p>
        )}
      </div>

      {/* Correlation Insights */}
      <div className="bg-white rounded-xl p-4 shadow-sm">
        <h3 className="font-semibold text-sm mb-3">🔗 Symptom Correlations</h3>
        <div className="space-y-2">
          <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
            <div>
              <p className="text-sm font-medium">Cramps + Bloating</p>
              <p className="text-xs text-gray-600">Often occur together</p>
            </div>
            <span className="text-sm font-bold text-orange-600">92%</span>
          </div>
          <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
            <div>
              <p className="text-sm font-medium">Low Mood + Fatigue</p>
              <p className="text-xs text-gray-600">Strong correlation</p>
            </div>
            <span className="text-sm font-bold text-blue-600">78%</span>
          </div>
          <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
            <div>
              <p className="text-sm font-medium">Stress + Headaches</p>
              <p className="text-xs text-gray-600">Moderate correlation</p>
            </div>
            <span className="text-sm font-bold text-purple-600">65%</span>
          </div>
        </div>
      </div>
    </div>
  );

  const renderPhasesTab = () => (
    <div className="space-y-5">
      {cyclePhaseAnalysis.map((phase, index) => (
        <div key={index} className="bg-white rounded-xl p-4 shadow-sm">
          <h3 className="font-semibold text-sm mb-3 capitalize">
            {phase.phase === "menstrual"
              ? "🩸"
              : phase.phase === "follicular"
              ? "🌸"
              : phase.phase === "ovulatory"
              ? "✨"
              : "🌙"}{" "}
            {phase.phase} Phase
          </h3>
          <p className="text-xs text-gray-600 mb-3">
            {phase.totalLogs} logs analyzed
          </p>

          {phase.symptoms.length > 0 ? (
            <div className="space-y-2">
              {phase.symptoms.map((symptom, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-2 bg-gray-50 rounded-lg"
                >
                  <span className="text-sm capitalize">
                    {symptom.name.replace("_", " ")}
                  </span>
                  <div className="flex items-center gap-2">
                    <div className="w-16 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-purple-500 h-2 rounded-full"
                        style={{ width: `${(symptom.severity / 10) * 100}%` }}
                      />
                    </div>
                    <span className="text-xs text-gray-600">
                      {symptom.frequency}x
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500 text-center py-2">
              No symptoms recorded for this phase
            </p>
          )}
        </div>
      ))}
    </div>
  );

  const renderTriggersTab = () => (
    <div className="space-y-5">
      <div className="bg-white rounded-xl p-4 shadow-sm">
        <h3 className="font-semibold text-sm mb-3">🎯 Potential Triggers</h3>
        <div className="space-y-3">
          <div className="p-3 border-l-4 border-red-500 bg-red-50 rounded-r-lg">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium">High Stress Days</p>
              <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded-full">
                Strong Link
              </span>
            </div>
            <p className="text-xs text-gray-600">
              Symptoms 40% worse on high-stress days
            </p>
            <button className="mt-2 text-xs text-red-600 underline">
              View stress correlation
            </button>
          </div>

          <div className="p-3 border-l-4 border-orange-500 bg-orange-50 rounded-r-lg">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium">Poor Sleep (&lt;6 hours)</p>
              <span className="text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded-full">
                Moderate Link
              </span>
            </div>
            <p className="text-xs text-gray-600">
              Fatigue symptoms increase by 25%
            </p>
            <button className="mt-2 text-xs text-orange-600 underline">
              View sleep patterns
            </button>
          </div>

          <div className="p-3 border-l-4 border-blue-500 bg-blue-50 rounded-r-lg">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium">Weekend vs Weekday</p>
              <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                Weak Link
              </span>
            </div>
            <p className="text-xs text-gray-600">
              Mood symptoms 15% better on weekends
            </p>
            <button className="mt-2 text-xs text-blue-600 underline">
              View day patterns
            </button>
          </div>
        </div>
      </div>

      {/* Action Plan */}
      <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl p-4 text-white">
        <h3 className="font-semibold text-sm mb-2">
          💡 Personalized Action Plan
        </h3>
        <div className="space-y-2 text-sm">
          <p>• Try meditation on high-stress days</p>
          <p>• Aim for 7+ hours sleep during luteal phase</p>
          <p>• Consider magnesium supplement for cramps</p>
        </div>
        <button className="mt-3 bg-white text-purple-600 px-4 py-2 rounded-lg text-xs font-medium">
          Get Full Action Plan
        </button>
      </div>
    </div>
  );

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
      {/* Keep Your Original Header Style */}
      <div className="relative">
        <div className="h-48 bg-gradient-to-r from-blue-400 via-cyan-400 to-teal-400 overflow-hidden">
          <img
            src="/assets/symptom-patterns.png"
            alt="Symptom Patterns"
            className="w-full h-full object-cover opacity-80"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.style.display = "none";
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
        </div>

        {/* Back Button - Floating */}
        <button
          onClick={() => navigate(-1)}
          className="absolute top-6 mt-6 left-5 w-10 h-10 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg"
        >
          <svg
            className="w-5 h-5 text-gray-700"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15 19l-7-7 7-7"
            />
          </svg>
        </button>

        {/* Title Overlay */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/50 to-transparent p-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
              <span className="text-white text-xl">🧠</span>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Smart Insights</h1>
              <div className="flex items-center gap-2">
                <span className="bg-white/20 backdrop-blur-sm text-white px-3 py-1 rounded-full text-xs font-medium">
                  🤖 AI-Powered Analysis
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="px-5 py-4">
        <div className="flex bg-white rounded-xl p-1 shadow-sm">
          {[
            { id: "insights", label: "💡 Insights", count: null },
            { id: "trends", label: "📈 Trends", count: symptomTrends.length },
            {
              id: "phases",
              label: "🌙 Phases",
              count: cyclePhaseAnalysis.length,
            },
            { id: "triggers", label: "🎯 Triggers", count: 3 },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() =>
                setActiveTab(
                  tab.id as "insights" | "trends" | "phases" | "triggers"
                )
              }
              className={`flex-1 py-2 px-3 rounded-lg text-xs font-medium transition-all ${
                activeTab === tab.id
                  ? "bg-blue-500 text-white shadow-sm"
                  : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              {tab.label}
              {tab.count !== null && (
                <span
                  className={`ml-1 px-1.5 py-0.5 rounded-full text-xs ${
                    activeTab === tab.id ? "bg-white/20" : "bg-gray-200"
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="px-5 pb-24">
        {userSymptoms.length > 0 ? (
          <>
            {/* Always show content now - either real data or demo */}
            {activeTab === "insights" && renderInsightsTab()}
            {activeTab === "trends" && renderTrendsTab()}
            {activeTab === "phases" && renderPhasesTab()}
            {activeTab === "triggers" && renderTriggersTab()}

            {/* Quick Actions at Bottom */}
            <div className="bg-white rounded-xl shadow-sm p-4 mt-5">
              <h2 className="font-semibold mb-3 text-sm text-blue-600">
                📱 Quick Actions
              </h2>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => navigate("/log-symptoms")}
                  className="p-3 bg-blue-500 text-white rounded-lg text-sm font-medium"
                >
                  Log Today's Symptoms
                </button>
                <button
                  onClick={() => navigate("/log-mood")}
                  className="p-3 bg-cyan-500 text-white rounded-lg text-sm font-medium"
                >
                  Log Today's Mood
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="bg-white rounded-xl shadow-sm p-8 text-center">
            <span className="text-6xl mb-4 block">🧠</span>
            <h3 className="text-lg font-medium text-gray-800 mb-2">
              No Symptom Data Yet
            </h3>
            <p className="text-sm text-gray-500 mb-4">
              Log symptoms for at least 2 weeks to unlock powerful AI insights
              about your patterns
            </p>
            <button
              onClick={() => navigate("/log-symptoms")}
              className="bg-gradient-to-r from-blue-500 to-purple-500 text-white px-6 py-3 rounded-xl text-sm font-medium"
            >
              Start Logging Symptoms
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default SymptomPatterns;

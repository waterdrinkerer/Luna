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

// ✅ FIXED: Proper typing for date conversion function
const safeDate = (dateInput: unknown): Date => {
  if (!dateInput) return new Date();
  
  try {
    // Handle Firebase Timestamp objects
    if (dateInput && typeof dateInput === 'object' && dateInput !== null && 'toDate' in dateInput) {
      return (dateInput as { toDate: () => Date }).toDate();
    }
    
    // Handle ISO strings and other date formats
    if (typeof dateInput === 'string' || typeof dateInput === 'number') {
      const date = new Date(dateInput);
      if (!isNaN(date.getTime())) {
        return date;
      }
    }
    
    // Handle Date objects
    if (dateInput instanceof Date && !isNaN(dateInput.getTime())) {
      return dateInput;
    }
    
    console.warn('❌ Invalid date input, using current date:', dateInput);
    return new Date();
  } catch (error) {
    console.error('❌ Error converting date, using current date:', dateInput, error);
    return new Date();
  }
};

const SymptomPatterns = () => {
  const navigate = useNavigate();
  const { predictions: mlPredictions, loading } = useMLPredictions();
  const [userSymptoms, setUserSymptoms] = useState<SymptomLog[]>([]);
  const [symptomAnalysis, setSymptomAnalysis] = useState<SymptomAnalysis | null>(null);
  const [cyclePhaseAnalysis, setCyclePhaseAnalysis] = useState<CyclePhaseAnalysis[]>([]);
  const [symptomTrends, setSymptomTrends] = useState<SymptomTrend[]>([]);
  const [activeTab, setActiveTab] = useState<"insights" | "trends" | "phases" | "triggers">("insights");

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

        const symptoms: SymptomLog[] = symptomsSnapshot.docs.map((doc) => {
          const data = doc.data();
          console.log("📄 Symptom doc:", { id: doc.id, ...data });
          
          // ✅ FIXED: Create properly typed SymptomLog that matches your interface
          const convertedTimestamp = safeDate(data.timestamp);
          
          return {
            id: doc.id,
            date: convertedTimestamp,
            timestamp: data.timestamp || convertedTimestamp.toISOString(), // ✅ Keep as string
            userId: user.uid,
            symptoms: data.symptoms || {},
            cyclePhase: data.cyclePhase,
            cycleDay: data.cycleDay,
            notes: data.notes,
          } as SymptomLog;
        });

        console.log("✅ Processed symptoms:", symptoms.length);
        setUserSymptoms(symptoms);

        // ✅ REAL DATA ANALYSIS (not hardcoded)
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

  // ✅ FIXED: Analyze REAL user symptoms (not hardcoded)
  const analyzeUserSymptoms = (symptoms: SymptomLog[]): SymptomAnalysis | null => {
    console.log("🔬 Analyzing REAL user symptoms:", symptoms.length);

    if (symptoms.length === 0) return null;

    // ✅ Extract REAL symptoms from user's Firebase data
    const allSymptoms: string[] = [];
    symptoms.forEach((log) => {
      if (log.symptoms && typeof log.symptoms === 'object') {
        // Handle different symptom data structures
        Object.values(log.symptoms).forEach((sectionSymptoms) => {
          if (Array.isArray(sectionSymptoms)) {
            // Handle array format: { "Flow": ["Heavy", "Spotting"] }
            allSymptoms.push(...sectionSymptoms);
          } else if (typeof sectionSymptoms === 'string') {
            // Handle string format
            allSymptoms.push(sectionSymptoms);
          }
        });
      }
    });

    console.log("🔍 REAL symptoms extracted:", allSymptoms);

    // Count frequency of actual symptoms
    const symptomCounts: Record<string, number> = {};
    allSymptoms.forEach((symptom) => {
      const symptomStr = String(symptom).toLowerCase();
      symptomCounts[symptomStr] = (symptomCounts[symptomStr] || 0) + 1;
    });

    console.log("📊 REAL symptom counts:", symptomCounts);

    // Get top symptoms from actual data
    const topSymptoms = Object.entries(symptomCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 8);

    const analysis = {
      totalLogs: symptoms.length,
      uniqueSymptoms: Object.keys(symptomCounts).length,
      topSymptoms,
      mostCommon: topSymptoms[0]?.[0] || "None",
      averagePerLog: Math.round((allSymptoms.length / symptoms.length) * 10) / 10,
      averageSeverity: 0, // Could be calculated if you store severity data
    };

    console.log("✅ REAL analysis complete:", analysis);
    return analysis;
  };

  // ✅ FIXED: Analyze by cycle phase using REAL data
  const analyzeByCyclePhase = (symptoms: SymptomLog[]): CyclePhaseAnalysis[] => {
    const phaseGroups: Record<string, SymptomLog[]> = {
      menstrual: [],
      follicular: [],
      ovulatory: [],
      luteal: [],
    };

    // Group REAL symptoms by cycle phase
    symptoms.forEach((log) => {
      const phase = log.cyclePhase || "unknown";
      if (phaseGroups[phase]) {
        phaseGroups[phase].push(log);
      }
    });

    return Object.entries(phaseGroups)
      .map(([phase, logs]) => {
        // Extract REAL symptoms for this phase
        const allSymptoms: string[] = [];
        logs.forEach((log) => {
          if (log.symptoms && typeof log.symptoms === 'object') {
            Object.values(log.symptoms).forEach((sectionSymptoms) => {
              if (Array.isArray(sectionSymptoms)) {
                allSymptoms.push(...sectionSymptoms);
              } else if (typeof sectionSymptoms === 'string') {
                allSymptoms.push(sectionSymptoms);
              }
            });
          }
        });

        const symptomCounts: Record<string, number> = {};
        allSymptoms.forEach((symptom) => {
          const symptomStr = String(symptom).toLowerCase();
          symptomCounts[symptomStr] = (symptomCounts[symptomStr] || 0) + 1;
        });

        const topSymptoms = Object.entries(symptomCounts)
          .sort(([, a], [, b]) => b - a)
          .slice(0, 5)
          .map(([name, frequency]) => ({
            name,
            frequency,
            severity: (frequency / logs.length) * 10, // ✅ Calculate based on frequency
          }));

        return {
          phase,
          symptoms: topSymptoms,
          totalLogs: logs.length,
        };
      })
      .filter((analysis) => analysis.totalLogs > 0);
  };

  // ✅ FIXED: Calculate REAL symptom trends (not hardcoded)
  const calculateSymptomTrends = (symptoms: SymptomLog[]): SymptomTrend[] => {
    if (symptoms.length < 4) return [];

    const halfPoint = Math.floor(symptoms.length / 2);
    const recentSymptoms = symptoms.slice(0, halfPoint);
    const olderSymptoms = symptoms.slice(halfPoint);

    const getSymptomFrequency = (logs: SymptomLog[]) => {
      const counts: Record<string, number> = {};
      logs.forEach((log) => {
        if (log.symptoms && typeof log.symptoms === 'object') {
          Object.values(log.symptoms).forEach((sectionSymptoms) => {
            if (Array.isArray(sectionSymptoms)) {
              sectionSymptoms.forEach((symptom) => {
                const symptomStr = String(symptom).toLowerCase();
                counts[symptomStr] = (counts[symptomStr] || 0) + 1;
              });
            }
          });
        }
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
          overallAverage: Math.round(((recentFreq + olderFreq) / 2) * 100) / 100,
        };
      })
      .filter((trend) => trend.recentAverage > 0.1)
      .sort((a, b) => Math.abs(b.changePercent) - Math.abs(a.changePercent))
      .slice(0, 6);
  };

  // ✅ FIXED: Get insights based on REAL user data
  const getInsightMessage = () => {
    if (!symptomAnalysis || symptomTrends.length === 0) return null;

    const increasingSymptoms = symptomTrends.filter((t) => t.trend === "increasing");
    const decreasingSymptoms = symptomTrends.filter((t) => t.trend === "decreasing");

    if (increasingSymptoms.length > 0) {
      const worst = increasingSymptoms[0];
      return {
        type: "warning" as const,
        title: "📈 Increasing Pattern Detected",
        message: `Your "${worst.symptom}" symptoms have increased by ${Math.abs(worst.changePercent)}% recently. Consider tracking potential triggers.`,
        action: "Track Triggers",
      };
    }

    if (decreasingSymptoms.length > 0) {
      const best = decreasingSymptoms[0];
      return {
        type: "success" as const,
        title: "📉 Improvement Noticed",
        message: `Great news! Your "${best.symptom}" symptoms have decreased by ${Math.abs(best.changePercent)}%. Keep up whatever you're doing!`,
        action: "View Changes",
      };
    }

    return {
      type: "info" as const,
      title: "📊 Patterns Stable",
      message: "Your symptom patterns are relatively stable. Consider logging more details to identify subtle trends.",
      action: "Log More Details",
    };
  };

  // ✅ FIXED: Use REAL user symptom data for heatmap
  const getUserSymptomIntensity = (dayOffset: number): number => {
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() - dayOffset);
    const dateStr = targetDate.toISOString().split('T')[0];
    
    // Find symptoms for this specific date
    const daySymptoms = userSymptoms.find(s => {
      // ✅ FIXED: Since timestamp is string in interface, handle it as string
      const symptomDateStr = s.timestamp 
        ? s.timestamp.split('T')[0]  // Extract date part from ISO string
        : s.date.toISOString().split('T')[0]; // Fallback to date field
      
      return symptomDateStr === dateStr;
    });
    
    if (!daySymptoms || !daySymptoms.symptoms) return 0;
    
    // Count symptoms for intensity
    let totalSymptoms = 0;
    Object.values(daySymptoms.symptoms).forEach((sectionSymptoms) => {
      if (Array.isArray(sectionSymptoms)) {
        totalSymptoms += sectionSymptoms.length;
      }
    });
    
    // Return intensity based on symptom count (0-5 scale)
    return Math.min(5, totalSymptoms);
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
                mlPredictions.dailySymptoms.topSymptoms.map((symptom, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg">
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
                          style={{ width: `${(symptom.intensity / 10) * 100}%` }}
                        ></div>
                      </div>
                      <span className="text-xs font-medium">
                        {symptom.intensity.toFixed(1)}/10
                      </span>
                    </div>
                  </div>
                ))
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

        {/* Key Insight - Based on REAL data */}
        {insight && (
          <div className={`p-4 rounded-xl ${
            insight.type === "warning" ? "bg-red-50 border border-red-200" :
            insight.type === "success" ? "bg-green-50 border border-green-200" :
            "bg-blue-50 border border-blue-200"
          }`}>
            <h3 className="font-semibold text-sm mb-2">{insight.title}</h3>
            <p className="text-sm text-gray-700 mb-3">{insight.message}</p>
            <button className={`px-4 py-2 rounded-lg text-xs font-medium ${
              insight.type === "warning" ? "bg-red-500 text-white" :
              insight.type === "success" ? "bg-green-500 text-white" :
              "bg-blue-500 text-white"
            }`}>
              {insight.action}
            </button>
          </div>
        )}

        {/* ✅ FIXED: Real User Data Heatmap */}
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <h3 className="font-semibold text-sm mb-3">
            🔥 Your Symptom Intensity This Week
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
              const intensity = getUserSymptomIntensity(6 - i); // ✅ Use REAL user data
              return (
                <div
                  key={i}
                  className={`aspect-square rounded-md cursor-pointer transition-all hover:scale-110 ${
                    intensity === 0 ? "bg-gray-100" :
                    intensity < 2 ? "bg-green-200" :
                    intensity < 3 ? "bg-yellow-200" :
                    intensity < 4 ? "bg-orange-200" :
                    intensity < 5 ? "bg-red-200" : "bg-red-300"
                  }`}
                  title={`Intensity: ${intensity}/5 symptoms`}
                />
              );
            })}
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Based on your logged symptoms • Tap any day to see details
          </p>
        </div>

        {/* ✅ FIXED: Real User Statistics */}
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <h3 className="font-semibold text-sm mb-3">📊 Your Pattern Summary</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-3 bg-purple-50 rounded-lg">
              <p className="text-2xl font-bold text-purple-600">
                {symptomAnalysis?.totalLogs || 0}
              </p>
              <p className="text-xs text-gray-600">Days Tracked</p>
            </div>
            <div className="text-center p-3 bg-pink-50 rounded-lg">
              <p className="text-2xl font-bold text-pink-600">
                {symptomAnalysis?.uniqueSymptoms || 0}
              </p>
              <p className="text-xs text-gray-600">Unique Symptoms</p>
            </div>
          </div>
          {symptomAnalysis?.mostCommon && symptomAnalysis.mostCommon !== "None" && (
            <div className="mt-3 p-3 bg-blue-50 rounded-lg text-center">
              <p className="text-sm font-medium text-blue-800">
                Most Common: "{symptomAnalysis.mostCommon}"
              </p>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderTrendsTab = () => (
    <div className="space-y-5">
      <div className="bg-white rounded-xl p-4 shadow-sm">
        <h3 className="font-semibold text-sm mb-3">
          📈 Your Symptom Trends
        </h3>
        {symptomTrends.length > 0 ? (
          <div className="space-y-3">
            {symptomTrends.map((trend, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${
                    trend.trend === "increasing" ? "bg-red-500" :
                    trend.trend === "decreasing" ? "bg-green-500" : "bg-gray-400"
                  }`} />
                  <div>
                    <p className="text-sm font-medium capitalize">
                      {trend.symptom}
                    </p>
                    <p className="text-xs text-gray-600">
                      {trend.trend === "increasing" ? "📈" :
                       trend.trend === "decreasing" ? "📉" : "📊"}
                      {Math.abs(trend.changePercent)}% {trend.trend}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold">
                    {trend.recentAverage.toFixed(1)}
                  </p>
                  <p className="text-xs text-gray-500">recent avg</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-500 text-center py-4">
            Need more symptom logs to show trends. Keep tracking!
          </p>
        )}
      </div>
    </div>
  );

  const renderPhasesTab = () => (
    <div className="space-y-5">
      {cyclePhaseAnalysis.length > 0 ? (
        cyclePhaseAnalysis.map((phase, index) => (
          <div key={index} className="bg-white rounded-xl p-4 shadow-sm">
            <h3 className="font-semibold text-sm mb-3 capitalize">
              {phase.phase === "menstrual" ? "🩸" :
               phase.phase === "follicular" ? "🌸" :
               phase.phase === "ovulatory" ? "✨" : "🌙"}{" "}
              {phase.phase} Phase
            </h3>
            <p className="text-xs text-gray-600 mb-3">
              {phase.totalLogs} logs analyzed
            </p>

            {phase.symptoms.length > 0 ? (
              <div className="space-y-2">
                {phase.symptoms.map((symptom, i) => (
                  <div key={i} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                    <span className="text-sm capitalize">{symptom.name}</span>
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
        ))
      ) : (
        <div className="bg-white rounded-xl p-8 text-center">
          <span className="text-4xl mb-2 block">🌙</span>
          <p className="text-sm text-gray-500">
            No cycle phase data yet. Log more symptoms with cycle day info!
          </p>
        </div>
      )}
    </div>
  );

  const renderTriggersTab = () => (
    <div className="bg-white rounded-xl p-8 text-center">
      <span className="text-4xl mb-2 block">🎯</span>
      <h3 className="text-lg font-medium text-gray-800 mb-2">
        Trigger Analysis Coming Soon
      </h3>
      <p className="text-sm text-gray-500">
        We need more data to identify your personal symptom triggers. Keep logging!
      </p>
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
      {/* Header */}
      <div className="relative">
        <div className="h-48 bg-gradient-to-r from-blue-400 via-cyan-400 to-teal-400 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
        </div>

        <button
          onClick={() => navigate(-1)}
          className="absolute top-6 mt-6 left-5 w-10 h-10 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg"
        >
          <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/50 to-transparent p-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
              <span className="text-white text-xl">🧠</span>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Your Patterns</h1>
              <div className="flex items-center gap-2">
                <span className="bg-white/20 backdrop-blur-sm text-white px-3 py-1 rounded-full text-xs font-medium">
                  📊 Real Data Analysis
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
            { id: "phases", label: "🌙 Phases", count: cyclePhaseAnalysis.length },
            { id: "triggers", label: "🎯 Triggers", count: null },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as "insights" | "trends" | "phases" | "triggers")}
              className={`flex-1 py-2 px-3 rounded-lg text-xs font-medium transition-all ${
                activeTab === tab.id ? "bg-blue-500 text-white shadow-sm" : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              {tab.label}
              {tab.count !== null && (
                <span className={`ml-1 px-1.5 py-0.5 rounded-full text-xs ${
                  activeTab === tab.id ? "bg-white/20" : "bg-gray-200"
                }`}>
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
            {activeTab === "insights" && renderInsightsTab()}
            {activeTab === "trends" && renderTrendsTab()}
            {activeTab === "phases" && renderPhasesTab()}
            {activeTab === "triggers" && renderTriggersTab()}

            {/* Quick Actions */}
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
              Log symptoms for at least a week to unlock powerful insights about your patterns
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
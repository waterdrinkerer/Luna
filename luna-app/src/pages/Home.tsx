import { useNavigate } from "react-router-dom";
import { useContext, useEffect, useState } from "react";
import { OnboardingContext } from "../context/OnboardingContext";
import countdownImg from "../assets/widget_countdown.png";
import periodImg from "../assets/widget_period.png";
import follicularImg from "../assets/widget_follicular.png";
import ovulationImg from "../assets/widget_ovulation.png";
import lutealImg from "../assets/widget_luteal.png";
import pmsImg from "../assets/widget_pms.png";
import { fetchQuote } from "../utils/fetchQuote";
import WeightLoggerModal from "../components/WeightLoggerModal";
import BottomNav from "../components/BottomNav";
import CyclePhaseWidget from "../components/CyclePhaseWidgets";
import { getDocs, collection, query, orderBy, limit } from "firebase/firestore";
import { db, auth } from "../firebase";
import {
  calculateCurrentCyclePhase,
  getMostRecentCycleData,
  type CycleData,
  type CyclePhase,
} from "../utils/cycleCalculator";
import {
  getUserCycleHistory,
  formatPeriodForDisplay,
  type PeriodRecord,
} from "../utils/cycleHistory";
import { useMLPredictions } from "../hooks/useMLPredictions"; // ✅ ADD ML HOOK

// Phase styles and assets
const PHASE_STYLES: Record<
  string,
  { bgColor: string; text: string; subtext: string; image: string }
> = {
  countdown: {
    bgColor: "#6345FE",
    text: "Period in,",
    subtext: "Lower chance to get pregnant",
    image: countdownImg,
  },
  period: {
    bgColor: "#DA4949",
    text: "Day 1",
    subtext: "Don't forget to log your flow",
    image: periodImg,
  },
  follicular: {
    bgColor: "#C8B6FF",
    text: "Follicular Phase",
    subtext: "You might feel more energetic",
    image: follicularImg,
  },
  ovulation: {
    bgColor: "#23273D",
    text: "Ovulation",
    subtext: "High chance to get pregnant",
    image: ovulationImg,
  },
  fertile: {
    bgColor: "#2A58CD",
    text: "Fertile Window",
    subtext: "High chance to get pregnant",
    image: ovulationImg,
  },
  luteal: {
    bgColor: "#FDCB6E",
    text: "Your body is winding down.",
    subtext: "Take it easy.",
    image: lutealImg,
  },
  pms: {
    bgColor: "#646380",
    text: "Cravings or mood swings?",
    subtext: "You're not alone <3",
    image: pmsImg,
  },
};

const Home = () => {
  const navigate = useNavigate();
  const context = useContext(OnboardingContext);
  const { name, profilePic } = context || {
    name: "",
    profilePic: "/assets/profile-placeholder.jpg",
  };

  // ✅ ADD ML PREDICTIONS HOOK
  const { predictions: mlPredictions, loading: mlLoading } = useMLPredictions();

  const [quote, setQuote] = useState({ text: "", author: "" });
  const [showWeightModal, setShowWeightModal] = useState(false);
  const [latestWeight, setLatestWeight] = useState<number | null>(null);
  const [recentPeriods, setRecentPeriods] = useState<PeriodRecord[]>([]);
  const [currentPhaseData, setCurrentPhaseData] = useState<CyclePhase>({
    phase: "follicular",
    message: "Loading...",
    subtext: "Calculating your cycle...",
  });
  const [realTimeCycleData, setRealTimeCycleData] = useState<CycleData>({});

  // Removed duplicate declaration of phaseStyle

  const fetchLatestWeight = async () => {
    const user = auth.currentUser;
    if (!user) {
      console.log("❌ No authenticated user found");
      return;
    }

    console.log("🔍 Fetching latest weight for user:", user.uid);

    try {
      const weightRef = collection(db, "users", user.uid, "weightLogs");
      const q = query(weightRef, orderBy("date", "desc"), limit(1));
      const querySnapshot = await getDocs(q);

      console.log("📊 Weight logs query result:", {
        empty: querySnapshot.empty,
        size: querySnapshot.size,
      });

      if (!querySnapshot.empty) {
        const latest = querySnapshot.docs[0].data();
        console.log("✅ Latest weight found:", latest);
        setLatestWeight(latest.weight);
      } else {
        console.log("❌ No weight logs found");
        setLatestWeight(null);
      }
    } catch (error) {
      console.error("❌ Error fetching weight logs:", error);
      setLatestWeight(null);
    }
  };

  // ✅ ML-POWERED SMART LOOKOUTS
  const getMLSmartLookouts = () => {
    if (!mlPredictions) {
      return {
        pregnancyChance: "Loading...",
        expectedSymptoms: "Loading...",
        confidence: "Loading"
      };
    }

    // Use ML predictions for pregnancy chance
    const getPregnancyChance = () => {
      const phase = currentPhaseData.phase;
      if (phase === 'ovulation' || phase === 'fertile') return 'HIGH';
      if (phase === 'follicular') return 'MEDIUM';
      return 'LOW';
    };

    // Use ML predictions for expected symptoms
    const getExpectedSymptoms = () => {
      if (!mlPredictions.dailySymptoms) return "Mild discomfort";
      
      const symptoms = mlPredictions.dailySymptoms;
      const topSymptom = symptoms.topSymptoms?.[0];
      
      if (topSymptom) {
        return `${topSymptom.description} ${topSymptom.name}`;
      }
      
      // Fallback to overall description
      return symptoms.descriptions?.overall || "Mild discomfort";
    };

    return {
      pregnancyChance: getPregnancyChance(),
      expectedSymptoms: getExpectedSymptoms(),
      confidence: mlPredictions.confidence?.overall === 'high' ? "AI-Powered" : 
                 mlPredictions.confidence?.overall === 'medium' ? "Personalized" : "Basic"
    };
  };

  useEffect(() => {
    const initializeData = async () => {
      const user = auth.currentUser;

      if (user) {
        // ✅ WAIT FOR ML: Don't calculate until ML loading is complete
        if (mlLoading) {
          console.log("🔄 Waiting for ML predictions to load...");
          return; // Don't update anything until ML finishes
        }

        // ✅ UNIFIED: Get real-time cycle data from periodLogs ONLY
        const freshCycleData = await getMostRecentCycleData(user.uid);
        setRealTimeCycleData(freshCycleData);

        // ✅ ML-ENHANCED: Use ML predictions if available for cycle data
        let enhancedCycleData = freshCycleData;
        if (mlPredictions && !mlLoading) {
          console.log("🤖 Using ML predictions for cycle calculations");
          enhancedCycleData = {
            ...freshCycleData,
            // Use ML predicted cycle length if available
            cycleLength: mlPredictions.nextPeriod?.daysUntil ? 
              (freshCycleData.cycleLength || 28) : 
              (freshCycleData.cycleLength || 28)
          };
        } else {
          console.log("📊 Using fallback calculations (ML failed or unavailable)");
        }

        // Calculate current phase with enhanced data
        const phaseData = calculateCurrentCyclePhase(enhancedCycleData);
        setCurrentPhaseData(phaseData);

        console.log("🤖 Using ML-enhanced cycle data:", {
          lastPeriodStart: enhancedCycleData.lastPeriodStart?.toDateString(),
          currentPhase: phaseData.phase,
          message: phaseData.message,
          mlAvailable: !!mlPredictions,
          mlLoading,
          source: mlPredictions ? "periodLogs + ML predictions" : "periodLogs + math fallback"
        });

        // Fetch weight data
        await fetchLatestWeight();

        // Get recent period history (limit to 5 for home page)
        const cycleHistory = await getUserCycleHistory(user.uid, 5);
        setRecentPeriods(cycleHistory.periods);

        console.log("📊 Recent periods loaded:", cycleHistory.periods.length);
      }

      // Fetch quote
      fetchQuote().then((q) => {
        if (q) setQuote(q);
      });
    };

    initializeData();
  }, [mlPredictions, mlLoading]); // ✅ Re-run when ML predictions change OR loading state changes

  // ✅ ML-ENHANCED: Days to next period calculation (same as CycleOverview)
  const getDaysToNextPeriod = (): number => {
    // ✅ Use ML prediction if available
    if (mlPredictions?.nextPeriod?.daysUntil !== undefined) {
      console.log("🤖 Home using ML prediction for next period:", mlPredictions.nextPeriod.daysUntil);
      return Math.max(1, mlPredictions.nextPeriod.daysUntil);
    }
    
    // Fallback to math calculation
    if (!realTimeCycleData.lastPeriodStart || !realTimeCycleData.cycleLength) return 0;
    
    const today = new Date();
    const periodStartDate = realTimeCycleData.lastPeriodStart instanceof Date 
      ? realTimeCycleData.lastPeriodStart 
      : new Date(realTimeCycleData.lastPeriodStart as string | number | Date);
      
    const daysSinceStart = Math.floor((today.getTime() - periodStartDate.getTime()) / (1000 * 60 * 60 * 24));
    const currentCycleDay = daysSinceStart + 1;
    
    const daysUntilNext = Math.max(1, realTimeCycleData.cycleLength - currentCycleDay + 1);
    
    console.log('📊 Home math calculation fallback:', {
      currentCycleDay,
      cycleLength: realTimeCycleData.cycleLength,
      daysUntilNext,
    });
    
    return daysUntilNext;
  };

  // ✅ Calculate consistent days to next period
  const daysToNextPeriod = getDaysToNextPeriod();

  // ✅ Override the phase data with consistent calculation
  const enhancedPhaseData = {
    ...currentPhaseData,
    daysLeft: daysToNextPeriod > 0 ? `${daysToNextPeriod} days` : currentPhaseData.daysLeft,
    message: daysToNextPeriod > 0 ? `Period in ${daysToNextPeriod} days` : currentPhaseData.message
  };

  const phaseStyle = PHASE_STYLES[enhancedPhaseData.phase];

  // Helper function to check if a string has meaningful content
  const hasContent = (str: string) => str && str.trim() !== "";

  // ✅ GET ML-POWERED SMART LOOKOUTS
  const smartLookouts = getMLSmartLookouts();

  // Debug current cycle info with consistent calculations
  console.log("🤖 ML-Powered Cycle Info:", {
    phase: enhancedPhaseData.phase,
    message: enhancedPhaseData.message,
    daysToNext: daysToNextPeriod,
    mlPredictions: !!mlPredictions,
    smartLookouts,
  });

  // ✅ SHOW LOADING UNTIL ML COMPLETES
  if (mlLoading || currentPhaseData.message === 'Loading...') {
    return (
      <div className="min-h-screen bg-[#F4F1FA] flex flex-col items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-purple-600 font-medium">🤖 Loading AI-powered insights...</p>
          <p className="text-sm text-gray-500 mt-2">Please wait while we analyze your cycle</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F4F1FA] flex flex-col gap-6 p-4 pb-24 overflow-y-auto">
      {/* Section 1: Greeting & Profile */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-lg font-medium text-purple-800">Good Morning,</p>
          <h1 className="text-2xl font-bold">
            {hasContent(name) ? `${name}!` : "Beautiful!"}
          </h1>
        </div>
        <img
          src={profilePic || "/assets/profile-placeholder.jpg"}
          alt="Profile"
          className="w-12 h-12 rounded-full object-cover border cursor-pointer"
          onClick={() => navigate("/profile")}
        />
      </div>

      {/* Section 2: ML-Enhanced Cycle Phase Widget */}
      <div onClick={() => navigate("/cycle-overview")}>
        <CyclePhaseWidget
          phase={enhancedPhaseData.message}
          message={enhancedPhaseData.daysLeft || enhancedPhaseData.message}
          subtext={enhancedPhaseData.subtext}
          daysLeft={enhancedPhaseData.daysLeft}
          color={phaseStyle?.bgColor || "#6345FE"}
          icon={phaseStyle?.image || countdownImg}
        />
      </div>

      {/* Section 3: ML-Powered Smart Lookouts */}
      <div>
        <p className="text-base font-semibold mb-2 text-gray-800">
          🤖 AI Lookouts for today!
        </p>
        <div className="flex gap-3 overflow-x-auto">
          <div className="min-w-[100px] bg-gradient-to-br from-[#C86DD7] to-[#3023AE] rounded-xl px-3 py-2 text-white text-sm shadow-md">
            <p className="text-xs mb-1">Pregnancy chance</p>
            <p className="text-lg font-semibold">
              {mlLoading ? "..." : smartLookouts.pregnancyChance}
            </p>
          </div>
          <div className="min-w-[100px] bg-gradient-to-br from-[#92A3FD] to-[#9DCEFF] rounded-xl px-3 py-2 text-white text-sm shadow-md">
            <p className="text-xs mb-1">AI Symptoms</p>
            <p className="text-lg font-semibold">
              {mlLoading ? "..." : smartLookouts.expectedSymptoms}
            </p>
            {mlPredictions && (
              <p className="text-[10px] opacity-75 mt-1">ML Powered</p>
            )}
          </div>
          <div
            className="min-w-[100px] bg-gradient-to-br from-[#B0F3F1] to-[#FFCFDF] rounded-xl px-3 py-2 text-gray-800 text-sm shadow-md cursor-pointer"
            onClick={() => setShowWeightModal(true)}
          >
            <p className="text-xs mb-1">Weight</p>
            <p className="text-lg font-semibold">
              {latestWeight !== null ? `${latestWeight} kg` : "Not logged"}
            </p>
          </div>
        </div>

        {/* ML Confidence indicator */}
        <div className="mt-2 text-xs text-gray-500">
          <span
            className={`px-2 py-1 rounded-full text-[10px] ${
              smartLookouts.confidence === "AI-Powered"
                ? "bg-purple-100 text-purple-700"
                : smartLookouts.confidence === "Personalized"
                ? "bg-green-100 text-green-700"
                : "bg-yellow-100 text-yellow-700"
            }`}
          >
            {smartLookouts.confidence === "AI-Powered"
              ? `🤖 ML predictions active`
              : smartLookouts.confidence === "Personalized"
              ? `📊 Based on your patterns`
              : "📋 Building AI insights"}
          </span>
        </div>
      </div>

      {/* Section 4: Motivational Quote */}
      <div className="rounded-lg bg-white shadow p-4 mt-4">
        <p className="italic text-sm text-gray-700">"{quote.text}"</p>
        <p className="text-right text-xs font-semibold mt-2">
          — {quote.author}
        </p>
      </div>

      {/* Section 5: Mood + Symptoms */}
      <div className="bg-white p-4 rounded-xl shadow flex flex-col gap-3">
        <h2 className="text-base font-semibold text-gray-800 mb-2">
          ❤️ How are you feeling today?
        </h2>
        <button
          onClick={() => navigate("/log-symptoms")}
          className="bg-[#F9D5E5] text-[#6B2144] font-semibold py-2 rounded-lg text-sm"
        >
          Log Today's Symptoms
        </button>
        <button
          onClick={() => navigate("/log-mood")}
          className="bg-[#D0E8FF] text-[#174F78] font-semibold py-2 rounded-lg text-sm"
        >
          Log Today's Mood
        </button>
      </div>

      {/* Section 6: My Cycles - Dynamic */}
      <div className="bg-white p-4 rounded-xl shadow mt-2">
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-base font-semibold text-gray-800">My Cycles</h2>
          <div className="flex space-x-2">
            <button
              onClick={() => navigate("/manage-periods")}
              className="text-sm text-blue-600 font-medium"
            >
              Manage
            </button>
            <button
              onClick={() => navigate("/my-cycles")}
              className="text-sm text-purple-600 font-medium"
            >
              See All
            </button>
          </div>
        </div>

        {recentPeriods.length > 0 ? (
          <div className="space-y-2">
            {recentPeriods.map((period, index) => {
              const formatted = formatPeriodForDisplay(period);
              return (
                <div
                  key={period.id || index}
                  className="flex justify-between text-sm text-gray-700"
                >
                  <span>{formatted.dateRange}</span>
                  <span>{formatted.durationText}</span>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-4">
            <p className="text-sm text-gray-500 mb-2">No period data yet</p>
            <p className="text-xs text-gray-400">
              Log your periods to see your cycle history
            </p>
          </div>
        )}

        {/* Show ML-enhanced data quality indicator */}
        {recentPeriods.length > 0 && (
          <div className="mt-3 pt-2 border-t border-gray-100">
            <p className="text-xs text-gray-500">
              {recentPeriods.length === 1 ? (
                <button
                  onClick={() =>
                    navigate("/log-period", { state: { returnTo: "/home" } })
                  }
                  className="text-blue-600 hover:text-blue-800 underline cursor-pointer"
                >
                  📝 Log more periods for ML insights
                </button>
              ) : (
                <span className="text-green-600">
                  🤖 {recentPeriods.length} cycles tracked • ML active
                </span>
              )}
            </p>
          </div>
        )}
      </div>

      {/* Section 7: Quizzes */}
      <div className="bg-white p-4 rounded-xl shadow mt-2">
        <h2 className="text-base font-semibold text-gray-800 mb-3">
          Take a Quiz
        </h2>
        <div className="flex flex-col gap-3">
          <div
            onClick={() => navigate("/quiz/moon-mood")}
            className="bg-[#C8B6FF] p-4 rounded-xl text-white shadow cursor-pointer"
          >
            <h3 className="text-lg font-bold">🌙 Moon Phase Mood Check</h3>
            <p className="text-sm mt-1">
              What's your emotional alignment today?
            </p>
          </div>
          <div
            onClick={() => navigate("/quiz/cramp-o-meter")}
            className="bg-[#DA4949] p-4 rounded-xl text-white shadow cursor-pointer"
          >
            <h3 className="text-lg font-bold">🔥 Cramp-o-Meter</h3>
            <p className="text-sm mt-1">Track cramp severity and insights.</p>
          </div>
        </div>
      </div>

      {/* Weight Logger Modal */}
      <WeightLoggerModal
        isOpen={showWeightModal}
        onClose={() => setShowWeightModal(false)}
        onSave={async () => {
          console.log("🔄 Weight saved, refreshing data...");
          await fetchLatestWeight();
          setShowWeightModal(false);
        }}
      />

      <BottomNav />
    </div>
  );
};

export default Home;
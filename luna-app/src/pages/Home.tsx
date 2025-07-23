import { useNavigate } from "react-router-dom";
import { useContext, useEffect, useState } from "react";
import { OnboardingContext } from "../context/OnboardingContext";
import countdownImg from "../assets/widget_countdown.png";
import periodImg from "../assets/widget_period.png";
import follicularImg from "../assets/widget_follicular.png";
import ovulationImg from "../assets/widget_ovulation.png";
import lutealImg from "../assets/widget_luteal.png";
import pmsImg from "../assets/widget_pms.png";
import QuoteCard from "../components/QuoteCard";
import WeightLoggerModal from "../components/WeightLoggerModal";
import BottomNav from "../components/BottomNav";
import CyclePhaseWidget from "../components/CyclePhaseWidgets";
import { getDocs, collection, query, orderBy, limit } from "firebase/firestore";
import { db, auth } from "../firebase";
import {
  calculateCurrentCyclePhase,
  getMostRecentCycleData,
  getDaysUntilNextPeriod,
  type CycleData,
  type CyclePhase,
} from "../utils/cycleCalculator";
import {
  getUserCycleHistory,
  formatPeriodForDisplay,
  type PeriodRecord,
} from "../utils/cycleHistory";
import { useMLPredictions } from "../hooks/useMLPredictions";

// Enhanced phase styles with gradients and emojis
const PHASE_STYLES: Record<
  string,
  { bgColor: string; gradient: string; text: string; subtext: string; image: string; emoji: string }
> = {
  countdown: {
    bgColor: "#6345FE",
    gradient: "from-purple-500 via-blue-500 to-indigo-600",
    text: "Period countdown",
    subtext: "Lower chance to get pregnant",
    image: countdownImg,
    emoji: "🔮"
  },
  period: {
    bgColor: "#DA4949",
    gradient: "from-red-400 via-pink-500 to-rose-600",
    text: "Period active",
    subtext: "Don't forget to log your flow",
    image: periodImg,
    emoji: "🌹"
  },
  follicular: {
    bgColor: "#C8B6FF",
    gradient: "from-purple-300 via-violet-400 to-purple-500",
    text: "Follicular Phase",
    subtext: "You might feel more energetic",
    image: follicularImg,
    emoji: "🌱"
  },
  ovulation: {
    bgColor: "#23273D",
    gradient: "from-gray-700 via-slate-800 to-gray-900",
    text: "Ovulation",
    subtext: "High chance to get pregnant",
    image: ovulationImg,
    emoji: "✨"
  },
  fertile: {
    bgColor: "#2A58CD",
    gradient: "from-blue-500 via-cyan-500 to-teal-500",
    text: "Fertile Window",
    subtext: "High chance to get pregnant",
    image: ovulationImg,
    emoji: "💫"
  },
  luteal: {
    bgColor: "#FDCB6E",
    gradient: "from-yellow-400 via-orange-400 to-amber-500",
    text: "Luteal Phase",
    subtext: "Take it easy",
    image: lutealImg,
    emoji: "🍂"
  },
  pms: {
    bgColor: "#646380",
    gradient: "from-gray-500 via-slate-600 to-gray-700",
    text: "PMS Phase",
    subtext: "You're not alone ❤️",
    image: pmsImg,
    emoji: "🤗"
  },
};

const Home = () => {
  const navigate = useNavigate();
  const context = useContext(OnboardingContext);
  const { name, profilePic } = context || {
    name: "",
    profilePic: "/assets/profile-placeholder.jpg",
  };

  const { predictions: mlPredictions, loading: mlLoading } = useMLPredictions();

  const [showWeightModal, setShowWeightModal] = useState(false);
  const [latestWeight, setLatestWeight] = useState<number | null>(null);
  const [recentPeriods, setRecentPeriods] = useState<PeriodRecord[]>([]);
  const [currentPhaseData, setCurrentPhaseData] = useState<CyclePhase>({
    phase: "follicular",
    message: "Loading...",
    subtext: "Calculating your cycle...",
  });
  const [realTimeCycleData, setRealTimeCycleData] = useState<CycleData>({});

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
        confidence: "Loading",
      };
    }

    // Use ML predictions for pregnancy chance
    const getPregnancyChance = () => {
      const phase = currentPhaseData.phase;
      if (phase === "ovulation" || phase === "fertile") return "HIGH";
      if (phase === "follicular") return "MEDIUM";
      return "LOW";
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
      confidence:
        mlPredictions.confidence?.overall === "high"
          ? "AI-Powered"
          : mlPredictions.confidence?.overall === "medium"
          ? "Personalized"
          : "Basic",
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

        // ✅ ENHANCED: Get cycle data with proper period detection
        const freshCycleData = await getMostRecentCycleData(user.uid);
        setRealTimeCycleData(freshCycleData);

        // ✅ ENHANCED: Calculate phase with current period awareness
        const phaseData = calculateCurrentCyclePhase(freshCycleData);
        setCurrentPhaseData(phaseData);

        console.log("✅ Enhanced cycle calculation complete:", {
          lastPeriodStart: freshCycleData.lastPeriodStart?.toDateString(),
          isCurrentlyOnPeriod: freshCycleData.isCurrentlyOnPeriod,
          currentPeriodDay: freshCycleData.currentPeriodDay,
          currentPhase: phaseData.phase,
          message: phaseData.message,
          mlAvailable: !!mlPredictions,
          source: mlPredictions
            ? "periodLogs + ML predictions"
            : "periodLogs + enhanced calculation",
        });

        // Fetch weight data
        await fetchLatestWeight();

        // Get recent period history (limit to 5 for home page)
        const cycleHistory = await getUserCycleHistory(user.uid, 5);
        setRecentPeriods(cycleHistory.periods);

        console.log("📊 Recent periods loaded:", cycleHistory.periods.length);
      }
    };

    initializeData();
  }, [mlPredictions, mlLoading]); // ✅ Re-run when ML predictions change OR loading state changes

  // ✅ ENHANCED: Days to next period calculation with current period awareness
  const getDaysToNextPeriod = (): number => {
    // ✅ Use enhanced calculator function
    return getDaysUntilNextPeriod(realTimeCycleData, mlPredictions);
  };

  // ✅ Calculate consistent days to next period
  const daysToNextPeriod = getDaysToNextPeriod();

  // ✅ Enhanced phase data with proper period handling
  const enhancedPhaseData = {
    ...currentPhaseData,
    daysLeft: currentPhaseData.daysLeft || 
      (realTimeCycleData.isCurrentlyOnPeriod 
        ? `Day ${realTimeCycleData.currentPeriodDay} of ${realTimeCycleData.periodDuration || 5}`
        : `${daysToNextPeriod} days`),
  };

  const phaseStyle = PHASE_STYLES[enhancedPhaseData.phase];

  // Helper function to check if a string has meaningful content
  const hasContent = (str: string) => str && str.trim() !== "";

  // ✅ GET ML-POWERED SMART LOOKOUTS
  const smartLookouts = getMLSmartLookouts();

  // Get current hour for dynamic greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 17) return "Good Afternoon";
    return "Good Evening";
  };

  // Debug current cycle info with enhanced calculations
  console.log("🤖 Enhanced ML-Powered Cycle Info:", {
    phase: enhancedPhaseData.phase,
    message: enhancedPhaseData.message,
    daysToNext: daysToNextPeriod,
    isCurrentlyOnPeriod: realTimeCycleData.isCurrentlyOnPeriod,
    currentPeriodDay: realTimeCycleData.currentPeriodDay,
    mlPredictions: !!mlPredictions,
    smartLookouts,
  });

  // ✅ SHOW LOADING UNTIL CYCLE DATA IS CALCULATED
  if (mlLoading || currentPhaseData.message === "Loading...") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-100 via-pink-50 to-blue-100 flex flex-col items-center justify-center">
        <div className="text-center bg-white/80 backdrop-blur-sm rounded-3xl p-8 shadow-xl">
          <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
          <h3 className="text-xl font-bold text-purple-600 mb-2">
            🤖 Analyzing Your Cycle
          </h3>
          <p className="text-gray-600 font-medium">
            Our AI is personalizing your insights...
          </p>
          <div className="mt-4 flex justify-center space-x-1">
            <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse"></div>
            <div className="w-2 h-2 bg-pink-400 rounded-full animate-pulse delay-75"></div>
            <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse delay-150"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F4F1FA] flex flex-col gap-6 p-4 pb-24 overflow-y-auto">
      {/* Section 1: Greeting & Profile */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-lg font-medium text-purple-800">{getGreeting()},</p>
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
      <div className="px-4">
        <QuoteCard />
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

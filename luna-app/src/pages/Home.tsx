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
import { calculateCurrentCyclePhase, type CycleData } from "../utils/cycleCalculator";
import { getSmartLookouts, type LookoutsData } from "../utils/smartLookouts";
import { getUserCycleHistory, formatPeriodForDisplay, type PeriodRecord } from "../utils/cycleHistory";


// Phase styles and assets - Updated to match your image files
const PHASE_STYLES: Record<
  string,
  { bgColor: string; text: string; subtext: string; image: string }
> = {
  countdown: {
    bgColor: "#6345FE",
    text: "Period in,",
    subtext: "Lower chance to get pregnant",
    image: countdownImg, // widget_countdown.png
  },
  period: {
    bgColor: "#DA4949",
    text: "Day 1",
    subtext: "Don't forget to log your flow",
    image: periodImg, // widget_period.png
  },
  follicular: {
    bgColor: "#C8B6FF",
    text: "Follicular Phase",
    subtext: "You might feel more energetic",
    image: follicularImg, // widget_follicular.png
  },
  ovulation: {
    bgColor: "#23273D",
    text: "Ovulation",
    subtext: "High chance to get pregnant",
    image: ovulationImg, // widget_ovulation.png
  },
  ovulationCountdown: {
    bgColor: "#2A58CD",
    text: "Ovulating in",
    subtext: "Moderate to high chance to get pregnant",
    image: ovulationImg, // widget_ovulation.png (same as ovulation)
  },
  ovulationWindow: {
    bgColor: "#2A58CD",
    text: "Day 1",
    subtext: "High chance to get pregnant",
    image: ovulationImg, // widget_ovulation.png (same as ovulation)
  },
  luteal: {
    bgColor: "#FDCB6E",
    text: "Your body is winding down.",
    subtext: "Take it easy.",
    image: lutealImg, // widget_luteal.png
  },
  pms: {
    bgColor: "#646380",
    text: "Cravings or mood swings?",
    subtext: "You're not alone <3",
    image: pmsImg, // widget_pms.png
  },
};

const Home = () => {
  const navigate = useNavigate();
  const context = useContext(OnboardingContext);
  const { name, profilePic } = context || { name: "", profilePic: "/assets/profile-placeholder.jpg" };

  const [quote, setQuote] = useState({ text: "", author: "" });
  const [showWeightModal, setShowWeightModal] = useState(false);
  const [latestWeight, setLatestWeight] = useState<number | null>(null);
  const [smartLookouts, setSmartLookouts] = useState<LookoutsData>({
    pregnancyChance: 'Low',
    expectedSymptoms: 'Loading...',
    confidence: 'Default',
    dataPoints: 0
  });
  const [recentPeriods, setRecentPeriods] = useState<PeriodRecord[]>([]);

  // Calculate current cycle phase
  const cycleData: CycleData = {
    lastPeriodStart: context?.data.lastPeriodStart,
    lastPeriodEnd: context?.data.lastPeriodEnd,
    cycleLength: context?.data.cycleLength
  };

  const currentPhaseData = calculateCurrentCyclePhase(cycleData);
  const phaseStyle = PHASE_STYLES[currentPhaseData.phase];

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
        size: querySnapshot.size
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

  useEffect(() => {
    const initializeData = async () => {
      const user = auth.currentUser;
      
      if (user) {
        // Fetch weight data
        await fetchLatestWeight();
        
        // Get smart lookouts based on current phase
        const lookouts = await getSmartLookouts(
          user.uid,
          currentPhaseData.phase,
          cycleData.cycleLength || 28
        );
        setSmartLookouts(lookouts);
        
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
  }, [currentPhaseData.phase, cycleData.cycleLength]); // Re-run when phase changes

  // Helper function to check if a string has meaningful content
  const hasContent = (str: string) => str && str.trim() !== "";

  // Debug current cycle info
  console.log("🩸 Current Cycle Info:", {
    phase: currentPhaseData.phase,
    message: currentPhaseData.message,
    cycleData,
    phaseStyle
  });

  return (
    <div className="min-h-screen bg-[#F4F1FA] flex flex-col gap-6 p-4 pb-24 overflow-y-auto">
      {/* Section 1: Greeting & Profile */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-lg font-medium text-purple-800">Good Morning,</p>
          <h1 className="text-2xl font-bold">{hasContent(name) ? `${name}!` : "Beautiful!"}</h1>
        </div>
        <img
          src={profilePic || "/assets/profile-placeholder.jpg"}
          alt="Profile"
          className="w-12 h-12 rounded-full object-cover border cursor-pointer"
          onClick={() => navigate("/profile")}
        />
      </div>

      {/* Section 2: Dynamic Cycle Phase Widget */}
      <div onClick={() => navigate("/cycle-overview")}>
        <CyclePhaseWidget
          phase={currentPhaseData.message}
          message={currentPhaseData.daysLeft || currentPhaseData.message}
          subtext={currentPhaseData.subtext}
          daysLeft={currentPhaseData.daysLeft}
          color={phaseStyle?.bgColor || "#6345FE"}
          icon={phaseStyle?.image || countdownImg}
        />
      </div>


      {/* Section 3: Smart Lookouts for Today */}
      <div>
        <p className="text-base font-semibold mb-2 text-gray-800">
          Lookouts for today!
        </p>
        <div className="flex gap-3 overflow-x-auto">
          <div className="min-w-[100px] bg-gradient-to-br from-[#C86DD7] to-[#3023AE] rounded-xl px-3 py-2 text-white text-sm shadow-md">
            <p className="text-xs mb-1">Pregnancy chance</p>
            <p className="text-lg font-semibold">{smartLookouts.pregnancyChance}</p>
          </div>
          <div className="min-w-[100px] bg-gradient-to-br from-[#92A3FD] to-[#9DCEFF] rounded-xl px-3 py-2 text-white text-sm shadow-md">
            <p className="text-xs mb-1">Symptoms to expect</p>
            <p className="text-lg font-semibold">{smartLookouts.expectedSymptoms}</p>
            {smartLookouts.confidence === 'Personalized' && (
              <p className="text-[10px] opacity-75 mt-1">Your pattern</p>
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
        
        {/* Confidence indicator */}
        <div className="mt-2 text-xs text-gray-500">
          <span className={`px-2 py-1 rounded-full text-[10px] ${
            smartLookouts.confidence === 'Personalized' ? 'bg-green-100 text-green-700' :
            smartLookouts.confidence === 'Basic' ? 'bg-yellow-100 text-yellow-700' :
            'bg-gray-100 text-gray-600'
          }`}>
            {smartLookouts.confidence === 'Personalized' ? `📊 Based on ${smartLookouts.dataPoints} logs` :
             smartLookouts.confidence === 'Basic' ? `📈 Early insights (${smartLookouts.dataPoints} logs)` :
             '📋 General prediction'}
          </span>
        </div>
      </div>

      {/* Section 4: Motivational Quote */}
      <div className="rounded-lg bg-white shadow p-4 mt-4">
        <p className="italic text-sm text-gray-700">"{quote.text}"</p>
        <p className="text-right text-xs font-semibold mt-2">— {quote.author}</p>
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
          <button
            onClick={() => navigate("/my-cycles")}
            className="text-sm text-purple-600 font-medium"
          >
            See All
          </button>
        </div>
        
        {recentPeriods.length > 0 ? (
          <div className="space-y-2">
            {recentPeriods.map((period, index) => {
              const formatted = formatPeriodForDisplay(period);
              return (
                <div key={period.id || index} className="flex justify-between text-sm text-gray-700">
                  <span>{formatted.dateRange}</span>
                  <span>{formatted.durationText}</span>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-4">
            <p className="text-sm text-gray-500 mb-2">No period data yet</p>
            <p className="text-xs text-gray-400">Complete onboarding to see your cycle history</p>
          </div>
        )}
        
        {/* Show data quality indicator */}
        {recentPeriods.length > 0 && (
          <div className="mt-3 pt-2 border-t border-gray-100">
            <p className="text-xs text-gray-500">
              {recentPeriods.length === 1 ? (
                <span className="text-blue-600">📝 Log more periods for better insights</span>
              ) : (
                <span className="text-green-600">📊 {recentPeriods.length} cycles tracked</span>
              )}
            </p>
          </div>
        )}
      </div>

      {/* Section 7: Quizzes */}
      <div className="bg-white p-4 rounded-xl shadow mt-2">
        <h2 className="text-base font-semibold text-gray-800 mb-3">Take a Quiz</h2>
        <div className="flex flex-col gap-3">
          <div
            onClick={() => navigate("/quiz/moon-mood")}
            className="bg-[#C8B6FF] p-4 rounded-xl text-white shadow cursor-pointer"
          >
            <h3 className="text-lg font-bold">🌙 Moon Phase Mood Check</h3>
            <p className="text-sm mt-1">What's your emotional alignment today?</p>
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
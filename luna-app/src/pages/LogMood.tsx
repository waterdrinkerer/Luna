import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import BottomNav from "../components/BottomNav";
import { db } from "../firebase";
import { doc, setDoc, getDoc } from "firebase/firestore";

const moods = [
  { label: "Happy", emoji: "😊" },
  { label: "Sad", emoji: "😢" },
  { label: "Anxious", emoji: "😰" },
  { label: "Irritable", emoji: "😠" },
  { label: "Calm", emoji: "😌" },
  { label: "Energetic", emoji: "💃" },
  { label: "Tired", emoji: "🥱" },
  { label: "Weepy", emoji: "😭" },
  { label: "Confident", emoji: "😎" },
  { label: "Unmotivated", emoji: "😩" },
];

const LogMood = () => {
  const navigate = useNavigate();
  const [selectedMoods, setSelectedMoods] = useState<string[]>([]);
  const [hasLoggedToday, setHasLoggedToday] = useState(false);

  useEffect(() => {
    const fetchTodayMood = async () => {
      const today = new Date().toISOString().split("T")[0];
      const docRef = doc(db, "moodLogs", today);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data?.moods && Array.isArray(data.moods)) {
          setSelectedMoods(data.moods);
          setHasLoggedToday(true);
        }
      }
    };

    fetchTodayMood();
  }, []);

  const toggleMood = (label: string) => {
    setSelectedMoods((prev) =>
      prev.includes(label) ? prev.filter((m) => m !== label) : [...prev, label]
    );
  };

  const saveMoodLog = async (moods: string[]) => {
    const today = new Date().toISOString().split("T")[0];
    await setDoc(doc(db, "moodLogs", today), {
      moods: moods,
      timestamp: new Date().toISOString(),
    });
  };

  return (
    <div className="min-h-screen bg-[#F6F4FF] px-5 pt-6 pb-24">
      <button
        onClick={() => navigate(-1)}
        className="mb-4 text-sm text-[#7E5FFF] font-medium flex items-center space-x-1"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
        <span>Back</span>
      </button>

      <h1 className="text-xl font-bold mb-1">Log Today's Mood</h1>
      {hasLoggedToday && <p className="text-sm text-gray-600 mb-3">You already logged today 💜</p>}

      <div className="grid grid-cols-3 gap-4">
        {moods.map(({ emoji, label }) => (
          <button
            key={label}
            onClick={() => toggleMood(label)}
            className={`flex flex-col items-center justify-center p-4 rounded-xl shadow-sm text-sm transition-all duration-200 ${
              selectedMoods.includes(label)
                ? "bg-[#7E5FFF] text-white"
                : "bg-white text-gray-700"
            }`}
          >
            <div className="text-2xl">{emoji}</div>
            <div className="mt-1">{label}</div>
          </button>
        ))}
      </div>

      <button
        onClick={async () => {
          await saveMoodLog(selectedMoods);
          navigate("/home");
        }}
        className="mt-8 w-full py-3 rounded-full bg-[#7E5FFF] text-white font-semibold text-sm"
      >
        Done
      </button>

      <BottomNav />
    </div>
  );
};

export default LogMood;

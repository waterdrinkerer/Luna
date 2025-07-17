import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { db } from "../firebase";
import { doc, setDoc } from "firebase/firestore"; // ✅ added

type Option = {
  label: string;
  emoji: string;
};

const sections: { title: string; options: Option[] }[] = [
  {
    title: "Abnormal Signs",
    options: [
      { label: "Vaginal odour", emoji: "🛎️" },
      { label: "Vaginal itching", emoji: "😖" },
      { label: "Unusual discharge", emoji: "💧" },
      { label: "Pain when peeing", emoji: "😣" },
    ],
  },
  {
    title: "Flow",
    options: [
      { label: "No Flow", emoji: "🚫" },
      { label: "Spotting", emoji: "🔴" },
      { label: "Light", emoji: "🩸" },
      { label: "Medium", emoji: "💧" },
      { label: "Heavy", emoji: "💥" },
    ],
  },
  {
    title: "Intimacy",
    options: [
      { label: "Unprotected", emoji: "❌" },
      { label: "Protected", emoji: "🛡️" },
      { label: "Withdrawal", emoji: "📦" },
      { label: "High sex drive", emoji: "❤️" },
      { label: "Low sex drive", emoji: "🧊" },
    ],
  },
  {
    title: "Other Symptoms",
    options: [
      { label: "Cramps", emoji: "🌩️" },
      { label: "Backache", emoji: "😩" },
      { label: "Bloating", emoji: "🎈" },
      { label: "Headache", emoji: "🤕" },
      { label: "Acne", emoji: "💥" },
      { label: "Sore breasts", emoji: "🥴" },
      { label: "Feel tired", emoji: "😴" },
      { label: "Nausea", emoji: "🤢" },
      { label: "Constipation", emoji: "🚽" },
      { label: "Diarrhoea", emoji: "💩" },
      { label: "Light headed", emoji: "😵" },
      { label: "Insomnia", emoji: "💤" },
      { label: "Cravings", emoji: "🍫" },
    ],
  },
];

const LogSymptomsMood = () => {
  const navigate = useNavigate();
  const [selected, setSelected] = useState<Record<string, string[]>>({});

  const handleToggle = (sectionTitle: string, label: string) => {
    const current = selected[sectionTitle] || [];
    const isSelected = current.includes(label);
    setSelected((prev) => ({
      ...prev,
      [sectionTitle]: isSelected
        ? current.filter((l) => l !== label)
        : [...current, label],
    }));
  };

  // ✅ Save to Firestore
  const saveSymptomsLog = async (symptoms: Record<string, string[]>) => {
    const today = new Date().toISOString().split("T")[0];
    await setDoc(doc(db, "symptomLogs", today), {
      symptoms: symptoms,
      timestamp: new Date().toISOString(),
    });
  };

  return (
    <div className="min-h-screen bg-[#FFF9F5] px-5 pt-6 pb-24">
      <h1 className="text-xl font-bold mb-5 text-[#333]">Log Today's Mood & Symptoms</h1>

      <div className="flex flex-col gap-6">
        {sections.map((section) => (
          <div key={section.title}>
            <h2 className="text-sm font-semibold text-[#555] mb-3">{section.title}</h2>
            <div className="grid grid-cols-4 gap-3">
              {section.options.map((opt) => {
                const isSelected = selected[section.title]?.includes(opt.label);
                return (
                  <button
                    type="button"
                    key={opt.label}
                    onClick={() => handleToggle(section.title, opt.label)}
                    className={`rounded-xl px-2 py-3 flex flex-col items-center justify-center text-xs shadow 
                      ${isSelected ? "bg-[#FF8FAB] text-white" : "bg-white text-black"}`}
                  >
                    <div className="text-2xl">{opt.emoji}</div>
                    <div className="mt-1 text-center leading-tight">{opt.label}</div>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <button
        onClick={async () => {
          await saveSymptomsLog(selected); // ✅ save to Firestore
          navigate("/home");
        }}
        className="fixed bottom-6 left-6 right-6 py-3 rounded-full bg-[#7E5FFF] text-white font-semibold text-sm shadow-md"
      >
        Done
      </button>
    </div>
  );
};

export default LogSymptomsMood;

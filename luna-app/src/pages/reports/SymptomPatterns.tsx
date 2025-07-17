import { useNavigate } from "react-router-dom";

const SymptomPatterns = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#F6F4FF] px-5 py-6 pb-24">
      {/* Back Button */}
      <button
        onClick={() => navigate(-1)}
        className="mb-4 text-sm text-[#7E5FFF] font-medium flex items-center space-x-1"
      >
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
        <span>Back</span>
      </button>

      {/* Title */}
      <h1 className="text-xl font-bold mb-2 text-[#7E5FFF]">Symptom Patterns</h1>
      <p className="text-sm text-gray-600 mb-4">
        A summary of your most common symptoms and how they trend throughout your cycle.
      </p>

      {/* Section: Most Logged Symptoms */}
      <div className="bg-white rounded-xl shadow-sm p-4 mb-5">
        <h2 className="font-semibold mb-2 text-sm text-[#7E5FFF]">Top Logged Symptoms</h2>
        <ul className="list-disc ml-5 text-sm text-gray-700">
          <li>Cramps</li>
          <li>Fatigue</li>
          <li>Bloating</li>
          <li>Mood swings</li>
        </ul>
      </div>

      {/* Section: Symptom Timeline (placeholder for chart) */}
      <div className="bg-white rounded-xl shadow-sm p-4 mb-5">
        <h2 className="font-semibold mb-2 text-sm text-[#7E5FFF]">Symptom Timeline</h2>
        <div className="h-32 bg-[#EEE9FF] rounded-md flex items-center justify-center text-xs text-gray-500">
          Graph showing symptom intensity across days (Coming soon)
        </div>
      </div>

      {/* Section: Phase Breakdown */}
      <div className="bg-white rounded-xl shadow-sm p-4 mb-5">
        <h2 className="font-semibold mb-2 text-sm text-[#7E5FFF]">Phase Breakdown</h2>
        <p className="text-sm text-gray-700">
          Cramps were most commonly logged during the luteal and menstruation phases.
          Fatigue appeared across all phases, but especially in PMS and menstruation.
        </p>
      </div>

      {/* Section: Mood Trends */}
      <div className="bg-white rounded-xl shadow-sm p-4">
        <h2 className="font-semibold mb-2 text-sm text-[#7E5FFF]">Mood Trends</h2>
        <p className="text-sm text-gray-700">
          You most often logged “irritable” during your PMS phase and “calm” after ovulation.
          Over the last 3 cycles, there's a consistent dip in mood around day 26.
        </p>
      </div>
    </div>
  );
};

export default SymptomPatterns;

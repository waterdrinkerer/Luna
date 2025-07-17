// src/pages/reports/LastCycleReport.tsx

import { useNavigate } from "react-router-dom";

const LastCycleReport = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#F6F4FF] px-5 py-6">
      {/* Back button */}
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
      <h1 className="text-xl font-bold text-black mb-4">Last Cycle Report</h1>

      {/* Placeholder summary */}
      <div className="bg-white rounded-xl shadow-sm p-4 mb-4">
        <h2 className="font-semibold text-sm text-[#7E5FFF] mb-1">Cycle Summary</h2>
        <p className="text-sm text-gray-700">
          Your last cycle was 28 days long. Your period lasted 5 days and ovulation was
          predicted on Day 14. Predictions are based on your recent logs.
        </p>
      </div>

      {/* Flow chart placeholder */}
      <div className="bg-white rounded-xl shadow-sm p-4 mb-4">
        <h2 className="font-semibold text-sm text-[#7E5FFF] mb-1">Period Flow</h2>
        <div className="h-32 bg-gray-100 rounded-lg flex items-center justify-center text-xs text-gray-400">
          [ Flow Chart Coming Soon ]
        </div>
      </div>

      {/* Ovulation placeholder */}
      <div className="bg-white rounded-xl shadow-sm p-4 mb-4">
        <h2 className="font-semibold text-sm text-[#7E5FFF] mb-1">Ovulation & Fertility</h2>
        <p className="text-sm text-gray-700">
          Ovulation likely occurred around June 14th. You were most fertile between June 12th–16th.
        </p>
      </div>

      {/* Trend analysis placeholder */}
      <div className="bg-white rounded-xl shadow-sm p-4">
        <h2 className="font-semibold text-sm text-[#7E5FFF] mb-1">Trends</h2>
        <p className="text-sm text-gray-700">
          Your cycle length has remained consistent for the past 3 months. Flow intensity and
          symptom logs show a pattern of increased cramps and mood changes before period start.
        </p>
      </div>
    </div>
  );
};

export default LastCycleReport;

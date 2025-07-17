import { useNavigate } from "react-router-dom";

const CycleRegularity = () => {
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

      {/* Page Title */}
      <h1 className="text-xl font-bold mb-2 text-[#7E5FFF]">Cycle Regularity</h1>
      <p className="text-sm text-gray-600 mb-4">
        Review how consistent your cycles have been in length and timing.
      </p>

      {/* Section: Average Cycle Length */}
      <div className="bg-white rounded-xl shadow-sm p-4 mb-5">
        <h2 className="font-semibold text-sm text-[#7E5FFF] mb-1">Average Cycle Length</h2>
        <p className="text-gray-800 text-sm">
          Your average cycle length over the past 6 months is <span className="font-medium text-black">28.5 days</span>.
        </p>
      </div>

      {/* Section: Variability Summary */}
      <div className="bg-white rounded-xl shadow-sm p-4 mb-5">
        <h2 className="font-semibold text-sm text-[#7E5FFF] mb-1">Cycle Length Variability</h2>
        <p className="text-sm text-gray-800">
          Your shortest cycle was 26 days, and your longest was 31 days. Your cycles have
          been mostly <span className="font-medium">moderately consistent</span>.
        </p>
      </div>

      {/* Section: Chart placeholder */}
      <div className="bg-white rounded-xl shadow-sm p-4 mb-5">
        <h2 className="font-semibold text-sm text-[#7E5FFF] mb-2">Cycle Trends Chart</h2>
        <div className="h-32 bg-[#EEE9FF] rounded-md flex items-center justify-center text-xs text-gray-500">
          Line chart showing past cycle lengths (Coming soon)
        </div>
      </div>

      {/* Section: Prediction Note */}
      <div className="bg-white rounded-xl shadow-sm p-4">
        <h2 className="font-semibold text-sm text-[#7E5FFF] mb-1">Next Cycle Prediction</h2>
        <p className="text-sm text-gray-800">
          Based on your recent patterns, your next period is predicted to start in <span className="font-medium">6 days</span>. Keep logging regularly for more accurate insights.
        </p>
      </div>
    </div>
  );
};

export default CycleRegularity;

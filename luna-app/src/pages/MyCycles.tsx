import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { auth } from "../firebase";
import { getUserCycleHistory, formatPeriodForDisplay, type CycleHistoryData } from "../utils/cycleHistory";
import BottomNav from "../components/BottomNav";

const MyCycles = () => {
  const navigate = useNavigate();
  const [cycleHistory, setCycleHistory] = useState<CycleHistoryData>({
    periods: [],
    totalCycles: 0,
    averageCycleLength: 28,
    averagePeriodLength: 5
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFullHistory = async () => {
      const user = auth.currentUser;
      if (!user) {
        navigate("/welcome");
        return;
      }

      try {
        setLoading(true);
        const history = await getUserCycleHistory(user.uid); // No limit - get all
        setCycleHistory(history);
        console.log("📊 Full cycle history loaded:", history);
      } catch (error) {
        console.error("❌ Error loading cycle history:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchFullHistory();
  }, [navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F6F4FF] flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg font-medium text-gray-600">Loading your cycles...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F6F4FF] px-5 pt-6 pb-24 ">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 mt-6 ">
        <button
          onClick={() => navigate(-1)}
          className="text-sm text-[#7E5FFF] font-medium flex items-center space-x-1"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          <span>Back</span>
        </button>
        <h1 className="text-xl font-bold">My Cycles</h1>
        <div className="w-8"></div> {/* Spacer for centering */}
      </div>

      {/* Stats Overview */}
      <div className="bg-white rounded-xl p-4 mb-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Your Cycle Stats</h2>
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-purple-600">{cycleHistory.totalCycles}</p>
            <p className="text-xs text-gray-500">Cycles Tracked</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-pink-600">{cycleHistory.averageCycleLength}</p>
            <p className="text-xs text-gray-500">Avg Cycle Length</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-red-600">{cycleHistory.averagePeriodLength}</p>
            <p className="text-xs text-gray-500">Avg Period Length</p>
          </div>
        </div>
      </div>

      {/* Cycle History */}
      <div className="bg-white rounded-xl p-4 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Period History</h2>
        
        {cycleHistory.periods.length > 0 ? (
          <div className="space-y-3">
            {cycleHistory.periods.map((period, index) => {
              const formatted = formatPeriodForDisplay(period);
              const isRecent = index < 3;
              
              return (
                <div 
                  key={period.id || index}
                  className={`p-3 rounded-lg border-l-4 ${
                    isRecent ? 'border-purple-500 bg-purple-50' : 'border-gray-300 bg-gray-50'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium text-gray-800">{formatted.dateRange}</p>
                      <p className="text-sm text-gray-600">{formatted.durationText}{formatted.cycleText}</p>
                      {period.cycleLength && (
                        <p className="text-xs text-gray-500 mt-1">
                          {period.cycleLength} day cycle from previous period
                        </p>
                      )}
                    </div>
                    {isRecent && (
                      <span className="bg-purple-500 text-white text-xs px-2 py-1 rounded-full">
                        Recent
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="text-6xl mb-4">📅</div>
            <h3 className="text-lg font-medium text-gray-800 mb-2">No Cycles Yet</h3>
            <p className="text-sm text-gray-500 mb-4">
              Complete your onboarding to start tracking your cycles
            </p>
            <button
              onClick={() => navigate("/date-of-birth")}
              className="bg-purple-500 text-white px-6 py-2 rounded-full text-sm font-medium"
            >
              Complete Setup
            </button>
          </div>
        )}
      </div>

      {/* Data Quality Insights */}
      {cycleHistory.periods.length > 0 && (
        <div className="bg-gradient-to-r from-purple-100 to-pink-100 rounded-xl p-4 mt-6">
          <h3 className="font-semibold text-gray-800 mb-2">📊 Insights</h3>
          {cycleHistory.totalCycles === 1 && (
            <p className="text-sm text-gray-700">
              Track a few more cycles to see patterns and get personalized predictions! 🚀
            </p>
          )}
          {cycleHistory.totalCycles >= 2 && cycleHistory.totalCycles < 5 && (
            <p className="text-sm text-gray-700">
              Great progress! With {cycleHistory.totalCycles} cycles tracked, you're building valuable data for insights. 📈
            </p>
          )}
          {cycleHistory.totalCycles >= 5 && (
            <p className="text-sm text-gray-700">
              Excellent! With {cycleHistory.totalCycles} cycles tracked, you have rich data for accurate predictions and personalized insights. 🎯
            </p>
          )}
        </div>
      )}

      <BottomNav />
    </div>
  );
};

export default MyCycles;
import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { DayPicker } from "react-day-picker";
import { doc, setDoc, collection } from "firebase/firestore";
import { db, auth } from "../firebase";
import type { DateRange } from "react-day-picker";
import "react-day-picker/dist/style.css";

const LogPeriod = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [range, setRange] = useState<DateRange>({ from: undefined, to: undefined });
  const [isLogging, setIsLogging] = useState(false);
  const [logType, setLogType] = useState<'current' | 'past'>('current');

  // Check where user came from for smart navigation
  const returnTo = location.state?.returnTo || '/home';

  const handleSave = async () => {
    if (!range.from || !range.to) {
      alert("Please select both start and end dates");
      return;
    }

    const user = auth.currentUser;
    if (!user) {
      alert("Please log in to save period data");
      return;
    }

    setIsLogging(true);

    try {
      // Save to period logs collection
      const periodRef = doc(collection(db, "users", user.uid, "periodLogs"));
      
      await setDoc(periodRef, {
        startDate: range.from.toISOString(),
        endDate: range.to.toISOString(),
        duration: Math.ceil((range.to.getTime() - range.from.getTime()) / (1000 * 60 * 60 * 24)),
        loggedAt: new Date().toISOString(),
        type: logType
      });

      console.log("✅ Period logged successfully");
      
      // Navigate back to where they came from
      navigate(returnTo, { replace: true });
      
    } catch (error) {
      console.error("❌ Error logging period:", error);
      alert("Failed to save period data. Please try again.");
    } finally {
      setIsLogging(false);
    }
  };

  const formatDateRange = () => {
    if (!range.from || !range.to) return "";
    
    const duration = Math.ceil((range.to.getTime() - range.from.getTime()) / (1000 * 60 * 60 * 24));
    const start = range.from.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const end = range.to.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    
    return `${start} - ${end} (${duration} days)`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50">
      <div className="p-6 pb-24">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => navigate(returnTo)}
            className="w-10 h-10 rounded-full bg-white shadow-md flex items-center justify-center"
          >
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-xl font-bold text-gray-800">Log Your Period</h1>
          <div className="w-10"></div>
        </div>

        {/* Type Selection */}
        <div className="bg-white rounded-2xl p-4 shadow-lg mb-6">
          <p className="text-gray-600 text-sm mb-3">What are you logging?</p>
          <div className="flex space-x-3">
            <button
              onClick={() => setLogType('current')}
              className={`flex-1 py-3 px-4 rounded-xl font-medium transition-all ${
                logType === 'current'
                  ? 'bg-red-500 text-white shadow-lg'
                  : 'bg-gray-100 text-gray-600'
              }`}
            >
              🩸 Current Period
            </button>
            <button
              onClick={() => setLogType('past')}
              className={`flex-1 py-3 px-4 rounded-xl font-medium transition-all ${
                logType === 'past'
                  ? 'bg-purple-500 text-white shadow-lg'
                  : 'bg-gray-100 text-gray-600'
              }`}
            >
              📅 Past Period
            </button>
          </div>
        </div>

        {/* Instructions */}
        <div className="bg-gradient-to-r from-pink-500 to-red-500 rounded-2xl p-4 mb-6 text-white">
          <div className="flex items-center space-x-3">
            <span className="text-2xl">💡</span>
            <div>
              <p className="font-medium">How to log your period:</p>
              <p className="text-sm opacity-90">
                {logType === 'current' 
                  ? "Select the day your period started and when it ended (or today if ongoing)"
                  : "Select the start and end dates of a previous period"
                }
              </p>
            </div>
          </div>
        </div>

        {/* Calendar */}
        <div className="bg-white rounded-2xl p-4 shadow-lg mb-6">
          <style>{`
            .rdp {
              --rdp-cell-size: 40px;
              --rdp-accent-color: #ef4444;
              --rdp-background-color: #fef2f2;
              --rdp-accent-color-dark: #dc2626;
              --rdp-background-color-dark: #fef2f2;
              --rdp-outline: 2px solid var(--rdp-accent-color);
              --rdp-outline-selected: 2px solid #ef4444;
            }
            .rdp-day_selected {
              background-color: #ef4444;
              color: white;
            }
            .rdp-day_selected:hover {
              background-color: #dc2626;
            }
            .rdp-day_range_middle {
              background-color: #fecaca;
              color: #dc2626;
            }
          `}</style>
          
          <DayPicker
            mode="range"
            selected={range}
            onSelect={(selectedRange) => setRange(selectedRange as DateRange)}
            showOutsideDays
            className="w-full"
            modifiers={{
              selected: range.from && range.to ? { from: range.from, to: range.to } : undefined
            }}
            disabled={{ after: new Date() }} // Can't select future dates
          />
        </div>

        {/* Selected Range Display */}
        {range.from && range.to && (
          <div className="bg-white rounded-2xl p-4 shadow-lg mb-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Selected Period</p>
                <p className="font-semibold text-gray-800">{formatDateRange()}</p>
              </div>
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <span className="text-xl">🩸</span>
              </div>
            </div>
          </div>
        )}

        {/* Save Button */}
        <button
          onClick={handleSave}
          disabled={!range.from || !range.to || isLogging}
          className={`w-full py-4 rounded-2xl font-semibold text-lg transition-all ${
            range.from && range.to && !isLogging
              ? 'bg-gradient-to-r from-pink-500 to-red-500 text-white shadow-xl hover:shadow-2xl'
              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
          }`}
        >
          {isLogging ? (
            <div className="flex items-center justify-center space-x-2">
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              <span>Saving...</span>
            </div>
          ) : (
            `Save ${logType === 'current' ? 'Current' : 'Past'} Period`
          )}
        </button>

        {/* Tips */}
        <div className="mt-6 bg-blue-50 rounded-xl p-4">
          <p className="text-blue-800 font-medium text-sm mb-2">💡 Pro Tips:</p>
          <ul className="text-blue-700 text-xs space-y-1">
            <li>• Log periods consistently for better predictions</li>
            <li>• Include light days at the beginning and end</li>
            <li>• You can always edit dates later if needed</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default LogPeriod;
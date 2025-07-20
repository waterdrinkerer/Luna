import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { DayPicker } from "react-day-picker";
import { doc, setDoc, collection, getDocs, query, orderBy } from "firebase/firestore";
import { db, auth } from "../firebase";
import type { DateRange } from "react-day-picker";
import "react-day-picker/dist/style.css";

const LogPeriod = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [range, setRange] = useState<DateRange>({ from: undefined, to: undefined });
  const [isLogging, setIsLogging] = useState(false);
  const [logType, setLogType] = useState<'current' | 'past'>('current');
  const [isOngoing, setIsOngoing] = useState(false);
  const [previousPeriods, setPreviousPeriods] = useState<DateRange[]>([]);
  const [loading, setLoading] = useState(true);

  // Check where user came from for smart navigation - prevent loops
  const returnTo = location.state?.returnTo === '/cycle-overview' ? '/home' : (location.state?.returnTo || '/home');

  // Fetch previous periods to show on calendar
  useEffect(() => {
    const fetchPreviousPeriods = async () => {
      const user = auth.currentUser;
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        // Get previous period logs
        const periodLogsRef = collection(db, "users", user.uid, "periodLogs");
        const q = query(periodLogsRef, orderBy("startDate", "desc"));
        const querySnapshot = await getDocs(q);

        const periods: DateRange[] = [];
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          if (data.startDate && data.endDate) {
            periods.push({
              from: new Date(data.startDate),
              to: new Date(data.endDate)
            });
          }
        });

        // Also get onboarding period from user profile
        const userDoc = await import("firebase/firestore").then(({ doc: docFunc, getDoc }) => 
          getDoc(docFunc(db, "users", user.uid))
        );
        
        if (userDoc.exists()) {
          const userData = userDoc.data();
          if (userData.lastPeriodStart && userData.lastPeriodEnd) {
            periods.push({
              from: new Date(userData.lastPeriodStart),
              to: new Date(userData.lastPeriodEnd)
            });
          }
        }

        setPreviousPeriods(periods);
        console.log("📅 Loaded previous periods:", periods.length);
      } catch (error) {
        console.error("❌ Error fetching previous periods:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPreviousPeriods();
  }, []);

  const handleSave = async () => {
    if (!range.from) {
      alert("Please select at least the start date");
      return;
    }

    // Handle ongoing periods (only start date selected)
    const endDate = range.to || (isOngoing ? new Date() : range.from);
    
    const user = auth.currentUser;
    if (!user) {
      alert("Please log in to save period data");
      return;
    }

    setIsLogging(true);

    try {
      // Save to period logs collection
      const periodRef = doc(collection(db, "users", user.uid, "periodLogs"));
      
      const duration = Math.ceil((endDate.getTime() - range.from.getTime()) / (1000 * 60 * 60 * 24)) + 1; // Add 1 for same-day periods
      
      await setDoc(periodRef, {
        startDate: range.from.toISOString(),
        endDate: endDate.toISOString(),
        duration: duration,
        isOngoing: isOngoing && !range.to, // Mark as ongoing if no end date
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

  // Check if a date is within any previous period
  const isDateInPreviousPeriod = (date: Date) => {
    return previousPeriods.some(period => {
      if (!period.from || !period.to) return false;
      return date >= period.from && date <= period.to;
    });
  };

  // Check if a date is the start or end of a previous period
  const isPeriodBoundary = (date: Date) => {
    return previousPeriods.some(period => {
      if (!period.from || !period.to) return false;
      return (
        date.toDateString() === period.from.toDateString() ||
        date.toDateString() === period.to.toDateString()
      );
    });
  };

  // Check for potential duplicates
  const checkForDuplicates = (selectedRange: DateRange) => {
    if (!selectedRange.from || !selectedRange.to) return null;
    
    return previousPeriods.find(period => {
      if (!period.from || !period.to) return false;
      
      // Check if dates overlap
      const overlapStart = Math.max(selectedRange.from!.getTime(), period.from.getTime());
      const overlapEnd = Math.min(selectedRange.to!.getTime(), period.to.getTime());
      
      return overlapStart <= overlapEnd;
    });
  };

  const duplicatePeriod = range.from && range.to ? checkForDuplicates(range) : null;

  const formatDateRange = () => {
    if (!range.from || !range.to) return "";
    
    const duration = Math.ceil((range.to.getTime() - range.from.getTime()) / (1000 * 60 * 60 * 24));
    const start = range.from.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const end = range.to.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    
    return `${start} - ${end} (${duration} days)`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-pink-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your period history...</p>
        </div>
      </div>
    );
  }

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

        {/* Type Selection with Ongoing Option */}
        <div className="bg-white rounded-2xl p-4 shadow-lg mb-6">
          <p className="text-gray-600 text-sm mb-3">What are you logging?</p>
          <div className="grid grid-cols-2 gap-3 mb-4">
            <button
              onClick={() => {
                setLogType('current');
                setIsOngoing(false);
              }}
              className={`py-3 px-4 rounded-xl font-medium transition-all ${
                logType === 'current' && !isOngoing
                  ? 'bg-red-500 text-white shadow-lg'
                  : 'bg-gray-100 text-gray-600'
              }`}
            >
              🩸 Complete Period
            </button>
            <button
              onClick={() => {
                setLogType('past');
                setIsOngoing(false);
              }}
              className={`py-3 px-4 rounded-xl font-medium transition-all ${
                logType === 'past'
                  ? 'bg-purple-500 text-white shadow-lg'
                  : 'bg-gray-100 text-gray-600'
              }`}
            >
              📅 Past Period
            </button>
          </div>
          
          {/* Ongoing Period Option */}
          <button
            onClick={() => {
              setLogType('current');
              setIsOngoing(true);
              setRange({ from: new Date(), to: undefined });
            }}
            className={`w-full py-3 px-4 rounded-xl font-medium transition-all ${
              isOngoing
                ? 'bg-pink-500 text-white shadow-lg'
                : 'bg-pink-100 text-pink-700'
            }`}
          >
            🌸 Period Started Today (Ongoing)
          </button>
          
          {isOngoing && (
            <p className="text-xs text-pink-600 mt-2 text-center">
              Just select the start date - you can update the end date later
            </p>
          )}
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

        {/* Calendar with Previous Periods Marked */}
        <div className="bg-white rounded-2xl p-4 shadow-lg mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-800">Select Period Dates</h3>
            {previousPeriods.length > 0 && (
              <div className="flex items-center space-x-2 text-xs">
                <div className="w-3 h-3 bg-red-200 rounded border border-red-400"></div>
                <span className="text-gray-600">Previous periods</span>
              </div>
            )}
          </div>
          
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
              background-color: #ef4444 !important;
              color: white !important;
            }
            .rdp-day_selected:hover {
              background-color: #dc2626 !important;
            }
            .rdp-day_range_middle {
              background-color: #fecaca !important;
              color: #dc2626 !important;
            }
            .previous-period {
              background-color: #fecaca !important;
              border: 1px solid #f87171 !important;
              color: #991b1b !important;
            }
            .previous-period-boundary {
              background-color: #f87171 !important;
              color: white !important;
              font-weight: bold !important;
            }
          `}</style>
          
          <DayPicker
            mode={isOngoing ? "single" : "range"}
            selected={isOngoing ? range.from : range}
            onSelect={(selectedRange) => {
              if (isOngoing) {
                setRange({ from: selectedRange as Date, to: undefined });
              } else {
                setRange(selectedRange as DateRange);
              }
            }}
            showOutsideDays
            className="w-full"
            modifiers={{
              selected: isOngoing ? range.from : (range.from && range.to ? { from: range.from, to: range.to } : undefined),
              previousPeriod: (date) => isDateInPreviousPeriod(date),
              previousPeriodBoundary: (date) => isPeriodBoundary(date)
            }}
            modifiersClassNames={{
              previousPeriod: 'previous-period',
              previousPeriodBoundary: 'previous-period-boundary'
            }}
            disabled={{ after: new Date() }} // Can't select future dates
            required={false}
          />
          
          {/* Previous Periods Legend */}
          {previousPeriods.length > 0 && (
            <div className="mt-4 p-3 bg-red-50 rounded-lg">
              <p className="text-sm font-medium text-red-800 mb-2">
                📅 Previous Periods ({previousPeriods.length} logged)
              </p>
              <div className="text-xs text-red-700 space-y-1">
                {previousPeriods.slice(0, 3).map((period, index) => (
                  <div key={index} className="flex justify-between">
                    <span>
                      {period.from?.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - 
                      {period.to?.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </span>
                    <span>
                      {period.from && period.to 
                        ? Math.ceil((period.to.getTime() - period.from.getTime()) / (1000 * 60 * 60 * 24)) + ' days'
                        : ''
                      }
                    </span>
                  </div>
                ))}
                {previousPeriods.length > 3 && (
                  <p className="text-red-600 font-medium">+ {previousPeriods.length - 3} more periods</p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Selected Range Display with Duplicate Warning */}
        {range.from && (
          <div className={`rounded-2xl p-4 shadow-lg mb-6 ${
            duplicatePeriod ? 'bg-yellow-50 border border-yellow-200' : 'bg-white'
          }`}>
            {duplicatePeriod && (
              <div className="flex items-center space-x-2 mb-3 text-yellow-800">
                <span className="text-lg">⚠️</span>
                <div>
                  <p className="font-medium text-sm">Possible Duplicate Period</p>
                  <p className="text-xs">This overlaps with a previously logged period</p>
                </div>
              </div>
            )}
            
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">
                  {isOngoing ? 'Period Started' : 'Selected Period'}
                </p>
                <p className="font-semibold text-gray-800">
                  {isOngoing 
                    ? `${range.from.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} (Ongoing)`
                    : formatDateRange()
                  }
                </p>
                {duplicatePeriod && (
                  <button
                    onClick={() => navigate('/manage-periods')}
                    className="text-blue-600 text-xs underline mt-1"
                  >
                    Edit existing period instead?
                  </button>
                )}
              </div>
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <span className="text-xl">{isOngoing ? '🌸' : '🩸'}</span>
              </div>
            </div>
          </div>
        )}

        {/* Save Button */}
        <button
          onClick={handleSave}
          disabled={!range.from || isLogging}
          className={`w-full py-4 rounded-2xl font-semibold text-lg transition-all ${
            range.from && !isLogging
              ? 'bg-gradient-to-r from-pink-500 to-red-500 text-white shadow-xl hover:shadow-2xl'
              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
          }`}
        >
          {isLogging ? (
            <div className="flex items-center justify-center space-x-2">
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              <span>Saving...</span>
            </div>
          ) : isOngoing ? (
            'Log Period Start'
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
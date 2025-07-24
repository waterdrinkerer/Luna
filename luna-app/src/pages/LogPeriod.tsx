import { useNavigate, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { DayPicker } from 'react-day-picker';
import type { DateRange } from 'react-day-picker';
import { collection, doc, setDoc, getDocs, query, orderBy, getDoc } from 'firebase/firestore';
import { db, auth } from '../firebase';

import 'react-day-picker/dist/style.css';

type PeriodType = 'past' | 'current';

// ✅ NEW: Exclusion reasons for irregular periods
type ExclusionReason = 
  | 'emergency_contraception'
  | 'hormonal_medication'
  | 'stress_illness'
  | 'postpartum_breastfeeding'
  | 'travel_timezone'
  | 'weight_change'
  | 'other';

interface ExclusionReasonOption {
  value: ExclusionReason;
  label: string;
  emoji: string;
  description: string;
  color: string;
}

const EXCLUSION_REASONS: ExclusionReasonOption[] = [
  {
    value: 'emergency_contraception',
    label: 'Plan B / Emergency Contraception',
    emoji: '💊',
    description: 'Took Plan B, morning-after pill, or emergency contraception',
    color: 'bg-red-50 text-red-700 border-red-200'
  },
  {
    value: 'hormonal_medication',
    label: 'Hormonal Medication',
    emoji: '🏥',
    description: 'Birth control, hormone therapy, or other medications',
    color: 'bg-blue-50 text-blue-700 border-blue-200'
  },
  {
    value: 'stress_illness',
    label: 'Stress or Illness',
    emoji: '😰',
    description: 'High stress, fever, illness, or major life changes',
    color: 'bg-yellow-50 text-yellow-700 border-yellow-200'
  },
  {
    value: 'postpartum_breastfeeding',
    label: 'Postpartum / Breastfeeding',
    emoji: '🤱',
    description: 'Post-pregnancy, breastfeeding, or postpartum recovery',
    color: 'bg-pink-50 text-pink-700 border-pink-200'
  },
  {
    value: 'travel_timezone',
    label: 'Travel / Timezone Changes',
    emoji: '✈️',
    description: 'Long travel, jet lag, or significant schedule changes',
    color: 'bg-purple-50 text-purple-700 border-purple-200'
  },
  {
    value: 'weight_change',
    label: 'Significant Weight Change',
    emoji: '⚖️',
    description: 'Rapid weight loss/gain, diet changes, or eating disorders',
    color: 'bg-orange-50 text-orange-700 border-orange-200'
  },
  {
    value: 'other',
    label: 'Other Irregular Circumstances',
    emoji: '❓',
    description: 'Other factors that may have affected this cycle',
    color: 'bg-gray-50 text-gray-700 border-gray-200'
  }
];

const LogPeriod = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  const returnTo = location.state?.returnTo || '/home';

  const [periodType, setPeriodType] = useState<PeriodType>('current');
  const [range, setRange] = useState<DateRange | undefined>({
    from: undefined,
    to: undefined,
  });
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [isLogging, setIsLogging] = useState(false);
  const [selectedFlow, setSelectedFlow] = useState<'light' | 'medium' | 'heavy'>('medium');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(true);

  // ✅ NEW: Previous periods for calendar marking
  const [previousPeriods, setPreviousPeriods] = useState<DateRange[]>([]);

  // ✅ NEW: ML Exclusion States
  const [excludeFromML, setExcludeFromML] = useState(false);
  const [exclusionReason, setExclusionReason] = useState<ExclusionReason | null>(null);
  const [customExclusionNote, setCustomExclusionNote] = useState('');

  // ✅ NEW: Fetch previous periods to show on calendar
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
        const userDoc = await getDoc(doc(db, "users", user.uid));
        
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
        console.log("📅 Loaded previous periods for calendar:", periods.length);
      } catch (error) {
        console.error("❌ Error fetching previous periods:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPreviousPeriods();
  }, []);

  // ✅ Calendar helper functions
  const isDateInPreviousPeriod = (date: Date) => {
    return previousPeriods.some(period => {
      if (!period.from || !period.to) return false;
      return date >= period.from && date <= period.to;
    });
  };

  const isPeriodBoundary = (date: Date) => {
    return previousPeriods.some(period => {
      if (!period.from || !period.to) return false;
      return (
        date.toDateString() === period.from.toDateString() ||
        date.toDateString() === period.to.toDateString()
      );
    });
  };

  const checkForDuplicates = (selectedRange: DateRange | Date) => {
    let checkFrom: Date | undefined;
    let checkTo: Date | undefined;

    if (selectedRange instanceof Date) {
      checkFrom = selectedRange;
      checkTo = selectedRange;
    } else if (selectedRange && 'from' in selectedRange) {
      checkFrom = selectedRange.from;
      checkTo = selectedRange.to;
    }

    if (!checkFrom) return null;
    
    return previousPeriods.find(period => {
      if (!period.from || !period.to) return false;
      
      const overlapStart = Math.max(checkFrom!.getTime(), period.from.getTime());
      const overlapEnd = Math.min((checkTo || checkFrom!).getTime(), period.to.getTime());
      
      return overlapStart <= overlapEnd;
    });
  };

  // ✅ Safe range selection handler
  const handleRangeSelect = (selectedRange: DateRange | undefined) => {
    if (!selectedRange) {
      setRange({ from: undefined, to: undefined });
      return;
    }
    setRange(selectedRange);
  };

  // ✅ Handle single date selection for current periods
  const handleStartDateSelect = (selectedDate: Date | undefined) => {
    setStartDate(selectedDate);
  };

  const handleLogPeriod = async () => {
    const user = auth.currentUser;
    if (!user) {
      alert('Please log in to save your period.');
      return;
    }

    // Validate based on period type
    if (periodType === 'past') {
      if (!range?.from || !range?.to) {
        alert('Please select both start and end dates for your completed period.');
        return;
      }
    } else {
      if (!startDate) {
        alert('Please select when your current period started.');
        return;
      }
    }

    // Validate ML exclusion
    if (excludeFromML && !exclusionReason) {
      alert('Please select a reason for excluding this period from predictions.');
      return;
    }

    setIsLogging(true);

    try {
      let periodData: any;
      let docId: string;

      if (periodType === 'past') {
        // Past period - has both start and end dates
        const duration = Math.ceil(
          (range!.to!.getTime() - range!.from!.getTime()) / (1000 * 60 * 60 * 1000)
        ) + 1;

        if (duration > 10) {
          const confirmed = window.confirm(
            `This period is ${duration} days long, which is longer than typical. Are you sure this is correct?`
          );
          if (!confirmed) {
            setIsLogging(false);
            return;
          }
        }

        periodData = {
          startDate: range!.from!.toISOString(),
          endDate: range!.to!.toISOString(),
          duration,
          isOngoing: false,
          loggedAt: new Date().toISOString(),
          type: 'past' as const,
          source: 'manual_log',
          flow: selectedFlow,
          notes,
          updatedAt: new Date().toISOString(),
          // ✅ NEW: ML Exclusion Fields
          excludeFromML: excludeFromML,
          exclusionReason: excludeFromML ? exclusionReason : null,
          isIrregular: excludeFromML,
          irregularityNote: excludeFromML ? (customExclusionNote || getExclusionDescription(exclusionReason!)) : null
        };

        docId = range!.from!.toISOString().split('T')[0];

      } else {
        // Current period - only has start date, still ongoing
        const today = new Date();
        const daysSinceStart = Math.floor(
          (today.getTime() - startDate!.getTime()) / (1000 * 60 * 60 * 24)
        ) + 1;

        periodData = {
          startDate: startDate!.toISOString(),
          endDate: null, // No end date yet
          duration: null, // Will be calculated when period ends
          currentDay: daysSinceStart,
          isOngoing: true,
          loggedAt: new Date().toISOString(),
          type: 'current' as const,
          source: 'manual_log',
          flow: selectedFlow,
          notes,
          updatedAt: new Date().toISOString(),
          // ✅ NEW: ML Exclusion Fields
          excludeFromML: excludeFromML,
          exclusionReason: excludeFromML ? exclusionReason : null,
          isIrregular: excludeFromML,
          irregularityNote: excludeFromML ? (customExclusionNote || getExclusionDescription(exclusionReason!)) : null
        };

        docId = startDate!.toISOString().split('T')[0];
      }

      const periodRef = doc(collection(db, 'users', user.uid, 'periodLogs'), docId);
      await setDoc(periodRef, periodData, { merge: true });

      console.log('✅ Period logged successfully with ML exclusion data:', periodData);
      
      // Show contextual success message
      const baseMessage = periodType === 'past' 
        ? 'Period logged successfully! 🎉'
        : 'Current period tracking started! 🩸';
      
      const exclusionMessage = excludeFromML 
        ? '\n\n💡 This period will not be used for cycle predictions to keep your AI insights accurate.'
        : '';
      
      alert(baseMessage + exclusionMessage);
      navigate(returnTo);
      
    } catch (error) {
      console.error('❌ Error logging period:', error);
      alert('Failed to log period. Please try again.');
    } finally {
      setIsLogging(false);
    }
  };

  // ✅ Helper function to get exclusion description
  const getExclusionDescription = (reason: ExclusionReason): string => {
    const option = EXCLUSION_REASONS.find(r => r.value === reason);
    return option?.description || 'Irregular period';
  };

  // ✅ Validation based on period type
  const isValid = periodType === 'past' 
    ? (range?.from && range?.to)
    : !!startDate;

  // ✅ Check for duplicates
  const duplicatePeriod = periodType === 'past' 
    ? (range?.from && range?.to ? checkForDuplicates(range) : null)
    : (startDate ? checkForDuplicates(startDate) : null);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-pink-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your period history...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br  from-purple-50 to-pink-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-400  to-pink-400 rounded-b-3xl shadow-lg">
        <div className="px-6 pt-8 pb-6">
          <div className="flex items-center gap-3 mt-6 mb-4">
            <button
              onClick={() => navigate(-1)}
              className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center"
            >
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div>
              <h1 className="text-2xl font-bold text-white">Log Period</h1>
              <p className="text-white/80 text-sm">Track your menstrual cycle</p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-6 py-6 -mt-1 pb-6">
        {/* Period Type Selection */}
        <div className="bg-white rounded-3xl shadow-lg p-6 mb-6">
          <h2 className="text-lg font-bold text-gray-800 mb-4 text-center">
            What type of period are you logging?
          </h2>
          
          <div className="grid grid-cols-1 gap-4 mb-6">
            <button
              onClick={() => setPeriodType('current')}
              className={`p-4 rounded-2xl border-2 text-left transition-all ${
                periodType === 'current'
                  ? 'bg-pink-50 border-pink-300 ring-2 ring-pink-200'
                  : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
              }`}
            >
              <div className="flex items-center gap-4">
                <span className="text-3xl">🩸</span>
                <div>
                  <h3 className="font-semibold text-gray-800 text-lg">My period is happening now</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Started recently and still ongoing - we'll track it until it ends
                  </p>
                </div>
              </div>
            </button>

            <button
              onClick={() => setPeriodType('past')}
              className={`p-4 rounded-2xl border-2 text-left transition-all ${
                periodType === 'past'
                  ? 'bg-purple-50 border-purple-300 ring-2 ring-purple-200'
                  : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
              }`}
            >
              <div className="flex items-center gap-4">
                <span className="text-3xl">📅</span>
                <div>
                  <h3 className="font-semibold text-gray-800 text-lg">My period already ended</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Logging a completed period from the past with start and end dates
                  </p>
                </div>
              </div>
            </button>
          </div>
        </div>

        {/* Calendar Section */}
        <div className="bg-white rounded-3xl shadow-lg p-6 mb-6">
          {/* ✅ Calendar Styles for Previous Periods */}
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

          {periodType === 'past' ? (
            // Past period - select date range
            <>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-800">
                  📅 Select your completed period dates
                </h3>
                {previousPeriods.length > 0 && (
                  <div className="flex items-center space-x-2 text-xs">
                    <div className="w-3 h-3 bg-red-200 rounded border border-red-400"></div>
                    <span className="text-gray-600">Previous periods</span>
                  </div>
                )}
              </div>
              <p className="text-sm text-gray-600 mb-4 text-center">
                Choose the start and end dates of your finished period
              </p>
              
              <div className="flex justify-center mb-4">
                <DayPicker
                  mode="range"
                  selected={range}
                  onSelect={handleRangeSelect}
                  className="rounded-2xl border border-gray-200 p-4 bg-gray-50"
                  classNames={{
                    selected: 'bg-purple-500 text-white',
                    range_start: 'bg-purple-600 text-white',
                    range_end: 'bg-purple-600 text-white',
                    range_middle: 'bg-purple-100 text-purple-800',
                    today: 'font-bold text-purple-600 bg-purple-50',
                  }}
                  modifiers={{
                    previousPeriod: (date) => isDateInPreviousPeriod(date),
                    previousPeriodBoundary: (date) => isPeriodBoundary(date)
                  }}
                  modifiersClassNames={{
                    previousPeriod: 'previous-period',
                    previousPeriodBoundary: 'previous-period-boundary'
                  }}
                  disabled={{ after: new Date() }}
                />
              </div>

              {/* Show selected range */}
              {range?.from && range?.to && (
                <div className={`rounded-2xl p-4 border mb-4 ${
                  duplicatePeriod 
                    ? 'bg-yellow-50 border-yellow-200' 
                    : 'bg-purple-50 border-purple-100'
                }`}>
                  {duplicatePeriod && (
                    <div className="flex items-center space-x-2 mb-3 text-yellow-800">
                      <span className="text-lg">⚠️</span>
                      <div>
                        <p className="font-medium text-sm">Possible Duplicate Period</p>
                        <p className="text-xs">This overlaps with a previously logged period</p>
                        <button
                          onClick={() => navigate('/manage-periods')}
                          className="text-blue-600 text-xs underline mt-1"
                        >
                          Edit existing period instead?
                        </button>
                      </div>
                    </div>
                  )}
                  
                  <h4 className="font-semibold text-purple-800 mb-2">📊 Period Summary</h4>
                  <div className="grid grid-cols-2 gap-3 text-sm mb-3">
                    <div className="bg-white rounded-xl p-3">
                      <p className="text-purple-600 font-medium">Started</p>
                      <p className="text-gray-700">{range.from.toLocaleDateString()}</p>
                    </div>
                    <div className="bg-white rounded-xl p-3">
                      <p className="text-purple-600 font-medium">Ended</p>
                      <p className="text-gray-700">{range.to.toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className="text-center bg-white rounded-xl p-2">
                    <p className="text-sm text-purple-700">
                      <strong>Total Duration:</strong> {Math.ceil((range.to.getTime() - range.from.getTime()) / (1000 * 60 * 60 * 24)) + 1} days
                    </p>
                  </div>
                </div>
              )}
            </>
          ) : (
            // Current period - select start date only
            <>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-800">
                  🩸 When did your current period start?
                </h3>
                {previousPeriods.length > 0 && (
                  <div className="flex items-center space-x-2 text-xs">
                    <div className="w-3 h-3 bg-red-200 rounded border border-red-400"></div>
                    <span className="text-gray-600">Previous periods</span>
                  </div>
                )}
              </div>
              <p className="text-sm text-gray-600 mb-4 text-center">
                Select the day your period began (it's okay if it was today or a few days ago)
              </p>
              
              <div className="flex justify-center mb-4">
                <DayPicker
                  mode="single"
                  selected={startDate}
                  onSelect={handleStartDateSelect}
                  className="rounded-2xl border border-gray-200 p-4 bg-gray-50"
                  classNames={{
                    selected: 'bg-pink-500 text-white',
                    today: 'font-bold text-pink-600 bg-pink-50',
                  }}
                  modifiers={{
                    previousPeriod: (date) => isDateInPreviousPeriod(date),
                    previousPeriodBoundary: (date) => isPeriodBoundary(date)
                  }}
                  modifiersClassNames={{
                    previousPeriod: 'previous-period',
                    previousPeriodBoundary: 'previous-period-boundary'
                  }}
                  disabled={{ after: new Date() }}
                />
              </div>

              {/* Show selected start date and current day */}
              {startDate && (
                <div className={`rounded-2xl p-4 border mb-4 ${
                  duplicatePeriod 
                    ? 'bg-yellow-50 border-yellow-200' 
                    : 'bg-pink-50 border-pink-100'
                }`}>
                  {duplicatePeriod && (
                    <div className="flex items-center space-x-2 mb-3 text-yellow-800">
                      <span className="text-lg">⚠️</span>
                      <div>
                        <p className="font-medium text-sm">Possible Duplicate Period</p>
                        <p className="text-xs">This date overlaps with a previously logged period</p>
                        <button
                          onClick={() => navigate('/manage-periods')}
                          className="text-blue-600 text-xs underline mt-1"
                        >
                          Edit existing period instead?
                        </button>
                      </div>
                    </div>
                  )}
                  
                  <h4 className="font-semibold text-pink-800 mb-2">🔴 Current Period Status</h4>
                  <div className="grid grid-cols-2 gap-3 text-sm mb-3">
                    <div className="bg-white rounded-xl p-3">
                      <p className="text-pink-600 font-medium">Started On</p>
                      <p className="text-gray-700">{startDate.toLocaleDateString()}</p>
                    </div>
                    <div className="bg-white rounded-xl p-3">
                      <p className="text-pink-600 font-medium">Currently Day</p>
                      <p className="text-gray-700 font-bold">
                        Day {Math.floor((new Date().getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1}
                      </p>
                    </div>
                  </div>
                  <div className="text-center bg-white rounded-xl p-3">
                    <p className="text-sm text-pink-700">
                      <strong>📍 Status:</strong> Active & Ongoing
                    </p>
                    <p className="text-xs text-pink-600 mt-1">
                      We'll help you track this until you mark it as finished
                    </p>
                  </div>
                </div>
              )}
            </>
          )}

          {/* ✅ Previous Periods Legend */}
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
                        ? Math.ceil((period.to.getTime() - period.from.getTime()) / (1000 * 60 * 60 * 24)) + 1 + ' days'
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

        {/* ✅ NEW: ML Exclusion Section */}
        {isValid && (
          <div className="bg-white rounded-3xl shadow-lg p-6 mb-6">
            <div className="mb-6">
              <div className="flex items-start gap-3 mb-4">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <span className="text-blue-600 text-sm">🤖</span>
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-800 mb-2">AI Prediction Settings</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Help us keep your cycle predictions accurate by letting us know if this period was affected by special circumstances.
                  </p>
                  
                  {/* Toggle Switch */}
                  <label className="flex items-center gap-3 cursor-pointer">
                    <div className="relative">
                      <input
                        type="checkbox"
                        checked={excludeFromML}
                        onChange={(e) => {
                          setExcludeFromML(e.target.checked);
                          if (!e.target.checked) {
                            setExclusionReason(null);
                            setCustomExclusionNote('');
                          }
                        }}
                        className="sr-only"
                      />
                      <div className={`w-12 h-6 rounded-full transition-colors ${
                        excludeFromML ? 'bg-orange-500' : 'bg-gray-300'
                      }`}>
                        <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${
                          excludeFromML ? 'translate-x-6' : 'translate-x-0.5'
                        } mt-0.5`}></div>
                      </div>
                    </div>
                    <span className="text-sm font-medium text-gray-700">
                      This period was affected by medication or unusual circumstances
                    </span>
                  </label>
                </div>
              </div>

              {/* Exclusion Reason Selection */}
              {excludeFromML && (
                <div className="ml-11 space-y-4">
                  <div>
                    <h4 className="font-medium text-gray-800 mb-3">What affected this period?</h4>
                    <div className="grid grid-cols-1 gap-2">
                      {EXCLUSION_REASONS.map((reason) => (
                        <button
                          key={reason.value}
                          onClick={() => setExclusionReason(reason.value)}
                          className={`p-3 rounded-xl border-2 text-left transition-all ${
                            exclusionReason === reason.value
                              ? `${reason.color} ring-2 ring-orange-300`
                              : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <span className="text-lg">{reason.emoji}</span>
                            <div>
                              <h5 className="font-medium text-sm">{reason.label}</h5>
                              <p className="text-xs text-gray-600 mt-1">{reason.description}</p>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Custom Note for Exclusion */}
                  {exclusionReason && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Additional Details (Optional)
                      </label>
                      <textarea
                        value={customExclusionNote}
                        onChange={(e) => setCustomExclusionNote(e.target.value)}
                        placeholder={
                          exclusionReason === 'emergency_contraception' 
                            ? 'e.g., Took Plan B 2 days ago, expecting irregular timing...'
                            : 'Any additional details about what affected this cycle...'
                        }
                        className="w-full p-3 border border-gray-200 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-orange-300 text-sm"
                        rows={2}
                      />
                    </div>
                  )}

                  {/* Exclusion Explanation */}
                  <div className="bg-orange-50 rounded-xl p-3 border border-orange-200">
                    <div className="flex items-start gap-2">
                      <span className="text-orange-600 text-sm">ℹ️</span>
                      <div>
                        <p className="text-xs text-orange-800 font-medium mb-1">
                          Why exclude from predictions?
                        </p>
                        <p className="text-xs text-orange-700">
                          Periods affected by medications like Plan B, stress, illness, or hormonal changes 
                          don't represent your natural cycle pattern. Excluding them helps our AI give you 
                          more accurate predictions for your regular cycles.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Flow and Notes - Show when valid selection exists */}
        {isValid && (
          <div className="bg-white rounded-3xl shadow-lg p-6 mb-6">
            {/* Flow Selection */}
            <div className="mb-6">
              <h3 className="font-semibold text-gray-800 mb-3">💧 Flow Intensity</h3>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { value: 'light', label: 'Light', emoji: '💧', color: 'bg-blue-100 text-blue-700 border-blue-200' },
                  { value: 'medium', label: 'Medium', emoji: '🩸', color: 'bg-pink-100 text-pink-700 border-pink-200' },
                  { value: 'heavy', label: 'Heavy', emoji: '🔴', color: 'bg-red-100 text-red-700 border-red-200' },
                ].map((flow) => (
                  <button
                    key={flow.value}
                    onClick={() => setSelectedFlow(flow.value as any)}
                    className={`p-3 rounded-xl border-2 text-sm font-medium transition-all ${
                      selectedFlow === flow.value
                        ? `${flow.color} ring-2 ring-purple-300`
                        : 'bg-gray-100 text-gray-600 border-gray-200 hover:bg-gray-200'
                    }`}
                  >
                    <div className="text-lg mb-1">{flow.emoji}</div>
                    {flow.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Notes Section */}
            <div>
              <h3 className="font-semibold text-gray-800 mb-3">📝 Notes (Optional)</h3>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="How are you feeling? Any symptoms, cramps, mood changes, or observations..."
                className="w-full p-3 border border-gray-200 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-purple-300"
                rows={3}
              />
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-3">
          <button
            onClick={handleLogPeriod}
            disabled={!isValid || isLogging || (excludeFromML && !exclusionReason)}
            className={`w-full py-4 rounded-2xl font-semibold transition-all ${
              isValid && !isLogging && (!excludeFromML || exclusionReason)
                ? 'bg-purple-500 hover:bg-purple-600 text-white shadow-lg'
                : 'bg-gray-200 text-gray-500 cursor-not-allowed'
            }`}
          >
            {isLogging ? (
              <div className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Saving...
              </div>
            ) : (
              <>
                {periodType === 'past' ? '📅 Save Period' : '🩸 Start Tracking Period'}
                {excludeFromML && (
                  <div className="text-xs mt-1 opacity-90">
                    (Will not affect AI predictions)
                  </div>
                )}
              </>
            )}
          </button>

          <button
            onClick={() => navigate(-1)}
            disabled={isLogging}
            className="w-full py-4 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-2xl font-semibold transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default LogPeriod;
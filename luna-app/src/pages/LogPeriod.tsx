import { useNavigate, useLocation } from 'react-router-dom';
import { useState } from 'react';
import { DayPicker } from 'react-day-picker';
import type { DateRange } from 'react-day-picker';
import { collection, doc, setDoc } from 'firebase/firestore';
import { db, auth } from '../firebase';

import 'react-day-picker/dist/style.css';

type PeriodType = 'past' | 'current';

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

    setIsLogging(true);

    try {
      let periodData: any;
      let docId: string;

      if (periodType === 'past') {
        // Past period - has both start and end dates
        const duration = Math.ceil(
          (range!.to!.getTime() - range!.from!.getTime()) / (1000 * 60 * 60 * 24)
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
        };

        docId = startDate!.toISOString().split('T')[0];
      }

      const periodRef = doc(collection(db, 'users', user.uid, 'periodLogs'), docId);
      await setDoc(periodRef, periodData, { merge: true });

      console.log('✅ Period logged successfully:', periodData);
      
      // Show appropriate success message
      const successMessage = periodType === 'past' 
        ? 'Period logged successfully! 🎉'
        : 'Current period tracking started! We\'ll help you track it until it ends. 🩸';
      
      alert(successMessage);
      navigate(returnTo);
      
    } catch (error) {
      console.error('❌ Error logging period:', error);
      alert('Failed to log period. Please try again.');
    } finally {
      setIsLogging(false);
    }
  };

  // ✅ Validation based on period type
  const isValid = periodType === 'past' 
    ? (range?.from && range?.to)
    : !!startDate;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-400 to-pink-400 rounded-b-3xl shadow-lg">
        <div className="px-6 pt-8 pb-6">
          <div className="flex items-center gap-3 mb-4">
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
      <div className="px-6 py-6 -mt-4 pb-6">
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
          {periodType === 'past' ? (
            // Past period - select date range
            <>
              <h3 className="text-lg font-semibold text-gray-800 mb-4 text-center">
                📅 Select your completed period dates
              </h3>
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
                  disabled={{ after: new Date() }}
                />
              </div>

              {/* Show selected range */}
              {range?.from && range?.to && (
                <div className="bg-purple-50 rounded-2xl p-4 border border-purple-100">
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
              <h3 className="text-lg font-semibold text-gray-800 mb-4 text-center">
                🩸 When did your current period start?
              </h3>
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
                  disabled={{ after: new Date() }}
                />
              </div>

              {/* Show selected start date and current day */}
              {startDate && (
                <div className="bg-pink-50 rounded-2xl p-4 border border-pink-100">
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
        </div>

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
            disabled={!isValid || isLogging}
            className={`w-full py-4 rounded-2xl font-semibold transition-all ${
              isValid && !isLogging
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
              periodType === 'past' ? '📅 Save Completed Period' : '🩸 Start Tracking Current Period'
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
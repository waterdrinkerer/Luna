import { useNavigate } from 'react-router-dom';
import useOnboarding from '../context/useOnboarding';
import { useState } from 'react';
import { DayPicker } from 'react-day-picker';
import type { DateRange } from 'react-day-picker';

import 'react-day-picker/dist/style.css';

const LastPeriod = () => {
  const { update } = useOnboarding();
  const navigate = useNavigate();

  // ✅ FIXED: Handle undefined range properly
  const [range, setRange] = useState<DateRange | undefined>({
    from: undefined,
    to: undefined,
  });

  // ✅ FIXED: Safe range selection handler
  const handleRangeSelect = (selectedRange: DateRange | undefined) => {
    console.log('📅 Onboarding range selected:', selectedRange);
    
    // Handle undefined case (when clicking same date twice)
    if (!selectedRange) {
      setRange({
        from: undefined,
        to: undefined,
      });
      return;
    }

    setRange(selectedRange);
  };

  const handleNext = () => {
    // ✅ FIXED: Safe property access
    if (range?.from && range?.to) {
      console.log('✅ Updating onboarding with period dates:', {
        from: range.from,
        to: range.to
      });
      
      update({
        lastPeriodStart: range.from,
        lastPeriodEnd: range.to,
      });
      navigate('/cycle-length');
    } else {
      console.log('❌ Invalid range - cannot proceed');
    }
  };

  const handleNotSure = () => {
    console.log('📝 User selected "Not Sure" - using default values');
    
    // Provide default period dates (e.g., 5 days ago to 1 day ago)
    const today = new Date();
    const defaultStart = new Date(today.getTime() - 5 * 24 * 60 * 60 * 1000); // 5 days ago
    const defaultEnd = new Date(today.getTime() - 1 * 24 * 60 * 60 * 1000);   // 1 day ago
    
    update({
      lastPeriodStart: defaultStart,
      lastPeriodEnd: defaultEnd,
    });
    navigate('/cycle-length');
  };

  // ✅ FIXED: Safe validation
  const isValidRange = range?.from && range?.to;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-400 to-pink-400 rounded-b-3xl shadow-lg">
        <div className="px-6 pt-8 pb-6">
          <div className="text-center">
            <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mx-auto mb-4">
              <span className="text-white text-2xl">📅</span>
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">Last Period</h1>
            <p className="text-white/80 text-sm">
              Help us predict your next cycle
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-6 py-6 -mt-4 flex flex-col min-h-[calc(100vh-200px)]">
        <div className="bg-white rounded-3xl shadow-lg p-6 mb-6 flex-1">
          <h2 className="text-xl font-bold text-gray-800 mb-2 text-center">
            When did you last have your period?
          </h2>
          <p className="text-sm text-gray-600 mb-6 text-center">
            Select the start and end dates so we can predict your next period.
          </p>

          {/* Calendar */}
          <div className="flex justify-center mb-6">
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
                day: 'hover:bg-purple-50 transition-colors',
              }}
              disabled={{ after: new Date() }} // Can't select future dates
              fromDate={new Date(2020, 0, 1)} // Reasonable past limit
            />
          </div>

          {/* Selected Range Display */}
          {isValidRange && (
            <div className="bg-purple-50 rounded-2xl p-4 mb-6 border border-purple-100">
              <h3 className="font-semibold text-purple-800 mb-3 flex items-center gap-2">
                <span className="text-lg">✨</span>
                Period Selected
              </h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="bg-white rounded-xl p-3">
                  <p className="text-purple-600 font-medium">Start Date</p>
                  <p className="text-gray-700 font-semibold">{range.from?.toLocaleDateString()}</p>
                </div>
                <div className="bg-white rounded-xl p-3">
                  <p className="text-purple-600 font-medium">End Date</p>
                  <p className="text-gray-700 font-semibold">{range.to?.toLocaleDateString()}</p>
                </div>
              </div>
              <div className="mt-3 text-center">
                <p className="text-sm text-purple-700">
                  <strong>Duration:</strong> {
                    Math.ceil((range.to!.getTime() - range.from!.getTime()) / (1000 * 60 * 60 * 24)) + 1
                  } days
                </p>
              </div>
            </div>
          )}

          {/* Help Text */}
          <div className="bg-blue-50 rounded-2xl p-4 mb-6">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-blue-200 rounded-lg flex items-center justify-center flex-shrink-0">
                <span className="text-blue-600 text-sm">💡</span>
              </div>
              <div>
                <h4 className="font-medium text-blue-800 mb-1">Tip</h4>
                <p className="text-sm text-blue-700">
                  Select the first day your period started and the last day it ended. 
                  Don't worry if you're not 100% sure - we can always adjust this later!
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons - Fixed to bottom */}
        <div className="space-y-3">
          <button
            className={`w-full py-4 rounded-2xl font-semibold transition-all ${
              isValidRange
                ? 'bg-purple-500 hover:bg-purple-600 text-white shadow-lg'
                : 'bg-gray-200 text-gray-500 cursor-not-allowed'
            }`}
            onClick={handleNext}
            disabled={!isValidRange}
          >
            {isValidRange ? '✨ Continue Setup' : 'Select Period Dates'}
          </button>
          
          <button 
            onClick={handleNotSure}
            className="w-full py-4 rounded-2xl border-2 border-purple-500 text-purple-500 font-semibold hover:bg-purple-50 transition-all"
          >
            😅 Not Sure - Use Default
          </button>
        </div>
      </div>
    </div>
  );
};

export default LastPeriod;
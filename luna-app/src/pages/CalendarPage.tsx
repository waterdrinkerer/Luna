import { useState, useContext } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { OnboardingContext } from "../context/OnboardingContext";
import { calculateCurrentCyclePhase, type CycleData } from "../utils/cycleCalculator";
import BottomNav from "../components/BottomNav";

const CalendarPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const context = useContext(OnboardingContext);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  // Get real cycle data
  const cycleData: CycleData = {
    lastPeriodStart: context?.data.lastPeriodStart,
    lastPeriodEnd: context?.data.lastPeriodEnd,
    cycleLength: context?.data.cycleLength
  };

  const lastPeriodStart = cycleData.lastPeriodStart;
  const cycleLength = cycleData.cycleLength || 28;

  // Generate calendar days for the month
  const generateCalendarDays = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    
    const firstDay = new Date(year, month, 1);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay()); // Start from Sunday
    
    const days = [];
    const currentDate = new Date(startDate);
    
    // Generate 42 days (6 weeks)
    for (let i = 0; i < 42; i++) {
      const dateInfo = getDateInfo(new Date(currentDate));
      days.push({
        date: new Date(currentDate),
        dayNumber: currentDate.getDate(),
        isCurrentMonth: currentDate.getMonth() === month,
        isToday: currentDate.toDateString() === new Date().toDateString(),
        ...dateInfo
      });
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return days;
  };

  // Get cycle info for a specific date
  const getDateInfo = (date: Date) => {
    if (!lastPeriodStart) {
      return { phase: 'unknown', cycleDay: 0, isPeriod: false, isFertile: false, isOvulation: false };
    }

    const daysSinceLastPeriod = Math.floor((date.getTime() - lastPeriodStart.getTime()) / (1000 * 60 * 60 * 24));
    const cycleDay = ((daysSinceLastPeriod % cycleLength) + cycleLength) % cycleLength + 1;
    
    const ovulationDay = cycleLength - 14;
    const isPeriod = cycleDay <= 5;
    const isFertile = cycleDay >= ovulationDay - 2 && cycleDay <= ovulationDay;
    const isOvulation = cycleDay === ovulationDay;
    const isLuteal = cycleDay > ovulationDay + 3 && cycleDay < cycleLength - 5;
    const isPMS = cycleDay >= cycleLength - 5;

    let phase = 'follicular';
    if (isPeriod) phase = 'period';
    else if (isFertile) phase = 'fertile';
    else if (isOvulation) phase = 'ovulation';
    else if (isLuteal) phase = 'luteal';
    else if (isPMS) phase = 'pms';

    return {
      phase,
      cycleDay,
      isPeriod,
      isFertile,
      isOvulation,
      daysSinceLastPeriod
    };
  };

  // Get color for each phase
  const getPhaseColor = (phase: string, isToday: boolean = false) => {
    const colors = {
      period: isToday ? '#DC2626' : '#EF4444',
      fertile: isToday ? '#0891B2' : '#06B6D4',
      ovulation: isToday ? '#047857' : '#059669',
      luteal: isToday ? '#D97706' : '#F59E0B',
      pms: isToday ? '#B91C1C' : '#DC2626',
      follicular: isToday ? '#7C3AED' : '#8B5CF6',
      unknown: '#9CA3AF'
    };
    return colors[phase as keyof typeof colors] || colors.unknown;
  };

  // Get phase emoji
  const getPhaseEmoji = (phase: string) => {
    const emojis = {
      period: '🩸',
      fertile: '💫',
      ovulation: '🥚',
      luteal: '🌙',
      pms: '😤',
      follicular: '🌸',
      unknown: ''
    };
    return emojis[phase as keyof typeof emojis] || '';
  };

  const calendarDays = generateCalendarDays();
  const monthNames = ["January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"];

  const navigateMonth = (direction: number) => {
    const newMonth = new Date(currentMonth);
    newMonth.setMonth(newMonth.getMonth() + direction);
    setCurrentMonth(newMonth);
  };

  const currentPhaseData = calculateCurrentCyclePhase(cycleData);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50">
      <div className="p-6 pb-24">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-full bg-white shadow-md flex items-center justify-center"
          >
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-xl font-bold text-gray-800">Cycle Calendar</h1>
          <button
            onClick={() => navigate('/log-period', { state: { returnTo: location.pathname } })}
            className="px-4 py-2 bg-red-500 text-white text-sm font-medium rounded-full shadow-md"
          >
            Log Period
          </button>
        </div>

        {/* Current Status */}
        <div className="bg-white rounded-2xl p-4 shadow-lg mb-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Today's Phase</p>
              <p className="text-lg font-bold text-gray-800">{currentPhaseData.message}</p>
              <p className="text-sm text-gray-600">{currentPhaseData.subtext}</p>
            </div>
            <div className="text-3xl">
              {getPhaseEmoji(currentPhaseData.phase)}
            </div>
          </div>
        </div>

        {/* Month Navigation */}
        <div className="bg-white rounded-2xl p-4 shadow-lg mb-6">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => navigateMonth(-1)}
              className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200"
            >
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h2 className="text-lg font-bold text-gray-800">
              {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
            </h2>
            <button
              onClick={() => navigateMonth(1)}
              className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200"
            >
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          {/* Week Headers */}
          <div className="grid grid-cols-7 mb-2">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
              <div key={day} className="text-center text-xs font-medium text-gray-500 py-2">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map((day, index) => {
              const phaseColor = getPhaseColor(day.phase, day.isToday);
              const textColor = day.isCurrentMonth ? (day.isToday ? 'white' : '#374151') : '#9CA3AF';
              
              return (
                <button
                  key={index}
                  onClick={() => setSelectedDate(day.date)}
                  className={`aspect-square rounded-xl text-sm font-medium transition-all duration-200 hover:scale-105 ${
                    day.isToday ? 'ring-2 ring-purple-500 ring-offset-1' : ''
                  } ${selectedDate?.toDateString() === day.date.toDateString() ? 'ring-2 ring-blue-500' : ''}`}
                  style={{
                    backgroundColor: day.isCurrentMonth && day.phase !== 'unknown' ? phaseColor + '20' : 'transparent',
                    color: textColor,
                    border: day.isToday ? `2px solid ${phaseColor}` : '1px solid transparent'
                  }}
                >
                  <div className="flex flex-col items-center justify-center h-full">
                    <span className="text-xs">{day.dayNumber}</span>
                    {day.isCurrentMonth && day.phase !== 'unknown' && (
                      <div 
                        className="w-2 h-2 rounded-full mt-1"
                        style={{ backgroundColor: phaseColor }}
                      />
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Legend */}
        <div className="bg-white rounded-2xl p-4 shadow-lg mb-6">
          <h3 className="text-lg font-bold text-gray-800 mb-3">Cycle Phases</h3>
          <div className="grid grid-cols-2 gap-3">
            {[
              { phase: 'period', label: 'Period', emoji: '🩸' },
              { phase: 'follicular', label: 'Follicular', emoji: '🌸' },
              { phase: 'fertile', label: 'Fertile Window', emoji: '💫' },
              { phase: 'ovulation', label: 'Ovulation', emoji: '🥚' },
              { phase: 'luteal', label: 'Luteal Phase', emoji: '🌙' },
              { phase: 'pms', label: 'PMS', emoji: '😤' }
            ].map((item) => (
              <div key={item.phase} className="flex items-center space-x-2">
                <div 
                  className="w-4 h-4 rounded-full"
                  style={{ backgroundColor: getPhaseColor(item.phase) }}
                />
                <span className="text-sm">{item.emoji}</span>
                <span className="text-sm text-gray-700">{item.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Selected Date Info */}
        {selectedDate && (
          <div className="bg-white rounded-2xl p-4 shadow-lg">
            <h3 className="text-lg font-bold text-gray-800 mb-2">
              {selectedDate.toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </h3>
            {(() => {
              const dateInfo = getDateInfo(selectedDate);
              if (dateInfo.phase === 'unknown') {
                return <p className="text-gray-500">No cycle data available for this date</p>;
              }
              return (
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <span className="text-lg">{getPhaseEmoji(dateInfo.phase)}</span>
                    <span className="font-medium capitalize">{dateInfo.phase} Phase</span>
                  </div>
                  <p className="text-sm text-gray-600">Cycle Day {dateInfo.cycleDay}</p>
                  {dateInfo.isPeriod && <p className="text-sm text-red-600">Period day</p>}
                  {dateInfo.isFertile && <p className="text-sm text-blue-600">Fertile window</p>}
                  {dateInfo.isOvulation && <p className="text-sm text-green-600">Ovulation day</p>}
                </div>
              );
            })()}
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
};

export default CalendarPage;
import { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { OnboardingContext } from "../context/OnboardingContext";
import { calculateCurrentCyclePhase, type CycleData } from "../utils/cycleCalculator";
import BottomNav from "../components/BottomNav";

const CycleOverview = () => {
  const navigate = useNavigate();
  const context = useContext(OnboardingContext);
  const [showLogPeriod, setShowLogPeriod] = useState(false);

  // Get real cycle data
  const cycleData: CycleData = {
    lastPeriodStart: context?.data.lastPeriodStart,
    lastPeriodEnd: context?.data.lastPeriodEnd,
    cycleLength: context?.data.cycleLength
  };

  const currentPhaseData = calculateCurrentCyclePhase(cycleData);
  const today = new Date();
  
  // Calculate cycle info
  const lastPeriodStart = cycleData.lastPeriodStart;
  const cycleLength = cycleData.cycleLength || 28;
  const currentCycleDay = lastPeriodStart 
    ? Math.floor((today.getTime() - lastPeriodStart.getTime()) / (1000 * 60 * 60 * 24)) + 1
    : 1;

  // Calculate next period date
  const nextPeriodDate = lastPeriodStart 
    ? new Date(lastPeriodStart.getTime() + cycleLength * 24 * 60 * 60 * 1000)
    : new Date(today.getTime() + 5 * 24 * 60 * 60 * 1000);

  const daysToNextPeriod = Math.ceil((nextPeriodDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  // Calendar strip (7 days centered on today)
  const calendarStrip = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(today);
    date.setDate(today.getDate() + i - 3);
    const cycleDay = lastPeriodStart 
      ? Math.floor((date.getTime() - lastPeriodStart.getTime()) / (1000 * 60 * 60 * 24)) + 1
      : i;
    
    return {
      label: date.toLocaleDateString("en-US", { weekday: "short" }).charAt(0),
      date: date.getDate(),
      fullDate: date,
      isToday: date.toDateString() === today.toDateString(),
      cycleDay: cycleDay > 0 ? cycleDay : cycleLength + cycleDay,
      phase: getPhaseForDay(cycleDay > 0 ? cycleDay : cycleLength + cycleDay, cycleLength)
    };
  });

  // Get phase color for timeline
  function getPhaseForDay(day: number, cycleLength: number) {
    const ovulationDay = cycleLength - 14;
    if (day <= 5) return { name: 'period', color: '#EF4444' };
    if (day <= ovulationDay - 3) return { name: 'follicular', color: '#8B5CF6' };
    if (day <= ovulationDay) return { name: 'fertile', color: '#06B6D4' };
    if (day <= ovulationDay + 3) return { name: 'ovulation', color: '#059669' };
    if (day <= cycleLength - 5) return { name: 'luteal', color: '#F59E0B' };
    return { name: 'pms', color: '#DC2626' };
  }

  // Phase timeline data
  const getPhaseTimeline = () => {
    const ovulationDay = cycleLength - 14;
    return [
      { name: 'Period', start: 1, end: 5, color: '#EF4444', icon: '🩸' },
      { name: 'Follicular', start: 6, end: ovulationDay - 3, color: '#8B5CF6', icon: '🌸' },
      { name: 'Fertile Window', start: ovulationDay - 2, end: ovulationDay, color: '#06B6D4', icon: '💫' },
      { name: 'Ovulation', start: ovulationDay + 1, end: ovulationDay + 3, color: '#059669', icon: '🥚' },
      { name: 'Luteal', start: ovulationDay + 4, end: cycleLength - 5, color: '#F59E0B', icon: '🌙' },
      { name: 'PMS', start: cycleLength - 4, end: cycleLength, color: '#DC2626', icon: '😤' }
    ];
  };

  const phaseTimeline = getPhaseTimeline();

  // Get pregnancy chance
  const getPregnancyChance = () => {
    if (currentPhaseData.phase === 'ovulation' || currentPhaseData.phase === 'ovulationWindow') return 'HIGH';
    if (currentPhaseData.phase === 'ovulationCountdown') return 'MEDIUM';
    return 'LOW';
  };

  const pregnancyChance = getPregnancyChance();
  const pregnancyColor = pregnancyChance === 'HIGH' ? '#059669' : pregnancyChance === 'MEDIUM' ? '#F59E0B' : '#8B5CF6';

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
          <h1 className="text-xl font-bold text-gray-800">Cycle Overview</h1>
          <button
            onClick={() => navigate("/log-period", { state: { returnTo: "/cycle-overview" } })}
            className="px-4 py-2 bg-purple-500 text-white text-sm font-medium rounded-full shadow-md"
          >
            Log Period
          </button>
        </div>

        {/* Main Cycle Info Card */}
        <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-3xl p-6 shadow-xl mb-6 text-white">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-sm opacity-90">Cycle Day</p>
              <p className="text-3xl font-bold">{currentCycleDay} of {cycleLength}</p>
            </div>
            <div className="text-right">
              <p className="text-sm opacity-90">Next Period</p>
              <p className="text-lg font-semibold">
                {daysToNextPeriod > 0 ? `${daysToNextPeriod} days` : 'Today!'}
              </p>
            </div>
          </div>

          {/* Calendar Strip */}
          <div className="bg-white/20 rounded-2xl p-3 backdrop-blur-sm">
            <div className="flex justify-between items-center">
              {calendarStrip.map((item, index) => (
                <div key={index} className="flex flex-col items-center">
                  <p className="text-xs opacity-75 mb-1">{item.label}</p>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    item.isToday 
                      ? 'bg-white text-purple-600 shadow-lg' 
                      : 'text-white/80'
                  }`}>
                    {item.date}
                  </div>
                  <div 
                    className="w-2 h-2 rounded-full mt-1"
                    style={{ backgroundColor: item.phase.color }}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Current Phase Info */}
          <div className="mt-4 text-center">
            <p className="text-lg font-semibold mb-1">{currentPhaseData.message}</p>
            <p className="text-sm opacity-90">{currentPhaseData.subtext}</p>
          </div>
        </div>

        {/* Pregnancy Chance Card */}
        <div className="bg-white rounded-2xl p-4 shadow-lg mb-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm mb-1">Pregnancy Chance</p>
              <p className="text-xl font-bold" style={{ color: pregnancyColor }}>
                {pregnancyChance}
              </p>
            </div>
            <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ backgroundColor: pregnancyColor + '20' }}>
              <span className="text-2xl">
                {pregnancyChance === 'HIGH' ? '🥚' : pregnancyChance === 'MEDIUM' ? '💫' : '🌙'}
              </span>
            </div>
          </div>
        </div>

        {/* Phase Timeline */}
        <div className="bg-white rounded-2xl p-5 shadow-lg mb-6">
          <h3 className="text-lg font-bold text-gray-800 mb-4">Your Cycle Phases</h3>
          
          {/* Timeline Bar */}
          <div className="relative mb-6">
            <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
              {phaseTimeline.map((phase, index) => {
                const width = ((phase.end - phase.start + 1) / cycleLength) * 100;
                const left = ((phase.start - 1) / cycleLength) * 100;
                
                return (
                  <div
                    key={index}
                    className="absolute h-full transition-all duration-300"
                    style={{
                      backgroundColor: phase.color,
                      width: `${width}%`,
                      left: `${left}%`
                    }}
                  />
                );
              })}
            </div>
            
            {/* Current Day Indicator */}
            <div
              className="absolute top-0 w-1 h-3 bg-gray-800 rounded-full"
              style={{ left: `${((currentCycleDay - 1) / cycleLength) * 100}%` }}
            />
            <div
              className="absolute -top-8 text-xs font-medium text-gray-800 transform -translate-x-1/2"
              style={{ left: `${((currentCycleDay - 1) / cycleLength) * 100}%` }}
            >
              Today
            </div>
          </div>

          {/* Phase Cards */}
          <div className="grid grid-cols-2 gap-3">
            {phaseTimeline.map((phase, index) => {
              const isCurrentPhase = currentCycleDay >= phase.start && currentCycleDay <= phase.end;
              
              return (
                <div
                  key={index}
                  className={`p-3 rounded-xl border-2 transition-all duration-200 ${
                    isCurrentPhase
                      ? 'border-purple-500 bg-purple-50 scale-105'
                      : 'border-gray-200 bg-gray-50'
                  }`}
                  style={{
                    borderColor: isCurrentPhase ? phase.color : undefined,
                    backgroundColor: isCurrentPhase ? phase.color + '10' : undefined
                  }}
                >
                  <div className="flex items-center space-x-2">
                    <span className="text-lg">{phase.icon}</span>
                    <div>
                      <p className="font-medium text-sm text-gray-800">{phase.name}</p>
                      <p className="text-xs text-gray-600">Days {phase.start}-{phase.end}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={() => navigate("/log-symptoms", { state: { returnTo: "/cycle-overview" } })}
            className="bg-pink-500 text-white p-4 rounded-xl shadow-lg"
          >
            <span className="text-2xl mb-2 block">💭</span>
            <p className="font-medium">Log Symptoms</p>
            <p className="text-xs opacity-90">Track how you feel</p>
          </button>
          
          <button
            onClick={() => navigate("/calendar")}
            className="bg-purple-500 text-white p-4 rounded-xl shadow-lg"
          >
            <span className="text-2xl mb-2 block">📅</span>
            <p className="font-medium">Calendar View</p>
            <p className="text-xs opacity-90">See full month</p>
          </button>
        </div>
      </div>

      {/* Log Period Modal */}
      {showLogPeriod && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-6">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm">
            <h3 className="text-lg font-bold mb-4">Log Your Period</h3>
            <p className="text-gray-600 text-sm mb-6">
              Track when your period starts and ends for more accurate predictions.
            </p>
            <div className="space-y-3">
          <button
            onClick={() => navigate("/log-period", { state: { returnTo: "/cycle-overview" } })}
            className="w-full bg-purple-500 text-white py-3 rounded-xl font-medium"
          >
            Start Logging Period
          </button>
              <button
                onClick={() => setShowLogPeriod(false)}
                className="w-full border border-gray-300 text-gray-700 py-3 rounded-xl font-medium"
              >
                Maybe Later
              </button>
            </div>
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  );
};

export default CycleOverview;
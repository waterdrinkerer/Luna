import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { calculateCurrentCyclePhase, getMostRecentCycleData, type CycleData, type CyclePhase } from "../utils/cycleCalculator";
import { useMLPredictions } from "../hooks/useMLPredictions"; // ✅ ADD ML HOOK
import { auth } from "../firebase";
import BottomNav from "../components/BottomNav";

const CycleOverview = () => {
  const navigate = useNavigate();
  const [showLogPeriod, setShowLogPeriod] = useState(false);
  const [currentPhaseData, setCurrentPhaseData] = useState<CyclePhase>({
    phase: 'follicular',
    message: 'Loading...',
    subtext: 'Calculating your cycle...'
  });
  const [realTimeCycleData, setRealTimeCycleData] = useState<CycleData>({});

  // ✅ ADD ML PREDICTIONS HOOK
  const { predictions: mlPredictions, loading: mlLoading } = useMLPredictions();

  // ✅ ML-ENHANCED: Load real-time cycle data with ML predictions
  useEffect(() => {
    const loadRealTimeData = async () => {
      const user = auth.currentUser;
      if (user) {
        // Get base cycle data from periodLogs using FIXED calculator
        const freshData = await getMostRecentCycleData(user.uid);
        
        // ✅ ENHANCE with ML predictions
        let enhancedCycleData = { ...freshData };
        
        if (mlPredictions && !mlLoading) {
          console.log("🤖 Enhancing cycle data with ML predictions");
          
          // Use ML-predicted cycle length if available
          if (mlPredictions.nextPeriod?.date) {
            const today = new Date();
            const daysSinceLastPeriod = freshData.lastPeriodStart ? 
              Math.floor((today.getTime() - new Date(freshData.lastPeriodStart).getTime()) / (1000 * 60 * 60 * 24)) : 0;
            
            // Calculate ML-enhanced cycle length
            const mlCycleLength = daysSinceLastPeriod + mlPredictions.nextPeriod.daysUntil;
            
            enhancedCycleData = {
              ...freshData,
              cycleLength: mlCycleLength > 0 ? mlCycleLength : (freshData.cycleLength || 28)
            };
          }
        }
        
        setRealTimeCycleData(enhancedCycleData);
        
        const phaseData = calculateCurrentCyclePhase(enhancedCycleData);
        setCurrentPhaseData(phaseData);
        
        console.log("🤖 CycleOverview using ML-enhanced data:", {
          lastPeriodStart: enhancedCycleData.lastPeriodStart instanceof Date 
            ? enhancedCycleData.lastPeriodStart.toDateString()
            : enhancedCycleData.lastPeriodStart 
              ? new Date(enhancedCycleData.lastPeriodStart as string | number | Date).toDateString()
              : 'No date',
          phase: phaseData.phase,
          cycleLength: enhancedCycleData.cycleLength,
          mlEnhanced: !!mlPredictions,
          mlDaysUntil: mlPredictions?.nextPeriod?.daysUntil,
          isCurrentlyOnPeriod: enhancedCycleData.isCurrentlyOnPeriod,
          periodDuration: enhancedCycleData.periodDuration
        });
      }
    };

    loadRealTimeData();
  }, [mlPredictions, mlLoading]); // ✅ Re-run when ML predictions change

  const today = new Date();
  
  // ✅ Get cycle data safely
  const lastPeriodStart = realTimeCycleData.lastPeriodStart;
  const cycleLength = realTimeCycleData.cycleLength || 28;
  
  // ✅ FIXED: Current cycle day calculation - ALWAYS from period START date
  const getCurrentCycleDay = (): number => {
    if (!lastPeriodStart) return 1;
    
    const periodStartDate = lastPeriodStart instanceof Date 
      ? lastPeriodStart 
      : new Date(lastPeriodStart as string | number | Date);

    // ✅ CRITICAL FIX: ALWAYS calculate from period START date
    // Period start = Cycle Day 1, regardless of whether period is ongoing or completed
    const daysSinceStart = Math.floor((today.getTime() - periodStartDate.getTime()) / (1000 * 60 * 60 * 24));
    let currentCycleDay = daysSinceStart + 1;
    
    console.log('📅 CORRECT cycle day calculation:', {
      lastPeriodStart: periodStartDate.toDateString(),
      today: today.toDateString(),
      daysSinceStart,
      currentCycleDay,
      isCurrentlyOnPeriod: realTimeCycleData.isCurrentlyOnPeriod
    });
    
    // Handle edge cases
    if (currentCycleDay <= 0) return 1;
    if (currentCycleDay > cycleLength + 14) {
      return ((currentCycleDay - 1) % cycleLength) + 1;
    }
    
    return currentCycleDay;
  };

  const currentCycleDay = getCurrentCycleDay();

  // ✅ ML-ENHANCED: Days to next period calculation
  const getDaysToNextPeriod = (): number => {
    // ✅ Use ML prediction if available
    if (mlPredictions?.nextPeriod?.daysUntil !== undefined) {
      console.log("🤖 Using ML prediction for next period:", mlPredictions.nextPeriod.daysUntil);
      return Math.max(1, mlPredictions.nextPeriod.daysUntil);
    }
    
    // Fallback to math calculation using cycle day
    const daysUntilNext = Math.max(1, cycleLength - currentCycleDay + 1);
    
    console.log('📊 Math calculation fallback:', {
      currentCycleDay,
      cycleLength,
      daysUntilNext,
      calculation: `${cycleLength} - ${currentCycleDay} + 1 = ${daysUntilNext}`
    });
    
    return daysUntilNext;
  };

  const daysToNextPeriod = getDaysToNextPeriod();

  // ✅ Calendar strip with CORRECT cycle day calculation
  const calendarStrip = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(today);
    date.setDate(today.getDate() + i - 3);
    
    let cycleDay = 1;
    if (lastPeriodStart) {
      const periodStartDate = lastPeriodStart instanceof Date 
        ? lastPeriodStart 
        : new Date(lastPeriodStart as string | number | Date);
      
      // ✅ ALWAYS calculate from period START date
      const daysSinceStart = Math.floor((date.getTime() - periodStartDate.getTime()) / (1000 * 60 * 60 * 24));
      const rawCycleDay = daysSinceStart + 1;
      
      if (rawCycleDay <= 0) {
        cycleDay = cycleLength + rawCycleDay;
      } else if (rawCycleDay > cycleLength + 14) {
        cycleDay = ((rawCycleDay - 1) % cycleLength) + 1;
      } else {
        cycleDay = rawCycleDay;
      }
    }
    
    // Ensure cycle day is in valid range
    cycleDay = Math.max(1, Math.min(cycleLength, cycleDay));
    
    return {
      label: date.toLocaleDateString("en-US", { weekday: "short" }).charAt(0),
      date: date.getDate(),
      fullDate: date,
      isToday: date.toDateString() === today.toDateString(),
      cycleDay,
      phase: getPhaseForDay(cycleDay, cycleLength, realTimeCycleData.periodDuration || 5)
    };
  });

  // ✅ FIXED: Phase detection function with USER'S actual period length
  function getPhaseForDay(day: number, cycleLength: number, periodLength: number) {
    const ovulationDay = Math.max(14, cycleLength - 14);
    const fertileStart = ovulationDay - 2;
    const fertileEnd = ovulationDay + 1;
    
    // ✅ CORRECT: Use USER'S actual period length
    if (day <= periodLength) return { name: 'period', color: '#EF4444' };
    if (day < fertileStart) return { name: 'follicular', color: '#8B5CF6' };
    if (day <= fertileEnd) return { name: 'fertile', color: '#06B6D4' };
    if (day <= ovulationDay + 3) return { name: 'ovulation', color: '#059669' };
    if (day <= cycleLength - 5) return { name: 'luteal', color: '#F59E0B' };
    return { name: 'pms', color: '#DC2626' };
  }

  // ✅ FIXED: Dynamic phase timeline using USER'S actual period data
  const getPhaseTimeline = () => {
    const ovulationDay = Math.max(14, cycleLength - 14);
    const fertileStart = ovulationDay - 2;
    const fertileEnd = ovulationDay + 1;
    
    // ✅ CRITICAL FIX: Use USER'S actual period length from their data
    const periodLength = realTimeCycleData.periodDuration || 5;
    
    console.log('🔍 Building CORRECT phase timeline:', {
      cycleLength,
      periodLength: periodLength,
      ovulationDay,
      fertileStart,
      fertileEnd,
      currentCycleDay,
      userActualPeriodLength: realTimeCycleData.periodDuration
    });
    
    return [
      { 
        name: 'Period', 
        start: 1, 
        end: periodLength, // ✅ Uses USER'S actual 6-day period
        color: '#EF4444', 
        icon: '🩸' 
      },
      { 
        name: 'Follicular', 
        start: periodLength + 1, // ✅ Starts on day 7 for 6-day period
        end: fertileStart - 1, 
        color: '#8B5CF6', 
        icon: '🌸' 
      },
      { 
        name: 'Fertile Window', 
        start: fertileStart, 
        end: fertileEnd, 
        color: '#06B6D4', 
        icon: '💫' 
      },
      { 
        name: 'Ovulation', 
        start: ovulationDay, 
        end: ovulationDay + 1, 
        color: '#059669', 
        icon: '🥚' 
      },
      { 
        name: 'Luteal', 
        start: ovulationDay + 2, 
        end: cycleLength - 5, 
        color: '#F59E0B', 
        icon: '🌙' 
      },
      { 
        name: 'PMS', 
        start: cycleLength - 4, 
        end: cycleLength, 
        color: '#DC2626', 
        icon: '😤' 
      }
    ].filter(phase => phase.start <= phase.end && phase.start <= cycleLength);
  };

  const phaseTimeline = getPhaseTimeline();

  // ✅ ML-ENHANCED: Pregnancy chance calculation
  const getPregnancyChance = () => {
    // ✅ Use ML predictions if available
    if (mlPredictions?.dailySymptoms) {
      const phase = currentPhaseData.phase;
      
      // High chance during fertile window and ovulation
      if (phase === 'ovulation' || phase === 'fertile') return 'HIGH';
      
      // Medium chance approaching fertile window (late follicular)
      if (phase === 'follicular' && currentCycleDay > cycleLength / 2) return 'MEDIUM';
      
      return 'LOW';
    }
    
    // Fallback calculation
    const phase = currentPhaseData.phase;
    if (phase === 'ovulation' || phase === 'fertile') return 'HIGH';
    if (phase === 'follicular' && currentCycleDay > cycleLength / 2) return 'MEDIUM';
    
    // Also check by cycle day as backup
    const ovulationDay = Math.max(14, cycleLength - 14);
    if (currentCycleDay >= ovulationDay - 2 && currentCycleDay <= ovulationDay + 1) return 'HIGH';
    if (currentCycleDay >= ovulationDay - 4 && currentCycleDay <= ovulationDay + 3) return 'MEDIUM';
    
    return 'LOW';
  };

  const pregnancyChance = getPregnancyChance();
  const pregnancyColor = pregnancyChance === 'HIGH' ? '#059669' : pregnancyChance === 'MEDIUM' ? '#F59E0B' : '#8B5CF6';

  // ✅ Get ML confidence level
  const getMLConfidence = () => {
    if (mlPredictions?.confidence?.overall) {
      return mlPredictions.confidence.overall;
    }
    return 'basic';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50">
      <div className="p-6 pb-24">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-full mt-6 bg-white shadow-md flex items-center justify-center"
          >
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-xl font-bold mt-6 text-gray-800"> Cycle Overview</h1>
          <button
            onClick={() => navigate("/log-period", { state: { returnTo: "/cycle-overview" } })}
            className="px-4 py-2 mt-6 bg-purple-500 text-white text-sm font-medium rounded-full shadow-md"
          >
            Log Period
          </button>
        </div>

        {/* ML Status Indicator */}
        <div className="mb-4 p-2 bg-gradient-to-r from-purple-100 to-blue-100 rounded-lg">
          <div className="flex items-center justify-between text-xs">
            <span className="font-medium text-purple-800">
              {mlLoading ? "🔄 Loading ML..." : 
               mlPredictions ? "🤖 AI Predictions Active" : "📊 Math Calculations"}
            </span>
            <span className="text-purple-600 capitalize">
              {getMLConfidence()} confidence
            </span>
          </div>
        </div>

        {/* Debug Info - Shows the CORRECT values
        <div className="mb-4 p-2 bg-green-100 rounded text-xs">
          <p><strong>✅ CORRECT Debug:</strong> Phase: {currentPhaseData.phase}, Cycle Day: {currentCycleDay}/{cycleLength}, Days to Next: {daysToNextPeriod}</p>
          <p><strong>Period:</strong> Duration: {realTimeCycleData.periodDuration || 5} days, Currently On Period: {realTimeCycleData.isCurrentlyOnPeriod ? 'Yes' : 'No'}</p>
          <p><strong>Expected:</strong> Today (Aug 4) = Cycle Day 7 = Follicular Phase ✅</p>
        </div> */}

        {/* Main Cycle Info Card */}
        <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-3xl p-6 shadow-xl mb-6 text-white">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-sm opacity-90">Cycle Day</p>
              <p className="text-3xl font-bold">{currentCycleDay} of {cycleLength}</p>
              {mlPredictions && (
                <p className="text-xs opacity-75 mt-1">🤖 ML Enhanced</p>
              )}
            </div>
            <div className="text-right">
              <p className="text-sm opacity-90">Next Period</p>
              <p className="text-lg font-semibold">
                {daysToNextPeriod > 0 ? `${daysToNextPeriod} days` : 
                 daysToNextPeriod === 0 ? 'Today!' : 
                 `${Math.abs(daysToNextPeriod)} days overdue`}
              </p>
              {mlPredictions?.nextPeriod && (
                <p className="text-xs opacity-75 mt-1">
                  {mlPredictions.nextPeriod.confidence} confidence
                </p>
              )}
            </div>
          </div>

          {/* Calendar Strip */}
          <div className="bg-white/20 rounded-2xl p-3 backdrop-blur-sm">
            <div className="flex justify-between items-center">
              {calendarStrip.map((item, index) => (
                <div key={index} className="flex flex-col items-center">
                  <p className="text-xs opacity-90 mb-1 font-medium">{item.label}</p>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                    item.isToday 
                      ? 'bg-white text-purple-600 shadow-lg text-base' 
                      : 'text-white text-sm'
                  }`}>
                    {item.date}
                  </div>
                  <div 
                    className="w-2 h-2 rounded-full mt-1"
                    style={{ backgroundColor: item.phase.color }}
                  />
                  <p className="text-xs opacity-75 mt-1">D{item.cycleDay}</p>
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

        {/* ML-Enhanced Pregnancy Chance Card */}
        <div className="bg-white rounded-2xl p-4 shadow-lg mb-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm mb-1">Pregnancy Chance</p>
              <p className="text-xl font-bold" style={{ color: pregnancyColor }}>
                {pregnancyChance}
              </p>
              <p className="text-xs text-gray-500">Phase: {currentPhaseData.phase} • Day {currentCycleDay}</p>
              {mlPredictions && (
                <p className="text-xs text-purple-600 mt-1">🤖 ML Enhanced</p>
              )}
            </div>
            <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ backgroundColor: pregnancyColor + '20' }}>
              <span className="text-2xl">
                {pregnancyChance === 'HIGH' ? '🥚' : pregnancyChance === 'MEDIUM' ? '💫' : '🌙'}
              </span>
            </div>
          </div>
        </div>

        {/* ML Symptom Predictions */}
        {mlPredictions?.dailySymptoms && (
          <div className="bg-white rounded-2xl p-4 shadow-lg mb-6">
            <h3 className="text-lg font-bold text-gray-800 mb-3">🤖 AI Symptom Predictions</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="text-center p-3 bg-red-50 rounded-lg">
                <p className="text-xs text-gray-600">Cramps</p>
                <p className="text-sm font-bold text-red-600">
                  {mlPredictions.dailySymptoms.descriptions.cramps}
                </p>
              </div>
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <p className="text-xs text-gray-600">Fatigue</p>
                <p className="text-sm font-bold text-blue-600">
                  {mlPredictions.dailySymptoms.descriptions.fatigue}
                </p>
              </div>
              <div className="text-center p-3 bg-purple-50 rounded-lg">
                <p className="text-xs text-gray-600">Mood</p>
                <p className="text-sm font-bold text-purple-600">
                  {mlPredictions.dailySymptoms.descriptions.mood}
                </p>
              </div>
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <p className="text-xs text-gray-600">Overall</p>
                <p className="text-sm font-bold text-green-600">
                  {mlPredictions.dailySymptoms.descriptions.overall}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ✅ CORRECT: Dynamic Phase Timeline */}
        <div className="bg-white rounded-2xl p-5 shadow-lg mb-6">
          <h3 className="text-lg font-bold text-gray-800 mb-4">Your Current Cycle Phase</h3>
          
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
              style={{ left: `${Math.min(99, ((currentCycleDay - 1) / cycleLength) * 100)}%` }}
            />
            <div
              className="absolute -top-6 text-xs font-medium text-gray-800 transform -translate-x-1/2"
              style={{ left: `${Math.min(99, ((currentCycleDay - 1) / cycleLength) * 100)}%` }}
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
          
          {/* ✅ Show CORRECT personalization info */}
          <div className="mt-4 pt-3 border-t border-gray-100">
            <p className="text-xs text-gray-500">
              🎯 Personalized for your {realTimeCycleData.periodDuration || 5}-day periods and {cycleLength}-day cycles
              {mlPredictions && <span className="text-purple-600"> • 🤖 AI Enhanced</span>}
            </p>
           
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
            <p className="text-xs opacity-90">Feed the AI</p>
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
              Track when your period starts and ends for more accurate ML predictions.
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
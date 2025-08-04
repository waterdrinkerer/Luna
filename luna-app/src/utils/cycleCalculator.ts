import {
  collection,
  query,
  orderBy,
  limit,
  getDocs,
} from "firebase/firestore";
import { db } from "../firebase";

export interface CycleData {
  lastPeriodStart?: Date;
  lastPeriodEnd?: Date;
  cycleLength?: number;
  calculatedCycleLength?: number | null;
  // ✅ NEW: Current period detection
  isCurrentlyOnPeriod?: boolean;
  currentPeriodDay?: number;
  periodDuration?: number;
}

export interface CyclePhase {
  phase:
    | "countdown"
    | "period"
    | "follicular"
    | "fertile"
    | "ovulation"
    | "luteal"
    | "pms";
  message: string;
  subtext: string;
  daysLeft?: string;
  dayNumber?: number;
  // ✅ NEW: Period tracking info
  isOnPeriod?: boolean;
  periodDay?: number;
}

// Default values
const DEFAULT_CYCLE_LENGTH = 28;
const DEFAULT_PERIOD_LENGTH = 5;

// ✅ Safe date conversion
const safeDate = (dateInput: any): Date | null => {
  if (!dateInput) return null;
  if (dateInput instanceof Date) return dateInput;
  
  try {
    // Handle Firebase Timestamp
    if (dateInput && typeof dateInput === 'object' && typeof dateInput.toDate === 'function') {
      return dateInput.toDate();
    }
    return new Date(dateInput); // String or number
  } catch (error) {
    console.error('❌ Error converting date:', dateInput, error);
    return null;
  }
};

// ✅ Calculate cycle lengths from periods
const calculateCycleLengthFromPeriods = (periods: Array<{ startDate: any }>): number | null => {
  if (periods.length < 2) return null;

  const cycleLengths: number[] = [];

  for (let i = 0; i < periods.length - 1; i++) {
    const newer = safeDate(periods[i].startDate);
    const older = safeDate(periods[i + 1].startDate);

    if (!newer || !older) continue;

    const daysBetween = Math.round((newer.getTime() - older.getTime()) / (1000 * 60 * 60 * 24));

    if (daysBetween >= 18 && daysBetween <= 45) {
      cycleLengths.push(daysBetween);
    }
  }

  if (cycleLengths.length === 0) return null;
  
  const average = Math.round(cycleLengths.reduce((sum, length) => sum + length, 0) / cycleLengths.length);
  console.log(`📊 Calculated cycle length: ${average} days from ${cycleLengths.length} cycles`);
  
  return average;
};

// ✅ ENHANCED: Detect if currently on period
const detectCurrentPeriod = (periods: Array<any>): { isOnPeriod: boolean; periodDay?: number; duration?: number } => {
  if (periods.length === 0) {
    return { isOnPeriod: false };
  }

  const today = new Date();
  const latestPeriod = periods[0];
  
  const startDate = safeDate(latestPeriod.startDate);
  if (!startDate) {
    return { isOnPeriod: false };
  }

  const daysSinceStart = Math.floor((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  const currentPeriodDay = daysSinceStart + 1;

  // Check if we have an explicit end date
  const endDate = safeDate(latestPeriod.endDate);
  const periodDuration = latestPeriod.duration || DEFAULT_PERIOD_LENGTH;

  let isOnPeriod = false;

  if (endDate) {
    // Use explicit end date
    isOnPeriod = today <= endDate && currentPeriodDay >= 1;
    console.log('📅 Using explicit end date for period detection:', {
      today: today.toDateString(),
      endDate: endDate.toDateString(),
      isOnPeriod
    });
  } else {
    // Use duration
    isOnPeriod = currentPeriodDay >= 1 && currentPeriodDay <= periodDuration;
    console.log('📅 Using duration for period detection:', {
      currentPeriodDay,
      periodDuration,
      isOnPeriod
    });
  }

  return {
    isOnPeriod,
    periodDay: isOnPeriod ? currentPeriodDay : undefined,
    duration: periodDuration
  };
};

// ✅ ENHANCED: Get cycle data with current period detection
export const getMostRecentCycleData = async (userId: string): Promise<CycleData> => {
  if (!userId) {
    console.log('❌ No user ID provided');
    return {};
  }

  try {
    console.log('🔄 Loading enhanced cycle data from periodLogs for user:', userId);

    // Get periods from periodLogs collection ONLY
    const periodLogsRef = collection(db, "users", userId, "periodLogs");
    const recentPeriodsQuery = query(periodLogsRef, orderBy("startDate", "desc"), limit(10));
    const periodSnapshot = await getDocs(recentPeriodsQuery);

    const periods = periodSnapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        startDate: data.startDate,
        endDate: data.endDate,
        duration: data.duration || 5,
        ...data,
      };
    });

    console.log(`📅 Found ${periods.length} periods in periodLogs collection`);

    if (periods.length === 0) {
      console.log('📊 No periods found, returning default values');
      return { 
        cycleLength: DEFAULT_CYCLE_LENGTH,
        isCurrentlyOnPeriod: false
      };
    }

    // Use most recent period
    const latestPeriod = periods[0];
    const startDate = safeDate(latestPeriod.startDate);
    const endDate = safeDate(latestPeriod.endDate);

    if (!startDate) {
      console.log('❌ Invalid start date in most recent period');
      return { 
        cycleLength: DEFAULT_CYCLE_LENGTH,
        isCurrentlyOnPeriod: false
      };
    }

    // ✅ CRITICAL: Detect current period status
    const currentPeriodInfo = detectCurrentPeriod(periods);

    // Calculate cycle length from multiple periods
    const calculatedCycleLength = calculateCycleLengthFromPeriods(periods);
    const finalCycleLength = calculatedCycleLength || DEFAULT_CYCLE_LENGTH;

    const result: CycleData = {
      lastPeriodStart: startDate,
      lastPeriodEnd: endDate || new Date(startDate.getTime() + 5 * 24 * 60 * 60 * 1000),
      cycleLength: finalCycleLength,
      calculatedCycleLength: calculatedCycleLength,
      // ✅ NEW: Current period detection
      isCurrentlyOnPeriod: currentPeriodInfo.isOnPeriod,
      currentPeriodDay: currentPeriodInfo.periodDay,
      periodDuration: currentPeriodInfo.duration
    };

    console.log('✅ Enhanced cycle data with period detection:', {
      lastPeriodStart: result.lastPeriodStart?.toDateString(),
      lastPeriodEnd: result.lastPeriodEnd?.toDateString(),
      cycleLength: result.cycleLength,
      isCurrentlyOnPeriod: result.isCurrentlyOnPeriod,
      currentPeriodDay: result.currentPeriodDay,
      periodDuration: result.periodDuration,
      periodsFound: periods.length
    });

    return result;

  } catch (error) {
    console.error("❌ Error fetching cycle data:", error);
    return { 
      cycleLength: DEFAULT_CYCLE_LENGTH,
      isCurrentlyOnPeriod: false
    };
  }
};

// ✅ FIXED: Calculate current cycle phase with PROPER MESSAGES
export const calculateCurrentCyclePhase = (cycleData: CycleData): CyclePhase => {
  const today = new Date();
  const cycleLength = cycleData.cycleLength || DEFAULT_CYCLE_LENGTH;
  
  const lastPeriodStart = safeDate(cycleData.lastPeriodStart);
  const lastPeriodEnd = safeDate(cycleData.lastPeriodEnd);

  if (!lastPeriodStart) {
    return {
      phase: "countdown",
      message: "Track your periods",
      subtext: "Start logging for accurate predictions",
      daysLeft: "Unknown",
      isOnPeriod: false
    };
  }

  // ✅ CRITICAL: Check if currently on period FIRST
  if (cycleData.isCurrentlyOnPeriod && cycleData.currentPeriodDay) {
    console.log('🩸 Currently on period - day', cycleData.currentPeriodDay);
    
    return {
      phase: "period",
      message: `Period Day ${cycleData.currentPeriodDay}`,
      subtext: "Don't forget to log your flow",
      dayNumber: cycleData.currentPeriodDay,
      daysLeft: `Day ${cycleData.currentPeriodDay}`,
      isOnPeriod: true,
      periodDay: cycleData.currentPeriodDay
    };
  }

  // ✅ Period is over - calculate normal cycle phases
  const daysSinceLastPeriod = Math.floor((today.getTime() - lastPeriodStart.getTime()) / (1000 * 60 * 60 * 24));
  let currentCycleDay = daysSinceLastPeriod + 1;

  // Handle long cycles
  if (currentCycleDay > cycleLength + 14) {
    console.warn(`⚠️ Cycle day ${currentCycleDay} is much longer than expected ${cycleLength}`);
    currentCycleDay = ((currentCycleDay - 1) % cycleLength) + 1;
  }

  // Calculate period length
  let periodLength = cycleData.periodDuration || DEFAULT_PERIOD_LENGTH;
  if (lastPeriodEnd) {
    periodLength = Math.ceil((lastPeriodEnd.getTime() - lastPeriodStart.getTime()) / (1000 * 60 * 60 * 24));
  }

  // Phase calculations
  const ovulationDay = Math.max(14, cycleLength - 14);
  const fertileStart = ovulationDay - 2;
  const fertileEnd = ovulationDay + 1;
  const pmsStart = cycleLength - 5;

  // Calculate days until next period
  const daysUntilNextPeriod = Math.max(1, cycleLength - currentCycleDay + 1);

  console.log('🔍 Enhanced Cycle Debug:', {
    currentCycleDay,
    cycleLength,
    periodLength,
    ovulationDay,
    fertileStart,
    fertileEnd,
    pmsStart,
    daysUntilNextPeriod,
    isCurrentlyOnPeriod: cycleData.isCurrentlyOnPeriod,
    phase: "calculating..."
  });

  // ✅ FIXED: Proper phase messages that match the phase type
  
  // Follicular Phase (just after period)
  if (currentCycleDay <= periodLength + 7) {
    return {
      phase: "follicular",
      message: "Follicular Phase",
      subtext: "You might feel more energetic",
      daysLeft: "Looking Good!",
      isOnPeriod: false
    };
  }

  // Fertile Window
  if (currentCycleDay >= fertileStart && currentCycleDay <= fertileEnd) {
    return {
      phase: "fertile",
      message: "Fertile Window",
      subtext: "High chance to get pregnant",
      daysLeft: "High fertility",
      isOnPeriod: false
    };
  }

  // Ovulation Day
  if (currentCycleDay === ovulationDay) {
    return {
      phase: "ovulation",
      message: "Ovulation Day", // ✅ FIXED: Shows "Ovulation Day" not countdown
      subtext: "Peak fertility - highest chance to conceive",
      daysLeft: "Peak fertility",
      isOnPeriod: false
    };
  }

  // Luteal Phase
  if (currentCycleDay < pmsStart) {
    return {
      phase: "luteal",
      message: "Luteal Phase",
      subtext: "Your body is preparing for the next cycle",
      daysLeft: "Body preparing",
      isOnPeriod: false
    };
  }

  // PMS Phase (close to period)
  if (daysUntilNextPeriod > 3) {
    return {
      phase: "pms",
      message: "PMS Phase",
      subtext: "You may experience PMS symptoms",
      daysLeft: "Stay strong!",
      isOnPeriod: false
    };
  }

  // Countdown (2-3 days before period)
  if (daysUntilNextPeriod <= 3 && daysUntilNextPeriod > 0) {
    return {
      phase: "countdown", 
      message: `Period in ${daysUntilNextPeriod} day${daysUntilNextPeriod > 1 ? "s" : ""}`,
      subtext: "Your period is coming soon",
      daysLeft: `${daysUntilNextPeriod} day${daysUntilNextPeriod > 1 ? "s" : ""}`,
      isOnPeriod: false
    };
  }

  // Period expected (overdue)
  return {
    phase: "countdown",
    message: "Period Expected",
    subtext: "Your period should start any day now",
    daysLeft: "Any day now",
    isOnPeriod: false
  };
};

// ✅ Enhanced: Get days until next period with current period awareness
export const getDaysUntilNextPeriod = (cycleData: CycleData, mlPredictions?: any): number => {
  // If currently on period, next period is ~28 days away
  if (cycleData.isCurrentlyOnPeriod) {
    return cycleData.cycleLength || DEFAULT_CYCLE_LENGTH;
  }

  // Use ML prediction if available
  if (mlPredictions?.nextPeriod?.daysUntil !== undefined) {
    return Math.max(1, mlPredictions.nextPeriod.daysUntil);
  }

  // Manual calculation
  const lastPeriodStart = safeDate(cycleData.lastPeriodStart);
  if (!lastPeriodStart) {
    return cycleData.cycleLength || DEFAULT_CYCLE_LENGTH;
  }

  const today = new Date();
  const daysSinceStart = Math.floor(
    (today.getTime() - lastPeriodStart.getTime()) / (1000 * 60 * 60 * 24)
  );
  const currentCycleDay = daysSinceStart + 1;
  const cycleLength = cycleData.cycleLength || DEFAULT_CYCLE_LENGTH;
  
  return Math.max(1, cycleLength - currentCycleDay + 1);
};

// Keep existing functions for compatibility
export const getNextPeriodDate = (cycleData: CycleData): Date | null => {
  const lastPeriodStart = safeDate(cycleData.lastPeriodStart);
  if (!lastPeriodStart) return null;

  const cycleLength = cycleData.cycleLength || DEFAULT_CYCLE_LENGTH;
  return new Date(lastPeriodStart.getTime() + cycleLength * 24 * 60 * 60 * 1000);
};
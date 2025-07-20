// src/utils/cycleCalculator.ts
// 🎯 SINGLE SOURCE OF TRUTH - Only uses periodLogs collection

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

// ✅ UNIFIED: Get cycle data from periodLogs ONLY
export const getMostRecentCycleData = async (userId: string): Promise<CycleData> => {
  if (!userId) {
    console.log('❌ No user ID provided');
    return {};
  }

  try {
    console.log('🔄 Loading cycle data from periodLogs for user:', userId);

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
      return { cycleLength: DEFAULT_CYCLE_LENGTH };
    }

    // Use most recent period
    const latestPeriod = periods[0];
    const startDate = safeDate(latestPeriod.startDate);
    const endDate = safeDate(latestPeriod.endDate);

    if (!startDate) {
      console.log('❌ Invalid start date in most recent period');
      return { cycleLength: DEFAULT_CYCLE_LENGTH };
    }

    // Calculate cycle length from multiple periods
    const calculatedCycleLength = calculateCycleLengthFromPeriods(periods);
    const finalCycleLength = calculatedCycleLength || DEFAULT_CYCLE_LENGTH;

    const result: CycleData = {
      lastPeriodStart: startDate,
      lastPeriodEnd: endDate || new Date(startDate.getTime() + 5 * 24 * 60 * 60 * 1000),
      cycleLength: finalCycleLength,
      calculatedCycleLength: calculatedCycleLength
    };

    console.log('✅ Final cycle data:', {
      lastPeriodStart: result.lastPeriodStart?.toDateString(),
      lastPeriodEnd: result.lastPeriodEnd?.toDateString(),
      cycleLength: result.cycleLength,
      periodsFound: periods.length
    });

    return result;

  } catch (error) {
    console.error("❌ Error fetching cycle data:", error);
    return { cycleLength: DEFAULT_CYCLE_LENGTH };
  }
};

// ✅ Calculate current cycle phase
export const calculateCurrentCyclePhase = (cycleData: CycleData): CyclePhase => {
  const today = new Date();
  const cycleLength = cycleData.cycleLength || DEFAULT_CYCLE_LENGTH;
  
  const lastPeriodStart = safeDate(cycleData.lastPeriodStart);
  const lastPeriodEnd = safeDate(cycleData.lastPeriodEnd);

  if (!lastPeriodStart) {
    return {
      phase: "countdown",
      message: "Period in",
      subtext: "Track your periods for accurate predictions",
      daysLeft: "Unknown",
    };
  }

  // Calculate current cycle day
  const daysSinceLastPeriod = Math.floor((today.getTime() - lastPeriodStart.getTime()) / (1000 * 60 * 60 * 24));
  let currentCycleDay = daysSinceLastPeriod + 1;

  // Handle long cycles
  if (currentCycleDay > cycleLength + 14) {
    console.warn(`⚠️ Cycle day ${currentCycleDay} is much longer than expected ${cycleLength}`);
    currentCycleDay = ((currentCycleDay - 1) % cycleLength) + 1;
  }

  // Calculate period length
  let periodLength = DEFAULT_PERIOD_LENGTH;
  if (lastPeriodEnd) {
    periodLength = Math.ceil((lastPeriodEnd.getTime() - lastPeriodStart.getTime()) / (1000 * 60 * 60 * 24));
  }

  // Phase calculations
  const ovulationDay = Math.max(14, cycleLength - 14);
  const fertileStart = ovulationDay - 2;
  const fertileEnd = ovulationDay + 1;
  const pmsStart = cycleLength - 5;

  console.log('🔍 Cycle Debug:', {
    currentCycleDay,
    cycleLength,
    periodLength,
    ovulationDay,
    phase: "calculating..."
  });

  // Determine phase
  if (currentCycleDay <= periodLength) {
    return {
      phase: "period",
      message: `Day ${currentCycleDay}`,
      subtext: "Don't forget to log your flow",
      dayNumber: currentCycleDay,
    };
  }

  if (currentCycleDay < fertileStart) {
    return {
      phase: "follicular",
      message: "Follicular Phase",
      subtext: "You might feel more energetic",
    };
  }

  if (currentCycleDay >= fertileStart && currentCycleDay <= fertileEnd) {
    return {
      phase: "fertile",
      message: `Fertile Day ${currentCycleDay - fertileStart + 1}`,
      subtext: "High chance to get pregnant",
    };
  }

  if (currentCycleDay === ovulationDay) {
    return {
      phase: "ovulation",
      message: "Ovulation Day",
      subtext: "Peak fertility",
    };
  }

  if (currentCycleDay < pmsStart) {
    return {
      phase: "luteal",
      message: "Luteal Phase",
      subtext: "Your body is preparing for the next cycle",
    };
  }

  // PMS phase with countdown
  const daysUntilNextPeriod = cycleLength - currentCycleDay + 1;
  
  if (daysUntilNextPeriod <= 0) {
    return {
      phase: "countdown",
      message: "Period Expected",
      subtext: "Your period should start any day now",
      daysLeft: "Today",
    };
  }

  return {
    phase: "pms",
    message: `Period in ${daysUntilNextPeriod} day${daysUntilNextPeriod > 1 ? "s" : ""}`,
    subtext: "You may experience PMS symptoms",
    daysLeft: `${daysUntilNextPeriod} Day${daysUntilNextPeriod > 1 ? "s" : ""}`,
  };
};

// ✅ Get next period date
export const getNextPeriodDate = (cycleData: CycleData): Date | null => {
  const lastPeriodStart = safeDate(cycleData.lastPeriodStart);
  if (!lastPeriodStart) return null;

  const cycleLength = cycleData.cycleLength || DEFAULT_CYCLE_LENGTH;
  return new Date(lastPeriodStart.getTime() + cycleLength * 24 * 60 * 60 * 1000);
};

// ✅ Get days until next period
export const getDaysUntilNextPeriod = (cycleData: CycleData): number | null => {
  const nextPeriodDate = getNextPeriodDate(cycleData);
  if (!nextPeriodDate) return null;

  const today = new Date();
  return Math.ceil((nextPeriodDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
};
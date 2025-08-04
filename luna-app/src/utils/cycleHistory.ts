// src/utils/cycleHistory.ts
// ✅ UNIFIED: Only uses periodLogs collection

import { collection, query, orderBy, getDocs } from 'firebase/firestore';
import { db } from '../firebase';

export interface PeriodRecord {
  id: string;
  startDate: Date;
  endDate: Date | null; // ✅ FIXED: Allow null for ongoing periods
  duration: number | null; // ✅ FIXED: Allow null for ongoing periods
  cycleLength?: number;
  source?: string;
  flow?: string;
  notes?: string;
  isOngoing?: boolean; // ✅ NEW: Track if period is ongoing
  currentDay?: number; // ✅ NEW: Current day for ongoing periods
}

export interface CycleHistoryData {
  periods: PeriodRecord[];
  totalCycles: number;
  averageCycleLength: number;
  averagePeriodLength: number;
}

// ✅ UNIFIED: Get cycle history from periodLogs ONLY
export const getUserCycleHistory = async (userId: string, limitCount?: number): Promise<CycleHistoryData> => {
  try {
    console.log(`📊 Fetching cycle history for user: ${userId}`);
    
    // Get all periods from periodLogs collection ONLY
    const periodLogsRef = collection(db, "users", userId, "periodLogs");
    const periodsQuery = query(periodLogsRef, orderBy("startDate", "desc"));
    const periodsSnapshot = await getDocs(periodsQuery);

    console.log(`📅 Found ${periodsSnapshot.size} periods in periodLogs collection`);

    if (periodsSnapshot.empty) {
      return {
        periods: [],
        totalCycles: 0,
        averageCycleLength: 28,
        averagePeriodLength: 5
      };
    }

    // ✅ FIXED: Handle both ongoing and completed periods
    const allPeriods: PeriodRecord[] = periodsSnapshot.docs.map(doc => {
      const data = doc.data();
      
      // Handle ongoing periods
      if (data.isOngoing && !data.endDate) {
        const currentDay = data.currentDay || Math.floor((new Date().getTime() - new Date(data.startDate).getTime()) / (1000 * 60 * 60 * 24)) + 1;
        
        return {
          id: doc.id,
          startDate: data.startDate instanceof Date ? data.startDate : new Date(data.startDate),
          endDate: null,
          duration: null,
          source: data.source || 'manual',
          flow: data.flow || 'medium',
          notes: data.notes || '',
          isOngoing: true,
          currentDay: currentDay
        };
      }
      
      // Handle completed periods
      return {
        id: doc.id,
        startDate: data.startDate instanceof Date ? data.startDate : new Date(data.startDate),
        endDate: data.endDate instanceof Date ? data.endDate : new Date(data.endDate),
        duration: data.duration || 5,
        source: data.source || 'manual',
        flow: data.flow || 'medium',
        notes: data.notes || '',
        isOngoing: false
      };
    });

    // ✅ FIXED: Only calculate cycle lengths for completed periods
    const completedPeriods = allPeriods.filter(p => !p.isOngoing && p.endDate) as (PeriodRecord & { endDate: Date })[];
    
    const periodsWithCycles = completedPeriods.map((period, index) => {
      if (index < completedPeriods.length - 1) {
        const current = period.startDate;
        const next = completedPeriods[index + 1].startDate;
        const cycleLength = Math.round((current.getTime() - next.getTime()) / (1000 * 60 * 60 * 24));
        
        // Only include reasonable cycle lengths
        if (cycleLength >= 18 && cycleLength <= 45) {
          return { ...period, cycleLength };
        }
      }
      return period;
    });

    // Include ongoing periods at the beginning (they're most recent)
    const ongoingPeriods = allPeriods.filter(p => p.isOngoing);
    const allPeriodsWithCycles = [...ongoingPeriods, ...periodsWithCycles];

    // Apply limit if specified
    const limitedPeriods = limitCount ? allPeriodsWithCycles.slice(0, limitCount) : allPeriodsWithCycles;

    // Calculate statistics from completed periods only
    const cycleLengths = periodsWithCycles
      .map(p => p.cycleLength)
      .filter((length): length is number => length !== undefined);

    const averageCycleLength = cycleLengths.length > 0 
      ? Math.round(cycleLengths.reduce((sum, length) => sum + length, 0) / cycleLengths.length)
      : 28;

    const completedDurations = completedPeriods
      .map(p => p.duration)
      .filter((duration): duration is number => duration !== null);

    const averagePeriodLength = completedDurations.length > 0
      ? Math.round(completedDurations.reduce((sum, duration) => sum + duration, 0) / completedDurations.length)
      : 5;

    const result = {
      periods: limitedPeriods,
      totalCycles: cycleLengths.length,
      averageCycleLength,
      averagePeriodLength
    };

    console.log("✅ Cycle history processed:", {
      totalPeriods: allPeriods.length,
      ongoingPeriods: ongoingPeriods.length,
      completedPeriods: completedPeriods.length,
      returnedPeriods: limitedPeriods.length,
      averageCycleLength,
      averagePeriodLength,
      source: "periodLogs collection only"
    });

    return result;

  } catch (error) {
    console.error("❌ Error fetching cycle history:", error);
    return {
      periods: [],
      totalCycles: 0,
      averageCycleLength: 28,
      averagePeriodLength: 5
    };
  }
};

// ✅ FIXED: Handle ongoing periods in display formatting
export const formatPeriodForDisplay = (period: PeriodRecord) => {
  const startStr = period.startDate.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric' 
  });
  
  // ✅ FIXED: Handle ongoing periods
  if (period.isOngoing || period.endDate === null) {
    return {
      dateRange: `${startStr} - Ongoing`,
      durationText: `Day ${period.currentDay || 1} (ongoing)`,
      cycleText: '',
      fullText: `${startStr} - Ongoing (Day ${period.currentDay || 1})`
    };
  }
  
  const endStr = period.endDate.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric' 
  });

  const dateRange = `${startStr} - ${endStr}`;
  const durationText = `${period.duration} days`;
  const cycleText = period.cycleLength ? ` • ${period.cycleLength} day cycle` : '';

  return {
    dateRange,
    durationText,
    cycleText,
    fullText: `${dateRange} (${durationText}${cycleText})`
  };
};

// ✅ NEW: Helper function to get the most recent period (ongoing or completed)
export const getMostRecentPeriod = (periods: PeriodRecord[]): PeriodRecord | null => {
  if (periods.length === 0) return null;
  
  // Periods should already be sorted by startDate desc, so first one is most recent
  return periods[0];
};

// ✅ NEW: Helper function to check if user has an ongoing period
export const hasOngoingPeriod = (periods: PeriodRecord[]): boolean => {
  return periods.some(period => period.isOngoing);
};

// ✅ NEW: Helper function to get only completed periods
export const getCompletedPeriods = (periods: PeriodRecord[]): (PeriodRecord & { endDate: Date; duration: number })[] => {
  return periods.filter(p => !p.isOngoing && p.endDate && p.duration) as (PeriodRecord & { endDate: Date; duration: number })[];
};

// ✅ NEW: Helper function to get cycle statistics
export const getCycleStatistics = (periods: PeriodRecord[]) => {
  const completedPeriods = getCompletedPeriods(periods);
  
  if (completedPeriods.length === 0) {
    return {
      averageCycleLength: 28,
      averagePeriodLength: 5,
      shortestCycle: null,
      longestCycle: null,
      shortestPeriod: null,
      longestPeriod: null,
      totalCompletedPeriods: 0
    };
  }

  // Calculate cycle lengths
  const cycleLengths: number[] = [];
  for (let i = 0; i < completedPeriods.length - 1; i++) {
    const current = completedPeriods[i].startDate;
    const next = completedPeriods[i + 1].startDate;
    const cycleLength = Math.round((current.getTime() - next.getTime()) / (1000 * 60 * 60 * 24));
    
    if (cycleLength >= 18 && cycleLength <= 45) {
      cycleLengths.push(cycleLength);
    }
  }

  const durations = completedPeriods.map(p => p.duration);

  return {
    averageCycleLength: cycleLengths.length > 0 
      ? Math.round(cycleLengths.reduce((sum, length) => sum + length, 0) / cycleLengths.length)
      : 28,
    averagePeriodLength: Math.round(durations.reduce((sum, duration) => sum + duration, 0) / durations.length),
    shortestCycle: cycleLengths.length > 0 ? Math.min(...cycleLengths) : null,
    longestCycle: cycleLengths.length > 0 ? Math.max(...cycleLengths) : null,
    shortestPeriod: Math.min(...durations),
    longestPeriod: Math.max(...durations),
    totalCompletedPeriods: completedPeriods.length
  };
};

// ✅ NEW: Helper function to format period for different contexts
export const formatPeriodForContext = (period: PeriodRecord, context: 'list' | 'detail' | 'summary') => {
  const baseFormat = formatPeriodForDisplay(period);
  
  switch (context) {
    case 'list':
      return {
        primary: baseFormat.dateRange,
        secondary: baseFormat.durationText,
        badge: period.isOngoing ? 'Active' : period.flow ? period.flow.charAt(0).toUpperCase() + period.flow.slice(1) : null
      };
    
    case 'detail':
      return {
        dateRange: baseFormat.dateRange,
        duration: baseFormat.durationText,
        cycle: baseFormat.cycleText,
        flow: period.flow,
        notes: period.notes,
        isOngoing: period.isOngoing,
        currentDay: period.currentDay
      };
    
    case 'summary':
      return {
        text: baseFormat.fullText,
        isOngoing: period.isOngoing,
        dayCount: period.isOngoing ? period.currentDay : period.duration
      };
    
    default:
      return baseFormat;
  }
};
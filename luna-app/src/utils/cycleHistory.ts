// utils/cycleHistory.ts

import { collection, query, orderBy, limit, getDocs } from "firebase/firestore";
import { db } from "../firebase";

export interface PeriodRecord {
  id: string;
  startDate: Date;
  endDate: Date;
  duration: number; // days
  cycleLength?: number; // days from previous period
}

export interface CycleHistoryData {
  periods: PeriodRecord[];
  totalCycles: number;
  averageCycleLength: number;
  averagePeriodLength: number;
}

// Format date for display
const formatDateRange = (startDate: Date, endDate: Date): string => {
  const options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
  const start = startDate.toLocaleDateString('en-US', options);
  const end = endDate.toLocaleDateString('en-US', options);
  return `${start} - ${end}`;
};

// Calculate cycle length between two periods
const calculateCycleLength = (currentStart: Date, previousStart: Date): number => {
  const diffTime = Math.abs(currentStart.getTime() - previousStart.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

// Get user's period history from multiple sources
export const getUserCycleHistory = async (userId: string, limitCount?: number): Promise<CycleHistoryData> => {
  try {
    console.log("📊 Fetching cycle history for user:", userId);

    // 1. Get from onboarding data (most recent from user profile)
    const userRef = collection(db, "users");
    const userQuery = query(userRef);
    const userSnapshot = await getDocs(userQuery);
    
    let onboardingPeriod: PeriodRecord | null = null;
    
    // Find user's onboarding period data
    userSnapshot.forEach((doc) => {
      if (doc.id === userId) {
        const userData = doc.data();
        if (userData.lastPeriodStart && userData.lastPeriodEnd) {
          const startDate = new Date(userData.lastPeriodStart);
          const endDate = new Date(userData.lastPeriodEnd);
          const duration = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
          
          onboardingPeriod = {
            id: 'onboarding',
            startDate,
            endDate,
            duration
          };
        }
      }
    });

    // 2. Get from period logs collection (future logged periods)
    const periodLogsRef = collection(db, "users", userId, "periodLogs");
    const periodQuery = limitCount 
      ? query(periodLogsRef, orderBy("startDate", "desc"), limit(limitCount))
      : query(periodLogsRef, orderBy("startDate", "desc"));
    
    const periodSnapshot = await getDocs(periodQuery);
    
    const loggedPeriods: PeriodRecord[] = [];
    periodSnapshot.forEach((doc) => {
      const data = doc.data();
      if (data.startDate && data.endDate) {
        const startDate = new Date(data.startDate);
        const endDate = new Date(data.endDate);
        const duration = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
        
        loggedPeriods.push({
          id: doc.id,
          startDate,
          endDate,
          duration
        });
      }
    });

    // 3. Combine and sort all periods
    const allPeriods: PeriodRecord[] = [];
    
    if (onboardingPeriod) {
      allPeriods.push(onboardingPeriod);
    }
    
    allPeriods.push(...loggedPeriods);
    
    // Sort by start date (most recent first)
    allPeriods.sort((a, b) => b.startDate.getTime() - a.startDate.getTime());
    
    // Remove duplicates (in case onboarding period was also logged)
    const uniquePeriods = allPeriods.filter((period, index, arr) => {
      return index === 0 || Math.abs(period.startDate.getTime() - arr[index - 1].startDate.getTime()) > 7 * 24 * 60 * 60 * 1000; // At least 7 days apart
    });

    // 4. Calculate cycle lengths
    for (let i = 0; i < uniquePeriods.length - 1; i++) {
      const currentPeriod = uniquePeriods[i];
      const previousPeriod = uniquePeriods[i + 1];
      currentPeriod.cycleLength = calculateCycleLength(currentPeriod.startDate, previousPeriod.startDate);
    }

    // 5. Calculate averages
    const cycleLengths = uniquePeriods.filter(p => p.cycleLength).map(p => p.cycleLength!);
    const averageCycleLength = cycleLengths.length > 0 
      ? Math.round(cycleLengths.reduce((a, b) => a + b, 0) / cycleLengths.length)
      : 28; // Default

    const averagePeriodLength = uniquePeriods.length > 0
      ? Math.round(uniquePeriods.reduce((sum, p) => sum + p.duration, 0) / uniquePeriods.length)
      : 5; // Default

    console.log("✅ Cycle history processed:", {
      totalPeriods: uniquePeriods.length,
      averageCycleLength,
      averagePeriodLength
    });

    return {
      periods: limitCount ? uniquePeriods.slice(0, limitCount) : uniquePeriods,
      totalCycles: uniquePeriods.length,
      averageCycleLength,
      averagePeriodLength
    };

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

// Format period for display in the list
export const formatPeriodForDisplay = (period: PeriodRecord) => {
  const dateRange = formatDateRange(period.startDate, period.endDate);
  const durationText = `🩸 ${period.duration} day${period.duration > 1 ? 's' : ''}`;
  const cycleText = period.cycleLength ? ` • ${period.cycleLength} day cycle` : '';
  
  return {
    dateRange,
    durationText,
    cycleText
  };
};

// Get default/placeholder periods for new users
export const getDefaultPeriods = (): PeriodRecord[] => {
  const today = new Date();
  const lastMonth = new Date(today);
  lastMonth.setMonth(lastMonth.getMonth() - 1);
  
  return [
    {
      id: 'placeholder',
      startDate: lastMonth,
      endDate: new Date(lastMonth.getTime() + 5 * 24 * 60 * 60 * 1000), // 5 days later
      duration: 5
    }
  ];
};
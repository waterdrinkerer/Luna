// src/utils/cycleHistory.ts
// ✅ UNIFIED: Only uses periodLogs collection

import { collection, query, orderBy, getDocs, getDoc, doc } from 'firebase/firestore';
import { db } from '../firebase';

export interface PeriodRecord {
  id: string;
  startDate: Date;
  endDate: Date;
  duration: number;
  cycleLength?: number;
  source?: string;
  flow?: string;
  notes?: string;
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

    // Convert to PeriodRecord format
    const allPeriods: PeriodRecord[] = periodsSnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        startDate: data.startDate instanceof Date ? data.startDate : new Date(data.startDate),
        endDate: data.endDate instanceof Date ? data.endDate : new Date(data.endDate),
        duration: data.duration || 5,
        source: data.source || 'manual',
        flow: data.flow || 'medium',
        notes: data.notes || ''
      };
    });

    // Calculate cycle lengths between periods
    const periodsWithCycles = allPeriods.map((period, index) => {
      if (index < allPeriods.length - 1) {
        const current = period.startDate;
        const next = allPeriods[index + 1].startDate;
        const cycleLength = Math.round((current.getTime() - next.getTime()) / (1000 * 60 * 60 * 24));
        
        // Only include reasonable cycle lengths
        if (cycleLength >= 18 && cycleLength <= 45) {
          return { ...period, cycleLength };
        }
      }
      return period;
    });

    // Apply limit if specified
    const limitedPeriods = limitCount ? periodsWithCycles.slice(0, limitCount) : periodsWithCycles;

    // Calculate statistics
    const cycleLengths = periodsWithCycles
      .map(p => p.cycleLength)
      .filter((length): length is number => length !== undefined);

    const averageCycleLength = cycleLengths.length > 0 
      ? Math.round(cycleLengths.reduce((sum, length) => sum + length, 0) / cycleLengths.length)
      : 28;

    const averagePeriodLength = allPeriods.length > 0
      ? Math.round(allPeriods.reduce((sum, period) => sum + period.duration, 0) / allPeriods.length)
      : 5;

    const result = {
      periods: limitedPeriods,
      totalCycles: cycleLengths.length,
      averageCycleLength,
      averagePeriodLength
    };

    console.log("✅ Cycle history processed:", {
      totalPeriods: allPeriods.length,
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

export const formatPeriodForDisplay = (period: PeriodRecord) => {
  const startStr = period.startDate.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric' 
  });
  
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
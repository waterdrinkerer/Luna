// src/services/periodService.ts
// 🎯 SINGLE SOURCE OF TRUTH for all period data

import { 
  collection, 
  query, 
  orderBy, 
  limit, 
  getDocs, 
  addDoc, 
  doc, 
  updateDoc, 
  deleteDoc,
  getDoc
} from 'firebase/firestore';
import { db } from '../firebase';

export interface PeriodLog {
  id: string;
  startDate: string; // ISO string
  endDate: string;   // ISO string  
  duration: number;
  flow?: 'light' | 'medium' | 'heavy';
  notes?: string;
  loggedAt: string;  // ISO string
  type: 'current' | 'past';
  source?: 'manual' | 'onboarding';
  isOngoing?: boolean;
}

export interface CycleData {
  lastPeriodStart?: Date;
  lastPeriodEnd?: Date;
  cycleLength?: number;
  calculatedCycleLength?: number | null;
}

// ✅ UNIFIED: Get all periods for a user (ONLY source of truth)
export const getAllUserPeriods = async (userId: string): Promise<PeriodLog[]> => {
  try {
    const periodLogsRef = collection(db, "users", userId, "periodLogs");
    const q = query(periodLogsRef, orderBy("startDate", "desc"));
    const snapshot = await getDocs(q);
    
    const periods = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as PeriodLog));
    
    console.log(`📊 Loaded ${periods.length} periods from periodLogs collection`);
    return periods;
  } catch (error) {
    console.error('❌ Error fetching periods:', error);
    return [];
  }
};

// ✅ UNIFIED: Get recent periods (with limit)
export const getRecentUserPeriods = async (userId: string, limitCount: number = 10): Promise<PeriodLog[]> => {
  try {
    const periodLogsRef = collection(db, "users", userId, "periodLogs");
    const q = query(periodLogsRef, orderBy("startDate", "desc"), limit(limitCount));
    const snapshot = await getDocs(q);
    
    const periods = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as PeriodLog));
    
    console.log(`📊 Loaded ${periods.length} recent periods from periodLogs collection`);
    return periods;
  } catch (error) {
    console.error('❌ Error fetching recent periods:', error);
    return [];
  }
};

// ✅ UNIFIED: Get most recent cycle data for calculations
export const getMostRecentCycleData = async (userId: string): Promise<CycleData> => {
  try {
    const periods = await getRecentUserPeriods(userId, 5);
    
    if (periods.length === 0) {
      console.log('📊 No periods found, returning empty cycle data');
      return {};
    }
    
    const mostRecent = periods[0];
    const cycleLength = calculateAverageCycleLength(periods);
    
    return {
      lastPeriodStart: new Date(mostRecent.startDate),
      lastPeriodEnd: new Date(mostRecent.endDate),
      cycleLength: cycleLength || 28,
      calculatedCycleLength: cycleLength
    };
  } catch (error) {
    console.error('❌ Error getting cycle data:', error);
    return {};
  }
};

// ✅ UNIFIED: Calculate cycle length from periods
export const calculateAverageCycleLength = (periods: PeriodLog[]): number | null => {
  if (periods.length < 2) return null;
  
  const cycleLengths: number[] = [];
  
  for (let i = 0; i < periods.length - 1; i++) {
    try {
      const current = new Date(periods[i].startDate);
      const next = new Date(periods[i + 1].startDate);
      
      if (isNaN(current.getTime()) || isNaN(next.getTime())) continue;
      
      const daysBetween = Math.round((current.getTime() - next.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysBetween >= 18 && daysBetween <= 45) {
        cycleLengths.push(daysBetween);
      }
    } catch (error) {
      console.error('Error calculating cycle length:', error);
      continue;
    }
  }
  
  if (cycleLengths.length === 0) return null;
  
  const average = Math.round(cycleLengths.reduce((sum, length) => sum + length, 0) / cycleLengths.length);
  console.log(`📊 Calculated average cycle length: ${average} days from ${cycleLengths.length} cycles`);
  
  return average;
};

// ✅ UNIFIED: Add new period
export const addPeriod = async (userId: string, periodData: Omit<PeriodLog, 'id'>): Promise<string> => {
  try {
    const periodLogsRef = collection(db, "users", userId, "periodLogs");
    const docRef = await addDoc(periodLogsRef, {
      ...periodData,
      loggedAt: new Date().toISOString()
    });
    
    console.log('✅ Period added successfully:', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('❌ Error adding period:', error);
    throw error;
  }
};

// ✅ UNIFIED: Update period
export const updatePeriod = async (userId: string, periodId: string, updates: Partial<PeriodLog>): Promise<void> => {
  try {
    const periodRef = doc(db, "users", userId, "periodLogs", periodId);
    await updateDoc(periodRef, {
      ...updates,
      updatedAt: new Date().toISOString()
    });
    
    console.log('✅ Period updated successfully:', periodId);
  } catch (error) {
    console.error('❌ Error updating period:', error);
    throw error;
  }
};

// ✅ UNIFIED: Delete period
export const deletePeriod = async (userId: string, periodId: string): Promise<void> => {
  try {
    const periodRef = doc(db, "users", userId, "periodLogs", periodId);
    await deleteDoc(periodRef);
    
    console.log('✅ Period deleted successfully:', periodId);
  } catch (error) {
    console.error('❌ Error deleting period:', error);
    throw error;
  }
};

// ✅ UNIFIED: Migration function to clean up user profile
export const migrateUserPeriodData = async (userId: string): Promise<void> => {
  try {
    // Get user profile data
    const userRef = doc(db, "users", userId);
    const userSnap = await getDoc(userRef);
    
    if (!userSnap.exists()) return;
    
    const userData = userSnap.data();
    const { lastPeriodStart, lastPeriodEnd } = userData;
    
    if (lastPeriodStart && lastPeriodEnd) {
      // Check if this period already exists in periodLogs
      const existingPeriods = await getAllUserPeriods(userId);
      const onboardingPeriodExists = existingPeriods.some(period => {
        const periodStart = new Date(period.startDate);
        const onboardingStart = new Date(lastPeriodStart);
        const diffDays = Math.abs((periodStart.getTime() - onboardingStart.getTime()) / (1000 * 60 * 60 * 24));
        return diffDays < 1; // Same day
      });
      
      if (!onboardingPeriodExists) {
        // Add the onboarding period to periodLogs
        const duration = Math.ceil((new Date(lastPeriodEnd).getTime() - new Date(lastPeriodStart).getTime()) / (1000 * 60 * 60 * 24));
        
        await addPeriod(userId, {
          startDate: lastPeriodStart,
          endDate: lastPeriodEnd,
          duration: duration,
          flow: 'medium',
          notes: 'Migrated from onboarding',
          type: 'past',
          source: 'onboarding',
          isOngoing: false,
          loggedAt: new Date().toISOString()
        });
        
        console.log('✅ Onboarding period migrated to periodLogs');
      }
      
      // Remove period data from user profile
      await updateDoc(userRef, {
        lastPeriodStart: null,
        lastPeriodEnd: null,
        updatedAt: new Date().toISOString()
      });
      
      console.log('✅ Period data removed from user profile');
    }
  } catch (error) {
    console.error('❌ Error migrating period data:', error);
  }
};

// ✅ UNIFIED: Get current cycle day
export const getCurrentCycleDay = (lastPeriodStart: Date, cycleLength: number = 28): number => {
  const today = new Date();
  const daysSinceStart = Math.floor((today.getTime() - lastPeriodStart.getTime()) / (1000 * 60 * 60 * 24));
  let currentDay = daysSinceStart + 1;
  
  // Handle cycle wrapping
  if (currentDay > cycleLength + 14) {
    currentDay = ((currentDay - 1) % cycleLength) + 1;
  }
  
  return Math.max(1, currentDay);
};

// ✅ UNIFIED: Get days until next period
export const getDaysUntilNextPeriod = (lastPeriodStart: Date, cycleLength: number = 28): number => {
  const currentDay = getCurrentCycleDay(lastPeriodStart, cycleLength);
  return Math.max(1, cycleLength - currentDay + 1);
};
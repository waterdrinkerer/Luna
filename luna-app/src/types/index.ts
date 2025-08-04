export interface SymptomLog {
  id: string;
  date: Date;
  timestamp: string;
  userId: string;
  symptoms: Record<string, unknown>;
  cyclePhase?: string;
  cycleDay?: number;
  notes?: string;
  [key: string]: unknown;
}

export interface MoodLog {
  id: string;
  moods: string[];
  timestamp: string;
  date: string;
  userId: string;
}

export interface PeriodLog {
  id: string;
  startDate: string;
  endDate: string;
  duration: number;
  userId: string;
  isOngoing?: boolean;
  type?: 'current' | 'past';
  loggedAt?: string;
}

export interface SymptomAnalysis {
  totalLogs: number;
  uniqueSymptoms: number;
  topSymptoms: [string, number][];
  mostCommon: string;
  averagePerLog: number;
  averageSeverity: number;
}

export interface RegularityAnalysis {
  totalPeriods: number;
  avgLength: number;
  minLength: number;
  maxLength: number;
  stdDev: number;
  regularityScore: number;
  cycleLengths: number[];
  isRegular: boolean;
}

export interface UserData {
  name?: string;
  email?: string;
  dateOfBirth?: string;
  lastPeriodStart?: string;
  lastPeriodEnd?: string;
  cycleLength?: number;
  height?: number;
  profilePic?: string;
  hasCompletedOnboarding?: boolean;
  createdAt?: string;
  updatedAt?: string;
}


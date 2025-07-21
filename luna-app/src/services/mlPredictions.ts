
import { collection, query, orderBy, limit, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';

// ==========================================
// ML PREDICTION TYPES
// ==========================================

export interface MLPredictions {
  nextPeriod: {
    daysUntil: number;
    date: Date;
    confidence: 'high' | 'medium' | 'low';
    explanation: string;
  };
  cycleHealth: {
    isIrregular: boolean;
    riskLevel: 'low' | 'medium' | 'high';
    pcosRisk: number;
    warnings: string[];
    recommendations: string[];
  };
  dailySymptoms: {
    crampIntensity: number;
    flowIntensity: number;
    fatigueLevel: number;
    moodImpact: number;
    overallDiscomfort: number;
    descriptions: {
      cramps: string;
      flow: string;
      fatigue: string;
      mood: string;
      overall: string;
    };
    topSymptoms: Array<{
      name: string;
      intensity: number;
      description: string;
    }>;
  };
  confidence: {
    overall: 'high' | 'medium' | 'low';
    dataQuality: number;
    periodsLogged: number;
    lastUpdated: Date;
  };
}

export interface UserCycleFeatures {
  meanCycleLength: number;
  currentCycleDay: number;
  daysSinceLastPeriod: number;
  recentCycleLengths: number[];
  meanMensesLength: number;
  recentMensesLengths: number[];
  age: number;
  bmi?: number;
  hasUnusualBleeding: boolean;
  ovulationDetected: boolean;
  periodsLogged: number;
  hasRecentData: boolean;
}

// ==========================================
// ML PREDICTION SERVICE CLASS
// ==========================================

class LunaMLService {
  // 🚀 CHANGE THIS TO YOUR DEPLOYED CLOUD RUN URL LATER
  private readonly ML_API_URL = 'http://localhost:8080';
  
  // ==========================================
  // EXTRACT FEATURES FROM LUNA DATA
  // ==========================================
  
  async extractUserFeatures(userId: string): Promise<UserCycleFeatures> {
    try {
      // Get recent period logs (last 6 months)
      const periodLogsRef = collection(db, `users/${userId}/periodLogs`);
      const periodsQuery = query(periodLogsRef, orderBy('startDate', 'desc'), limit(12));
      const periodsSnapshot = await getDocs(periodsQuery);
      
      const periods = periodsSnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          startDate: data.startDate ? new Date(data.startDate) : new Date(),
          endDate: data.endDate ? new Date(data.endDate) : new Date(),
          duration: data.duration || 5,
          ...data
        };
      });

      // Early return if no periods
      if (periods.length === 0) {
        return this.getDefaultFeatures();
      }

      // Get user profile data
      const userRef = doc(db, 'users', userId);
      const userSnap = await getDoc(userRef);
      const userData = userSnap.data();

      // Calculate cycle characteristics
      const cycleLengths = this.calculateCycleLengths(periods);
      const mensesLengths = periods.map(p => p.duration || 5);
      
      // Calculate current cycle day safely
      const lastPeriod = periods[0];
      let daysSinceLastPeriod = 0;
      let currentCycleDay = 1;
      
      if (lastPeriod && lastPeriod.startDate) {
        try {
          const startDate = lastPeriod.startDate instanceof Date ? lastPeriod.startDate : new Date(lastPeriod.startDate);
          daysSinceLastPeriod = Math.floor((new Date().getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
          
          // ✅ FIXED: Better cycle day calculation
          // If it's been more than average cycle length, we're probably in a new cycle
          const avgCycleLength = cycleLengths.length > 0 ? this.average(cycleLengths) : 28;
          currentCycleDay = (daysSinceLastPeriod % avgCycleLength) + 1;
          
          // ✅ Handle edge case: if days since last period > 45, probably missed logging
          if (daysSinceLastPeriod > 45) {
            console.log('⚠️ Long gap since last period, adjusting calculation');
            daysSinceLastPeriod = Math.min(daysSinceLastPeriod, avgCycleLength);
            currentCycleDay = avgCycleLength;
          }
          
        } catch (error) {
          console.log('Date parsing error, using default');
          daysSinceLastPeriod = 14;
          currentCycleDay = 14;
        }
      }

      // Calculate age from date of birth
      const age = userData?.dateOfBirth 
        ? this.calculateAge(userData.dateOfBirth) 
        : 25;

      // Get latest weight for BMI calculation
      const bmi = await this.calculateBMI(userId, userData?.height);

      return {
        meanCycleLength: cycleLengths.length > 0 ? this.average(cycleLengths) : 28,
        currentCycleDay: currentCycleDay, // ✅ Use the fixed calculation
        daysSinceLastPeriod,
        recentCycleLengths: cycleLengths.slice(0, 6),
        
        meanMensesLength: mensesLengths.length > 0 ? this.average(mensesLengths) : 5,
        recentMensesLengths: mensesLengths.slice(0, 6),
        
        age,
        bmi,
        
        hasUnusualBleeding: false,
        ovulationDetected: true,
        
        periodsLogged: periods.length,
        hasRecentData: periods.length > 0 && daysSinceLastPeriod < 60
      };

    } catch (error) {
      console.error('Error extracting user features:', error);
      // Return default features instead of throwing
      return this.getDefaultFeatures();
    }
  }

  private getDefaultFeatures(): UserCycleFeatures {
    return {
      meanCycleLength: 28,
      currentCycleDay: 1,
      daysSinceLastPeriod: 0,
      recentCycleLengths: [],
      meanMensesLength: 5,
      recentMensesLengths: [],
      age: 25,
      bmi: undefined,
      hasUnusualBleeding: false,
      ovulationDetected: true,
      periodsLogged: 0,
      hasRecentData: false
    };
  }

  // ==========================================
  // CALL YOUR ML API
  // ==========================================
  
  async getPredictions(userId: string): Promise<MLPredictions> {
    try {
      const features = await this.extractUserFeatures(userId);
      
      // Call your actual ML API endpoints
      const [nextPeriodResponse, irregularResponse, symptomsResponse] = await Promise.all([
        this.callNextPeriodAPI(features),
        this.callIrregularCycleAPI(features),
        this.callSymptomsAPI(features)
      ]);

      return {
        nextPeriod: nextPeriodResponse,
        cycleHealth: irregularResponse,
        dailySymptoms: symptomsResponse,
        confidence: this.calculateConfidence(features)
      };

    } catch (error) {
      console.error('ML prediction error:', error);
      return this.getFallbackPredictions();
    }
  }

  // ==========================================
  // API CALL METHODS
  // ==========================================

  private async callNextPeriodAPI(features: UserCycleFeatures) {
    try {
      const response = await fetch(`${this.ML_API_URL}/predict/next-period`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          current_cycle_day: features.currentCycleDay,
          Age: features.age,
          LengthofMenses: features.meanMensesLength,
          BMI: features.bmi || 25,
          EstimatedDayofOvulation: features.meanCycleLength - 14,
          LengthofLutealPhase: 14,
          TotalDaysofFertility: 6,
          cycles_logged: features.periodsLogged
        })
      });

      const data = await response.json();
      
      const nextDate = new Date();
      nextDate.setDate(nextDate.getDate() + data.days_until_next_period);

      return {
        daysUntil: data.days_until_next_period,
        date: nextDate,
        confidence: data.confidence as 'high' | 'medium' | 'low',
        explanation: data.explanation
      };
    } catch (error) {
      console.error('Next period API error:', error);
      
      // ✅ FIXED: Better fallback calculation for past periods
      const lastPeriodEndDate = new Date(Date.now() - (features.daysSinceLastPeriod * 24 * 60 * 60 * 1000));
      const nextPeriodDate = new Date(lastPeriodEndDate.getTime() + (features.meanCycleLength * 24 * 60 * 60 * 1000));
      const daysUntilNext = Math.ceil((nextPeriodDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
      
      return {
        daysUntil: Math.max(1, daysUntilNext), // Never negative
        date: nextPeriodDate,
        confidence: 'low' as const,
        explanation: `Based on your ${features.meanCycleLength}-day average cycle, your next period is expected in ${Math.max(1, daysUntilNext)} days`
      };
    }
  }

  private async callIrregularCycleAPI(features: UserCycleFeatures) {
    try {
      const response = await fetch(`${this.ML_API_URL}/detect/irregular-cycle`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recent_cycle_lengths: features.recentCycleLengths,
          cycle_with_peak: 1,
          luteal_phase_length: 14,
          menses_length: features.meanMensesLength,
          unusual_bleeding: features.hasUnusualBleeding ? 1 : 0,
          bleeding_intensity: 5,
          age: features.age,
          bmi: features.bmi || 25,
          number_pregnancies: 0
        })
      });

      const data = await response.json();

      return {
        isIrregular: data.is_irregular,
        riskLevel: data.risk_level as 'low' | 'medium' | 'high',
        pcosRisk: data.pcos_risk_score || 0,
        warnings: data.warnings || [],
        recommendations: data.recommendations || []
      };
    } catch (error) {
      console.error('Irregular cycle API error:', error);
      return {
        isIrregular: false,
        riskLevel: 'low' as const,
        pcosRisk: 0,
        warnings: [],
        recommendations: []
      };
    }
  }

  private async callSymptomsAPI(features: UserCycleFeatures) {
    try {
      const response = await fetch(`${this.ML_API_URL}/predict/symptoms`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cycle_day: features.currentCycleDay,
          cycle_length: features.meanCycleLength,
          menses_length: features.meanMensesLength,
          age: features.age,
          bmi: features.bmi || 25,
          pregnancies: 0,
          mean_bleeding_intensity: 5
        })
      });

      const data = await response.json();

      // Create top symptoms array
      const symptoms = [
        { name: 'cramps', intensity: data.cramp_intensity, description: data.descriptions.cramps },
        { name: 'fatigue', intensity: data.fatigue_level, description: data.descriptions.fatigue },
        { name: 'mood changes', intensity: data.mood_impact, description: data.descriptions.mood }
      ].sort((a, b) => b.intensity - a.intensity);

      return {
        crampIntensity: data.cramp_intensity,
        flowIntensity: data.flow_intensity,
        fatigueLevel: data.fatigue_level,
        moodImpact: data.mood_impact,
        overallDiscomfort: data.overall_discomfort,
        descriptions: data.descriptions,
        topSymptoms: symptoms.slice(0, 2)
      };
    } catch (error) {
      console.error('Symptoms API error:', error);
      return {
        crampIntensity: 2,
        flowIntensity: 0,
        fatigueLevel: 3,
        moodImpact: 2,
        overallDiscomfort: 2,
        descriptions: {
          cramps: 'Mild',
          flow: 'None to minimal',
          fatigue: 'Mild',
          mood: 'None to minimal',
          overall: 'Mild'
        },
        topSymptoms: []
      };
    }
  }

  // ==========================================
  // UTILITY METHODS
  // ==========================================

  private calculateCycleLengths(periods: any[]): number[] {
    const lengths: number[] = [];
    for (let i = 0; i < periods.length - 1; i++) {
      const current = periods[i].startDate;
      const next = periods[i + 1].startDate;
      
      // Ensure both dates are Date objects
      const currentDate = current instanceof Date ? current : new Date(current);
      const nextDate = next instanceof Date ? next : new Date(next);
      
      const lengthInDays = Math.round((currentDate.getTime() - nextDate.getTime()) / (1000 * 60 * 60 * 24));
      if (lengthInDays > 15 && lengthInDays < 50) {
        lengths.push(lengthInDays);
      }
    }
    return lengths;
  }

  private calculateAge(dateOfBirth: string | Date): number {
    const today = new Date();
    const birth = typeof dateOfBirth === 'string' ? new Date(dateOfBirth) : dateOfBirth;
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    
    return Math.max(age, 18); // Ensure minimum age of 18
  }

  private async calculateBMI(userId: string, height?: number): Promise<number | undefined> {
    if (!height) return undefined;
    
    try {
      const weightRef = collection(db, `users/${userId}/weightLogs`);
      const weightQuery = query(weightRef, orderBy('date', 'desc'), limit(1));
      const weightSnapshot = await getDocs(weightQuery);
      
      if (!weightSnapshot.empty) {
        const latestWeight = weightSnapshot.docs[0].data().weight;
        const heightInMeters = height / 100;
        return latestWeight / (heightInMeters * heightInMeters);
      }
    } catch (error) {
      console.error('Error calculating BMI:', error);
    }
    
    return undefined;
  }

  private average(numbers: number[]): number {
    return numbers.reduce((sum, num) => sum + num, 0) / numbers.length;
  }

  private calculateConfidence(features: UserCycleFeatures) {
    let score = 0;
    
    if (features.hasRecentData) score += 30;
    if (features.periodsLogged >= 6) score += 40;
    else if (features.periodsLogged >= 3) score += 25;
    else if (features.periodsLogged >= 1) score += 10;
    
    if (features.recentCycleLengths.length >= 3) {
      const variability = this.standardDeviation(features.recentCycleLengths);
      if (variability < 3) score += 30;
      else if (variability < 7) score += 20;
      else score += 10;
    }

    const overall = score >= 80 ? 'high' as const : score >= 50 ? 'medium' as const : 'low' as const;

    return {
      overall,
      dataQuality: score,
      periodsLogged: features.periodsLogged,
      lastUpdated: new Date()
    };
  }

  private standardDeviation(numbers: number[]): number {
    const avg = this.average(numbers);
    const squareDiffs = numbers.map(num => Math.pow(num - avg, 2));
    return Math.sqrt(this.average(squareDiffs));
  }

  public getFallbackPredictions(): MLPredictions {
    const nextDate = new Date();
    nextDate.setDate(nextDate.getDate() + 14);

    return {
      nextPeriod: {
        daysUntil: 14,
        date: nextDate,
        confidence: 'low',
        explanation: 'Using default 28-day cycle (API unavailable)'
      },
      cycleHealth: {
        isIrregular: false,
        riskLevel: 'low',
        pcosRisk: 0,
        warnings: [],
        recommendations: ['Log more periods for personalized health insights']
      },
      dailySymptoms: {
        crampIntensity: 2,
        flowIntensity: 0,
        fatigueLevel: 3,
        moodImpact: 2,
        overallDiscomfort: 2,
        descriptions: {
          cramps: 'None to minimal',
          flow: 'None to minimal',
          fatigue: 'Mild',
          mood: 'None to minimal',
          overall: 'None to minimal'
        },
        topSymptoms: []
      },
      confidence: {
        overall: 'low',
        dataQuality: 20,
        periodsLogged: 0,
        lastUpdated: new Date()
      }
    };
  }
}

// ==========================================
// EXPORT SERVICE INSTANCE
// ==========================================

export const lunaMLService = new LunaMLService();
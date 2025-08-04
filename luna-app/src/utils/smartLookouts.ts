import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "../firebase";

export interface LookoutsData {
  pregnancyChance: 'Low' | 'Moderate' | 'High';
  expectedSymptoms: string;
  confidence: 'Default' | 'Basic' | 'Personalized';
  dataPoints: number;
}

// Default predictions based on cycle phase
const DEFAULT_LOOKOUTS = {
  countdown: {
    pregnancyChance: 'Low' as const,
    expectedSymptoms: 'PMS Symptoms',
  },
  period: {
    pregnancyChance: 'Low' as const,
    expectedSymptoms: 'Cramps',
  },
  follicular: {
    pregnancyChance: 'Low' as const,
    expectedSymptoms: 'High Energy',
  },
  ovulationCountdown: {
    pregnancyChance: 'Moderate' as const,
    expectedSymptoms: 'Increased Libido',
  },
  ovulation: {
    pregnancyChance: 'High' as const,
    expectedSymptoms: 'Ovulation Pain',
  },
  ovulationWindow: {
    pregnancyChance: 'High' as const,
    expectedSymptoms: 'Fertile Signs',
  },
  luteal: {
    pregnancyChance: 'Low' as const,
    expectedSymptoms: 'Breast Tenderness',
  },
  pms: {
    pregnancyChance: 'Low' as const,
    expectedSymptoms: 'Mood Swings',
  },
};

// Function to get cycle day range for a phase
const getPhaseRange = (phase: string, cycleLength: number) => {
  const ovulationDay = cycleLength - 14;
  
  switch (phase) {
    case 'period':
      return { start: 1, end: 5 }; // First 5 days
    case 'follicular':
      return { start: 6, end: ovulationDay - 3 };
    case 'ovulationCountdown':
      return { start: ovulationDay - 2, end: ovulationDay - 1 };
    case 'ovulation':
      return { start: ovulationDay, end: ovulationDay };
    case 'ovulationWindow':
      return { start: ovulationDay + 1, end: ovulationDay + 3 };
    case 'luteal':
      return { start: ovulationDay + 4, end: cycleLength - 6 };
    case 'pms':
      return { start: cycleLength - 5, end: cycleLength };
    default:
      return { start: 1, end: 5 };
  }
};

// Get user's historical symptom data for a specific phase
const getUserSymptomHistory = async (userId: string, phase: string, cycleLength: number) => {
  try {
    const phaseRange = getPhaseRange(phase, cycleLength);
    
    // Query symptom logs for this phase across multiple cycles
    const symptomsRef = collection(db, "users", userId, "symptomLogs");
    const q = query(
      symptomsRef,
      where("cycleDay", ">=", phaseRange.start),
      where("cycleDay", "<=", phaseRange.end)
    );
    
    const querySnapshot = await getDocs(q);
    const symptoms: Record<string, number> = {};
    
    // Count frequency of each symptom in this phase
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      if (data.symptoms && Array.isArray(data.symptoms)) {
        data.symptoms.forEach((symptom: string) => {
          symptoms[symptom] = (symptoms[symptom] || 0) + 1;
        });
      }
    });
    
    // Return most frequent symptom
    const sortedSymptoms = Object.entries(symptoms).sort((a, b) => b[1] - a[1]);
    const mostFrequent = sortedSymptoms[0];
    
    return {
      symptom: mostFrequent ? mostFrequent[0] : null,
      frequency: mostFrequent ? mostFrequent[1] : 0,
      totalLogs: querySnapshot.size
    };
  } catch (error) {
    console.error("Error fetching symptom history:", error);
    return { symptom: null, frequency: 0, totalLogs: 0 };
  }
};

// Main function to get smart lookouts
export const getSmartLookouts = async (
  userId: string | null,
  currentPhase: string,
  cycleLength: number = 28
): Promise<LookoutsData> => {
  // Default fallback
  const defaultData = DEFAULT_LOOKOUTS[currentPhase as keyof typeof DEFAULT_LOOKOUTS] || DEFAULT_LOOKOUTS.follicular;
  
  if (!userId) {
    return {
      ...defaultData,
      confidence: 'Default',
      dataPoints: 0
    };
  }
  
  try {
    // Get user's historical data for this phase
    const symptomHistory = await getUserSymptomHistory(userId, currentPhase, cycleLength);
    
    console.log("📊 Symptom History for", currentPhase, ":", symptomHistory);
    
    // Determine confidence level based on data points
    let confidence: 'Default' | 'Basic' | 'Personalized' = 'Default';
    let expectedSymptoms = defaultData.expectedSymptoms;
    
    if (symptomHistory.totalLogs >= 10) {
      // Lots of data - highly personalized
      confidence = 'Personalized';
      expectedSymptoms = symptomHistory.symptom || defaultData.expectedSymptoms;
    } else if (symptomHistory.totalLogs >= 3) {
      // Some data - moderately personalized
      confidence = 'Basic';
      expectedSymptoms = symptomHistory.symptom || defaultData.expectedSymptoms;
    }
    
    return {
      pregnancyChance: defaultData.pregnancyChance, // This stays consistent based on biology
      expectedSymptoms,
      confidence,
      dataPoints: symptomHistory.totalLogs
    };
    
  } catch (error) {
    console.error("Error getting smart lookouts:", error);
    return {
      ...defaultData,
      confidence: 'Default',
      dataPoints: 0
    };
  }
};

// Helper function to get confidence indicator text
export const getConfidenceText = (confidence: string, dataPoints: number): string => {
  switch (confidence) {
    case 'Personalized':
      return `Based on your ${dataPoints} logs`;
    case 'Basic':
      return `Early personalization (${dataPoints} logs)`;
    case 'Default':
    default:
      return 'General prediction';
  }
};
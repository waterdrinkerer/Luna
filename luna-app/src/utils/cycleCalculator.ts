// utils/cycleCalculator.ts

export interface CycleData {
  lastPeriodStart?: Date;
  lastPeriodEnd?: Date;
  cycleLength?: number;
}

export interface CyclePhase {
  phase: 'countdown' | 'period' | 'follicular' | 'ovulationCountdown' | 'ovulation' | 'ovulationWindow' | 'luteal' | 'pms';
  message: string;
  subtext: string;
  daysLeft?: string;
  dayNumber?: number;
}

// Default values for new users
const DEFAULT_CYCLE_LENGTH = 28;
const DEFAULT_PERIOD_LENGTH = 5;

export const calculateCurrentCyclePhase = (cycleData: CycleData): CyclePhase => {
  const today = new Date();
  
  // Use user data if available, otherwise defaults
  const cycleLength = cycleData.cycleLength || DEFAULT_CYCLE_LENGTH;
  const lastPeriodStart = cycleData.lastPeriodStart;
  const lastPeriodEnd = cycleData.lastPeriodEnd;
  
  // Calculate period length from user data or use default
  let periodLength = DEFAULT_PERIOD_LENGTH;
  if (lastPeriodStart && lastPeriodEnd) {
    const diffTime = Math.abs(lastPeriodEnd.getTime() - lastPeriodStart.getTime());
    periodLength = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }
  
  // If no period data, use defaults for demonstration
  if (!lastPeriodStart) {
    return {
      phase: 'countdown',
      message: 'Period in',
      subtext: 'Lower chance to get pregnant (using default cycle)',
      daysLeft: '5 Days'
    };
  }
  
  // Calculate days since last period started
  const timeSinceLastPeriod = today.getTime() - lastPeriodStart.getTime();
  const daysSinceLastPeriod = Math.floor(timeSinceLastPeriod / (1000 * 60 * 60 * 24));
  
  // Calculate current cycle day (1-based)
  const currentCycleDay = (daysSinceLastPeriod % cycleLength) + 1;
  
  // Calculate key cycle days
  const ovulationDay = cycleLength - 14; // Typically 14 days before next period
  const ovulationWindowStart = ovulationDay + 1;
  const ovulationWindowEnd = ovulationDay + 3;
  const pmsStart = cycleLength - 5; // 5 days before next period
  
  // Determine current phase
  console.log("🔍 Cycle Debug:", {
    currentCycleDay,
    cycleLength,
    periodLength,
    ovulationDay,
    daysSinceLastPeriod
  });
  
  // 1. Period phase (Days 1-5, or until period ends)
  if (currentCycleDay <= periodLength) {
    return {
      phase: 'period',
      message: `Day ${currentCycleDay}`,
      subtext: "Don't forget to log your flow",
      dayNumber: currentCycleDay
    };
  }
  
  // 2. Follicular phase (after period until 3 days before ovulation)
  if (currentCycleDay > periodLength && currentCycleDay < ovulationDay - 2) {
    return {
      phase: 'follicular',
      message: 'Follicular Phase',
      subtext: 'You might feel more energetic'
    };
  }
  
  // 3. Ovulation countdown (3 days before ovulation)
  if (currentCycleDay >= ovulationDay - 2 && currentCycleDay < ovulationDay) {
    const daysUntilOvulation = ovulationDay - currentCycleDay;
    return {
      phase: 'ovulationCountdown',
      message: 'Ovulating in',
      subtext: 'Moderate to high chance to get pregnant',
      daysLeft: `${daysUntilOvulation} Day${daysUntilOvulation > 1 ? 's' : ''}`
    };
  }
  
  // 4. Ovulation day
  if (currentCycleDay === ovulationDay) {
    return {
      phase: 'ovulation',
      message: 'Today',
      subtext: 'High chance to get pregnant'
    };
  }
  
  // 5. Ovulation window (3 days after ovulation)
  if (currentCycleDay >= ovulationWindowStart && currentCycleDay <= ovulationWindowEnd) {
    const dayInWindow = currentCycleDay - ovulationWindowStart + 1;
    return {
      phase: 'ovulationWindow',
      message: `Day ${dayInWindow}`,
      subtext: 'High chance to get pregnant',
      dayNumber: dayInWindow
    };
  }
  
  // 6. Luteal phase (after ovulation window until PMS)
  if (currentCycleDay > ovulationWindowEnd && currentCycleDay < pmsStart) {
    return {
      phase: 'luteal',
      message: 'Your body is winding down.',
      subtext: 'Take it easy.'
    };
  }
  
  // 7. PMS phase (5 days before next period)
  if (currentCycleDay >= pmsStart) {
    return {
      phase: 'pms',
      message: 'Cravings or mood swings?',
      subtext: 'You\'re not alone <3'
    };
  }
  
  // 8. Period countdown (should happen when cycle resets)
  const daysUntilNextPeriod = cycleLength - currentCycleDay;
  if (daysUntilNextPeriod <= 5) {
    return {
      phase: 'countdown',
      message: 'Period in',
      subtext: 'Lower chance to get pregnant',
      daysLeft: `${daysUntilNextPeriod} Day${daysUntilNextPeriod > 1 ? 's' : ''}`
    };
  }
  
  // Fallback - shouldn't reach here
  return {
    phase: 'follicular',
    message: 'Cycle Day ' + currentCycleDay,
    subtext: 'Tracking your cycle'
  };
};

export const getNextPeriodDate = (cycleData: CycleData): Date | null => {
  if (!cycleData.lastPeriodStart) return null;
  
  const cycleLength = cycleData.cycleLength || DEFAULT_CYCLE_LENGTH;
  const nextPeriodDate = new Date(cycleData.lastPeriodStart);
  nextPeriodDate.setDate(nextPeriodDate.getDate() + cycleLength);
  
  return nextPeriodDate;
};

export const getDaysUntilNextPeriod = (cycleData: CycleData): number | null => {
  const nextPeriodDate = getNextPeriodDate(cycleData);
  if (!nextPeriodDate) return null;
  
  const today = new Date();
  const timeDiff = nextPeriodDate.getTime() - today.getTime();
  return Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
};
import { createContext, useState } from 'react'
import type { ReactNode } from 'react'

interface OnboardingData {
  dateOfBirth?: Date
  lastPeriodStart?: Date
  lastPeriodEnd?: Date
  cycleLength?: number
}

interface OnboardingContextType {
  data: OnboardingData
  update: (values: Partial<OnboardingData>) => void
}

export const OnboardingContext = createContext<OnboardingContextType | null>(null)

export const OnboardingProvider = ({ children }: { children: ReactNode }) => {
  const [data, setData] = useState<OnboardingData>({})

  const update = (values: Partial<OnboardingData>) => {
    setData((prev) => ({ ...prev, ...values }))
  }

  return (
    <OnboardingContext.Provider value={{ data, update }}>
      {children}
    </OnboardingContext.Provider>
  )
}

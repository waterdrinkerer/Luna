import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { OnboardingProvider } from './context/OnboardingContext'
import Signup from './pages/Signup'
import DateOfBirth from './pages/DateOfBirth'
import LastPeriod from './pages/LastPeriod'
import CycleLength from './pages/CycleLength'


function App() {
  return (
    <OnboardingProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Signup />} />
          <Route path="/dob" element={<DateOfBirth />} />
          <Route path="/last-period" element={<LastPeriod />} />
          <Route path="/cycle-length" element={<CycleLength />} />
        </Routes>
      </BrowserRouter>
    </OnboardingProvider>
  )
}

export default App

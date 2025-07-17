import { BrowserRouter, Routes, Route } from "react-router-dom";
import { OnboardingProvider } from "./context/OnboardingContext";
import Signup from "./pages/Signup";
import DateOfBirth from "./pages/DateOfBirth";
import LastPeriod from "./pages/LastPeriod";
import CycleLength from "./pages/CycleLength";
import LogMood from "./pages/LogMood";
import LogSymptoms from "./pages/LogSymptoms";
import MyCycles from "./pages/MyCycles";
import QuizCrampOMeter from "./pages/QuizCrampOMeter";
import QuizMoonMood from "./pages/QuizMoonMood";
import Mooniebot from "./pages/Mooniebot";

function App() {
  return (
    <OnboardingProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Signup />} />
          <Route path="/dob" element={<DateOfBirth />} />
          <Route path="/last-period" element={<LastPeriod />} />
          <Route path="/cycle-length" element={<CycleLength />} />
          <Route path="/log-symptoms" element={<LogSymptoms />} />
          <Route path="/log-mood" element={<LogMood />} />
          <Route path="/my-cycles" element={<MyCycles />} />
          <Route path="/quiz/moon-mood" element={<QuizMoonMood />} />
          <Route path="/quiz/cramp-o-meter" element={<QuizCrampOMeter />} />
          <Route path="/mooniebot" element={<Mooniebot />} />

        </Routes>
      </BrowserRouter>
    </OnboardingProvider>
  );
}

export default App;

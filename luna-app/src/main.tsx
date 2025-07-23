import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import Welcome from "./pages/Welcome.tsx";
import Login from "./pages/Login.tsx";
import Signup from "./pages/Signup.tsx";

import DateOfBirth from "./pages/DateOfBirth.tsx";
import Height from "./pages/Height.tsx";
import LastPeriod from "./pages/LastPeriod.tsx";
import CycleLength from "./pages/CycleLength.tsx";
import ProfilePicChoose from "./pages/ProfilePicChoose.tsx";

import Home from "./pages/Home.tsx";
import LogMood from "./pages/LogMood.tsx";
import LogSymptoms from "./pages/LogSymptoms.tsx";
import MyCycles from "./pages/MyCycles.tsx";
import CalendarPage from "./pages/CalendarPage.tsx";
import LogPeriod from "./pages/LogPeriod.tsx";
import ManagePeriods from "./pages/ManagePeriods.tsx";
import PrivacyPolicy from "./pages/PrivacyPolicy.tsx";
import PrivacyConsent from "./pages/PrivacyConsent.tsx";
import PrivacySettings from "./pages/PrivacySettings.tsx";
import AboutMe from "./pages/AboutMe.tsx";

import QuizCrampOMeter from "./pages/QuizCrampOMeter.tsx";
import QuizMoonMood from "./pages/QuizMoonMood.tsx";

import Mooniebot from "./pages/Mooniebot.tsx";
import LearningLounge from "./pages/LearningLounge.tsx";
import ArticlePage from "./pages/ArticlePage.tsx";

import MyReports from "./pages/MyReports.tsx";
import LastCycleReport from "./pages/reports/LastCycleReport.tsx";
import SymptomPatterns from "./pages/reports/SymptomPatterns.tsx";
import CycleRegularity from "./pages/reports/CycleRegularity.tsx";

import CycleOverview from "./pages/CycleOverview.tsx";
import Profile from "./pages/Profile.tsx";

import { OnboardingProvider } from "./context/OnboardingContext.tsx";
import AuthWrapper from "./auth/AuthWrapper.tsx";

import "./index.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <OnboardingProvider>
        <Routes>
          {/* ✅ PUBLIC ROUTES - NO AuthWrapper */}
          <Route path="/welcome" element={<Welcome />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/privacy-policy-public" element={<PrivacyPolicy />} />
          
          {/* ✅ PROTECTED ROUTES - WITH AuthWrapper */}
          <Route path="/*" element={
            <AuthWrapper>
              <Routes>
                {/* Onboarding flow - requires auth but not completion */}
                <Route path="/privacy-consent" element={<PrivacyConsent />} />
                <Route path="/date-of-birth" element={<DateOfBirth />} />
                <Route path="/height" element={<Height />} />
                <Route path="/last-period" element={<LastPeriod />} />
                <Route path="/cycle-length" element={<CycleLength />} />
                <Route path="/profile-pic" element={<ProfilePicChoose />} />
                
                {/* Main app pages - requires completed onboarding */}
                <Route path="/home" element={<Home />} />
                <Route path="/privacy-policy" element={<PrivacyPolicy />} />
                <Route path="/privacy-settings" element={<PrivacySettings />} />
                <Route path="/about-me" element={<AboutMe />} />
                <Route path="/log-symptoms" element={<LogSymptoms />} />
                <Route path="/log-mood" element={<LogMood />} />
                <Route path="/my-cycles" element={<MyCycles />} />
                <Route path="/calendar" element={<CalendarPage />} />
                <Route path="/manage-periods" element={<ManagePeriods />} />
                <Route path="/log-period" element={<LogPeriod />} />
                <Route path="/quiz/moon-mood" element={<QuizMoonMood />} />
                <Route path="/quiz/cramp-o-meter" element={<QuizCrampOMeter />} />
                <Route path="/mooniebot" element={<Mooniebot />} />
                <Route path="/lounge" element={<LearningLounge />} />
                <Route path="/learning" element={<LearningLounge />} />
                <Route path="/learning/:articleId" element={<ArticlePage />} />
                <Route path="/my-reports" element={<MyReports />} />
                <Route path="/my-reports/last-cycle" element={<LastCycleReport />} />
                <Route path="/my-reports/symptom-patterns" element={<SymptomPatterns />} />
                <Route path="/my-reports/cycle-regularity" element={<CycleRegularity />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/cycle-overview" element={<CycleOverview />} />
              </Routes>
            </AuthWrapper>
          } />
        </Routes>
      </OnboardingProvider>
    </BrowserRouter>
  </React.StrictMode>
);
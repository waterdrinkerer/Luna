import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Login from './pages/Login.tsx';
import Signup from './pages/Signup.tsx'; // Ensure this matches the actual filename
import DateOfBirth from './pages/DateOfBirth.tsx';
import LastPeriod from './pages/LastPeriod.tsx';
import CycleLength from './pages/CycleLength.tsx';
import Welcome from './pages/Welcome.tsx';
import Home from './pages/Home.tsx';
import { OnboardingProvider } from './context/OnboardingContext.tsx';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <OnboardingProvider>
        <Routes>
          <Route path="/" element={<Welcome />} />
          <Route path="/" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/date-of-birth" element={<DateOfBirth />} />
          <Route path="/last-period" element={<LastPeriod />} />
          <Route path="/cycle-length" element={<CycleLength />} />
          <Route path="/home" element={<Home />} />
        </Routes>
      </OnboardingProvider>
    </BrowserRouter>
  </React.StrictMode>
);

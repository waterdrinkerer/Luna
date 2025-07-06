import { useNavigate } from 'react-router-dom';
import useOnboarding from '../context/useOnboarding';
import { useState } from 'react';
import { DayPicker } from 'react-day-picker';
import type { DateRange } from 'react-day-picker';

import 'react-day-picker/dist/style.css';

const LastPeriod = () => {
  const { update } = useOnboarding();
  const navigate = useNavigate();

  const [range, setRange] = useState<DateRange>({
    from: undefined,
    to: undefined,
  });

  const handleNext = () => {
    if (range.from && range.to) {
      update({
        lastPeriodStart: range.from,
        lastPeriodEnd: range.to,
      });
      navigate('/cycle-length');
    }
  };

  return (
    <div className="min-h-dvh bg-white flex flex-col items-center p-6 overflow-hidden">
      <h2 className="text-xl font-bold my-4 text-center">
        When did you last have your period?
      </h2>
      <p className="text-sm text-gray-600 mb-6 text-center">
        We can then foresee your next period.
      </p>

      <DayPicker
        mode="range"
        selected={range}
        onSelect={(selectedRange) => setRange(selectedRange as DateRange)}
        className="mb-6 rounded-lg border"
      />

      <div className="w-full flex flex-col gap-3 mt-auto">
        <button
          className={`py-3 rounded-md font-semibold text-white transition ${
            range.from && range.to
              ? 'bg-purple-500'
              : 'bg-gray-300 cursor-not-allowed'
          }`}
          onClick={handleNext}
          disabled={!range.from || !range.to}
        >
          NEXT
        </button>
        <button className="py-3 rounded-md border border-purple-500 text-purple-500 font-semibold">
          NOT SURE
        </button>
      </div>
    </div>
  );
};

export default LastPeriod;

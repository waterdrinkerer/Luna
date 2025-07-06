import { useNavigate } from 'react-router-dom';
import useOnboarding from '../context/useOnboarding';
import { useState } from 'react';

const DateOfBirth = () => {
  const { update } = useOnboarding();
  const navigate = useNavigate();
  const [dob, setDob] = useState<Date>(new Date());

  const handleNext = () => {
    update({ dateOfBirth: dob });
    navigate('/last-period');
  };

  return (
    <div className="min-h-dvh bg-white flex flex-col items-center p-6 overflow-hidden">
      <h2 className="text-xl font-bold my-4 text-center">When were you born?</h2>
      <p className="text-sm text-gray-600 mb-8 text-center">
        This helps us personalize Luna for you.
      </p>

      <input
        type="date"
        value={dob.toISOString().split('T')[0]}
        onChange={e => setDob(new Date(e.target.value))}
        className="border rounded-lg px-4 py-2 mb-8 w-full max-w-xs"
      />

      <button
        className="mt-auto w-full bg-purple-500 text-white py-3 rounded-full font-semibold"
        onClick={handleNext}
      >
        Next
      </button>
    </div>
  );
};

export default DateOfBirth;

import { useNavigate } from 'react-router-dom';
import useOnboarding from '../context/useOnboarding';
import { useState, useEffect } from 'react'; // ✅ Added useEffect

const DateOfBirth = () => {
  const context = useOnboarding();
  const { update, startOnboarding } = context; // ✅ Get startOnboarding function
  const navigate = useNavigate();
  const [dob, setDob] = useState<Date>(new Date());

  // ✅ Start onboarding when component mounts - BLOCKS Firebase sync
  useEffect(() => {
    startOnboarding();
  }, [startOnboarding]);

  const handleNext = () => {
    console.log("🔍 DateOfBirth - BEFORE update:");
    console.log("- context.name:", context.name);
    console.log("- context.dob:", context.dob);
    console.log("- context.data:", context.data);
    
    update({ dateOfBirth: dob });
    
    // Add a small delay to see the update
    setTimeout(() => {
      console.log("🔍 DateOfBirth - AFTER update:");
      console.log("- context.name:", context.name);
      console.log("- context.dob:", context.dob);
      console.log("- context.data:", context.data);
      navigate('/height'); // ✅ Navigate to height page
    }, 100);
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
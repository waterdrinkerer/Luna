import { useNavigate } from 'react-router-dom'
import useOnboarding from '../context/useOnboarding';
import { useState } from 'react'

const CycleLength = () => {
  const { update, data } = useOnboarding()
  const navigate = useNavigate()
  const [length, setLength] = useState<number>(data.cycleLength || 28)

const handleNext = () => {
  update({ cycleLength: length });
  console.log('All onboarding data:', data, length);
  navigate('/profile-pic'); 
};


  return (
    <div className="min-h-screen bg-white flex flex-col items-center p-6">
      <h2 className="text-xl font-bold my-4 text-center">How long is your typical cycle?</h2>
      <p className="text-sm text-gray-600 mb-8 text-center">
        Most cycles are 21–35 days — but yours is unique!
      </p>

      <div className="flex items-center space-x-4 mb-8">
        <button
          className="px-3 py-2 bg-gray-200 rounded-full"
          onClick={() => setLength(length > 14 ? length - 1 : length)}
        >
          –</button>
        <span className="text-xl font-bold">{length} days</span>
        <button
          className="px-3 py-2 bg-gray-200 rounded-full"
          onClick={() => setLength(length < 60 ? length + 1 : length)}
        >
          +</button>
      </div>

      <button
        className="mt-auto w-full bg-purple-500 text-white py-3 rounded-full font-semibold"
        onClick={handleNext}
      >
        Next
      </button>
    </div>
  )
}

export default CycleLength

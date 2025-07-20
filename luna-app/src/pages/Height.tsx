// src/pages/onboarding/Height.tsx
import { useNavigate } from 'react-router-dom';
import useOnboarding from '../context/useOnboarding';
import { useState } from 'react';

const Height = () => {
  const { update, data } = useOnboarding();
  const navigate = useNavigate();
  const [height, setHeight] = useState<number>(data.height || 165); // Default 165cm
  const [unit, setUnit] = useState<'cm' | 'ft'>('cm');
  const [feet, setFeet] = useState<number>(5);
  const [inches, setInches] = useState<number>(5);

  const handleNext = () => {
    const heightInCm = unit === 'cm' ? height : Math.round((feet * 12 + inches) * 2.54);
    update({ height: heightInCm });
    navigate('/last-period');
  };

  const convertToCm = (ft: number, inch: number) => {
    return Math.round((ft * 12 + inch) * 2.54);
  };

  return (
    <div className="min-h-screen bg-white flex flex-col items-center p-6">
      <h2 className="text-xl font-bold my-4 text-center">What's your height?</h2>
      <p className="text-sm text-gray-600 mb-8 text-center">
        This helps us calculate your BMI for better health insights
      </p>

      {/* Unit Toggle */}
      <div className="flex bg-gray-100 rounded-full p-1 mb-6">
        <button
          onClick={() => setUnit('cm')}
          className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
            unit === 'cm' ? 'bg-purple-500 text-white' : 'text-gray-600'
          }`}
        >
          Centimeters
        </button>
        <button
          onClick={() => setUnit('ft')}
          className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
            unit === 'ft' ? 'bg-purple-500 text-white' : 'text-gray-600'
          }`}
        >
          Feet & Inches
        </button>
      </div>

      {/* Height Input */}
      {unit === 'cm' ? (
        <div className="flex items-center space-x-4 mb-8">
          <button
            className="px-3 py-2 bg-gray-200 rounded-full"
            onClick={() => setHeight(height > 100 ? height - 1 : height)}
          >
            –
          </button>
          <span className="text-2xl font-bold min-w-[100px] text-center">{height} cm</span>
          <button
            className="px-3 py-2 bg-gray-200 rounded-full"
            onClick={() => setHeight(height < 250 ? height + 1 : height)}
          >
            +
          </button>
        </div>
      ) : (
        <div className="space-y-4 mb-8">
          {/* Feet */}
          <div className="flex items-center justify-center space-x-4">
            <button
              className="px-3 py-2 bg-gray-200 rounded-full"
              onClick={() => setFeet(feet > 3 ? feet - 1 : feet)}
            >
              –
            </button>
            <span className="text-xl font-bold min-w-[80px] text-center">{feet} ft</span>
            <button
              className="px-3 py-2 bg-gray-200 rounded-full"
              onClick={() => setFeet(feet < 8 ? feet + 1 : feet)}
            >
              +
            </button>
          </div>
          
          {/* Inches */}
          <div className="flex items-center justify-center space-x-4">
            <button
              className="px-3 py-2 bg-gray-200 rounded-full"
              onClick={() => setInches(inches > 0 ? inches - 1 : inches)}
            >
              –
            </button>
            <span className="text-xl font-bold min-w-[80px] text-center">{inches} in</span>
            <button
              className="px-3 py-2 bg-gray-200 rounded-full"
              onClick={() => setInches(inches < 11 ? inches + 1 : inches)}
            >
              +
            </button>
          </div>
          
          <p className="text-center text-sm text-gray-500">
            = {convertToCm(feet, inches)} cm
          </p>
        </div>
      )}

      {/* Height range indicator */}
      <div className="w-full max-w-xs mb-8">
        <div className="text-xs text-gray-500 mb-2 text-center">
          {unit === 'cm' ? `${height} cm` : `${feet}'${inches}" (${convertToCm(feet, inches)} cm)`}
        </div>
        <div className="h-1 bg-gray-200 rounded-full">
          <div 
            className="h-1 bg-purple-500 rounded-full transition-all duration-300"
            style={{ 
              width: `${Math.min(100, Math.max(0, ((unit === 'cm' ? height : convertToCm(feet, inches)) - 140) / (200 - 140) * 100))}%` 
            }}
          />
        </div>
        <div className="flex justify-between text-xs text-gray-400 mt-1">
          <span>140cm</span>
          <span>200cm</span>
        </div>
      </div>

      <button
        className="mt-auto w-full bg-purple-500 text-white py-3 rounded-full font-semibold"
        onClick={handleNext}
      >
        Next
      </button>
    </div>
  );
};

export default Height;

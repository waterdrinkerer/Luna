import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { doc, updateDoc } from 'firebase/firestore';
import { db, auth } from '../firebase';

interface ConsentData {
  dataCollection: boolean;
  analytics: boolean;
  notifications: boolean;
  timestamp: string;
}

const PrivacyConsent = () => {
  const navigate = useNavigate();
  const [consents, setConsents] = useState<ConsentData>({
    dataCollection: false,
    analytics: false,
    notifications: false,
    timestamp: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleConsentChange = (type: keyof ConsentData, value: boolean) => {
    setConsents(prev => ({
      ...prev,
      [type]: value
    }));
  };

  const handleSubmit = async () => {
    // Data collection consent is required
    if (!consents.dataCollection) {
      alert('Data collection consent is required to use Luna. This allows us to provide you with personalized cycle predictions.');
      return;
    }

    setIsSubmitting(true);

    try {
      const user = auth.currentUser;
      if (!user) throw new Error('No authenticated user');

      const consentData = {
        ...consents,
        timestamp: new Date().toISOString()
      };

      // Save consent to user document
      await updateDoc(doc(db, 'users', user.uid), {
        privacyConsent: consentData,
        consentGiven: true,
        updatedAt: new Date()
      });

      console.log('✅ Privacy consent saved:', consentData);
      navigate('/date-of-birth'); // Continue with onboarding
    } catch (error) {
      console.error('❌ Error saving consent:', error);
      alert('Failed to save privacy settings. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 flex flex-col">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-400 to-pink-400 rounded-b-3xl shadow-lg">
        <div className="px-6 pt-8 pb-6">
          <div className="text-center">
            <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mx-auto mb-4">
              <span className="text-white text-2xl">🛡️</span>
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">Privacy & Consent</h1>
            <p className="text-white/80 text-sm">
              Help us provide you with the best experience while keeping your data safe
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 px-6 py-6 -mt-4">
        <div className="bg-white rounded-3xl shadow-lg p-6 max-w-md mx-auto">
          
          {/* Introduction */}
          <div className="text-center mb-6">
            <h2 className="text-lg font-bold text-gray-800 mb-2">Your Data, Your Choice</h2>
            <p className="text-sm text-gray-600">
              Luna respects your privacy. Please review and customize your data preferences below.
            </p>
          </div>

          {/* Consent Options */}
          <div className="space-y-4">
            
            {/* Required: Data Collection */}
            <div className="border-2 border-purple-200 rounded-2xl p-4">
              <div className="flex items-start gap-3">
                <div className="relative">
                  <input
                    type="checkbox"
                    id="dataCollection"
                    checked={consents.dataCollection}
                    onChange={(e) => handleConsentChange('dataCollection', e.target.checked)}
                    className="w-5 h-5 text-purple-600 border-2 border-purple-300 rounded focus:ring-purple-500"
                  />
                  <span className="absolute -top-1 -right-1 text-red-500 text-xs">*</span>
                </div>
                <div className="flex-1">
                  <label htmlFor="dataCollection" className="font-semibold text-gray-800 cursor-pointer">
                    Data Collection & Processing
                  </label>
                  <p className="text-sm text-gray-600 mt-1">
                    Allow Luna to collect and process your cycle data, symptoms, and health information 
                    to provide personalized predictions and insights.
                  </p>
                  <p className="text-xs text-purple-600 mt-2 font-medium">
                    ⚠️ Required for app functionality
                  </p>
                </div>
              </div>
            </div>

            
          </div>

          {/* Privacy Policy Link */}
          <div className="mt-6 p-4 bg-gray-50 rounded-2xl">
            <p className="text-xs text-gray-600 text-center">
              By proceeding, you agree to our{' '}
              <button
                onClick={() => navigate('/privacy-policy-public')}
                className="text-purple-600 font-medium underline hover:text-purple-800"
              >
                Privacy Policy
              </button>
              {' '}and{' '}
              <button className="text-purple-600 font-medium underline hover:text-purple-800">
                Terms of Service
              </button>
            </p>
          </div>

          {/* Action Buttons */}
          <div className="mt-6 space-y-3">
            <button
              onClick={handleSubmit}
              disabled={isSubmitting || !consents.dataCollection}
              className={`w-full py-3 rounded-2xl font-semibold transition-all ${
                consents.dataCollection && !isSubmitting
                  ? 'bg-purple-500 hover:bg-purple-600 text-white'
                  : 'bg-gray-200 text-gray-500 cursor-not-allowed'
              }`}
            >
              {isSubmitting ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Saving...
                </div>
              ) : (
                'Continue with These Settings'
              )}
            </button>

            <button
              onClick={() => navigate('/privacy-policy-public')}
              className="w-full py-2 text-purple-600 font-medium hover:text-purple-800 transition-colors"
            >
              Read Full Privacy Policy
            </button>
          </div>

          {/* Data Security Assurance */}
          <div className="mt-6 pt-4 border-t border-gray-100">
            <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
              <span>🔐</span>
              <span>Your data is encrypted and secure</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrivacyConsent;
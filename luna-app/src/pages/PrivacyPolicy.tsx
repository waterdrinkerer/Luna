import { useNavigate } from "react-router-dom";

const PrivacyPolicy = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-400 to-pink-400 rounded-b-3xl shadow-lg">
        <div className="px-6 pt-8 pb-6">
          <div className="flex items-center gap-3 mb-4">
            <button
              onClick={() => navigate(-1)}
              className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center"
            >
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div>
              <h1 className="text-2xl font-bold text-white">Privacy Policy</h1>
              <p className="text-white/80 text-sm">Your data, your rights</p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-6 py-6 -mt-4">
        <div className="bg-white rounded-3xl shadow-lg p-6 space-y-6">
          
          {/* Last Updated */}
          <div className="text-center py-4 bg-purple-50 rounded-2xl">
            <p className="text-sm text-purple-700">
              <strong>Last Updated:</strong> {new Date().toLocaleDateString()}
            </p>
          </div>

          {/* Introduction */}
          <section>
            <h2 className="text-xl font-bold text-gray-800 mb-3 flex items-center gap-2">
              <span className="text-purple-500">🛡️</span>
              Your Privacy Matters
            </h2>
            <p className="text-gray-600 leading-relaxed">
              Luna is committed to protecting your privacy and personal data. This policy explains how we collect, 
              use, and safeguard your information when you use our menstrual health tracking app.
            </p>
          </section>

          {/* What Data We Collect */}
          <section>
            <h2 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
              <span className="text-blue-500">📊</span>
              What Data We Collect
            </h2>
            <div className="space-y-3">
              <div className="bg-blue-50 p-4 rounded-xl">
                <h3 className="font-semibold text-blue-800 mb-2">Health Data</h3>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• Menstrual cycle dates and duration</li>
                  <li>• Symptoms and mood tracking</li>
                  <li>• Weight measurements (optional)</li>
                  <li>• Health insights and notes</li>
                </ul>
              </div>
              <div className="bg-green-50 p-4 rounded-xl">
                <h3 className="font-semibold text-green-800 mb-2">Profile Data</h3>
                <ul className="text-sm text-green-700 space-y-1">
                  <li>• Name and email address</li>
                  <li>• Date of birth</li>
                  <li>• Profile preferences</li>
                  <li>• App usage analytics</li>
                </ul>
              </div>
            </div>
          </section>

          {/* How We Use Your Data */}
          <section>
            <h2 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
              <span className="text-pink-500">🎯</span>
              How We Use Your Data
            </h2>
            <div className="bg-pink-50 p-4 rounded-xl">
              <ul className="text-sm text-pink-700 space-y-2">
                <li><strong>🤖 AI Predictions:</strong> To provide personalized cycle predictions and health insights</li>
                <li><strong>📈 Analytics:</strong> To improve app performance and user experience</li>
                <li><strong>🔔 Notifications:</strong> To send you period reminders and health tips</li>
                <li><strong>💬 Support:</strong> To provide customer support when needed</li>
              </ul>
            </div>
          </section>

          {/* Data Security */}
          <section>
            <h2 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
              <span className="text-emerald-500">🔐</span>
              How We Protect Your Data
            </h2>
            <div className="bg-emerald-50 p-4 rounded-xl">
              <ul className="text-sm text-emerald-700 space-y-2">
                <li><strong>🔒 Encryption:</strong> All data is encrypted in transit and at rest</li>
                <li><strong>🏢 Secure Storage:</strong> Data is stored on Google Firebase's secure servers</li>
                <li><strong>👤 Access Control:</strong> Only you can access your personal data</li>
                <li><strong>🛡️ Compliance:</strong> We follow GDPR and international privacy standards</li>
              </ul>
            </div>
          </section>

          {/* Data Sharing */}
          <section>
            <h2 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
              <span className="text-orange-500">🤝</span>
              Data Sharing
            </h2>
            <div className="bg-orange-50 p-4 rounded-xl">
              <p className="text-sm text-orange-700 font-medium mb-2">
                We <strong>DO NOT</strong> share your personal health data with third parties.
              </p>
              <p className="text-sm text-orange-600">
                Your cycle data, symptoms, and health information remain completely private and are only used 
                to provide you with personalized insights within the Luna app.
              </p>
            </div>
          </section>

          {/* Your Rights */}
          <section>
            <h2 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
              <span className="text-purple-500">⚖️</span>
              Your Rights
            </h2>
            <div className="space-y-3">
              <div className="bg-purple-50 p-4 rounded-xl">
                <h3 className="font-semibold text-purple-800 mb-2">You have the right to:</h3>
                <ul className="text-sm text-purple-700 space-y-1">
                  <li>• <strong>Access:</strong> View all data we have about you</li>
                  <li>• <strong>Export:</strong> Download your data in a portable format</li>
                  <li>• <strong>Delete:</strong> Remove your account and all associated data</li>
                  <li>• <strong>Correct:</strong> Update or correct your personal information</li>
                  <li>• <strong>Withdraw Consent:</strong> Stop data collection at any time</li>
                </ul>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-xl">
                <p className="text-sm text-gray-600">
                  <strong>💡 To exercise these rights:</strong> Go to Profile → Privacy Settings or contact us at 
                  <span className="text-purple-600 font-medium"> privacy@luna-app.com</span>
                </p>
              </div>
            </div>
          </section>

          {/* Data Retention */}
          <section>
            <h2 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
              <span className="text-yellow-500">⏰</span>
              Data Retention
            </h2>
            <div className="bg-yellow-50 p-4 rounded-xl">
              <p className="text-sm text-yellow-700">
                We keep your data only as long as your account is active. When you delete your account, 
                all personal data is permanently removed within 30 days. Anonymous analytics may be retained 
                for app improvement purposes.
              </p>
            </div>
          </section>

          {/* Contact */}
          <section>
            <h2 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
              <span className="text-blue-500">📧</span>
              Contact Us
            </h2>
            <div className="bg-blue-50 p-4 rounded-xl">
              <p className="text-sm text-blue-700 mb-2">
                If you have questions about this privacy policy or your data:
              </p>
              <ul className="text-sm text-blue-600 space-y-1">
                <li>• Email: <strong>privacy@luna-app.com</strong></li>
                <li>• Response time: Within 72 hours</li>
                <li>• Available in: English, Spanish, French</li>
              </ul>
            </div>
          </section>

          {/* Updates */}
          <section>
            <h2 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
              <span className="text-indigo-500">🔄</span>
              Policy Updates
            </h2>
            <div className="bg-indigo-50 p-4 rounded-xl">
              <p className="text-sm text-indigo-700">
                We may update this policy occasionally. If we make significant changes, we'll notify you 
                through the app and ask for your renewed consent where required by law.
              </p>
            </div>
          </section>

          {/* Footer */}
          <div className="text-center py-6 border-t border-gray-200">
            <p className="text-xs text-gray-500 mb-2">
              Luna - Empowering Women's Health Through Technology
            </p>
            <p className="text-xs text-gray-400">
              This privacy policy is compliant with GDPR, CCPA, and international privacy standards.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
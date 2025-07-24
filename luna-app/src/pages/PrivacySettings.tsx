import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { doc, getDoc, updateDoc, deleteDoc, getDocs, collection } from 'firebase/firestore';
import { deleteUser } from 'firebase/auth';
import { db, auth } from '../firebase';

interface UserConsent {
  dataCollection: boolean;
  analytics: boolean;
  notifications: boolean;
  timestamp: string;
}

const PrivacySettings = () => {
  const navigate = useNavigate();
  const [consent, setConsent] = useState<UserConsent | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    loadUserConsent();
  }, []);

  const loadUserConsent = async () => {
    try {
      const user = auth.currentUser;
      if (!user) return;

      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (userDoc.exists()) {
        const data = userDoc.data();
        setConsent(data.privacyConsent || {
          dataCollection: true,
          analytics: false,
          notifications: false,
          timestamp: new Date().toISOString()
        });
      }
    } catch (error) {
      console.error('Error loading consent:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateConsent = async (newConsent: UserConsent) => {
    try {
      const user = auth.currentUser;
      if (!user) return;

      await updateDoc(doc(db, 'users', user.uid), {
        privacyConsent: newConsent,
        updatedAt: new Date()
      });

      setConsent(newConsent);
      console.log('✅ Consent updated');
    } catch (error) {
      console.error('❌ Error updating consent:', error);
      alert('Failed to update privacy settings');
    }
  };

  const exportUserData = async () => {
    setIsExporting(true);
    try {
      const user = auth.currentUser;
      if (!user) return;

      // Collect all user data
      const userData: any = {
        exportDate: new Date().toISOString(),
        userId: user.uid,
        profile: {},
        periodLogs: [],
        symptomLogs: [],
        moodLogs: [],
        weightLogs: []
      };

      // Get profile data
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (userDoc.exists()) {
        userData.profile = userDoc.data();
      }

      // Get all subcollections
      const collections = ['periodLogs', 'symptomLogs', 'moodLogs', 'weightLogs'];
      
      for (const collectionName of collections) {
        const snapshot = await getDocs(collection(db, 'users', user.uid, collectionName));
        userData[collectionName] = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
      }

      // Create and download JSON file
      const dataStr = JSON.stringify(userData, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `luna-data-export-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      console.log('✅ Data exported successfully');
      alert('Your data has been exported successfully!');
    } catch (error) {
      console.error('❌ Error exporting data:', error);
      alert('Failed to export data. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  const deleteUserAccount = async () => {
    setIsDeleting(true);
    try {
      const user = auth.currentUser;
      if (!user) return;

      // Delete all user data from Firestore
      const collections = ['periodLogs', 'symptomLogs', 'moodLogs', 'weightLogs'];
      
      for (const collectionName of collections) {
        const snapshot = await getDocs(collection(db, 'users', user.uid, collectionName));
        const deletePromises = snapshot.docs.map(doc => deleteDoc(doc.ref));
        await Promise.all(deletePromises);
      }

      // Delete user document
      await deleteDoc(doc(db, 'users', user.uid));

      // Delete authentication account
      await deleteUser(user);

      console.log('✅ Account and data deleted successfully');
      navigate('/login');
    } catch (error) {
      console.error('❌ Error deleting account:', error);
      alert('Failed to delete account. Please try again or contact support.');
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-purple-600">Loading privacy settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-400 to-pink-400 rounded-b-3xl shadow-lg">
        <div className="px-6 pt-8 pb-6 mb-4" >
          <div className="flex items-center gap-3 mb-4">
            <button
              onClick={() => navigate(-1)}
              className="w-10 h-10 mt-6 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center"
            >
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div>
              <h1 className="text-2xl font-bold mt-6 text-white">Privacy Settings</h1>
              <p className="text-white/80 text-sm">Manage your data and privacy preferences</p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-6 py-6 -mt-4 space-y-6">
        
        {/* Current Consent Settings */}
        <div className="bg-white rounded-3xl shadow-lg p-6">
          <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            <span className="text-purple-500">⚙️</span>
            Current Privacy Preferences
          </h2>
          
          {consent && (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-purple-50 rounded-2xl">
                <div>
                  <p className="font-semibold text-purple-800">Data Collection</p>
                  <p className="text-sm text-purple-600">Required for app functionality</p>
                </div>
                <div className="text-purple-600">
                  {consent.dataCollection ? '✅ Enabled' : '❌ Disabled'}
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-blue-50 rounded-2xl">
                <div>
                  <p className="font-semibold text-blue-800">Analytics & Improvement</p>
                  <p className="text-sm text-blue-600">Help us improve the app</p>
                </div>
                <button
                  onClick={() => updateConsent({
                    ...consent,
                    analytics: !consent.analytics,
                    timestamp: new Date().toISOString()
                  })}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    consent.analytics 
                      ? 'bg-blue-500 text-white hover:bg-blue-600' 
                      : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                  }`}
                >
                  {consent.analytics ? 'Enabled' : 'Disabled'}
                </button>
              </div>

              <div className="flex items-center justify-between p-4 bg-green-50 rounded-2xl">
                <div>
                  <p className="font-semibold text-green-800">Notifications</p>
                  <p className="text-sm text-green-600">Period reminders and health tips</p>
                </div>
                <button
                  onClick={() => updateConsent({
                    ...consent,
                    notifications: !consent.notifications,
                    timestamp: new Date().toISOString()
                  })}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    consent.notifications 
                      ? 'bg-green-500 text-white hover:bg-green-600' 
                      : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                  }`}
                >
                  {consent.notifications ? 'Enabled' : 'Disabled'}
                </button>
              </div>

              <div className="mt-4 p-3 bg-gray-50 rounded-xl">
                <p className="text-xs text-gray-500">
                  Last updated: {new Date(consent.timestamp).toLocaleDateString()}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Data Management */}
        <div className="bg-white rounded-3xl shadow-lg p-6">
          <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            <span className="text-blue-500">📊</span>
            Data Management
          </h2>
          
          <div className="space-y-4">
            {/* Export Data */}
            <div className="p-4 border border-blue-200 rounded-2xl">
              <div className="flex items-start justify-between">
                <div className="flex-1 mr-4">
                  <h3 className="font-semibold text-blue-800 mb-2">Export Your Data</h3>
                  <p className="text-sm text-blue-600 mb-3">
                    Download all your cycle data, symptoms, and health information in JSON format.
                  </p>
                  <ul className="text-xs text-blue-500 space-y-1">
                    <li>• Profile information</li>
                    <li>• Period and cycle logs</li>
                    <li>• Symptom and mood tracking</li>
                    <li>• Weight measurements</li>
                  </ul>
                </div>
                <button
                  onClick={exportUserData}
                  disabled={isExporting}
                  className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {isExporting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Exporting...
                    </>
                  ) : (
                    <>
                      <span>📥</span>
                      Export Data
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* View Privacy Policy */}
            <div className="p-4 border border-purple-200 rounded-2xl">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-purple-800 mb-1">Privacy Policy</h3>
                  <p className="text-sm text-purple-600">
                    Read our complete privacy policy and data handling practices.
                  </p>
                </div>
                <button
                  onClick={() => navigate('/privacy-policy')}
                  className="px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
                >
                  <span>📜</span>
                  View Policy
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Danger Zone */}
        <div className="bg-white rounded-3xl shadow-lg p-6 border-2 border-red-100">
          <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            <span className="text-red-500">⚠️</span>
            Danger Zone
          </h2>
          
          <div className="p-4 border-2 border-red-200 rounded-2xl bg-red-50">
            <div className="flex items-start justify-between">
              <div className="flex-1 mr-4">
                <h3 className="font-semibold text-red-800 mb-2">Delete Account & All Data</h3>
                <p className="text-sm text-red-600 mb-3">
                  Permanently delete your Luna account and all associated data. This action cannot be undone.
                </p>
                <ul className="text-xs text-red-500 space-y-1">
                  <li>• All cycle and health data will be deleted</li>
                  <li>• Your account cannot be recovered</li>
                  <li>• You will be logged out immediately</li>
                  <li>• Data deletion is permanent and irreversible</li>
                </ul>
              </div>
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
              >
                <span>🗑️</span>
                Delete Account
              </button>
            </div>
          </div>
        </div>

        {/* Contact Support */}
        <div className="bg-white rounded-3xl shadow-lg p-6">
          <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            <span className="text-green-500">💬</span>
            Need Help?
          </h2>
          
          <div className="p-4 bg-green-50 rounded-2xl">
            <p className="text-sm text-green-700 mb-3">
              Have questions about your privacy or data? We're here to help!
            </p>
            <div className="space-y-2 text-sm text-green-600">
              <p>📧 <strong>Email:</strong> taeunicev@gmail.com</p>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full mx-4">
            <div className="text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-red-500 text-2xl">⚠️</span>
              </div>
              
              <h3 className="text-lg font-bold text-gray-800 mb-2">Delete Account?</h3>
              <p className="text-sm text-gray-600 mb-6">
                This will permanently delete your Luna account and all your health data. 
                This action cannot be undone.
              </p>
              
              <div className="space-y-3">
                <button
                  onClick={deleteUserAccount}
                  disabled={isDeleting}
                  className="w-full py-3 bg-red-500 hover:bg-red-600 text-white rounded-2xl font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isDeleting ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Deleting...
                    </div>
                  ) : (
                    'Yes, Delete Everything'
                  )}
                </button>
                
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  disabled={isDeleting}
                  className="w-full py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-2xl font-semibold transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PrivacySettings;
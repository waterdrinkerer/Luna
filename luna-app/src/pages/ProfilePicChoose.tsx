import { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { doc, setDoc, collection, getDoc } from "firebase/firestore";
import { db, auth } from "../firebase";
import { OnboardingContext } from "../context/OnboardingContext";

const avatarOptions = [
  "/assets/avatar1.png",
  "/assets/avatar2.png",
  "/assets/avatar3.png",
  "/assets/avatar4.png",
  "/assets/avatar5.png",
  "/assets/avatar6.png",
];

const ProfilePicChoose = () => {
  const navigate = useNavigate();
  const [selectedPic, setSelectedPic] = useState<string | null>(null);
  const context = useContext(OnboardingContext);

  const handleContinue = async () => {
    if (!selectedPic || !auth.currentUser) {
      console.error("❌ Missing selectedPic or currentUser");
      return;
    }

    const uid = auth.currentUser.uid;
    const userRef = doc(db, "users", uid);

    try {
      // First, fetch existing user data from Firestore (from signup + consent)
      const existingDoc = await getDoc(userRef);
      const existingData = existingDoc.exists() ? existingDoc.data() : {};

      console.log("📥 Existing user data (with consent):", existingData);

      // ✅ UPDATED: Include consent data from PrivacyConsent step
      const userData = {
        name: existingData.name || context?.name || null,
        email: existingData.email || context?.email || auth.currentUser.email || null,
        dateOfBirth: context?.data.dateOfBirth?.toISOString() || existingData.dateOfBirth || null,
        dob: context?.data.dateOfBirth?.toISOString() || existingData.dob || null,
        cycleLength: context?.data.cycleLength || 28,
        height: context?.data.height || null,
        profilePic: selectedPic,
        hasCompletedOnboarding: true,
        createdAt: existingData.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        
        // ✅ PRESERVE: Consent data from PrivacyConsent step
        privacyConsent: existingData.privacyConsent || {
          dataCollection: true, // Default if somehow missing
          analytics: false,
          notifications: false,
          timestamp: new Date().toISOString()
        },
        consentGiven: existingData.consentGiven || true
      };

      console.log("💾 Saving complete user profile data (with consent):", userData);

      // Save user profile data (including consent)
      await setDoc(userRef, userData, { merge: true });
      console.log("✅ User profile saved successfully with consent data");

      // Handle period data if exists
      if (context?.data.lastPeriodStart && context?.data.lastPeriodEnd) {
        const docId = context.data.lastPeriodStart.toISOString().split("T")[0];
        const periodRef = doc(collection(db, "users", uid, "periodLogs"), docId);

        const duration = Math.ceil(
          (context.data.lastPeriodEnd.getTime() - context.data.lastPeriodStart.getTime()) / 
          (1000 * 60 * 60 * 24)
        ) + 1;

        const onboardingPeriod = {
          startDate: context.data.lastPeriodStart.toISOString(),
          endDate: context.data.lastPeriodEnd.toISOString(),
          duration,
          isOngoing: false,
          loggedAt: new Date().toISOString(),
          type: "past" as const,
          source: "onboarding",
          flow: "medium" as const,
          notes: "Period from onboarding setup",
        };

        await setDoc(periodRef, onboardingPeriod);
        console.log("✅ Onboarding period saved to periodLogs with doc ID:", docId);
      }

      // Update context with the saved data
      context?.setName(userData.name || null);
      context?.setEmail(userData.email || null);
      context?.setDob(userData.dateOfBirth || null);
      context?.setProfilePic(selectedPic);

      // Update context.data
      context?.update({
        name: userData.name || undefined,
        dateOfBirth: userData.dateOfBirth ? new Date(userData.dateOfBirth) : undefined,
        cycleLength: context?.data.cycleLength,
        height: context?.data.height,
      });

      console.log("✅ Context updated after save (with consent preserved)");

      // Finish onboarding
      if (context?.finishOnboarding) {
        context.finishOnboarding();
        console.log("✅ Onboarding finished - Firebase sync re-enabled");
      }

      navigate("/home");
    } catch (err) {
      console.error("❌ Error saving user data:", err);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 p-6 flex flex-col items-center justify-center">
      <h1 className="text-2xl font-bold mb-6 text-center text-gray-800">
        Choose Your Profile Picture
      </h1>

      {/* Debug info - prettier version */}
      <div className="mb-6 p-4 bg-white rounded-2xl shadow-sm border text-xs max-w-md w-full">
        <h3 className="font-semibold text-gray-800 mb-2">Setup Summary:</h3>
        <div className="space-y-1 text-gray-600">
          <p><strong>Name:</strong> {context?.name || "Not set"}</p>
          <p><strong>Email:</strong> {context?.email || "Not set"}</p>
          <p><strong>DOB:</strong> {context?.dob || "Not set"}</p>
          <p><strong>Height:</strong> {context?.data.height ? `${context.data.height} cm` : "Not set"}</p>
          <p><strong>Last Period:</strong> {
            context?.data.lastPeriodStart
              ? `${context.data.lastPeriodStart.toLocaleDateString()} - ${context.data.lastPeriodEnd?.toLocaleDateString()}`
              : "Not set"
          }</p>
          <p><strong>User ID:</strong> {auth.currentUser?.uid || "Not logged in"}</p>
        </div>
        <div className="mt-2 pt-2 border-t border-gray-100">
          <p className="text-green-600 text-xs">✅ Privacy consent will be preserved</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        {avatarOptions.map((pic, index) => (
          <img
            key={index}
            src={pic}
            alt={`Avatar ${index + 1}`}
            onClick={() => setSelectedPic(pic)}
            className={`w-24 h-24 rounded-full object-cover border-4 cursor-pointer transition duration-200 ${
              selectedPic === pic
                ? "border-purple-500 scale-105 shadow-lg"
                : "border-gray-200 hover:border-purple-300"
            }`}
          />
        ))}
      </div>

      <button
        disabled={!selectedPic}
        onClick={handleContinue}
        className={`w-full max-w-xs py-3 rounded-2xl font-semibold transition ${
          selectedPic 
            ? "bg-purple-500 hover:bg-purple-600 text-white" 
            : "bg-gray-200 text-gray-500 cursor-not-allowed"
        }`}
      >
        Complete Setup
      </button>
    </div>
  );
};

export default ProfilePicChoose;
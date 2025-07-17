import { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { doc, setDoc } from "firebase/firestore";
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

  // Debug: Log context values
  console.log("🔍 ProfilePicChoose Context:", {
    name: context?.name,
    email: context?.email,
    dob: context?.dob,
    data: context?.data
  });

  const handleContinue = async () => {
    if (!selectedPic || !auth.currentUser) {
      console.error("❌ Missing selectedPic or currentUser");
      return;
    }

    const uid = auth.currentUser.uid;
    const userRef = doc(db, "users", uid);

    try {
      // First, fetch existing user data from Firestore (from signup)
      const { getDoc } = await import("firebase/firestore");
      const existingDoc = await getDoc(userRef);
      const existingData = existingDoc.exists() ? existingDoc.data() : {};
      
      console.log("📥 Existing user data:", existingData);

      // 🔍 FULL DEBUG - moved inside try block where existingData is accessible
      console.log("🔍 FULL DEBUG:");
      console.log("- auth.currentUser.email:", auth.currentUser.email);
      console.log("- auth.currentUser.displayName:", auth.currentUser.displayName);
      console.log("- context?.name:", context?.name);
      console.log("- context?.email:", context?.email);  
      console.log("- context?.dob:", context?.dob);
      console.log("- context?.data:", JSON.stringify(context?.data, null, 2));
      console.log("- existingData:", JSON.stringify(existingData, null, 2));

      // Simplified: Now that individual fields are synced, prioritize them for cleaner logic
      const userData = {
        name: existingData.name || context?.name || null,
        email: existingData.email || context?.email || auth.currentUser.email || null,
        dateOfBirth: context?.data.dateOfBirth?.toISOString() || existingData.dateOfBirth || null,
        dob: context?.data.dateOfBirth?.toISOString() || existingData.dob || null, // Save both for compatibility
        lastPeriodStart: context?.data.lastPeriodStart?.toISOString() || null,
        lastPeriodEnd: context?.data.lastPeriodEnd?.toISOString() || null,
        cycleLength: context?.data.cycleLength || 28,
        profilePic: selectedPic,
        hasCompletedOnboarding: true,
        createdAt: existingData.createdAt || new Date().toISOString(), // Keep original creation date
        updatedAt: new Date().toISOString(), // Add update timestamp
      };

      console.log("💾 Saving user data:", userData);

      await setDoc(userRef, userData, { merge: true });
      console.log("✅ User data saved successfully");
      
      // NEW: Update context with the saved data so it reflects immediately
      context?.setName(userData.name || null);
      context?.setEmail(userData.email || null);
      context?.setDob(userData.dateOfBirth || null);
      context?.setProfilePic(selectedPic);
      
      // Also update context.data
      context?.update({
        name: userData.name || undefined,
        dateOfBirth: userData.dateOfBirth ? new Date(userData.dateOfBirth) : undefined,
        lastPeriodStart: context?.data.lastPeriodStart,
        lastPeriodEnd: context?.data.lastPeriodEnd,
        cycleLength: context?.data.cycleLength,
      });
      
      console.log("✅ Context updated after save");
      
      // Debug: Verify data was saved by reading it back
      const { doc: docFunc } = await import("firebase/firestore");
      const savedDoc = await getDoc(docFunc(db, "users", uid));
      if (savedDoc.exists()) {
        console.log("✅ Verified saved data:", savedDoc.data());
      } else {
        console.error("❌ Document doesn't exist after saving");
      }
      
      navigate("/home");
    } catch (err) {
      console.error("❌ Error saving user data:", err);
    }
  };

  return (
    <div className="min-h-screen bg-[#F6F4FF] p-6 flex flex-col items-center justify-center">
      <h1 className="text-2xl font-bold mb-6 text-center">
        Choose Your Profile Picture
      </h1>

      {/* Debug info */}
      <div className="mb-4 p-2 bg-gray-100 rounded text-xs">
        <p><strong>Name:</strong> {context?.name || "Not set"}</p>
        <p><strong>Email:</strong> {context?.email || "Not set"}</p>
        <p><strong>DOB:</strong> {context?.dob || "Not set"}</p>
        <p><strong>User ID:</strong> {auth.currentUser?.uid || "Not logged in"}</p>
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
                ? "border-purple-500 scale-105"
                : "border-transparent"
            }`}
          />
        ))}
      </div>

      <button
        disabled={!selectedPic}
        onClick={handleContinue}
        className={`w-full max-w-xs bg-purple-600 text-white py-3 rounded-full font-semibold transition ${
          selectedPic ? "opacity-100" : "opacity-50 cursor-not-allowed"
        }`}
      >
        Continue
      </button>
    </div>
  );
};

export default ProfilePicChoose;
import { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { doc, setDoc, collection } from "firebase/firestore";
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
      // First, fetch existing user data from Firestore (from signup)
      const { getDoc } = await import("firebase/firestore");
      const existingDoc = await getDoc(userRef);
      const existingData = existingDoc.exists() ? existingDoc.data() : {};

      console.log("📥 Existing user data:", existingData);

      // ✅ FIXED: User profile data WITHOUT period information
      const userData = {
        name: existingData.name || context?.name || null,
        email:
          existingData.email ||
          context?.email ||
          auth.currentUser.email ||
          null,
        dateOfBirth:
          context?.data.dateOfBirth?.toISOString() ||
          existingData.dateOfBirth ||
          null,
        dob:
          context?.data.dateOfBirth?.toISOString() || existingData.dob || null,
        cycleLength: context?.data.cycleLength || 28,
        height: context?.data.height || null,
        profilePic: selectedPic,
        hasCompletedOnboarding: true,
        createdAt: existingData.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        // ✅ REMOVED: No period data in user profile anymore
      };

      console.log("💾 Saving user profile data (no periods):", userData);

      // Save user profile data (WITHOUT period information)
      await setDoc(userRef, userData, { merge: true });
      console.log("✅ User profile saved successfully");

      if (context?.data.lastPeriodStart && context?.data.lastPeriodEnd) {
        const docId = context.data.lastPeriodStart.toISOString().split("T")[0];
        const periodRef = doc(
          collection(db, "users", uid, "periodLogs"),
          docId
        );

        const duration =
          Math.ceil(
            (context.data.lastPeriodEnd.getTime() -
              context.data.lastPeriodStart.getTime()) /
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
        console.log(
          "✅ Onboarding period saved to periodLogs with doc ID:",
          docId
        );
      }

      // Update context with the saved data
      context?.setName(userData.name || null);
      context?.setEmail(userData.email || null);
      context?.setDob(userData.dateOfBirth || null);
      context?.setProfilePic(selectedPic);

      // ✅ FIXED: Update context.data WITHOUT period fields
      context?.update({
        name: userData.name || undefined,
        dateOfBirth: userData.dateOfBirth
          ? new Date(userData.dateOfBirth)
          : undefined,
        cycleLength: context?.data.cycleLength,
        height: context?.data.height,
        // ✅ REMOVED: No period data in context after save
      });

      console.log(
        "✅ Context updated after save (periods moved to periodLogs)"
      );

      // Finish onboarding to re-enable Firebase sync
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
    <div className="min-h-screen bg-[#F6F4FF] p-6 flex flex-col items-center justify-center">
      <h1 className="text-2xl font-bold mb-6 text-center">
        Choose Your Profile Picture
      </h1>

      {/* Debug info */}
      <div className="mb-4 p-2 bg-gray-100 rounded text-xs">
        <p>
          <strong>Name:</strong> {context?.name || "Not set"}
        </p>
        <p>
          <strong>Email:</strong> {context?.email || "Not set"}
        </p>
        <p>
          <strong>DOB:</strong> {context?.dob || "Not set"}
        </p>
        <p>
          <strong>Height:</strong>{" "}
          {context?.data.height ? `${context.data.height} cm` : "Not set"}
        </p>
        <p>
          <strong>Last Period:</strong>{" "}
          {context?.data.lastPeriodStart
            ? `${context.data.lastPeriodStart.toLocaleDateString()} - ${context.data.lastPeriodEnd?.toLocaleDateString()}`
            : "Not set"}
        </p>
        <p>
          <strong>Storage:</strong> Period → periodLogs, Profile → users
        </p>
        <p>
          <strong>User ID:</strong> {auth.currentUser?.uid || "Not logged in"}
        </p>
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
        Complete Setup
      </button>
    </div>
  );
};

export default ProfilePicChoose;

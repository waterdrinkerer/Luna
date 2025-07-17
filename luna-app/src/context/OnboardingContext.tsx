import { createContext, useState, useEffect } from "react";
import type { ReactNode } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "../firebase";
import { doc, getDoc } from "firebase/firestore";

interface OnboardingData {
  name?: string;
  dateOfBirth?: Date;
  lastPeriodStart?: Date;
  lastPeriodEnd?: Date;
  cycleLength?: number;
}

export interface OnboardingContextType {
  data: OnboardingData;
  update: (values: Partial<OnboardingData>) => void;

  name: string;
  email: string;
  dob: string;
  profilePic: string;
  setName: (name: string | null) => void;
  setEmail: (email: string | null) => void;
  setDob: (dob: string | null) => void;
  setProfilePic: (url: string) => void;
}

export const OnboardingContext = createContext<OnboardingContextType | null>(null);

export const OnboardingProvider = ({ children }: { children: ReactNode }) => {
  const [data, setData] = useState<OnboardingData>({});

  const update = (values: Partial<OnboardingData>) => {
    console.log("📝 Context update called with:", values);
    setData((prev) => ({ ...prev, ...values }));
    
    // Also update individual fields when they're part of the update
    if (values.name !== undefined) {
      setName(values.name || "");
    }
    if (values.dateOfBirth !== undefined) {
      setDob(values.dateOfBirth ? values.dateOfBirth.toISOString().split('T')[0] : "");
    }
  };

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [dob, setDob] = useState("");
  const [profilePic, setProfilePic] = useState("/assets/profile-placeholder.jpg");

  // Debug function to log current state
  const logCurrentState = () => {
    console.log("📊 Current Context State:", {
      name,
      email,
      dob,
      profilePic,
      data
    });
  };

  // 🔄 Auto-fetch latest user data when auth changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      console.log("🔄 Auth state changed:", user?.uid || "No user");
      
      if (user) {
        try {
          const docRef = doc(db, "users", user.uid);
          const docSnap = await getDoc(docRef);
          
          console.log("📄 Document exists:", docSnap.exists());
          
          if (docSnap.exists()) {
            const userData = docSnap.data();
            console.log("📥 Fetched user data:", userData);
            
            // Updated: Handle null values properly - convert null to empty string for display
            const newName = userData.name || "";
            const newEmail = userData.email || user.email || "";
            // Handle both dob and dateOfBirth fields properly
            const dobFromFirestore = userData.dob || userData.dateOfBirth;
            const newDob = dobFromFirestore ? (typeof dobFromFirestore === 'string' ? dobFromFirestore.split('T')[0] : new Date(dobFromFirestore).toISOString().split('T')[0]) : "";
            const newProfilePic = userData.profilePic || "/assets/profile-placeholder.jpg";
            
            setName(newName);
            setEmail(newEmail);
            setDob(newDob);
            setProfilePic(newProfilePic);
            
            console.log("✅ Context updated with:", {
              name: newName,
              email: newEmail,
              dob: newDob,
              profilePic: newProfilePic
            });
            
            // Update onboarding data as well
            setData({
              name: userData.name,
              dateOfBirth: dobFromFirestore ? new Date(dobFromFirestore) : undefined,
              lastPeriodStart: userData.lastPeriodStart ? new Date(userData.lastPeriodStart) : undefined,
              lastPeriodEnd: userData.lastPeriodEnd ? new Date(userData.lastPeriodEnd) : undefined,
              cycleLength: userData.cycleLength || 28,
            });
          } else {
            console.log("📄 No document found for user");
          }
        } catch (error) {
          console.error("❌ Error fetching user data:", error);
        }
      } else {
        console.log("🔄 Clearing context data (user logged out)");
        // Clear everything on logout
        setName("");
        setEmail("");
        setDob("");
        setProfilePic("/assets/profile-placeholder.jpg");
        setData({});
      }
      
      // Log final state
      setTimeout(logCurrentState, 100);
    });

    return () => unsubscribe();
  }, []);

  // Updated: Custom setters with logging and null handling
  const setNameWithLog = (newName: string | null) => {
    const nameValue = newName || "";
    console.log("📝 Setting name:", nameValue);
    setName(nameValue);
  };

  const setEmailWithLog = (newEmail: string | null) => {
    const emailValue = newEmail || "";
    console.log("📝 Setting email:", emailValue);
    setEmail(emailValue);
  };

  const setDobWithLog = (newDob: string | null) => {
    const dobValue = newDob || "";
    console.log("📝 Setting dob:", dobValue);
    setDob(dobValue);
  };

  const setProfilePicWithLog = (newPic: string) => {
    console.log("📝 Setting profile pic:", newPic);
    setProfilePic(newPic);
  };

  return (
    <OnboardingContext.Provider
      value={{
        data,
        update,
        name,
        email,
        dob,
        profilePic,
        setName: setNameWithLog,
        setEmail: setEmailWithLog,
        setDob: setDobWithLog,
        setProfilePic: setProfilePicWithLog,
      }}
    >
      {children}
    </OnboardingContext.Provider>
  );
};
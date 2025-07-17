import { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { OnboardingContext } from "../context/OnboardingContext";
import { auth, db } from "../firebase";
import { signOut } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import ProfilePicModal from "../components/ProfilePicModal";

const Profile = () => {
  const navigate = useNavigate();
  const context = useContext(OnboardingContext);

  const [profilePic, setProfilePic] = useState("/assets/profile-placeholder.jpg");
  const [name, setName] = useState("Loading...");
  const [email, setEmail] = useState("Loading...");
  const [dob, setDob] = useState("Loading...");
  const [showModal, setShowModal] = useState(false);

  // Debug: Log context values
  console.log("🔍 Profile Context:", {
    contextName: context?.name,
    contextEmail: context?.email,
    contextDob: context?.dob,
    contextProfilePic: context?.profilePic
  });

  useEffect(() => {
    const fetchUserData = async () => {
      const user = auth.currentUser;
      if (!user) {
        console.error("❌ No authenticated user found");
        return;
      }

      console.log("👤 Fetching data for user:", user.uid);

      try {
        const userRef = doc(db, "users", user.uid);
        const userSnap = await getDoc(userRef);

        console.log("📄 Document exists:", userSnap.exists());

        if (userSnap.exists()) {
          const data = userSnap.data();
          console.log("📥 Raw Firestore data:", data);
          
          // Updated: Handle null/empty values properly - display "Not set" for null/undefined/empty values
          const userName = (data.name && data.name.trim() !== "") ? data.name : "Not set";
          const userEmail = (data.email && data.email.trim() !== "") ? data.email : (user.email || "Not set");
          
          // Handle both dateOfBirth and dob fields with proper date formatting
          const dobFromFirestore = data.dob || data.dateOfBirth;
          const formattedDob = dobFromFirestore ? new Date(dobFromFirestore).toLocaleDateString() : "Not set";
          
          const userProfilePic = data.profilePic || "/assets/profile-placeholder.jpg";

          setName(userName);
          setEmail(userEmail);
          setDob(formattedDob);
          setProfilePic(userProfilePic);

          console.log("✅ Profile state updated:", {
            name: userName,
            email: userEmail,
            dob: formattedDob,
            profilePic: userProfilePic
          });

          // Updated: Sync to context - use actual values or null for empty strings
          context?.setName((data.name && data.name.trim() !== "") ? data.name : null);
          context?.setEmail((data.email && data.email.trim() !== "") ? data.email : (user.email || null));
          context?.setDob(dobFromFirestore || null);
          context?.setProfilePic(userProfilePic);
        } else {
          console.error("❌ No document found for user");
          setName("No document found");
          setEmail("No document found");
          setDob("No document found");
        }
      } catch (error) {
        console.error("❌ Error fetching user data:", error);
        setName("Error loading");
        setEmail("Error loading");
        setDob("Error loading");
      }
    };

    fetchUserData();
  }, [context]);

  const handlePicChange = async (pic: string) => {
    setProfilePic(pic);
    context?.setProfilePic(pic);

    const user = auth.currentUser;
    if (user) {
      try {
        const userRef = doc(db, "users", user.uid);
        await setDoc(userRef, { profilePic: pic }, { merge: true });
        console.log("✅ Profile picture updated successfully");
      } catch (error) {
        console.error("❌ Error updating profile picture:", error);
      }
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate("/welcome");
    } catch (error) {
      console.error("❌ Error signing out:", error);
    }
  };

  return (
    <div className="min-h-screen bg-[#F6F4FF] px-5 pt-6 pb-20">
      {/* Back Button */}
      <button
        onClick={() => navigate(-1)}
        className="mb-4 text-sm text-[#7E5FFF] font-medium flex items-center space-x-1"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
        <span>Back</span>
      </button>

      <h1 className="text-xl font-bold mb-6">My Profile</h1>
      
      <div className="flex flex-col items-center gap-3 mb-6">
        <img
          src={profilePic}
          alt="Profile"
          className="w-24 h-24 rounded-full object-cover border"
        />
        <button
          onClick={() => setShowModal(true)}
          className="text-sm text-[#7E5FFF] font-medium"
        >
          Change Photo
        </button>
      </div>

      <div className="bg-white p-4 rounded-xl shadow space-y-4 mb-4">
        <div>
          <p className="text-xs text-gray-500">Name</p>
          <p className="text-sm font-medium text-gray-800">{name}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500">Email</p>
          <p className="text-sm font-medium text-gray-800">{email}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500">Date of Birth</p>
          <p className="text-sm font-medium text-gray-800">{dob}</p>
        </div>
      </div>

      <button
        onClick={handleLogout}
        className="w-full py-3 bg-red-500 text-white font-semibold rounded-full"
      >
        Log out
      </button>

      {/* Modal */}
      <ProfilePicModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onSelect={handlePicChange}
      />
    </div>
  );
};

export default Profile;
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

  const [profilePic, setProfilePic] = useState(
    "/assets/profile-placeholder.jpg"
  );
  const [name, setName] = useState("Loading...");
  const [email, setEmail] = useState("Loading...");
  const [dob, setDob] = useState("Loading...");
  const [showModal, setShowModal] = useState(false);

  // Debug: Log context values
  console.log("🔍 Profile Context:", {
    contextName: context?.name,
    contextEmail: context?.email,
    contextDob: context?.dob,
    contextProfilePic: context?.profilePic,
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
          const userName =
            data.name && data.name.trim() !== "" ? data.name : "Not set";
          const userEmail =
            data.email && data.email.trim() !== ""
              ? data.email
              : user.email || "Not set";

          // Handle both dateOfBirth and dob fields with proper date formatting
          const dobFromFirestore = data.dob || data.dateOfBirth;
          const formattedDob = dobFromFirestore
            ? new Date(dobFromFirestore).toLocaleDateString()
            : "Not set";

          const userProfilePic =
            data.profilePic || "/assets/profile-placeholder.jpg";

          setName(userName);
          setEmail(userEmail);
          setDob(formattedDob);
          setProfilePic(userProfilePic);

          console.log("✅ Profile state updated:", {
            name: userName,
            email: userEmail,
            dob: formattedDob,
            profilePic: userProfilePic,
          });

          // Updated: Sync to context - use actual values or null for empty strings
          context?.setName(
            data.name && data.name.trim() !== "" ? data.name : null
          );
          context?.setEmail(
            data.email && data.email.trim() !== ""
              ? data.email
              : user.email || null
          );
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
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50">
      {/* Enhanced Header */}
      <div className="bg-gradient-to-r from-purple-400 to-pink-400 rounded-b-3xl shadow-lg">
        <div className="px-6 pt-8 pb-6 mb-4">
          <div className="flex items-center gap-3 mb-4">
            <button
              onClick={() => navigate(-1)}
              className="w-10 h-10 mt-6 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center"
            >
              <svg
                className="w-5 h-5 text-white"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </button>
            <div>
              <h1 className="text-2xl mt-6 font-bold text-white">My Profile</h1>
              <p className="text-white/80 text-sm">
                Manage your account and privacy
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-6 py-6 -mt-4 space-y-6">
        {/* Profile Picture Section */}
        <div className="bg-white rounded-3xl shadow-lg p-6">
          <div className="flex flex-col items-center gap-4">
            <div className="relative">
              <img
                src={profilePic}
                alt="Profile"
                className="w-24 h-24 rounded-full object-cover border-4 border-purple-200 shadow-lg"
              />
              <div
                className="absolute -bottom-2 -right-2 w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center cursor-pointer hover:bg-purple-600 transition-colors"
                onClick={() => setShowModal(true)}
              >
                <svg
                  className="w-4 h-4 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                  />
                </svg>
              </div>
            </div>
            <button
              onClick={() => setShowModal(true)}
              className="text-sm text-purple-600 font-medium hover:text-purple-800 transition-colors"
            >
              Change Photo
            </button>
          </div>
        </div>

        {/* Profile Information */}
        <div className="bg-white rounded-3xl shadow-lg p-6">
          <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            <span className="text-blue-500">👤</span>
            Personal Information
          </h2>

          <div className="space-y-4">
            <div className="p-4 bg-blue-50 rounded-2xl">
              <p className="text-xs text-blue-600 font-medium mb-1">Name</p>
              <p className="text-sm font-semibold text-blue-800">{name}</p>
            </div>
            <div className="p-4 bg-green-50 rounded-2xl">
              <p className="text-xs text-green-600 font-medium mb-1">Email</p>
              <p className="text-sm font-semibold text-green-800">{email}</p>
            </div>
            <div className="p-4 bg-purple-50 rounded-2xl">
              <p className="text-xs text-purple-600 font-medium mb-1">
                Date of Birth
              </p>
              <p className="text-sm font-semibold text-purple-800">{dob}</p>
            </div>
          </div>
        </div>

        {/* ✅ NEW: Privacy & Legal Section */}
        <div className="bg-white rounded-3xl shadow-lg p-6">
          <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            <span className="text-purple-500">🛡️</span>
            Privacy & Legal
          </h2>

          <div className="space-y-3">
            <button
              onClick={() => navigate("/privacy-policy")}
              className="w-full flex items-center justify-between p-4 bg-purple-50 hover:bg-purple-100 rounded-2xl transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-200 rounded-xl flex items-center justify-center">
                  <span className="text-purple-600">📜</span>
                </div>
                <div className="text-left">
                  <p className="font-semibold text-purple-800">
                    Privacy Policy
                  </p>
                  <p className="text-sm text-purple-600">
                    How we protect your data
                  </p>
                </div>
              </div>
              <svg
                className="w-5 h-5 text-purple-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </button>

            <button
              onClick={() => navigate("/privacy-settings")}
              className="w-full flex items-center justify-between p-4 bg-blue-50 hover:bg-blue-100 rounded-2xl transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-200 rounded-xl flex items-center justify-center">
                  <span className="text-blue-600">⚙️</span>
                </div>
                <div className="text-left">
                  <p className="font-semibold text-blue-800">
                    Privacy Settings
                  </p>
                  <p className="text-sm text-blue-600">
                    Manage your data preferences
                  </p>
                </div>
              </div>
              <svg
                className="w-5 h-5 text-blue-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </button>

            <div className="p-4 bg-gray-50 rounded-2xl">
              <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
                <span>🔐</span>
                <span>Your data is encrypted and secure</span>
              </div>
              <p className="text-xs text-gray-500 text-center mt-1">
                GDPR & CCPA Compliant
              </p>
            </div>
          </div>
        </div>

        {/* About the Developer */}
        <div className="bg-white rounded-3xl shadow-lg p-6">
          <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            <span className="text-orange-500">👨‍💻</span>
            About the Developer
          </h2>

          <div className="space-y-4">
          

            {/* Developer Info */}
            <div className="p-4 bg-gradient-to-r from-orange-50 to-yellow-50 rounded-2xl">
              <h3 className="font-semibold text-orange-800 mb-2">
                Hey!
              </h3>
              <p className="text-sm text-gray-700 leading-relaxed mb-3">
                I’m Hwei Hsin, the developer behind Luna. This app was
                created as part of my Final Year Project at Sunway University,
                with the goal of helping people track their cycles, learn about
                their bodies, and feel supported every month. 🌙✨
              </p>
              <div className="flex items-center gap-2 text-sm text-orange-600">
                
              </div>
            </div>

            {/* Navigation Buttons */}
            <div className="space-y-2">
              <button
                onClick={() => navigate("/about-me")}
                className="w-full flex items-center justify-center gap-2 p-4 bg-orange-50 hover:bg-orange-100 rounded-2xl transition-colors border border-orange-200"
              >
                <span className="text-orange-500">📖</span>
                <span className="font-semibold text-orange-700">
                  View Full About Page
                </span>
              </button>

             
            </div>
          </div>
        </div>

        {/* Account Actions */}
        <div className="bg-white rounded-3xl shadow-lg p-6">
          <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            <span className="text-red-500">🚪</span>
            Account Actions
          </h2>

          <button
            onClick={handleLogout}
            className="w-full py-4 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-2xl transition-colors"
          >
            Log out
          </button>
        </div>
      </div>

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

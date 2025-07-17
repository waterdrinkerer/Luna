import { useEffect, useState } from "react";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { useNavigate, useLocation } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase";
import type { ReactElement } from "react";

const onboardingRoutes = [
  "/date-of-birth",
  "/last-period",
  "/cycle-length",
  "/profile-pic",
];

const publicRoutes = [
  "/",
  "/welcome", // Add this if it's missing
  "/login",
  "/signup",
  ...onboardingRoutes,
];

const AuthWrapper = ({ children }: { children: ReactElement }) => {
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const auth = getAuth();

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      const path = location.pathname;

      if (user) {
        try {
          const userRef = doc(db, "users", user.uid);
          const userSnap = await getDoc(userRef);
          const userData = userSnap.exists() ? userSnap.data() : null;
          const hasCompletedOnboarding = userData?.hasCompletedOnboarding === true;

          if (!hasCompletedOnboarding) {
            // User hasn't completed onboarding
            if (!onboardingRoutes.includes(path)) {
              navigate("/date-of-birth", { replace: true });
            }
          } else {
            // User has completed onboarding
            if (publicRoutes.includes(path)) {
              navigate("/home", { replace: true });
            }
          }
        } catch (error) {
          console.error("Error checking user onboarding status:", error);
          // If there's an error, assume they need to complete onboarding
          if (!onboardingRoutes.includes(path)) {
            navigate("/date-of-birth", { replace: true });
          }
        }
      } else {
        // User is not logged in
        if (!publicRoutes.includes(path)) {
          navigate("/welcome", { replace: true });
        }
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, [navigate, location.pathname]);

  if (loading) return <div className="p-4 text-center">Loading...</div>;

  return children;
};

export default AuthWrapper;
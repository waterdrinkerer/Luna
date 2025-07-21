import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebase";

const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleLogin = async () => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate("/home"); // ✅ Redirect after successful login
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Login failed");
      }
    }
  };

  return (
    <div className="min-h-dvh bg-[#E5DBF7] relative overflow-hidden">
      <motion.h1
        initial={{ y: 0 }}
        animate={{ y: -40 }}
        transition={{ duration: 0.6 }}
        className="text-5xl font-bold text-white text-center pt-16"
      >
        Luna.
      </motion.h1>

      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="absolute bottom-0 w-full bg-white rounded-t-3xl p-6"
      >
        <h2 className="text-xl font-bold text-center mb-2">WELCOME BACK!</h2>
        
        {/* ✅ Added signup navigation */}
        <p className="text-sm text-center text-gray-500 mb-4">
          Don't have an account?{' '}
          <span
            className="text-purple-600 font-medium cursor-pointer hover:text-purple-700 transition-colors"
            onClick={() => navigate('/signup')}
          >
            Sign up here
          </span>
        </p>

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full p-3 mb-4 rounded-full bg-gray-100 focus:outline-none focus:ring-2 focus:ring-purple-300"
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full p-3 mb-4 rounded-full bg-gray-100 focus:outline-none focus:ring-2 focus:ring-purple-300"
        />

        <button
          onClick={handleLogin}
          className="w-full bg-purple-500 text-white py-3 rounded-full font-semibold mb-3 hover:bg-purple-600 transition-colors"
        >
          Log in
        </button>

        {error && (
          <p className="text-red-500 text-xs text-center mb-2">{error}</p>
        )}

        <p className="text-xs text-center text-gray-500">
          <span className="cursor-pointer hover:text-gray-700 transition-colors">
            Forgot your password?
          </span>
        </p>
      </motion.div>
    </div>
  );
};

export default Login;
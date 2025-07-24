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
      navigate("/home");
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Login failed");
      }
    }
  };

  return (
    <div className="min-h-dvh bg-[#E5DBF7] flex items-center justify-center px-6">
      <div className="w-full max-w-md">
        {/* Header */}
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-8"
        >
          <h1 className="text-5xl font-bold text-white mb-4">Luna.</h1>
        </motion.div>

        {/* Form */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="bg-white rounded-3xl p-6 shadow-lg"
        >
          <h2 className="text-xl font-bold text-center mb-2">WELCOME BACK!</h2>
          
          <p className="text-sm text-center text-gray-500 mb-6">
            Don't have an account?{' '}
            <span
              className="text-purple-600 font-medium cursor-pointer hover:text-purple-700 transition-colors"
              onClick={() => navigate('/signup')}
            >
              Sign up here
            </span>
          </p>

          <div className="space-y-4">
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-3 rounded-full bg-gray-100 focus:outline-none focus:ring-2 focus:ring-purple-300"
            />

            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-3 rounded-full bg-gray-100 focus:outline-none focus:ring-2 focus:ring-purple-300"
            />
          </div>

          <button
            onClick={handleLogin}
            className="w-full bg-purple-500 text-white py-3 rounded-full font-semibold mt-6 hover:bg-purple-600 transition-colors"
          >
            Log in
          </button>

          {error && (
            <p className="text-red-500 text-xs text-center mt-3">{error}</p>
          )}

          <p className="text-xs text-center text-gray-500 mt-4">
            <span className="cursor-pointer hover:text-gray-700 transition-colors">
              Forgot your password?
            </span>
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default Login;

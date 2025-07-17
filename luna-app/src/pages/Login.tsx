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
        <h2 className="text-xl font-bold text-center mb-4">WELCOME BACK!</h2>

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full p-3 mb-4 rounded-full bg-gray-100"
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full p-3 mb-4 rounded-full bg-gray-100"
        />

        <button
          onClick={handleLogin}
          className="w-full bg-purple-500 text-white py-3 rounded-full font-semibold mb-3"
        >
          Log in
        </button>

        {error && (
          <p className="text-red-500 text-xs text-center mb-2">{error}</p>
        )}

        <p className="text-xs text-center text-gray-500">
          Forgot your password?
        </p>
      </motion.div>
    </div>
  );
};

export default Login;

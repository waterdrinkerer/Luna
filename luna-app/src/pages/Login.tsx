import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

const Login = () => {
  const navigate = useNavigate();

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
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="absolute bottom-0 w-full bg-white rounded-t-3xl p-6"
      >
        <h2 className="text-xl font-bold text-center mb-4">WELCOME BACK!</h2>
        <input
          type="email"
          placeholder="Email"
          className="w-full p-3 mb-4 rounded-full bg-gray-100"
        />
        <input
          type="password"
          placeholder="Password"
          className="w-full p-3 mb-4 rounded-full bg-gray-100"
        />
        <button
          onClick={() => navigate('/home')}
          className="w-full bg-purple-500 text-white py-3 rounded-full font-semibold mb-3"
        >
          Log in
        </button>
        <p className="text-xs text-center text-gray-500">Forgot your password?</p>
      </motion.div>
    </div>
  );
};

export default Login;

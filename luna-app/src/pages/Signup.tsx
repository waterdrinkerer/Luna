import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

const Signup = () => {
  const navigate = useNavigate();

  const handleSignUp = () => {
    // Validate inputs (optional for now)
    navigate('/date-of-birth');
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
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="absolute bottom-0 w-full bg-white rounded-t-3xl p-6"
      >
        <h2 className="text-xl font-bold text-center mb-2">CREATE NEW ACCOUNT</h2>
        <p className="text-sm text-center text-gray-500 mb-4">
          Already Registered?{' '}
          <span
            className="text-purple-600 font-medium cursor-pointer"
            onClick={() => navigate('/login')}
          >
            Login here
          </span>
        </p>

        <input
          type="text"
          placeholder="Name"
          className="w-full p-3 mb-3 rounded-full bg-gray-100"
        />
        <input
          type="password"
          placeholder="Password"
          className="w-full p-3 mb-3 rounded-full bg-gray-100"
        />
        <input
          type="password"
          placeholder="Confirm Password"
          className="w-full p-3 mb-3 rounded-full bg-gray-100"
        />
        <input
          type="email"
          placeholder="Email"
          className="w-full p-3 mb-4 rounded-full bg-gray-100"
        />

        <p className="text-xs text-center text-gray-500 mb-4">
          By continuing, you agree with our Terms & Conditions and Privacy Policy
        </p>

        <button
          className="w-full bg-purple-500 text-white py-3 rounded-full font-semibold"
          onClick={handleSignUp}
        >
          Sign up
        </button>
      </motion.div>
    </div>
  );
};

export default Signup;

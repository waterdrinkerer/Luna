import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

const Welcome = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-dvh bg-[#E5DBF7] flex items-center justify-center px-6">
      <div className="w-full max-w-sm text-center">
        <motion.h1 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.8 }}
          className="text-6xl font-bold text-white mb-4"
        >
          Luna.
        </motion.h1>
        
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="text-lg text-white/90 mb-12 leading-relaxed"
        >
          Your period, your peace.<br />
          Luna's got you.
        </motion.p>
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="space-y-4"
        >
          <button
            onClick={() => navigate('/signup')}
            className="w-full bg-white text-purple-800 font-semibold py-3 rounded-full shadow-lg hover:shadow-xl transition-all duration-300"
          >
            Sign up
          </button>
          
          <button
            onClick={() => navigate('/login')}
            className="w-full bg-purple-400 text-white font-medium py-3 rounded-full shadow-lg hover:bg-purple-500 transition-all duration-300"
          >
            Log in
          </button>
        </motion.div>
      </div>
    </div>
  );
};

export default Welcome;
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { getAuth, createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';

const Signup = () => {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    firebase: '',
  });

  const handleSignUp = async () => {
    let valid = true;
    const newErrors = {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
      firebase: '',
    };

    if (!name) {
      newErrors.name = 'Name is required';
      valid = false;
    }
    if (!email) {
      newErrors.email = 'Email is required';
      valid = false;
    }
    if (!password) {
      newErrors.password = 'Password is required';
      valid = false;
    }
    if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
      valid = false;
    }

    setErrors(newErrors);
    if (!valid) return;

    try {
      const auth = getAuth();
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      await updateProfile(user, { displayName: name });

      await setDoc(doc(db, "users", user.uid), {
        name,
        email,
        createdAt: new Date(),
        profilePic: null,
      });

      navigate('/privacy-consent');
    } catch (error: unknown) {
      if (error instanceof Error) {
        setErrors((prev) => ({ ...prev, firebase: error.message }));
      } else {
        setErrors((prev) => ({ ...prev, firebase: 'An unexpected error occurred.' }));
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
          <h2 className="text-xl font-bold text-center mb-2">CREATE NEW ACCOUNT</h2>
          <p className="text-sm text-center text-gray-500 mb-6">
            Already have an account?{' '}
            <span
              className="text-purple-600 font-medium cursor-pointer hover:text-purple-700 transition-colors"
              onClick={() => navigate('/login')}
            >
              Log in here
            </span>
          </p>

          <div className="space-y-4">
            <div>
              <input
                type="text"
                placeholder="Name"
                className="w-full p-3 rounded-full bg-gray-100 focus:outline-none focus:ring-2 focus:ring-purple-300"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
              {errors.name && <p className="text-red-500 text-xs mt-1 ml-4">{errors.name}</p>}
            </div>

            <div>
              <input
                type="email"
                placeholder="Email"
                className="w-full p-3 rounded-full bg-gray-100 focus:outline-none focus:ring-2 focus:ring-purple-300"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              {errors.email && <p className="text-red-500 text-xs mt-1 ml-4">{errors.email}</p>}
            </div>

            <div>
              <input
                type="password"
                placeholder="Password"
                className="w-full p-3 rounded-full bg-gray-100 focus:outline-none focus:ring-2 focus:ring-purple-300"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              {errors.password && <p className="text-red-500 text-xs mt-1 ml-4">{errors.password}</p>}
            </div>

            <div>
              <input
                type="password"
                placeholder="Confirm Password"
                className="w-full p-3 rounded-full bg-gray-100 focus:outline-none focus:ring-2 focus:ring-purple-300"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
              {errors.confirmPassword && <p className="text-red-500 text-xs mt-1 ml-4">{errors.confirmPassword}</p>}
            </div>
          </div>

          <p className="text-xs text-center text-gray-500 my-4">
            By continuing, you agree with our Terms & Conditions and Privacy Policy
          </p>

          <button
            className="w-full bg-purple-500 text-white py-3 rounded-full font-semibold hover:bg-purple-600 transition-colors"
            onClick={handleSignUp}
          >
            Sign up
          </button>

          {errors.firebase && (
            <p className="text-red-500 text-xs text-center mt-3">{errors.firebase}</p>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default Signup;
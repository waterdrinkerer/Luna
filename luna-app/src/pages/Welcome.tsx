import { useNavigate } from 'react-router-dom';

const Welcome = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-dvh bg-[#E5DBF7] flex items-center justify-center overflow-hidden">
      <div className="w-full max-w-sm px-6 py-10 flex flex-col items-center">
        <h1 className="text-5xl font-bold text-purple-900 mb-4">Luna.</h1>
        <p className="text-sm text-purple-800 mb-12 text-center">
          Your period, your peace. Luna's got you.
        </p>
        <button
          onClick={() => navigate('/signup')}
          className="w-full bg-white text-purple-800 font-semibold py-3 rounded-full mb-4 shadow-md transition hover:brightness-95"
        >
          Sign up
        </button>
        <button
          onClick={() => navigate('/login')}
          className="w-full bg-purple-400 text-white font-medium py-3 rounded-full shadow-md transition hover:brightness-110"
        >
          Log in
        </button>
      </div>
    </div>
  );
};

export default Welcome;

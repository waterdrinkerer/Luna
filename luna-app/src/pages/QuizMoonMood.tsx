import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { doc, setDoc, collection } from "firebase/firestore";
import { db, auth } from "../firebase";

interface MoodQuestion {
  id: string;
  question: string;
  options: { value: string; emoji: string; label: string }[];
}

const MOOD_QUESTIONS: MoodQuestion[] = [
  {
    id: "energy",
    question: "How's your energy level today?",
    options: [
      { value: "very-low", emoji: "😴", label: "Exhausted" },
      { value: "low", emoji: "😵‍💫", label: "Tired" },
      { value: "medium", emoji: "😐", label: "Neutral" },
      { value: "high", emoji: "😊", label: "Energetic" },
      { value: "very-high", emoji: "🚀", label: "Super charged" }
    ]
  },
  {
    id: "mood",
    question: "What's your overall mood?",
    options: [
      { value: "anxious", emoji: "😰", label: "Anxious" },
      { value: "sad", emoji: "😢", label: "Down" },
      { value: "neutral", emoji: "😐", label: "Okay" },
      { value: "happy", emoji: "😊", label: "Happy" },
      { value: "euphoric", emoji: "🥰", label: "Amazing" }
    ]
  },
  {
    id: "intuition",
    question: "How connected do you feel to your intuition?",
    options: [
      { value: "disconnected", emoji: "🌑", label: "Totally lost" },
      { value: "unclear", emoji: "🌘", label: "Foggy" },
      { value: "neutral", emoji: "🌗", label: "Some clarity" },
      { value: "connected", emoji: "🌖", label: "Pretty clear" },
      { value: "very-connected", emoji: "🌕", label: "Crystal clear" }
    ]
  },
  {
    id: "social",
    question: "How social are you feeling?",
    options: [
      { value: "hermit", emoji: "🏠", label: "Total hermit" },
      { value: "introvert", emoji: "📚", label: "Keep to myself" },
      { value: "neutral", emoji: "🤷‍♀️", label: "Whatever" },
      { value: "social", emoji: "💬", label: "Want to chat" },
      { value: "party", emoji: "🎉", label: "Party mode" }
    ]
  }
];

const QuizMoonMood = () => {
  const navigate = useNavigate();
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [showResults, setShowResults] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleAnswer = (questionId: string, value: string) => {
    const newAnswers = { ...answers, [questionId]: value };
    setAnswers(newAnswers);

    // Auto-advance to next question after selection
    setTimeout(() => {
      if (currentQuestion < MOOD_QUESTIONS.length - 1) {
        setCurrentQuestion(currentQuestion + 1);
      } else {
        // Quiz complete, show results
        processResults(newAnswers);
      }
    }, 500);
  };

  const processResults = async (finalAnswers: Record<string, string>) => {
    setLoading(true);
    
    try {
      // Calculate moon phase alignment score
      const scores = {
        energy: getScore(finalAnswers.energy),
        mood: getScore(finalAnswers.mood),
        intuition: getScore(finalAnswers.intuition),
        social: getScore(finalAnswers.social)
      };

      const averageScore = Object.values(scores).reduce((a, b) => a + b, 0) / 4;
      const moonPhase = getMoonPhase(averageScore);
      const insights = getMoodInsights(finalAnswers, moonPhase);

      // Save to Firebase
      const user = auth.currentUser;
      if (user) {
        const quizRef = doc(collection(db, "users", user.uid, "quizResults"));
        await setDoc(quizRef, {
          type: "moon-mood",
          date: new Date().toISOString(),
          answers: finalAnswers,
          scores,
          averageScore,
          moonPhase,
          insights
        });
      }

      setShowResults(true);
    } catch (error) {
      console.error("Error saving quiz results:", error);
      setShowResults(true); // Show results anyway
    } finally {
      setLoading(false);
    }
  };

  const getScore = (value: string): number => {
    const scoreMap: Record<string, number> = {
      'very-low': 1, 'disconnected': 1, 'anxious': 1, 'hermit': 1,
      'low': 2, 'unclear': 2, 'sad': 2, 'introvert': 2,
      'medium': 3, 'neutral': 3, 'okay': 3, 'whatever': 3,
      'high': 4, 'connected': 4, 'happy': 4, 'social': 4,
      'very-high': 5, 'very-connected': 5, 'euphoric': 5, 'party': 5
    };
    return scoreMap[value] || 3;
  };

  const getMoonPhase = (score: number): { phase: string; emoji: string; description: string } => {
    if (score <= 1.5) return { phase: "New Moon", emoji: "🌑", description: "Time for rest and reflection" };
    if (score <= 2.5) return { phase: "Waxing Crescent", emoji: "🌒", description: "Setting intentions and gentle growth" };
    if (score <= 3.5) return { phase: "First Quarter", emoji: "🌓", description: "Taking action and making decisions" };
    if (score <= 4.5) return { phase: "Waxing Gibbous", emoji: "🌔", description: "Refinement and persistence" };
    return { phase: "Full Moon", emoji: "🌕", description: "Peak energy and manifestation" };
  };

  const getMoodInsights = (
    answers: Record<string, string>,
    moonPhase: { phase: string; emoji: string; description: string }
  ): string[] => {
    const insights: string[] = [];
    
    if (answers.energy === 'very-low' && answers.mood === 'sad') {
      insights.push("Consider gentle self-care activities today");
    }
    if (answers.intuition === 'very-connected' && answers.energy === 'high') {
      insights.push("Great day for creative projects and decision-making");
    }
    if (answers.social === 'hermit' && moonPhase.phase === 'New Moon') {
      insights.push("Your hermit mood aligns perfectly with new moon energy");
    }
    if (answers.mood === 'euphoric' && answers.energy === 'very-high') {
      insights.push("Channel this amazing energy into something meaningful");
    }
    
    // Default insight
    if (insights.length === 0) {
      insights.push(`Your ${moonPhase.phase.toLowerCase()} energy suggests ${moonPhase.description.toLowerCase()}`);
    }
    
    return insights;
  };

  const currentQ = MOOD_QUESTIONS[currentQuestion];
  const progress = ((currentQuestion + 1) / MOOD_QUESTIONS.length) * 100;
  const selectedAnswer = answers[currentQ?.id];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-purple-900 to-indigo-900 flex items-center justify-center">
        <div className="text-center text-white">
          <div className="text-4xl mb-4">🌙</div>
          <p className="text-lg font-medium">Calculating your moon alignment...</p>
        </div>
      </div>
    );
  }

  if (showResults) {
    const finalScores = {
      energy: getScore(answers.energy),
      mood: getScore(answers.mood),
      intuition: getScore(answers.intuition),
      social: getScore(answers.social)
    };
    const avgScore = Object.values(finalScores).reduce((a, b) => a + b, 0) / 4;
    const moonPhase = getMoonPhase(avgScore);
    const insights = getMoodInsights(answers, moonPhase);

    return (
      <div className="min-h-screen bg-gradient-to-b from-purple-900 to-indigo-900 text-white p-6">
        <div className="max-w-md mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="text-6xl mb-4">{moonPhase.emoji}</div>
            <h1 className="text-2xl font-bold mb-2">You're in {moonPhase.phase} Energy</h1>
            <p className="text-purple-200">{moonPhase.description}</p>
          </div>

          {/* Insights */}
          <div className="bg-white/10 rounded-xl p-4 mb-6">
            <h3 className="font-semibold mb-3">✨ Your Insights</h3>
            {insights.map((insight, index) => (
              <p key={index} className="text-sm text-purple-100 mb-2">• {insight}</p>
            ))}
          </div>

          {/* Score Breakdown */}
          <div className="bg-white/10 rounded-xl p-4 mb-6">
            <h3 className="font-semibold mb-3">📊 Your Moon Alignment</h3>
            <div className="space-y-2">
              {Object.entries(finalScores).map(([key, score]) => (
                <div key={key} className="flex justify-between items-center">
                  <span className="capitalize text-sm">{key}</span>
                  <div className="flex">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <span key={i} className={`text-lg ${i <= score ? '🌟' : '⭐'}`}>
                        {i <= score ? '🌟' : '⭐'}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-3">
            <button
              onClick={() => navigate("/home")}
              className="w-full bg-white text-purple-900 font-semibold py-3 rounded-full"
            >
              Back to Home
            </button>
            <button
              onClick={() => window.location.reload()}
              className="w-full border border-white/30 text-white font-semibold py-3 rounded-full"
            >
              Take Quiz Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-900 to-indigo-900 text-white p-6">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => navigate(-1)}
            className="text-white/70 hover:text-white"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-lg font-semibold">🌙 Moon Mood Check</h1>
          <div className="w-6"></div>
        </div>

        {/* Progress */}
        <div className="mb-8">
          <div className="flex justify-between text-sm mb-2">
            <span>Question {currentQuestion + 1} of {MOOD_QUESTIONS.length}</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <div className="w-full bg-white/20 rounded-full h-2">
            <div 
              className="bg-white rounded-full h-2 transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Question */}
        <div className="text-center mb-8">
          <h2 className="text-xl font-medium mb-6">{currentQ.question}</h2>
        </div>

        {/* Options */}
        <div className="space-y-3">
          {currentQ.options.map((option) => (
            <button
              key={option.value}
              onClick={() => handleAnswer(currentQ.id, option.value)}
              className={`w-full p-4 rounded-xl border-2 transition-all duration-200 ${
                selectedAnswer === option.value
                  ? 'border-white bg-white/20 scale-105'
                  : 'border-white/30 hover:border-white/50 hover:bg-white/10'
              }`}
            >
              <div className="flex items-center space-x-3">
                <span className="text-2xl">{option.emoji}</span>
                <span className="font-medium">{option.label}</span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default QuizMoonMood;
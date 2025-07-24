import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { doc, setDoc, collection } from "firebase/firestore";
import { db, auth } from "../firebase";

interface CrampQuestion {
  id: string;
  question: string;
  type: "scale" | "multiple" | "location";
  options?: { value: string; label: string; color?: string }[];
  max?: number;
}

const CRAMP_QUESTIONS: CrampQuestion[] = [
  {
    id: "intensity",
    question: "Rate your cramp intensity right now",
    type: "scale",
    max: 10,
  },
  {
    id: "location",
    question: "Where are you feeling the cramps?",
    type: "location",
    options: [
      { value: "lower-abdomen", label: "Lower abdomen", color: "#FF6B6B" },
      { value: "lower-back", label: "Lower back", color: "#4ECDC4" },
      { value: "upper-thighs", label: "Upper thighs", color: "#45B7D1" },
      { value: "all-over", label: "All over", color: "#96CEB4" },
      { value: "other", label: "Other area", color: "#FFEAA7" },
    ],
  },
  {
    id: "type",
    question: "How would you describe the pain?",
    type: "multiple",
    options: [
      { value: "sharp", label: "Sharp & stabbing", color: "#FF6B6B" },
      { value: "dull", label: "Dull ache", color: "#74B9FF" },
      { value: "throbbing", label: "Throbbing", color: "#E17055" },
      { value: "cramping", label: "Cramping waves", color: "#00B894" },
      { value: "burning", label: "Burning sensation", color: "#FDCB6E" },
    ],
  },
  {
    id: "impact",
    question: "How much is it affecting your day?",
    type: "multiple",
    options: [
      { value: "none", label: "Not at all - I'm fine", color: "#00B894" },
      { value: "mild", label: "A little uncomfortable", color: "#FDCB6E" },
      { value: "moderate", label: "Hard to focus", color: "#E17055" },
      {
        value: "severe",
        label: "Can't do normal activities",
        color: "#D63031",
      },
      { value: "extreme", label: "Completely incapacitated", color: "#2D3436" },
    ],
  },
  {
    id: "relief",
    question: "What usually helps your cramps?",
    type: "multiple",
    options: [
      { value: "heat", label: "Heat pad/hot water bottle", color: "#E17055" },
      { value: "medication", label: "Pain medication", color: "#74B9FF" },
      { value: "movement", label: "Gentle movement/yoga", color: "#00B894" },
      { value: "rest", label: "Rest and sleep", color: "#A29BFE" },
      { value: "massage", label: "Massage", color: "#FD79A8" },
      { value: "nothing", label: "Nothing really helps", color: "#636E72" },
    ],
  },
];

const QuizCrampOMeter = () => {
  const navigate = useNavigate();
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string | number>>({});
  const [showResults, setShowResults] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleScaleAnswer = (questionId: string, value: number) => {
    const newAnswers = { ...answers, [questionId]: value };
    setAnswers(newAnswers);

    setTimeout(() => {
      proceedToNext(newAnswers);
    }, 500);
  };

  const handleMultipleAnswer = (questionId: string, value: string) => {
    const newAnswers = { ...answers, [questionId]: value };
    setAnswers(newAnswers);

    setTimeout(() => {
      proceedToNext(newAnswers);
    }, 500);
  };

  const proceedToNext = (newAnswers: Record<string, string | number>) => {
    if (currentQuestion < CRAMP_QUESTIONS.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      processResults(newAnswers);
    }
  };

  const processResults = async (finalAnswers: Record<string, any>) => {
    setLoading(true);

    try {
      const analysis = analyzeCramps(finalAnswers);

      // Save to Firebase
      const user = auth.currentUser;
      if (user) {
        const quizRef = doc(collection(db, "users", user.uid, "crampLogs"));
        await setDoc(quizRef, {
          type: "cramp-meter",
          date: new Date().toISOString(),
          answers: finalAnswers,
          analysis,
          timestamp: new Date().toISOString(),
        });
      }

      setShowResults(true);
    } catch (error) {
      console.error("Error saving cramp results:", error);
      setShowResults(true);
    } finally {
      setLoading(false);
    }
  };

  const analyzeCramps = (answers: Record<string, any>) => {
    const intensity = answers.intensity || 0;
    const impact = answers.impact;

    let severity = "Mild";
    let color = "#00B894";
    let recommendations: string[] = [];

    // Determine severity
    if (intensity >= 8 || impact === "extreme") {
      severity = "Severe";
      color = "#D63031";
      recommendations.push("Consider consulting with a healthcare provider");
      recommendations.push("Track patterns to discuss with your doctor");
    } else if (intensity >= 6 || impact === "severe") {
      severity = "Moderate-High";
      color = "#E17055";
      recommendations.push("Try stronger pain relief methods");
      recommendations.push("Consider rest and heat therapy");
    } else if (intensity >= 4 || impact === "moderate") {
      severity = "Moderate";
      color = "#FDCB6E";
      recommendations.push("Use your usual relief methods");
      recommendations.push("Stay hydrated and consider gentle movement");
    } else {
      severity = "Mild";
      color = "#00B894";
      recommendations.push("You're managing well!");
      recommendations.push("Continue with your current routine");
    }

    // Add specific recommendations based on answers
    if (answers.relief === "heat") {
      recommendations.push("Keep using heat - it's working for you!");
    }
    if (answers.relief === "nothing") {
      recommendations.push(
        "Try different relief methods like heat, gentle yoga, or consultation"
      );
    }
    if (answers.location === "all-over") {
      recommendations.push(
        "Full-body cramps may benefit from magnesium supplements"
      );
    }

    return {
      severity,
      color,
      intensity,
      crampScore: Math.round((intensity / 10) * 100),
      recommendations,
      primaryLocation: answers.location,
      reliefMethod: answers.relief,
    };
  };

  const currentQ = CRAMP_QUESTIONS[currentQuestion];
  const progress = ((currentQuestion + 1) / CRAMP_QUESTIONS.length) * 100;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-red-900 to-pink-900 flex items-center justify-center">
        <div className="text-center text-white">
          <div className="text-4xl mb-4">🔥</div>
          <p className="text-lg font-medium">Analyzing your cramp pattern...</p>
        </div>
      </div>
    );
  }

  if (showResults) {
    const analysis = analyzeCramps(answers);

    return (
      <div className="min-h-screen bg-gradient-to-b from-red-900 to-pink-900 text-white p-6">
        <div className="max-w-md mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="text-6xl mb-4">🔥</div>
            <h1 className="text-2xl font-bold mb-2 ">Cramp-o-Meter Results</h1>
            <div
              className="text-xl font-semibold px-4 py-2 rounded-full mx-auto inline-block"
              style={{ backgroundColor: analysis.color }}
            >
              {analysis.severity} • {analysis.intensity}/10
            </div>
          </div>

          {/* Cramp Score Circle */}
          <div className="text-center mb-8">
            <div className="relative w-32 h-32 mx-auto">
              <svg
                className="w-32 h-32 transform -rotate-90"
                viewBox="0 0 120 120"
              >
                <circle
                  cx="60"
                  cy="60"
                  r="50"
                  stroke="rgba(255,255,255,0.2)"
                  strokeWidth="8"
                  fill="none"
                />
                <circle
                  cx="60"
                  cy="60"
                  r="50"
                  stroke={analysis.color}
                  strokeWidth="8"
                  fill="none"
                  strokeDasharray={`${2 * Math.PI * 50}`}
                  strokeDashoffset={`${
                    2 * Math.PI * 50 * (1 - analysis.crampScore / 100)
                  }`}
                  className="transition-all duration-1000"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-2xl font-bold">
                  {analysis.crampScore}%
                </span>
              </div>
            </div>
            <p className="text-sm text-red-200 mt-2">Cramp Intensity Score</p>
          </div>

          {/* Recommendations */}
          <div className="bg-white/10 rounded-xl p-4 mb-6">
            <h3 className="font-semibold mb-3">💡 Recommendations</h3>
            {analysis.recommendations.map((rec, index) => (
              <p key={index} className="text-sm text-red-100 mb-2">
                • {rec}
              </p>
            ))}
          </div>

          {/* Quick Stats */}
          <div className="bg-white/10 rounded-xl p-4 mb-6">
            <h3 className="font-semibold mb-3">📊 Your Cramp Profile</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Primary location:</span>
                <span className="capitalize">
                  {typeof answers.location === "string"
                    ? answers.location.replace("-", " ")
                    : answers.location}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Pain type:</span>
                <span className="capitalize">{answers.type}</span>
              </div>
              <div className="flex justify-between">
                <span>Usual relief:</span>
                <span className="capitalize">
                  {answers.relief
                    ? String(answers.relief).replace("-", " ")
                    : ""}
                </span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-3">
            <button
              onClick={() => navigate("/home")}
              className="w-full bg-white text-red-900 font-semibold py-3 rounded-full"
            >
              Back to Home
            </button>
            <button
              onClick={() => window.location.reload()}
              className="w-full border border-white/30 text-white font-semibold py-3 rounded-full"
            >
              Track Again Later
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-red-900 to-pink-900 text-white p-6">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => navigate(-1)}
            className="text-white/70 hover:text-white mt-6 "
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>
          <h1 className="text-lg font-semibold mt-6 ">🔥 Cramp-o-Meter</h1>
          <div className="w-6"></div>
        </div>

        {/* Progress */}
        <div className="mb-8">
          <div className="flex justify-between text-sm mb-2">
            <span>
              Question {currentQuestion + 1} of {CRAMP_QUESTIONS.length}
            </span>
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

        {/* Scale Input */}
        {currentQ.type === "scale" && (
          <div className="mb-8">
            <div className="flex justify-between text-sm mb-4">
              <span>No pain</span>
              <span>Worst possible</span>
            </div>
            <div className="grid grid-cols-5 gap-2 mb-4">
              {[...Array(10)].map((_, i) => {
                const value = i + 1;
                const isSelected = answers[currentQ.id] === value;
                return (
                  <button
                    key={value}
                    onClick={() => handleScaleAnswer(currentQ.id, value)}
                    className={`aspect-square rounded-xl border-2 font-bold text-lg transition-all duration-200 ${
                      isSelected
                        ? "border-white bg-white text-red-900 scale-110"
                        : "border-white/30 hover:border-white/60"
                    }`}
                  >
                    {value}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Multiple Choice */}
        {(currentQ.type === "multiple" || currentQ.type === "location") && (
          <div className="space-y-3">
            {currentQ.options?.map((option) => (
              <button
                key={option.value}
                onClick={() => handleMultipleAnswer(currentQ.id, option.value)}
                className={`w-full p-4 rounded-xl border-2 transition-all duration-200 ${
                  answers[currentQ.id] === option.value
                    ? "border-white bg-white/20 scale-105"
                    : "border-white/30 hover:border-white/50 hover:bg-white/10"
                }`}
                style={{
                  backgroundColor:
                    answers[currentQ.id] === option.value
                      ? option.color + "40"
                      : undefined,
                  borderColor:
                    answers[currentQ.id] === option.value
                      ? option.color
                      : undefined,
                }}
              >
                <span className="font-medium">{option.label}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default QuizCrampOMeter;

import { useEffect, useState } from "react";
import { fetchQuote } from "../utils/fetchQuote";

const backgrounds = [
  "/assets/quotebg1.jpg",
  "/assets/quotebg2.jpg",
  "/assets/quotebg3.jpg",
  "/assets/quotebg4.jpg",
  "/assets/quotebg5.jpg",
];

const QuoteCard = () => {
  const [quote, setQuote] = useState({ text: "", author: "" });
  const [bgImage, setBgImage] = useState("");

  useEffect(() => {
    const getQuote = async () => {
      const q = await fetchQuote();
      setQuote(q);
    };

    // Pick a random background image
    const randomBg =
      backgrounds[Math.floor(Math.random() * backgrounds.length)];
    setBgImage(randomBg);

    getQuote();
  }, []);

  return (
    <div className="relative w-full max-w-md mx-auto rounded-2xl overflow-hidden shadow-lg bg-gradient-to-br from-purple-100 to-pink-100 p-6 mt-6">
      <div
        className="absolute inset-0 opacity-50 bg-cover bg-center pointer-events-none"
        style={{ backgroundImage: `url(${bgImage})` }}
      />
      <div className="relative z-10 text-center">
        <p className="text-lg italic text-gray-800 leading-relaxed mb-3">
          “{quote.text}”
        </p>
        <p className="text-sm text-gray-600 font-medium">— {quote.author}</p>
      </div>
    </div>
  );
};

export default QuoteCard;

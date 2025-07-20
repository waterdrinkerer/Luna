import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getGeminiResponse } from "../lib/geminiChat"; // Using custom Gemini wrapper

interface Message {
  id: number;
  sender: "user" | "bot";
  text: string;
}

const Mooniebot = () => {
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMessages([
      {
        id: 0,
        sender: "bot",
        text: "Hey there! I am Moonie. How may I help you today?",
      },
    ]);
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      id: Date.now(),
      sender: "user",
      text: input,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsSending(true);

    const reply = await getGeminiResponse(input);

    const botResponse: Message = {
      id: Date.now() + 1,
      sender: "bot",
      text: reply,
    };

    setMessages((prev) => [...prev, botResponse]);
    setIsSending(false);
  };

  return (
    <div
      className="h-screen flex flex-col"
      style={{
        background: "linear-gradient(to bottom, #F6DFFF, #D9C6FF)",
        backgroundImage: "url(/assets/moonie_bg.png)",
        backgroundSize: "cover",
        backgroundRepeat: "no-repeat",
        backgroundPosition: "center",
      }}
    >
      {/* Back button + title */}
      <div className="flex items-center px-4 py-4">
        <button
          onClick={() => navigate("/home")}
          className="w-9 h-9 mr-2 rounded-full bg-white shadow-md flex items-center justify-center"
        >
          <svg
            className="w-5 h-5 text-purple-700"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="text-xl font-semibold text-purple-800">Ask Moonie</h1>
      </div>

      {/* Messages */}
      <div className="flex-1 px-4 pb-2 overflow-y-auto custom-scrollbar">
        <div className="flex flex-col gap-2">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`rounded-xl px-4 py-2 max-w-[70%] text-sm whitespace-pre-wrap break-words ${
                msg.sender === "user"
                  ? "bg-[#FDDDE6] self-end text-gray-800"
                  : "bg-white self-start text-gray-800"
              }`}
            >
              {msg.text}
            </div>
          ))}
          <div ref={chatEndRef} />
        </div>
      </div>

      {/* Input box */}
      <div className="p-3 bg-white rounded-t-xl shadow-md">
        <div className="flex items-end bg-[#F4F1FA] rounded-full px-4 py-2">
          <textarea
            rows={1}
            className="flex-1 bg-transparent resize-none outline-none text-sm max-h-32"
            placeholder="Send a message..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
          />
          <button
            onClick={handleSend}
            disabled={isSending}
            className={`ml-3 text-purple-600 text-lg font-bold ${
              isSending ? "opacity-50 cursor-not-allowed" : ""
            }`}
          >
            ➤
          </button>
        </div>
      </div>
    </div>
  );
};

export default Mooniebot;

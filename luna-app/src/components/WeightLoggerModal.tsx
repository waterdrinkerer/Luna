import { useState, useEffect, useRef } from "react";
import { db, auth } from "../firebase"; // Add auth import
import { doc, setDoc, collection } from "firebase/firestore";

interface WeightLoggerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void; // Changed: Remove weight parameter since parent will refetch
}

const generateWeights = (min: number, max: number) => {
  const result = [];
  for (let i = min; i <= max; i++) {
    result.push(i);
  }
  return result;
};

const WeightLoggerModal = ({
  isOpen,
  onClose,
  onSave,
}: WeightLoggerModalProps) => {
  const weights = generateWeights(30, 150);
  const [selectedWeight, setSelectedWeight] = useState(60);
  const scrollRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const startX = useRef(0);
  const scrollLeftStart = useRef(0);

  // FIXED: Save to user-specific subcollection
  const saveWeightLog = async (weight: number) => {
    const user = auth.currentUser;
    if (!user) {
      console.error("❌ No authenticated user found");
      return;
    }

    const today = new Date().toISOString().split("T")[0];
    
    // Save to users/{userId}/weightLogs/{date} instead of weightLogs/{date}
    const weightLogRef = doc(collection(db, "users", user.uid, "weightLogs"), today);
    
    console.log("💾 Saving weight log:", {
      userId: user.uid,
      weight: weight,
      date: today
    });

    await setDoc(weightLogRef, {
      weight: weight,
      date: today, // Add date field for consistency
      timestamp: new Date().toISOString(),
    });

    console.log("✅ Weight log saved successfully");
  };

  useEffect(() => {
    if (scrollRef.current && isOpen) {
      const index = weights.indexOf(selectedWeight);
      const scrollTo = index * 40 - scrollRef.current.offsetWidth / 2 + 20;
      scrollRef.current.scrollLeft = scrollTo;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]); // We only want this to run when modal opens, not when selectedWeight changes

  const handleScroll = () => {
    if (!scrollRef.current) return;
    const scrollX = scrollRef.current.scrollLeft;
    const index = Math.round(
      (scrollX + scrollRef.current.offsetWidth / 2 - 20) / 40
    );
    const clampedIndex = Math.max(0, Math.min(index, weights.length - 1));
    setSelectedWeight(weights[clampedIndex]);
  };

  const startDrag = (e: React.MouseEvent | React.TouchEvent) => {
    isDragging.current = true;
    startX.current =
      "touches" in e ? e.touches[0].pageX : (e as React.MouseEvent).pageX;
    scrollLeftStart.current = scrollRef.current!.scrollLeft;
  };

  const duringDrag = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDragging.current || !scrollRef.current) return;
    const x =
      "touches" in e ? e.touches[0].pageX : (e as React.MouseEvent).pageX;
    const walk = startX.current - x;
    scrollRef.current.scrollLeft = scrollLeftStart.current + walk;
  };

  const stopDrag = () => {
    isDragging.current = false;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-xl w-[90%] max-w-md text-center shadow-md">
        <h2 className="text-lg font-semibold text-gray-800 mb-6">
          Log Your Weight
        </h2>

        <div className="text-5xl font-bold text-black mb-1">
          {selectedWeight}
        </div>
        <p className="text-gray-400 mb-4 text-sm">kg</p>

        {/* Scrollable bar */}
        <div className="relative select-none">
          <div className="absolute left-1/2 transform -translate-x-1/2 w-[2px] h-16 bg-black z-10 top-0" />

          <div
            ref={scrollRef}
            className="flex overflow-x-auto no-scrollbar snap-x snap-mandatory px-4"
            onScroll={handleScroll}
            onMouseDown={startDrag}
            onMouseMove={duringDrag}
            onMouseUp={stopDrag}
            onMouseLeave={stopDrag}
            onTouchStart={startDrag}
            onTouchMove={duringDrag}
            onTouchEnd={stopDrag}
          >
            {weights.map((weight) => (
              <div
                key={weight}
                className="w-[40px] flex-shrink-0 flex flex-col items-center snap-center"
              >
                <div
                  className={`h-8 w-[2px] ${
                    weight === selectedWeight ? "bg-black" : "bg-gray-300"
                  }`}
                />
                <p
                  className={`text-sm mt-1 ${
                    weight === selectedWeight
                      ? "text-black font-semibold"
                      : "text-gray-400"
                  }`}
                >
                  {weight}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Buttons */}
        <div className="flex justify-end gap-4 mt-8">
          <button onClick={onClose} className="text-gray-600 text-sm px-4 py-2">
            Cancel
          </button>
          <button
            onClick={async () => {
              try {
                await saveWeightLog(selectedWeight);
                onSave(); // This will trigger fetchLatestWeight() in Home
                onClose();
              } catch (error) {
                console.error("❌ Error saving weight log:", error);
              }
            }}
            className="bg-[#7E5FFF] text-white px-6 py-2 rounded-full text-sm font-semibold"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
};

export default WeightLoggerModal;
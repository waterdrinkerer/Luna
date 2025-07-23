import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { collection, query, orderBy, getDocs } from "firebase/firestore";
import { db, auth } from "../firebase";
import {
  getMostRecentCycleData,
  calculateCurrentCyclePhase,
  type CycleData,
} from "../utils/cycleCalculator";
import { useMLPredictions } from "../hooks/useMLPredictions";
import BottomNav from "../components/BottomNav";

interface PeriodLog {
  id: string;
  startDate: Date;
  endDate: Date;
  duration: number;
  flow?: "light" | "medium" | "heavy";
  notes?: string;
  excludeFromML?: boolean;
  exclusionReason?: string;
  isIrregular?: boolean;
}

interface CalendarDay {
  date: Date;
  dayNumber: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  phase: string;
  cycleDay: number;
  isPeriod: boolean;
  isFertile: boolean;
  isOvulation: boolean;
  isLoggedPeriod: boolean;
  isExcludedPeriod: boolean;
  isPredictedPeriod: boolean;
  periodId?: string;
  daysSinceLastPeriod: number;
}

const CalendarPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [loading, setLoading] = useState(true);
  const [cycleData, setCycleData] = useState<CycleData>({});
  const [loggedPeriods, setLoggedPeriods] = useState<PeriodLog[]>([]);

  // Get ML predictions
  const { predictions: mlPredictions } = useMLPredictions();

  // Add state for tooltip
  const [tooltip, setTooltip] = useState<{
    text: string;
    x: number;
    y: number;
    visible: boolean;
  }>({
    text: "",
    x: 0,
    y: 0,
    visible: false,
  });

  // Show tooltip on click for non-visual phases
  const handleDateClick = (day: CalendarDay, event: React.MouseEvent) => {
    setSelectedDate(day.date);

    // Show tooltip for phases that aren't visually indicated
    if (
      !shouldShowVisualIndicator(day) &&
      day.phase !== "unknown" &&
      day.isCurrentMonth
    ) {
      const rect = (event.target as HTMLElement).getBoundingClientRect();
      const phaseLabels = {
        fertile: "Fertile Window",
        pms: "PMS Phase",
        follicular: "Follicular Phase",
        luteal: "Luteal Phase",
      };

      const label = phaseLabels[day.phase as keyof typeof phaseLabels];
      if (label) {
        setTooltip({
          text: label,
          x: rect.left + rect.width / 2,
          y: rect.top - 10,
          visible: true,
        });

        // Fade out after 2 seconds
        setTimeout(() => {
          setTooltip((prev) => ({ ...prev, visible: false }));
        }, 2000);
      }
    }
  };

  // Fetch all data on component mount
  useEffect(() => {
    const fetchData = async () => {
      const user = auth.currentUser;
      if (!user) {
        navigate("/welcome");
        return;
      }

      try {
        setLoading(true);

        // Get enhanced cycle data
        const freshCycleData = await getMostRecentCycleData(user.uid);
        setCycleData(freshCycleData);

        // Get all logged periods
        const periodLogsRef = collection(db, "users", user.uid, "periodLogs");
        const periodsQuery = query(periodLogsRef, orderBy("startDate", "desc"));
        const periodSnapshot = await getDocs(periodsQuery);

        const periods: PeriodLog[] = [];
        periodSnapshot.forEach((doc) => {
          const data = doc.data();
          if (data.startDate) {
            periods.push({
              id: doc.id,
              startDate: new Date(data.startDate),
              endDate: data.endDate
                ? new Date(data.endDate)
                : new Date(data.startDate),
              duration: data.duration || 5,
              flow: data.flow || "medium",
              notes: data.notes || "",
              excludeFromML: data.excludeFromML || false,
              exclusionReason: data.exclusionReason,
              isIrregular: data.isIrregular || false,
            });
          }
        });

        setLoggedPeriods(periods);
        console.log("📅 Calendar data loaded:", {
          cycleData: freshCycleData,
          periodsCount: periods.length,
          mlAvailable: !!mlPredictions,
        });
      } catch (error) {
        console.error("❌ Error fetching calendar data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [mlPredictions, navigate]); // ✅ Fixed: Added navigate to deps

  // Generate calendar days for the month
  const generateCalendarDays = (): CalendarDay[] => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();

    const firstDay = new Date(year, month, 1);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay()); // Start from Sunday

    const days: CalendarDay[] = [];
    const currentDate = new Date(startDate);

    // Generate 42 days (6 weeks)
    for (let i = 0; i < 42; i++) {
      const dateInfo = getDateInfo(new Date(currentDate));
      days.push({
        date: new Date(currentDate),
        dayNumber: currentDate.getDate(),
        isCurrentMonth: currentDate.getMonth() === month,
        isToday: currentDate.toDateString() === new Date().toDateString(),
        ...dateInfo,
      });
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return days;
  };

  // Enhanced date info calculation
  const getDateInfo = (date: Date) => {
    const defaultInfo = {
      phase: "unknown",
      cycleDay: 0,
      isPeriod: false,
      isFertile: false,
      isOvulation: false,
      isLoggedPeriod: false,
      isExcludedPeriod: false,
      isPredictedPeriod: false,
      daysSinceLastPeriod: 0,
    };

    // Check if date is within any logged period
    const loggedPeriod = loggedPeriods.find((period: PeriodLog) => {
      const startDate = new Date(period.startDate);
      const endDate = new Date(period.endDate);

      return date >= startDate && date <= endDate;
    });

    if (loggedPeriod) {
      return {
        ...defaultInfo,
        phase: "period",
        isPeriod: true,
        isLoggedPeriod: true,
        isExcludedPeriod: loggedPeriod.excludeFromML || false,
        periodId: loggedPeriod.id,
        cycleDay:
          Math.floor(
            (date.getTime() - loggedPeriod.startDate.getTime()) /
              (1000 * 60 * 60 * 24)
          ) + 1,
      };
    }

    // Use cycle calculations for predicted phases
    const lastPeriodStart = cycleData.lastPeriodStart;
    const cycleLength = cycleData.cycleLength || 28;

    if (!lastPeriodStart) {
      return defaultInfo;
    }

    const daysSinceLastPeriod = Math.floor(
      (date.getTime() - lastPeriodStart.getTime()) / (1000 * 60 * 60 * 24)
    );

    // Don't show predicted periods for past dates - only show actual logged periods
    if (daysSinceLastPeriod < 0) {
      return defaultInfo;
    }

    let cycleDay = daysSinceLastPeriod + 1;

    // Handle cycle wrapping for future dates only
    if (cycleDay > cycleLength) {
      cycleDay = ((cycleDay - 1) % cycleLength) + 1;
    }

    // Phase calculations - only for current cycle forward
    const ovulationDay = Math.max(14, cycleLength - 14);
    const fertileStart = ovulationDay - 2;
    const fertileEnd = ovulationDay + 1;
    const pmsStart = cycleLength - 5;

    // ✅ Fixed: Predict future periods for visual indicators
    const isPredictedPeriod =
      cycleDay >= 1 && cycleDay <= 5 && daysSinceLastPeriod >= cycleLength;
    const isFertile = cycleDay >= fertileStart && cycleDay <= fertileEnd;
    const isOvulation = cycleDay === ovulationDay;
    const isLuteal = cycleDay > fertileEnd && cycleDay < pmsStart;
    const isPMS = cycleDay >= pmsStart;

    let phase = "follicular";
    if (isPredictedPeriod) phase = "predicted_period";
    else if (isOvulation) phase = "ovulation";
    else if (isFertile) phase = "fertile";
    else if (isLuteal) phase = "luteal";
    else if (isPMS) phase = "pms";

    return {
      phase,
      cycleDay,
      isPeriod: isPredictedPeriod,
      isFertile,
      isOvulation,
      isLoggedPeriod: false,
      isExcludedPeriod: false,
      isPredictedPeriod,
      daysSinceLastPeriod,
    };
  };

  // Clean phase colors - NO background colors, just transparent
  const getPhaseColor = () => {
    return "transparent"; // No background colors at all
  };

  // ✅ Fixed: Now shows dots for logged periods, ovulation, AND predicted periods
  const shouldShowVisualIndicator = (day: CalendarDay) => {
    return (
      day.isLoggedPeriod ||
      day.isPredictedPeriod ||
      (day.phase === "ovulation" && day.isCurrentMonth)
    );
  };

  const calendarDays = generateCalendarDays();
  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  const navigateMonth = (direction: number) => {
    const newMonth = new Date(currentMonth);
    newMonth.setMonth(newMonth.getMonth() + direction);
    setCurrentMonth(newMonth);
  };

  // Get current phase using enhanced calculator
  const currentPhaseData = calculateCurrentCyclePhase(cycleData);

  // Hide tooltip when scrolling or clicking elsewhere
  useEffect(() => {
    const hideTooltip = () =>
      setTooltip((prev) => ({ ...prev, visible: false }));
    document.addEventListener("scroll", hideTooltip);
    document.addEventListener("click", hideTooltip);

    return () => {
      document.removeEventListener("scroll", hideTooltip);
      document.removeEventListener("click", hideTooltip);
    };
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 flex items-center justify-center">
        <div className="text-center bg-white/80 backdrop-blur-sm rounded-3xl p-8 shadow-xl">
          <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
          <h3 className="text-xl font-bold text-purple-600 mb-2">
            Loading Calendar
          </h3>
          <p className="text-gray-600 font-medium">
            Fetching your cycle data...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 relative">
      {/* Floating Tooltip */}
      {tooltip.visible && (
        <div
          className="fixed z-50 bg-gray-800 text-white px-3 py-2 rounded-lg text-sm font-medium pointer-events-none transition-opacity duration-300"
          style={{
            left: `${tooltip.x}px`,
            top: `${tooltip.y}px`,
            transform: "translateX(-50%)",
            opacity: tooltip.visible ? 1 : 0,
          }}
        >
          {tooltip.text}
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800"></div>
        </div>
      )}

      <div className="p-6 pb-24">
        {/* Enhanced Header */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-full bg-white shadow-md flex items-center justify-center hover:scale-105 transition-transform"
          >
            <svg
              className="w-5 h-5 text-gray-600"
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
          <div className="text-center">
            <h1 className="text-xl font-bold text-gray-800">Cycle Calendar</h1>
            <p className="text-xs text-gray-500">
              {loggedPeriods.length} periods logged •{" "}
              {mlPredictions ? "AI Powered" : "Basic Mode"}
            </p>
          </div>
          <button
            onClick={() =>
              navigate("/log-period", {
                state: { returnTo: location.pathname },
              })
            }
            className="px-4 py-2 bg-gradient-to-r from-pink-500 to-red-500 text-white text-sm font-medium rounded-full shadow-md hover:shadow-lg transition-all"
          >
            Log Period
          </button>
        </div>

        {/* Enhanced Current Status with ML Data */}
        <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl p-6 shadow-lg mb-6 text-white">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-white/80 text-sm font-medium">Today's Phase</p>
              <p className="text-2xl font-bold mb-1">
                {currentPhaseData.message}
              </p>
              <p className="text-white/90 text-sm">
                {currentPhaseData.subtext}
              </p>

              {/* ML Predictions */}
              {mlPredictions && (
                <div className="mt-3 pt-3 border-t border-white/20">
                  <p className="text-xs text-white/80 mb-1">🤖 AI Insights</p>
                  <p className="text-sm font-medium">
                    Next period in ~{mlPredictions.nextPeriod.daysUntil} days
                  </p>
                </div>
              )}
            </div>
            <div className="text-4xl ml-4">
              {currentPhaseData.phase === "period"
                ? "🩸"
                : currentPhaseData.phase === "ovulation"
                ? "✨"
                : "🌸"}
            </div>
          </div>
        </div>

        {/* Month Navigation */}
        <div className="bg-white rounded-2xl p-6 shadow-lg mb-6">
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={() => navigateMonth(-1)}
              className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center hover:bg-purple-200 transition-colors"
            >
              <svg
                className="w-5 h-5 text-purple-600"
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
            <h2 className="text-xl font-bold text-gray-800">
              {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
            </h2>
            <button
              onClick={() => navigateMonth(1)}
              className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center hover:bg-purple-200 transition-colors"
            >
              <svg
                className="w-5 h-5 text-purple-600"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </button>
          </div>

          {/* Week Headers */}
          <div className="grid grid-cols-7 mb-3">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
              <div
                key={day}
                className="text-center text-sm font-semibold text-gray-600 py-2"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Clean Calendar Grid */}
          <div className="grid grid-cols-7 gap-2">
            {calendarDays.map((day, index) => {
              const phaseColor = getPhaseColor();
              const textColor = day.isCurrentMonth
                ? day.isToday
                  ? "#00000"
                  : "#374151"
                : "#9CA3AF";

              return (
                <button
                  key={index}
                  onClick={(e) => handleDateClick(day, e)}
                  className={`aspect-square rounded-xl text-sm font-medium transition-all duration-200 hover:scale-105 relative ${
                    day.isToday ? "ring-2 ring-purple-500 ring-offset-2" : ""
                  } ${
                    selectedDate?.toDateString() === day.date.toDateString()
                      ? "ring-2 ring-blue-500 ring-offset-2"
                      : ""
                  }`}
                  style={{
                    backgroundColor: phaseColor,
                    color:
                      day.isToday && phaseColor !== "transparent"
                        ? "#FFFFFF"
                        : textColor,
                    border: day.isToday
                      ? "2px solid #8B5CF6"
                      : "1px solid transparent",
                  }}
                >
                  <div className="flex flex-col items-center justify-center h-full relative">
                    <span className="font-semibold">{day.dayNumber}</span>

                    {/* ✅ Enhanced: Show indicators for logged periods, predicted periods, and ovulation */}
                    {day.isCurrentMonth && shouldShowVisualIndicator(day) && (
                      <div className="absolute bottom-1">
                        <div
                          className="w-2 h-2 rounded-full"
                          style={{
                            backgroundColor: day.isLoggedPeriod
                              ? "#DC2626" // Red for logged periods
                              : day.isPredictedPeriod
                              ? "#F87171" // Light red for predicted periods
                              : day.phase === "ovulation"
                              ? "#059669"
                              : "#EF4444", // Green for ovulation
                          }}
                        />
                      </div>
                    )}

                    {/* Exclusion indicator */}
                    {day.isExcludedPeriod && (
                      <div className="absolute top-0 right-0 w-2 h-2 bg-orange-500 rounded-full border border-white"></div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Enhanced Selected Date Info */}
        {selectedDate && (
          <div className="bg-white rounded-2xl p-6 mb-6 shadow-lg">
            <h3 className="text-lg font-bold text-gray-800 mb-3">
              📅{" "}
              {selectedDate.toLocaleDateString("en-US", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </h3>

            {(() => {
              const dateInfo = getDateInfo(selectedDate);
              if (dateInfo.phase === "unknown") {
                return (
                  <div className="text-center py-4">
                    <p className="text-gray-500">
                      No cycle data available for this date
                    </p>
                    <button
                      onClick={() => navigate("/log-period")}
                      className="mt-2 text-purple-600 text-sm underline"
                    >
                      Log a period to see predictions
                    </button>
                  </div>
                );
              }

              return (
                <div className="space-y-3">
                  <div className="bg-gray-50 rounded-xl p-4">
                    <div className="flex items-center space-x-3 mb-2">
                      <div
                        className="w-6 h-6 rounded-full"
                        style={{
                          backgroundColor: dateInfo.isLoggedPeriod
                            ? "#DC2626"
                            : dateInfo.isPredictedPeriod
                            ? "#F87171"
                            : dateInfo.phase === "ovulation"
                            ? "#059669"
                            : "#9CA3AF",
                        }}
                      />
                      <div>
                        <h4 className="font-semibold capitalize text-gray-800">
                          {dateInfo.isLoggedPeriod
                            ? "Logged Period"
                            : dateInfo.isPredictedPeriod
                            ? "Predicted Period"
                            : `${dateInfo.phase} Phase`}
                        </h4>
                        <p className="text-sm text-gray-600">
                          {dateInfo.isLoggedPeriod || dateInfo.isPredictedPeriod
                            ? `Period Day ${dateInfo.cycleDay}`
                            : `Cycle Day ${dateInfo.cycleDay}`}
                        </p>
                      </div>
                    </div>

                    {dateInfo.isExcludedPeriod && (
                      <div className="bg-orange-100 border border-orange-200 rounded-lg p-3 mt-3">
                        <p className="text-sm text-orange-800 font-medium">
                          Excluded from AI Predictions
                        </p>
                        <p className="text-xs text-orange-700 mt-1">
                          This period was affected by medication or other
                          factors
                        </p>
                      </div>
                    )}

                    {dateInfo.isLoggedPeriod && 'periodId' in dateInfo && dateInfo.periodId && (
                      <button
                        onClick={() => navigate("/manage-periods")}
                        className="text-sm text-purple-600 underline mt-2"
                      >
                        Edit this period →
                      </button>
                    )}

                    {/* ✅ New: Show info for predicted periods */}
                    {dateInfo.isPredictedPeriod && (
                      <div className="bg-pink-100 border border-pink-200 rounded-lg p-3 mt-3">
                        <p className="text-sm text-pink-800 font-medium">
                          AI Predicted Period
                        </p>
                        <p className="text-xs text-pink-700 mt-1">
                          Based on your cycle pattern. Log actual periods to
                          improve accuracy.
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Phase-specific info */}
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    {(dateInfo.isPeriod || dateInfo.isPredictedPeriod) && (
                      <div className="bg-red-50 rounded-lg p-3">
                        <p className="font-medium text-red-800">
                          {dateInfo.isLoggedPeriod
                            ? "Period Day"
                            : "Predicted Period"}
                        </p>
                        <p className="text-red-600 text-xs">
                          {dateInfo.isLoggedPeriod
                            ? "Menstrual flow active"
                            : "Expected menstrual flow"}
                        </p>
                      </div>
                    )}
                    {dateInfo.isFertile && (
                      <div className="bg-blue-50 rounded-lg p-3">
                        <p className="font-medium text-blue-800">
                          Fertile Window
                        </p>
                        <p className="text-blue-600 text-xs">
                          High conception chance
                        </p>
                      </div>
                    )}
                    {dateInfo.isOvulation && (
                      <div className="bg-green-50 rounded-lg p-3">
                        <p className="font-medium text-green-800">
                          Ovulation Day
                        </p>
                        <p className="text-green-600 text-xs">Peak fertility</p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })()}
          </div>
        )}

        {/* ✅ Updated Legend */}
        <div className="bg-white rounded-2xl p-6 shadow-lg mb-6">
          <h3 className="text-lg font-bold text-gray-800 mb-4">Legend</h3>

          <div className="space-y-3">
            {/* Visual indicators */}
            <div className="flex items-center space-x-3 p-3 rounded-lg bg-red-50">
              <div className="w-4 h-4 bg-red-600 rounded-full"></div>
              <span className="font-medium text-red-800">Logged Period</span>
              <span className="text-sm text-red-600">
                Actual recorded periods
              </span>
            </div>

            <div className="flex items-center space-x-3 p-3 rounded-lg bg-red-50 opacity-80">
              <div className="w-4 h-4 bg-red-400 rounded-full"></div>
              <span className="font-medium text-red-700">Predicted Period</span>
              <span className="text-sm text-red-500">AI predicted periods</span>
            </div>

            <div className="flex items-center space-x-3 p-3 rounded-lg bg-green-50">
              <div className="w-4 h-4 bg-green-600 rounded-full"></div>
              <span className="font-medium text-green-800">Peak Ovulation</span>
              <span className="text-sm text-green-600">
                Highest fertility day
              </span>
            </div>

            <div className="flex items-center space-x-3 p-3 rounded-lg bg-orange-50">
              <div className="w-4 h-4 bg-orange-500 rounded-full"></div>
              <span className="font-medium text-orange-800">
                Excluded Period
              </span>
              <span className="text-sm text-orange-600">
                Not used for AI predictions
              </span>
            </div>

            {/* Click instruction */}
            <div className="border-t pt-3 mt-3">
              <p className="text-sm text-gray-600">
                💡 <strong>Tip:</strong> Click on any date to see phase
                information (fertile, PMS, follicular, luteal)
              </p>
            </div>
          </div>
        </div>
      </div>

      <BottomNav />
    </div>
  );
};

export default CalendarPage;

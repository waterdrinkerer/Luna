import { NavLink } from "react-router-dom";
import BottomNav from "../components/BottomNav";

const reports = [
  {
    title: "Last Cycle Report",
    description: "Cycle summary, period flow, ovulation, and trends",
    route: "/my-reports/last-cycle",
    icon: "📊",
    gradient: "from-purple-400 to-pink-400",
    bgColor: "bg-gradient-to-br from-purple-50 to-pink-50",
    accentColor: "text-purple-600",
    stats: "Latest insights",
  },
  {
    title: "Symptom Patterns",
    description: "See what symptoms show up most and when",
    route: "/my-reports/symptom-patterns",
    icon: "🎭",
    gradient: "from-blue-400 to-cyan-400",
    bgColor: "bg-gradient-to-br from-blue-50 to-cyan-50",
    accentColor: "text-blue-600",
    stats: "AI-powered analysis",
  },
  {
    title: "Cycle Regularity",
    description: "Evaluate how consistent your cycles have been",
    route: "/my-reports/cycle-regularity",
    icon: "⏰",
    gradient: "from-emerald-400 to-teal-400",
    bgColor: "bg-gradient-to-br from-emerald-50 to-teal-50",
    accentColor: "text-emerald-600",
    stats: "Health tracking",
  },
];

const MyReports = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 pb-20">
      {/* Enhanced Header */}
      <div className="px-5 pt-8 pb-6">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
            <span className="text-white text-lg font-bold">📈</span>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">My Reports</h1>
            <div className="flex items-center gap-2 mt-1">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <p className="text-sm text-gray-600">Updated recently</p>
            </div>
          </div>
        </div>

        <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-4 border border-white/50">
          <p className="text-sm text-gray-700 leading-relaxed">
            Discover insights about your menstrual health with personalized
            reports powered by your data.
          </p>
        </div>
      </div>

      {/* Enhanced Report Cards */}
      <div className="flex flex-col gap-5 px-5">
        {reports.map((report) => (
          <NavLink
            to={report.route}
            key={report.title}
            className="group transform transition-all duration-300 hover:scale-[1.02] hover:shadow-xl"
          >
            <div
              className={`${report.bgColor} rounded-2xl overflow-hidden shadow-lg border border-white/50 relative`}
            >
              {/* Gradient Overlay */}
              <div
                className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${report.gradient}`}
              ></div>

              {/* Content Container */}
              <div className="flex">
                {/* Left Content */}
                <div className="flex-1 p-5">
                  <div className="flex items-start gap-3 mb-3">
                    <div
                      className={`w-12 h-12 bg-gradient-to-r ${report.gradient} rounded-xl flex items-center justify-center shadow-md`}
                    >
                      <span className="text-white text-xl">{report.icon}</span>
                    </div>
                    <div className="flex-1">
                      <h2 className="font-bold text-lg text-gray-800 mb-1 group-hover:text-gray-900 transition-colors">
                        {report.title}
                      </h2>
                      <div
                        className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${report.accentColor} bg-white/70`}
                      >
                        {report.stats}
                      </div>
                    </div>
                  </div>

                  <p className="text-sm text-gray-600 leading-relaxed mb-4">
                    {report.description}
                  </p>

                  {/* Action Button */}
                  <div className="flex items-center justify-between">
                    <div
                      className={`flex items-center gap-2 text-sm font-medium ${report.accentColor}`}
                    >
                      <span>View Report</span>
                      <svg
                        className="w-4 h-4 transform group-hover:translate-x-1 transition-transform"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Right Image */}
              </div>
            </div>
          </NavLink>
        ))}
      </div>

     

      {/* Tips Section */}
      <div className="px-5 mt-5">
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-2xl p-4 border border-amber-200">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-gradient-to-r from-amber-400 to-orange-400 rounded-lg flex items-center justify-center flex-shrink-0">
              <span className="text-white text-sm">💡</span>
            </div>
            <div>
              <h4 className="font-medium text-amber-800 mb-1">Pro Tip</h4>
              <p className="text-sm text-amber-700">
                Log symptoms daily for more accurate AI predictions and
                personalized insights.
              </p>
            </div>
          </div>
        </div>
      </div>

      <BottomNav />
    </div>
  );
};

export default MyReports;

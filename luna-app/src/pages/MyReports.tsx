import { NavLink } from "react-router-dom";
import BottomNav from "../components/BottomNav";

const reports = [
  {
    title: "Last Cycle Report",
    description: "Cycle summary, period flow, ovulation, and trends",
    route: "/my-reports/last-cycle",
    image: "/assets/last-cycle-cover.png",
  },
  {
    title: "Symptom Patterns",
    description: "See what symptoms show up most and when",
    route: "/my-reports/symptom-patterns",
    image: "/assets/symptom-patterns.png",
  },
  {
    title: "Cycle Regularity",
    description: "Evaluate how consistent your cycles have been",
    route: "/my-reports/cycle-regularity",
    image: "/assets/cycle-regularity.png",
  },
];

const MyReports = () => {
  return (
    <div className="min-h-screen bg-[#EDEBFF] pb-20">
      <div className="px-5 pt-6 pb-2">
        <h1 className="text-2xl font-bold text-[#7E5FFF]">My Reports</h1>
        <p className="text-sm text-gray-600 mt-1">
          Tap on any report to view detailed insights about your cycle.
        </p>
      </div>

      <div className="flex flex-col gap-4 px-5 mt-4">
        {reports.map((report) => (
          <NavLink
            to={report.route}
            key={report.title}
            className="bg-white rounded-xl shadow-sm overflow-hidden flex flex-col"
          >
            <img
              src={report.image}
              alt={report.title}
               className="w-full max-h-56 object-contain bg-white"
            />
            <div className="p-4">
              <h2 className="font-semibold text-base text-black">{report.title}</h2>
              <p className="text-sm text-gray-600 mt-1">{report.description}</p>
            </div>
          </NavLink>
        ))}
      </div>

      <BottomNav />
    </div>
  );
};

export default MyReports;

import { useNavigate } from "react-router-dom";

const AboutMe = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-yellow-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-orange-400 to-yellow-400 rounded-b-3xl shadow-lg">
        <div className="px-6 pt-8 pb-6">
          <div className="flex items-center gap-3 mb-4">
            <button
              onClick={() => navigate(-1)}
              className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center"
            >
              <svg
                className="w-5 h-5 text-white"
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
            <div>
              <h1 className="text-2xl font-bold text-white">
                About the Developer
              </h1>
              <p className="text-white/80 text-sm">
                Final Year Project Information
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-6 py-6 -mt-4 space-y-6">
        {/* School/University Section */}
        <div className="bg-white rounded-3xl shadow-lg p-6">
          <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            <span className="text-blue-500">🏫</span>
            University Information
          </h2>

          {/* School Logos */}
          <div className="flex items-center justify-center gap-2 p-6 bg-gray-50 rounded-2xl mb-4">
            <img
              src="/assets/sunwaylogo.png"
              alt="University Logo"
              className="h-16 w-auto object-contain"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).style.display = "none";
                const next = (e.currentTarget as HTMLImageElement)
                  .nextElementSibling;
                if (next) {
                  (next as HTMLElement).style.display = "flex";
                }
              }}
            />

            <div className="w-px h-12 bg-gray-300"></div>

            <img
              src="/assets/lancasterlogo.png"
              alt="Faculty Logo"
              className="h-16 w-auto object-contain"
              onError={(e) => {
                e.currentTarget.style.display = "none";
                if (e.currentTarget.nextElementSibling) {
                  (
                    e.currentTarget.nextElementSibling as HTMLElement
                  ).style.display = "flex";
                }
              }}
            />
          </div>

          <div className="space-y-3">
            <div className="p-4 bg-blue-50 rounded-2xl">
              <p className="text-xs text-blue-600 font-medium mb-1">
                University
              </p>
              <p className="text-sm font-semibold text-blue-800">
                Sunway University
              </p>
            </div>
            <div className="p-4 bg-purple-50 rounded-2xl">
              <p className="text-xs text-purple-600 font-medium mb-1">
                Faculty/Department
              </p>
              <p className="text-sm font-semibold text-purple-800">
                School of Engineering and Technology (SET){" "}
              </p>
            </div>
            <div className="p-4 bg-green-50 rounded-2xl">
              <p className="text-xs text-green-600 font-medium mb-1">Course</p>
              <p className="text-sm font-semibold text-green-800">
                BSc (Hons) in Computer Science
              </p>
            </div>
          </div>
        </div>

        {/* Developer Information */}
        <div className="bg-white rounded-3xl shadow-lg p-6">
          <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            <span className="text-orange-500">👨‍💻</span>
            Developer Information
          </h2>

          <div className="space-y-4">
            <div className="flex items-center gap-4 p-4 bg-orange-50 rounded-2xl">
              <div className="w-16 h-16 bg-orange-200 rounded-full flex items-center justify-center">
                <span className="text-2xl">👤</span>
              </div>
              <div>
                <h3 className="font-semibold text-orange-800">
                  Yong Hwei Hsin
                </h3>

                <p className="text-xs text-orange-500">Student ID: 21056742</p>
              </div>
            </div>

            <div className="p-4 bg-yellow-50 rounded-2xl">
              <p className="text-xs text-yellow-600 font-medium mb-1">
                Supervisor
              </p>
              <p className="text-sm font-semibold text-yellow-800">
                Associate Professor Ir Dr Sami Salama Hussen Hajjaj{" "}
              </p>
            </div>
          </div>
        </div>

        {/* Project Information */}
        <div className="bg-white rounded-3xl shadow-lg p-6">
          <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            <span className="text-purple-500">🚀</span>
            Project Information
          </h2>

          <div className="space-y-4">
            <div className="p-4 bg-purple-50 rounded-2xl">
              <h3 className="font-semibold text-purple-800 mb-2">
                Project Title
              </h3>
              <p className="text-sm text-gray-700">
                Luna: An AI-Powered Period Tracking and Health Management App
              </p>
            </div>

            <div className="p-4 bg-indigo-50 rounded-2xl">
              <h3 className="font-semibold text-indigo-800 mb-2">
                Project Description
              </h3>
              <p className="text-sm text-gray-700 leading-relaxed">
                This application was developed as part of my Final Year Project
                to support menstrual health awareness and provide personalized
                insights into users’ cycles. Luna offers accurate cycle and
                ovulation predictions powered by machine learning, a
                conversational AI chatbot for health queries, and an intuitive,
                inclusive interface. It also provides educational resources to
                help users better understand reproductive health and improve
                their overall well-being.
              </p>
            </div>

            <div className="p-4 bg-teal-50 rounded-2xl">
              <h3 className="font-semibold text-teal-800 mb-2">
                Technologies Used
              </h3>
              <div className="flex flex-wrap gap-2 mt-2">
                <span className="px-3 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                  React.js + Vite
                </span>
                <span className="px-3 py-1 bg-orange-100 text-orange-700 text-xs rounded-full">
                  TypeScript
                </span>
                <span className="px-3 py-1 bg-green-100 text-green-700 text-xs rounded-full">
                  Tailwind CSS
                </span>
                <span className="px-3 py-1 bg-purple-100 text-purple-700 text-xs rounded-full">
                  Firebase
                </span>
                <span className="px-3 py-1 bg-pink-100 text-pink-700 text-xs rounded-full">
                  Flask
                </span>
                <span className="px-3 py-1 bg-pink-100 text-pink-700 text-xs rounded-full">
                  Python
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-3xl shadow-lg p-6 mt-6">
          <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            <span className="text-purple-500">💌</span>
            Acknowledgments
          </h2>

          <p className="text-sm text-gray-700 leading-relaxed">
            The biggest thank you to my supervisor, <br /> Dr. Sami, for guiding me
            through this project with endless patience and encouragement. Your
            insights and advice have been invaluable every step of the way.
          </p>
        </div>

        {/* Contact/Feedback Section */}
        <div className="bg-white rounded-3xl shadow-lg p-6">
          <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            <span className="text-green-500">📞</span>
            Get in Touch
          </h2>

          <div className="space-y-3">
            <button
              onClick={() => {
                // You can add email functionality later
                window.location.href =
                  "mailto:your.email@student.university.edu";
              }}
              className="w-full flex items-center justify-center gap-2 p-4 bg-green-50 hover:bg-green-100 rounded-2xl transition-colors border border-green-200"
            >
              <span className="text-green-500">📧</span>
              <span className="font-semibold text-green-700">Send Email</span>
            </button>

            <button
              onClick={() => {
                // You can add feedback form navigation later
                alert("Feedback form coming soon!");
              }}
              className="w-full flex items-center justify-center gap-2 p-4 bg-blue-50 hover:bg-blue-100 rounded-2xl transition-colors border border-blue-200"
            >
              <span className="text-blue-500">💬</span>
              <span className="font-semibold text-blue-700">Send Feedback</span>
            </button>

            <div className="p-4 bg-gray-50 rounded-2xl text-center">
              <p className="text-sm text-gray-600">
                Thank you for using this application!
                <br />
                Your feedback helps improve the project.
              </p>
            </div>
          </div>
        </div>

        {/* Version Information */}
        <div className="bg-white rounded-3xl shadow-lg p-6">
          <div className="text-center space-y-2">
            <p className="text-sm font-semibold text-gray-700">
              App Version 1.0.0
            </p>
            <p className="text-xs text-gray-500">
              Built with ❤️ for Final Year Project
            </p>
           
          </div>
        </div>
      </div>
    </div>
  );
};

export default AboutMe;

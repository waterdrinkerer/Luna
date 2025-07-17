import { useState } from "react";
import { NavLink } from "react-router-dom";
import BottomNav from "../components/BottomNav";

const categories = [
  "Discover",
  "Tips & Tricks",
  "Fertility",
  "Self-care",
  "Mental Health",
];



const articles = [
  {
    category: "Reproductive health",
    items: [
      {
        title: "Vaginal discharge color guide",
        thumbnail: "/assets/vaginal-discharge.png",
      },
      {
        title: "Early signs of pregnancy",
        thumbnail: "/assets/early-pregnancy.png",
      },
      {
        title: "Irregular periods explained",
        thumbnail: "/assets/irregular-periods.png",
      },
      {
        title: "Understanding PCOS",
        thumbnail: "/assets/pcos-info.png",
      },
      {
        title: "Tracking cervical mucus",
        thumbnail: "/assets/cervical-mucus.png",
      },
    ],
  },
  {
    category: "Tips & Tricks",
    items: [
      {
        title: "How to reduce cramps naturally",
        thumbnail: "/assets/cramp-relief.png",
      },
      {
        title: "Foods to support your cycle",
        thumbnail: "/assets/cycle-foods.png",
      },
      {
        title: "Using heat therapy effectively",
        thumbnail: "/assets/heat-therapy.png",
      },
      {
        title: "Comfortable period products",
        thumbnail: "/assets/period-products.png",
      },
      {
        title: "Period hacks for busy days",
        thumbnail: "/assets/period-hacks.png",
      },
    ],
  },
  {
    category: "Fertility",
    items: [
      {
        title: "Fertility myths debunked",
        thumbnail: "/assets/fertility-myths.png",
      },
      {
        title: "Ovulation signs to notice",
        thumbnail: "/assets/ovulation-signs.png",
      },
      {
        title: "Boosting fertility with diet",
        thumbnail: "/assets/fertility-diet.png",
      },
      {
        title: "When to take a pregnancy test",
        thumbnail: "/assets/pregnancy-test.png",
      },
      {
        title: "Fertility tracking tips",
        thumbnail: "/assets/fertility-tracking.png",
      },
    ],
  },
  {
    category: "Self-care",
    items: [
      {
        title: "Self-care during PMS",
        thumbnail: "/assets/selfcare-pms.png",
      },
      {
        title: "Journaling for emotional health",
        thumbnail: "/assets/journaling.png",
      },
      {
        title: "Aromatherapy and cycles",
        thumbnail: "/assets/aromatherapy.png",
      },
      {
        title: "Gentle yoga for cramps",
        thumbnail: "/assets/yoga-cramps.png",
      },
      {
        title: "Creating a cozy routine",
        thumbnail: "/assets/cozy-routine.png",
      },
    ],
  },
  {
    category: "Mental Health",
    items: [
      {
        title: "Period mood swings explained",
        thumbnail: "/assets/mood-swings.png",
      },
      {
        title: "Managing stress during your cycle",
        thumbnail: "/assets/stress-management.png",
      },
      {
        title: "The PMS-anxiety connection",
        thumbnail: "/assets/pms-anxiety.png",
      },
      {
        title: "Grounding techniques",
        thumbnail: "/assets/grounding.png",
      },
      {
        title: "Cycle syncing and emotions",
        thumbnail: "/assets/emotion-sync.png",
      },
    ],
  },
];

const LearningLounge = () => {
  const [activeTab, setActiveTab] = useState("Discover");
  const [search, setSearch] = useState("");

  // Filter logic
  const filteredArticles = articles.map((section) => ({
    ...section,
    items: section.items.filter((item) => {
      const matchesTab =
        activeTab === "Discover" || section.category === activeTab;
      const matchesSearch = item.title
        .toLowerCase()
        .includes(search.toLowerCase());
      return matchesTab && matchesSearch;
    }),
  }));

  return (
    <div className="min-h-screen pb-20 bg-[#F6F4FF]">
      <div className="px-5 pt-6 pb-2">
        <h1 className="text-2xl font-bold">
          <span className="text-[#7E5FFF]">Luna’s</span>{" "}
          <span className="text-black">Learning Lounge</span>
        </h1>

        <input
          type="text"
          placeholder="Search"
          className="w-full mt-4 mb-2 px-4 py-2 rounded-full text-sm bg-white shadow-sm placeholder-gray-400"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <div className="flex space-x-3 overflow-x-auto scrollbar-hide py-2">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveTab(cat)}
              className={`text-sm whitespace-nowrap px-4 py-2 rounded-full font-medium ${
                activeTab === cat
                  ? "bg-[#BFA3FF] text-white"
                  : "bg-[#E8E8E8] text-gray-700"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <div className="px-5 flex flex-col gap-5 pb-10">
        {filteredArticles.map(
          (section) =>
            section.items.length > 0 && (
              <div key={section.category}>
                <h2 className="font-semibold mb-2 text-sm">
                  {section.category}
                </h2>
                <div className="flex gap-3 overflow-x-auto scrollbar-hide">
                  {section.items.map((item) => (
                    <NavLink
                      to={`/learning/${encodeURIComponent(item.title)}`}
                      key={item.title}
                      className="min-w-[140px] bg-[#D7CEFF] rounded-xl overflow-hidden text-xs font-medium text-black shadow-sm"
                    >
                      <div className="aspect-[4/5] w-full">
                        <img
                          src={item.thumbnail}
                          alt={item.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="p-2">{item.title}</div>
                    </NavLink>
                  ))}
                </div>
              </div>
            )
        )}
        
      </div>
      

      <BottomNav />
    </div>
  );
};

export default LearningLounge;

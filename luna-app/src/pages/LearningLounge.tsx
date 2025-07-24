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
        id: "vaginal-discharge-guide",
        title:
          "The Complete Guide to Vaginal Discharge: What Your Body is Telling You",
        description:
          "Understanding the different types, colors, and textures of vaginal discharge throughout your menstrual cycle - and when to be concerned.",
        thumbnail: "/assets/vaginal-discharge.png",
        readTime: "8 min read",
        tags: ["Vaginal Health", "Cycle Tracking", "Body Awareness"],
        featured: true,
        excerpt:
          "Your vaginal discharge changes throughout your cycle and can tell you a lot about your reproductive health. Learn to decode what your body is communicating...",
      },
      {
        id: "early-pregnancy-signs",
        title:
          "Beyond the Missed Period: 15 Early Signs of Pregnancy You Should Know",
        description:
          "From subtle hormonal changes to physical symptoms, discover the early indicators that might signal pregnancy before you take a test.",
        thumbnail: "/assets/early-pregnancy.png",
        readTime: "12 min read",
        tags: ["Pregnancy", "Early Signs", "Fertility"],
        featured: false,
        excerpt:
          "While a missed period is the most obvious sign, your body may be giving you other clues about pregnancy much earlier than you think...",
      },
      {
        id: "irregular-periods-explained",
        title:
          "Irregular Periods Demystified: Causes, Solutions, and When to Seek Help",
        description:
          "A comprehensive look at why periods become irregular, from lifestyle factors to underlying conditions, plus actionable steps to regulate your cycle.",
        thumbnail: "/assets/irregular-periods.png",
        readTime: "15 min read",
        tags: ["Irregular Cycles", "PCOS", "Hormones"],
        featured: true,
        excerpt:
          "If your periods are unpredictable, you're not alone. Learn about the common causes and evidence-based strategies to help regulate your cycle naturally...",
      },
      {
        id: "understanding-pcos",
        title:
          "PCOS Explained: A Complete Guide to Symptoms, Diagnosis, and Management",
        description:
          "Everything you need to know about Polycystic Ovary Syndrome, from recognizing symptoms to managing the condition for better quality of life.",
        thumbnail: "/assets/pcos-info.png",
        readTime: "18 min read",
        tags: ["PCOS", "Hormonal Health", "Insulin Resistance"],
        featured: false,
        excerpt:
          "PCOS affects 1 in 10 women of reproductive age. Understanding this complex condition is the first step toward effective management and improved well-being...",
      },
      {
        id: "cervical-mucus-tracking",
        title: "Cervical Mucus: Your Body's Natural Fertility Indicator",
        description:
          "Learn how to track and interpret cervical mucus changes to understand your fertility window and optimize your chances of conception.",
        thumbnail: "/assets/cervical-mucus.png",
        readTime: "10 min read",
        tags: ["Fertility Tracking", "Natural Family Planning", "Ovulation"],
        featured: false,
        excerpt:
          "Your cervical mucus provides valuable insights into your fertility status. Master this natural tracking method to better understand your cycle...",
      },
    ],
  },
  {
    category: "Tips & Tricks",
    items: [
      {
        id: "natural-cramp-relief",
        title:
          "Science-Backed Natural Remedies for Menstrual Cramps That Actually Work",
        description:
          "Discover proven natural methods to reduce period pain, from targeted exercises and heat therapy to dietary changes and herbal remedies.",
        thumbnail: "/assets/cramp-relief.png",
        readTime: "14 min read",
        tags: ["Pain Relief", "Natural Remedies", "Period Cramps"],
        featured: true,
        excerpt:
          "Tired of relying on painkillers every month? These evidence-based natural approaches can significantly reduce menstrual pain and improve your quality of life...",
      },
      {
        id: "cycle-supporting-foods",
        title:
          "Cycle Syncing Your Nutrition: What to Eat During Each Phase of Your Menstrual Cycle",
        description:
          "A comprehensive guide to eating according to your cycle phases to support hormone balance, energy levels, and overall well-being.",
        thumbnail: "/assets/cycle-foods.png",
        readTime: "16 min read",
        tags: ["Nutrition", "Cycle Syncing", "Hormonal Health"],
        featured: false,
        excerpt:
          "Your nutritional needs change throughout your cycle. Learn how to fuel your body optimally during each phase for better energy, mood, and period symptoms...",
      },
      {
        id: "heat-therapy-guide",
        title:
          "The Ultimate Guide to Heat Therapy for Period Pain: Techniques That Work",
        description:
          "From heating pads to warm baths, discover the most effective heat therapy techniques for managing period discomfort and muscle tension.",
        thumbnail: "/assets/heat-therapy.png",
        readTime: "8 min read",
        tags: ["Heat Therapy", "Pain Management", "Self-Care"],
        featured: false,
        excerpt:
          "Heat therapy is one of the oldest and most effective remedies for period pain. Learn the best techniques to maximize its benefits...",
      },
      {
        id: "period-products-guide",
        title:
          "The Modern Woman's Guide to Period Products: Finding Your Perfect Match",
        description:
          "Navigate the world of period products with confidence - from traditional options to innovative new solutions that prioritize comfort and sustainability.",
        thumbnail: "/assets/period-products.png",
        readTime: "12 min read",
        tags: ["Period Products", "Sustainability", "Comfort"],
        featured: false,
        excerpt:
          "With so many period products available today, finding the right one can be overwhelming. We break down the pros and cons of each option...",
      },
      {
        id: "period-life-hacks",
        title: "25 Game-Changing Period Hacks Every Woman Should Know",
        description:
          "Practical tips and tricks to make your period more manageable, from emergency solutions to long-term strategies for period comfort.",
        thumbnail: "/assets/period-hacks.png",
        readTime: "10 min read",
        tags: ["Life Hacks", "Period Tips", "Practical Advice"],
        featured: true,
        excerpt:
          "These tried-and-tested period hacks will transform how you experience your monthly cycle. Say goodbye to period stress and hello to confidence...",
      },
    ],
  },
  {
    category: "Fertility",
    items: [
      {
        id: "fertility-myths-debunked",
        title:
          "Fertility Myths Busted: Separating Fact from Fiction in Your Journey to Conception",
        description:
          "Debunking common fertility misconceptions with science-based facts to help you make informed decisions about your reproductive health.",
        thumbnail: "/assets/fertility-myths.png",
        readTime: "13 min read",
        tags: ["Fertility Facts", "Conception", "Reproductive Health"],
        featured: true,
        excerpt:
          "From age-related concerns to lifestyle factors, we separate fertility fact from fiction to help you navigate your conception journey with confidence...",
      },
      {
        id: "ovulation-signs-guide",
        title:
          "Recognizing Ovulation: Your Body's Subtle (and Not-So-Subtle) Signs",
        description:
          "Learn to identify the physical and emotional changes that signal ovulation, helping you understand your fertility window better.",
        thumbnail: "/assets/ovulation-signs.png",
        readTime: "11 min read",
        tags: ["Ovulation", "Fertility Awareness", "Body Signs"],
        featured: false,
        excerpt:
          "Your body gives you clear signals when you're ovulating. Learn to recognize these signs to better understand your fertility and cycle...",
      },
      {
        id: "fertility-boosting-diet",
        title:
          "The Fertility Diet: Foods That Support Conception and Reproductive Health",
        description:
          "Discover how specific nutrients and foods can support fertility, hormone balance, and reproductive health for both partners.",
        thumbnail: "/assets/fertility-diet.png",
        readTime: "15 min read",
        tags: ["Fertility Diet", "Nutrition", "Preconception Health"],
        featured: false,
        excerpt:
          "What you eat can significantly impact your fertility. Learn about the nutrients and foods that support optimal reproductive health...",
      },
      {
        id: "pregnancy-test-timing",
        title:
          "When to Take a Pregnancy Test: Timing, Accuracy, and What to Expect",
        description:
          "Understanding pregnancy test accuracy, optimal timing, and how to interpret results for the most reliable outcome.",
        thumbnail: "/assets/pregnancy-test.png",
        readTime: "9 min read",
        tags: ["Pregnancy Tests", "Early Detection", "Accuracy"],
        featured: false,
        excerpt:
          "Taking a pregnancy test at the right time is crucial for accurate results. Learn when and how to test for the most reliable outcome...",
      },
      {
        id: "fertility-tracking-mastery",
        title:
          "Master Your Fertility: Advanced Tracking Techniques for Conception Success",
        description:
          "Go beyond basic period tracking with advanced fertility awareness methods including BBT charting, ovulation prediction, and cycle analysis.",
        thumbnail: "/assets/fertility-tracking.png",
        readTime: "17 min read",
        tags: ["Fertility Tracking", "BBT", "Ovulation Prediction"],
        featured: true,
        excerpt:
          "Take your fertility tracking to the next level with these advanced techniques that provide deeper insights into your reproductive patterns...",
      },
    ],
  },
  {
    category: "Self-care",
    items: [
      {
        id: "pms-self-care-rituals",
        title:
          "Creating Your PMS Self-Care Sanctuary: Rituals for Comfort and Relief",
        description:
          "Build a personalized self-care routine to manage PMS symptoms naturally, focusing on comfort, relaxation, and emotional well-being.",
        thumbnail: "/assets/selfcare-pms.png",
        readTime: "12 min read",
        tags: ["PMS Relief", "Self-Care", "Wellness Rituals"],
        featured: true,
        excerpt:
          "PMS doesn't have to derail your month. Create a nurturing self-care routine that supports you through challenging premenstrual days...",
      },
      {
        id: "cycle-journaling-guide",
        title:
          "The Power of Cycle Journaling: Connecting with Your Body's Wisdom",
        description:
          "Discover how journaling about your menstrual cycle can improve self-awareness, emotional regulation, and overall well-being.",
        thumbnail: "/assets/journaling.png",
        readTime: "10 min read",
        tags: ["Journaling", "Self-Awareness", "Emotional Health"],
        featured: false,
        excerpt:
          "Cycle journaling is a powerful tool for understanding your patterns, emotions, and needs throughout your menstrual cycle...",
      },
      {
        id: "aromatherapy-cycles",
        title:
          "Aromatherapy for Every Phase: Essential Oils to Support Your Menstrual Cycle",
        description:
          "Learn how different essential oils can support you through each phase of your cycle, from energizing to calming properties.",
        thumbnail: "/assets/aromatherapy.png",
        readTime: "11 min read",
        tags: ["Aromatherapy", "Essential Oils", "Cycle Support"],
        featured: false,
        excerpt:
          "Essential oils can provide natural support for your changing needs throughout your menstrual cycle. Discover which oils work best for each phase...",
      },
      {
        id: "yoga-for-cramps",
        title:
          "Gentle Yoga Flows for Period Relief: Poses to Ease Cramps and Tension",
        description:
          "Easy-to-follow yoga sequences specifically designed to alleviate menstrual discomfort and promote relaxation during your period.",
        thumbnail: "/assets/yoga-cramps.png",
        readTime: "14 min read",
        tags: ["Yoga", "Period Relief", "Gentle Movement"],
        featured: false,
        excerpt:
          "These gentle yoga poses can help relieve menstrual cramps and tension while promoting relaxation and mind-body connection...",
      },
      {
        id: "cozy-period-routine",
        title: "The Art of Period Comfort: Creating Your Ultimate Cozy Routine",
        description:
          "Transform your period experience with comfort-focused rituals, cozy environments, and nurturing practices that honor your body's needs.",
        thumbnail: "/assets/cozy-routine.png",
        readTime: "9 min read",
        tags: ["Comfort", "Period Routine", "Cozy Living"],
        featured: true,
        excerpt:
          "Your period can be a time of comfort and self-nurturing. Learn to create a cozy routine that makes your monthly cycle more enjoyable...",
      },
    ],
  },
  {
    category: "Mental Health",
    items: [
      {
        id: "period-mood-science",
        title:
          "The Science Behind Period Mood Swings: Understanding Your Emotional Cycle",
        description:
          "Explore the hormonal changes that affect mood during your menstrual cycle and learn strategies to manage emotional fluctuations.",
        thumbnail: "/assets/mood-swings.png",
        readTime: "13 min read",
        tags: ["Mood Swings", "Hormones", "Emotional Health"],
        featured: true,
        excerpt:
          "Understanding the science behind period-related mood changes can help you navigate emotional ups and downs with greater self-compassion...",
      },
      {
        id: "stress-cycle-management",
        title:
          "Breaking the Stress-Cycle Connection: Managing Stress Throughout Your Month",
        description:
          "Learn how stress affects your menstrual cycle and discover evidence-based techniques to manage stress for better cycle health.",
        thumbnail: "/assets/stress-management.png",
        readTime: "15 min read",
        tags: ["Stress Management", "Cycle Health", "Mental Wellness"],
        featured: false,
        excerpt:
          "Chronic stress can significantly impact your menstrual cycle. Learn effective strategies to manage stress and support your reproductive health...",
      },
      {
        id: "pms-anxiety-connection",
        title: "PMS and Anxiety: Understanding the Link and Finding Relief",
        description:
          "Explore the connection between PMS and anxiety symptoms, plus practical strategies for managing both conditions effectively.",
        thumbnail: "/assets/pms-anxiety.png",
        readTime: "12 min read",
        tags: ["PMS", "Anxiety", "Mental Health"],
        featured: false,
        excerpt:
          "Many women experience increased anxiety before their period. Understanding this connection is the first step toward finding effective relief...",
      },
      {
        id: "grounding-techniques-cycle",
        title: "Grounding Techniques for Cycle-Related Emotional Overwhelm",
        description:
          "Simple, effective grounding techniques to help you stay centered and calm during emotionally challenging times in your cycle.",
        thumbnail: "/assets/grounding.png",
        readTime: "8 min read",
        tags: ["Grounding", "Mindfulness", "Emotional Regulation"],
        featured: false,
        excerpt:
          "When emotions feel overwhelming during your cycle, these grounding techniques can help you find stability and inner calm...",
      },
      {
        id: "emotion-cycle-syncing",
        title: "Emotional Cycle Syncing: Working with Your Natural Rhythms",
        description:
          "Learn to recognize and honor your emotional patterns throughout your cycle, using this awareness for better self-care and productivity.",
        thumbnail: "/assets/emotion-sync.png",
        readTime: "16 min read",
        tags: ["Emotional Cycles", "Self-Awareness", "Productivity"],
        featured: true,
        excerpt:
          "Your emotions naturally fluctuate with your cycle. Learn to sync with these rhythms for improved well-being and life satisfaction...",
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
      const matchesSearch =
        item.title.toLowerCase().includes(search.toLowerCase()) ||
        item.description.toLowerCase().includes(search.toLowerCase()) ||
        item.tags.some((tag) =>
          tag.toLowerCase().includes(search.toLowerCase())
        );
      return matchesTab && matchesSearch;
    }),
  }));

  // Get featured articles for Discover tab
  const featuredArticles = articles.flatMap((section) =>
    section.items.filter((item) => item.featured)
  );

  return (
    <div className="min-h-screen pb-20 bg-gradient-to-br from-purple-50 to-pink-50">
      <div className="px-5 pt-6 pb-2">
        <h1 className="text-2xl font-bold mb-2 mt-6">
          <span className="text-[#7E5FFF] ">Luna's </span>{" "}
          <span className="text-black">Learning Lounge</span>
        </h1>
        <p className="text-gray-600 text-sm mb-4">
          Evidence-based articles for your wellness journey
        </p>

        <div className="relative mb-4">
          <input
            type="text"
            placeholder="Search articles, topics, or tags..."
            className="w-full px-4 py-3 pl-10 rounded-2xl text-sm bg-white shadow-sm placeholder-gray-400 border border-gray-100 focus:outline-none focus:ring-2 focus:ring-purple-200"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <svg
            className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>

        <div className="flex space-x-3 overflow-x-auto scrollbar-hide py-2">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveTab(cat)}
              className={`text-sm whitespace-nowrap px-5 py-2.5 rounded-full font-medium transition-all duration-200 ${
                activeTab === cat
                  ? "bg-[#7E5FFF] text-white shadow-lg"
                  : "bg-white text-gray-700 hover:bg-gray-50 shadow-sm"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <div className="px-5 flex flex-col gap-6 pb-10">
        {/* Featured Articles for Discover Tab */}
        {activeTab === "Discover" && !search && (
          <div>
            <div className="flex items-center gap-2 mb-4">
              <span className="text-2xl">⭐</span>
              <h2 className="font-bold text-lg text-gray-800">
                Featured Articles
              </h2>
            </div>
            <div className="grid gap-4">
              {featuredArticles.slice(0, 3).map((item) => (
                <NavLink
                  to={`/learning/${item.id}`}
                  key={item.id}
                  className="bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-lg transition-all duration-200 hover:-translate-y-1"
                >
                  <div className="md:flex">
                    <div className="md:w-1/3 overflow-hidden aspect-[4/3] bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center">
                      <img
                        src={item.thumbnail}
                        alt={item.title}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src =
                            "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjRjNFOEZGIi8+CjxjaXJjbGUgY3g9IjEwMCIgY3k9IjEwMCIgcj0iMzAiIGZpbGw9IiM3RTVGRkYiLz4KPHN2Zz4K";
                          target.className = "w-16 h-16 opacity-50";
                        }}
                      />
                    </div>
                    <div className="p-5 md:w-2/3">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="bg-purple-100 text-purple-700 px-2 py-1 rounded-full text-xs font-medium">
                          Featured
                        </span>
                        <span className="text-gray-500 text-xs">
                          {item.readTime}
                        </span>
                      </div>
                      <h3 className="font-bold text-lg text-gray-800 mb-2 leading-tight">
                        {item.title}
                      </h3>
                      <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                        {item.excerpt}
                      </p>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500">

                        </span>
                        <div className="flex gap-1">
                          {item.tags.slice(0, 2).map((tag) => (
                            <span
                              key={tag}
                              className="bg-gray-100 text-gray-600 px-2 py-1 rounded-full text-xs"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </NavLink>
              ))}
            </div>
          </div>
        )}

        {/* Category Sections */}
        {filteredArticles.map(
          (section) =>
            section.items.length > 0 && (
              <div key={section.category}>
                <h2 className="font-bold text-lg text-gray-800 mb-4 flex items-center gap-2">
                  <span className="w-1 h-6 bg-gradient-to-b from-purple-500 to-pink-500 rounded-full"></span>
                  {section.category}
                </h2>
                <div className="grid gap-4 md:grid-cols-2">
                  {section.items.map((item) => (
                    <NavLink
                      to={`/learning/${item.id}`}
                      key={item.id}
                      className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-200 hover:-translate-y-1 group"
                    >
                      <div className="overflow-hidden bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center">
                        <img
                          src={item.thumbnail}
                          alt={item.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src =
                              "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjRjNFOEZGIi8+CjxjaXJjbGUgY3g9IjEwMCIgY3k9IjEwMCIgcj0iMzAiIGZpbGw9IiM3RTVGRkYiLz4KPHN2Zz4K";
                            target.className = "w-16 h-16 opacity-50";
                          }}
                        />
                      </div>
                      <div className="p-4">
                        <div className="flex items-center gap-2 mb-2">
                          {item.featured && (
                            <span className="bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full text-xs font-medium">
                              ⭐ Featured
                            </span>
                          )}
                          <span className="text-gray-500 text-xs">
                            {item.readTime}
                          </span>
                        </div>
                        <h3 className="font-semibold text-gray-800 mb-2 leading-tight line-clamp-2">
                          {item.title}
                        </h3>
                        <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                          {item.description}
                        </p>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-500">
               
                          </span>
                          <div className="flex gap-1">
                            {item.tags.slice(0, 2).map((tag) => (
                              <span
                                key={tag}
                                className="bg-gray-100 text-gray-600 px-2 py-1 rounded-full text-xs"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </NavLink>
                  ))}
                </div>
              </div>
            )
        )}

        {/* No Results */}
        {filteredArticles.every((section) => section.items.length === 0) && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">
              No articles found
            </h3>
            <p className="text-gray-600">
              Try adjusting your search or browse different categories
            </p>
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
};

export default LearningLounge;

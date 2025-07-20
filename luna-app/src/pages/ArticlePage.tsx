import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";

// ✅ ADD TYPE DEFINITIONS
interface Article {
  title: string;
  readTime: string;
  publishDate: string;
  tags: string[];
  thumbnail: string;
  content: string;
  relatedArticles: string[];
}

type ArticleContent = {
  [title: string]: Article & { credentials?: string };
};

const articleContent: ArticleContent = {
  // Reproductive Health
  "vaginal-discharge-guide": {
    title: "Vaginal discharge color guide",
    readTime: "3 min read",
    publishDate: "2024-06-01",
    tags: ["Reproductive Health", "Discharge", "Cycle"],
    thumbnail: "/assets/vaginal-discharge.png",
    content:
      "Vaginal discharge comes in many colors and textures—and most are completely normal. Clear or milky white discharge is common during ovulation or arousal. Yellow or green hues may signal infection, especially if there’s odor or irritation. Brown discharge might appear before or after your period. This guide helps you identify what’s healthy and what might need a doctor’s visit, empowering you to better understand your body’s natural cycles and recognize changes worth noting.",
    relatedArticles: ["early-pregnancy-signs", "irregular-periods-explained"],
  },

  "early-pregnancy-signs": {
    title: "Early signs of pregnancy",
    readTime: "2 min read",
    publishDate: "2024-06-01",
    tags: ["Reproductive Health", "Pregnancy", "Cycle"],
    thumbnail: "/assets/early-pregnancy.png",
    content:
      "Wondering if you might be pregnant? Common early signs include fatigue, missed periods, breast tenderness, frequent urination, and mood changes. Some also experience nausea or food aversions within the first few weeks. Keep in mind, symptoms vary widely and can overlap with PMS. If you suspect pregnancy, a home test followed by a doctor’s visit is the best next step. Awareness of these signs can help you tune into what your body may be telling you.",
    relatedArticles: ["vaginal-discharge-guide", "irregular-periods-explained"],
  },

  "irregular-periods-explained": {
    title: "Irregular periods explained",
    readTime: "2 min read",
    publishDate: "2024-06-01",
    tags: ["Reproductive Health", "Periods", "Cycle"],
    thumbnail: "/assets/irregular-periods.png",
    content:
      "Irregular periods can be confusing and frustrating. They may stem from stress, weight fluctuations, hormonal imbalances, or conditions like PCOS. Some people experience occasional irregularity due to travel or lifestyle changes, while others may deal with consistently unpredictable cycles. It’s important to track patterns and consult a healthcare provider if irregularity becomes frequent. Understanding the possible causes can help you take better control of your cycle and overall reproductive health.",
    relatedArticles: ["Understanding PCOS", "Tracking cervical mucus"],
  },

  "understanding-pcos": {
    title: "Understanding PCOS",
    readTime: "3 min read",
    publishDate: "2024-06-01",
    tags: ["Reproductive Health", "PCOS", "Hormones"],
    thumbnail: "/assets/pcos-info.png",
    content:
      "Polycystic Ovary Syndrome (PCOS) is a hormonal condition that affects 1 in 10 individuals with ovaries. Symptoms include irregular periods, acne, hair thinning, and difficulty with weight management. It may also affect fertility. Though the cause isn’t fully known, it involves insulin resistance and hormone imbalances. PCOS is manageable through lifestyle changes, medications, and regular monitoring. If you suspect PCOS, don’t hesitate to seek help—early diagnosis makes a big difference in managing symptoms.",
    relatedArticles: ["Irregular periods explained", "Tracking cervical mucus"],
    credentials: "Reviewed by Dr. Luna Health Team",
  },

  "cervical-mucus-tracking": {
    title: "Tracking cervical mucus",
    readTime: "2 min read",
    publishDate: "2024-06-01",
    tags: ["Reproductive Health", "Fertility", "Cycle"],
    thumbnail: "/assets/cervical-mucus.png",
    content:
      "Cervical mucus changes throughout your cycle, offering clues about your fertility window. After your period, mucus may be dry or sticky. As ovulation nears, it becomes creamy, then watery, and finally egg-white-like—a sign you’re at your most fertile. Tracking these shifts can improve your awareness of your cycle and help with conception or contraception. It’s an empowering, natural way to stay in tune with your body’s rhythm.",
    relatedArticles: ["Irregular periods explained", "Understanding PCOS"],
    credentials: "Reviewed by Dr. Luna Health Team",
  },

  // Tips & Tricks
  "natural-cramp-relief": {
    title: "How to reduce cramps naturally",
    readTime: "2 min read",
    publishDate: "2024-06-01",
    tags: ["Tips & Tricks", "Cramps", "Relief"],
    thumbnail: "/assets/cramp-relief.png",
    content:
      "Cramps got you curled up in bed? Try these natural remedies. Apply a heating pad to relax muscles, drink herbal teas like chamomile or ginger, and do light stretches or yoga. Magnesium-rich foods such as dark leafy greens and bananas can also help ease discomfort. Avoid caffeine and processed foods during your period to minimize inflammation. Small changes can bring big relief—your body will thank you!",
    relatedArticles: [
      "Using heat therapy effectively",
      "Comfortable period products",
    ],
  },

  "cycle-supporting-foods": {
    title: "Foods to support your cycle",
    readTime: "2 min read",
    publishDate: "2024-06-01",
    tags: ["Tips & Tricks", "Nutrition", "Cycle"],
    thumbnail: "/assets/cycle-foods.png",
    content:
      "Eating with your cycle can support hormonal balance and energy levels. During menstruation, focus on iron-rich foods like spinach and lentils. In the follicular phase, opt for fresh fruits and veggies to boost energy. Ovulation calls for zinc and B-vitamins—think eggs and whole grains. The luteal phase benefits from magnesium and healthy fats, like avocados and nuts. Nourish your body with intention, and it’ll respond with balance and strength.",
    relatedArticles: [
      "Boosting fertility with diet",
      "Period hacks for busy days",
    ],
  },

  "heat-therapy-guide": {
    title: "Using heat therapy effectively",
    readTime: "2 min read",
    publishDate: "2024-06-01",
    tags: ["Tips & Tricks", "Cramps", "Relief"],
    thumbnail: "/assets/heat-therapy.png",
    content:
      "Heat therapy is a simple but effective way to soothe period cramps and muscle tension. Apply a heating pad to your lower abdomen for 15–20 minutes at a time. Warm baths with Epsom salts also relax the body and improve blood flow. Heat works by relaxing uterine muscles and reducing pain signals. It’s natural, safe, and often just as effective as over-the-counter meds when used consistently.",
    relatedArticles: [
      "How to reduce cramps naturally",
      "Gentle yoga for cramps",
    ],
  },

  "period-products-guide": {
    title: "Comfortable period products",
    readTime: "2 min read",
    publishDate: "2024-06-01",
    tags: ["Tips & Tricks", "Period Products", "Comfort"],
    thumbnail: "/assets/period-products.png",
    content:
      "Choosing the right period product is key to comfort and confidence. Pads and tampons are classics, but menstrual cups, period panties, and reusable pads are eco-friendly alternatives worth exploring. Some people find soft discs more comfortable during sleep or workouts. What’s comfortable varies from person to person—try a few and listen to your body. There’s no one-size-fits-all, but there’s definitely a fit for you.",
    relatedArticles: [
      "Period hacks for busy days",
      "Foods to support your cycle",
    ],
  },

  "period-life-hacks": {
    title: "Period hacks for busy days",
    readTime: "2 min read",
    publishDate: "2024-06-01",
    tags: ["Tips & Tricks", "Period", "Lifestyle"],
    thumbnail: "/assets/period-hacks.png",
    content:
      "Juggling life during your period? Prep ahead! Keep spare products in your bag, wear dark comfy clothes, and schedule breaks for self-care. Use a tracking app to anticipate symptoms. Stay hydrated and snack on energizing foods like fruit or nuts. A portable heating patch can be a lifesaver during meetings or classes. With a little planning, even the busiest days can feel manageable.",
    relatedArticles: [
      "Comfortable period products",
      "Foods to support your cycle",
    ],
  },

  // Fertility
  "fertility-myths-debunked": {
    title: "Fertility myths debunked",
    readTime: "2 min read",
    publishDate: "2024-06-01",
    tags: ["Fertility", "Myths", "Reproductive Health"],
    thumbnail: "/assets/fertility-myths.png",
    content:
      "Fertility comes with many myths—like needing to have sex daily or that birth control ruins fertility. In reality, timing matters more than frequency, and most regain fertility soon after stopping contraceptives. Age, health, and lifestyle play bigger roles. Don’t fall for internet rumors—trust science, your doctor, and your body. Clearing up misconceptions empowers smarter decisions on your journey to conception.",
    relatedArticles: [
      "Boosting fertility with diet",
      "Ovulation signs to notice",
    ],
  },

  "ovulation-signs-guide": {
    title: "Ovulation signs to notice",
    readTime: "2 min read",
    publishDate: "2024-06-01",
    tags: ["Fertility", "Ovulation", "Cycle"],
    thumbnail: "/assets/ovulation-signs.png",
    content:
      "Ovulation is a key phase in your cycle when an egg is released. You may notice changes in cervical mucus (stretchy and clear), a slight rise in basal body temperature, or mild one-sided pelvic pain. Some also experience increased libido. These subtle clues can help you better understand your cycle, especially if you're trying to conceive or avoid pregnancy. Tracking them builds awareness and confidence in your reproductive health.",
    relatedArticles: ["Fertility tracking tips", "Fertility myths debunked"],
  },

  "fertility-boosting-diet": {
    title: "Boosting fertility with diet",
    readTime: "2 min read",
    publishDate: "2024-06-01",
    tags: ["Fertility", "Diet", "Nutrition"],
    thumbnail: "/assets/fertility-diet.png",
    content:
      "Your diet can support or hinder fertility. Prioritize whole foods: leafy greens, berries, healthy fats, and lean proteins. Folate, iron, and omega-3s are essential. Limit sugar and trans fats, which may affect ovulation. Hydration and gut health also play a role, so include probiotics like yogurt or kimchi. While no food guarantees results, a balanced, nutrient-rich diet creates a strong foundation for reproductive health.",
    relatedArticles: ["Fertility myths debunked", "Ovulation signs to notice"],
  },

  "pregnancy-test-timing": {
    title: "When to take a pregnancy test",
    readTime: "2 min read",
    publishDate: "2024-06-01",
    tags: ["Fertility", "Pregnancy", "Cycle"],
    thumbnail: "/assets/pregnancy-test.png",
    content:
      "The best time to take a pregnancy test is after you’ve missed your period—typically around 10–14 days after ovulation. Testing too early may lead to inaccurate results. Use first morning urine for the highest concentration of hCG (the pregnancy hormone). If your cycle is irregular, wait a few extra days. Follow up with a doctor to confirm the results and discuss next steps for your health.",
    relatedArticles: [
      "Fertility tracking tips",
      "Boosting fertility with diet",
    ],
  },

  "fertility-tracking-mastery": {
    title: "Fertility tracking tips",
    readTime: "2 min read",
    publishDate: "2024-06-01",
    tags: ["Fertility", "Tracking", "Cycle"],
    thumbnail: "/assets/fertility-tracking.png",
    content:
      "Tracking your fertility can feel overwhelming at first, but it gets easier with the right tools. Apps, basal thermometers, and ovulation predictor kits (OPKs) can help. Consistency is key—track your cycle, symptoms, and temperature daily. Watch for cervical mucus changes and try journaling patterns. Over time, you’ll notice trends that help you predict ovulation and understand your body better, whether you’re trying to conceive or not.",
    relatedArticles: [
      "Ovulation signs to notice",
      "When to take a pregnancy test",
    ],
  },

  // Self-care
  "pms-self-care-rituals": {
    title: "Self-care during PMS",
    readTime: "2 min read",
    publishDate: "2024-06-01",
    tags: ["Self-care", "PMS", "Cycle"],
    thumbnail: "/assets/selfcare-pms.png",
    content:
      "PMS can bring mood swings, bloating, and irritability. Prioritize gentle self-care—take warm baths, journal your feelings, listen to calming music, or cozy up with a blanket and tea. Move your body gently with stretching or walking. Avoid overstimulation and say no to things that drain you. Creating a comforting space helps soothe both body and mind as hormones fluctuate.",
    relatedArticles: [
      "Journaling for emotional health",
      "Gentle yoga for cramps",
    ],
  },

  "cycle-journaling-guide": {
    title: "Journaling for emotional health",
    readTime: "2 min read",
    publishDate: "2024-06-01",
    tags: ["Self-care", "Journaling", "Mental Health"],
    thumbnail: "/assets/journaling.png",
    content:
      "Journaling offers a safe outlet to explore thoughts, emotions, and patterns. During your cycle, hormones can amplify feelings—writing them down helps process them. Try prompts like 'What am I feeling today?' or 'What does my body need right now?' No need for structure, just let your pen flow. Over time, journaling builds self-awareness and emotional resilience through all phases of your cycle.",
    relatedArticles: ["Self-care during PMS", "Aromatherapy and cycles"],
  },

  "aromatherapy-cycles": {
    title: "Aromatherapy and cycles",
    readTime: "2 min read",
    publishDate: "2024-06-01",
    tags: ["Self-care", "Aromatherapy", "Cycle"],
    thumbnail: "/assets/aromatherapy.png",
    content:
      "Aromatherapy uses plant-based oils to support mood and well-being. Lavender helps with anxiety and sleep, peppermint soothes headaches, and clary sage can ease cramps. Diffuse, apply diluted oil to pulse points, or add to a warm bath. Scents can trigger emotional memory and calm the nervous system. It’s a lovely, gentle way to support your cycle through sensory care.",
    relatedArticles: [
      "Journaling for emotional health",
      "Gentle yoga for cramps",
    ],
  },

  "yoga-for-cramps": {
    title: "Gentle yoga for cramps",
    readTime: "2 min read",
    publishDate: "2024-06-01",
    tags: ["Self-care", "Yoga", "Cramps"],
    thumbnail: "/assets/yoga-cramps.png",
    content:
      "When cramps hit, gentle yoga can be your best friend. Try poses like Child’s Pose, Cat-Cow, and Reclining Twist. These movements increase circulation and relax pelvic muscles. Focus on breathing deeply and moving slowly. Avoid intense inversions, and listen to your body’s cues. Even 10 minutes of mindful stretching can ease discomfort and bring emotional relief during your period.",
    relatedArticles: ["Self-care during PMS", "Aromatherapy and cycles"],
  },

  "cozy-period-routine": {
    title: "Creating a cozy routine",
    readTime: "2 min read",
    publishDate: "2024-06-01",
    tags: ["Self-care", "Routine", "Cycle"],
    thumbnail: "/assets/cozy-routine.png",
    content:
      "Your cycle is a great time to slow down and build comforting routines. Light a candle, make warm tea, put on soft clothes, and wind down with a book or gentle playlist. Creating cozy rituals reminds you to nurture yourself when energy dips. A consistent routine—even just 30 minutes a day—can improve sleep, mood, and overall sense of balance. You deserve that quiet time.",
    relatedArticles: ["Gentle yoga for cramps", "Self-care during PMS"],
  },

  // Mental Health
  "period-mood-science": {
    title: "Period mood swings explained",
    readTime: "2 min read",
    publishDate: "2024-06-01",
    tags: ["Mental Health", "Mood Swings", "Cycle"],
    thumbnail: "/assets/mood-swings.png",
    content:
      "Mood swings during your cycle are tied to hormonal shifts—especially estrogen and progesterone. These changes affect brain chemicals like serotonin, impacting emotions. You may feel weepy, irritable, or anxious without clear reason. Knowing it's hormonal can bring relief. Self-kindness, rest, and good nutrition help. If mood changes are extreme, talk to a doctor—it might be PMDD. You're not alone, and your feelings are valid.",
    relatedArticles: [
      "Managing stress during your cycle",
      "The PMS-anxiety connection",
    ],
  },

  "stress-cycle-management": {
    title: "Managing stress during your cycle",
    readTime: "2 min read",
    publishDate: "2024-06-01",
    tags: ["Mental Health", "Stress", "Cycle"],
    thumbnail: "/assets/stress-management.png",
    content:
      "Stress hits harder during certain cycle phases, especially PMS and menstruation. Try mindfulness practices like deep breathing, nature walks, or journaling. Nourish your body with grounding foods like oats, nuts, and warm soups. Simplify your schedule where possible and lean on support. Managing stress is a skill—and during your cycle, it's a necessity for balance and well-being.",
    relatedArticles: ["Period mood swings explained", "Grounding techniques"],
  },

  "pms-anxiety-connection": {
    title: "The PMS-anxiety connection",
    readTime: "2 min read",
    publishDate: "2024-06-01",
    tags: ["Mental Health", "PMS", "Anxiety"],
    thumbnail: "/assets/pms-anxiety.png",
    content:
      "Many experience heightened anxiety right before their period. It’s linked to the dip in progesterone and serotonin during the luteal phase. You may feel on edge, overwhelmed, or restless. Recognize it as a hormonal wave—not a personal failure. Grounding tools, magnesium-rich foods, and light movement can help regulate mood. If anxiety becomes unmanageable, consider seeking support—it’s okay to ask for help.",
    relatedArticles: [
      "Managing stress during your cycle",
      "Grounding techniques",
    ],
  },

  "grounding-techniques-cycle": {
    title: "Grounding techniques",
    readTime: "2 min read",
    publishDate: "2024-06-01",
    tags: ["Mental Health", "Grounding", "Cycle"],
    thumbnail: "/assets/grounding.png",
    content:
      "Grounding helps bring your awareness back to the present when emotions feel overwhelming. Try the 5-4-3-2-1 method: name five things you see, four you can touch, three you hear, two you smell, one you taste. Walking barefoot on grass, holding a cold object, or focusing on your breath also works. These small practices gently regulate the nervous system and calm anxiety.",
    relatedArticles: [
      "The PMS-anxiety connection",
      "Cycle syncing and emotions",
    ],
  },

  "emotion-cycle-syncing": {
    title: "Cycle syncing and emotions",
    readTime: "2 min read",
    publishDate: "2024-06-01",
    tags: ["Mental Health", "Cycle Syncing", "Emotions"],
    thumbnail: "/assets/emotion-sync.png",
    content:
      "Your emotions ebb and flow with your cycle. During the follicular phase, energy and optimism rise. Ovulation brings social sparks, while the luteal phase may bring reflection and irritability. Menstruation invites introspection. Knowing these shifts helps you plan accordingly—like scheduling creative tasks post-period or quiet time during PMS. Syncing with your cycle is like learning your own emotional language.",
    relatedArticles: ["Grounding techniques", "Period mood swings explained"],
  },
};

const ArticlePage = () => {
  const { articleId } = useParams<{ articleId: string }>();
  const navigate = useNavigate();
  const [article, setArticle] = useState<Article | null>(null);

  useEffect(() => {
    if (articleId && articleContent[articleId]) {
      setArticle(articleContent[articleId]);
    }
  }, [articleId]);

  if (!article) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">📚</div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">
            Article not found
          </h2>
          <button
            onClick={() => navigate("/learning")}
            className="text-purple-600 hover:text-purple-800 underline"
          >
            Back to Learning Lounge
          </button>
        </div>
      </div>
    );
  }

  const formatContent = (content: string) => {
    return content.split("\n").map((line: string, index: number) => {
      line = line.trim();
      if (!line) return <br key={index} />;

      if (line.startsWith("# ")) {
        return (
          <h1
            key={index}
            className="text-3xl font-bold text-gray-800 mt-8 mb-4"
          >
            {line.substring(2)}
          </h1>
        );
      } else if (line.includes("**") && !line.startsWith("-")) {
        const formatted = line.replace(
          /\*\*(.*?)\*\*/g,
          '<strong class="font-semibold text-gray-800">$1</strong>'
        );
        return (
          <p
            key={index}
            className="mb-3 text-gray-700 leading-relaxed"
            dangerouslySetInnerHTML={{ __html: formatted }}
          />
        );
      } else if (
        line.startsWith("*") &&
        line.endsWith("*") &&
        line.length > 20
      ) {
        return (
          <p
            key={index}
            className="text-sm text-gray-500 italic mt-6 p-4 bg-gray-50 rounded-lg border-l-4 border-purple-200"
          >
            {line.substring(1, line.length - 1)}
          </p>
        );
      } else {
        return (
          <p key={index} className="mb-3 text-gray-700 leading-relaxed">
            {line}
          </p>
        );
      }
    });
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-gradient-to-br from-purple-50 to-pink-50 px-5 pt-6 pb-8">
        <button
          onClick={() => navigate("/learning")}
          className="mb-4 flex items-center gap-2 text-purple-600 hover:text-purple-800 transition-colors"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M15 19l-7-7 7-7"
            />
          </svg>
          <span className="font-medium">Back to Learning Lounge</span>
        </button>

        <div className="mb-4">
          <div className="flex flex-wrap gap-2 mb-3">
            {article.tags.map((tag: string) => (
              <span
                key={tag}
                className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-xs font-medium"
              >
                {tag}
              </span>
            ))}
          </div>

          <h1 className="text-2xl md:text-3xl font-bold text-gray-800 leading-tight mb-4">
            {article.title}
          </h1>

          <div className="flex items-center gap-4 text-sm text-gray-600">
            <span className="flex items-center gap-1">
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
            </span>
            <span className="flex items-center gap-1">
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              {article.readTime}
            </span>
            <span className="flex items-center gap-1">
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              {article.publishDate}
            </span>
          </div>

          <div className="mt-3 p-3 bg-white/80 backdrop-blur-sm rounded-lg border border-purple-100">
            <p className="text-sm text-gray-600 font-medium"></p>
          </div>
        </div>

        {/* Article Image */}
        <div className="overflow-hidden rounded-2xl bg-gradient-to-br from-purple-100 to-pink-100">
          <img
            src={article.thumbnail}
            alt={article.title}
             className="w-full h-auto object-cover rounded-2xl"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.src =
                "data:thumbnail/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjRjNFOEZGIi8+CjxjaXJjbGUgY3g9IjEwMCIgY3k9IjEwMCIgcj0iMzAiIGZpbGw9IiM3RTVGRkYiLz4KPHN2Zz4K";
              target.className = "w-20 h-20 opacity-50";
            }}
          />
        </div>
      </div>

      {/* Article Content */}
      <div className="max-w-4xl mx-auto px-5 py-8">
        <div className="prose max-w-none">{formatContent(article.content)}</div>

        {/* Related Articles */}
        {article.relatedArticles && article.relatedArticles.length > 0 && (
          <div className="mt-12 pt-8 border-t border-gray-200">
            <h3 className="text-xl font-semibold text-gray-800 mb-6">
              Related Articles
            </h3>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {article.relatedArticles.map((relatedId: string) => {
                const relatedArticle = articleContent[relatedId];
                if (!relatedArticle) return null;

                return (
                  <button
                    key={relatedId}
                    onClick={() => navigate(`/learning/${relatedId}`)}
                    className="text-left p-4 bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl hover:shadow-md transition-all duration-200 border border-purple-100"
                  >
                    <h4 className="font-semibold text-gray-800 mb-2 line-clamp-2">
                      {relatedArticle.title}
                    </h4>
                    <p className="text-sm text-gray-600 mb-2">
                      {relatedArticle.readTime}
                    </p>
                    <p className="text-xs text-purple-600">Read more →</p>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Share & Feedback */}
        <div className="mt-12 pt-8 border-t border-gray-200 text-center">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            Was this article helpful?
          </h3>
          <div className="flex justify-center gap-4 mb-6">
            <button className="flex items-center gap-2 px-4 py-2 bg-green-100 text-green-700 rounded-full hover:bg-green-200 transition-colors">
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5"
                />
              </svg>
              Yes, helpful
            </button>
            <button className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200 transition-colors">
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M10 14H5.236a2 2 0 01-1.789-2.894l3.5-7A2 2 0 018.736 3h4.018c.163 0 .326.02.485.06L17 4m-7 10v2a2 2 0 002 2h.095c.5 0 .905-.405.905-.905 0-.714.211-1.412.608-2.006L17 13V4m-7 10h2m5-10h2a2 2 0 012 2v6a2 2 0 01-2 2h-2.5"
                />
              </svg>
              Needs improvement
            </button>
          </div>
          <p className="text-sm text-gray-500">
            Your feedback helps us create better content for the Luna community.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ArticlePage;

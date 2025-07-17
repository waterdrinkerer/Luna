import { useNavigate, useParams } from "react-router-dom";




type ArticleData = {
  title: string;
  image: string;
  content: string;
};




const articleMap: Record<string, ArticleData> = {
    
    
  // Reproductive Health
  "Vaginal discharge color guide": {
    title: "Vaginal discharge color guide",
    image: "/assets/vaginal-discharge.png",
    content:
      "Vaginal discharge comes in many colors and textures—and most are completely normal. Clear or milky white discharge is common during ovulation or arousal. Yellow or green hues may signal infection, especially if there’s odor or irritation. Brown discharge might appear before or after your period. This guide helps you identify what’s healthy and what might need a doctor’s visit, empowering you to better understand your body’s natural cycles and recognize changes worth noting.",
  },
  "Early signs of pregnancy": {
    title: "Early signs of pregnancy",
    image: "/assets/early-pregnancy.png",
    content:
      "Wondering if you might be pregnant? Common early signs include fatigue, missed periods, breast tenderness, frequent urination, and mood changes. Some also experience nausea or food aversions within the first few weeks. Keep in mind, symptoms vary widely and can overlap with PMS. If you suspect pregnancy, a home test followed by a doctor’s visit is the best next step. Awareness of these signs can help you tune into what your body may be telling you.",
  },
  "Irregular periods explained": {
    title: "Irregular periods explained",
    image: "/assets/irregular-periods.png",
    content:
      "Irregular periods can be confusing and frustrating. They may stem from stress, weight fluctuations, hormonal imbalances, or conditions like PCOS. Some people experience occasional irregularity due to travel or lifestyle changes, while others may deal with consistently unpredictable cycles. It’s important to track patterns and consult a healthcare provider if irregularity becomes frequent. Understanding the possible causes can help you take better control of your cycle and overall reproductive health.",
  },
  "Understanding PCOS": {
    title: "Understanding PCOS",
    image: "/assets/pcos-info.png",
    content:
      "Polycystic Ovary Syndrome (PCOS) is a hormonal condition that affects 1 in 10 individuals with ovaries. Symptoms include irregular periods, acne, hair thinning, and difficulty with weight management. It may also affect fertility. Though the cause isn’t fully known, it involves insulin resistance and hormone imbalances. PCOS is manageable through lifestyle changes, medications, and regular monitoring. If you suspect PCOS, don’t hesitate to seek help—early diagnosis makes a big difference in managing symptoms.",
  },
  "Tracking cervical mucus": {
    title: "Tracking cervical mucus",
    image: "/assets/cervical-mucus.png",
    content:
      "Cervical mucus changes throughout your cycle, offering clues about your fertility window. After your period, mucus may be dry or sticky. As ovulation nears, it becomes creamy, then watery, and finally egg-white-like—a sign you’re at your most fertile. Tracking these shifts can improve your awareness of your cycle and help with conception or contraception. It’s an empowering, natural way to stay in tune with your body’s rhythm.",
  },

  // Tips & Tricks
  "How to reduce cramps naturally": {
    title: "How to reduce cramps naturally",
    image: "/assets/cramp-relief.png",
    content:
      "Cramps got you curled up in bed? Try these natural remedies. Apply a heating pad to relax muscles, drink herbal teas like chamomile or ginger, and do light stretches or yoga. Magnesium-rich foods such as dark leafy greens and bananas can also help ease discomfort. Avoid caffeine and processed foods during your period to minimize inflammation. Small changes can bring big relief—your body will thank you!",
  },
  "Foods to support your cycle": {
    title: "Foods to support your cycle",
    image: "/assets/cycle-foods.png",
    content:
      "Eating with your cycle can support hormonal balance and energy levels. During menstruation, focus on iron-rich foods like spinach and lentils. In the follicular phase, opt for fresh fruits and veggies to boost energy. Ovulation calls for zinc and B-vitamins—think eggs and whole grains. The luteal phase benefits from magnesium and healthy fats, like avocados and nuts. Nourish your body with intention, and it’ll respond with balance and strength.",
  },
  "Using heat therapy effectively": {
    title: "Using heat therapy effectively",
    image: "/assets/heat-therapy.png",
    content:
      "Heat therapy is a simple but effective way to soothe period cramps and muscle tension. Apply a heating pad to your lower abdomen for 15–20 minutes at a time. Warm baths with Epsom salts also relax the body and improve blood flow. Heat works by relaxing uterine muscles and reducing pain signals. It’s natural, safe, and often just as effective as over-the-counter meds when used consistently.",
  },
  "Comfortable period products": {
    title: "Comfortable period products",
    image: "/assets/period-products.png",
    content:
      "Choosing the right period product is key to comfort and confidence. Pads and tampons are classics, but menstrual cups, period panties, and reusable pads are eco-friendly alternatives worth exploring. Some people find soft discs more comfortable during sleep or workouts. What’s comfortable varies from person to person—try a few and listen to your body. There’s no one-size-fits-all, but there’s definitely a fit for you.",
  },
  "Period hacks for busy days": {
    title: "Period hacks for busy days",
    image: "/assets/period-hacks.png",
    content:
      "Juggling life during your period? Prep ahead! Keep spare products in your bag, wear dark comfy clothes, and schedule breaks for self-care. Use a tracking app to anticipate symptoms. Stay hydrated and snack on energizing foods like fruit or nuts. A portable heating patch can be a lifesaver during meetings or classes. With a little planning, even the busiest days can feel manageable.",
  },

  // Fertility
  "Fertility myths debunked": {
    title: "Fertility myths debunked",
    image: "/assets/fertility-myths.png",
    content:
      "Fertility comes with many myths—like needing to have sex daily or that birth control ruins fertility. In reality, timing matters more than frequency, and most regain fertility soon after stopping contraceptives. Age, health, and lifestyle play bigger roles. Don’t fall for internet rumors—trust science, your doctor, and your body. Clearing up misconceptions empowers smarter decisions on your journey to conception.",
  },
  "Ovulation signs to notice": {
    title: "Ovulation signs to notice",
    image: "/assets/ovulation-signs.png",
    content:
      "Ovulation is a key phase in your cycle when an egg is released. You may notice changes in cervical mucus (stretchy and clear), a slight rise in basal body temperature, or mild one-sided pelvic pain. Some also experience increased libido. These subtle clues can help you better understand your cycle, especially if you're trying to conceive or avoid pregnancy. Tracking them builds awareness and confidence in your reproductive health.",
  },
  "Boosting fertility with diet": {
    title: "Boosting fertility with diet",
    image: "/assets/fertility-diet.png",
    content:
      "Your diet can support or hinder fertility. Prioritize whole foods: leafy greens, berries, healthy fats, and lean proteins. Folate, iron, and omega-3s are essential. Limit sugar and trans fats, which may affect ovulation. Hydration and gut health also play a role, so include probiotics like yogurt or kimchi. While no food guarantees results, a balanced, nutrient-rich diet creates a strong foundation for reproductive health.",
  },
  "When to take a pregnancy test": {
    title: "When to take a pregnancy test",
    image: "/assets/pregnancy-test.png",
    content:
      "The best time to take a pregnancy test is after you’ve missed your period—typically around 10–14 days after ovulation. Testing too early may lead to inaccurate results. Use first morning urine for the highest concentration of hCG (the pregnancy hormone). If your cycle is irregular, wait a few extra days. Follow up with a doctor to confirm the results and discuss next steps for your health.",
  },
  "Fertility tracking tips": {
    title: "Fertility tracking tips",
    image: "/assets/fertility-tracking.png",
    content:
      "Tracking your fertility can feel overwhelming at first, but it gets easier with the right tools. Apps, basal thermometers, and ovulation predictor kits (OPKs) can help. Consistency is key—track your cycle, symptoms, and temperature daily. Watch for cervical mucus changes and try journaling patterns. Over time, you’ll notice trends that help you predict ovulation and understand your body better, whether you’re trying to conceive or not.",
  },

  // Self-care
  "Self-care during PMS": {
    title: "Self-care during PMS",
    image: "/assets/selfcare-pms.png",
    content:
      "PMS can bring mood swings, bloating, and irritability. Prioritize gentle self-care—take warm baths, journal your feelings, listen to calming music, or cozy up with a blanket and tea. Move your body gently with stretching or walking. Avoid overstimulation and say no to things that drain you. Creating a comforting space helps soothe both body and mind as hormones fluctuate.",
  },
  "Journaling for emotional health": {
    title: "Journaling for emotional health",
    image: "/assets/journaling.png",
    content:
      "Journaling offers a safe outlet to explore thoughts, emotions, and patterns. During your cycle, hormones can amplify feelings—writing them down helps process them. Try prompts like 'What am I feeling today?' or 'What does my body need right now?' No need for structure, just let your pen flow. Over time, journaling builds self-awareness and emotional resilience through all phases of your cycle.",
  },
  "Aromatherapy and cycles": {
    title: "Aromatherapy and cycles",
    image: "/assets/aromatherapy.png",
    content:
      "Aromatherapy uses plant-based oils to support mood and well-being. Lavender helps with anxiety and sleep, peppermint soothes headaches, and clary sage can ease cramps. Diffuse, apply diluted oil to pulse points, or add to a warm bath. Scents can trigger emotional memory and calm the nervous system. It’s a lovely, gentle way to support your cycle through sensory care.",
  },
  "Gentle yoga for cramps": {
    title: "Gentle yoga for cramps",
    image: "/assets/yoga-cramps.png",
    content:
      "When cramps hit, gentle yoga can be your best friend. Try poses like Child’s Pose, Cat-Cow, and Reclining Twist. These movements increase circulation and relax pelvic muscles. Focus on breathing deeply and moving slowly. Avoid intense inversions, and listen to your body’s cues. Even 10 minutes of mindful stretching can ease discomfort and bring emotional relief during your period.",
  },
  "Creating a cozy routine": {
    title: "Creating a cozy routine",
    image: "/assets/cozy-routine.png",
    content:
      "Your cycle is a great time to slow down and build comforting routines. Light a candle, make warm tea, put on soft clothes, and wind down with a book or gentle playlist. Creating cozy rituals reminds you to nurture yourself when energy dips. A consistent routine—even just 30 minutes a day—can improve sleep, mood, and overall sense of balance. You deserve that quiet time.",
  },

  // Mental Health
  "Period mood swings explained": {
    title: "Period mood swings explained",
    image: "/assets/mood-swings.png",
    content:
      "Mood swings during your cycle are tied to hormonal shifts—especially estrogen and progesterone. These changes affect brain chemicals like serotonin, impacting emotions. You may feel weepy, irritable, or anxious without clear reason. Knowing it's hormonal can bring relief. Self-kindness, rest, and good nutrition help. If mood changes are extreme, talk to a doctor—it might be PMDD. You're not alone, and your feelings are valid.",
  },
  "Managing stress during your cycle": {
    title: "Managing stress during your cycle",
    image: "/assets/stress-management.png",
    content:
      "Stress hits harder during certain cycle phases, especially PMS and menstruation. Try mindfulness practices like deep breathing, nature walks, or journaling. Nourish your body with grounding foods like oats, nuts, and warm soups. Simplify your schedule where possible and lean on support. Managing stress is a skill—and during your cycle, it's a necessity for balance and well-being.",
  },
  "The PMS-anxiety connection": {
    title: "The PMS-anxiety connection",
    image: "/assets/pms-anxiety.png",
    content:
      "Many experience heightened anxiety right before their period. It’s linked to the dip in progesterone and serotonin during the luteal phase. You may feel on edge, overwhelmed, or restless. Recognize it as a hormonal wave—not a personal failure. Grounding tools, magnesium-rich foods, and light movement can help regulate mood. If anxiety becomes unmanageable, consider seeking support—it’s okay to ask for help.",
  },
  "Grounding techniques": {
    title: "Grounding techniques",
    image: "/assets/grounding.png",
    content:
      "Grounding helps bring your awareness back to the present when emotions feel overwhelming. Try the 5-4-3-2-1 method: name five things you see, four you can touch, three you hear, two you smell, one you taste. Walking barefoot on grass, holding a cold object, or focusing on your breath also works. These small practices gently regulate the nervous system and calm anxiety.",
  },
  "Cycle syncing and emotions": {
    title: "Cycle syncing and emotions",
    image: "/assets/emotion-sync.png",
    content:
      "Your emotions ebb and flow with your cycle. During the follicular phase, energy and optimism rise. Ovulation brings social sparks, while the luteal phase may bring reflection and irritability. Menstruation invites introspection. Knowing these shifts helps you plan accordingly—like scheduling creative tasks post-period or quiet time during PMS. Syncing with your cycle is like learning your own emotional language.",
  },
};


const ArticlePage = () => {
  const { title } = useParams<{ title: string }>();
  const decoded = decodeURIComponent(title || "");
  const article = articleMap[decoded];
  const navigate = useNavigate();

  if (!article) {
    return <div className="p-4">Article not found.</div>;
  }

return (
  <div className="min-h-screen bg-[#F6F4FF] px-5 py-6">
    {/* Back Button */}
    <button
      onClick={() => navigate(-1)}
      className="mb-4 text-sm text-[#7E5FFF] font-medium flex items-center space-x-1"
    >
      <svg
        className="w-4 h-4"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        viewBox="0 0 24 24"
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
      </svg>
      <span>Back</span>
    </button>

    {/* Article Title & Content */}
    <h1 className="text-xl font-bold mb-4">{article.title}</h1>
    <img
      src={article.image}
      alt={article.title}
      className="w-full rounded-lg mb-4"
    />
    <p className="text-sm leading-relaxed text-gray-800 whitespace-pre-line">
      {article.content}
    </p>
  </div>
);

};

export default ArticlePage;

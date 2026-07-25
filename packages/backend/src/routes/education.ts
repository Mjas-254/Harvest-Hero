import { Router, Response } from "express";
import { body, validationResult } from "express-validator";
import { Reward, LearningProgress } from "../models/index.js";
import { authenticate, type AuthRequest } from "../middleware/auth.js";

const router = Router();

interface EducationArticle {
  id: string;
  title: string;
  category: "pests" | "diseases" | "best_practices" | "storage";
  crop: string;
  severity: "high" | "medium" | "low";
  icon: string;
  summary: string;
  signs: string[];
  prevention: string[];
  treatment: string[];
  tips: string[];
}

const knowledgeBase: EducationArticle[] = [
  {
    id: "fall_armyworm", title: "Fall Armyworm", category: "pests", crop: "Maize", severity: "high", icon: "🐛",
    summary: "The fall armyworm is the most destructive pest for maize in Africa. The larvae eat leaves, destroying up to 100% of a crop if not controlled early.",
    signs: ["Holes chewed in leaves (window-pane effect)", "Fresh green frass on leaves or in whorl", "Eggs laid in clusters on the underside of leaves", "Damaged maize whorl with ragged leaves"],
    prevention: ["Plant early at the start of the rainy season", "Use push-pull technology (plant Desmodium between rows)", "Rotate crops — do not plant maize on the same land consecutively", "Keep the farm clean of weeds that harbour the pest", "Use resistant/early-maturing maize varieties"],
    treatment: ["Apply neem extract spray (blend 5kg neem seeds with 50L water, strain and spray)", "Use biological control: Trichogramma egg parasitoids if available", "Apply biopesticides (e.g., Beauveria bassiana) to the whorl", "Hand-pick larvae early in the morning when they are active", "As a last resort, use synthetic pesticides (e.g., Lambda-cyhalothrin) following label instructions"],
    tips: ["Check your maize field twice a week during the growing season", "Treat when you see 2-3 larvae per plant", "Spray in the evening when larvae are most active", "Focus spray into the whorl (central funnel) of the plant"],
  },
  {
    id: "stem_borer", title: "Stem Borer", category: "pests", crop: "Maize, Sorghum, Rice", severity: "high", icon: "🪲",
    summary: "Stem borers tunnel into plant stems, weakening them and reducing yield. They are a major constraint across sub-Saharan Africa.",
    signs: ["Small holes on stems with frass oozing out", "Dead heart — central shoot turns white and dies", "Stem breakage during wind or rain", "Larvae visible inside split stems"],
    prevention: ["Plant early to avoid peak borer populations", "Intercrop with Desmodium (push-pull system)", "Remove and destroy crop residues after harvest", "Use resistant varieties where available", "Practice crop rotation"],
    treatment: ["Apply neem kernel extract spray to the stems", "Release Trichogramma wasps for biological control", "Use pheromone traps to monitor adult moth populations", "In severe cases, apply systemic insecticide as a seed treatment", "Cut and destroy heavily infested stems to kill larvae inside"],
    tips: ["Early detection is key — check stems weekly", "Dead heart symptoms appear 2-3 weeks after infestation", "Combine push-pull with early planting for best protection"],
  },
  {
    id: "aphids", title: "Aphids (Green Black Fly)", category: "pests", crop: "Cassava, Beans, Vegetables", severity: "medium", icon: "🦟",
    summary: "Aphids are tiny sap-sucking insects that weaken plants and spread viral diseases. They multiply rapidly in dry conditions.",
    signs: ["Clusters of tiny green, black, or white insects on stems and leaf undersides", "Sticky honeydew substance on leaves", "Yellowing and curling of leaves", "Stunted plant growth", "Sooty mould growing on honeydew"],
    prevention: ["Plant companion plants like basil, marigold, or garlic nearby", "Maintain good plant spacing for air circulation", "Avoid over-fertilising with nitrogen", "Encourage natural predators: ladybirds, lacewings"],
    treatment: ["Spray strong jet of water to knock them off", "Apply neem oil spray (20ml neem oil + 5ml liquid soap per litre of water)", "Use a soap water spray (50g local soap dissolved in 20L water)", "Release ladybird beetles if available", "For severe infestations, use systemic insecticide as a last resort"],
    tips: ["Check plants early morning when aphids are most visible", "Aphids spread cassava mosaic virus — controlling them protects against disease", "Treat ant trails too, as ants protect aphids from predators"],
  },
  {
    id: "locusts_grasshoppers", title: "Locusts & Grasshoppers", category: "pests", crop: "All Crops", severity: "high", icon: "🦗",
    summary: "Locust swarms can devastate entire farms in hours. Even isolated grasshoppers cause significant leaf damage to young crops.",
    signs: ["Large areas of leaves eaten overnight", "Visible swarms or groups of insects in the field", "Droppings on leaves and ground", "Ragged leaf edges and stripped stems"],
    prevention: ["Monitor surrounding areas for early signs of swarming", "Maintain clean borders around the farm", "Plant early to establish strong crops before locust season", "Keep in touch with local agricultural extension for alerts"],
    treatment: ["Apply wood ash mixed with water (1kg ash in 10L water) to deter them", "Spray neem-based formulations for smaller infestations", "For swarms, contact the national locust control organisation immediately", "Use pheromone-baited traps around field borders", "Encourage natural predators: birds, toads, and hedgehogs"],
    tips: ["Act immediately — locusts can consume their body weight in food daily", "Early morning spraying is most effective when insects are sluggish", "Report unusual swarms to your district agricultural office"],
  },
  {
    id: "cassava_mosaic", title: "Cassava Mosaic Disease (CMD)", category: "diseases", crop: "Cassava", severity: "high", icon: "🍂",
    summary: "CMD is spread by whiteflies and causes mosaic patterns on cassava leaves, drastically reducing root yield.",
    signs: ["Mosaic pattern: alternating light green and dark green patches on leaves", "Leaf distortion — leaves become crinkled or twisted", "Stunted plant growth", "Reduced root size and quality", "Severe cases: complete chlorosis of leaves"],
    prevention: ["Plant CMD-resistant varieties (NAROCASS 1, NASE 14, etc.)", "Use disease-free stem cuttings from healthy plants", "Control whitefly populations with neem sprays", "Rogue (remove) infected plants early", "Do not interplant old and new cassava fields"],
    treatment: ["There is no cure — remove and destroy severely infected plants", "For mild infections: remove affected leaves and spray neem extract", "Plant resistant varieties for next season", "Apply wood ash around plants to deter whiteflies", "Consider uprooting and replanting with resistant variety if >50% infected"],
    tips: ["Choose your planting material carefully — healthy stems = healthy crop", "CMD-resistant varieties can still get infected but show only mild symptoms", "Spread decreases after 12 months — older plants tolerate CMD better", "Combine CMD control with whitefly management for best results"],
  },
  {
    id: "maize_lethal_necrosis", title: "Maize Lethal Necrosis (MLN)", category: "diseases", crop: "Maize", severity: "high", icon: "💀",
    summary: "MLN causes rapid death of maize plants. It is caused by a combination of two viruses spread by aphids and thrips.",
    signs: ["Chlorotic (yellow) bands or spots on leaves", "Necrotic lesions that spread rapidly", "Premature drying and death of the plant", "Cob rot — ears may rot before maturity", "Rapid wilting starting from the leaf tips"],
    prevention: ["Use MLN-resistant/tolerant hybrids", "Control insect vectors with neem sprays", "Plant early to avoid peak virus transmission periods", "Practice crop rotation — at least one season without maize", "Remove and destroy infected crop residues after harvest"],
    treatment: ["No cure exists — prevention is the only strategy", "Remove and burn infected plants immediately", "Control aphids and thrips to slow virus transmission", "Apply foliar feeds to support plant health", "Report outbreaks to your local agricultural extension officer"],
    tips: ["MLN is most severe in areas where maize is grown continuously", "Intercropping with legumes reduces virus spread", "Check seed packages for MLN tolerance ratings before buying"],
  },
  {
    id: "brown_spot_rice", title: "Brown Spot (Rice)", category: "diseases", crop: "Rice", severity: "medium", icon: "🟤",
    summary: "Brown spot causes oval brown lesions on rice leaves and grains, reducing yield and quality.",
    signs: ["Oval-shaped brown spots with yellow halos on leaves", "Spots on leaf sheaths and grains", "Premature leaf drying", "Discoloured, chalky grains"],
    prevention: ["Ensure proper soil nutrition — especially potassium", "Use certified, disease-free seed", "Maintain proper water management", "Balance nitrogen fertiliser use", "Dry seeds properly before storage"],
    treatment: ["Apply balanced fertiliser (NPK) to strengthen plants", "Spray copper-based fungicide in early stages", "Remove and destroy infected plant debris", "Ensure adequate water supply to reduce plant stress", "Treat seeds with hot water (52°C for 10 minutes) before planting"],
    tips: ["Brown spot is often a sign of poor soil health — test your soil", "Healthy, well-nourished plants resist brown spot much better", "Good water management prevents 80% of rice diseases"],
  },
  {
    id: "blight", title: "Bacterial & Fungal Blight", category: "diseases", crop: "Beans, Vegetables, Tomatoes", severity: "medium", icon: "🦠",
    summary: "Blight causes rapid tissue death in leaves, stems, and fruit. It spreads fast in wet conditions.",
    signs: ["Water-soaked patches on leaves that turn brown/black rapidly", "Bacterial ooze on cut stems in morning", "Fruit/bean pods turn dark and rot", "Rapid wilting of whole branches", "Leaf margins turn brown and dry out"],
    prevention: ["Use certified disease-free seeds", "Ensure good air circulation — proper plant spacing", "Water at the base of plants, not overhead", "Rotate crops", "Remove plant debris after harvest"],
    treatment: ["Remove and burn infected plants immediately", "Spray copper-based fungicide (Bordeaux mixture) on surrounding plants", "Apply wood ash around plant bases", "Avoid working in wet fields", "Use copper soap spray (5g copper sulphate + 25g soap in 5L water)"],
    tips: ["Act within 24 hours of seeing symptoms — blight spreads extremely fast", "Morning dew is the best time to identify blight", "Never compost diseased plant material"],
  },
  {
    id: "soil_health", title: "Building Healthy Soil", category: "best_practices", crop: "All Crops", severity: "low", icon: "🌍",
    summary: "Healthy soil is the foundation of a productive farm. Good soil management improves yields, reduces disease, and saves money on fertiliser.",
    signs: ["Dark, crumbly soil with earthworms = healthy soil", "Hard, compacted, or grey-coloured soil = poor health", "Poor water infiltration", "Low crop yields despite good rainfall"],
    prevention: ["Add compost or well-rotted manure every season (2-3 tonnes per hectare)", "Practice crop rotation — alternate cereals with legumes", "Grow cover crops (Desmodium, mucuna) during fallow periods", "Minimise soil disturbance", "Keep soil covered with mulch to prevent erosion"],
    treatment: ["Test your soil through the local agricultural office", "Add lime if soil is too acidic", "Apply organic matter: compost, animal manure, or crop residues", "Plant nitrogen-fixing legumes to improve soil nitrogen", "Build terraces or contour bunds on slopes to prevent erosion"],
    tips: ["A handful of healthy soil should smell fresh and contain visible life", "Soil improvement is a long-term investment", "Start small: improve a portion of your land each season", "Free soil testing is often available through your district agricultural office"],
  },
  {
    id: "water_management", title: "Water & Irrigation Tips", category: "best_practices", crop: "All Crops", severity: "low", icon: "💧",
    summary: "Proper water management is critical. Both too much and too little water harm crops.",
    signs: ["Yellowing lower leaves = over-watering or waterlogging", "Wilting in the afternoon even with recent rain = under-watering", "Stunted growth during dry spells", "Root rot from standing water"],
    prevention: ["Mulch around plants to retain soil moisture", "Water in the early morning or late evening", "Create drainage channels to prevent waterlogging", "Plant on raised beds in areas prone to flooding", "Collect rainwater during wet season"],
    treatment: ["For drought stress: deep watering at the base of plants", "For waterlogging: open drainage channels immediately", "Apply mulch 5-10cm thick around plants", "Consider simple drip irrigation (plastic bottles with holes) for vegetables", "Plant drought-tolerant varieties in dry areas"],
    tips: ["Most crops need 25-50mm of water per week during growing season", "Check soil moisture by pushing your finger 5cm into the soil", "Drip irrigation uses 50% less water than overhead sprinklers", "Simple rainwater harvesting can provide water for dry-season gardens"],
  },
  {
    id: "post_harvest", title: "Post-Harvest Storage & Handling", category: "storage", crop: "All Crops", severity: "medium", icon: "🏚️",
    summary: "Up to 40% of harvested crops are lost after harvest due to poor storage. Good storage practices protect your income.",
    signs: ["Grain weevils or insects in stored grain", "Mouldy or discoloured produce", "Musty smell from storage containers", "Sprouting in stored grain", "Rats or birds accessing stored produce"],
    prevention: ["Dry produce thoroughly before storage (maize to 13% moisture, beans to 10%)", "Use hermetic storage bags (PICS bags)", "Store on raised platforms, not directly on the ground", "Keep storage area clean, dry, and well-ventilated", "Use locally available protectants: ash, neem leaf powder"],
    treatment: ["For insect-infested grain: sun-dry for 3-4 days, then sieve and repackage", "Mix grain with wood ash (1 cup ash per 10 cups grain)", "Use neem leaf powder sprinkled between grain layers", "Fumigate with dried chilli peppers (burn and smoke the storage area)", "Transfer immediately to PICS hermetic bags if insects are found"],
    tips: ["PICS bags cost about GHs 10-15 and store 100kg for 6+ months", "Label all storage containers with date and type of produce", "First in, first out — use older stock before newer stock", "Check stored grain weekly for signs of insect activity"],
  },
  {
    id: "fertiliser_guide", title: "Smart Fertiliser Use", category: "best_practices", crop: "All Crops", severity: "low", icon: "🧪",
    summary: "Using the right fertiliser at the right time and rate maximises yield while saving money.",
    signs: ["Pale yellow leaves = nitrogen deficiency", "Purple/reddish leaf colour = phosphorus deficiency", "Brown leaf edges = potassium deficiency", "Small, deformed fruits = calcium or boron deficiency"],
    prevention: ["Get a soil test before applying fertiliser", "Incorporate organic matter to improve nutrient retention", "Apply fertiliser at the right growth stage", "Use micro-dosing: small amounts placed near each plant", "Combine organic and mineral fertilisers for best results"],
    treatment: ["For nitrogen deficiency: apply urea or CAN as top-dress at 3-4 weeks", "For phosphorus deficiency: apply DAP or TSP at planting", "For potassium deficiency: apply MOP at planting or early growth", "Micro-dosing: 1 teaspoon of DAP per planting hole", "Always apply fertiliser to moist soil (after rain or irrigation)"],
    tips: ["Micro-dosing uses 90% less fertiliser than broadcast application", "DAP at planting + Urea as top-dress is the most common combination for maize", "Never mix fertiliser with seeds directly — it can burn them", "Store fertiliser in a dry, sealed container away from moisture"],
  },
  {
    id: "companion_planting", title: "Companion Planting Guide", category: "best_practices", crop: "All Crops", severity: "low", icon: "🌿",
    summary: "Growing certain plants together can naturally repel pests, improve soil health, and increase farm productivity.",
    signs: ["Companion planting prevents problems before they start", "Intercropping increases total yield per area", "Some plant combinations naturally repel pests", "Legumes add nitrogen that benefits neighbouring crops"],
    prevention: ["Plant Desmodium between maize rows (push-pull system)", "Interplant beans or groundnuts with maize", "Plant marigold around vegetable plots to repel nematodes", "Grow basil near tomatoes to repel aphids", "Use Napier grass as a border crop to trap stem borers"],
    treatment: ["If pests are already present, combine intercropping with sprays", "Use the push-pull system: Desmodium between rows + Napier grass border", "Plant fast-maturing crops between slow-maturing ones for continuous income", "Use legume cover crops to restore exhausted soil"],
    tips: ["Push-pull technology can double your maize yield while reducing pest damage", "Desmodium is also excellent animal fodder — dual purpose", "Start small: try companion planting on one section of your farm first", "Your agricultural extension officer can help you set up a push-pull system"],
  },
];

// ===== ARTICLE LISTING =====
router.get("/", (req, res) => {
  const { category, crop, search } = req.query;
  let articles = [...knowledgeBase];
  if (category && typeof category === "string") articles = articles.filter((a) => a.category === category);
  if (crop && typeof crop === "string") articles = articles.filter((a) => a.crop.toLowerCase().includes(crop.toLowerCase()));
  if (search && typeof search === "string") {
    const lower = search.toLowerCase();
    articles = articles.filter((a) =>
      a.title.toLowerCase().includes(lower) || a.summary.toLowerCase().includes(lower) ||
      a.signs.some((s) => s.toLowerCase().includes(lower)) || a.treatment.some((t) => t.toLowerCase().includes(lower))
    );
  }
  res.json({
    success: true,
    data: articles.map(({ id, title, category, crop, severity, icon, summary }) => ({ id, title, category, crop, severity, icon, summary })),
    total: articles.length,
  });
});

router.get("/categories", (_req, res) => {
  res.json({
    success: true,
    data: [
      { id: "pests", label: "Pests", icon: "🐛", description: "Identify and control farm pests" },
      { id: "diseases", label: "Diseases", icon: "🦠", description: "Recognise and manage crop diseases" },
      { id: "best_practices", label: "Best Practices", icon: "🌾", description: "Tips for healthier, more productive farms" },
      { id: "storage", label: "Storage", icon: "🏚️", description: "Protect your harvest after picking" },
    ],
  });
});

router.get("/progress/me", authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const farmerId = req.user!._id;
    const allProgress = await LearningProgress.find({ farmerId });
    const completedIds = allProgress.filter((p: any) => p.completed).map((p: any) => p.articleId);
    const totalArticles = knowledgeBase.length;
    const completed = completedIds.length;

    res.json({
      success: true,
      data: { completedIds, completed, totalArticles, percentage: totalArticles > 0 ? Math.round((completed / totalArticles) * 100) : 0 },
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to get progress" });
  }
});

router.post(
  "/progress/complete",
  authenticate,
  [body("articleId").trim().notEmpty().withMessage("Article ID is required")],
  async (req: AuthRequest, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ error: "Validation failed", details: errors.array() });
      return;
    }
    try {
      const farmerId = req.user!._id;
      const { articleId } = req.body;
      const article = knowledgeBase.find((a) => a.id === articleId);
      if (!article) { res.status(404).json({ error: "Article not found" }); return; }

      const existing = await LearningProgress.findOne({ farmerId, articleId, completed: true });
      if (existing) { res.json({ success: true, message: "Already completed", pointsEarned: 0 }); return; }

      await LearningProgress.create({ farmerId, articleId, completed: true });

      const LEARN_POINTS = 5;
      await Reward.create({
        farmerId, harvestId: "education", rewardType: "streak_bonus",
        points: LEARN_POINTS, status: "minted", mintedAt: new Date(),
      });

      res.json({ success: true, message: "Article completed", pointsEarned: LEARN_POINTS });
    } catch (error) {
      console.error("Complete article error:", error);
      res.status(500).json({ error: "Failed to mark as complete" });
    }
  }
);

// ===== FARM ADVISORY =====
router.post(
  "/guide",
  authenticate,
  [body("crop").trim().notEmpty().withMessage("Crop is required"), body("problem").trim().notEmpty().withMessage("Please describe your problem")],
  async (req: AuthRequest, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) { res.status(400).json({ error: "Validation failed", details: errors.array() }); return; }
    try {
      const { crop, problem, season } = req.body;
      const problemLower = (problem || "").toLowerCase();
      const cropLower = (crop || "").toLowerCase();

      const scored = knowledgeBase.map((article) => {
        let score = 0;
        if (article.crop.toLowerCase() === "all crops") score += 2;
        else if (article.crop.toLowerCase().includes(cropLower)) score += 5;
        const allText = [...article.signs, ...article.treatment, ...article.prevention, ...article.tips, article.summary, article.title].join(" ").toLowerCase();
        const keywords = problemLower.split(/\s+/).filter((w: string) => w.length > 3);
        for (const kw of keywords) { if (allText.includes(kw)) score += 3; if (article.title.toLowerCase().includes(kw)) score += 2; }
        if (article.severity === "high") score += 1;
        return { article, score };
      });

      scored.sort((a, b) => b.score - a.score);
      const topMatches = scored.filter((s) => s.score > 2).slice(0, 3);

      const recommendations = topMatches.map(({ article, score }) => ({
        id: article.id, title: article.title, icon: article.icon, crop: article.crop,
        severity: article.severity, relevance: score > 10 ? "high" : score > 5 ? "medium" : "low",
        summary: article.summary, quickAction: article.treatment[0] || article.prevention[0] || "",
        signs: article.signs.slice(0, 3),
      }));

      let advice = "";
      if (recommendations.length === 0) {
        advice = `We could not find specific guidance for "${problem}" on ${crop}. Try describing the symptoms you see on your plants (e.g., yellow leaves, holes in leaves, wilting). You can also visit your local agricultural extension officer for help.`;
      } else if (recommendations.length === 1) {
        advice = `Based on what you described, this looks like it could be ${recommendations[0].title}. Here is what you should do:`;
      } else {
        advice = `We found ${recommendations.length} possible causes for what you are seeing on your ${crop}. Review each one to find the best match:`;
      }

      res.json({
        success: true,
        data: { crop, problem, advice, recommendations, seasonalTips: getSeasonalTips(season || ""),
          disclaimer: "This is an automated advisory. For serious crop problems, always consult your local agricultural extension officer." },
      });
    } catch (error) {
      console.error("Guide error:", error);
      res.status(500).json({ error: "Failed to generate advice" });
    }
  }
);

function getSeasonalTips(season: string): string[] {
  const s = season.toLowerCase();
  if (s.includes("rain") || s.includes("wet")) return ["Watch for fungal diseases — ensure good drainage", "Monitor for fall armyworm weekly", "Apply fertiliser early when rain starts", "Harvest and dry crops quickly when rains end"];
  if (s.includes("dry") || s.includes("harmattan")) return ["Water crops early morning to reduce evaporation", "Apply thick mulch around plants to retain moisture", "Store harvested crops in hermetic bags", "Plan for the next season: prepare seeds and inputs now"];
  return ["Check your crops twice a week for pests and diseases", "Keep your farm clean — remove weeds and crop residues", "Store harvested produce properly to avoid post-harvest losses", "Talk to your neighbours — shared pest management works better"];
}

router.get("/:id", (req, res) => {
  const article = knowledgeBase.find((a) => a.id === req.params.id);
  if (!article) { res.status(404).json({ error: "Article not found" }); return; }
  res.json({ success: true, data: article });
});

export default router;

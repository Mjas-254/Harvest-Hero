"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/lib/AuthContext";
import { api } from "@/lib/api";
import Card from "@/components/Card";
import Button from "@/components/Button";
import { Search, ArrowLeft, AlertTriangle, CheckCircle2, Lightbulb, ChevronRight, Award, BookOpen, Brain } from "lucide-react";

interface ArticleSummary {
  id: string;
  title: string;
  category: string;
  crop: string;
  severity: "high" | "medium" | "low";
  icon: string;
  summary: string;
}

interface ArticleDetail extends ArticleSummary {
  signs: string[];
  prevention: string[];
  treatment: string[];
  tips: string[];
}

interface Category {
  id: string;
  label: string;
  icon: string;
  description: string;
}

interface LearningProgressData {
  completedIds: string[];
  completed: number;
  totalArticles: number;
  percentage: number;
}

interface GuideRecommendation {
  id: string;
  title: string;
  icon: string;
  crop: string;
  severity: "high" | "medium" | "low";
  relevance: "high" | "medium" | "low";
  summary: string;
  quickAction: string;
  signs: string[];
}

const SEVERITY_COLORS = {
  high: "bg-red-100 text-red-700",
  medium: "bg-yellow-100 text-yellow-700",
  low: "bg-green-100 text-green-700",
};

const CATEGORY_COLORS: Record<string, string> = {
  pests: "from-red-500 to-red-600",
  diseases: "from-purple-500 to-purple-600",
  best_practices: "from-emerald-500 to-emerald-600",
  storage: "from-amber-500 to-amber-600",
};

type Tab = "learn" | "advisory" | "progress";

export default function EducationPage() {
  const { token } = useAuth();
  const [tab, setTab] = useState<Tab>("learn");
  const [categories, setCategories] = useState<Category[]>([]);
  const [articles, setArticles] = useState<ArticleSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedArticle, setSelectedArticle] = useState<ArticleDetail | null>(null);
  const [search, setSearch] = useState("");
  const [completedIds, setCompletedIds] = useState<string[]>([]);
  const [completingArticle, setCompletingArticle] = useState(false);
  const [completedMessage, setCompletedMessage] = useState("");

  // Advisory form
  const [advisoryCrop, setAdvisoryCrop] = useState("");
  const [advisoryProblem, setAdvisoryProblem] = useState("");
  const [advisorySeason, setAdvisorySeason] = useState("");
  const [advisoryLoading, setAdvisoryLoading] = useState(false);
  const [advisoryResult, setAdvisoryResult] = useState<{
    advice: string;
    recommendations: GuideRecommendation[];
    seasonalTips: string[];
    disclaimer: string;
  } | null>(null);

  const loadProgress = useCallback(async () => {
    if (!token) return;
    try {
      const res = await api<{ data: LearningProgressData }>("/education/progress/me", { token });
      setCompletedIds(res.data.completedIds);
    } catch {}
  }, [token]);

  useEffect(() => {
    if (!token) return;
    Promise.all([
      api<{ data: Category[] }>("/education/categories", { token }),
      api<{ data: ArticleSummary[] }>("/education", { token }),
      api<{ data: LearningProgressData }>("/education/progress/me", { token }),
    ])
      .then(([catRes, artRes, progRes]) => {
        setCategories(catRes.data);
        setArticles(artRes.data);
        setCompletedIds(progRes.data.completedIds);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [token]);

  const fetchArticles = (category?: string, query?: string) => {
    if (!token) return;
    setLoading(true);
    let url = "/education?";
    if (category) url += `category=${category}&`;
    if (query) url += `search=${encodeURIComponent(query)}&`;
    api<{ data: ArticleSummary[] }>(url, { token })
      .then((res) => setArticles(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  const handleCategoryClick = (catId: string) => {
    const next = selectedCategory === catId ? null : catId;
    setSelectedCategory(next);
    setSelectedArticle(null);
    fetchArticles(next || undefined, search || undefined);
  };

  const handleSearch = (value: string) => {
    setSearch(value);
    fetchArticles(selectedCategory || undefined, value || undefined);
  };

  const openArticle = async (id: string) => {
    if (!token) return;
    try {
      const res = await api<{ data: ArticleDetail }>(`/education/${id}`, { token });
      setSelectedArticle(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const markAsComplete = async (articleId: string) => {
    if (!token || completingArticle) return;
    setCompletingArticle(true);
    setCompletedMessage("");
    try {
      const res = await api<{ success: boolean; message: string; pointsEarned: number }>("/education/progress/complete", {
        token,
        method: "POST",
        body: { articleId },
      });
      setCompletedIds((prev) => [...prev, articleId]);
      setCompletedMessage(`+${res.pointsEarned} points earned!`);
      setTimeout(() => setCompletedMessage(""), 4000);
    } catch (err) {
      console.error(err);
    } finally {
      setCompletingArticle(false);
    }
  };

  const handleAdvisory = async () => {
    if (!token || !advisoryCrop.trim() || !advisoryProblem.trim()) return;
    setAdvisoryLoading(true);
    setAdvisoryResult(null);
    try {
      const res = await api<{ data: typeof advisoryResult }>("/education/guide", {
        token,
        method: "POST",
        body: { crop: advisoryCrop, problem: advisoryProblem, season: advisorySeason },
      });
      setAdvisoryResult(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setAdvisoryLoading(false);
    }
  };

  const RELEVANCE_COLORS: Record<string, string> = {
    high: "border-l-red-500 bg-red-50/50",
    medium: "border-l-yellow-500 bg-yellow-50/50",
    low: "border-l-green-500 bg-green-50/50",
  };

  // Article detail view
  if (selectedArticle) {
    const a = selectedArticle;
    const isComplete = completedIds.includes(a.id);
    return (
      <div className="max-w-lg mx-auto px-4 py-6 space-y-4">
        <div className="flex items-center justify-between">
          <button
            onClick={() => setSelectedArticle(null)}
            className="flex items-center gap-1 text-harvest-600 font-semibold text-sm"
          >
            <ArrowLeft size={16} />
            Back to articles
          </button>
          <div className="flex items-center gap-1">
            {isComplete && (
              <span className="flex items-center gap-1 text-xs font-semibold text-green-600 bg-green-50 px-2 py-1 rounded-full">
                <CheckCircle2 size={12} /> Learned
              </span>
            )}
          </div>
        </div>

        <div className="flex items-start gap-3">
          <span className="text-4xl">{a.icon}</span>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900">{a.title}</h1>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-sm text-gray-500">{a.crop}</span>
              <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${SEVERITY_COLORS[a.severity]}`}>
                {a.severity === "high" ? "Serious" : a.severity === "medium" ? "Moderate" : "Low Risk"}
              </span>
            </div>
          </div>
        </div>

        <Card className="bg-gray-50 border-gray-200">
          <p className="text-gray-700 text-sm leading-relaxed">{a.summary}</p>
        </Card>

        {/* Mark as Learned button */}
        {!isComplete && (
          <button
            onClick={() => markAsComplete(a.id)}
            disabled={completingArticle}
            className="w-full bg-harvest-600 hover:bg-harvest-700 disabled:opacity-50 text-white font-semibold py-3 px-4 rounded-xl transition-colors flex items-center justify-center gap-2"
          >
            {completingArticle ? (
              <span className="animate-pulse">Saving...</span>
            ) : (
              <>
                <Award size={18} />
                Mark as Learned (+5 points)
              </>
            )}
          </button>
        )}
        {completedMessage && (
          <div className="bg-green-50 border border-green-200 text-green-700 text-center py-2 px-4 rounded-xl text-sm font-semibold animate-pulse">
            {completedMessage}
          </div>
        )}

        {/* Signs */}
        <Card>
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle size={18} className="text-yellow-500" />
            <h2 className="font-bold text-gray-900">How to Recognise</h2>
          </div>
          <ul className="space-y-2">
            {a.signs.map((sign, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                <span className="text-yellow-400 mt-0.5">•</span>
                {sign}
              </li>
            ))}
          </ul>
        </Card>

        {/* Prevention */}
        <Card>
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle2 size={18} className="text-green-500" />
            <h2 className="font-bold text-gray-900">Prevention</h2>
          </div>
          <ul className="space-y-2">
            {a.prevention.map((item, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                <span className="text-green-400 mt-0.5">✓</span>
                {item}
              </li>
            ))}
          </ul>
        </Card>

        {/* Treatment */}
        <Card>
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle size={18} className="text-red-500" />
            <h2 className="font-bold text-gray-900">Treatment</h2>
          </div>
          <ul className="space-y-2">
            {a.treatment.map((item, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                <span className="text-red-400 mt-0.5">→</span>
                {item}
              </li>
            ))}
          </ul>
        </Card>

        {/* Tips */}
        <Card className="bg-harvest-50 border-harvest-200">
          <div className="flex items-center gap-2 mb-3">
            <Lightbulb size={18} className="text-harvest-600" />
            <h2 className="font-bold text-harvest-800">Pro Tips</h2>
          </div>
          <ul className="space-y-2">
            {a.tips.map((tip, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-harvest-700">
                <span className="text-harvest-400 mt-0.5">💡</span>
                {tip}
              </li>
            ))}
          </ul>
        </Card>

        <div className="h-4" />
      </div>
    );
  }

  if (loading && categories.length === 0) {
    return (
      <div className="max-w-lg mx-auto px-4 py-20 text-center">
        <div className="text-4xl mb-4 animate-pulse">📚</div>
        <p className="text-gray-500">Loading farm guide...</p>
      </div>
    );
  }

  // === MAIN VIEW (with tabs) ===
  return (
    <div className="max-w-lg mx-auto px-4 py-6 space-y-5">
      {/* Tab Bar */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
        {([["learn", "Learn", BookOpen], ["advisory", "Get Advice", Brain], ["progress", "My Progress", Award]] as const).map(([id, label, Icon]) => (
          <button
            key={id}
            onClick={() => { setTab(id); setSelectedCategory(null); setSelectedArticle(null); }}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-sm font-semibold transition-colors ${
              tab === id ? "bg-white text-harvest-700 shadow-sm" : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <Icon size={16} />
            {label}
          </button>
        ))}
      </div>

      {/* ===== LEARN TAB ===== */}
      {tab === "learn" && (
        <>
          <div className="relative">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search pests, diseases, tips..."
              value={search}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-xl border-2 border-gray-200 focus:border-harvest-500 transition-colors outline-none text-sm"
            />
          </div>

          {!selectedCategory && (
            <div className="grid grid-cols-2 gap-3">
              {categories.map((cat) => {
                const catArticleIds = articles.filter((a) => a.category === cat.id).map((a) => a.id);
                const learnedCount = catArticleIds.filter((id) => completedIds.includes(id)).length;
                return (
                  <button
                    key={cat.id}
                    onClick={() => handleCategoryClick(cat.id)}
                    className={`bg-gradient-to-br ${CATEGORY_COLORS[cat.id] || "from-gray-500 to-gray-600"} text-white rounded-2xl p-4 text-left active:scale-95 transition-transform`}
                  >
                    <span className="text-3xl block mb-2">{cat.icon}</span>
                    <p className="font-bold text-lg">{cat.label}</p>
                    <p className="text-white/80 text-xs mt-1">{cat.description}</p>
                    {learnedCount > 0 && (
                      <p className="text-white/60 text-[11px] mt-2 font-medium">
                        {learnedCount}/{catArticleIds.length} learned
                      </p>
                    )}
                  </button>
                );
              })}
            </div>
          )}

          {selectedCategory && (
            <div className="flex items-center gap-2">
              <button onClick={() => handleCategoryClick(selectedCategory)} className="p-2 hover:bg-gray-100 rounded-lg">
                <ArrowLeft size={18} />
              </button>
              <h2 className="text-lg font-bold text-gray-900">
                {categories.find((c) => c.id === selectedCategory)?.icon}{" "}
                {categories.find((c) => c.id === selectedCategory)?.label}
              </h2>
              <span className="text-sm text-gray-400 ml-auto">{articles.length} articles</span>
            </div>
          )}

          <div className="space-y-3">
            {articles.length === 0 && !loading ? (
              <Card className="text-center py-8">
                <p className="text-gray-400 text-lg mb-2">No articles found</p>
                <p className="text-gray-400 text-sm">Try a different search or category</p>
              </Card>
            ) : (
              articles.map((a) => {
                const learned = completedIds.includes(a.id);
                return (
                  <button key={a.id} onClick={() => openArticle(a.id)} className="w-full text-left">
                    <Card className="active:bg-gray-50 transition-colors">
                      <div className="flex items-start gap-3">
                        <span className="text-2xl mt-0.5">{a.icon}</span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h3 className="font-bold text-gray-900 truncate">{a.title}</h3>
                            <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase shrink-0 ${SEVERITY_COLORS[a.severity]}`}>
                              {a.severity}
                            </span>
                          </div>
                          <p className="text-xs text-gray-400 mt-0.5">{a.crop}</p>
                          <p className="text-sm text-gray-500 mt-1 line-clamp-2">{a.summary}</p>
                        </div>
                        <div className="flex flex-col items-center gap-1 shrink-0">
                          {learned && <CheckCircle2 size={16} className="text-green-500" />}
                          <ChevronRight size={18} className="text-gray-300" />
                        </div>
                      </div>
                    </Card>
                  </button>
                );
              })
            )}
          </div>
        </>
      )}

      {/* ===== ADVISORY TAB ===== */}
      {tab === "advisory" && (
        <>
          <Card>
            <div className="flex items-center gap-2 mb-4">
              <Brain size={20} className="text-harvest-600" />
              <h2 className="font-bold text-gray-900 text-lg">Farm Advisory</h2>
            </div>
            <p className="text-gray-500 text-sm mb-4">
              Describe what is happening on your farm and get personalised recommendations from our knowledge base.
            </p>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-gray-700 mb-1 block">What are you growing?</label>
                <input
                  type="text"
                  placeholder="e.g. Maize, Cassava, Tomatoes..."
                  value={advisoryCrop}
                  onChange={(e) => setAdvisoryCrop(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-harvest-500 transition-colors outline-none text-sm"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-700 mb-1 block">What are you seeing?</label>
                <textarea
                  placeholder="Describe the problem — e.g. yellow leaves, small holes in leaves, wilting plants..."
                  value={advisoryProblem}
                  onChange={(e) => setAdvisoryProblem(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-harvest-500 transition-colors outline-none text-sm resize-none"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-700 mb-1 block">Season (optional)</label>
                <select
                  value={advisorySeason}
                  onChange={(e) => setAdvisorySeason(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-harvest-500 transition-colors outline-none text-sm bg-white"
                >
                  <option value="">Select season...</option>
                  <option value="wet">Rainy / Wet Season</option>
                  <option value="dry">Dry / Harmattan Season</option>
                </select>
              </div>

              <Button
                onClick={handleAdvisory}
                disabled={advisoryLoading || !advisoryCrop.trim() || !advisoryProblem.trim()}
                className="w-full"
              >
                {advisoryLoading ? "Analysing..." : "Get Advice"}
              </Button>
            </div>
          </Card>

          {advisoryResult && (
            <div className="space-y-3">
              <Card className="bg-harvest-50 border-harvest-200">
                <p className="text-harvest-800 text-sm leading-relaxed">{advisoryResult.advice}</p>
              </Card>

              {advisoryResult.recommendations.length === 0 && (
                <Card className="text-center py-6">
                  <p className="text-gray-500 text-sm">No strong matches found. Try describing different symptoms.</p>
                </Card>
              )}

              {advisoryResult.recommendations.map((rec) => (
                <button
                  key={rec.id}
                  onClick={() => openArticle(rec.id)}
                  className="w-full text-left"
                >
                  <Card className={`border-l-4 ${RELEVANCE_COLORS[rec.relevance]} active:bg-gray-50 transition-colors`}>
                    <div className="flex items-start gap-3">
                      <span className="text-2xl mt-0.5">{rec.icon}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-gray-900">{rec.title}</h3>
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${SEVERITY_COLORS[rec.severity]}`}>
                            {rec.severity}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 mt-1 line-clamp-2">{rec.summary}</p>
                        {rec.quickAction && (
                          <p className="text-xs text-harvest-700 mt-2 font-medium">
                            Quick action: {rec.quickAction}
                          </p>
                        )}
                      </div>
                      <ChevronRight size={18} className="text-gray-300 shrink-0 mt-1" />
                    </div>
                  </Card>
                </button>
              ))}

              {advisoryResult.seasonalTips.length > 0 && (
                <Card className="bg-blue-50 border-blue-200">
                  <p className="font-bold text-blue-900 text-sm mb-2">Seasonal Tips</p>
                  <ul className="space-y-1">
                    {advisoryResult.seasonalTips.map((tip, i) => (
                      <li key={i} className="text-xs text-blue-700 flex items-start gap-1">
                        <span>•</span> {tip}
                      </li>
                    ))}
                  </ul>
                </Card>
              )}

              <p className="text-[11px] text-gray-400 text-center px-4">{advisoryResult.disclaimer}</p>
            </div>
          )}
        </>
      )}

      {/* ===== PROGRESS TAB ===== */}
      {tab === "progress" && (
        <>
          {(() => {
            const total = articles.length;
            const completed = completedIds.length;
            const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
            return (
              <>
                <Card className="bg-gradient-to-br from-harvest-500 to-harvest-600 text-white">
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="font-bold text-lg">Learning Progress</h2>
                    <Award size={24} className="text-white/80" />
                  </div>
                  <div className="flex items-end gap-2 mb-2">
                    <span className="text-4xl font-bold">{completed}</span>
                    <span className="text-white/70 text-sm mb-1">/ {total} articles learned</span>
                  </div>
                  <div className="w-full bg-white/20 rounded-full h-3 mb-1">
                    <div
                      className="bg-white rounded-full h-3 transition-all duration-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <p className="text-white/60 text-xs">{pct}% complete</p>
                </Card>

                {completed > 0 && (
                  <Card>
                    <p className="text-xs font-semibold text-gray-500 mb-2">Points earned from learning</p>
                    <div className="flex items-center gap-2">
                      <Award size={18} className="text-harvest-600" />
                      <span className="text-2xl font-bold text-harvest-700">{completed * 5}</span>
                      <span className="text-gray-400 text-sm">points</span>
                    </div>
                  </Card>
                )}

                {completed === 0 && (
                  <Card className="text-center py-8">
                    <BookOpen size={40} className="mx-auto text-gray-300 mb-3" />
                    <p className="text-gray-500 font-medium">You have not learned any articles yet.</p>
                    <p className="text-gray-400 text-sm mt-1">Go to the Learn tab and mark articles as learned to earn points!</p>
                  </Card>
                )}

                {completed > 0 && (
                  <div className="space-y-3">
                    <p className="text-sm font-semibold text-gray-700">Recently learned</p>
                    {articles
                      .filter((a) => completedIds.includes(a.id))
                      .slice(0, 5)
                      .map((a) => (
                        <button key={a.id} onClick={() => openArticle(a.id)} className="w-full text-left">
                          <Card className="active:bg-gray-50 transition-colors">
                            <div className="flex items-center gap-3">
                              <span className="text-xl">{a.icon}</span>
                              <div className="flex-1">
                                <p className="font-semibold text-sm text-gray-900">{a.title}</p>
                                <p className="text-xs text-gray-400">{a.crop}</p>
                              </div>
                              <CheckCircle2 size={18} className="text-green-500" />
                            </div>
                          </Card>
                        </button>
                      ))}
                  </div>
                )}
              </>
            );
          })()}
        </>
      )}
    </div>
  );
}

import React, { useState, useEffect } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from "recharts";
import { supabase } from "@/lib/supabase";
import { RefreshCw, TrendingUp, Share2, Clock } from "lucide-react";

const NEWS_API_KEY = "67286b996b91454a92ed458e449b50bd";

const Trending = () => {
  const [trendingNews, setTrendingNews] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [timeFrame, setTimeFrame] = useState("day");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [categoryStats, setCategoryStats] = useState([]);

  const categories = [
    "all",
    "business",
    "technology",
    "entertainment",
    "sports",
    "science",
    "health"
  ];

  useEffect(() => {
    fetchTrendingNews();
  }, [selectedCategory, timeFrame]);

  const fetchTrendingNews = async () => {
    try {
      setLoading(true);
      setError(null);

      let url = `https://newsapi.org/v2/top-headlines?country=us&apiKey=${NEWS_API_KEY}`;
      if (selectedCategory !== "all") {
        url += `&category=${selectedCategory}`;
      }

      const response = await fetch(url);
      const data = await response.json();

      if (!response.ok) throw new Error(data.message);

      // Process articles for category statistics
      const stats = data.articles.reduce((acc, article) => {
        const category = article.category || "general";
        acc[category] = (acc[category] || 0) + 1;
        return acc;
      }, {});

      const chartData = Object.entries(stats).map(([name, count]) => ({
        name,
        articles: count
      }));

      setTrendingNews(data.articles);
      setCategoryStats(chartData);
    } catch (err) {
      console.error("Error fetching trending news:", err);
      setError(err.message || "Failed to fetch trending news");
    } finally {
      setLoading(false);
    }
  };

  const handleImportArticle = async (article) => {
    try {
      const { data, error } = await supabase.from("articles").insert([
        {
          title: article.title,
          content: article.content || article.description,
          image_url: article.urlToImage,
          category: article.category || selectedCategory,
          source: article.source.name,
          author: article.author,
          published_at: article.publishedAt,
          url: article.url,
          status: "draft"
        }
      ]);

      if (error) throw error;

      alert("Article imported successfully!");
    } catch (err) {
      console.error("Error importing article:", err);
      alert("Failed to import article");
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Trending News</h1>
        <button
          onClick={fetchTrendingNews}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
        >
          <RefreshCw size={16} />
          Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <div className="flex items-center space-x-4">
          <label className="text-sm font-medium">Category:</label>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="p-2 border border-gray-300 rounded-md"
          >
            {categories.map((category) => (
              <option key={category} value={category}>
                {category.charAt(0).toUpperCase() + category.slice(1)}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center space-x-4">
          <label className="text-sm font-medium">Time Frame:</label>
          <select
            value={timeFrame}
            onChange={(e) => setTimeFrame(e.target.value)}
            className="p-2 border border-gray-300 rounded-md"
          >
            <option value="day">Last 24 Hours</option>
            <option value="week">Last Week</option>
            <option value="month">Last Month</option>
          </select>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="p-4 bg-red-100 text-red-700 rounded-md">
          {error}
        </div>
      )}

      {/* Category Stats Chart */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-lg font-semibold mb-4">Category Distribution</h2>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={categoryStats}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="articles" fill="#3B82F6" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Trending Articles Grid */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="animate-spin h-8 w-8 text-blue-600" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {trendingNews.map((article, index) => (
            <div
              key={index}
              className="bg-white rounded-lg shadow-md overflow-hidden"
            >
              {article.urlToImage && (
                <img
                  src={article.urlToImage}
                  alt={article.title}
                  className="w-full h-48 object-cover"
                  onError={(e) => {
                    e.target.src = "/api/placeholder/400/200";
                    e.target.onerror = null;
                  }}
                />
              )}
              <div className="p-4">
                <h3 className="font-semibold text-lg mb-2 line-clamp-2">
                  {article.title}
                </h3>
                <p className="text-gray-600 mb-4 line-clamp-3">
                  {article.description}
                </p>
                <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                  <div className="flex items-center gap-1">
                    <Clock size={16} />
                    {new Date(article.publishedAt).toLocaleDateString()}
                  </div>
                  <span>{article.source.name}</span>
                </div>
                <div className="flex justify-between items-center">
                  <a
                    href={article.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline flex items-center gap-1"
                  >
                    <Share2 size={16} />
                    Read More
                  </a>
                  <button
                    onClick={() => handleImportArticle(article)}
                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                  >
                    Import
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Trending;
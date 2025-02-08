import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from "recharts";
import { RefreshCw, Download } from "lucide-react";

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8"];

const NewsReport = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timeRange, setTimeRange] = useState("7d");
  const [reportData, setReportData] = useState({
    categoryViews: [],
    topArticles: [],
    viewsTrend: [],
    engagement: []
  });

  useEffect(() => {
    fetchReportData();
  }, [timeRange]);

  const fetchReportData = async () => {
    try {
      setLoading(true);
      setError(null);

      const timeRanges = {
        "7d": 7,
        "30d": 30,
        "90d": 90
      };

      const daysToFetch = timeRanges[timeRange] || 7;
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - daysToFetch);

      // Fetch articles with their views
      const { data: articles, error: articlesError } = await supabase
        .from("articles")
        .select(`
          id,
          title,
          category,
          created_at,
          views,
          page_views(created_at)
        `)
        .gte("created_at", startDate.toISOString());

      if (articlesError) throw articlesError;

      // Process category views
      const categoryViews = articles.reduce((acc, article) => {
        acc[article.category] = (acc[article.category] || 0) + (article.views || 0);
        return acc;
      }, {});

      const categoryViewsData = Object.entries(categoryViews)
        .map(([category, views]) => ({
          category,
          views
        }))
        .sort((a, b) => b.views - a.views);

      // Process top articles
      const topArticles = articles
        .sort((a, b) => (b.views || 0) - (a.views || 0))
        .slice(0, 10)
        .map(article => ({
          title: article.title,
          views: article.views || 0,
          category: article.category
        }));

      // Process views trend
      const viewsTrend = articles.reduce((acc, article) => {
        const date = new Date(article.created_at).toLocaleDateString();
        acc[date] = (acc[date] || 0) + (article.views || 0);
        return acc;
      }, {});

      const viewsTrendData = Object.entries(viewsTrend).map(([date, views]) => ({
        date,
        views
      }));

      // Calculate engagement metrics
      const engagement = [
        {
          metric: "Average Views per Article",
          value: Math.round(
            articles.reduce((sum, article) => sum + (article.views || 0), 0) /
              articles.length
          )
        },
        {
          metric: "Most Active Category",
          value: categoryViewsData[0]?.category || "N/A"
        },
        {
          metric: "Total Articles",
          value: articles.length
        }
      ];

      setReportData({
        categoryViews: categoryViewsData,
        topArticles,
        viewsTrend: viewsTrendData,
        engagement
      });
    } catch (err) {
      console.error("Error fetching report data:", err);
      setError("Failed to load report data");
    } finally {
      setLoading(false);
    }
  };

  const downloadReport = () => {
    const reportText = `
News Report - ${new Date().toLocaleDateString()}

Time Range: Last ${timeRange}

Category Performance:
${reportData.categoryViews
  .map(cat => `${cat.category}: ${cat.views} views`)
  .join("\n")}

Top Articles:
${reportData.topArticles
  .map(article => `${article.title} (${article.views} views)`)
  .join("\n")}

Engagement Metrics:
${reportData.engagement.map(item => `${item.metric}: ${item.value}`).join("\n")}
    `.trim();

    const blob = new Blob([reportText], { type: "text/plain" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `news-report-${new Date().toLocaleDateString()}.txt`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <RefreshCw className="animate-spin h-8 w-8 text-blue-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-100 text-red-700 rounded-md">
        {error}
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">News Performance Report</h1>
        <div className="flex items-center space-x-4">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="p-2 border border-gray-300 rounded-md"
          >
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
            <option value="90d">Last 90 Days</option>
          </select>
          <button
            onClick={fetchReportData}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
          >
            <RefreshCw size={16} />
            Refresh
          </button>
          <button
            onClick={downloadReport}
            className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
          >
            <Download size={16} />
            Download Report
          </button>
        </div>
      </div>

      {/* Views Trend Chart */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-lg font-semibold mb-4">Views Trend</h2>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={reportData.viewsTrend}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey="views"
                stroke="#0088FE"
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Category Performance */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-lg font-semibold mb-4">Category Performance</h2>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={reportData.categoryViews}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="category" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="views" fill="#0088FE" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Articles Table */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-lg font-semibold mb-4">Top Performing Articles</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Title
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Views
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Category
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {reportData.topArticles.map((article, index) => (
                  <tr key={index}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{article.title}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{article.views}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                        {article.category}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Engagement Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {reportData.engagement.map((metric, index) => (
          <div
            key={index}
            className="bg-white p-6 rounded-lg shadow-md text-center"
          >
            <h3 className="text-gray-500 text-sm mb-2">{metric.metric}</h3>
            <p className="text-2xl font-bold">{metric.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default NewsReport;
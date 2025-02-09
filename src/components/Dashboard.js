import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from "recharts";
import {
  Newspaper, Users, Eye, Clock, AlertCircle, RefreshCw
} from "lucide-react";

const Dashboard = () => {
  const [loading, setLoading] = useState(true);
  const [errors, setErrors] = useState({
    supabase: null,
    newsApi: null,
    general: null
  });
  const [stats, setStats] = useState({
    articles: { total: 0, published: 0, draft: 0 },
    users: { total: 0, active: 0 },
    views: { total: 0, today: 0 }
  });
  const [recentArticles, setRecentArticles] = useState([]);
  const [trendingNews, setTrendingNews] = useState([]);
  const [viewsData, setViewsData] = useState([]);

  const fetchSupabaseData = async () => {
    try {
      // Verify Supabase connection first
      const { data: connectionTest, error: connectionError } = await supabase.from('articles').select('count');
      if (connectionError) throw connectionError;

      // Fetch article stats
      const { data: articles, error: articlesError } = await supabase
        .from('articles')
        .select('*')
        .order('created_at', { ascending: false });
      if (articlesError) throw articlesError;

      // Fetch user stats
      const { data: users, error: usersError } = await supabase
        .from('users')
        .select('*');
      if (usersError) throw usersError;

      return { articles, users };
    } catch (error) {
      console.error('Supabase error:', error);
      setErrors(prev => ({ ...prev, supabase: 'Database connection failed' }));
      return { articles: [], users: [] };
    }
  };

  const fetchNewsData = async () => {
    try {
      const response = await fetch(
        `https://newsapi.org/v2/top-headlines?country=us&apiKey=${process.env.NEXT_PUBLIC_NEWS_API_KEY}&pageSize=5`
      );
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch news');
      }
      
      return data.articles;
    } catch (error) {
      console.error('News API error:', error);
      setErrors(prev => ({ ...prev, newsApi: 'Failed to load trending news' }));
      return [];
    }
  };

  const calculateStats = (articles, users) => {
    const today = new Date().toISOString().split('T')[0];
    
    return {
      articles: {
        total: articles.length,
        published: articles.filter(a => a.status === 'published').length,
        draft: articles.filter(a => a.status === 'draft').length
      },
      users: {
        total: users.length,
        active: users.filter(u => 
          u.last_login && new Date(u.last_login) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        ).length
      },
      views: {
        total: articles.reduce((sum, article) => sum + (article.views || 0), 0),
        today: articles
          .filter(a => a.updated_at?.startsWith(today))
          .reduce((sum, article) => sum + (article.views || 0), 0)
      }
    };
  };

  const calculateViewsData = (articles) => {
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - i);
      return date.toISOString().split('T')[0];
    }).reverse();

    return last7Days.map(date => ({
      date,
      views: articles
        .filter(a => a.updated_at?.startsWith(date))
        .reduce((sum, article) => sum + (article.views || 0), 0)
    }));
  };

  const fetchDashboardData = async () => {
    setLoading(true);
    setErrors({ supabase: null, newsApi: null, general: null });

    try {
      // Fetch data in parallel
      const [{ articles, users }, newsArticles] = await Promise.all([
        fetchSupabaseData(),
        fetchNewsData()
      ]);

      // Process the data
      const calculatedStats = calculateStats(articles, users);
      const viewsTrendData = calculateViewsData(articles);

      // Update state
      setStats(calculatedStats);
      setRecentArticles(articles.slice(0, 5));
      setTrendingNews(newsArticles);
      setViewsData(viewsTrendData);
    } catch (error) {
      console.error('Dashboard error:', error);
      setErrors(prev => ({ ...prev, general: 'Failed to load dashboard data' }));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const ErrorDisplay = ({ errors }) => {
    const activeErrors = Object.entries(errors).filter(([_, value]) => value);
    if (activeErrors.length === 0) return null;

    return (
      <div className="space-y-2">
        {activeErrors.map(([key, message]) => (
          <div key={key} className="p-4 bg-red-100 text-red-700 rounded-md flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            <span>{message}</span>
          </div>
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <RefreshCw className="animate-spin h-8 w-8 text-blue-600" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 text-black">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Dashboard Overview</h1>
        <button
          onClick={fetchDashboardData}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
        >
          <RefreshCw size={16} />
          Refresh
        </button>
      </div>

      {/* Error Display */}
      <ErrorDisplay errors={errors} />

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Articles */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Total Articles</p>
              <h3 className="text-2xl font-bold">{stats.articles.total}</h3>
            </div>
            <Newspaper className="h-8 w-8 text-blue-600" />
          </div>
          <div className="mt-4 flex justify-between text-sm">
            <span className="text-green-600">{stats.articles.published} Published</span>
            <span className="text-yellow-600">{stats.articles.draft} Draft</span>
          </div>
        </div>

        {/* Active Users */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Active Users</p>
              <h3 className="text-2xl font-bold">{stats.users.active}</h3>
            </div>
            <Users className="h-8 w-8 text-green-600" />
          </div>
          <div className="mt-4 text-sm text-gray-500">
            Out of {stats.users.total} total users
          </div>
        </div>

        {/* Total Views */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Total Views</p>
              <h3 className="text-2xl font-bold">{stats.views.total}</h3>
            </div>
            <Eye className="h-8 w-8 text-purple-600" />
          </div>
          <div className="mt-4 text-sm text-green-600">
            {stats.views.today} views today
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="font-medium mb-4">Quick Actions</h3>
          <div className="space-y-2">
            <a
              href="/add-news"
              className="block px-4 py-2 bg-blue-50 text-blue-700 rounded-md hover:bg-blue-100"
            >
              Add New Article
            </a>
            <a
              href="/manage-content"
              className="block px-4 py-2 bg-gray-50 text-gray-700 rounded-md hover:bg-gray-100"
            >
              Manage Content
            </a>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Views Trend */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-lg font-semibold mb-4">Views Trend</h2>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={viewsData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="views"
                  stroke="#3B82F6"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-lg font-semibold mb-4">Recent Articles</h2>
          <div className="space-y-4">
            {recentArticles.map((article, index) => (
              <div
                key={article.id}
                className="flex items-start gap-4 p-3 hover:bg-gray-50 rounded-md"
              >
                <div className="flex-shrink-0">
                  <Clock className="h-5 w-5 text-gray-400" />
                </div>
                <div>
                  <h3 className="font-medium">{article.title}</h3>
                  <p className="text-sm text-gray-500">
                    {new Date(article.created_at).toLocaleDateString()}
                  </p>
                </div>
                <span className={`ml-auto px-2 py-1 text-xs rounded-full ${
                  article.status === 'published'
                    ? 'bg-green-100 text-green-800'
                    : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {article.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Trending News */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-lg font-semibold mb-4">Trending News</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {trendingNews.map((news, index) => (
            <div key={index} className="border border-gray-200 rounded-md p-4">
              <h3 className="font-medium mb-2 line-clamp-2">{news.title}</h3>
              <p className="text-sm text-gray-500 mb-3 line-clamp-2">
                {news.description}
              </p>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">{news.source.name}</span>
                <a
                  href={news.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  Read More
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
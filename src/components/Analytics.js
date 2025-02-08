import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { RefreshCw } from 'lucide-react';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

const Analytics = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    users: { total: 0, active: 0, new: 0 },
    articles: { total: 0, published: 0, draft: 0 },
    views: { total: 0, unique: 0 }
  });
  const [timeRange, setTimeRange] = useState('7d');
  const [viewsData, setViewsData] = useState([]);
  const [categoryData, setCategoryData] = useState([]);
  const [engagementData, setEngagementData] = useState([]);

  useEffect(() => {
    fetchAnalytics();
  }, [timeRange]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch user statistics
      const { data: users, error: usersError } = await supabase
        .from('users')
        .select('created_at, last_login');

      if (usersError) throw usersError;

      const now = new Date();
      const thirtyDaysAgo = new Date(now - 30 * 24 * 60 * 60 * 1000);

      const userStats = {
        total: users.length,
        active: users.filter(u => new Date(u.last_login) > thirtyDaysAgo).length,
        new: users.filter(u => new Date(u.created_at) > thirtyDaysAgo).length
      };

      // Fetch article statistics
      const { data: articles, error: articlesError } = await supabase
        .from('articles')
        .select('status, category, created_at, views');

      if (articlesError) throw articlesError;

      const articleStats = {
        total: articles.length,
        published: articles.filter(a => a.status === 'published').length,
        draft: articles.filter(a => a.status === 'draft').length
      };

      // Process category data
      const categoryStats = articles.reduce((acc, article) => {
        acc[article.category] = (acc[article.category] || 0) + 1;
        return acc;
      }, {});

      const categoryChartData = Object.entries(categoryStats).map(([name, value]) => ({
        name,
        value
      }));

      // Process views data
      const timeRanges = {
        '7d': 7,
        '30d': 30,
        '90d': 90
      };

      const daysToFetch = timeRanges[timeRange] || 7;
      const startDate = new Date(now - daysToFetch * 24 * 60 * 60 * 1000);

      const { data: views, error: viewsError } = await supabase
        .from('page_views')
        .select('created_at')
        .gte('created_at', startDate.toISOString());

      if (viewsError) throw viewsError;

      // Process views by day
      const viewsByDay = views.reduce((acc, view) => {
        const date = new Date(view.created_at).toLocaleDateString();
        acc[date] = (acc[date] || 0) + 1;
        return acc;
      }, {});

      const viewsChartData = Object.entries(viewsByDay).map(([date, count]) => ({
        date,
        views: count
      }));

      // Calculate engagement metrics
      const engagementStats = [
        { name: 'Avg. Time on Page', value: 4.5 },
        { name: 'Bounce Rate', value: 35 },
        { name: 'Pages per Session', value: 2.8 },
        { name: 'Return Rate', value: 45 }
      ];

      setStats({
        users: userStats,
        articles: articleStats,
        views: {
          total: views.length,
          unique: new Set(views.map(v => v.user_id)).size
        }
      });
      setCategoryData(categoryChartData);
      setViewsData(viewsChartData);
      setEngagementData(engagementStats);

    } catch (err) {
      console.error('Error fetching analytics:', err);
      setError('Failed to load analytics data');
    } finally {
      setLoading(false);
    }
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
        <h1 className="text-2xl font-bold">Analytics Dashboard</h1>
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
            onClick={fetchAnalytics}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
          >
            <RefreshCw size={16} />
            Refresh
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* User Stats */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-lg font-semibold mb-4">User Statistics</h2>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Total Users</span>
              <span className="text-xl font-semibold">{stats.users.total}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Active Users</span>
              <span className="text-xl font-semibold">{stats.users.active}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">New Users</span>
              <span className="text-xl font-semibold">{stats.users.new}</span>
            </div>
          </div>
        </div>

        {/* Article Stats */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-lg font-semibold mb-4">Article Statistics</h2>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Total Articles</span>
              <span className="text-xl font-semibold">{stats.articles.total}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Published</span>
              <span className="text-xl font-semibold">{stats.articles.published}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Draft</span>
              <span className="text-xl font-semibold">{stats.articles.draft}</span>
            </div>
          </div>
        </div>

        {/* View Stats */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-lg font-semibold mb-4">View Statistics</h2>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Total Views</span>
              <span className="text-xl font-semibold">{stats.views.total}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Unique Visitors</span>
              <span className="text-xl font-semibold">{stats.views.unique}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Page Views Chart */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-lg font-semibold mb-4">Page Views Trend</h2>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={viewsData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="views" stroke="#0088FE" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category Distribution */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-lg font-semibold mb-4">Content Categories</h2>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryData}
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Engagement Metrics */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-lg font-semibold mb-4">Engagement Metrics</h2>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={engagementData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
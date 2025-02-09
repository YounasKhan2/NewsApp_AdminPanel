import React, { useState, useEffect, useCallback } from "react";
import { supabase } from '@/lib/supabase';
import _ from 'lodash';
import { 
  Pencil, 
  Trash2, 
  Eye, 
  ChevronDown, 
  Search,
  RefreshCw,
} from 'lucide-react';

const ManageContent = () => {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    status: "",
    category: "",
    search: ""
  });
  const [sort, setSort] = useState({
    field: "created_at",
    direction: "desc"
  });
  const [selectedArticles, setSelectedArticles] = useState([]);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [articleToDelete, setArticleToDelete] = useState(null);
  const [error, setError] = useState(null);

  // Move fetchArticles outside useEffect and memoize it with useCallback
  const fetchArticles = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      if (!supabase) {
        throw new Error('Supabase client is not initialized');
      }
      
      let query = supabase
        .from('articles')
        .select(`
          *,
          author:users(full_name, avatar_url)
        `);

      // Apply filters
      if (filters.status) {
        query = query.eq('status', filters.status);
      }
      if (filters.category) {
        query = query.eq('category', filters.category);
      }
      if (filters.search) {
        query = query.ilike('title', `%${filters.search}%`);
      }

      // Apply sorting
      query = query.order(sort.field, { ascending: sort.direction === 'asc' });

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;

      if (data === null) {
        setArticles([]);
        return;
      }

      setArticles(data);
    } catch (err) {
      setError(err?.message || 'Failed to fetch articles');
      console.error('Error fetching articles:', err);
    } finally {
      setLoading(false);
    }
  }, [filters, sort]); // Dependencies for useCallback

  // Use fetchArticles in useEffect
  useEffect(() => {
    const controller = new AbortController();
    
    fetchArticles();

    return () => {
      controller.abort();
    };
  }, [fetchArticles]); // Now depends on fetchArticles

  const handleSearch = _.debounce((e) => {
    setFilters(prev => ({
      ...prev,
      search: e.target.value
    }));
  }, 300);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSort = (field) => {
    setSort(prev => ({
      field,
      direction: prev.field === field && prev.direction === "asc" ? "desc" : "asc"
    }));
  };

  const handleDelete = async (id) => {
    if (!id) return;
    
    try {
      setError(null);
      const { error: deleteError } = await supabase
        .from('articles')
        .update({ status: 'deleted' })
        .match({ id });

      if (deleteError) throw deleteError;

      setArticles(prevArticles => prevArticles.filter(article => article.id !== id));
      setIsDeleteModalOpen(false);
      setArticleToDelete(null);
    } catch (err) {
      setError(err?.message || 'Failed to delete article');
      console.error('Error deleting article:', err);
    }
  };

  const handleBulkAction = async (action) => {
    if (!selectedArticles.length) return;
    
    try {
      setError(null);
      const updates = selectedArticles.map(id => {
        const updateData = {
          id,
          updated_at: new Date().toISOString()
        };

        switch (action) {
          case 'delete':
            updateData.status = 'deleted';
            break;
          case 'publish':
            updateData.status = 'published';
            break;
          case 'unpublish':
            updateData.status = 'draft';
            break;
          default:
            throw new Error('Invalid action');
        }

        return updateData;
      });

      const { error: updateError } = await supabase
        .from('articles')
        .upsert(updates);

      if (updateError) throw updateError;

      await fetchArticles(); // Use the fetchArticles function to refresh
      setSelectedArticles([]);
    } catch (err) {
      setError(err?.message || 'Failed to perform bulk action');
      console.error('Error performing bulk action:', err);
    }
  };

  return (
    <div className="p-6 text-black">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Manage Content</h1>
        <a 
          href="/add-news" 
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
        >
          Add New Article
        </a>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-4 p-4 bg-red-100 text-red-700 rounded-md">
          {error}
        </div>
      )}

      {/* Filters and Search */}
      <div className="mb-6 grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search articles..."
            value={filters.search}
            onChange={handleSearch}
            className="pl-10 w-full p-2 border border-gray-300 rounded-md"
          />
        </div>

        <select
          name="status"
          value={filters.status}
          onChange={handleFilterChange}
          className="p-2 border border-gray-300 rounded-md"
        >
          <option value="">All Status</option>
          <option value="draft">Draft</option>
          <option value="published">Published</option>
          <option value="deleted">Deleted</option>
        </select>

        <select
          name="category"
          value={filters.category}
          onChange={handleFilterChange}
          className="p-2 border border-gray-300 rounded-md"
        >
          <option value="">All Categories</option>
          <option value="politics">Politics</option>
          <option value="technology">Technology</option>
          <option value="sports">Sports</option>
          <option value="entertainment">Entertainment</option>
        </select>

        <button
          onClick={fetchArticles}
          className="flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200 p-2 rounded-md"
        >
          <RefreshCw size={20} />
          Refresh
        </button>
      </div>

      {/* Bulk Actions */}
      {selectedArticles.length > 0 && (
        <div className="mb-4 p-3 bg-gray-50 rounded-md flex items-center justify-between">
          <span>{selectedArticles.length} articles selected</span>
          <div className="space-x-2">
            <button
              onClick={() => handleBulkAction('publish')}
              className="px-3 py-1 bg-green-600 text-white rounded-md hover:bg-green-700"
            >
              Publish Selected
            </button>
            <button
              onClick={() => handleBulkAction('unpublish')}
              className="px-3 py-1 bg-yellow-600 text-white rounded-md hover:bg-yellow-700"
            >
              Unpublish Selected
            </button>
            <button
              onClick={() => handleBulkAction('delete')}
              className="px-3 py-1 bg-red-600 text-white rounded-md hover:bg-red-700"
            >
              Delete Selected
            </button>
          </div>
        </div>
      )}

      {/* Articles Table */}
      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <input
                  type="checkbox"
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedArticles(articles.map(article => article.id));
                    } else {
                      setSelectedArticles([]);
                    }
                  }}
                  checked={selectedArticles.length === articles.length}
                />
              </th>
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                onClick={() => handleSort('title')}
              >
                Title
                <ChevronDown className="inline ml-1" size={14} />
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Category
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                onClick={() => handleSort('created_at')}
              >
                Date
                <ChevronDown className="inline ml-1" size={14} />
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td colSpan={6} className="px-6 py-4 text-center">
                  <div className="flex items-center justify-center">
                    <RefreshCw className="animate-spin mr-2" size={20} />
                    Loading articles...
                  </div>
                </td>
              </tr>
            ) : articles.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                  No articles found
                </td>
              </tr>
            ) : (
              articles.map((article) => (
                <tr key={article.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <input
                      type="checkbox"
                      checked={selectedArticles.includes(article.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedArticles([...selectedArticles, article.id]);
                        } else {
                          setSelectedArticles(selectedArticles.filter(id => id !== article.id));
                        }
                      }}
                    />
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">
                      {article.title}
                    </div>
                    <div className="text-sm text-gray-500">
                      {article.summary}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                      {article.category}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      article.status === 'published' ? 'bg-green-100 text-green-800' :
                      article.status === 'draft' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {article.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {new Date(article.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-sm font-medium space-x-2">
                    <button
                      onClick={() => window.open(`/preview/${article.id}`, '_blank')}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      <Eye size={18} />
                    </button>
                    <a
                      href={`/edit-news/${article.id}`}
                      className="text-indigo-600 hover:text-indigo-900 inline-block"
                    >
                      <Pencil size={18} />
                    </a>
                    <button
                      onClick={() => {
                        setArticleToDelete(article);
                        setIsDeleteModalOpen(true);
                      }}
                      className="text-red-600 hover:text-red-900"
                    >
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full">
            <h3 className="text-lg font-medium mb-4">Confirm Delete</h3>
            <p className="text-gray-500 mb-4">
              Are you sure you want to delete "{articleToDelete?.title}"? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setIsDeleteModalOpen(false);
                  setArticleToDelete(null);
                }}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(articleToDelete.id)}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageContent;
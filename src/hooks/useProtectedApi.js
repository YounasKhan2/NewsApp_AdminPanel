// hooks/useProtectedApi.js
import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '@/lib/supabase';

export const useProtectedApi = () => {
  const { user, signOut } = useAuth();
  const [loading, setLoading] = useState(false);

  const handleResponse = async (promise) => {
    try {
      setLoading(true);
      const response = await promise;
      
      // Handle authentication errors
      if (response?.error?.status === 401) {
        await signOut();
        window.location.href = '/login';
        return { data: null, error: 'Session expired' };
      }

      return response;
    } catch (error) {
      console.error('API Error:', error);
      return { data: null, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  const api = {
    get: (url, options = {}) => handleResponse(
      fetch(url, {
        ...options,
        headers: {
          'Accept': 'application/json',
          ...options.headers,
          Authorization: `Bearer ${user?.access_token}`
        }
      })
    ),

    post: (url, body, options = {}) => handleResponse(
      fetch(url, {
        ...options,
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          ...options.headers,
          Authorization: `Bearer ${user?.access_token}`
        },
        body: JSON.stringify(body)
      })
    ),

    supabase: {
      getUser: async () => {
        if (!user?.id) {
          return { data: null, error: 'No user ID available' };
        }

        const { data, error } = await supabase
          .from('users')
          .select('id, email, full_name, avatar_url, role, last_login, created_at')
          .eq('id', user.id)
          .single();

        if (error && error.code === 'PGRST116') {
          // User doesn't exist in the users table
          return { data: null, error: 'User not found' };
        }

        return { data, error };
      },

      updateUser: async (data) => {
        if (!user?.id) {
          return { data: null, error: 'No user ID available' };
        }

        return await supabase
          .from('users')
          .update(data)
          .eq('id', user.id)
          .select()
          .single();
      },

      getArticles: async (filters = {}) => {
        return await supabase
          .from('articles')
          .select(`
            id,
            title,
            content,
            category,
            image_url,
            video_url,
            author,
            status,
            views,
            created_at,
            published_at,
            updated_at
          `)
          .match(filters);
      },

      createArticle: async (data) => {
        if (!user?.id) {
          return { data: null, error: 'No user ID available' };
        }

        return await supabase
          .from('articles')
          .insert([{ ...data, author: user.id }])
          .select()
          .single();
      },

      updateArticle: async (id, data) => {
        if (!user?.id) {
          return { data: null, error: 'No user ID available' };
        }

        return await supabase
          .from('articles')
          .update(data)
          .eq('id', id)
          .eq('author', user.id)
          .select()
          .single();
      },

      deleteArticle: async (id) => {
        if (!user?.id) {
          return { data: null, error: 'No user ID available' };
        }

        return await supabase
          .from('articles')
          .delete()
          .eq('id', id)
          .eq('author', user.id);
      }
    }
  };

  return { api, loading };
};
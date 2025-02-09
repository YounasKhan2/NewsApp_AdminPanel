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
          'Content-Type': 'application/json',
          ...options.headers,
          Authorization: `Bearer ${user?.access_token}`
        },
        body: JSON.stringify(body)
      })
    ),

    // Supabase specific methods
    supabase: {
      getUser: async () => handleResponse(
        supabase
          .from('users')
          .select('*')
          .eq('id', user?.id)
          .single()
      ),

      updateUser: async (data) => handleResponse(
        supabase
          .from('users')
          .update(data)
          .eq('id', user?.id)
      ),

      getArticles: async (filters = {}) => handleResponse(
        supabase
          .from('articles')
          .select('*')
          .match(filters)
      ),

      createArticle: async (data) => handleResponse(
        supabase
          .from('articles')
          .insert([{ ...data, user_id: user?.id }])
      ),

      updateArticle: async (id, data) => handleResponse(
        supabase
          .from('articles')
          .update(data)
          .eq('id', id)
          .eq('user_id', user?.id)
      ),

      deleteArticle: async (id) => handleResponse(
        supabase
          .from('articles')
          .delete()
          .eq('id', id)
          .eq('user_id', user?.id)
      )
    }
  };

  return { api, loading };
};
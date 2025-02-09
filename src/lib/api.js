// @/lib/api.js

const NEWS_API_KEY = process.env.NEXT_PUBLIC_NEWS_API_KEY;
const NEWS_API_BASE_URL = 'https://newsapi.org/v2';

export const categoryService = {
  async getCategories() {
    try {
      // News API categories
      const categories = [
        { id: 1, name: 'Business', slug: 'business' },
        { id: 2, name: 'Entertainment', slug: 'entertainment' },
        { id: 3, name: 'General', slug: 'general' },
        { id: 4, name: 'Health', slug: 'health' },
        { id: 5, name: 'Science', slug: 'science' },
        { id: 6, name: 'Sports', slug: 'sports' },
        { id: 7, name: 'Technology', slug: 'technology' }
      ];
      return categories;
    } catch (error) {
      console.error('Category service error:', error);
      throw error;
    }
  }
};

export const newsService = {
  async getNews(category = '') {
    try {
      const url = new URL(`${NEWS_API_BASE_URL}/top-headlines`);
      url.searchParams.append('apiKey', NEWS_API_KEY);
      if (category) {
        url.searchParams.append('category', category);
      }
      url.searchParams.append('language', 'en');

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Failed to fetch news');
      }
      
      return await response.json();
    } catch (error) {
      console.error('News service error:', error);
      throw error;
    }
  },

  async createArticle(articleData) {
    try {
      // Since News API doesn't support article creation,
      // you might want to store this in your own backend
      // For now, we'll just log the data
      console.log('Article data to be saved:', articleData);
      return { success: true, message: 'Article created successfully' };
    } catch (error) {
      console.error('Create article error:', error);
      throw error;
    }
  }
};
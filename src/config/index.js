// config/index.js

const config = {
    supabase: {
      url: process.env.NEXT_PUBLIC_SUPABASE_URL,
      anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    },
    
    newsApi: {
      key: process.env.NEXT_PUBLIC_NEWS_API_KEY,
      timeout: parseInt(process.env.NEXT_PUBLIC_API_TIMEOUT || '30000'),
      retryAttempts: parseInt(process.env.NEXT_PUBLIC_API_RETRY_ATTEMPTS || '3'),
    },
    
    firebase: {
      apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
      authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
      appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
      measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
    },
    
    app: {
      name: process.env.NEXT_PUBLIC_APP_NAME || 'News Admin Panel',
      description: process.env.NEXT_PUBLIC_APP_DESCRIPTION,
      url: process.env.NEXT_PUBLIC_APP_URL,
      environment: process.env.NODE_ENV,
      isDevelopment: process.env.NODE_ENV === 'development',
      isProduction: process.env.NODE_ENV === 'production',
    },
    
    upload: {
      maxImageSize: parseInt(process.env.NEXT_PUBLIC_MAX_IMAGE_SIZE || '5242880'),
      allowedImageTypes: process.env.NEXT_PUBLIC_ALLOWED_IMAGE_TYPES?.split(',') || [
        'image/jpeg',
        'image/png',
        'image/webp',
      ],
    },
    
    defaults: {
      paginationLimit: parseInt(process.env.NEXT_PUBLIC_DEFAULT_PAGINATION_LIMIT || '10'),
      category: process.env.NEXT_PUBLIC_DEFAULT_CATEGORY || 'general',
      cacheDuration: parseInt(process.env.NEXT_PUBLIC_CACHE_DURATION || '3600'),
    },
    
    // Utility function to validate required env vars
    validateEnvVars: () => {
      const required = [
        'NEXT_PUBLIC_SUPABASE_URL',
        'NEXT_PUBLIC_SUPABASE_ANON_KEY',
        'NEXT_PUBLIC_NEWS_API_KEY',
        'NEXT_PUBLIC_FIREBASE_API_KEY',
      ];
  
      const missing = required.filter(
        (key) => !process.env[key]
      );
  
      if (missing.length > 0) {
        throw new Error(
          `Missing required environment variables: ${missing.join(', ')}`
        );
      }
    },
  };
  
  // Validate environment variables in development
  if (process.env.NODE_ENV === 'development') {
    config.validateEnvVars();
  }
  
  export default config;
//src/lib/supabase.js
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
  db: {
    schema: 'public'
  },
  global: {
    headers: {
      'Accept': 'application/json'
    }
  },
  storage: {
    // Add storage specific configuration
    retryInterval: 3000,
    maxRetries: 3
  }
});

// Add auth state change listener to help with debugging
supabase.auth.onAuthStateChange((event, session) => {
  if (event === 'SIGNED_OUT') {
    console.log('User signed out');
  } else if (event === 'SIGNED_IN') {
    console.log('User signed in:', session?.user?.id);
  }
});

// Export a helper function to check storage bucket existence
export const checkBucketExists = async (bucketName) => {
  try {
    const { data: buckets } = await supabase.storage.listBuckets();
    return buckets?.some(bucket => bucket.name === bucketName);
  } catch (error) {
    console.error(`Error checking bucket ${bucketName}:`, error);
    return false;
  }
};

// Export a helper function to ensure required buckets exist
export const ensureRequiredBuckets = async () => {
  const requiredBuckets = ['news-images', 'news-videos'];
  const results = await Promise.all(
    requiredBuckets.map(async (bucket) => {
      const exists = await checkBucketExists(bucket);
      if (!exists) {
        console.error(`Required bucket "${bucket}" does not exist!`);
      }
      return { bucket, exists };
    })
  );
  
  return results.every(result => result.exists);
};
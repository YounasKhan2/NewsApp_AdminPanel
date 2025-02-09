'use client';

import { supabase } from '../lib/supabase';

export const uploadFile = async (file, folder = 'news') => {
  try {
    if (!file) {
      throw new Error('No file provided');
    }

    // Create unique file name
    const timestamp = new Date().getTime();
    const fileExt = file.name.split('.').pop();
    const cleanFileName = file.name.split('.')[0].replace(/[^a-z0-9]/gi, '-').toLowerCase();
    const fileName = `${cleanFileName}-${timestamp}.${fileExt}`;
    const filePath = `${folder}/${fileName}`;

    // Determine bucket based on file type
    const bucket = file.type.startsWith('image/') ? 'news-images' : 'news-videos';

    // Upload file
    const { data, error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) {
      // Instead of throwing, return an error object
      return { 
        error: uploadError.message || 'Error uploading file',
        success: false 
      };
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from(bucket)
      .getPublicUrl(filePath);

    // Return success with data
    return {
      success: true,
      path: data.path,
      url: publicUrl
    };

  } catch (error) {
    // Return a structured error response
    return {
      error: error.message || 'An unexpected error occurred',
      success: false
    };
  }
};

export const validateFile = (file, options = {}) => {
  const defaultOptions = {
    image: {
      maxSize: 5 * 1024 * 1024, // 5MB
      allowedTypes: ['image/jpeg', 'image/png', 'image/webp']
    },
    video: {
      maxSize: 50 * 1024 * 1024, // 50MB
      allowedTypes: ['video/mp4', 'video/webm']
    }
  };

  if (!file) {
    return { valid: false, error: 'No file provided' };
  }

  const fileType = file.type.startsWith('image/') ? 'image' : 'video';
  const { maxSize, allowedTypes } = defaultOptions[fileType];

  if (!allowedTypes.includes(file.type)) {
    return { 
      valid: false, 
      error: `File type not allowed. Allowed types: ${allowedTypes.join(', ')}`
    };
  }

  if (file.size > maxSize) {
    return { 
      valid: false, 
      error: `File too large. Maximum size: ${maxSize / (1024 * 1024)}MB`
    };
  }

  return { valid: true };
};
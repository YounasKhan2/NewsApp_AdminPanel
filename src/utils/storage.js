import { supabase } from '../lib/supabase';

export const uploadFile = async (file, folder = 'news') => {
  try {
    if (!file) throw new Error('No file provided');

    // Create unique file name
    const timestamp = new Date().getTime();
    const fileExt = file.name.split('.').pop();
    const cleanFileName = file.name.split('.')[0].replace(/[^a-z0-9]/gi, '-').toLowerCase();
    const fileName = `${cleanFileName}-${timestamp}.${fileExt}`;
    const filePath = `${folder}/${fileName}`;

    // Upload file
    const { data, error: uploadError } = await supabase.storage
      .from('news-images')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) throw uploadError;

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('news-images')
      .getPublicUrl(filePath);

    return {
      path: data.path,
      url: publicUrl
    };
  } catch (error) {
    console.error('Error uploading file:', error);
    throw error;
  }
};

export const deleteFile = async (filePath) => {
  try {
    const { error } = await supabase.storage
      .from('news-images')
      .remove([filePath]);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error deleting file:', error);
    throw error;
  }
};

export const getFilePreview = (filePath) => {
  if (!filePath) return null;
  
  try {
    const { data: { publicUrl } } = supabase.storage
      .from('news-images')
      .getPublicUrl(filePath);
      
    return publicUrl;
  } catch (error) {
    console.error('Error getting file preview:', error);
    return null;
  }
};

export const validateFile = (file, options = {}) => {
  const {
    maxSize = 5 * 1024 * 1024, // 5MB default
    allowedTypes = ['image/jpeg', 'image/png', 'image/webp']
  } = options;

  if (!file) return { valid: false, error: 'No file provided' };

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
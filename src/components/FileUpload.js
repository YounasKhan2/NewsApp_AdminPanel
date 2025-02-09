'use client';

import React, { useState, useCallback } from 'react';
import { uploadFile, validateFile } from '@/utils/storage';
import { Upload, X, RefreshCw } from 'lucide-react';

const FileUpload = ({
  onUploadComplete,
  onError,
  folder = 'news',
  accept = "image/*",
  maxSize = 5 * 1024 * 1024,
  className = ""
}) => {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState(null);
  const [dragActive, setDragActive] = useState(false);

  const handleFile = async (file) => {
    const validation = validateFile(file, {
      maxSize,
      allowedTypes: accept.split(',')
    });

    if (!validation.valid) {
      onError?.(validation.error);
      return;
    }

    try {
      setUploading(true);

      // Create preview
      const objectUrl = URL.createObjectURL(file);
      setPreview(objectUrl);

      // Upload to Supabase
      const result = await uploadFile(file, folder);
      
      if (!result.success) {
        throw new Error(result.error);
      }

      onUploadComplete?.(result.url, result.path);

    } catch (error) {
      console.warn('Upload error:', error);
      onError?.(error.message || 'Error uploading file');
      setPreview(null);
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  }, []);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  }, []);

  const handleChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const clearPreview = () => {
    setPreview(null);
  };

  return (
    <div className={`relative ${className}`}>
      {preview ? (
        <div className="relative">
          <img 
            src={preview} 
            alt="Preview" 
            className="max-h-48 w-full rounded-lg object-cover"
          />
          <button
            onClick={clearPreview}
            className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
            type="button"
          >
            <X size={16} />
          </button>
        </div>
      ) : (
        <label 
          className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${
            dragActive 
              ? 'border-blue-500 bg-blue-50' 
              : 'border-gray-300 hover:bg-gray-50'
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <div className="flex flex-col items-center justify-center pt-5 pb-6">
            {uploading ? (
              <RefreshCw className="w-8 h-8 text-gray-400 animate-spin" />
            ) : (
              <>
                <Upload className="w-8 h-8 text-gray-400 mb-2" />
                <p className="text-sm text-gray-500">
                  <span className="font-semibold">Click to upload</span> or drag and drop
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {accept.split(',').join(', ')} (Max: {maxSize / (1024 * 1024)}MB)
                </p>
              </>
            )}
          </div>
          <input
            type="file"
            className="hidden"
            accept={accept}
            onChange={handleChange}
            disabled={uploading}
          />
        </label>
      )}
    </div>
  );
};

export default FileUpload;
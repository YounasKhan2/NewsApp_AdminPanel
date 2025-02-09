"use client";
import React, { useState, useEffect } from "react";
import { newsService, categoryService } from "@/lib/api";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import { Loader2 } from "lucide-react";
import FileUpload from '@/components/FileUpload'; // Import the FileUpload component

const AddNews = () => {
  const router = useRouter();
  const [categories, setCategories] = useState([]);
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    category: "",
    image: null,
    video: null,
    mobilePreview: "",
    tags: [],
    summary: ""
  });
  
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const categoriesData = await categoryService.getCategories();
        setCategories(categoriesData);
      } catch (error) {
        console.error('Error fetching categories:', error);
        toast.error('Failed to load categories');
      }
    };
    fetchCategories();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleTagsChange = (e) => {
    const tags = e.target.value.split(',').map(tag => tag.trim());
    setFormData(prev => ({
      ...prev,
      tags
    }));
  };

  const handleImageUpload = (url, path) => {
    setFormData(prev => ({
      ...prev,
      image: { url, path }
    }));
    toast.success('Image uploaded successfully');
  };

  const handleVideoUpload = (url, path) => {
    setFormData(prev => ({
      ...prev,
      video: { url, path }
    }));
    toast.success('Video uploaded successfully');
  };

  const handleUploadError = (error) => {
    toast.error(error);
  };

  const validateForm = () => {
    if (!formData.title.trim()) {
      toast.error("Title is required");
      return false;
    }
    if (formData.title.length < 10) {
      toast.error("Title must be at least 10 characters long");
      return false;
    }
    if (!formData.content.trim()) {
      toast.error("Content is required");
      return false;
    }
    if (formData.content.length < 100) {
      toast.error("Content must be at least 100 characters long");
      return false;
    }
    if (!formData.category) {
      toast.error("Please select a category");
      return false;
    }
    if (!formData.summary.trim()) {
      toast.error("Summary is required");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('Form submitted');
    
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);
    
    try {
      // Get the current authenticated user
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('User not authenticated');
      }
  
      // Prepare article data according to the table schema
      const articleData = {
        title: formData.title,
        content: formData.content,
        category: formData.category,
        image_url: formData.image?.url || null,
        video_url: formData.video?.url || null,
        author: user.id,  // This maps to the UUID from auth.users
        status: 'pending',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      console.log('Submitting article data:', articleData);
  
      const { data, error } = await supabase
        .from('articles')
        .insert([articleData])
        .select()
        .single();
  
      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }
  
      console.log('Article created successfully:', data);
      toast.success('Article created successfully');
      router.push('/manage-content');
    } catch (error) {
      console.error('Error creating article:', error);
      toast.error(error.message || 'Failed to create article');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 text-black">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Add News Article</h1>
        <button
          onClick={() => router.back()}
          className="px-4 py-2 text-gray-600 hover:text-gray-800"
        >
          ← Back
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Title Input */}
        <div>
          <label className="block text-sm font-medium mb-2">
            Title <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={handleChange}
            required
            minLength={10}
            placeholder="Enter article title"
            className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Summary Input */}
        <div>
          <label className="block text-sm font-medium mb-2">
            Summary <span className="text-red-500">*</span>
          </label>
          <textarea
            name="summary"
            value={formData.summary}
            onChange={handleChange}
            required
            rows={2}
            placeholder="Brief summary of the article"
            className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Content Input */}
        <div>
          <label className="block text-sm font-medium mb-2">
            Content <span className="text-red-500">*</span>
          </label>
          <textarea
            name="content"
            value={formData.content}
            onChange={handleChange}
            required
            rows={10}
            placeholder="Write your article content here..."
            className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Category Selection */}
        <div>
          <label className="block text-sm font-medium mb-2">
            Category <span className="text-red-500">*</span>
          </label>
          <select
            name="category"
            value={formData.category}
            onChange={handleChange}
            required
            className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select Category</option>
            {categories.map(category => (
              <option key={category.id} value={category.slug}>
                {category.name}
              </option>
            ))}
          </select>
        </div>

        {/* Tags Input */}
        <div>
          <label className="block text-sm font-medium mb-2">
            Tags (comma-separated)
          </label>
          <input
            type="text"
            name="tags"
            value={formData.tags.join(', ')}
            onChange={handleTagsChange}
            placeholder="Enter tags separated by commas"
            className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Media Upload Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Image Upload */}
          <div>
            <label className="block text-sm font-medium mb-2">Featured Image</label>
            <FileUpload
              onUploadComplete={handleImageUpload}
              onError={handleUploadError}
              folder="news/images"
              accept="image/jpeg,image/png,image/webp"
              maxSize={5 * 1024 * 1024}
            />
          </div>

          {/* Video Upload */}
          <div>
            <label className="block text-sm font-medium mb-2">Video</label>
            <FileUpload
              onUploadComplete={handleVideoUpload}
              onError={handleUploadError}
              folder="news/videos"
              accept="video/mp4,video/webm"
              maxSize={50 * 1024 * 1024}
            />
          </div>
        </div>

        {/* Mobile Preview URL */}
        <div>
          <label className="block text-sm font-medium mb-2">Mobile Preview URL</label>
          <input
            type="url"
            name="mobilePreview"
            value={formData.mobilePreview}
            onChange={handleChange}
            placeholder="Enter preview URL for mobile"
            className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Submit Buttons */}
        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-6 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-blue-400 flex items-center space-x-2"
          >
            {loading ? (
              <>
                <Loader2 className="animate-spin" size={20} />
                <span>Publishing...</span>
              </>
            ) : (
              <span>Publish Article</span>
            )}
          </button>
        </div>
      </form>

      {/* Help Text */}
      <div className="mt-8 p-4 bg-gray-50 rounded-md">
        <h3 className="text-sm font-medium text-gray-600 mb-2">Tips for creating a great article:</h3>
        <ul className="text-sm text-gray-500 list-disc list-inside space-y-1">
          <li>Use a clear, engaging title that accurately reflects the content</li>
          <li>Include a concise summary to preview your article</li>
          <li>Break your content into logical sections for better readability</li>
          <li>Add relevant tags to help readers find your article</li>
          <li>Include high-quality images to make your article more engaging</li>
        </ul>
      </div>
    </div>
  );
};

export default AddNews;
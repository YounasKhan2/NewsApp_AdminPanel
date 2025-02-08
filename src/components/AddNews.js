"use client";
import React, { useState, useEffect } from "react";
// import { newsService, categoryService } from "@/lib/api";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import { Loader2 } from "lucide-react";

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
  const [imagePreview, setImagePreview] = useState(null);
  const [videoPreview, setVideoPreview] = useState(null);

  useEffect(() => {
    // Fetch categories when component mounts
    const fetchCategories = async () => {
      try {
        const categoriesData = await categoryService.getCategories();
        setCategories(categoriesData);
      } catch (error) {
        toast.error("Failed to load categories");
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

  const handleFileChange = async (e, type) => {
    const file = e.target.files[0];
    if (!file) return;

    // File size validation
    const maxSize = type === 'image' ? 5 * 1024 * 1024 : 50 * 1024 * 1024; // 5MB for images, 50MB for videos
    if (file.size > maxSize) {
      toast.error(`${type.charAt(0).toUpperCase() + type.slice(1)} size too large. Maximum size: ${maxSize / (1024 * 1024)}MB`);
      return;
    }

    // File type validation
    const validTypes = type === 'image' 
      ? ['image/jpeg', 'image/png', 'image/webp'] 
      : ['video/mp4', 'video/webm'];
    
    if (!validTypes.includes(file.type)) {
      toast.error(`Invalid ${type} format. Supported formats: ${validTypes.join(', ')}`);
      return;
    }

    setFormData(prev => ({
      ...prev,
      [type]: file
    }));

    // Generate preview
    const reader = new FileReader();
    reader.onloadend = () => {
      if (type === 'image') {
        setImagePreview(reader.result);
      } else {
        setVideoPreview(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const uploadFile = async (file, path) => {
    if (!file) return null;
    const fileRef = ref(storage, `${path}/${Date.now()}-${file.name}`);
    const snapshot = await uploadBytes(fileRef, file);
    return getDownloadURL(snapshot.ref);
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
    
    if (!validateForm()) return;
    
    setLoading(true);
    
    try {
      // Show upload starting toast
      const uploadToast = toast.loading('Uploading media files...');

      // Upload image and video if present
      const [imageUrl, videoUrl] = await Promise.all([
        formData.image ? uploadFile(formData.image, 'news/images') : null,
        formData.video ? uploadFile(formData.video, 'news/videos') : null
      ]);

      // Update upload toast
      toast.loading('Creating article...', { id: uploadToast });

      // Create article
      await newsService.createArticle({
        title: formData.title,
        content: formData.content,
        category: formData.category,
        image_url: imageUrl,
        video_url: videoUrl,
        mobile_preview_url: formData.mobilePreview,
        tags: formData.tags,
        summary: formData.summary,
        status: 'pending'
      });

      // Success toast
      toast.success('Article created successfully', { id: uploadToast });
      
      // Redirect to manage content
      router.push('/manage-content');
    } catch (error) {
      console.error('Error creating article:', error);
      toast.error(error.message || 'Failed to create article');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
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
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={(e) => handleFileChange(e, 'image')}
              className="w-full p-2 border border-gray-300 rounded-md"
            />
            {imagePreview && (
              <div className="mt-2">
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="max-h-40 rounded-md"
                />
              </div>
            )}
          </div>

          {/* Video Upload */}
          <div>
            <label className="block text-sm font-medium mb-2">Video</label>
            <input
              type="file"
              accept="video/mp4,video/webm"
              onChange={(e) => handleFileChange(e, 'video')}
              className="w-full p-2 border border-gray-300 rounded-md"
            />
            {videoPreview && (
              <div className="mt-2">
                <video
                  src={videoPreview}
                  controls
                  className="max-h-40 rounded-md"
                />
              </div>
            )}
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
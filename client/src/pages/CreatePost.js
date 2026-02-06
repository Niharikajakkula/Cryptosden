import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { MessageSquare, Tag, Hash, ArrowLeft, Send } from 'lucide-react';
import axios from 'axios';

const CreatePost = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    category: 'general',
    tags: ''
  });

  const categories = [
    { id: 'general', name: 'General Discussion' },
    { id: 'trading', name: 'Trading' },
    { id: 'analysis', name: 'Emotional Analysis' },
    { id: 'news', name: 'News & Updates' },
    { id: 'education', name: 'Education' },
    { id: 'support', name: 'Support' },
    { id: 'announcements', name: 'Announcements' }
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!user) {
      alert('Please sign in to create posts');
      return;
    }

    if (!formData.title.trim() || !formData.content.trim()) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      setLoading(true);
      
      const postData = {
        title: formData.title.trim(),
        content: formData.content.trim(),
        category: formData.category,
        tags: formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag)
      };

      await axios.post('/api/community/posts', postData);
      
      alert('Post created successfully!');
      navigate('/community');
    } catch (error) {
      console.error('Error creating post:', error);
      alert(error.response?.data?.message || 'Failed to create post');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  if (!user) {
    return (
      <div className="h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <MessageSquare className="h-16 w-16 text-slate-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">Sign In Required</h2>
          <p className="text-slate-400 mb-6">Please sign in to create posts</p>
          <button 
            onClick={() => navigate('/login')}
            className="bg-gradient-to-r from-cyan-500 to-cyan-600 text-white px-6 py-3 rounded-lg font-medium hover:from-cyan-600 hover:to-cyan-700 transition-all"
          >
            Sign In
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 h-full overflow-y-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/community')}
            className="flex items-center space-x-2 text-slate-400 hover:text-white transition-colors mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Community</span>
          </button>
          
          <h1 className="text-3xl font-bold text-white mb-2">Create New Post</h1>
          <p className="text-slate-300">
            Share your thoughts, insights, or questions with the community
          </p>
        </div>

        {/* Form */}
        <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Title *
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="Enter a descriptive title for your post"
                className="w-full bg-slate-700 text-white px-4 py-3 rounded-lg border border-slate-600 focus:border-cyan-500 focus:outline-none"
                maxLength={200}
                required
              />
              <p className="text-slate-400 text-xs mt-1">
                {formData.title.length}/200 characters
              </p>
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Category
              </label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="w-full bg-slate-700 text-white px-4 py-3 rounded-lg border border-slate-600 focus:border-cyan-500 focus:outline-none"
              >
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Content */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Content *
              </label>
              <textarea
                name="content"
                value={formData.content}
                onChange={handleChange}
                placeholder="Write your post content here... You can share insights, ask questions, or start discussions about cryptocurrency topics."
                className="w-full bg-slate-700 text-white px-4 py-3 rounded-lg border border-slate-600 focus:border-cyan-500 focus:outline-none resize-none"
                rows={12}
                maxLength={5000}
                required
              />
              <p className="text-slate-400 text-xs mt-1">
                {formData.content.length}/5000 characters
              </p>
            </div>

            {/* Tags */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                <Tag className="h-4 w-4 inline mr-1" />
                Tags (optional)
              </label>
              <input
                type="text"
                name="tags"
                value={formData.tags}
                onChange={handleChange}
                placeholder="bitcoin, ethereum, trading, analysis (separate with commas)"
                className="w-full bg-slate-700 text-white px-4 py-3 rounded-lg border border-slate-600 focus:border-cyan-500 focus:outline-none"
              />
              <p className="text-slate-400 text-xs mt-1">
                Add relevant tags to help others find your post
              </p>
            </div>

            {/* Preview Tags */}
            {formData.tags && (
              <div className="flex flex-wrap gap-2">
                {formData.tags.split(',').map((tag, index) => {
                  const trimmedTag = tag.trim();
                  return trimmedTag ? (
                    <span key={index} className="px-2 py-1 bg-cyan-500/20 text-cyan-300 text-xs rounded-full flex items-center">
                      <Hash className="h-3 w-3 mr-1" />
                      {trimmedTag}
                    </span>
                  ) : null;
                })}
              </div>
            )}

            {/* Submit Button */}
            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={() => navigate('/community')}
                className="px-6 py-3 text-slate-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || !formData.title.trim() || !formData.content.trim()}
                className="bg-gradient-to-r from-cyan-500 to-cyan-600 text-white px-8 py-3 rounded-lg font-medium hover:from-cyan-600 hover:to-cyan-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                <Send className="h-4 w-4" />
                <span>{loading ? 'Creating...' : 'Create Post'}</span>
              </button>
            </div>
          </form>
        </div>

        {/* Guidelines */}
        <div className="mt-8 bg-slate-800/30 border border-slate-700/50 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Community Guidelines</h3>
          <ul className="text-slate-300 space-y-2 text-sm">
            <li>• Be respectful and constructive in your discussions</li>
            <li>• Stay on topic and relevant to cryptocurrency</li>
            <li>• No spam, self-promotion, or duplicate posts</li>
            <li>• Use appropriate categories and tags</li>
            <li>• Provide sources for claims and analysis</li>
            <li>• No financial advice - share opinions and insights only</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default CreatePost;
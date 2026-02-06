import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { BarChart3, Plus, Minus, ArrowLeft, Send, Calendar, Users } from 'lucide-react';
import axios from 'axios';

const CreatePoll = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    question: '',
    description: '',
    category: 'general',
    options: ['', ''],
    allowMultiple: false,
    expiresIn: 7 // days
  });

  const categories = [
    { id: 'general', name: 'General Discussion' },
    { id: 'trading', name: 'Trading' },
    { id: 'analysis', name: 'Emotional Analysis' },
    { id: 'predictions', name: 'Price Predictions' },
    { id: 'technology', name: 'Technology' },
    { id: 'community', name: 'Community' }
  ];

  const expirationOptions = [
    { value: 1, label: '1 Day' },
    { value: 3, label: '3 Days' },
    { value: 7, label: '1 Week' },
    { value: 14, label: '2 Weeks' },
    { value: 30, label: '1 Month' }
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!user) {
      alert('Please sign in to create polls');
      return;
    }

    if (!formData.question.trim()) {
      alert('Please enter a poll question');
      return;
    }

    const validOptions = formData.options.filter(option => option.trim());
    if (validOptions.length < 2) {
      alert('Please provide at least 2 options');
      return;
    }

    try {
      setLoading(true);
      
      const pollData = {
        question: formData.question.trim(),
        description: formData.description.trim(),
        category: formData.category,
        options: validOptions.map(option => ({ text: option.trim() })),
        allowMultiple: formData.allowMultiple,
        expiresAt: new Date(Date.now() + formData.expiresIn * 24 * 60 * 60 * 1000)
      };

      await axios.post('/api/community/polls', pollData);
      
      alert('Poll created successfully!');
      navigate('/community');
    } catch (error) {
      console.error('Error creating poll:', error);
      alert(error.response?.data?.message || 'Failed to create poll');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const handleOptionChange = (index, value) => {
    const newOptions = [...formData.options];
    newOptions[index] = value;
    setFormData({
      ...formData,
      options: newOptions
    });
  };

  const addOption = () => {
    if (formData.options.length < 10) {
      setFormData({
        ...formData,
        options: [...formData.options, '']
      });
    }
  };

  const removeOption = (index) => {
    if (formData.options.length > 2) {
      const newOptions = formData.options.filter((_, i) => i !== index);
      setFormData({
        ...formData,
        options: newOptions
      });
    }
  };

  if (!user) {
    return (
      <div className="h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <BarChart3 className="h-16 w-16 text-slate-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">Sign In Required</h2>
          <p className="text-slate-400 mb-6">Please sign in to create polls</p>
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
          
          <h1 className="text-3xl font-bold text-white mb-2">Create New Poll</h1>
          <p className="text-slate-300">
            Get community opinions on cryptocurrency topics and market trends
          </p>
        </div>

        {/* Form */}
        <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Question */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Poll Question *
              </label>
              <input
                type="text"
                name="question"
                value={formData.question}
                onChange={handleChange}
                placeholder="What do you think about...?"
                className="w-full bg-slate-700 text-white px-4 py-3 rounded-lg border border-slate-600 focus:border-cyan-500 focus:outline-none"
                maxLength={200}
                required
              />
              <p className="text-slate-400 text-xs mt-1">
                {formData.question.length}/200 characters
              </p>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Description (optional)
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Provide additional context or details for your poll..."
                className="w-full bg-slate-700 text-white px-4 py-3 rounded-lg border border-slate-600 focus:border-cyan-500 focus:outline-none resize-none"
                rows={4}
                maxLength={1000}
              />
              <p className="text-slate-400 text-xs mt-1">
                {formData.description.length}/1000 characters
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

            {/* Options */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Poll Options *
              </label>
              <div className="space-y-3">
                {formData.options.map((option, index) => (
                  <div key={index} className="flex items-center space-x-3">
                    <div className="flex-1">
                      <input
                        type="text"
                        value={option}
                        onChange={(e) => handleOptionChange(index, e.target.value)}
                        placeholder={`Option ${index + 1}`}
                        className="w-full bg-slate-700 text-white px-4 py-3 rounded-lg border border-slate-600 focus:border-cyan-500 focus:outline-none"
                        maxLength={100}
                      />
                    </div>
                    {formData.options.length > 2 && (
                      <button
                        type="button"
                        onClick={() => removeOption(index)}
                        className="text-red-400 hover:text-red-300 transition-colors"
                      >
                        <Minus className="h-5 w-5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
              
              {formData.options.length < 10 && (
                <button
                  type="button"
                  onClick={addOption}
                  className="mt-3 flex items-center space-x-2 text-cyan-400 hover:text-cyan-300 transition-colors"
                >
                  <Plus className="h-4 w-4" />
                  <span>Add Option</span>
                </button>
              )}
            </div>

            {/* Settings */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Multiple Choice */}
              <div>
                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    name="allowMultiple"
                    checked={formData.allowMultiple}
                    onChange={handleChange}
                    className="w-4 h-4 text-cyan-500 bg-slate-700 border-slate-600 rounded focus:ring-cyan-500"
                  />
                  <div>
                    <span className="text-slate-300 font-medium">Allow Multiple Choices</span>
                    <p className="text-slate-400 text-xs">Users can select more than one option</p>
                  </div>
                </label>
              </div>

              {/* Expiration */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  <Calendar className="h-4 w-4 inline mr-1" />
                  Poll Duration
                </label>
                <select
                  name="expiresIn"
                  value={formData.expiresIn}
                  onChange={handleChange}
                  className="w-full bg-slate-700 text-white px-4 py-3 rounded-lg border border-slate-600 focus:border-cyan-500 focus:outline-none"
                >
                  {expirationOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

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
                disabled={loading || !formData.question.trim() || formData.options.filter(o => o.trim()).length < 2}
                className="bg-gradient-to-r from-purple-500 to-purple-600 text-white px-8 py-3 rounded-lg font-medium hover:from-purple-600 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                <Send className="h-4 w-4" />
                <span>{loading ? 'Creating...' : 'Create Poll'}</span>
              </button>
            </div>
          </form>
        </div>

        {/* Preview */}
        {formData.question && (
          <div className="mt-8 bg-slate-800/30 border border-slate-700/50 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4">
              <BarChart3 className="h-5 w-5 inline mr-2" />
              Poll Preview
            </h3>
            
            <div className="bg-slate-700/50 rounded-lg p-4">
              <h4 className="text-white font-semibold mb-2">{formData.question}</h4>
              {formData.description && (
                <p className="text-slate-300 text-sm mb-4">{formData.description}</p>
              )}
              
              <div className="space-y-2">
                {formData.options.filter(option => option.trim()).map((option, index) => (
                  <div key={index} className="flex items-center space-x-3">
                    <input
                      type={formData.allowMultiple ? 'checkbox' : 'radio'}
                      disabled
                      className="w-4 h-4"
                    />
                    <span className="text-slate-300">{option}</span>
                  </div>
                ))}
              </div>
              
              <div className="flex items-center justify-between mt-4 text-sm text-slate-400">
                <div className="flex items-center space-x-1">
                  <Users className="h-4 w-4" />
                  <span>0 votes</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Calendar className="h-4 w-4" />
                  <span>Expires in {formData.expiresIn} day{formData.expiresIn !== 1 ? 's' : ''}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Guidelines */}
        <div className="mt-8 bg-slate-800/30 border border-slate-700/50 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Poll Guidelines</h3>
          <ul className="text-slate-300 space-y-2 text-sm">
            <li>• Ask clear, unbiased questions</li>
            <li>• Provide balanced and comprehensive options</li>
            <li>• Keep options concise and distinct</li>
            <li>• Use appropriate categories for better discovery</li>
            <li>• Consider the poll duration based on topic urgency</li>
            <li>• Avoid duplicate or spam polls</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default CreatePoll;
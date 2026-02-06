import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { 
  MessageSquare, 
  BarChart3, 
  TrendingUp, 
  Users, 
  Clock,
  Eye,
  ThumbsUp,
  MessageCircle,
  Plus,
  Search,
  Filter,
  Star,
  ArrowUp,
  ArrowDown,
  Award,
  Flame,
  Calendar,
  Hash,
  Pin,
  Shield,
  Heart,
  Share2,
  Bookmark,
  MoreHorizontal
} from 'lucide-react';

const Community = () => {
  const { user } = useAuth();
  const [posts, setPosts] = useState([]);
  const [polls, setPolls] = useState([]);
  const [categories, setCategories] = useState([]);
  const [stats, setStats] = useState({});
  const [topContributors, setTopContributors] = useState([]);
  const [trendingTags, setTrendingTags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('posts');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('trending');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    fetchCommunityData();
  }, [activeTab, selectedCategory, sortBy]);

  const fetchCommunityData = async () => {
    try {
      setLoading(true);
      const [statsRes, categoriesRes, contributorsRes, tagsRes] = await Promise.all([
        axios.get('/api/community/stats'),
        axios.get('/api/community/categories'),
        axios.get('/api/community/top-contributors'),
        axios.get('/api/community/trending-tags')
      ]);

      setStats(statsRes.data);
      setCategories(categoriesRes.data);
      setTopContributors(contributorsRes.data.contributors || []);
      setTrendingTags(tagsRes.data.tags || []);

      if (activeTab === 'posts') {
        const postsRes = await axios.get('/api/community/posts', {
          params: {
            category: selectedCategory,
            trending: sortBy === 'trending',
            sort: sortBy === 'recent' ? 'createdAt' : 'lastActivity',
            search: searchTerm
          }
        });
        setPosts(postsRes.data.posts);
      } else {
        const pollsRes = await axios.get('/api/community/polls', {
          params: {
            category: selectedCategory,
            trending: sortBy === 'trending',
            featured: sortBy === 'featured',
            search: searchTerm
          }
        });
        setPolls(pollsRes.data.polls);
      }
    } catch (error) {
      console.error('Error fetching community data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleVote = async (postId, voteType) => {
    if (!user) {
      alert('Please sign in to vote');
      return;
    }

    try {
      await axios.post(`/api/community/posts/${postId}/vote`, { voteType });
      fetchCommunityData(); // Refresh data
    } catch (error) {
      console.error('Error voting:', error);
    }
  };

  const handlePollVote = async (pollId, optionIds) => {
    if (!user) {
      alert('Please sign in to vote');
      return;
    }

    try {
      await axios.post(`/api/community/polls/${pollId}/vote`, { optionIds });
      fetchCommunityData(); // Refresh data
    } catch (error) {
      console.error('Error voting on poll:', error);
    }
  };

  const formatTimeAgo = (date) => {
    const now = new Date();
    const diffInMinutes = Math.floor((now - new Date(date)) / (1000 * 60));
    
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  const PostCard = ({ post }) => {
    const [isBookmarked, setIsBookmarked] = useState(false);
    const [showActions, setShowActions] = useState(false);

    const handleBookmark = async () => {
      if (!user) {
        alert('Please sign in to bookmark posts');
        return;
      }
      try {
        await axios.post(`/api/community/posts/${post._id}/bookmark`);
        setIsBookmarked(!isBookmarked);
      } catch (error) {
        console.error('Error bookmarking post:', error);
      }
    };

    const handleShare = async () => {
      if (navigator.share) {
        try {
          await navigator.share({
            title: post.title,
            text: post.content.substring(0, 100) + '...',
            url: `${window.location.origin}/community/posts/${post._id}`
          });
        } catch (error) {
          console.log('Error sharing:', error);
        }
      } else {
        // Fallback: copy to clipboard
        navigator.clipboard.writeText(`${window.location.origin}/community/posts/${post._id}`);
        alert('Link copied to clipboard!');
      }
    };

    return (
      <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6 hover:border-cyan-500/30 transition-all group">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-cyan-400 to-cyan-600 rounded-full flex items-center justify-center">
              <span className="text-white font-semibold text-sm">
                {post.userId?.name?.charAt(0) || 'U'}
              </span>
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-semibold text-white">{post.userId?.name || 'Anonymous'}</h3>
                {post.userId?.reputation >= 100 && (
                  <Award className="h-4 w-4 text-yellow-400" title="Trusted Contributor" />
                )}
                {post.userId?.role === 'admin' && (
                  <Shield className="h-4 w-4 text-purple-400" title="Admin" />
                )}
              </div>
              <div className="flex items-center space-x-2 text-sm text-slate-400">
                <span>{formatTimeAgo(post.createdAt)}</span>
                <span>•</span>
                <span className="capitalize">{post.category}</span>
                {post.userId?.reputation && (
                  <>
                    <span>•</span>
                    <span className="text-cyan-400">{post.userId.reputation} rep</span>
                  </>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {post.isPinned && <Pin className="h-5 w-5 text-yellow-400" title="Pinned" />}
            {post.isHot && <Flame className="h-5 w-5 text-orange-400" title="Hot Topic" />}
            <div className="relative">
              <button
                onClick={() => setShowActions(!showActions)}
                className="opacity-0 group-hover:opacity-100 transition-opacity text-slate-400 hover:text-white"
              >
                <MoreHorizontal className="h-5 w-5" />
              </button>
              {showActions && (
                <div className="absolute right-0 top-8 bg-slate-700 border border-slate-600 rounded-lg shadow-lg z-10 min-w-[120px]">
                  <button
                    onClick={handleBookmark}
                    className="w-full px-3 py-2 text-left text-sm text-slate-300 hover:bg-slate-600 flex items-center space-x-2"
                  >
                    <Bookmark className={`h-4 w-4 ${isBookmarked ? 'text-cyan-400' : ''}`} />
                    <span>{isBookmarked ? 'Unbookmark' : 'Bookmark'}</span>
                  </button>
                  <button
                    onClick={handleShare}
                    className="w-full px-3 py-2 text-left text-sm text-slate-300 hover:bg-slate-600 flex items-center space-x-2"
                  >
                    <Share2 className="h-4 w-4" />
                    <span>Share</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        <Link to={`/community/posts/${post._id}`} className="block mb-4">
          <h2 className="text-xl font-bold text-white mb-2 hover:text-cyan-400 transition-colors">
            {post.title}
          </h2>
          <p className="text-slate-300 line-clamp-3">{post.content}</p>
        </Link>

        {post.tags && post.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {post.tags.map((tag, index) => (
              <button
                key={index}
                onClick={() => setSearchTerm(`#${tag}`)}
                className="px-2 py-1 bg-cyan-500/20 text-cyan-300 text-xs rounded-full hover:bg-cyan-500/30 transition-colors flex items-center space-x-1"
              >
                <Hash className="h-3 w-3" />
                <span>{tag}</span>
              </button>
            ))}
          </div>
        )}

        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <button
                onClick={() => handleVote(post._id, 'up')}
                className={`flex items-center space-x-1 transition-colors ${
                  post.userVote === 'up' 
                    ? 'text-green-400' 
                    : 'text-slate-400 hover:text-green-400'
                }`}
              >
                <ArrowUp className="h-4 w-4" />
                <span>{post.upvotes}</span>
              </button>
              <button
                onClick={() => handleVote(post._id, 'down')}
                className={`flex items-center space-x-1 transition-colors ${
                  post.userVote === 'down' 
                    ? 'text-red-400' 
                    : 'text-slate-400 hover:text-red-400'
                }`}
              >
                <ArrowDown className="h-4 w-4" />
                <span>{post.downvotes}</span>
              </button>
            </div>
            <Link 
              to={`/community/posts/${post._id}`}
              className="flex items-center space-x-1 text-slate-400 hover:text-cyan-400 transition-colors"
            >
              <MessageCircle className="h-4 w-4" />
              <span>{post.replyCount || 0}</span>
            </Link>
            <div className="flex items-center space-x-1 text-slate-400">
              <Eye className="h-4 w-4" />
              <span>{post.views}</span>
            </div>
          </div>
          <div className="flex items-center space-x-2 text-slate-400">
            {post.lastActivity && (
              <span className="text-xs">
                Last activity {formatTimeAgo(post.lastActivity)}
              </span>
            )}
          </div>
        </div>
      </div>
    );
  };

  const PollCard = ({ poll }) => (
    <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6 hover:border-cyan-500/30 transition-all">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-purple-600 rounded-full flex items-center justify-center">
            <BarChart3 className="h-5 w-5 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-white">{poll.userId?.name || 'Anonymous'}</h3>
            <div className="flex items-center space-x-2 text-sm text-slate-400">
              <span>{formatTimeAgo(poll.createdAt)}</span>
              <span>•</span>
              <span className="capitalize">{poll.category}</span>
            </div>
          </div>
        </div>
        {poll.isFeatured && <Star className="h-5 w-5 text-yellow-400" />}
      </div>

      <Link to={`/community/polls/${poll._id}`} className="block mb-4">
        <h2 className="text-xl font-bold text-white mb-2 hover:text-cyan-400 transition-colors">
          {poll.question}
        </h2>
        {poll.description && (
          <p className="text-slate-300 line-clamp-2">{poll.description}</p>
        )}
      </Link>

      <div className="space-y-2 mb-4">
        {poll.options?.slice(0, 3).map((option, index) => (
          <div key={index} className="flex items-center justify-between">
            <span className="text-slate-300">{option.text}</span>
            <span className="text-cyan-400">{option.votes} votes</span>
          </div>
        ))}
        {poll.options?.length > 3 && (
          <p className="text-slate-400 text-sm">+{poll.options.length - 3} more options</p>
        )}
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-1 text-slate-400">
            <Users className="h-4 w-4" />
            <span>{poll.totalVotes} votes</span>
          </div>
          <div className="flex items-center space-x-1 text-slate-400">
            <Eye className="h-4 w-4" />
            <span>{poll.views}</span>
          </div>
        </div>
        <div className="flex items-center space-x-1 text-slate-400">
          <Clock className="h-4 w-4" />
          <span>
            {new Date(poll.expiresAt) > new Date() 
              ? `${Math.ceil((new Date(poll.expiresAt) - new Date()) / (1000 * 60 * 60 * 24))}d left`
              : 'Expired'
            }
          </span>
        </div>
      </div>
    </div>
  );

  return (
    <div className="h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 h-full overflow-y-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Community</h1>
          <p className="text-slate-300">
            Connect with fellow crypto enthusiasts, share insights, and participate in discussions
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6">
            <div className="flex items-center space-x-3">
              <MessageSquare className="h-8 w-8 text-cyan-400" />
              <div>
                <p className="text-2xl font-bold text-white">{stats.totalPosts || 0}</p>
                <p className="text-slate-400">Total Posts</p>
              </div>
            </div>
          </div>
          <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6">
            <div className="flex items-center space-x-3">
              <BarChart3 className="h-8 w-8 text-purple-400" />
              <div>
                <p className="text-2xl font-bold text-white">{stats.totalPolls || 0}</p>
                <p className="text-slate-400">Total Polls</p>
              </div>
            </div>
          </div>
          <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6">
            <div className="flex items-center space-x-3">
              <TrendingUp className="h-8 w-8 text-green-400" />
              <div>
                <p className="text-2xl font-bold text-white">{stats.activePosts || 0}</p>
                <p className="text-slate-400">Active This Week</p>
              </div>
            </div>
          </div>
          <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6">
            <div className="flex items-center space-x-3">
              <Users className="h-8 w-8 text-blue-400" />
              <div>
                <p className="text-2xl font-bold text-white">{stats.topContributors?.length || 0}</p>
                <p className="text-slate-400">Top Contributors</p>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* Quick Actions */}
            {user && (
              <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Quick Actions</h3>
                <div className="space-y-3">
                  <Link
                    to="/community/create-post"
                    className="w-full bg-gradient-to-r from-cyan-500 to-cyan-600 text-white px-4 py-2 rounded-lg font-medium hover:from-cyan-600 hover:to-cyan-700 transition-all flex items-center space-x-2"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Create Post</span>
                  </Link>
                  <Link
                    to="/community/create-poll"
                    className="w-full bg-gradient-to-r from-purple-500 to-purple-600 text-white px-4 py-2 rounded-lg font-medium hover:from-purple-600 hover:to-purple-700 transition-all flex items-center space-x-2"
                  >
                    <BarChart3 className="h-4 w-4" />
                    <span>Create Poll</span>
                  </Link>
                </div>
              </div>
            )}

            {/* Top Contributors */}
            {topContributors.length > 0 && (
              <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center space-x-2">
                  <Award className="h-5 w-5 text-yellow-400" />
                  <span>Top Contributors</span>
                </h3>
                <div className="space-y-3">
                  {topContributors.slice(0, 5).map((contributor, index) => (
                    <div key={contributor._id} className="flex items-center space-x-3">
                      <div className="flex items-center space-x-2">
                        <span className={`text-sm font-bold ${
                          index === 0 ? 'text-yellow-400' :
                          index === 1 ? 'text-slate-300' :
                          index === 2 ? 'text-orange-400' : 'text-slate-400'
                        }`}>
                          #{index + 1}
                        </span>
                        <div className="w-8 h-8 bg-gradient-to-br from-cyan-400 to-cyan-600 rounded-full flex items-center justify-center">
                          <span className="text-white font-semibold text-xs">
                            {contributor.name?.charAt(0) || 'U'}
                          </span>
                        </div>
                      </div>
                      <div className="flex-1">
                        <p className="text-white text-sm font-medium">{contributor.name}</p>
                        <p className="text-slate-400 text-xs">{contributor.reputation} rep</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Trending Tags */}
            {trendingTags.length > 0 && (
              <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center space-x-2">
                  <Flame className="h-5 w-5 text-orange-400" />
                  <span>Trending Tags</span>
                </h3>
                <div className="flex flex-wrap gap-2">
                  {trendingTags.slice(0, 10).map((tag, index) => (
                    <button
                      key={index}
                      onClick={() => setSearchTerm(`#${tag.name}`)}
                      className="px-2 py-1 bg-cyan-500/20 text-cyan-300 text-xs rounded-full hover:bg-cyan-500/30 transition-colors flex items-center space-x-1"
                    >
                      <Hash className="h-3 w-3" />
                      <span>{tag.name}</span>
                      <span className="text-slate-400">({tag.count})</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Community Guidelines */}
            <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center space-x-2">
                <Shield className="h-5 w-5 text-green-400" />
                <span>Guidelines</span>
              </h3>
              <ul className="text-slate-300 space-y-2 text-sm">
                <li>• Be respectful and constructive</li>
                <li>• Stay on topic</li>
                <li>• No spam or self-promotion</li>
                <li>• Provide sources for claims</li>
                <li>• No financial advice</li>
              </ul>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3 space-y-6">
            {/* Search and Filters */}
            <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
                <div className="flex items-center space-x-4">
                  <button
                    onClick={() => setActiveTab('posts')}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      activeTab === 'posts'
                        ? 'bg-cyan-500 text-white'
                        : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                    }`}
                  >
                    <MessageSquare className="h-4 w-4 inline mr-2" />
                    Posts
                  </button>
                  <button
                    onClick={() => setActiveTab('polls')}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      activeTab === 'polls'
                        ? 'bg-purple-500 text-white'
                        : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                    }`}
                  >
                    <BarChart3 className="h-4 w-4 inline mr-2" />
                    Polls
                  </button>
                </div>

                <div className="flex items-center space-x-4">
                  {/* Search */}
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Search posts, tags..."
                      className="bg-slate-700 text-white pl-10 pr-4 py-2 rounded-lg border border-slate-600 focus:border-cyan-500 focus:outline-none w-64"
                    />
                  </div>

                  {/* Filters Toggle */}
                  <button
                    onClick={() => setShowFilters(!showFilters)}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      showFilters
                        ? 'bg-cyan-500 text-white'
                        : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                    }`}
                  >
                    <Filter className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Expanded Filters */}
              {showFilters && (
                <div className="mt-4 pt-4 border-t border-slate-700 grid grid-cols-1 md:grid-cols-3 gap-4">
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="bg-slate-700 text-white px-4 py-2 rounded-lg border border-slate-600 focus:border-cyan-500 focus:outline-none"
                  >
                    <option value="">All Categories</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>

                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="bg-slate-700 text-white px-4 py-2 rounded-lg border border-slate-600 focus:border-cyan-500 focus:outline-none"
                  >
                    <option value="trending">🔥 Trending</option>
                    <option value="recent">🕒 Recent</option>
                    <option value="popular">👍 Popular</option>
                    {activeTab === 'posts' && <option value="active">💬 Most Active</option>}
                    {activeTab === 'polls' && <option value="featured">⭐ Featured</option>}
                  </select>

                  <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4 text-slate-400" />
                    <select className="bg-slate-700 text-white px-4 py-2 rounded-lg border border-slate-600 focus:border-cyan-500 focus:outline-none flex-1">
                      <option value="all">All Time</option>
                      <option value="today">Today</option>
                      <option value="week">This Week</option>
                      <option value="month">This Month</option>
                    </select>
                  </div>
                </div>
              )}
            </div>

        {/* Content */}
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500"></div>
          </div>
        ) : (
          <div className="space-y-6">
            {activeTab === 'posts' ? (
              posts.length > 0 ? (
                posts.map((post) => <PostCard key={post._id} post={post} />)
              ) : (
                <div className="text-center py-12">
                  <MessageSquare className="h-16 w-16 text-slate-600 mx-auto mb-4" />
                  <p className="text-slate-400 mb-4">
                    {searchTerm ? 'No posts found matching your search' : 'No posts found'}
                  </p>
                  {user && !searchTerm && (
                    <Link
                      to="/community/create-post"
                      className="bg-gradient-to-r from-cyan-500 to-cyan-600 text-white px-6 py-3 rounded-lg font-medium hover:from-cyan-600 hover:to-cyan-700 transition-all inline-flex items-center space-x-2"
                    >
                      <Plus className="h-4 w-4" />
                      <span>Create the first post</span>
                    </Link>
                  )}
                </div>
              )
            ) : (
              polls.length > 0 ? (
                polls.map((poll) => <PollCard key={poll._id} poll={poll} />)
              ) : (
                <div className="text-center py-12">
                  <BarChart3 className="h-16 w-16 text-slate-600 mx-auto mb-4" />
                  <p className="text-slate-400 mb-4">
                    {searchTerm ? 'No polls found matching your search' : 'No polls found'}
                  </p>
                  {user && !searchTerm && (
                    <Link
                      to="/community/create-poll"
                      className="bg-gradient-to-r from-purple-500 to-purple-600 text-white px-6 py-3 rounded-lg font-medium hover:from-purple-600 hover:to-purple-700 transition-all inline-flex items-center space-x-2"
                    >
                      <Plus className="h-4 w-4" />
                      <span>Create the first poll</span>
                    </Link>
                  )}
                </div>
              )
            )}
          </div>
        )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Community;
import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  ArrowLeft, 
  MessageCircle, 
  Share2, 
  Flag, 
  Edit, 
  Trash2,
  Send,
  User,
  Calendar,
  Eye,
  ThumbsUp,
  ThumbsDown
} from 'lucide-react';
import axios from 'axios';

const PostDetail = () => {
  const { postId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [commentLoading, setCommentLoading] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState('');

  useEffect(() => {
    fetchPostDetail();
  }, [postId]);

  const fetchPostDetail = async () => {
    try {
      setLoading(true);
      const [postRes, commentsRes] = await Promise.all([
        axios.get(`/api/community/posts/${postId}`),
        axios.get(`/api/community/posts/${postId}/comments`)
      ]);
      
      setPost(postRes.data);
      setComments(commentsRes.data.comments || []);
    } catch (error) {
      console.error('Error fetching post detail:', error);
      if (error.response?.status === 404) {
        navigate('/community');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVote = async (voteType) => {
    if (!user) {
      alert('Please sign in to vote');
      return;
    }

    try {
      await axios.post(`/api/community/posts/${postId}/vote`, { voteType });
      fetchPostDetail(); // Refresh post data
    } catch (error) {
      console.error('Error voting:', error);
      alert(error.response?.data?.message || 'Failed to vote');
    }
  };

  const handleAddComment = async () => {
    if (!user) {
      alert('Please sign in to comment');
      return;
    }

    if (!newComment.trim()) {
      alert('Please enter a comment');
      return;
    }

    try {
      setCommentLoading(true);
      await axios.post(`/api/community/posts/${postId}/comments`, {
        content: newComment
      });
      
      setNewComment('');
      fetchPostDetail(); // Refresh comments
    } catch (error) {
      console.error('Error adding comment:', error);
      alert(error.response?.data?.message || 'Failed to add comment');
    } finally {
      setCommentLoading(false);
    }
  };

  const handleDeletePost = async () => {
    if (!window.confirm('Are you sure you want to delete this post?')) {
      return;
    }

    try {
      await axios.delete(`/api/community/posts/${postId}`);
      navigate('/community');
    } catch (error) {
      console.error('Error deleting post:', error);
      alert(error.response?.data?.message || 'Failed to delete post');
    }
  };

  const handleReportPost = async () => {
    if (!reportReason.trim()) {
      alert('Please provide a reason for reporting');
      return;
    }

    try {
      await axios.post(`/api/community/posts/${postId}/report`, {
        reason: reportReason
      });
      
      setShowReportModal(false);
      setReportReason('');
      alert('Post reported successfully. Our moderators will review it.');
    } catch (error) {
      console.error('Error reporting post:', error);
      alert(error.response?.data?.message || 'Failed to report post');
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getUserVote = () => {
    if (!user || !post?.votes) return null;
    return post.votes.find(vote => vote.userId === user.id)?.voteType || null;
  };

  if (loading) {
    return (
      <div className="h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500"></div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white mb-4">Post not found</h2>
          <Link 
            to="/community" 
            className="text-cyan-400 hover:text-cyan-300 transition-colors"
          >
            Back to Community
          </Link>
        </div>
      </div>
    );
  }

  const userVote = getUserVote();

  return (
    <div className="h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 h-full overflow-y-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/community')}
            className="flex items-center space-x-2 text-slate-400 hover:text-white transition-colors mb-4"
          >
            <ArrowLeft className="h-5 w-5" />
            <span>Back to Community</span>
          </button>
          
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold text-white">Post Details</h1>
            
            {/* Post Actions */}
            <div className="flex items-center space-x-2">
              {user && user.id === post.author?._id && (
                <>
                  <Link
                    to={`/community/posts/${postId}/edit`}
                    className="p-2 text-slate-400 hover:text-cyan-400 transition-colors"
                  >
                    <Edit className="h-5 w-5" />
                  </Link>
                  <button
                    onClick={handleDeletePost}
                    className="p-2 text-slate-400 hover:text-red-400 transition-colors"
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                </>
              )}
              
              {user && user.id !== post.author?._id && (
                <button
                  onClick={() => setShowReportModal(true)}
                  className="p-2 text-slate-400 hover:text-yellow-400 transition-colors"
                >
                  <Flag className="h-5 w-5" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Post Content */}
        <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6 mb-8">
          {/* Post Header */}
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-br from-cyan-400 to-cyan-600 rounded-full flex items-center justify-center">
                {post.author?.avatar ? (
                  <img 
                    src={post.author.avatar} 
                    alt={post.author?.name || 'User'}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                ) : (
                  <User className="h-6 w-6 text-white" />
                )}
              </div>
              <div>
                <h3 className="font-semibold text-white">{post.author?.name || 'Anonymous'}</h3>
                <div className="flex items-center space-x-4 text-sm text-slate-400">
                  <div className="flex items-center space-x-1">
                    <Calendar className="h-4 w-4" />
                    <span>{formatDate(post.createdAt)}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Eye className="h-4 w-4" />
                    <span>{post.views || 0} views</span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Category Badge */}
            <span className="px-3 py-1 bg-cyan-500/20 text-cyan-400 rounded-full text-sm font-medium">
              {post.category}
            </span>
          </div>

          {/* Post Title */}
          <h2 className="text-2xl font-bold text-white mb-4">{post.title}</h2>

          {/* Post Content */}
          <div className="prose prose-invert max-w-none mb-6">
            <p className="text-slate-300 whitespace-pre-wrap">{post.content}</p>
          </div>

          {/* Post Image */}
          {post.image && (
            <div className="mb-6">
              <img 
                src={post.image} 
                alt="Post content"
                className="w-full max-h-96 object-cover rounded-lg"
              />
            </div>
          )}

          {/* Post Tags */}
          {post.tags && post.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-6">
              {post.tags.map((tag, index) => (
                <span 
                  key={index}
                  className="px-2 py-1 bg-slate-700/50 text-slate-300 rounded text-sm"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}

          {/* Post Actions */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-700/50">
            <div className="flex items-center space-x-6">
              {/* Voting */}
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handleVote('upvote')}
                  className={`flex items-center space-x-1 px-3 py-2 rounded-lg transition-colors ${
                    userVote === 'upvote'
                      ? 'bg-green-500/20 text-green-400'
                      : 'text-slate-400 hover:text-green-400 hover:bg-green-500/10'
                  }`}
                >
                  <ThumbsUp className="h-4 w-4" />
                  <span>{post.upvotes || 0}</span>
                </button>
                
                <button
                  onClick={() => handleVote('downvote')}
                  className={`flex items-center space-x-1 px-3 py-2 rounded-lg transition-colors ${
                    userVote === 'downvote'
                      ? 'bg-red-500/20 text-red-400'
                      : 'text-slate-400 hover:text-red-400 hover:bg-red-500/10'
                  }`}
                >
                  <ThumbsDown className="h-4 w-4" />
                  <span>{post.downvotes || 0}</span>
                </button>
              </div>

              {/* Comments Count */}
              <div className="flex items-center space-x-1 text-slate-400">
                <MessageCircle className="h-4 w-4" />
                <span>{comments.length} comments</span>
              </div>
            </div>

            {/* Share Button */}
            <button className="flex items-center space-x-1 text-slate-400 hover:text-cyan-400 transition-colors">
              <Share2 className="h-4 w-4" />
              <span>Share</span>
            </button>
          </div>
        </div>

        {/* Comments Section */}
        <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6">
          <h3 className="text-xl font-bold text-white mb-6">
            Comments ({comments.length})
          </h3>

          {/* Add Comment */}
          {user ? (
            <div className="mb-8">
              <div className="flex space-x-4">
                <div className="w-10 h-10 bg-gradient-to-br from-cyan-400 to-cyan-600 rounded-full flex items-center justify-center flex-shrink-0">
                  {user.avatar ? (
                    <img 
                      src={user.avatar} 
                      alt={user.name}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  ) : (
                    <User className="h-5 w-5 text-white" />
                  )}
                </div>
                <div className="flex-1">
                  <textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Write a comment..."
                    className="w-full bg-slate-700/50 text-white px-4 py-3 rounded-lg border border-slate-600 focus:border-cyan-500 focus:outline-none resize-none"
                    rows={3}
                  />
                  <div className="flex justify-end mt-3">
                    <button
                      onClick={handleAddComment}
                      disabled={commentLoading || !newComment.trim()}
                      className="flex items-center space-x-2 bg-gradient-to-r from-cyan-500 to-cyan-600 text-white px-4 py-2 rounded-lg font-medium hover:from-cyan-600 hover:to-cyan-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {commentLoading ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      ) : (
                        <Send className="h-4 w-4" />
                      )}
                      <span>Comment</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="mb-8 p-4 bg-slate-700/30 rounded-lg text-center">
              <p className="text-slate-400 mb-3">Sign in to join the discussion</p>
              <Link
                to="/login"
                className="inline-flex items-center space-x-2 bg-gradient-to-r from-cyan-500 to-cyan-600 text-white px-4 py-2 rounded-lg font-medium hover:from-cyan-600 hover:to-cyan-700 transition-all"
              >
                <span>Sign In</span>
              </Link>
            </div>
          )}

          {/* Comments List */}
          <div className="space-y-6">
            {comments.length > 0 ? (
              comments.map((comment) => (
                <div key={comment._id} className="flex space-x-4">
                  <div className="w-10 h-10 bg-gradient-to-br from-cyan-400 to-cyan-600 rounded-full flex items-center justify-center flex-shrink-0">
                    {comment.author?.avatar ? (
                      <img 
                        src={comment.author.avatar} 
                        alt={comment.author?.name || 'User'}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    ) : (
                      <User className="h-5 w-5 text-white" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="bg-slate-700/30 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold text-white">{comment.author?.name || 'Anonymous'}</h4>
                        <span className="text-sm text-slate-400">
                          {formatDate(comment.createdAt)}
                        </span>
                      </div>
                      <p className="text-slate-300">{comment.content}</p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <MessageCircle className="h-12 w-12 text-slate-600 mx-auto mb-3" />
                <p className="text-slate-400">No comments yet. Be the first to comment!</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Report Modal */}
      {showReportModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 border border-slate-700 rounded-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-white">Report Post</h3>
              <button
                onClick={() => setShowReportModal(false)}
                className="text-slate-400 hover:text-white transition-colors"
              >
                ×
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Reason for reporting
                </label>
                <select
                  value={reportReason}
                  onChange={(e) => setReportReason(e.target.value)}
                  className="w-full bg-slate-700 text-white px-4 py-2 rounded-lg border border-slate-600 focus:border-red-500 focus:outline-none"
                >
                  <option value="">Select a reason</option>
                  <option value="spam">Spam</option>
                  <option value="harassment">Harassment</option>
                  <option value="inappropriate">Inappropriate content</option>
                  <option value="misinformation">Misinformation</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={() => setShowReportModal(false)}
                  className="flex-1 bg-slate-600 hover:bg-slate-500 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleReportPost}
                  disabled={!reportReason}
                  className="flex-1 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Report
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PostDetail;
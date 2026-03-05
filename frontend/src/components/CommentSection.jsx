import { useState, useEffect } from 'react';
import API from '../api/axios';
import { formatUsername } from '../utils/formatters';

function CommentSection({ postId, onCommentAdded }) {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchComments();
  }, [postId]);

  const fetchComments = async () => {
    try {
      setLoading(true);
      const response = await API.get(`/posts/${postId}/comments`);
      setComments(response.data.comments);
    } catch (error) {
      console.error('Failed to fetch comments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitComment = async (e) => {
    e.preventDefault();
    
    if (!newComment.trim()) return;
    
    try {
      setSubmitting(true);
      const response = await API.post(`/posts/${postId}/comments`, {
        content: newComment.trim()
      });
      
      // Add new comment to the top of the list
      setComments(prev => [response.data, ...prev]);
      setNewComment('');
      onCommentAdded();
    } catch (error) {
      console.error('Failed to add comment:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleLikeComment = async (commentId) => {
    try {
      const response = await API.post(`/posts/comments/${commentId}/like`);
      
      setComments(prev => prev.map(comment => 
        comment.id === commentId 
          ? {
              ...comment,
              liked_by_me: response.data.liked,
              likes_count: response.data.likes_count
            }
          : comment
      ));
    } catch (error) {
      console.error('Failed to like comment:', error);
    }
  };

  return (
    <div style={{
      marginTop: '20px',
      padding: '20px',
      background: 'rgba(255, 255, 255, 0.02)',
      borderRadius: '12px',
      border: '1px solid rgba(255, 255, 255, 0.05)'
    }}>
      {/* Add Comment Form */}
      <form onSubmit={handleSubmitComment} style={{ marginBottom: '20px' }}>
        <textarea
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Add a comment..."
          style={{
            width: '100%',
            minHeight: '80px',
            padding: '12px 16px',
            background: 'var(--input-bg)',
            border: '1px solid var(--glass-border)',
            borderRadius: '8px',
            color: 'var(--input-text)',
            fontSize: '0.9rem',
            resize: 'vertical',
            fontFamily: 'inherit',
            marginBottom: '12px'
          }}
          disabled={submitting}
        />
        <button
          type="submit"
          disabled={!newComment.trim() || submitting}
          style={{
            padding: '8px 16px',
            background: newComment.trim() ? 'var(--primary)' : 'var(--glass-bg)',
            color: newComment.trim() ? 'white' : 'var(--text-muted)',
            border: 'none',
            borderRadius: '6px',
            fontSize: '0.85rem',
            fontWeight: '600',
            cursor: newComment.trim() ? 'pointer' : 'not-allowed',
            transition: 'all 0.2s ease'
          }}
        >
          {submitting ? 'Posting...' : 'Comment'}
        </button>
      </form>

      {/* Comments List */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)' }}>
          Loading comments...
        </div>
      ) : comments.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)' }}>
          No comments yet. Be the first to comment!
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {comments.map(comment => (
            <div
              key={comment.id}
              style={{
                padding: '12px',
                background: 'rgba(255, 255, 255, 0.03)',
                borderRadius: '8px',
                border: '1px solid rgba(255, 255, 255, 0.05)'
              }}
            >
              {/* Comment Header */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <div
                  style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    background: 'var(--grad-primary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.7rem',
                    fontWeight: '700',
                    color: 'white'
                  }}
                >
                  {comment.username?.[0]?.toUpperCase() || 'U'}
                </div>
                <span style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-main)' }}>
                  {formatUsername(comment.username)}
                </span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  {new Date(comment.created_at).toLocaleDateString()}
                </span>
              </div>

              {/* Comment Content */}
              <p style={{
                fontSize: '0.9rem',
                lineHeight: '1.5',
                color: 'var(--text-main)',
                marginBottom: '8px'
              }}>
                {comment.content}
              </p>

              {/* Comment Actions */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <button
                  onClick={() => handleLikeComment(comment.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '4px 8px',
                    background: comment.liked_by_me ? 'rgba(244, 63, 94, 0.15)' : 'transparent',
                    color: comment.liked_by_me ? '#f87171' : 'var(--text-muted)',
                    border: 'none',
                    borderRadius: '4px',
                    fontSize: '0.8rem',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <span>{comment.liked_by_me ? '❤️' : '🤍'}</span>
                  <span>{comment.likes_count}</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default CommentSection;
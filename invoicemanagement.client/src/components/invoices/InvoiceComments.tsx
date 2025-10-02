import React, { useState, useEffect } from 'react';
import { Button } from '../ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/Card';
import { Textarea } from '../ui/textarea';
import { Label } from '../ui/label';
import { Badge } from '../ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { 
  MessageSquare, 
  Send, 
  Edit3, 
  Trash2, 
  User,
  Clock,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { commentsApi, InvoiceComment } from '../../services/api/commentsApi';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

// Use the InvoiceComment interface from the API

interface InvoiceCommentsProps {
  invoiceId: number;
  disabled?: boolean;
  className?: string;
}

export function InvoiceComments({ 
  invoiceId,
  disabled = false,
  className 
}: InvoiceCommentsProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [newComment, setNewComment] = useState('');
  const [isInternal, setIsInternal] = useState(false);
  const [editingComment, setEditingComment] = useState<number | null>(null);
  const [editContent, setEditContent] = useState('');

  // Fetch comments using React Query
  const { data: comments = [], isLoading, error } = useQuery({
    queryKey: ['invoice-comments', invoiceId],
    queryFn: () => commentsApi.getComments(invoiceId),
    enabled: !!invoiceId,
  });

  // Create comment mutation
  const createCommentMutation = useMutation({
    mutationFn: (data: { content: string; author?: string }) => 
      commentsApi.createComment(invoiceId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoice-comments', invoiceId] });
      setNewComment('');
      setIsInternal(false);
    },
    onError: (error) => {
      console.error('Error adding comment:', error);
      alert('Failed to add comment. Please try again.');
    }
  });

  const handleSubmitComment = async () => {
    if (!newComment.trim()) return;

    createCommentMutation.mutate({
      content: newComment.trim(),
      author: user?.username || 'Unknown User'
    });
  };

  // Update comment mutation
  const updateCommentMutation = useMutation({
    mutationFn: ({ commentId, content }: { commentId: number; content: string }) =>
      commentsApi.updateComment(commentId, { content }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoice-comments', invoiceId] });
      setEditingComment(null);
      setEditContent('');
    },
    onError: (error) => {
      console.error('Error editing comment:', error);
      alert('Failed to edit comment. Please try again.');
    }
  });

  // Delete comment mutation
  const deleteCommentMutation = useMutation({
    mutationFn: (commentId: number) => commentsApi.deleteComment(commentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoice-comments', invoiceId] });
    },
    onError: (error) => {
      console.error('Error deleting comment:', error);
      alert('Failed to delete comment. Please try again.');
    }
  });

  const handleEditComment = (commentId: number, content: string) => {
    setEditingComment(commentId);
    setEditContent(content);
  };

  const handleSaveEdit = async (commentId: number) => {
    if (!editContent.trim()) return;

    updateCommentMutation.mutate({
      commentId,
      content: editContent.trim()
    });
  };

  const handleDeleteComment = async (commentId: number) => {
    if (!confirm('Are you sure you want to delete this comment?')) return;

    deleteCommentMutation.mutate(commentId);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const canEditComment = (comment: InvoiceComment) => {
    return comment.author === user?.username || user?.role === 'Admin';
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5 text-blue-600" />
          Comments & Notes
        </CardTitle>
        <CardDescription>
          Add comments and notes for this invoice. Internal comments are only visible to staff.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Add Comment Form */}
        <div className="space-y-3">
          <div className="space-y-2">
            <Label htmlFor="new-comment">Add Comment</Label>
            <Textarea
              id="new-comment"
              placeholder="Add a comment or note about this invoice..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              rows={3}
              className="resize-none"
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="internal-comment"
                checked={isInternal}
                onChange={(e) => setIsInternal(e.target.checked)}
                className="rounded"
              />
              <Label htmlFor="internal-comment" className="text-sm text-gray-600">
                Internal comment (staff only)
              </Label>
            </div>
            
            <Button 
              onClick={handleSubmitComment}
              disabled={disabled || createCommentMutation.isPending || !newComment.trim()}
              size="sm"
            >
              {createCommentMutation.isPending ? (
                <>
                  <Clock className="h-4 w-4 mr-2 animate-spin" />
                  Adding...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Add Comment
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Comments List */}
        <div className="space-y-4">
          {isLoading ? (
            <div className="text-center py-8 text-gray-500">
              <Clock className="h-12 w-12 mx-auto mb-3 text-gray-300 animate-spin" />
              <p>Loading comments...</p>
            </div>
          ) : error ? (
            <div className="text-center py-8 text-red-500">
              <AlertCircle className="h-12 w-12 mx-auto mb-3 text-red-300" />
              <p>Failed to load comments. Please try again.</p>
            </div>
          ) : comments.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <MessageSquare className="h-12 w-12 mx-auto mb-3 text-gray-300" />
              <p>No comments yet. Be the first to add one!</p>
            </div>
          ) : (
            comments.map((comment) => (
              <div key={comment.id} className="border rounded-lg p-4 bg-gray-50">
                <div className="flex items-start space-x-3">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src="" />
                    <AvatarFallback className="text-xs">
                      {getInitials(comment.author)}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="font-medium text-sm">{comment.author}</span>
                      <span className="text-xs text-gray-500">
                        {formatDate(comment.createdAt)}
                      </span>
                      {comment.modifiedAt && (
                        <span className="text-xs text-gray-400">
                          (edited {formatDate(comment.modifiedAt)})
                        </span>
                      )}
                    </div>
                    
                    {editingComment === comment.id ? (
                      <div className="space-y-2">
                        <Textarea
                          value={editContent}
                          onChange={(e) => setEditContent(e.target.value)}
                          rows={2}
                          className="resize-none"
                        />
                        <div className="flex space-x-2">
                          <Button 
                            size="sm" 
                            onClick={() => handleSaveEdit(comment.id)}
                            disabled={!editContent.trim()}
                          >
                            Save
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => {
                              setEditingComment(null);
                              setEditContent('');
                            }}
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <p className="text-sm text-gray-700 whitespace-pre-wrap">
                          {comment.content}
                        </p>
                        
                        {canEditComment(comment) && (
                          <div className="flex space-x-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleEditComment(comment.id, comment.content)}
                              className="h-6 px-2 text-xs"
                            >
                              <Edit3 className="h-3 w-3 mr-1" />
                              Edit
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDeleteComment(comment.id)}
                              className="h-6 px-2 text-xs text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-3 w-3 mr-1" />
                              Delete
                            </Button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}

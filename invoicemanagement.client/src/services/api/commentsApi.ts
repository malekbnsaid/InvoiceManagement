import { api } from './api';

export interface InvoiceComment {
  id: number;
  invoiceId: number;
  content: string;
  author: string;
  createdAt: string;
  createdBy: string;
  modifiedAt?: string;
  modifiedBy?: string;
}

export interface CreateCommentRequest {
  content: string;
  author?: string;
}

export interface UpdateCommentRequest {
  content: string;
}

export const commentsApi = {
  // Get comments for an invoice
  getComments: async (invoiceId: number): Promise<InvoiceComment[]> => {
    try {
      console.log('🔍 CommentsAPI: Fetching comments for invoice', invoiceId);
      const response = await api.get(`/InvoiceComments/${invoiceId}`);
      console.log('🔍 CommentsAPI: Response:', response.data);
      
      // Handle Entity Framework JSON format
      let comments = response.data;
      if (response.data && (response.data as any).$values && Array.isArray((response.data as any).$values)) {
        console.log('🔍 CommentsAPI: Extracting comments from $values array');
        comments = (response.data as any).$values;
      } else if (!Array.isArray(response.data)) {
        console.error('❌ CommentsAPI: Response is not an array and no $values found:', response.data);
        return [];
      }
      
      console.log('🔍 CommentsAPI: Final comments array:', comments);
      return comments;
    } catch (error) {
      console.error(`Error fetching comments for invoice ${invoiceId}:`, error);
      throw error;
    }
  },

  // Create a new comment
  createComment: async (invoiceId: number, request: CreateCommentRequest): Promise<InvoiceComment> => {
    try {
      console.log('🔍 CommentsAPI: Creating comment for invoice', invoiceId, 'with data:', request);
      const response = await api.post(`/InvoiceComments/${invoiceId}`, request);
      console.log('🔍 CommentsAPI: Created comment:', response.data);
      return response.data;
    } catch (error) {
      console.error(`Error creating comment for invoice ${invoiceId}:`, error);
      throw error;
    }
  },

  // Update a comment
  updateComment: async (commentId: number, request: UpdateCommentRequest): Promise<InvoiceComment> => {
    try {
      console.log('🔍 CommentsAPI: Updating comment', commentId, 'with data:', request);
      const response = await api.put(`/InvoiceComments/${commentId}`, request);
      console.log('🔍 CommentsAPI: Updated comment:', response.data);
      return response.data;
    } catch (error) {
      console.error(`Error updating comment ${commentId}:`, error);
      throw error;
    }
  },

  // Delete a comment
  deleteComment: async (commentId: number): Promise<void> => {
    try {
      console.log('🔍 CommentsAPI: Deleting comment', commentId);
      await api.delete(`/InvoiceComments/${commentId}`);
      console.log('🔍 CommentsAPI: Comment deleted successfully');
    } catch (error) {
      console.error(`Error deleting comment ${commentId}:`, error);
      throw error;
    }
  }
};

import { api } from './api';

export interface StatusHistory {
  id: number;
  invoiceId: number;
  previousStatus: number;
  newStatus: number;
  changeDate: string;
  changedBy: string;
  comments?: string;
  createdAt: string;
  createdBy: string;
  modifiedAt?: string;
  modifiedBy?: string;
}

export interface CreateStatusHistoryRequest {
  previousStatus: number;
  newStatus: number;
  changedBy: string;
  comments?: string;
}

export const statusHistoryApi = {
  // Get status history for an invoice
  getStatusHistory: async (invoiceId: number): Promise<StatusHistory[]> => {
    try {
      console.log('🔍 StatusHistoryAPI: Fetching status history for invoice', invoiceId);
      const response = await api.get(`/InvoiceStatusHistory/${invoiceId}`);
      console.log('🔍 StatusHistoryAPI: Response:', response.data);
      
      // Handle Entity Framework JSON format
      let history = response.data;
      if (response.data && (response.data as any).$values && Array.isArray((response.data as any).$values)) {
        console.log('🔍 StatusHistoryAPI: Extracting history from $values array');
        history = (response.data as any).$values;
      } else if (!Array.isArray(response.data)) {
        console.error('❌ StatusHistoryAPI: Response is not an array and no $values found:', response.data);
        return [];
      }
      
      console.log('🔍 StatusHistoryAPI: Final history array:', history);
      return history;
    } catch (error) {
      console.error(`Error fetching status history for invoice ${invoiceId}:`, error);
      throw error;
    }
  },

  // Create a new status history entry
  createStatusHistory: async (invoiceId: number, request: CreateStatusHistoryRequest): Promise<StatusHistory> => {
    try {
      console.log('🔍 StatusHistoryAPI: Creating status history for invoice', invoiceId, 'with data:', request);
      const response = await api.post(`/InvoiceStatusHistory`, {
        ...request,
        invoiceId
      });
      console.log('🔍 StatusHistoryAPI: Created status history:', response.data);
      return response.data;
    } catch (error) {
      console.error(`Error creating status history for invoice ${invoiceId}:`, error);
      throw error;
    }
  }
};

import { api } from './api';
import { InvoiceStatus } from '../../types/enums';

export interface Invoice {
  id: number;
  invoiceNumber: string;
  vendorName: string;
  invoiceValue: number;
  invoiceDate: string;
  projectReference: string;
  status: InvoiceStatus;
  createdAt: string;
  statusHistories: Array<{
    id: number;
    status: InvoiceStatus;
    changedAt: string;
    changedBy: string;
    reason?: string;
  }>;
}

export interface ChangeStatusRequest {
  Status: InvoiceStatus;
  ChangedBy: string;
  Reason?: string;
}

export interface ChangeStatusResponse {
  message: string;
}

export interface UpdateInvoiceDataRequest {
  invoiceNumber?: string;
  vendorName?: string;
  invoiceDate?: string;
  invoiceValue?: number;
  vendorTaxId?: string;
  dueDate?: string;
  currency?: string;
}

export const invoiceApi = {
  // Get all invoices
  getInvoices: async (): Promise<Invoice[]> => {
    try {
      console.log('🔍 InvoiceAPI: Making request to /Invoices');
      const response = await api.get('/Invoices');
      console.log('🔍 InvoiceAPI: Response status:', response.status);
      console.log('🔍 InvoiceAPI: Response data:', response.data);
      console.log('🔍 InvoiceAPI: Data type:', typeof response.data);
      console.log('🔍 InvoiceAPI: Is array:', Array.isArray(response.data));
      
      if (!response.data) {
        console.error('❌ InvoiceAPI: No data in response');
        return [];
      }
      
      // Handle Entity Framework JSON format
      let invoices = response.data;
      if (response.data && response.data.$values && Array.isArray(response.data.$values)) {
        console.log('🔍 InvoiceAPI: Extracting invoices from $values array');
        invoices = response.data.$values;
      }
      
      console.log('🔍 InvoiceAPI: Final invoices array:', invoices);
      console.log('🔍 InvoiceAPI: Final array length:', invoices.length);
      
      return invoices;
    } catch (error) {
      console.error('❌ InvoiceAPI: Error fetching invoices:', error);
      if (error.response) {
        console.error('❌ InvoiceAPI: Response status:', error.response.status);
        console.error('❌ InvoiceAPI: Response data:', error.response.data);
      }
      throw error;
    }
  },

  // Get invoice by ID
  getInvoiceById: async (id: number): Promise<Invoice> => {
    try {
      const response = await api.get(`/Invoices/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching invoice ${id}:`, error);
      throw error;
    }
  },

  // Change invoice status
  changeStatus: async (id: number, request: ChangeStatusRequest): Promise<ChangeStatusResponse> => {
    try {
      const response = await api.patch(`/InvoiceStatus/${id}/status`, request);
      return response.data;
    } catch (error) {
      console.error(`Error changing status for invoice ${id}:`, error);
      throw error;
    }
  },

  // Get invoices by status
  getInvoicesByStatus: async (status: InvoiceStatus): Promise<Invoice[]> => {
    try {
      const response = await api.get(`/Invoices/status/${status}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching invoices with status ${status}:`, error);
      throw error;
    }
  },

  // Get invoices for PMO review
  getInvoicesForPMOReview: async (): Promise<Invoice[]> => {
    try {
      const response = await api.get('/Invoices/pmo-review');
      return response.data;
    } catch (error) {
      console.error('Error fetching invoices for PMO review:', error);
      throw error;
    }
  },

  // Update invoice data
  updateInvoiceData: async (id: number, request: UpdateInvoiceDataRequest): Promise<Invoice> => {
    try {
      console.log('🔍 InvoiceAPI: Making PATCH request to /Invoices/' + id + '/data');
      console.log('🔍 InvoiceAPI: Request payload:', JSON.stringify(request, null, 2));
      const response = await api.patch(`/Invoices/${id}/data`, request);
      console.log('🔍 InvoiceAPI: Response status:', response.status);
      console.log('🔍 InvoiceAPI: Update response:', response.data);
      return response.data;
    } catch (error: any) {
      console.error(`❌ InvoiceAPI: Error updating invoice data for ${id}:`, error);
      if (error.response) {
        console.error('❌ InvoiceAPI: Response status:', error.response.status);
        console.error('❌ InvoiceAPI: Response data:', error.response.data);
        console.error('❌ InvoiceAPI: Response headers:', error.response.headers);
      } else if (error.request) {
        console.error('❌ InvoiceAPI: No response received:', error.request);
      } else {
        console.error('❌ InvoiceAPI: Error setting up request:', error.message);
      }
      throw error;
    }
  }
};

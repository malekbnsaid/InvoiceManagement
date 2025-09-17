import { InvoiceStatus } from '../../types/enums';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://localhost:7001/api';

export interface ChangeStatusRequest {
  status: InvoiceStatus;
  changedBy: string;
  reason?: string;
}

export interface ChangeStatusResponse {
  message: string;
}

export interface CanChangeStatusResponse {
  canChange: boolean;
}

export class InvoiceStatusApi {
  private static async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    
    const defaultOptions: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    const response = await fetch(url, defaultOptions);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  static async getValidTransitions(invoiceId: number): Promise<InvoiceStatus[]> {
    return this.request<InvoiceStatus[]>(`/invoicestatus/${invoiceId}/transitions`);
  }

  static async changeStatus(invoiceId: number, request: ChangeStatusRequest): Promise<ChangeStatusResponse> {
    return this.request<ChangeStatusResponse>(`/invoicestatus/${invoiceId}/status`, {
      method: 'PATCH',
      body: JSON.stringify(request),
    });
  }

  static async canChangeStatus(invoiceId: number, status: InvoiceStatus): Promise<CanChangeStatusResponse> {
    return this.request<CanChangeStatusResponse>(`/invoicestatus/${invoiceId}/can-change/${status}`);
  }
}

import { InvoiceStatus } from '../../types/enums';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5274';

export class InvoiceWorkflowApi {
  private static async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const token = localStorage.getItem('token');
    
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        ...options.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  /**
   * Trigger automated workflow action
   */
  static async triggerWorkflowAction(invoiceId: number, action: string): Promise<{ message: string }> {
    return this.request(`/api/invoiceworkflow/${invoiceId}/trigger/${action}`, {
      method: 'POST',
    });
  }

  /**
   * Get valid transitions for current status
   */
  static async getValidTransitions(invoiceId: number): Promise<InvoiceStatus[]> {
    return this.request(`/api/invoiceworkflow/${invoiceId}/transitions`);
  }

  /**
   * Check if status can be changed manually
   */
  static async canChangeStatus(invoiceId: number, newStatus: InvoiceStatus): Promise<{ canChange: boolean }> {
    return this.request(`/api/invoiceworkflow/${invoiceId}/can-change-status`, {
      method: 'POST',
      body: JSON.stringify({ newStatus }),
    });
  }

  /**
   * Manually change status
   */
  static async changeStatus(invoiceId: number, newStatus: InvoiceStatus, reason?: string): Promise<{ message: string }> {
    return this.request(`/api/invoiceworkflow/${invoiceId}/change-status`, {
      method: 'POST',
      body: JSON.stringify({ newStatus, reason }),
    });
  }
}

// Workflow action constants
export const WORKFLOW_ACTIONS = {
  OCR_COMPLETED: 'ocr_completed',
  PM_REVIEWED: 'pm_reviewed',
  HEAD_APPROVED: 'head_approved',
  PROCUREMENT_PROCESSED: 'procurement_processed',
  EXTERNAL_SYSTEM_UPDATED: 'external_system_updated'
} as const;

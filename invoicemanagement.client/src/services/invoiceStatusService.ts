import { InvoiceStatus } from '../types/enums';

export interface StatusTransition {
  from: InvoiceStatus;
  to: InvoiceStatus;
  role: string;
  requiresReason: boolean;
  requiresComment: boolean;
}

export interface StatusChangeRequest {
  invoiceId: number;
  newStatus: InvoiceStatus;
  reason?: string;
  comment?: string;
}

export class InvoiceStatusService {
  private static readonly STATUS_TRANSITIONS: StatusTransition[] = [
    // Draft transitions
    { from: InvoiceStatus.Draft, to: InvoiceStatus.PendingApproval, role: 'IT', requiresReason: false, requiresComment: false },
    { from: InvoiceStatus.Draft, to: InvoiceStatus.Cancelled, role: 'IT', requiresReason: true, requiresComment: false },
    
    // PendingApproval transitions
    { from: InvoiceStatus.PendingApproval, to: InvoiceStatus.Approved, role: 'SectionHead', requiresReason: false, requiresComment: true },
    { from: InvoiceStatus.PendingApproval, to: InvoiceStatus.Rejected, role: 'SectionHead', requiresReason: true, requiresComment: true },
    { from: InvoiceStatus.PendingApproval, to: InvoiceStatus.Returned, role: 'SectionHead', requiresReason: true, requiresComment: true },
    
    // Approved transitions
    { from: InvoiceStatus.Approved, to: InvoiceStatus.Processing, role: 'Procurement', requiresReason: false, requiresComment: false },
    { from: InvoiceStatus.Approved, to: InvoiceStatus.Cancelled, role: 'Procurement', requiresReason: true, requiresComment: true },
    
    // Rejected transitions
    { from: InvoiceStatus.Rejected, to: InvoiceStatus.Draft, role: 'IT', requiresReason: false, requiresComment: false },
    
    // Returned transitions
    { from: InvoiceStatus.Returned, to: InvoiceStatus.Draft, role: 'IT', requiresReason: false, requiresComment: false },
    
    // Processing transitions
    { from: InvoiceStatus.Processing, to: InvoiceStatus.Paid, role: 'Finance', requiresReason: false, requiresComment: false },
    { from: InvoiceStatus.Processing, to: InvoiceStatus.OnHold, role: 'Procurement', requiresReason: true, requiresComment: true },
    { from: InvoiceStatus.Processing, to: InvoiceStatus.Overdue, role: 'System', requiresReason: false, requiresComment: false },
    
    // OnHold transitions
    { from: InvoiceStatus.OnHold, to: InvoiceStatus.Processing, role: 'Procurement', requiresReason: false, requiresComment: false },
    { from: InvoiceStatus.OnHold, to: InvoiceStatus.Cancelled, role: 'Procurement', requiresReason: true, requiresComment: true },
    
    // Overdue transitions
    { from: InvoiceStatus.Overdue, to: InvoiceStatus.Processing, role: 'Finance', requiresReason: false, requiresComment: false },
    { from: InvoiceStatus.Overdue, to: InvoiceStatus.Paid, role: 'Finance', requiresReason: false, requiresComment: false },
    { from: InvoiceStatus.Overdue, to: InvoiceStatus.Cancelled, role: 'Finance', requiresReason: true, requiresComment: true },
    
    // Cancelled transitions
    { from: InvoiceStatus.Cancelled, to: InvoiceStatus.Draft, role: 'IT', requiresReason: false, requiresComment: false },
  ];

  static getValidTransitions(currentStatus: InvoiceStatus, userRole: string): InvoiceStatus[] {
    return this.STATUS_TRANSITIONS
      .filter(transition => 
        transition.from === currentStatus && 
        (transition.role === userRole || transition.role === 'System' || userRole === 'Admin')
      )
      .map(transition => transition.to);
  }

  static canChangeStatus(currentStatus: InvoiceStatus, newStatus: InvoiceStatus, userRole: string): boolean {
    return this.STATUS_TRANSITIONS.some(transition =>
      transition.from === currentStatus &&
      transition.to === newStatus &&
      (transition.role === userRole || transition.role === 'System' || userRole === 'Admin')
    );
  }

  static getTransitionRequirements(currentStatus: InvoiceStatus, newStatus: InvoiceStatus, userRole: string): {
    requiresReason: boolean;
    requiresComment: boolean;
  } {
    const transition = this.STATUS_TRANSITIONS.find(t =>
      t.from === currentStatus &&
      t.to === newStatus &&
      (t.role === userRole || t.role === 'System' || userRole === 'Admin')
    );

    return transition ? {
      requiresReason: transition.requiresReason,
      requiresComment: transition.requiresComment
    } : { requiresReason: false, requiresComment: false };
  }

  static getStatusDisplayInfo(status: InvoiceStatus): {
    label: string;
    color: string;
    description: string;
  } {
    const statusInfo = {
      [InvoiceStatus.Draft]: {
        label: 'Draft',
        color: 'bg-gray-100 text-gray-800',
        description: 'Invoice is being prepared and not yet submitted for approval'
      },
      [InvoiceStatus.PendingApproval]: {
        label: 'Pending Approval',
        color: 'bg-yellow-100 text-yellow-800',
        description: 'Invoice is waiting for section head approval'
      },
      [InvoiceStatus.Approved]: {
        label: 'Approved',
        color: 'bg-green-100 text-green-800',
        description: 'Invoice has been approved and is ready for processing'
      },
      [InvoiceStatus.Rejected]: {
        label: 'Rejected',
        color: 'bg-red-100 text-red-800',
        description: 'Invoice has been rejected and requires revision'
      },
      [InvoiceStatus.Processing]: {
        label: 'Processing',
        color: 'bg-blue-100 text-blue-800',
        description: 'Invoice is being processed by procurement'
      },
      [InvoiceStatus.Paid]: {
        label: 'Paid',
        color: 'bg-green-100 text-green-800',
        description: 'Invoice has been paid'
      },
      [InvoiceStatus.Cancelled]: {
        label: 'Cancelled',
        color: 'bg-gray-100 text-gray-800',
        description: 'Invoice has been cancelled'
      },
      [InvoiceStatus.OnHold]: {
        label: 'On Hold',
        color: 'bg-orange-100 text-orange-800',
        description: 'Invoice processing is temporarily suspended'
      },
      [InvoiceStatus.Overdue]: {
        label: 'Overdue',
        color: 'bg-red-100 text-red-800',
        description: 'Invoice is past its due date'
      },
      [InvoiceStatus.UnderReview]: {
        label: 'Under Review',
        color: 'bg-purple-100 text-purple-800',
        description: 'Invoice is being reviewed by finance'
      },
      [InvoiceStatus.SentToFinance]: {
        label: 'Sent to Finance',
        color: 'bg-indigo-100 text-indigo-800',
        description: 'Invoice has been sent to finance department'
      },
      [InvoiceStatus.Returned]: {
        label: 'Returned',
        color: 'bg-yellow-100 text-yellow-800',
        description: 'Invoice has been returned for corrections'
      }
    };

    return statusInfo[status] || {
      label: 'Unknown',
      color: 'bg-gray-100 text-gray-800',
      description: 'Unknown status'
    };
  }

  static isStatusEditable(status: InvoiceStatus): boolean {
    return [InvoiceStatus.Draft, InvoiceStatus.Returned].includes(status);
  }

  static isStatusCancellable(status: InvoiceStatus): boolean {
    return ![InvoiceStatus.Paid, InvoiceStatus.Cancelled].includes(status);
  }

  static getStatusPriority(status: InvoiceStatus): number {
    const priorities = {
      [InvoiceStatus.Overdue]: 1,
      [InvoiceStatus.PendingApproval]: 2,
      [InvoiceStatus.Processing]: 3,
      [InvoiceStatus.OnHold]: 4,
      [InvoiceStatus.UnderReview]: 5,
      [InvoiceStatus.SentToFinance]: 6,
      [InvoiceStatus.Approved]: 7,
      [InvoiceStatus.Returned]: 8,
      [InvoiceStatus.Rejected]: 9,
      [InvoiceStatus.Draft]: 10,
      [InvoiceStatus.Cancelled]: 11,
      [InvoiceStatus.Paid]: 12
    };

    return priorities[status] || 999;
  }

  static getStatusWorkflow(): Array<{
    status: InvoiceStatus;
    description: string;
    nextSteps: string[];
  }> {
    return [
      {
        status: InvoiceStatus.Draft,
        description: 'Invoice is being prepared',
        nextSteps: ['Complete all required fields', 'Submit for approval']
      },
      {
        status: InvoiceStatus.PendingApproval,
        description: 'Waiting for section head approval',
        nextSteps: ['Review invoice details', 'Approve, reject, or return for corrections']
      },
      {
        status: InvoiceStatus.Approved,
        description: 'Approved and ready for processing',
        nextSteps: ['Send to procurement for processing']
      },
      {
        status: InvoiceStatus.Processing,
        description: 'Being processed by procurement',
        nextSteps: ['Complete procurement process', 'Send to finance for payment']
      },
      {
        status: InvoiceStatus.Paid,
        description: 'Payment completed',
        nextSteps: ['Archive invoice', 'Update project costs']
      }
    ];
  }
}

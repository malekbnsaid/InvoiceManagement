import { InvoiceStatus } from '../types/enums';

export class SimpleInvoiceStatusService {
  // General business workflow transitions (starting from Submitted since OCR is already done)
  static readonly SIMPLE_TRANSITIONS = {
    [InvoiceStatus.Submitted]: [InvoiceStatus.UnderReview, InvoiceStatus.Rejected, InvoiceStatus.OnHold, InvoiceStatus.Cancelled],
    [InvoiceStatus.UnderReview]: [InvoiceStatus.Approved, InvoiceStatus.Rejected, InvoiceStatus.OnHold, InvoiceStatus.Cancelled],
    [InvoiceStatus.Approved]: [InvoiceStatus.InProgress, InvoiceStatus.Rejected, InvoiceStatus.OnHold, InvoiceStatus.Cancelled],
    [InvoiceStatus.InProgress]: [InvoiceStatus.PMOReview, InvoiceStatus.Rejected, InvoiceStatus.OnHold, InvoiceStatus.Cancelled],
    [InvoiceStatus.PMOReview]: [InvoiceStatus.Completed, InvoiceStatus.Rejected, InvoiceStatus.OnHold, InvoiceStatus.Cancelled],
    [InvoiceStatus.Completed]: [], // Final status
    [InvoiceStatus.Rejected]: [InvoiceStatus.Submitted], // Can resubmit from beginning
    [InvoiceStatus.Cancelled]: [InvoiceStatus.Submitted], // Can restart
    [InvoiceStatus.OnHold]: [InvoiceStatus.Submitted, InvoiceStatus.UnderReview, InvoiceStatus.Approved, InvoiceStatus.InProgress, InvoiceStatus.PMOReview, InvoiceStatus.Cancelled]
  };

  static getValidTransitions(currentStatus: InvoiceStatus): InvoiceStatus[] {
    return this.SIMPLE_TRANSITIONS[currentStatus] || [];
  }

  static canChangeStatus(currentStatus: InvoiceStatus, newStatus: InvoiceStatus): boolean {
    return this.SIMPLE_TRANSITIONS[currentStatus]?.includes(newStatus) || false;
  }

  static getStatusInfo(status: InvoiceStatus): {
    label: string;
    color: string;
    description: string;
    icon: string;
  } {
    const statusInfo = {
      [InvoiceStatus.Submitted]: {
        label: 'Submitted',
        color: 'bg-blue-100 text-blue-800',
        description: 'OCR completed - ready for PM review',
        icon: '📤'
      },
      [InvoiceStatus.UnderReview]: {
        label: 'Under Review',
        color: 'bg-yellow-100 text-yellow-800',
        description: 'Being evaluated by PM',
        icon: '👀'
      },
      [InvoiceStatus.Approved]: {
        label: 'Approved',
        color: 'bg-green-100 text-green-800',
        description: 'Approved for processing',
        icon: '✅'
      },
      [InvoiceStatus.InProgress]: {
        label: 'In Progress',
        color: 'bg-purple-100 text-purple-800',
        description: 'Being processed by Procurement',
        icon: '⚙️'
      },
      [InvoiceStatus.PMOReview]: {
        label: 'PMO Review',
        color: 'bg-amber-100 text-amber-800',
        description: 'Under PMO review for final approval',
        icon: '👨‍💼'
      },
      [InvoiceStatus.Completed]: {
        label: 'Completed',
        color: 'bg-green-100 text-green-800',
        description: 'Finished - data entered in external system',
        icon: '💰'
      },
      [InvoiceStatus.Rejected]: {
        label: 'Rejected',
        color: 'bg-red-100 text-red-800',
        description: 'Needs revision - can be resubmitted',
        icon: '❌'
      },
      [InvoiceStatus.Cancelled]: {
        label: 'Cancelled',
        color: 'bg-gray-100 text-gray-800',
        description: 'Invoice cancelled',
        icon: '🚫'
      },
      [InvoiceStatus.OnHold]: {
        label: 'On Hold',
        color: 'bg-orange-100 text-orange-800',
        description: 'Temporarily paused',
        icon: '⏸️'
      }
    };

    return statusInfo[status] || {
      label: 'Unknown',
      color: 'bg-gray-100 text-gray-800',
      description: 'Unknown status',
      icon: '❓'
    };
  }

  static getNextSteps(currentStatus: InvoiceStatus): string[] {
    const nextSteps = {
      [InvoiceStatus.Submitted]: ['PM reviews invoice', 'PM attaches documents'],
      [InvoiceStatus.UnderReview]: ['Head reviews and approves', 'Head signs off'],
      [InvoiceStatus.Approved]: ['Send to Procurement', 'Include approval documents'],
      [InvoiceStatus.InProgress]: ['Procurement processes', 'Enter into external system'],
      [InvoiceStatus.Completed]: ['Invoice completed'],
      [InvoiceStatus.Rejected]: ['Make corrections', 'Resubmit from beginning'],
      [InvoiceStatus.Cancelled]: ['Start over if needed'],
      [InvoiceStatus.OnHold]: ['Resume processing', 'Address hold reason']
    };

    return nextSteps[currentStatus] || [];
  }

  static isEditable(status: InvoiceStatus): boolean {
    return status === InvoiceStatus.Submitted;
  }

  static isFinal(status: InvoiceStatus): boolean {
    return status === InvoiceStatus.Completed;
  }
}

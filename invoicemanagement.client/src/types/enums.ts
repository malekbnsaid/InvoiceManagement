export enum InvoiceStatus {
  Draft = 'Draft',
  PendingApproval = 'PendingApproval',
  Approved = 'Approved',
  Rejected = 'Rejected',
  Processing = 'Processing',
  Paid = 'Paid',
  Cancelled = 'Cancelled',
  OnHold = 'OnHold',
  Overdue = 'Overdue'
}

export enum LPOStatus {
  Draft = 'Draft',
  PendingApproval = 'PendingApproval',
  Approved = 'Approved',
  Active = 'Active',
  OnHold = 'OnHold',
  Completed = 'Completed',
  Cancelled = 'Cancelled',
  Rejected = 'Rejected'
}

export enum CurrencyType {
  SAR = 'SAR',
  USD = 'USD',
  EUR = 'EUR',
  GBP = 'GBP'
} 
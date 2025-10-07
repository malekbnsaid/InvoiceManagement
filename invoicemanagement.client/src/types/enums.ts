export enum InvoiceStatus {
  Draft = 0,              // Initial draft state
  Submitted = 1,          // OCR completed - ready for PM review
  UnderReview = 2,        // Being evaluated by PM
  PendingApproval = 3,    // Pending approval
  Processing = 4,         // Being processed by Procurement
  PMOReview = 5,          // Under PMO review for final approval
  Paid = 6,              // Paid/Completed
  Approved = 7,           // Approved for processing
  InProgress = 8,         // Being processed by Procurement
  Completed = 9,          // Finished (paid/closed)
  Rejected = 10,          // Needs revision
  Cancelled = 11,         // Cancelled
  OnHold = 12,            // Temporarily paused
  Overdue = 13,           // Overdue
  SentToFinance = 14,     // Sent to finance department
  Returned = 15           // Returned for correction
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
  USD = 'USD',
  EUR = 'EUR',
  GBP = 'GBP',
  AED = 'AED',
  SAR = 'SAR',
  KWD = 'KWD',
  BHD = 'BHD',
  OMR = 'OMR',
  QAR = 'QAR',
  JPY = 'JPY'
} 
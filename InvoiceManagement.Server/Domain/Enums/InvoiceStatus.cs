namespace InvoiceManagement.Server.Domain.Enums
{
    public enum InvoiceStatus
    {
        Submitted = 0,          // OCR completed - ready for PM review
        UnderReview = 1,        // Being evaluated by PM
        Approved = 2,           // Approved for processing
        InProgress = 3,         // Being processed by Procurement
        PMOReview = 4,          // Under PMO review for final approval
        Completed = 5,          // Finished (paid/closed)
        Rejected = 6,           // Needs revision
        Cancelled = 7,          // Cancelled
        OnHold = 8              // Temporarily paused
    }
} 
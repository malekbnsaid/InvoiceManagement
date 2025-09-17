namespace InvoiceManagement.Server.Domain.Enums
{
    public enum InvoiceStatus
    {
        Submitted = 0,          // OCR completed - ready for PM review
        UnderReview = 1,        // Being evaluated by PM
        Approved = 2,           // Approved for processing
        InProgress = 3,         // Being processed by Procurement
        Completed = 4,          // Finished (paid/closed)
        Rejected = 5,           // Needs revision
        Cancelled = 6,          // Cancelled
        OnHold = 7              // Temporarily paused
    }
} 
using InvoiceManagement.Server.Domain.Enums;
using InvoiceManagement.Server.Domain.Entities;
using InvoiceManagement.Server.Application.Interfaces;
using Microsoft.Extensions.Logging;

namespace InvoiceManagement.Server.Application.Services
{
    public class AutomatedInvoiceWorkflowService
    {
        private readonly IInvoiceService _invoiceService;
        private readonly IEmailService _emailService;
        private readonly ILogger<AutomatedInvoiceWorkflowService> _logger;

        public AutomatedInvoiceWorkflowService(
            IInvoiceService invoiceService,
            IEmailService emailService,
            ILogger<AutomatedInvoiceWorkflowService> logger)
        {
            _invoiceService = invoiceService;
            _emailService = emailService;
            _logger = logger;
        }

        /// <summary>
        /// Automatically processes invoice based on your business workflow
        /// </summary>
        public async Task ProcessInvoiceWorkflow(Invoice invoice, string action, string userId)
        {
            try
            {
            switch (action.ToLower())
            {
                case "pm_reviewed":
                    await HandlePmReviewed(invoice, userId);
                    break;
                case "head_approved":
                    await HandleHeadApproved(invoice, userId);
                    break;
                case "procurement_processed":
                    await HandleProcurementProcessed(invoice, userId);
                    break;
                case "external_system_updated":
                    await HandleExternalSystemUpdated(invoice, userId);
                    break;
                default:
                    _logger.LogWarning($"Unknown workflow action: {action}");
                    break;
            }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error processing workflow action {action} for invoice {invoice.Id}");
                throw;
            }
        }


        /// <summary>
        /// PM reviewed - automatically move to UnderReview and notify Head
        /// </summary>
        private async Task HandlePmReviewed(Invoice invoice, string userId)
        {
            if (invoice.Status != InvoiceStatus.Submitted)
            {
                _logger.LogWarning($"Invoice {invoice.Id} is not in Submitted status for PM review");
                return;
            }

            // Update status
            invoice.Status = InvoiceStatus.UnderReview;
            invoice.ProcessedBy = userId;
            invoice.ProcessedDate = DateTime.UtcNow;

            // Send email to Head
            await _emailService.SendEmailAsync(
                to: GetHeadEmail(),
                subject: $"Invoice Ready for Approval - #{invoice.InvoiceNumber}",
                body: GenerateHeadNotificationEmail(invoice)
            );

            _logger.LogInformation($"Invoice {invoice.Id} moved to UnderReview and Head notified");
        }

        /// <summary>
        /// Head approved - automatically move to Approved and notify Procurement
        /// </summary>
        private async Task HandleHeadApproved(Invoice invoice, string userId)
        {
            if (invoice.Status != InvoiceStatus.UnderReview)
            {
                _logger.LogWarning($"Invoice {invoice.Id} is not in UnderReview status for Head approval");
                return;
            }

            // Update status
            invoice.Status = InvoiceStatus.Approved;
            invoice.ProcessedBy = userId;
            invoice.ProcessedDate = DateTime.UtcNow;

            // Send email to Procurement
            await _emailService.SendEmailAsync(
                to: GetProcurementEmail(),
                subject: $"Approved Invoice Ready for Processing - #{invoice.InvoiceNumber}",
                body: GenerateProcurementNotificationEmail(invoice)
            );

            _logger.LogInformation($"Invoice {invoice.Id} moved to Approved and Procurement notified");
        }

        /// <summary>
        /// Procurement processed - automatically move to InProgress
        /// </summary>
        private async Task HandleProcurementProcessed(Invoice invoice, string userId)
        {
            if (invoice.Status != InvoiceStatus.Approved)
            {
                _logger.LogWarning($"Invoice {invoice.Id} is not in Approved status for Procurement processing");
                return;
            }

            // Update status
            invoice.Status = InvoiceStatus.InProgress;
            invoice.ProcessedBy = userId;
            invoice.ProcessedDate = DateTime.UtcNow;

            _logger.LogInformation($"Invoice {invoice.Id} moved to InProgress");
        }

        /// <summary>
        /// External system updated - automatically move to Completed
        /// </summary>
        private async Task HandleExternalSystemUpdated(Invoice invoice, string userId)
        {
            if (invoice.Status != InvoiceStatus.InProgress)
            {
                _logger.LogWarning($"Invoice {invoice.Id} is not in InProgress status for external system update");
                return;
            }

            // Update status
            invoice.Status = InvoiceStatus.Completed;
            invoice.ProcessedBy = userId;
            invoice.ProcessedDate = DateTime.UtcNow;
            invoice.PaymentDate = DateTime.UtcNow;
            invoice.PaidAmount = invoice.InvoiceValue;

            _logger.LogInformation($"Invoice {invoice.Id} moved to Completed");
        }

        /// <summary>
        /// Get valid transitions for current status
        /// </summary>
        public IEnumerable<InvoiceStatus> GetValidTransitions(InvoiceStatus currentStatus)
        {
            return currentStatus switch
            {
                InvoiceStatus.Submitted => new[] { InvoiceStatus.UnderReview, InvoiceStatus.Rejected, InvoiceStatus.OnHold, InvoiceStatus.Cancelled },
                InvoiceStatus.UnderReview => new[] { InvoiceStatus.Approved, InvoiceStatus.Rejected, InvoiceStatus.OnHold, InvoiceStatus.Cancelled },
                InvoiceStatus.Approved => new[] { InvoiceStatus.InProgress, InvoiceStatus.Rejected, InvoiceStatus.OnHold, InvoiceStatus.Cancelled },
                InvoiceStatus.InProgress => new[] { InvoiceStatus.Completed, InvoiceStatus.Rejected, InvoiceStatus.OnHold, InvoiceStatus.Cancelled },
                InvoiceStatus.Completed => new InvoiceStatus[0], // Final status
                InvoiceStatus.Rejected => new[] { InvoiceStatus.Submitted }, // Can resubmit
                InvoiceStatus.Cancelled => new[] { InvoiceStatus.Submitted }, // Can restart
                InvoiceStatus.OnHold => new[] { InvoiceStatus.Submitted, InvoiceStatus.UnderReview, InvoiceStatus.Approved, InvoiceStatus.InProgress, InvoiceStatus.Cancelled },
                _ => new InvoiceStatus[0]
            };
        }

        /// <summary>
        /// Check if status can be changed manually
        /// </summary>
        public bool CanChangeStatusManually(InvoiceStatus currentStatus, InvoiceStatus newStatus)
        {
            var validTransitions = GetValidTransitions(currentStatus);
            return validTransitions.Contains(newStatus);
        }

        // Helper methods for email addresses (you'll need to implement these based on your system)
        private string GetProjectManagerEmail(int projectId)
        {
            // TODO: Implement logic to get PM email from project
            return "pm@yourcompany.com";
        }

        private string GetHeadEmail()
        {
            // TODO: Implement logic to get Head email
            return "head@yourcompany.com";
        }

        private string GetProcurementEmail()
        {
            // TODO: Implement logic to get Procurement email
            return "procurement@yourcompany.com";
        }

        // Email template methods
        private string GeneratePmNotificationEmail(Invoice invoice)
        {
            return $@"
                <h2>New Invoice Ready for Review</h2>
                <p>Invoice #{invoice.InvoiceNumber} has been processed by OCR and is ready for your review.</p>
                <p><strong>Amount:</strong> {invoice.InvoiceValue:C}</p>
                <p><strong>Vendor:</strong> {invoice.VendorName}</p>
                <p>Please review and attach any additional documents before sending to Head for approval.</p>
            ";
        }

        private string GenerateHeadNotificationEmail(Invoice invoice)
        {
            return $@"
                <h2>Invoice Ready for Approval</h2>
                <p>Invoice #{invoice.InvoiceNumber} has been reviewed by PM and is ready for your approval.</p>
                <p><strong>Amount:</strong> {invoice.InvoiceValue:C}</p>
                <p><strong>Vendor:</strong> {invoice.VendorName}</p>
                <p>Please review and approve to proceed with procurement.</p>
            ";
        }

        private string GenerateProcurementNotificationEmail(Invoice invoice)
        {
            return $@"
                <h2>Approved Invoice Ready for Processing</h2>
                <p>Invoice #{invoice.InvoiceNumber} has been approved by Head and is ready for procurement processing.</p>
                <p><strong>Amount:</strong> {invoice.InvoiceValue:C}</p>
                <p><strong>Vendor:</strong> {invoice.VendorName}</p>
                <p>Please process and update the external system when complete.</p>
            ";
        }
    }
}

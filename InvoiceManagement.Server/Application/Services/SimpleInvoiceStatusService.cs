using InvoiceManagement.Server.Domain.Enums;
using InvoiceManagement.Server.Domain.Entities;
using InvoiceManagement.Server.Application.Interfaces;

namespace InvoiceManagement.Server.Application.Services
{
    public interface ISimpleInvoiceStatusService
    {
        Task<bool> CanChangeStatusAsync(int invoiceId, InvoiceStatus newStatus);
        Task<bool> ChangeStatusAsync(int invoiceId, InvoiceStatus newStatus, string userId, string? reason = null);
        Task<IEnumerable<InvoiceStatus>> GetValidTransitionsAsync(int invoiceId);
    }

    public class SimpleInvoiceStatusService : ISimpleInvoiceStatusService
    {
        private readonly IInvoiceService _invoiceService;
        private readonly IAuditService _auditService;

        public SimpleInvoiceStatusService(IInvoiceService invoiceService, IAuditService auditService)
        {
            _invoiceService = invoiceService;
            _auditService = auditService;
        }

        public async Task<bool> CanChangeStatusAsync(int invoiceId, InvoiceStatus newStatus)
        {
            var invoice = await _invoiceService.GetByIdAsync(invoiceId);
            if (invoice == null) return false;

            var validTransitions = GetValidTransitions(invoice.Status);
            return validTransitions.Contains(newStatus);
        }

        public async Task<bool> ChangeStatusAsync(int invoiceId, InvoiceStatus newStatus, string userId, string? reason = null)
        {
            var invoice = await _invoiceService.GetByIdAsync(invoiceId);
            if (invoice == null) return false;

            if (!await CanChangeStatusAsync(invoiceId, newStatus))
            {
                return false;
            }

            var previousStatus = invoice.Status;
            invoice.Status = newStatus;
            invoice.ModifiedAt = DateTime.UtcNow;
            invoice.ModifiedBy = userId;

            // Update specific fields based on status
            UpdateStatusSpecificFields(invoice, newStatus, userId);

            // Log audit trail
            await _auditService.LogAuditAsync(
                "Invoice",
                invoiceId.ToString(),
                "StatusChange",
                userId,
                $"Status changed from {previousStatus} to {newStatus}" + (reason != null ? $". Reason: {reason}" : "")
            );

            return true;
        }

        public async Task<IEnumerable<InvoiceStatus>> GetValidTransitionsAsync(int invoiceId)
        {
            var invoice = await _invoiceService.GetByIdAsync(invoiceId);
            if (invoice == null) return Enumerable.Empty<InvoiceStatus>();

            return GetValidTransitions(invoice.Status);
        }

        private static IEnumerable<InvoiceStatus> GetValidTransitions(InvoiceStatus currentStatus)
        {
            return currentStatus switch
            {
                InvoiceStatus.Submitted => new[] { InvoiceStatus.UnderReview, InvoiceStatus.Rejected, InvoiceStatus.OnHold, InvoiceStatus.Cancelled },
                InvoiceStatus.UnderReview => new[] { InvoiceStatus.Approved, InvoiceStatus.Rejected, InvoiceStatus.OnHold, InvoiceStatus.Cancelled },
                InvoiceStatus.Approved => new[] { InvoiceStatus.InProgress, InvoiceStatus.Rejected, InvoiceStatus.OnHold, InvoiceStatus.Cancelled },
                InvoiceStatus.InProgress => new[] { InvoiceStatus.Completed, InvoiceStatus.Rejected, InvoiceStatus.OnHold, InvoiceStatus.Cancelled },
                InvoiceStatus.Completed => new InvoiceStatus[0], // No transitions from Completed
                InvoiceStatus.Rejected => new[] { InvoiceStatus.Submitted }, // Can resubmit from beginning
                InvoiceStatus.Cancelled => new[] { InvoiceStatus.Submitted }, // Can restart
                InvoiceStatus.OnHold => new[] { InvoiceStatus.Submitted, InvoiceStatus.UnderReview, InvoiceStatus.Approved, InvoiceStatus.InProgress, InvoiceStatus.Cancelled },
                _ => new InvoiceStatus[0]
            };
        }

        private static void UpdateStatusSpecificFields(Invoice invoice, InvoiceStatus newStatus, string userId)
        {
            switch (newStatus)
            {
                case InvoiceStatus.UnderReview:
                    invoice.ProcessedBy = userId;
                    invoice.ProcessedDate = DateTime.UtcNow;
                    break;
                case InvoiceStatus.Approved:
                    invoice.ProcessedBy = userId;
                    invoice.ProcessedDate = DateTime.UtcNow;
                    break;
                case InvoiceStatus.InProgress:
                    invoice.ProcessedBy = userId;
                    invoice.ProcessedDate = DateTime.UtcNow;
                    break;
                case InvoiceStatus.Completed:
                    invoice.PaymentDate = DateTime.UtcNow;
                    invoice.PaidAmount = invoice.InvoiceValue;
                    break;
            }
        }
    }
}

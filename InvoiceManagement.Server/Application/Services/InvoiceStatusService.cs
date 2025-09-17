using InvoiceManagement.Server.Domain.Enums;
using InvoiceManagement.Server.Domain.Entities;
using InvoiceManagement.Server.Application.Interfaces;

namespace InvoiceManagement.Server.Application.Services
{
    public interface IInvoiceStatusService
    {
        Task<bool> CanChangeStatusAsync(int invoiceId, InvoiceStatus newStatus, string userId, string userRole);
        Task<bool> ChangeStatusAsync(int invoiceId, InvoiceStatus newStatus, string userId, string userRole, string? reason = null);
        Task<IEnumerable<InvoiceStatus>> GetValidTransitionsAsync(int invoiceId, string userRole);
        Task<bool> IsOverdueAsync(int invoiceId);
        Task UpdateOverdueInvoicesAsync();
    }

    public class InvoiceStatusService : IInvoiceStatusService
    {
        private readonly IInvoiceService _invoiceService;
        private readonly IAuditService _auditService;

        public InvoiceStatusService(IInvoiceService invoiceService, IAuditService auditService)
        {
            _invoiceService = invoiceService;
            _auditService = auditService;
        }

        public async Task<bool> CanChangeStatusAsync(int invoiceId, InvoiceStatus newStatus, string userId, string userRole)
        {
            var invoice = await _invoiceService.GetByIdAsync(invoiceId);
            if (invoice == null) return false;

            var currentStatus = invoice.Status;
            var validTransitions = GetValidTransitionsForRole(currentStatus, userRole);

            return validTransitions.Contains(newStatus);
        }

        public async Task<bool> ChangeStatusAsync(int invoiceId, InvoiceStatus newStatus, string userId, string userRole, string? reason = null)
        {
            var invoice = await _invoiceService.GetByIdAsync(invoiceId);
            if (invoice == null) return false;

            if (!await CanChangeStatusAsync(invoiceId, newStatus, userId, userRole))
            {
                return false;
            }

            var previousStatus = invoice.Status;
            invoice.Status = newStatus;
            invoice.ModifiedAt = DateTime.UtcNow;
            invoice.ModifiedBy = userId;

            // Update specific fields based on status
            UpdateStatusSpecificFields(invoice, newStatus, userId);

            // Create status history entry
            await CreateStatusHistoryEntry(invoiceId, previousStatus, newStatus, userId, reason);

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

        public async Task<IEnumerable<InvoiceStatus>> GetValidTransitionsAsync(int invoiceId, string userRole)
        {
            var invoice = await _invoiceService.GetByIdAsync(invoiceId);
            if (invoice == null) return Enumerable.Empty<InvoiceStatus>();

            return GetValidTransitionsForRole(invoice.Status, userRole);
        }

        public async Task<bool> IsOverdueAsync(int invoiceId)
        {
            var invoice = await _invoiceService.GetByIdAsync(invoiceId);
            if (invoice == null || !invoice.DueDate.HasValue) return false;

            return invoice.DueDate.Value < DateTime.UtcNow && 
                   (invoice.Status == InvoiceStatus.Submitted || invoice.Status == InvoiceStatus.Approved);
        }

        public Task UpdateOverdueInvoicesAsync()
        {
            // This would typically be called by a background service
            // Implementation would query all invoices that should be marked as overdue
            // and update their status accordingly
            return Task.CompletedTask;
        }

        private IEnumerable<InvoiceStatus> GetValidTransitionsForRole(InvoiceStatus currentStatus, string userRole)
        {
            return currentStatus switch
            {
                InvoiceStatus.Submitted => new[] { InvoiceStatus.UnderReview, InvoiceStatus.Rejected, InvoiceStatus.OnHold, InvoiceStatus.Cancelled },
                InvoiceStatus.UnderReview => new[] { InvoiceStatus.Approved, InvoiceStatus.Rejected, InvoiceStatus.OnHold, InvoiceStatus.Cancelled },
                InvoiceStatus.Approved => new[] { InvoiceStatus.InProgress, InvoiceStatus.Rejected, InvoiceStatus.OnHold, InvoiceStatus.Cancelled },
                InvoiceStatus.InProgress => new[] { InvoiceStatus.Completed, InvoiceStatus.Rejected, InvoiceStatus.OnHold, InvoiceStatus.Cancelled },
                InvoiceStatus.Completed => new InvoiceStatus[0], // No transitions from Completed
                InvoiceStatus.Rejected => new[] { InvoiceStatus.Submitted },
                InvoiceStatus.Cancelled => new[] { InvoiceStatus.Submitted },
                InvoiceStatus.OnHold => new[] { InvoiceStatus.Submitted, InvoiceStatus.UnderReview, InvoiceStatus.Approved, InvoiceStatus.InProgress, InvoiceStatus.Cancelled },
                _ => new InvoiceStatus[0]
            };
        }

        private void UpdateStatusSpecificFields(Invoice invoice, InvoiceStatus newStatus, string userId)
        {
            switch (newStatus)
            {
                case InvoiceStatus.Submitted:
                    invoice.ProcessedBy = userId;
                    invoice.ProcessedDate = DateTime.UtcNow;
                    break;
                case InvoiceStatus.Approved:
                    invoice.ProcessedBy = userId;
                    invoice.ProcessedDate = DateTime.UtcNow;
                    break;
                case InvoiceStatus.Completed:
                    invoice.PaymentDate = DateTime.UtcNow;
                    invoice.PaidAmount = invoice.InvoiceValue;
                    break;
            }
        }

        private Task CreateStatusHistoryEntry(int invoiceId, InvoiceStatus previousStatus, InvoiceStatus newStatus, string userId, string? reason)
        {
            // This would create a StatusHistory entry
            // Implementation depends on your StatusHistory service
            return Task.CompletedTask;
        }
    }
}

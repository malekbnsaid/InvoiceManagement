using System.Threading.Tasks;

namespace InvoiceManagement.Server.Application.Interfaces
{
    public interface IAuditService
    {
        Task LogAuditAsync(string entityName, string entityId, string action, string userId, string changes);
    }
} 
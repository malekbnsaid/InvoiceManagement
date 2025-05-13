using System.Threading.Tasks;

namespace InvoiceManagement.Server.Application.Interfaces
{
    public interface IProjectNumberService
    {
        Task<string> GenerateProjectNumberAsync(int sectionId, int unitId);
    }
} 
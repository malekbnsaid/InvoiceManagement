using System.Threading.Tasks;
using InvoiceManagement.Server.Application.DTOs;

namespace InvoiceManagement.Server.Application.Interfaces
{
    public interface IOcrService
    {
        Task<OcrResult> ProcessInvoiceAsync(string filePath);
        Task<bool> ValidateInvoiceFormatAsync(string filePath);
        Task<double> GetConfidenceScoreAsync(string filePath);
        Task TrainModelAsync(string trainingDataPath);
    }
} 
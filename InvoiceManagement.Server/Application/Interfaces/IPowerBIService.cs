// Temporarily disabled Power BI interface to fix build issues
/*
using Microsoft.PowerBI.Api.Models;

namespace InvoiceManagement.Server.Application.Interfaces
{
    public interface IPowerBIService
    {
        Task<string> GetAccessTokenAsync();
        Task<EmbedToken> GetEmbedTokenAsync(string reportId, string datasetId);
        Task<List<Report>> GetReportsAsync();
        Task<Report> GetReportAsync(string reportId);
        Task<List<Dataset>> GetDatasetsAsync();
        Task<Dataset> GetDatasetAsync(string datasetId);
        Task<Group> GetWorkspaceAsync(string workspaceId);
        Task<List<Group>> GetWorkspacesAsync();
    }
}
*/

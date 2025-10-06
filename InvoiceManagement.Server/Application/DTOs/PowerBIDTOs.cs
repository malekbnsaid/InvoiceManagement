namespace InvoiceManagement.Server.Application.DTOs
{
    public class ReportDto
    {
        public string Id { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string WebUrl { get; set; } = string.Empty;
        public string EmbedUrl { get; set; } = string.Empty;
        public string DatasetId { get; set; } = string.Empty;
        public bool IsFromPbix { get; set; }
        public bool IsOwnedByMe { get; set; }
        public bool IsPublished { get; set; }
        public DateTime? CreatedDate { get; set; }
        public DateTime? ModifiedDate { get; set; }
    }

    public class DatasetDto
    {
        public string Id { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public bool IsRefreshable { get; set; }
        public bool IsEffectiveIdentityRequired { get; set; }
        public bool IsEffectiveIdentityRolesRequired { get; set; }
        public bool IsOnPremGatewayRequired { get; set; }
        public DateTime? CreatedDate { get; set; }
        public string ContentProviderType { get; set; } = string.Empty;
        public string CreateReportEmbedURL { get; set; } = string.Empty;
        public string QnaEmbedURL { get; set; } = string.Empty;
    }

    public class WorkspaceDto
    {
        public string Id { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public bool IsReadOnly { get; set; }
        public bool IsOnDedicatedCapacity { get; set; }
        public string CapacityId { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string Type { get; set; } = string.Empty;
        public string State { get; set; } = string.Empty;
        public bool IsOrphaned { get; set; }
    }

    public class EmbedTokenDto
    {
        public string Token { get; set; } = string.Empty;
        public string TokenId { get; set; } = string.Empty;
        public DateTime? Expiration { get; set; }
        public string AccessLevel { get; set; } = string.Empty;
    }

    public class EmbedTokenRequest
    {
        public string DatasetId { get; set; } = string.Empty;
        public string Username { get; set; } = string.Empty;
        public List<string> Roles { get; set; } = new();
    }

    public class PowerBIReportConfig
    {
        public string ReportId { get; set; } = string.Empty;
        public string DatasetId { get; set; } = string.Empty;
        public string WorkspaceId { get; set; } = string.Empty;
        public string ReportName { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public bool IsActive { get; set; } = true;
        public string Category { get; set; } = string.Empty; // e.g., "Financial", "Operational", "Executive"
        public int DisplayOrder { get; set; } = 0;
    }
}

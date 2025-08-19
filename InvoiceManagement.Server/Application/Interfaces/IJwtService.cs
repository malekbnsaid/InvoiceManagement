using System.Security.Claims;
using InvoiceManagement.Server.Domain.Entities;

namespace InvoiceManagement.Server.Application.Interfaces
{
    public interface IJwtService
    {
        string GenerateJwtToken(AppUser user);
        string GenerateRefreshToken();
        ClaimsPrincipal? GetPrincipalFromExpiredToken(string token);
        bool ValidateToken(string token);
    }
}

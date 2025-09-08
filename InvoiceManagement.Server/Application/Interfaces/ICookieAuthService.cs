using InvoiceManagement.Server.Application.DTOs;
using InvoiceManagement.Server.Domain.Entities;

namespace InvoiceManagement.Server.Application.Interfaces
{
    public interface ICookieAuthService
    {
        Task<CookieLoginResponseDto?> LoginAsync(LoginRequestDto request, string? sessionId = null);
        Task<CookieLoginResponseDto?> RefreshTokenAsync(string refreshToken, string? sessionId = null);
        Task<SignupResponseDto> SignupAsync(SignupRequestDto request);
        Task<bool> LogoutAsync(string refreshToken, string? sessionId = null);
        Task<bool> ValidateSessionAsync(string sessionId, string accessToken);
        Task<AppUser?> GetUserFromSessionAsync(string sessionId);
        Task<ForgotPasswordResponse> ForgotPasswordAsync(string email);
        Task<ResetPasswordResponse> ResetPasswordAsync(string token, string newPassword);
        Task<bool> ValidateResetTokenAsync(string token);
        Task<bool> ResetUserPasswordAsync(string username, string newPassword);
    }

    public class CookieLoginResponseDto
    {
        public string AccessToken { get; set; } = string.Empty;
        public string RefreshToken { get; set; } = string.Empty;
        public DateTime ExpiresAt { get; set; }
        public UserInfoDto User { get; set; } = new();
        public string SessionId { get; set; } = string.Empty;
    }
}

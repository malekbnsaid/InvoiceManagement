using InvoiceManagement.Server.Application.DTOs;
using InvoiceManagement.Server.Domain.Entities;

namespace InvoiceManagement.Server.Application.Interfaces
{
    public interface IAuthService
    {
        Task<LoginResponseDto?> LoginAsync(LoginRequestDto request);
        Task<SignupResponseDto> SignupAsync(SignupRequestDto request);
        Task<LoginResponseDto?> RefreshTokenAsync(string refreshToken);
        Task<bool> ValidateUserAsync(string username, string password);
        Task<AppUser?> GetUserByUsernameAsync(string username);
        Task<bool> UpdateRefreshTokenAsync(int userId, string refreshToken, DateTime expiryTime);
        Task<bool> ResetUserPasswordAsync(string username, string newPassword);
        Task<ForgotPasswordResponse> ForgotPasswordAsync(string email);
        Task<ResetPasswordResponse> ResetPasswordAsync(string token, string newPassword);
        Task<bool> ValidateResetTokenAsync(string token);
    }
}

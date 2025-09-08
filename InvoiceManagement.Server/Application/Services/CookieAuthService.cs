using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using InvoiceManagement.Server.Application.DTOs;
using InvoiceManagement.Server.Application.Interfaces;
using InvoiceManagement.Server.Domain.Entities;
using InvoiceManagement.Server.Domain.Enums;
using InvoiceManagement.Server.Infrastructure.Data;
using System.Security.Cryptography;
using System.Collections.Concurrent;

namespace InvoiceManagement.Server.Application.Services
{
    public class CookieAuthService : ICookieAuthService
    {
        private readonly ApplicationDbContext _context;
        private readonly IJwtService _jwtService;
        private readonly IEmailService _emailService;
        private readonly IConfiguration _configuration;
        
        // In-memory session store for development (use Redis/database in production)
        private static readonly ConcurrentDictionary<string, SessionData> _sessions = new();

        public CookieAuthService(
            ApplicationDbContext context,
            IJwtService jwtService,
            IEmailService emailService,
            IConfiguration configuration)
        {
            _context = context;
            _jwtService = jwtService;
            _emailService = emailService;
            _configuration = configuration;
        }

        public async Task<CookieLoginResponseDto?> LoginAsync(LoginRequestDto request, string? sessionId = null)
        {
            try
            {
                // Find user by username
                var user = await _context.AppUsers
                    .Include(u => u.Employee)
                    .FirstOrDefaultAsync(u => u.User_Name == request.Username && u.Is_Active);

                if (user == null)
                {
                    Console.WriteLine($"🔐 CookieAuth: User not found: {request.Username}");
                    return null;
                }

                // Verify password
                if (!BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash))
                {
                    Console.WriteLine($"🔐 CookieAuth: Invalid password for user: {request.Username}");
                    return null;
                }

                // Generate session ID if not provided
                sessionId ??= GenerateSessionId();

                // Generate tokens
                var accessToken = _jwtService.GenerateJwtToken(user);
                var refreshToken = _jwtService.GenerateRefreshToken();

                // Update user's refresh token
                user.RefreshToken = refreshToken;
                user.RefreshTokenExpiryTime = DateTime.UtcNow.AddDays(7);
                user.LastLoginDate = DateTime.UtcNow;

                await _context.SaveChangesAsync();

                // Store session data
                var sessionData = new SessionData
                {
                    SessionId = sessionId,
                    UserId = user.User_Seq,
                    AccessToken = accessToken,
                    RefreshToken = refreshToken,
                    ExpiresAt = DateTime.UtcNow.AddMinutes(60), // Access token expires in 1 hour
                    RefreshExpiresAt = DateTime.UtcNow.AddDays(7), // Refresh token expires in 7 days
                    LastActivity = DateTime.UtcNow,
                    UserAgent = "", // Can be set from HTTP context
                    IpAddress = "" // Can be set from HTTP context
                };

                _sessions.AddOrUpdate(sessionId, sessionData, (key, oldValue) => sessionData);

                Console.WriteLine($"🔐 CookieAuth: Login successful for user: {user.User_Name}, Session: {sessionId}");

                // Map user to DTO
                var userDto = new UserInfoDto
                {
                    UserId = user.User_Seq,
                    Username = user.User_Name,
                    Email = user.EMAIL,
                    Role = user.Role.ToString(),
                    EmployeeNumber = user.EMPLOYEE_NUMBER,
                    IsActive = user.Is_Active
                };

                return new CookieLoginResponseDto
                {
                    AccessToken = accessToken,
                    RefreshToken = refreshToken,
                    ExpiresAt = sessionData.ExpiresAt,
                    User = userDto,
                    SessionId = sessionId
                };
            }
            catch (Exception ex)
            {
                Console.WriteLine($"🔐 CookieAuth: Login error: {ex.Message}");
                throw;
            }
        }

        public async Task<CookieLoginResponseDto?> RefreshTokenAsync(string refreshToken, string? sessionId = null)
        {
            try
            {
                // Find session by refresh token or session ID
                SessionData? session = null;
                
                if (!string.IsNullOrEmpty(sessionId) && _sessions.TryGetValue(sessionId, out var sessionData))
                {
                    session = sessionData;
                }
                else
                {
                    // Fallback: find by refresh token
                    session = _sessions.Values.FirstOrDefault(s => s.RefreshToken == refreshToken);
                }

                if (session == null || session.RefreshExpiresAt < DateTime.UtcNow)
                {
                    Console.WriteLine($"🔐 CookieAuth: Session not found or expired for refresh token");
                    return null;
                }

                // Find user
                var user = await _context.AppUsers
                    .Include(u => u.Employee)
                    .FirstOrDefaultAsync(u => u.User_Seq == session.UserId && u.Is_Active);

                if (user == null || user.RefreshToken != refreshToken)
                {
                    Console.WriteLine($"🔐 CookieAuth: User not found or refresh token mismatch");
                    return null;
                }

                // Generate new tokens
                var newAccessToken = _jwtService.GenerateJwtToken(user);
                var newRefreshToken = _jwtService.GenerateRefreshToken();

                // Update user's refresh token
                user.RefreshToken = newRefreshToken;
                user.RefreshTokenExpiryTime = DateTime.UtcNow.AddDays(7);

                await _context.SaveChangesAsync();

                // Update session
                session.AccessToken = newAccessToken;
                session.RefreshToken = newRefreshToken;
                session.ExpiresAt = DateTime.UtcNow.AddMinutes(60);
                session.RefreshExpiresAt = DateTime.UtcNow.AddDays(7);
                session.LastActivity = DateTime.UtcNow;

                Console.WriteLine($"🔐 CookieAuth: Token refreshed for user: {user.User_Name}, Session: {session.SessionId}");

                // Map user to DTO
                var userDto = new UserInfoDto
                {
                    UserId = user.User_Seq,
                    Username = user.User_Name,
                    Email = user.EMAIL,
                    Role = user.Role.ToString(),
                    EmployeeNumber = user.EMPLOYEE_NUMBER,
                    IsActive = user.Is_Active
                };

                return new CookieLoginResponseDto
                {
                    AccessToken = newAccessToken,
                    RefreshToken = newRefreshToken,
                    ExpiresAt = session.ExpiresAt,
                    User = userDto,
                    SessionId = session.SessionId
                };
            }
            catch (Exception ex)
            {
                Console.WriteLine($"🔐 CookieAuth: Refresh token error: {ex.Message}");
                throw;
            }
        }

        public async Task<bool> LogoutAsync(string refreshToken, string? sessionId = null)
        {
            try
            {
                // Find and remove session
                if (!string.IsNullOrEmpty(sessionId) && _sessions.TryRemove(sessionId, out var session))
                {
                    Console.WriteLine($"🔐 CookieAuth: Session {sessionId} removed");
                }
                else
                {
                    // Fallback: find by refresh token
                    var sessionToRemove = _sessions.FirstOrDefault(kvp => kvp.Value.RefreshToken == refreshToken);
                    if (!sessionToRemove.Equals(default(KeyValuePair<string, SessionData>)))
                    {
                        _sessions.TryRemove(sessionToRemove.Key, out _);
                        Console.WriteLine($"🔐 CookieAuth: Session {sessionToRemove.Key} removed by refresh token");
                    }
                }

                // Clear refresh token from database
                var user = await _context.AppUsers.FirstOrDefaultAsync(u => u.RefreshToken == refreshToken);
                if (user != null)
                {
                    user.RefreshToken = null;
                    user.RefreshTokenExpiryTime = null;
                    await _context.SaveChangesAsync();
                }

                return true;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"🔐 CookieAuth: Logout error: {ex.Message}");
                return false;
            }
        }

        public Task<bool> ValidateSessionAsync(string sessionId, string accessToken)
        {
            try
            {
                if (!_sessions.TryGetValue(sessionId, out var session))
                {
                    return Task.FromResult(false);
                }

                if (session.ExpiresAt < DateTime.UtcNow)
                {
                    // Remove expired session
                    _sessions.TryRemove(sessionId, out _);
                    return Task.FromResult(false);
                }

                if (session.AccessToken != accessToken)
                {
                    return Task.FromResult(false);
                }

                // Update last activity
                session.LastActivity = DateTime.UtcNow;

                return Task.FromResult(true);
            }
            catch
            {
                return Task.FromResult(false);
            }
        }

        public async Task<AppUser?> GetUserFromSessionAsync(string sessionId)
        {
            try
            {
                if (!_sessions.TryGetValue(sessionId, out var session))
                {
                    return null;
                }

                if (session.ExpiresAt < DateTime.UtcNow)
                {
                    // Remove expired session
                    _sessions.TryRemove(sessionId, out _);
                    return null;
                }

                var user = await _context.AppUsers
                    .Include(u => u.Employee)
                    .FirstOrDefaultAsync(u => u.User_Seq == session.UserId && u.Is_Active);

                return user;
            }
            catch
            {
                return null;
            }
        }

        public Task<SignupResponseDto> SignupAsync(SignupRequestDto request)
        {
            // Implementation similar to original AuthService
            // ... (keeping this simple for now, can be expanded)
            return Task.FromException<SignupResponseDto>(new NotImplementedException("Signup functionality to be implemented"));
        }

        public Task<ForgotPasswordResponse> ForgotPasswordAsync(string email)
        {
            // Implementation similar to original AuthService
            // ... (keeping this simple for now, can be expanded)
            return Task.FromException<ForgotPasswordResponse>(new NotImplementedException("Forgot password functionality to be implemented"));
        }

        public Task<ResetPasswordResponse> ResetPasswordAsync(string token, string newPassword)
        {
            // Implementation similar to original AuthService
            // ... (keeping this simple for now, can be expanded)
            return Task.FromException<ResetPasswordResponse>(new NotImplementedException("Reset password functionality to be implemented"));
        }

        public Task<bool> ValidateResetTokenAsync(string token)
        {
            // Implementation similar to original AuthService
            // ... (keeping this simple for now, can be expanded)
            return Task.FromException<bool>(new NotImplementedException("Validate reset token functionality to be implemented"));
        }

        public Task<bool> ResetUserPasswordAsync(string username, string newPassword)
        {
            // Implementation similar to original AuthService
            // ... (keeping this simple for now, can be expanded)
            return Task.FromException<bool>(new NotImplementedException("Reset user password functionality to be implemented"));
        }

        private static string GenerateSessionId()
        {
            return $"session_{DateTimeOffset.UtcNow.ToUnixTimeMilliseconds()}_{Guid.NewGuid():N}";
        }

        // Clean up expired sessions periodically
        public static void CleanupExpiredSessions()
        {
            var expiredSessions = _sessions.Where(kvp => 
                kvp.Value.ExpiresAt < DateTime.UtcNow || 
                kvp.Value.RefreshExpiresAt < DateTime.UtcNow)
                .Select(kvp => kvp.Key)
                .ToList();

            foreach (var sessionId in expiredSessions)
            {
                _sessions.TryRemove(sessionId, out _);
            }

            Console.WriteLine($"🔐 CookieAuth: Cleaned up {expiredSessions.Count} expired sessions");
        }
    }

    // Session data model
    public class SessionData
    {
        public string SessionId { get; set; } = string.Empty;
        public int UserId { get; set; }
        public string AccessToken { get; set; } = string.Empty;
        public string RefreshToken { get; set; } = string.Empty;
        public DateTime ExpiresAt { get; set; }
        public DateTime RefreshExpiresAt { get; set; }
        public DateTime LastActivity { get; set; }
        public string UserAgent { get; set; } = string.Empty;
        public string IpAddress { get; set; } = string.Empty;
    }
}

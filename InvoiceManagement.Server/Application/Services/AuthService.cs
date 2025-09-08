using System.Text;
using System.Security.Cryptography;
using Microsoft.EntityFrameworkCore;
using InvoiceManagement.Server.Application.DTOs;
using InvoiceManagement.Server.Application.Interfaces;
using InvoiceManagement.Server.Domain.Entities;
using InvoiceManagement.Server.Infrastructure.Data;
using InvoiceManagement.Server.Domain.Enums;
using BCrypt.Net;

namespace InvoiceManagement.Server.Application.Services
{
    public class AuthService : IAuthService
    {
        private readonly ApplicationDbContext _context;
        private readonly IJwtService _jwtService;
        private readonly IEmailService _emailService;
        private readonly IConfiguration _configuration;

        public AuthService(ApplicationDbContext context, IJwtService jwtService, IEmailService emailService, IConfiguration configuration)
        {
            _context = context;
            _jwtService = jwtService;
            _emailService = emailService;
            _configuration = configuration;
        }

        public async Task<LoginResponseDto?> LoginAsync(LoginRequestDto request)
        {
            var user = await GetUserByUsernameAsync(request.Username);
            if (user == null || !user.Is_Active)
                return null;

            if (!await ValidateUserAsync(request.Username, request.Password))
                return null;

            var token = _jwtService.GenerateJwtToken(user);
            var refreshToken = _jwtService.GenerateRefreshToken();
            var expiresAt = DateTime.UtcNow.AddMinutes(60); // Match JWT duration

            // Update user's refresh token
            await UpdateRefreshTokenAsync(user.User_Seq, refreshToken, expiresAt);

            return new LoginResponseDto
            {
                Token = token,
                RefreshToken = refreshToken,
                ExpiresAt = expiresAt,
                User = new UserInfoDto
                {
                    UserId = user.User_Seq,
                    Username = user.User_Name,
                    Email = user.EMAIL,
                    Role = user.Role.ToString(),
                    EmployeeNumber = user.EMPLOYEE_NUMBER,
                    IsActive = user.Is_Active
                }
            };
        }

        public async Task<SignupResponseDto> SignupAsync(SignupRequestDto request)
        {
            try
            {
                // Check if username already exists
                var existingUser = await GetUserByUsernameAsync(request.Username);
                if (existingUser != null)
                {
                    return new SignupResponseDto
                    {
                        Success = false,
                        Message = "Username already exists"
                    };
                }

                // Check if email already exists
                var existingEmail = await _context.AppUsers
                    .FirstOrDefaultAsync(u => u.EMAIL == request.Email);
                if (existingEmail != null)
                {
                    return new SignupResponseDto
                    {
                        Success = false,
                        Message = "Email already exists"
                    };
                }

                // Check if employee number already exists in ERP system
                var existingEmployeeNumber = await _context.ERPEmployees
                    .FirstOrDefaultAsync(e => e.EmployeeNumber == request.EmployeeNumber);
                if (existingEmployeeNumber != null)
                {
                    // Check if this employee already has an AppUser
                    var existingAppUser = await _context.AppUsers
                        .FirstOrDefaultAsync(u => u.EMPLOYEE_NUMBER == request.EmployeeNumber);
                    if (existingAppUser != null)
                    {
                        return new SignupResponseDto
                        {
                            Success = false,
                            Message = "Employee number already has an account"
                        };
                    }
                }

                // Parse role
                if (!Enum.TryParse<UserRole>(request.Role, out var userRole))
                {
                    return new SignupResponseDto
                    {
                        Success = false,
                        Message = "Invalid role specified"
                    };
                }

                // First, create or find the ERPEmployee
                var existingEmployee = await _context.ERPEmployees
                    .FirstOrDefaultAsync(e => e.EmployeeNumber == request.EmployeeNumber);
                
                ERPEmployee employee;
                if (existingEmployee == null)
                {
                    // Create new ERPEmployee
                    employee = new ERPEmployee
                    {
                        EmployeeNumber = request.EmployeeNumber,
                        EmployeeName = request.Username,
                        Email = request.Email,
                        Department = "General", // Default department
                        DepartmentID = 1, // Default department ID
                        JobTitle = request.Role,
                        Status = "Active",
                        Rec_DateTime = DateTime.UtcNow,
                        Rec_UserId = "System",
                        Rec_IsActive = true,
                        CreatedAt = DateTime.UtcNow
                    };
                    _context.ERPEmployees.Add(employee);
                    await _context.SaveChangesAsync(); // Save employee first
                }
                else
                {
                    employee = existingEmployee;
                }

                // Create new user
                var newUser = new AppUser
                {
                    User_Name = request.Username,
                    EMAIL = request.Email,
                    EMPLOYEE_NUMBER = request.EmployeeNumber,
                    userType_code = (int)userRole,
                    PasswordHash = HashPassword(request.Password), // Hash the password
                    Is_Active = true,
                    Rec_Date = DateTime.UtcNow,
                    Rec_User = "System",
                    CreatedAt = DateTime.UtcNow
                };

                _context.AppUsers.Add(newUser);
                await _context.SaveChangesAsync();

                // Send welcome email
                try
                {
                    var baseUrl = _configuration["AppSettings:BaseUrl"] ?? "http://localhost:3000";
                    await _emailService.SendWelcomeEmailAsync(request.Email, request.Username);
                }
                catch (Exception emailEx)
                {
                    // Log email error but don't fail signup
                    Console.WriteLine($"Welcome email failed: {emailEx.Message}");
                }

                return new SignupResponseDto
                {
                    Success = true,
                    Message = "User created successfully",
                    User = new UserInfoDto
                    {
                        UserId = newUser.User_Seq,
                        Username = newUser.User_Name,
                        Email = newUser.EMAIL,
                        Role = newUser.Role.ToString(),
                        EmployeeNumber = newUser.EMPLOYEE_NUMBER,
                        IsActive = newUser.Is_Active
                    }
                };
            }
            catch (Exception ex)
            {
                // Log the full exception details for debugging
                Console.WriteLine($"Signup error: {ex.Message}");
                Console.WriteLine($"Stack trace: {ex.StackTrace}");
                
                if (ex.InnerException != null)
                {
                    Console.WriteLine($"Inner exception: {ex.InnerException.Message}");
                }
                
                return new SignupResponseDto
                {
                    Success = false,
                    Message = $"Error creating user: {ex.Message}"
                };
            }
        }

        public async Task<LoginResponseDto?> RefreshTokenAsync(string refreshToken)
        {
            var user = await _context.AppUsers
                .FirstOrDefaultAsync(u => u.RefreshToken == refreshToken && 
                                        u.RefreshTokenExpiryTime > DateTime.UtcNow);

            if (user == null || !user.Is_Active)
                return null;

            var newToken = _jwtService.GenerateJwtToken(user);
            var newRefreshToken = _jwtService.GenerateRefreshToken();
            var expiresAt = DateTime.UtcNow.AddMinutes(60);

            await UpdateRefreshTokenAsync(user.User_Seq, newRefreshToken, expiresAt);

            return new LoginResponseDto
            {
                Token = newToken,
                RefreshToken = newRefreshToken,
                ExpiresAt = expiresAt,
                User = new UserInfoDto
                {
                    UserId = user.User_Seq,
                    Username = user.User_Name,
                    Email = user.EMAIL,
                    Role = user.Role.ToString(),
                    EmployeeNumber = user.EMPLOYEE_NUMBER,
                    IsActive = user.Is_Active
                }
            };
        }

        public async Task<bool> ValidateUserAsync(string username, string password)
        {
            var user = await GetUserByUsernameAsync(username);
            if (user == null)
                return false;

            // Verify password using BCrypt or legacy SHA256
            var isValid = VerifyPassword(password, user.PasswordHash);
            
            // If password is valid and it was a legacy hash, upgrade it
            if (isValid && !user.PasswordHash.StartsWith("$2"))
            {
                try
                {
                    user.PasswordHash = HashPassword(password);
                    await _context.SaveChangesAsync();
                    Console.WriteLine($"Successfully upgraded password hash for user: {username}");
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"Failed to upgrade password hash for user {username}: {ex.Message}");
                    // Don't fail the login, just log the error
                }
            }
            
            return isValid;
        }

        public async Task<AppUser?> GetUserByUsernameAsync(string username)
        {
            return await _context.AppUsers
                .Include(u => u.Employee)
                .FirstOrDefaultAsync(u => u.User_Name == username && u.Is_Active);
        }

        public async Task<bool> UpdateRefreshTokenAsync(int userId, string refreshToken, DateTime expiryTime)
        {
            var user = await _context.AppUsers.FindAsync(userId);
            if (user == null)
                return false;

            user.RefreshToken = refreshToken;
            user.RefreshTokenExpiryTime = expiryTime;
            user.LastLoginDate = DateTime.UtcNow;

            await _context.SaveChangesAsync();
            return true;
        }

        private string HashPassword(string password)
        {
            // Use BCrypt with work factor 12 (good balance of security vs performance)
            return BCrypt.Net.BCrypt.HashPassword(password, BCrypt.Net.BCrypt.GenerateSalt(12));
        }

        private bool VerifyPassword(string password, string hash)
        {
            try
            {
                // First try bcrypt verification
                return BCrypt.Net.BCrypt.Verify(password, hash);
            }
            catch (BCrypt.Net.SaltParseException)
            {
                // Handle legacy SHA256 hashes during migration
                try
                {
                    using var sha256 = SHA256.Create();
                    var hashedBytes = sha256.ComputeHash(Encoding.UTF8.GetBytes(password));
                    var sha256Hash = Convert.ToBase64String(hashedBytes);
                    
                    if (sha256Hash == hash)
                    {
                        // Legacy password is correct, upgrade to bcrypt
                        Console.WriteLine($"Upgrading password hash for user from SHA256 to bcrypt");
                        return true;
                    }
                }
                catch
                {
                    // If SHA256 verification fails, return false
                }
                
                return false;
            }
        }

        // Helper method to reset a user's password (for development/testing)
        public async Task<bool> ResetUserPasswordAsync(string username, string newPassword)
        {
            try
            {
                var user = await GetUserByUsernameAsync(username);
                if (user == null)
                    return false;

                user.PasswordHash = HashPassword(newPassword);
                await _context.SaveChangesAsync();
                
                Console.WriteLine($"Password reset successfully for user: {username}");
                return true;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Failed to reset password for user {username}: {ex.Message}");
                return false;
            }
        }

        // Generate a secure random token
        private string GenerateResetToken()
        {
            var randomBytes = new byte[32];
            using (var rng = System.Security.Cryptography.RandomNumberGenerator.Create())
            {
                rng.GetBytes(randomBytes);
            }
            return Convert.ToBase64String(randomBytes).Replace("+", "-").Replace("/", "_").Replace("=", "");
        }

        // Send password reset email using email service
        private async Task SendPasswordResetEmailAsync(string email, string token)
        {
            try
            {
                var user = await _context.AppUsers.FirstOrDefaultAsync(u => u.EMAIL == email);
                if (user != null)
                {
                    var resetUrl = $"{_configuration["AppSettings:BaseUrl"] ?? "http://localhost:3000"}/reset-password";
                    await _emailService.SendPasswordResetEmailAsync(email, user.User_Name, token, resetUrl);
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Failed to send password reset email: {ex.Message}");
                // Don't fail the operation, just log the error
            }
        }

        // Forgot password - send reset email
        public async Task<ForgotPasswordResponse> ForgotPasswordAsync(string email)
        {
            try
            {
                var user = await _context.AppUsers.FirstOrDefaultAsync(u => u.EMAIL == email);
                if (user == null)
                {
                    // Don't reveal if email exists or not (security best practice)
                    return new ForgotPasswordResponse
                    {
                        Success = true,
                        Message = "If an account with that email exists, a password reset link has been sent."
                    };
                }

                // Generate reset token
                var token = GenerateResetToken();
                var expiresAt = DateTime.UtcNow.AddHours(24); // Token expires in 24 hours

                // Save reset token
                var resetToken = new PasswordResetToken
                {
                    Email = email,
                    Token = token,
                    ExpiresAt = expiresAt,
                    UserId = user.User_Seq
                };

                _context.PasswordResetTokens.Add(resetToken);
                await _context.SaveChangesAsync();

                // Send reset email
                await SendPasswordResetEmailAsync(email, token);

                return new ForgotPasswordResponse
                {
                    Success = true,
                    Message = "If an account with that email exists, a password reset link has been sent."
                };
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Forgot password error: {ex.Message}");
                return new ForgotPasswordResponse
                {
                    Success = false,
                    Message = "An error occurred while processing your request."
                };
            }
        }

        // Reset password using token
        public async Task<ResetPasswordResponse> ResetPasswordAsync(string token, string newPassword)
        {
            try
            {
                var resetToken = await _context.PasswordResetTokens
                    .FirstOrDefaultAsync(t => t.Token == token && !t.IsUsed && t.ExpiresAt > DateTime.UtcNow);

                if (resetToken == null)
                {
                    return new ResetPasswordResponse
                    {
                        Success = false,
                        Message = "Invalid or expired reset token."
                    };
                }

                // Find user by email
                var user = await _context.AppUsers.FirstOrDefaultAsync(u => u.EMAIL == resetToken.Email);
                if (user == null)
                {
                    return new ResetPasswordResponse
                    {
                        Success = false,
                        Message = "User not found."
                    };
                }

                // Update password
                user.PasswordHash = HashPassword(newPassword);
                
                // Mark token as used
                resetToken.IsUsed = true;
                resetToken.UsedAt = DateTime.UtcNow;

                await _context.SaveChangesAsync();

                return new ResetPasswordResponse
                {
                    Success = true,
                    Message = "Password has been reset successfully. You can now login with your new password."
                };
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Reset password error: {ex.Message}");
                return new ResetPasswordResponse
                {
                    Success = false,
                    Message = "An error occurred while resetting your password."
                };
            }
        }

        // Validate reset token
        public async Task<bool> ValidateResetTokenAsync(string token)
        {
            try
            {
                var resetToken = await _context.PasswordResetTokens
                    .FirstOrDefaultAsync(t => t.Token == token && !t.IsUsed && t.ExpiresAt > DateTime.UtcNow);

                return resetToken != null;
            }
            catch
            {
                return false;
            }
        }
    }
}

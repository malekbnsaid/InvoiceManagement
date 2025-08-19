using System.Security.Cryptography;
using System.Text;
using Microsoft.EntityFrameworkCore;
using InvoiceManagement.Server.Application.DTOs;
using InvoiceManagement.Server.Application.Interfaces;
using InvoiceManagement.Server.Domain.Entities;
using InvoiceManagement.Server.Infrastructure.Data;
using InvoiceManagement.Server.Domain.Enums;

namespace InvoiceManagement.Server.Application.Services
{
    public class AuthService : IAuthService
    {
        private readonly ApplicationDbContext _context;
        private readonly IJwtService _jwtService;

        public AuthService(ApplicationDbContext context, IJwtService jwtService)
        {
            _context = context;
            _jwtService = jwtService;
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

            // Hash the provided password and compare with stored hash
            var hashedPassword = HashPassword(password);
            return user.PasswordHash == hashedPassword;
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
            using var sha256 = SHA256.Create();
            var hashedBytes = sha256.ComputeHash(Encoding.UTF8.GetBytes(password));
            return Convert.ToBase64String(hashedBytes);
        }
    }
}

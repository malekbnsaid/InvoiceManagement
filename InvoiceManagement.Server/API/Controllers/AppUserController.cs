using InvoiceManagement.Server.Domain.Entities;
using InvoiceManagement.Server.Domain.Enums;
using InvoiceManagement.Server.Infrastructure.Data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace InvoiceManagement.Server.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AppUserController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public AppUserController(ApplicationDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<AppUserDto>>> GetUsers()
        {
            // Debug: Check total AppUsers count
            var totalUsers = await _context.AppUsers.CountAsync();
            var activeUsers = await _context.AppUsers.CountAsync(u => u.Is_Active);
            
            Console.WriteLine($"🔍 AppUserController: Total AppUsers: {totalUsers}, Active: {activeUsers}");

            var users = await _context.AppUsers
                .Include(u => u.Employee)
                .Where(u => u.Is_Active)
                .Select(u => new AppUserDto
                {
                    Id = u.User_Seq,
                    Username = u.User_Name,
                    Email = u.EMAIL,
                    Role = (UserRole)u.userType_code,
                    RoleName = ((UserRole)u.userType_code).ToString(),
                    IsActive = u.Is_Active,
                    LastLoginDate = u.LastLoginDate,
                    CreatedAt = u.CreatedAt,
                    ModifiedAt = u.ModifiedAt,
                    EmployeeNumber = u.EMPLOYEE_NUMBER,
                    EmployeeName = u.Employee != null ? u.Employee.EmployeeName : null,
                    Department = u.Employee != null ? u.Employee.Department : null
                })
                .ToListAsync();

            Console.WriteLine($"🔍 AppUserController: Returning {users.Count} users");
            
            // Convert to plain array to avoid Entity Framework JSON serialization issues
            var plainUsers = users.ToList();
            return Ok(plainUsers);
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<AppUserDto>> GetUser(int id)
        {
            var user = await _context.AppUsers
                .Include(u => u.Employee)
                .FirstOrDefaultAsync(u => u.User_Seq == id);

            if (user == null)
            {
                return NotFound();
            }

            var userDto = new AppUserDto
            {
                Id = user.User_Seq,
                Username = user.User_Name,
                Email = user.EMAIL,
                Role = (UserRole)user.userType_code,
                RoleName = ((UserRole)user.userType_code).ToString(),
                IsActive = user.Is_Active,
                LastLoginDate = user.LastLoginDate,
                CreatedAt = user.CreatedAt,
                ModifiedAt = user.ModifiedAt,
                EmployeeNumber = user.EMPLOYEE_NUMBER,
                EmployeeName = user.Employee != null ? user.Employee.EmployeeName : null,
                Department = user.Employee != null ? user.Employee.Department : null
            };

            return Ok(userDto);
        }

        [HttpPost]
        public async Task<ActionResult<AppUserDto>> CreateUser(CreateAppUserDto createUserDto)
        {
            // Check if username already exists
            if (await _context.AppUsers.AnyAsync(u => u.User_Name == createUserDto.Username))
            {
                return BadRequest("Username already exists");
            }

            // Check if email already exists
            if (await _context.AppUsers.AnyAsync(u => u.EMAIL == createUserDto.Email))
            {
                return BadRequest("Email already exists");
            }

            var user = new AppUser
            {
                User_Name = createUserDto.Username,
                EMAIL = createUserDto.Email,
                userType_code = (int)createUserDto.Role,
                EMPLOYEE_NUMBER = createUserDto.EmployeeNumber ?? "",
                Is_Active = true,
                Rec_Date = DateTime.UtcNow,
                Rec_User = "System",
                CreatedAt = DateTime.UtcNow,
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(createUserDto.Password) // Hash the password
            };

            _context.AppUsers.Add(user);
            await _context.SaveChangesAsync();

            var userDto = new AppUserDto
            {
                Id = user.User_Seq,
                Username = user.User_Name,
                Email = user.EMAIL,
                Role = (UserRole)user.userType_code,
                RoleName = ((UserRole)user.userType_code).ToString(),
                IsActive = user.Is_Active,
                LastLoginDate = user.LastLoginDate,
                CreatedAt = user.CreatedAt,
                ModifiedAt = user.ModifiedAt,
                EmployeeNumber = user.EMPLOYEE_NUMBER
            };

            return CreatedAtAction(nameof(GetUser), new { id = user.User_Seq }, userDto);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateUser(int id, UpdateAppUserDto updateUserDto)
        {
            var user = await _context.AppUsers.FindAsync(id);
            if (user == null)
            {
                return NotFound();
            }

            // Check if username already exists (excluding current user)
            if (await _context.AppUsers.AnyAsync(u => u.User_Name == updateUserDto.Username && u.User_Seq != id))
            {
                return BadRequest("Username already exists");
            }

            // Check if email already exists (excluding current user)
            if (await _context.AppUsers.AnyAsync(u => u.EMAIL == updateUserDto.Email && u.User_Seq != id))
            {
                return BadRequest("Email already exists");
            }

            user.User_Name = updateUserDto.Username;
            user.EMAIL = updateUserDto.Email;
            user.userType_code = (int)updateUserDto.Role;
            user.Is_Active = updateUserDto.IsActive;
            user.ModifiedAt = DateTime.UtcNow;

            // Update password if provided
            if (!string.IsNullOrEmpty(updateUserDto.Password))
            {
                user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(updateUserDto.Password);
            }

            await _context.SaveChangesAsync();

            return NoContent();
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteUser(int id)
        {
            var user = await _context.AppUsers.FindAsync(id);
            if (user == null)
            {
                return NotFound();
            }

            // Soft delete - just deactivate
            user.Is_Active = false;
            user.ModifiedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            return NoContent();
        }

        [HttpGet("roles")]
        public ActionResult<IEnumerable<RoleDto>> GetRoles()
        {
            var roles = Enum.GetValues<UserRole>()
                .Select(r => new RoleDto
                {
                    Value = (int)r,
                    Name = r.ToString(),
                    Description = GetRoleDescription(r)
                })
                .ToList();

            // Convert to plain array to avoid Entity Framework JSON serialization issues
            var plainRoles = roles.ToList();
            return Ok(plainRoles);
        }

        [HttpGet("stats")]
        public async Task<ActionResult<UserStatsDto>> GetUserStats()
        {
            var totalUsers = await _context.AppUsers.CountAsync(u => u.Is_Active);
            var activeUsers = await _context.AppUsers.CountAsync(u => u.Is_Active && u.LastLoginDate.HasValue);
            var adminUsers = await _context.AppUsers.CountAsync(u => u.Is_Active && u.userType_code == (int)UserRole.Admin);
            var pmoUsers = await _context.AppUsers.CountAsync(u => u.Is_Active && u.userType_code == (int)UserRole.PMO);
            var pmUsers = await _context.AppUsers.CountAsync(u => u.Is_Active && u.userType_code == (int)UserRole.PM);
            var secretaryUsers = await _context.AppUsers.CountAsync(u => u.Is_Active && u.userType_code == (int)UserRole.Secretary);

            var roleBreakdown = new Dictionary<string, int>
            {
                ["Admin"] = adminUsers,
                ["Head"] = await _context.AppUsers.CountAsync(u => u.Is_Active && u.userType_code == (int)UserRole.Head),
                ["PMO"] = pmoUsers,
                ["PM"] = pmUsers,
                ["Secretary"] = secretaryUsers,
                ["ReadOnly"] = await _context.AppUsers.CountAsync(u => u.Is_Active && u.userType_code == (int)UserRole.ReadOnly)
            };

            var stats = new UserStatsDto
            {
                TotalUsers = totalUsers,
                ActiveUsers = activeUsers,
                InactiveUsers = totalUsers - activeUsers,
                RoleBreakdown = roleBreakdown
            };

            // Convert to plain object to avoid Entity Framework JSON serialization issues
            return Ok(new
            {
                totalUsers = stats.TotalUsers,
                activeUsers = stats.ActiveUsers,
                inactiveUsers = stats.InactiveUsers,
                roleBreakdown = stats.RoleBreakdown
            });
        }

        private string GetRoleDescription(UserRole role)
        {
            return role switch
            {
                UserRole.Admin => "Full access to everything",
                UserRole.Head => "Department head level access",
                UserRole.PMO => "Project Management Office - approves projects",
                UserRole.PM => "Project Manager - creates projects",
                UserRole.Secretary => "Uploads invoices",
                UserRole.ReadOnly => "Read-only access",
                _ => "Unknown role"
            };
        }
    }

    public class AppUserDto
    {
        public int Id { get; set; }
        public string Username { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public UserRole Role { get; set; }
        public string RoleName { get; set; } = string.Empty;
        public bool IsActive { get; set; }
        public DateTime? LastLoginDate { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? ModifiedAt { get; set; }
        public string EmployeeNumber { get; set; } = string.Empty;
        public string? EmployeeName { get; set; }
        public string? Department { get; set; }
    }

    public class CreateAppUserDto
    {
        public string Username { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
        public UserRole Role { get; set; }
        public string? EmployeeNumber { get; set; }
    }

    public class UpdateAppUserDto
    {
        public string Username { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string? Password { get; set; }
        public UserRole Role { get; set; }
        public bool IsActive { get; set; }
    }

    public class RoleDto
    {
        public int Value { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
    }

    public class UserStatsDto
    {
        public int TotalUsers { get; set; }
        public int ActiveUsers { get; set; }
        public int InactiveUsers { get; set; }
        public Dictionary<string, int> RoleBreakdown { get; set; } = new();
    }
}

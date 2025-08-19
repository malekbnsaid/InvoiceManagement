using System.ComponentModel.DataAnnotations;

namespace InvoiceManagement.Server.Application.DTOs
{
    public class SignupRequestDto
    {
        [Required]
        public string Username { get; set; } = string.Empty;
        
        [Required]
        [EmailAddress]
        public string Email { get; set; } = string.Empty;
        
        [Required]
        [MinLength(6)]
        public string Password { get; set; } = string.Empty;
        
        [Required]
        [Compare("Password")]
        public string ConfirmPassword { get; set; } = string.Empty;
        
        [Required]
        public string EmployeeNumber { get; set; } = string.Empty;
        
        [Required]
        public string Role { get; set; } = string.Empty;
    }

    public class SignupResponseDto
    {
        public bool Success { get; set; }
        public string Message { get; set; } = string.Empty;
        public UserInfoDto? User { get; set; }
    }
}

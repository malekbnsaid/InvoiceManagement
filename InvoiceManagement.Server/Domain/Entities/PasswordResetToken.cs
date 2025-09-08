using System.ComponentModel.DataAnnotations;

namespace InvoiceManagement.Server.Domain.Entities
{
    public class PasswordResetToken
    {
        [Key]
        public int Id { get; set; }
        
        [Required]
        public string Email { get; set; } = string.Empty;
        
        [Required]
        public string Token { get; set; } = string.Empty;
        
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        
        public DateTime ExpiresAt { get; set; }
        
        public bool IsUsed { get; set; } = false;
        
        public DateTime? UsedAt { get; set; }
        
        // Navigation property
        public AppUser? User { get; set; }
        public int? UserId { get; set; }
    }
}




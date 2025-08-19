using System;
using InvoiceManagement.Server.Domain.Enums;

namespace InvoiceManagement.Server.Domain.Entities
{
    public class AppUser
    {
        // Primary key
        public int User_Seq { get; set; }
        
        // Employee link
        public string EMPLOYEE_NUMBER { get; set; } = string.Empty;
        
        // User information
        public string User_Name { get; set; } = string.Empty;
        public int userType_code { get; set; } // Maps to user roles
        public string EMAIL { get; set; } = string.Empty;
        
        // Authentication
        public string PasswordHash { get; set; } = string.Empty;
        
        // Record information
        public DateTime Rec_Date { get; set; }
        public string Rec_User { get; set; } = string.Empty;
        public bool Is_Active { get; set; }
        
        // Audit timestamps (from BaseEntity)
        public DateTime CreatedAt { get; set; }
        public DateTime? ModifiedAt { get; set; }
        
        // Navigation properties
        public ERPEmployee Employee { get; set; } = null!;
        
        // Extra application properties
        public string? RefreshToken { get; set; }
        public DateTime? RefreshTokenExpiryTime { get; set; }
        public DateTime? LastLoginDate { get; set; }
        
        // For clarity in the application
        public UserRole Role => (UserRole)userType_code;
    }
} 
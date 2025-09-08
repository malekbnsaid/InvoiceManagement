using InvoiceManagement.Server.Application.Interfaces;
using Microsoft.Extensions.Configuration;
using Azure.Communication.Email;
using Azure;
using System.Text;

namespace InvoiceManagement.Server.Infrastructure.Services
{
    public class AzureCommunicationEmailService : IEmailService
    {
        private readonly EmailClient _emailClient;
        private readonly string _fromEmail;
        private readonly string _fromName;
        private readonly string _baseUrl;

        public AzureCommunicationEmailService(IConfiguration configuration)
        {
            var connectionString = configuration["AzureCommunication:ConnectionString"];
            var fromEmail = configuration["AzureCommunication:FromEmail"];
            var fromName = configuration["AzureCommunication:FromName"];
            var baseUrl = configuration["AppSettings:BaseUrl"] ?? "http://localhost:3000";

            if (string.IsNullOrEmpty(connectionString))
            {
                throw new InvalidOperationException("Azure Communication Services connection string is not configured");
            }

            if (string.IsNullOrEmpty(fromEmail))
            {
                throw new InvalidOperationException("Azure Communication Services from email is not configured");
            }

            _emailClient = new EmailClient(connectionString);
            _fromEmail = fromEmail;
            _fromName = fromName ?? "Invoice Management System";
            _baseUrl = baseUrl;
        }

        public async Task<bool> SendEmailAsync(string to, string subject, string body, bool isHtml = false)
        {
            try
            {
                // Send the email message with WaitUntil.Started
                EmailSendOperation emailSendOperation = await _emailClient.SendAsync(
                    WaitUntil.Started,
                    _fromEmail,
                    to,
                    subject,
                    isHtml ? body : null,
                    isHtml ? null : body);

                // Poll for the status manually
                try
                {
                    while (true)
                    {
                        await emailSendOperation.UpdateStatusAsync();
                        if (emailSendOperation.HasCompleted)
                        {
                            break;
                        }
                        await Task.Delay(100);
                    }

                    if (emailSendOperation.HasValue)
                    {
                        Console.WriteLine($"Email queued for delivery. Status = {emailSendOperation.Value.Status}");
                        return emailSendOperation.Value.Status == EmailSendStatus.Succeeded;
                    }
                }
                catch (RequestFailedException ex)
                {
                    Console.WriteLine($"Email send failed with Code = {ex.ErrorCode} and Message = {ex.Message}");
                    return false;
                }

                // Get the OperationId for tracking
                string operationId = emailSendOperation.Id;
                Console.WriteLine($"Email operation id = {operationId}");

                return false;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Failed to send email: {ex.Message}");
                return false;
            }
        }

        public async Task<bool> SendPasswordResetEmailAsync(string to, string username, string resetToken, string resetUrl)
        {
            try
            {
                var subject = "Password Reset Request - Invoice Management System";
                var htmlBody = GeneratePasswordResetEmailHtml(resetUrl, username);
                var plainTextBody = GeneratePasswordResetEmailText(resetUrl, username);

                // Send the email message with WaitUntil.Started
                EmailSendOperation emailSendOperation = await _emailClient.SendAsync(
                    WaitUntil.Started,
                    _fromEmail,
                    to,
                    subject,
                    htmlBody,
                    plainTextBody);

                // Poll for the status manually
                try
                {
                    while (true)
                    {
                        await emailSendOperation.UpdateStatusAsync();
                        if (emailSendOperation.HasCompleted)
                        {
                            break;
                        }
                        await Task.Delay(100);
                    }

                    if (emailSendOperation.HasValue)
                    {
                        Console.WriteLine($"Password reset email queued for delivery. Status = {emailSendOperation.Value.Status}");
                        return emailSendOperation.Value.Status == EmailSendStatus.Succeeded;
                    }
                }
                catch (RequestFailedException ex)
                {
                    Console.WriteLine($"Password reset email send failed with Code = {ex.ErrorCode} and Message = {ex.Message}");
                    return false;
                }

                // Get the OperationId for tracking
                string operationId = emailSendOperation.Id;
                Console.WriteLine($"Password reset email operation id = {operationId}");

                return false;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Failed to send password reset email: {ex.Message}");
                return false;
            }
        }

        public async Task<bool> SendWelcomeEmailAsync(string to, string username)
        {
            try
            {
                var subject = "Welcome to Invoice Management System";
                var htmlBody = GenerateWelcomeEmailHtml(username);
                var plainTextBody = GenerateWelcomeEmailText(username);

                // Send the email message with WaitUntil.Started
                EmailSendOperation emailSendOperation = await _emailClient.SendAsync(
                    WaitUntil.Started,
                    _fromEmail,
                    to,
                    subject,
                    htmlBody,
                    plainTextBody);

                // Poll for the status manually
                try
                {
                    while (true)
                    {
                        await emailSendOperation.UpdateStatusAsync();
                        if (emailSendOperation.HasCompleted)
                        {
                            break;
                        }
                        await Task.Delay(100);
                    }

                    if (emailSendOperation.HasValue)
                    {
                        Console.WriteLine($"Welcome email queued for delivery. Status = {emailSendOperation.Value.Status}");
                        return emailSendOperation.Value.Status == EmailSendStatus.Succeeded;
                    }
                }
                catch (RequestFailedException ex)
                {
                    Console.WriteLine($"Welcome email send failed with Code = {ex.ErrorCode} and Message = {ex.Message}");
                    return false;
                }

                // Get the OperationId for tracking
                string operationId = emailSendOperation.Id;
                Console.WriteLine($"Welcome email operation id = {operationId}");

                return false;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Failed to send welcome email: {ex.Message}");
                return false;
            }
        }

        private string GeneratePasswordResetEmailHtml(string resetUrl, string username)
        {
            return $@"
<!DOCTYPE html>
<html>
<head>
    <meta charset='utf-8'>
    <title>Password Reset</title>
    <style>
        body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
        .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
        .header {{ background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }}
        .content {{ background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }}
        .button {{ display: inline-block; background: #667eea; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }}
        .footer {{ text-align: center; margin-top: 30px; color: #666; font-size: 14px; }}
    </style>
</head>
<body>
    <div class='container'>
        <div class='header'>
            <h1>🏆 Olympic Invoice Management</h1>
            <h2>Password Reset Request</h2>
        </div>
        <div class='content'>
            <p>Hello {username},</p>
            <p>We received a request to reset your password for the Olympic Invoice Management System.</p>
            <p>Click the button below to reset your password:</p>
            <p style='text-align: center;'>
                <a href='{resetUrl}' class='button'>Reset Password</a>
            </p>
            <p><strong>This link will expire in 1 hour for security reasons.</strong></p>
            <p>If you didn't request this password reset, please ignore this email.</p>
            <p>Best regards,<br>Olympic Invoice Management Team</p>
        </div>
        <div class='footer'>
            <p>This is an automated message. Please do not reply to this email.</p>
        </div>
    </div>
</body>
</html>";
        }

        private string GeneratePasswordResetEmailText(string resetUrl, string username)
        {
            return $@"
Olympic Invoice Management System - Password Reset Request

Hello {username},

We received a request to reset your password for the Olympic Invoice Management System.

To reset your password, please visit the following link:
{resetUrl}

This link will expire in 1 hour for security reasons.

If you didn't request this password reset, please ignore this email.

Best regards,
Olympic Invoice Management Team

---
This is an automated message. Please do not reply to this email.";
        }

        private string GenerateWelcomeEmailHtml(string username)
        {
            return $@"
<!DOCTYPE html>
<html>
<head>
    <meta charset='utf-8'>
    <title>Welcome</title>
    <style>
        body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
        .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
        .header {{ background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }}
        .content {{ background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }}
        .footer {{ text-align: center; margin-top: 30px; color: #666; font-size: 14px; }}
    </style>
</head>
<body>
    <div class='container'>
        <div class='header'>
            <h1>🏆 Olympic Invoice Management</h1>
            <h2>Welcome to the Team!</h2>
        </div>
        <div class='content'>
            <p>Hello {username},</p>
            <p>Welcome to the Olympic Invoice Management System!</p>
            <p>Your account has been successfully created and you can now access all the features of our invoice management platform.</p>
            <p>You can now:</p>
            <ul>
                <li>📊 View and manage invoices</li>
                <li>📋 Create and track projects</li>
                <li>👥 Manage vendors and departments</li>
                <li>📈 Access detailed reports and analytics</li>
            </ul>
            <p>If you have any questions or need assistance, please don't hesitate to contact our support team.</p>
            <p>Best regards,<br>Olympic Invoice Management Team</p>
        </div>
        <div class='footer'>
            <p>This is an automated message. Please do not reply to this email.</p>
        </div>
    </div>
</body>
</html>";
        }

        private string GenerateWelcomeEmailText(string username)
        {
            return $@"
Olympic Invoice Management System - Welcome!

Hello {username},

Welcome to the Olympic Invoice Management System!

Your account has been successfully created and you can now access all the features of our invoice management platform.

You can now:
- View and manage invoices
- Create and track projects  
- Manage vendors and departments
- Access detailed reports and analytics

If you have any questions or need assistance, please don't hesitate to contact our support team.

Best regards,
Olympic Invoice Management Team

---
This is an automated message. Please do not reply to this email.";
        }
    }
}

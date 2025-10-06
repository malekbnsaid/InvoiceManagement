// Temporarily disabled Microsoft365EmailService to fix build issues
/*
using InvoiceManagement.Server.Application.Interfaces;
using Microsoft.Extensions.Configuration;
using Microsoft.Graph;
using Azure.Identity;

namespace InvoiceManagement.Server.Infrastructure.Services
{
    public class Microsoft365EmailService : IEmailService
    {
        private readonly GraphServiceClient _graphClient;
        private readonly string _fromEmail;
        private readonly string _fromName;
        private readonly string _baseUrl;

        public Microsoft365EmailService(IConfiguration configuration)
        {
            var tenantId = configuration["Microsoft365:TenantId"];
            var clientId = configuration["Microsoft365:ClientId"];
            var clientSecret = configuration["Microsoft365:ClientSecret"];

            if (string.IsNullOrEmpty(tenantId) || string.IsNullOrEmpty(clientId) || string.IsNullOrEmpty(clientSecret))
            {
                throw new InvalidOperationException("Microsoft 365 configuration is incomplete");
            }

            // Use ClientSecretCredential for app-only authentication
            var credential = new ClientSecretCredential(tenantId, clientId, clientSecret);
            _graphClient = new GraphServiceClient(credential);

            _fromEmail = configuration["Microsoft365:FromEmail"] ?? "noreply@olympic.qa";
            _fromName = configuration["Microsoft365:FromName"] ?? "Olympic Invoice Management System";
            _baseUrl = configuration["AppSettings:BaseUrl"] ?? "http://localhost:3000";
        }

        public async Task<bool> SendEmailAsync(string to, string subject, string body, bool isHtml = false)
        {
            try
            {
                var message = new Microsoft.Graph.Models.Message
                {
                    Subject = subject,
                    Body = new Microsoft.Graph.Models.ItemBody
                    {
                        ContentType = isHtml ? Microsoft.Graph.Models.BodyType.Html : Microsoft.Graph.Models.BodyType.Text,
                        Content = body
                    },
                    ToRecipients = new List<Microsoft.Graph.Models.Recipient>
                    {
                        new Microsoft.Graph.Models.Recipient
                        {
                            EmailAddress = new Microsoft.Graph.Models.EmailAddress
                            {
                                Address = to
                            }
                        }
                    }
                };

                // Send email using Microsoft Graph API
                await _graphClient.Users[_fromEmail]
                    .Messages
                    .PostAsync(message);

                return true;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Microsoft 365 email error: {ex.Message}");
                return false;
            }
        }

        public async Task<bool> SendPasswordResetEmailAsync(string to, string username, string resetToken, string resetUrl)
        {
            var subject = "Password Reset Request - Olympic Invoice Management System";
            var resetLink = $"{resetUrl}?token={resetToken}";
            
            var htmlBody = $@"
                <html>
                <body style='font-family: Arial, sans-serif; line-height: 1.6; color: #333;'>
                    <div style='max-width: 600px; margin: 0 auto; padding: 20px;'>
                        <div style='text-align: center; margin-bottom: 30px;'>
                            <h1 style='color: #1e3a8a; margin: 0;'>Olympic</h1>
                            <p style='color: #6b7280; margin: 5px 0;'>Invoice Management System</p>
                        </div>
                        
                        <h2 style='color: #1e3a8a;'>Password Reset Request</h2>
                        <p>Hello {username},</p>
                        <p>We received a request to reset your password for the Olympic Invoice Management System.</p>
                        <p>Click the button below to reset your password:</p>
                        <div style='text-align: center; margin: 30px 0;'>
                            <a href='{resetLink}' 
                               style='background-color: #1e3a8a; color: white; padding: 12px 24px; 
                                      text-decoration: none; border-radius: 5px; display: inline-block;'>
                                Reset Password
                            </a>
                        </div>
                        <p>Or copy and paste this link into your browser:</p>
                        <p style='word-break: break-all; color: #6b7280; background: #f3f4f6; padding: 10px; border-radius: 5px;'>{resetLink}</p>
                        <p><strong>This link will expire in 24 hours.</strong></p>
                        <p>If you didn't request this password reset, please ignore this email.</p>
                        <hr style='border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;'>
                        <p style='font-size: 12px; color: #6b7280; text-align: center;'>
                            This is an automated message from the Olympic Invoice Management System.<br>
                            © {DateTime.Now.Year} Olympic. All rights reserved.
                        </p>
                    </div>
                </body>
                </html>";

            return await SendEmailAsync(to, subject, htmlBody, true);
        }

        public async Task<bool> SendWelcomeEmailAsync(string to, string username)
        {
            var subject = "Welcome to Olympic Invoice Management System";
            var htmlBody = $@"
                <html>
                <body style='font-family: Arial, sans-serif; line-height: 1.6; color: #333;'>
                    <div style='max-width: 600px; margin: 0 auto; padding: 20px;'>
                        <div style='text-align: center; margin-bottom: 30px;'>
                            <h1 style='color: #1e3a8a; margin: 0;'>Olympic</h1>
                            <p style='color: #6b7280; margin: 5px 0;'>Invoice Management System</p>
                        </div>
                        
                        <h2 style='color: #1e3a8a;'>Welcome to Olympic!</h2>
                        <p>Hello {username},</p>
                        <p>Your account has been successfully created in the Olympic Invoice Management System.</p>
                        <p>You can now log in to the system and start managing your invoices and projects.</p>
                        <p>If you have any questions, please contact your system administrator.</p>
                        <hr style='border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;'>
                        <p style='font-size: 12px; color: #6b7280; text-align: center;'>
                            This is an automated message from the Olympic Invoice Management System.<br>
                            © {DateTime.Now.Year} Olympic. All rights reserved.
                        </p>
                    </div>
                </body>
                </html>";

            return await SendEmailAsync(to, subject, htmlBody, true);
        }
    }
}
*/

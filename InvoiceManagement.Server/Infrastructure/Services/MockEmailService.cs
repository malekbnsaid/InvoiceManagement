using InvoiceManagement.Server.Application.Interfaces;

namespace InvoiceManagement.Server.Infrastructure.Services
{
    public class MockEmailService : IEmailService
    {
        private readonly ILogger<MockEmailService> _logger;

        public MockEmailService(ILogger<MockEmailService> logger)
        {
            _logger = logger;
        }

        public async Task<bool> SendEmailAsync(string to, string subject, string body, bool isHtml = false)
        {
            _logger.LogInformation("Mock Email Service - Email would be sent to: {To}, Subject: {Subject}", to, subject);
            _logger.LogDebug("Mock Email Service - Body: {Body}", body);
            
            // Simulate async operation
            await Task.Delay(100);
            
            return true;
        }

        public async Task<bool> SendPasswordResetEmailAsync(string to, string username, string resetToken, string resetUrl)
        {
            _logger.LogInformation("Mock Email Service - Password reset email would be sent to: {To} for user: {Username}", to, username);
            _logger.LogDebug("Mock Email Service - Reset URL: {ResetUrl}", resetUrl);
            
            // Simulate async operation
            await Task.Delay(100);
            
            return true;
        }

        public async Task<bool> SendWelcomeEmailAsync(string to, string username)
        {
            _logger.LogInformation("Mock Email Service - Welcome email would be sent to: {To} for user: {Username}", to, username);
            
            // Simulate async operation
            await Task.Delay(100);
            
            return true;
        }
    }
}



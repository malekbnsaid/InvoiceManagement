namespace InvoiceManagement.Server.Application.Interfaces
{
    public interface IEmailService
    {
        Task<bool> SendEmailAsync(string to, string subject, string body, bool isHtml = false);
        Task<bool> SendPasswordResetEmailAsync(string to, string username, string resetToken, string resetUrl);
        Task<bool> SendWelcomeEmailAsync(string to, string username);
    }
}





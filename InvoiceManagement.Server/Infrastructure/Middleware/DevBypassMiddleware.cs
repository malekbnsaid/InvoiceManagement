using System.Security.Claims;
using Microsoft.Extensions.Configuration;

namespace InvoiceManagement.Server.Infrastructure.Middleware
{
    public class DevBypassMiddleware
    {
        private readonly RequestDelegate _next;
        private readonly IConfiguration _configuration;

        public DevBypassMiddleware(RequestDelegate next, IConfiguration configuration)
        {
            _next = next;
            _configuration = configuration;
        }

        public async Task InvokeAsync(HttpContext context)
        {
            var devBypass = _configuration.GetValue<bool>("Auth:DevBypass");
            
            if (devBypass && context.User?.Identity?.IsAuthenticated != true)
            {
                var defaultUser = _configuration["Auth:DefaultUser"] ?? "admin";
                var defaultRole = _configuration["Auth:DefaultRole"] ?? "Admin";
                var defaultUserId = _configuration["Auth:DefaultUserId"] ?? "1";
                var defaultEmail = _configuration["Auth:DefaultEmail"] ?? "admin@company.com";
                var defaultEmployeeNumber = _configuration["Auth:DefaultEmployeeNumber"] ?? "EMP001";

                var claims = new List<Claim>
                {
                    new Claim(ClaimTypes.NameIdentifier, defaultUserId),
                    new Claim(ClaimTypes.Name, defaultUser),
                    new Claim(ClaimTypes.Email, defaultEmail),
                    new Claim(ClaimTypes.Role, defaultRole),
                    new Claim("EmployeeNumber", defaultEmployeeNumber),
                    new Claim("UserId", defaultUserId)
                };

                var identity = new ClaimsIdentity(claims, "DevBypass");
                context.User = new ClaimsPrincipal(identity);
            }

            await _next(context);
        }
    }

    public static class DevBypassMiddlewareExtensions
    {
        public static IApplicationBuilder UseDevBypass(this IApplicationBuilder builder)
        {
            return builder.UseMiddleware<DevBypassMiddleware>();
        }
    }
}

using System.Security.Claims;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Text;

namespace InvoiceManagement.Server.Infrastructure.Middleware
{
    public class CookieAuthMiddleware
    {
        private readonly RequestDelegate _next;
        private readonly IConfiguration _configuration;

        public CookieAuthMiddleware(RequestDelegate next, IConfiguration configuration)
        {
            _next = next;
            _configuration = configuration;
        }

        public async Task InvokeAsync(HttpContext context)
        {
            // Skip auth middleware for auth endpoints
            var path = context.Request.Path.Value?.ToLower();
            if (path != null && (path.Contains("/auth/") || path.Contains("/cookieauth/")))
            {
                await _next(context);
                return;
            }

            // Try to get access token from cookie
            var accessToken = context.Request.Cookies["access_token"];
            var sessionId = context.Request.Cookies["session_id"];

            if (!string.IsNullOrEmpty(accessToken) && !string.IsNullOrEmpty(sessionId))
            {
                try
                {
                    // Validate and set the JWT token for the request
                    var tokenHandler = new JwtSecurityTokenHandler();
                    var key = Encoding.UTF8.GetBytes(_configuration["Jwt:Key"] ?? throw new InvalidOperationException("JWT Key not found"));

                    var tokenValidationParameters = new TokenValidationParameters
                    {
                        ValidateIssuerSigningKey = true,
                        IssuerSigningKey = new SymmetricSecurityKey(key),
                        ValidateIssuer = true,
                        ValidIssuer = _configuration["Jwt:Issuer"],
                        ValidateAudience = true,
                        ValidAudience = _configuration["Jwt:Audience"],
                        ValidateLifetime = true,
                        ClockSkew = TimeSpan.Zero
                    };

                    var principal = tokenHandler.ValidateToken(accessToken, tokenValidationParameters, out SecurityToken validatedToken);

                    if (validatedToken is JwtSecurityToken jwtToken)
                    {
                        // Add session ID claim for session isolation
                        var claims = principal.Claims.ToList();
                        claims.Add(new Claim("SessionId", sessionId));

                        var identity = new ClaimsIdentity(claims, JwtBearerDefaults.AuthenticationScheme);
                        context.User = new ClaimsPrincipal(identity);

                        Console.WriteLine($"🔐 CookieAuthMiddleware: Authenticated user from cookie for session: {sessionId}");
                    }
                }
                catch (SecurityTokenExpiredException)
                {
                    Console.WriteLine($"🔐 CookieAuthMiddleware: Access token expired for session: {sessionId}");
                    // Token is expired, let the refresh mechanism handle it
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"🔐 CookieAuthMiddleware: Token validation failed: {ex.Message}");
                    // Clear invalid cookies
                    ClearAuthenticationCookies(context);
                }
            }

            await _next(context);
        }

        private static void ClearAuthenticationCookies(HttpContext context)
        {
            var cookieOptions = new CookieOptions
            {
                HttpOnly = true,
                Secure = !context.RequestServices.GetRequiredService<IWebHostEnvironment>().IsDevelopment(),
                SameSite = SameSiteMode.Lax,
                Expires = DateTime.UtcNow.AddDays(-1),
                Path = "/"
            };

            var sessionIdOptions = new CookieOptions
            {
                HttpOnly = false,
                Secure = !context.RequestServices.GetRequiredService<IWebHostEnvironment>().IsDevelopment(),
                SameSite = SameSiteMode.Lax,
                Expires = DateTime.UtcNow.AddDays(-1),
                Path = "/"
            };

            context.Response.Cookies.Append("access_token", "", cookieOptions);
            context.Response.Cookies.Append("refresh_token", "", cookieOptions);
            context.Response.Cookies.Append("session_id", "", sessionIdOptions);
        }
    }

    public static class CookieAuthMiddlewareExtensions
    {
        public static IApplicationBuilder UseCookieAuth(this IApplicationBuilder builder)
        {
            return builder.UseMiddleware<CookieAuthMiddleware>();
        }
    }
}

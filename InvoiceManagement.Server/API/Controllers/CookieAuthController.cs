using Microsoft.AspNetCore.Mvc;
using InvoiceManagement.Server.Application.DTOs;
using InvoiceManagement.Server.Application.Interfaces;

namespace InvoiceManagement.Server.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class CookieAuthController : ControllerBase
    {
        private readonly ICookieAuthService _cookieAuthService;

        public CookieAuthController(ICookieAuthService cookieAuthService)
        {
            _cookieAuthService = cookieAuthService;
        }

        [HttpPost("login")]
        public async Task<ActionResult> Login([FromBody] LoginRequestDto request)
        {
            try
            {
                // Get session ID from header (for session isolation) or generate new one
                var sessionId = Request.Headers["X-Session-Id"].FirstOrDefault();
                
                var response = await _cookieAuthService.LoginAsync(request, sessionId);
                if (response == null)
                {
                    return Unauthorized(new { message = "Invalid username or password" });
                }

                // Set cookies for secure authentication
                SetAuthenticationCookies(response);

                Console.WriteLine($"🔐 CookieAuthController: Login successful for session: {response.SessionId}");

                // Return minimal data (no tokens in response body for security)
                return Ok(new
                {
                    user = response.User,
                    expiresAt = response.ExpiresAt,
                    sessionId = response.SessionId,
                    message = "Login successful"
                });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"🔐 CookieAuthController: Login error: {ex.Message}");
                return StatusCode(500, new { message = "An error occurred during login", error = ex.Message });
            }
        }

        [HttpPost("refresh")]
        public async Task<ActionResult> RefreshToken()
        {
            try
            {
                // Get session ID and refresh token from cookies
                var sessionId = Request.Cookies["session_id"];
                var refreshToken = Request.Cookies["refresh_token"];
                
                if (string.IsNullOrEmpty(refreshToken))
                {
                    return Unauthorized(new { message = "Refresh token not found" });
                }

                var response = await _cookieAuthService.RefreshTokenAsync(refreshToken, sessionId);
                if (response == null)
                {
                    ClearAuthenticationCookies();
                    return Unauthorized(new { message = "Invalid or expired refresh token" });
                }

                // Update cookies with new tokens
                SetAuthenticationCookies(response);

                Console.WriteLine($"🔐 CookieAuthController: Token refreshed for session: {response.SessionId}");

                // Return minimal data
                return Ok(new
                {
                    user = response.User,
                    expiresAt = response.ExpiresAt,
                    sessionId = response.SessionId,
                    message = "Token refreshed successfully"
                });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"🔐 CookieAuthController: Refresh error: {ex.Message}");
                return StatusCode(500, new { message = "An error occurred during token refresh", error = ex.Message });
            }
        }

        [HttpPost("logout")]
        public async Task<ActionResult> Logout()
        {
            try
            {
                // Get session data from cookies
                var sessionId = Request.Cookies["session_id"];
                var refreshToken = Request.Cookies["refresh_token"];

                if (!string.IsNullOrEmpty(refreshToken))
                {
                    await _cookieAuthService.LogoutAsync(refreshToken, sessionId);
                }

                // Clear all authentication cookies
                ClearAuthenticationCookies();

                Console.WriteLine($"🔐 CookieAuthController: Logout successful for session: {sessionId}");

                return Ok(new { message = "Logged out successfully" });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"🔐 CookieAuthController: Logout error: {ex.Message}");
                // Still clear cookies even if there's an error
                ClearAuthenticationCookies();
                return Ok(new { message = "Logged out successfully" });
            }
        }

        [HttpGet("validate")]
        public async Task<ActionResult> ValidateSession()
        {
            try
            {
                var sessionId = Request.Cookies["session_id"];
                var accessToken = Request.Cookies["access_token"];

                if (string.IsNullOrEmpty(sessionId) || string.IsNullOrEmpty(accessToken))
                {
                    return Unauthorized(new { message = "Session not found" });
                }

                var isValid = await _cookieAuthService.ValidateSessionAsync(sessionId, accessToken);
                if (!isValid)
                {
                    ClearAuthenticationCookies();
                    return Unauthorized(new { message = "Invalid or expired session" });
                }

                var user = await _cookieAuthService.GetUserFromSessionAsync(sessionId);
                if (user == null)
                {
                    ClearAuthenticationCookies();
                    return Unauthorized(new { message = "User not found" });
                }

                // Map user to DTO
                var userDto = new UserInfoDto
                {
                    UserId = user.User_Seq,
                    Username = user.User_Name,
                    Email = user.EMAIL,
                    Role = user.Role.ToString(),
                    EmployeeNumber = user.EMPLOYEE_NUMBER,
                    IsActive = user.Is_Active
                };

                return Ok(new
                {
                    user = userDto,
                    sessionId = sessionId,
                    message = "Session is valid"
                });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"🔐 CookieAuthController: Validation error: {ex.Message}");
                return StatusCode(500, new { message = "An error occurred during session validation", error = ex.Message });
            }
        }

        [HttpGet("session-info")]
        public ActionResult GetSessionInfo()
        {
            var sessionId = Request.Cookies["session_id"];
            var hasAccessToken = !string.IsNullOrEmpty(Request.Cookies["access_token"]);
            var hasRefreshToken = !string.IsNullOrEmpty(Request.Cookies["refresh_token"]);

            return Ok(new
            {
                sessionId = sessionId,
                hasAccessToken = hasAccessToken,
                hasRefreshToken = hasRefreshToken,
                cookies = Request.Cookies.Keys.ToArray()
            });
        }

        private void SetAuthenticationCookies(CookieLoginResponseDto response)
        {
            var isDevelopment = HttpContext.RequestServices.GetRequiredService<IWebHostEnvironment>().IsDevelopment();

            // Access token cookie (short-lived)
            var accessTokenOptions = new CookieOptions
            {
                HttpOnly = true,
                Secure = !isDevelopment, // Only HTTPS in production
                SameSite = SameSiteMode.Lax,
                Expires = response.ExpiresAt,
                Path = "/",
                Domain = isDevelopment ? null : GetDomain() // Set domain in production
            };

            // Refresh token cookie (long-lived)
            var refreshTokenOptions = new CookieOptions
            {
                HttpOnly = true,
                Secure = !isDevelopment, // Only HTTPS in production
                SameSite = SameSiteMode.Lax,
                Expires = DateTime.UtcNow.AddDays(7),
                Path = "/",
                Domain = isDevelopment ? null : GetDomain() // Set domain in production
            };

            // Session ID cookie (for session isolation)
            var sessionIdOptions = new CookieOptions
            {
                HttpOnly = false, // Allow JavaScript access for session management
                Secure = !isDevelopment,
                SameSite = SameSiteMode.Lax,
                Expires = DateTime.UtcNow.AddDays(7),
                Path = "/",
                Domain = isDevelopment ? null : GetDomain()
            };

            Response.Cookies.Append("access_token", response.AccessToken, accessTokenOptions);
            Response.Cookies.Append("refresh_token", response.RefreshToken, refreshTokenOptions);
            Response.Cookies.Append("session_id", response.SessionId, sessionIdOptions);

            Console.WriteLine($"🔐 CookieAuthController: Set authentication cookies for session: {response.SessionId}");
        }

        private void ClearAuthenticationCookies()
        {
            var cookieOptions = new CookieOptions
            {
                HttpOnly = true,
                Secure = !HttpContext.RequestServices.GetRequiredService<IWebHostEnvironment>().IsDevelopment(),
                SameSite = SameSiteMode.Lax,
                Expires = DateTime.UtcNow.AddDays(-1), // Expire immediately
                Path = "/"
            };

            var sessionIdOptions = new CookieOptions
            {
                HttpOnly = false,
                Secure = !HttpContext.RequestServices.GetRequiredService<IWebHostEnvironment>().IsDevelopment(),
                SameSite = SameSiteMode.Lax,
                Expires = DateTime.UtcNow.AddDays(-1),
                Path = "/"
            };

            Response.Cookies.Append("access_token", "", cookieOptions);
            Response.Cookies.Append("refresh_token", "", cookieOptions);
            Response.Cookies.Append("session_id", "", sessionIdOptions);

            Console.WriteLine("🔐 CookieAuthController: Cleared authentication cookies");
        }

        private string? GetDomain()
        {
            // In production, you might want to set this to your domain
            // For example: ".yourdomain.com" to allow subdomains
            return null;
        }
    }
}

using Microsoft.AspNetCore.Mvc;
using InvoiceManagement.Server.Application.DTOs;
using InvoiceManagement.Server.Application.Interfaces;

namespace InvoiceManagement.Server.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly IAuthService _authService;
        private readonly IRateLimitingService _rateLimitingService;

        public AuthController(IAuthService authService, IRateLimitingService rateLimitingService)
        {
            _authService = authService;
            _rateLimitingService = rateLimitingService;
        }

        [HttpPost("login")]
        public async Task<ActionResult<LoginResponseDto>> Login([FromBody] LoginRequestDto request)
        {
            try
            {
                // Get client IP address for rate limiting
                var clientIp = GetClientIpAddress();
                
                // Check if IP is locked out
                if (_rateLimitingService.IsLockedOut(clientIp))
                {
                    var lockoutExpiry = _rateLimitingService.GetLockoutExpiry(clientIp);
                    return StatusCode(429, new { 
                        message = "Too many login attempts. Please try again later.",
                        lockoutExpiry = lockoutExpiry
                    });
                }

                var response = await _authService.LoginAsync(request);
                if (response == null)
                {
                    // Record failed attempt
                    _rateLimitingService.RecordFailedAttempt(clientIp);
                    var remainingAttempts = _rateLimitingService.GetRemainingAttempts(clientIp);
                    
                    return Unauthorized(new { 
                        message = "Invalid username or password",
                        remainingAttempts = remainingAttempts
                    });
                }

                // Record successful attempt (clears failed attempts)
                _rateLimitingService.RecordSuccessfulAttempt(clientIp);

                // Set refresh token in secure httpOnly cookie (access token will be returned in response body)
                var cookieOptions = new CookieOptions
                {
                    HttpOnly = true,
                    Secure = Request.IsHttps, // Only send over HTTPS in production
                    SameSite = SameSiteMode.Lax, // More permissive for development
                    Expires = DateTime.UtcNow.AddDays(7), // Refresh token expires in 7 days
                    Path = "/"
                };

                // Only set refresh token in cookie, not access token
                Response.Cookies.Append("refresh_token", response.RefreshToken, cookieOptions);

                // Return access token in response body for frontend to store
                return Ok(new
                {
                    user = response.User,
                    expiresAt = response.ExpiresAt,
                    token = response.Token, // Access token for frontend
                    refreshToken = response.RefreshToken // Also return for frontend storage
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "An error occurred during login", error = ex.Message });
            }
        }

        [HttpPost("signup")]
        public async Task<ActionResult<SignupResponseDto>> Signup([FromBody] SignupRequestDto request)
        {
            try
            {
                var response = await _authService.SignupAsync(request);
                if (!response.Success)
                {
                    return BadRequest(new { message = response.Message });
                }

                return Ok(response);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "An error occurred during signup", error = ex.Message });
            }
        }

        [HttpPost("refresh")]
        public async Task<ActionResult<LoginResponseDto>> RefreshToken()
        {
            try
            {
                // Get refresh token from cookie
                var refreshToken = Request.Cookies["refresh_token"];
                if (string.IsNullOrEmpty(refreshToken))
                {
                    return Unauthorized(new { message = "Refresh token not found" });
                }

                var response = await _authService.RefreshTokenAsync(refreshToken);
                if (response == null)
                {
                    return Unauthorized(new { message = "Invalid or expired refresh token" });
                }

                // Set new refresh token in secure cookie
                var cookieOptions = new CookieOptions
                {
                    HttpOnly = true,
                    Secure = Request.IsHttps, // Only send over HTTPS in production
                    SameSite = SameSiteMode.Lax, // More permissive for development
                    Expires = DateTime.UtcNow.AddDays(7),
                    Path = "/"
                };

                Response.Cookies.Append("refresh_token", response.RefreshToken, cookieOptions);

                // Return new access token in response body for frontend
                return Ok(new
                {
                    user = response.User,
                    expiresAt = response.ExpiresAt,
                    token = response.Token, // New access token for frontend
                    refreshToken = response.RefreshToken // New refresh token for frontend
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "An error occurred during token refresh", error = ex.Message });
            }
        }

        [HttpPost("logout")]
        public ActionResult Logout()
        {
            // Clear refresh token cookie (access token is stored in frontend)
            Response.Cookies.Delete("refresh_token", new CookieOptions { Path = "/" });
            
            return Ok(new { message = "Logged out successfully" });
        }

        [HttpPost("reset-password")]
        public async Task<ActionResult> ResetPassword([FromBody] PasswordResetRequest request)
        {
            try
            {
                if (string.IsNullOrEmpty(request.Username) || string.IsNullOrEmpty(request.NewPassword))
                {
                    return BadRequest(new { message = "Username and new password are required" });
                }

                var success = await _authService.ResetUserPasswordAsync(request.Username, request.NewPassword);
                if (success)
                {
                    return Ok(new { message = "Password reset successfully" });
                }
                else
                {
                    return NotFound(new { message = "User not found" });
                }
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "An error occurred during password reset", error = ex.Message });
            }
        }

        [HttpPost("forgot-password")]
        public async Task<ActionResult<ForgotPasswordResponse>> ForgotPassword([FromBody] ForgotPasswordRequest request)
        {
            try
            {
                if (string.IsNullOrEmpty(request.Email))
                {
                    return BadRequest(new { message = "Email is required" });
                }

                var response = await _authService.ForgotPasswordAsync(request.Email);
                return Ok(response);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "An error occurred during forgot password", error = ex.Message });
            }
        }

        [HttpPost("reset-password-with-token")]
        public async Task<ActionResult<ResetPasswordResponse>> ResetPasswordWithToken([FromBody] ResetPasswordRequest request)
        {
            try
            {
                if (string.IsNullOrEmpty(request.Token) || string.IsNullOrEmpty(request.NewPassword))
                {
                    return BadRequest(new { message = "Token and new password are required" });
                }

                if (request.NewPassword != request.ConfirmPassword)
                {
                    return BadRequest(new { message = "Passwords do not match" });
                }

                var response = await _authService.ResetPasswordAsync(request.Token, request.NewPassword);
                return Ok(response);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "An error occurred during password reset", error = ex.Message });
            }
        }

        [HttpGet("validate-reset-token/{token}")]
        public async Task<ActionResult> ValidateResetToken(string token)
        {
            try
            {
                var isValid = await _authService.ValidateResetTokenAsync(token);
                return Ok(new { isValid });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "An error occurred while validating token", error = ex.Message });
            }
        }

        /// <summary>
        /// Gets the client IP address for rate limiting
        /// </summary>
        private string GetClientIpAddress()
        {
            // Check for forwarded IP (when behind proxy/load balancer)
            var forwardedFor = Request.Headers["X-Forwarded-For"].FirstOrDefault();
            if (!string.IsNullOrEmpty(forwardedFor))
            {
                return forwardedFor.Split(',')[0].Trim();
            }

            // Check for real IP header
            var realIp = Request.Headers["X-Real-IP"].FirstOrDefault();
            if (!string.IsNullOrEmpty(realIp))
            {
                return realIp;
            }

            // Fallback to connection remote IP
            return HttpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown";
        }
    }
}

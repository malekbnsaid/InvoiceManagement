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

        public AuthController(IAuthService authService)
        {
            _authService = authService;
        }

        [HttpPost("login")]
        public async Task<ActionResult<LoginResponseDto>> Login([FromBody] LoginRequestDto request)
        {
            try
            {
                var response = await _authService.LoginAsync(request);
                if (response == null)
                {
                    return Unauthorized(new { message = "Invalid username or password" });
                }

                return Ok(response);
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
        public async Task<ActionResult<LoginResponseDto>> RefreshToken([FromBody] RefreshTokenRequestDto request)
        {
            try
            {
                var response = await _authService.RefreshTokenAsync(request.RefreshToken);
                if (response == null)
                {
                    return Unauthorized(new { message = "Invalid or expired refresh token" });
                }

                return Ok(response);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "An error occurred during token refresh", error = ex.Message });
            }
        }

        [HttpPost("logout")]
        public ActionResult Logout()
        {
            // In a real implementation, you might want to invalidate the refresh token
            // For now, just return success
            return Ok(new { message = "Logged out successfully" });
        }
    }
}

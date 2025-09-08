using System.Collections.Concurrent;
using InvoiceManagement.Server.Application.Interfaces;

namespace InvoiceManagement.Server.Infrastructure.Services
{
    /// <summary>
    /// Service for rate limiting login attempts to prevent brute force attacks
    /// </summary>
    public class RateLimitingService : IRateLimitingService
    {
        private readonly ConcurrentDictionary<string, LoginAttemptInfo> _loginAttempts;
        private readonly int _maxAttempts;
        private readonly TimeSpan _lockoutDuration;

        public RateLimitingService(IConfiguration configuration)
        {
            _loginAttempts = new ConcurrentDictionary<string, LoginAttemptInfo>();
            _maxAttempts = configuration.GetValue<int>("RateLimiting:MaxLoginAttempts", 5);
            _lockoutDuration = TimeSpan.FromMinutes(configuration.GetValue<int>("RateLimiting:LockoutMinutes", 15));
        }

        /// <summary>
        /// Checks if the IP address is currently locked out
        /// </summary>
        public bool IsLockedOut(string ipAddress)
        {
            if (!_loginAttempts.TryGetValue(ipAddress, out var attemptInfo))
                return false;

            // Check if lockout period has expired
            if (DateTime.UtcNow > attemptInfo.LockoutUntil)
            {
                _loginAttempts.TryRemove(ipAddress, out _);
                return false;
            }

            return true;
        }

        /// <summary>
        /// Records a failed login attempt
        /// </summary>
        public void RecordFailedAttempt(string ipAddress)
        {
            var now = DateTime.UtcNow;
            
            _loginAttempts.AddOrUpdate(ipAddress, 
                new LoginAttemptInfo
                {
                    AttemptCount = 1,
                    FirstAttempt = now,
                    LastAttempt = now,
                    LockoutUntil = now.Add(_lockoutDuration)
                },
                (key, existing) =>
                {
                    existing.AttemptCount++;
                    existing.LastAttempt = now;
                    
                    // If we've reached max attempts, set lockout
                    if (existing.AttemptCount >= _maxAttempts)
                    {
                        existing.LockoutUntil = now.Add(_lockoutDuration);
                    }
                    
                    return existing;
                });
        }

        /// <summary>
        /// Records a successful login and clears failed attempts
        /// </summary>
        public void RecordSuccessfulAttempt(string ipAddress)
        {
            _loginAttempts.TryRemove(ipAddress, out _);
        }

        /// <summary>
        /// Gets the number of remaining attempts before lockout
        /// </summary>
        public int GetRemainingAttempts(string ipAddress)
        {
            if (!_loginAttempts.TryGetValue(ipAddress, out var attemptInfo))
                return _maxAttempts;

            return Math.Max(0, _maxAttempts - attemptInfo.AttemptCount);
        }

        /// <summary>
        /// Gets the time when the lockout will expire
        /// </summary>
        public DateTime? GetLockoutExpiry(string ipAddress)
        {
            if (!_loginAttempts.TryGetValue(ipAddress, out var attemptInfo))
                return null;

            return attemptInfo.LockoutUntil;
        }

        /// <summary>
        /// Cleans up expired entries to prevent memory leaks
        /// </summary>
        public void CleanupExpiredEntries()
        {
            var now = DateTime.UtcNow;
            var expiredKeys = _loginAttempts
                .Where(kvp => now > kvp.Value.LockoutUntil)
                .Select(kvp => kvp.Key)
                .ToList();

            foreach (var key in expiredKeys)
            {
                _loginAttempts.TryRemove(key, out _);
            }
        }
    }

    /// <summary>
    /// Information about login attempts for a specific IP address
    /// </summary>
    public class LoginAttemptInfo
    {
        public int AttemptCount { get; set; }
        public DateTime FirstAttempt { get; set; }
        public DateTime LastAttempt { get; set; }
        public DateTime LockoutUntil { get; set; }
    }
}

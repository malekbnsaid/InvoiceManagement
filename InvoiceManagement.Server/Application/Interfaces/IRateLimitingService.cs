namespace InvoiceManagement.Server.Application.Interfaces
{
    /// <summary>
    /// Interface for rate limiting login attempts
    /// </summary>
    public interface IRateLimitingService
    {
        /// <summary>
        /// Checks if the IP address is currently locked out
        /// </summary>
        bool IsLockedOut(string ipAddress);

        /// <summary>
        /// Records a failed login attempt
        /// </summary>
        void RecordFailedAttempt(string ipAddress);

        /// <summary>
        /// Records a successful login and clears failed attempts
        /// </summary>
        void RecordSuccessfulAttempt(string ipAddress);

        /// <summary>
        /// Gets the number of remaining attempts before lockout
        /// </summary>
        int GetRemainingAttempts(string ipAddress);

        /// <summary>
        /// Gets the time when the lockout will expire
        /// </summary>
        DateTime? GetLockoutExpiry(string ipAddress);

        /// <summary>
        /// Cleans up expired entries to prevent memory leaks
        /// </summary>
        void CleanupExpiredEntries();
    }
}







using InvoiceManagement.Server.Application.Interfaces;
using InvoiceManagement.Server.Domain.Entities;
using InvoiceManagement.Server.Infrastructure.Data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace InvoiceManagement.Server.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuditLogsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly IAuditService _auditService;

        public AuditLogsController(ApplicationDbContext context, IAuditService auditService)
        {
            _context = context;
            _auditService = auditService;
        }

        [HttpGet("test")]
        public IActionResult Test()
        {
            return Ok(new { message = "AuditLogsController is working!", timestamp = DateTime.UtcNow });
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<AuditLogDto>>> GetAuditLogs(
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 50,
            [FromQuery] string? action = null,
            [FromQuery] string? entityName = null,
            [FromQuery] string? userId = null,
            [FromQuery] DateTime? fromDate = null,
            [FromQuery] DateTime? toDate = null)
        {
            try
            {
                var query = _context.AuditLogs.AsQueryable();

                // Apply filters
                if (!string.IsNullOrEmpty(action))
                    query = query.Where(a => a.Action.Contains(action));

                if (!string.IsNullOrEmpty(entityName))
                    query = query.Where(a => a.EntityName.Contains(entityName));

                if (!string.IsNullOrEmpty(userId))
                    query = query.Where(a => a.UserId.Contains(userId));

                if (fromDate.HasValue)
                    query = query.Where(a => a.Timestamp >= fromDate.Value);

                if (toDate.HasValue)
                    query = query.Where(a => a.Timestamp <= toDate.Value);

                // Get total count
                var totalCount = await query.CountAsync();

                // Apply pagination
                var auditLogs = await query
                    .OrderByDescending(a => a.Timestamp)
                    .Skip((page - 1) * pageSize)
                    .Take(pageSize)
                    .ToListAsync();

                var result = auditLogs.Select(a => new AuditLogDto
                {
                    Id = a.Id,
                    EntityName = a.EntityName,
                    Action = a.Action,
                    UserId = a.UserId,
                    Timestamp = a.Timestamp,
                    Changes = a.Changes,
                    EntityId = a.EntityId
                }).ToList();

                return Ok(new
                {
                    Data = result,
                    TotalCount = totalCount,
                    Page = page,
                    PageSize = pageSize,
                    TotalPages = (int)Math.Ceiling((double)totalCount / pageSize)
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error retrieving audit logs", error = ex.Message });
            }
        }

        [HttpGet("stats")]
        public async Task<ActionResult<AuditStatsDto>> GetAuditStats()
        {
            try
            {
                var totalLogs = await _context.AuditLogs.CountAsync();
                var todayLogs = await _context.AuditLogs
                    .Where(a => a.Timestamp.Date == DateTime.Today)
                    .CountAsync();
                
                var thisWeekLogs = await _context.AuditLogs
                    .Where(a => a.Timestamp >= DateTime.Today.AddDays(-7))
                    .CountAsync();

                var actionStats = await _context.AuditLogs
                    .GroupBy(a => a.Action)
                    .Select(g => new { Action = g.Key, Count = g.Count() })
                    .ToListAsync();

                var entityStats = await _context.AuditLogs
                    .GroupBy(a => a.EntityName)
                    .Select(g => new { Entity = g.Key, Count = g.Count() })
                    .ToListAsync();

                return Ok(new AuditStatsDto
                {
                    TotalLogs = totalLogs,
                    TodayLogs = todayLogs,
                    ThisWeekLogs = thisWeekLogs,
                    ActionBreakdown = actionStats.ToDictionary(x => x.Action, x => x.Count),
                    EntityBreakdown = entityStats.ToDictionary(x => x.Entity, x => x.Count)
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error retrieving audit stats", error = ex.Message });
            }
        }

        [HttpGet("recent")]
        public async Task<ActionResult<IEnumerable<AuditLogDto>>> GetRecentAuditLogs([FromQuery] int limit = 10)
        {
            try
            {
                var auditLogs = await _context.AuditLogs
                    .OrderByDescending(a => a.Timestamp)
                    .Take(limit)
                    .ToListAsync();

                var result = auditLogs.Select(a => new AuditLogDto
                {
                    Id = a.Id,
                    EntityName = a.EntityName,
                    Action = a.Action,
                    UserId = a.UserId,
                    Timestamp = a.Timestamp,
                    Changes = a.Changes,
                    EntityId = a.EntityId
                }).ToList();

                return Ok(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error retrieving recent audit logs", error = ex.Message });
            }
        }

        [HttpPost("log")]
        public async Task<ActionResult> LogAudit([FromBody] CreateAuditLogDto dto)
        {
            try
            {
                await _auditService.LogAuditAsync(
                    dto.EntityName,
                    dto.EntityId,
                    dto.Action,
                    dto.UserId,
                    dto.Changes
                );

                return Ok(new { message = "Audit log created successfully" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error creating audit log", error = ex.Message });
            }
        }
    }

    public class AuditLogDto
    {
        public int Id { get; set; }
        public string EntityName { get; set; } = string.Empty;
        public string Action { get; set; } = string.Empty;
        public string UserId { get; set; } = string.Empty;
        public DateTime Timestamp { get; set; }
        public string Changes { get; set; } = string.Empty;
        public string EntityId { get; set; } = string.Empty;
    }

    public class CreateAuditLogDto
    {
        public string EntityName { get; set; } = string.Empty;
        public string EntityId { get; set; } = string.Empty;
        public string Action { get; set; } = string.Empty;
        public string UserId { get; set; } = string.Empty;
        public string Changes { get; set; } = string.Empty;
    }

    public class AuditStatsDto
    {
        public int TotalLogs { get; set; }
        public int TodayLogs { get; set; }
        public int ThisWeekLogs { get; set; }
        public Dictionary<string, int> ActionBreakdown { get; set; } = new();
        public Dictionary<string, int> EntityBreakdown { get; set; } = new();
    }
}

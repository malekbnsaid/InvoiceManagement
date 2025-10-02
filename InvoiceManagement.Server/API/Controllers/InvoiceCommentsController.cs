using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using InvoiceManagement.Server.Application.Interfaces;
using InvoiceManagement.Server.Domain.Entities;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using System.ComponentModel.DataAnnotations;

namespace InvoiceManagement.Server.API.Controllers
{
    public class CreateCommentRequest
    {
        [Required]
        public string Content { get; set; } = string.Empty;
        public string? Author { get; set; }
    }

    public class UpdateCommentRequest
    {
        [Required]
        public string Content { get; set; } = string.Empty;
    }

    [ApiController]
    [Route("api/[controller]")]
    public class InvoiceCommentsController : ControllerBase
    {
        private readonly IInvoiceService _invoiceService;
        private readonly ILogger<InvoiceCommentsController> _logger;

        public InvoiceCommentsController(IInvoiceService invoiceService, ILogger<InvoiceCommentsController> logger)
        {
            _invoiceService = invoiceService;
            _logger = logger;
        }

        [HttpGet("{invoiceId}")]
        public async Task<ActionResult<IEnumerable<InvoiceComment>>> GetComments(int invoiceId)
        {
            try
            {
                var comments = await _invoiceService.GetInvoiceCommentsAsync(invoiceId);
                return Ok(comments);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching comments for invoice {InvoiceId}", invoiceId);
                return StatusCode(500, "An error occurred while fetching comments");
            }
        }

        [HttpPost("{invoiceId}")]
        public async Task<ActionResult<InvoiceComment>> CreateComment(int invoiceId, [FromBody] CreateCommentRequest request)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(request.Content))
                {
                    return BadRequest("Comment content is required");
                }

                var comment = new InvoiceComment
                {
                    InvoiceId = invoiceId,
                    Content = request.Content,
                    Author = request.Author ?? "System",
                    CreatedAt = DateTime.UtcNow,
                    CreatedBy = request.Author ?? "System"
                };

                var createdComment = await _invoiceService.AddInvoiceCommentAsync(comment);
                return Ok(createdComment);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating comment for invoice {InvoiceId}", invoiceId);
                return StatusCode(500, "An error occurred while creating the comment");
            }
        }

        [HttpPut("{commentId}")]
        public async Task<ActionResult<InvoiceComment>> UpdateComment(int commentId, [FromBody] UpdateCommentRequest request)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(request.Content))
                {
                    return BadRequest("Comment content is required");
                }

                var comment = await _invoiceService.GetInvoiceCommentByIdAsync(commentId);
                if (comment == null)
                {
                    return NotFound("Comment not found");
                }

                comment.Content = request.Content;
                comment.ModifiedAt = DateTime.UtcNow;
                comment.ModifiedBy = "System"; // You might want to get this from the current user

                var updatedComment = await _invoiceService.UpdateInvoiceCommentAsync(comment);
                return Ok(updatedComment);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating comment {CommentId}", commentId);
                return StatusCode(500, "An error occurred while updating the comment");
            }
        }

        [HttpDelete("{commentId}")]
        public async Task<ActionResult> DeleteComment(int commentId)
        {
            try
            {
                var result = await _invoiceService.DeleteInvoiceCommentAsync(commentId);
                if (!result)
                {
                    return NotFound("Comment not found");
                }

                return NoContent();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting comment {CommentId}", commentId);
                return StatusCode(500, "An error occurred while deleting the comment");
            }
        }
    }
}

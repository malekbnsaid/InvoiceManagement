/*using Microsoft.AspNetCore.Mvc;
using System;
using System.Threading.Tasks;
using InvoiceManagement.Server.Application.Interfaces;

namespace InvoiceManagement.Server.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ProjectController : ControllerBase
    {
        private readonly IProjectNumberService _projectNumberService;

        public ProjectController(IProjectNumberService projectNumberService)
        {
            _projectNumberService = projectNumberService;
        }

        [HttpGet("generate-number/{sectionId}")]
        public async Task<ActionResult<string>> GenerateProjectNumber(int sectionId)
        {
            try
            {
                var projectNumber = await _projectNumberService.GenerateProjectNumberAsync(sectionId);
                return Ok(projectNumber);
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }
    }
} */
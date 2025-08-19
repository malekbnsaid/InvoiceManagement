using Microsoft.AspNetCore.Mvc;
using InvoiceManagement.Server.Domain.Entities;
using InvoiceManagement.Server.Application.Interfaces;
using InvoiceManagement.Server.Domain.Interfaces;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace InvoiceManagement.Server.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class LPOsController : ControllerBase
    {
        private readonly IRepository<LPO> _lpoRepository;

        public LPOsController(IRepository<LPO> lpoRepository)
        {
            _lpoRepository = lpoRepository;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<LPO>>> GetLPOs()
        {
            var lpos = await _lpoRepository.GetAllAsync();
            return Ok(lpos);
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<LPO>> GetLPO(int id)
        {
            var lpo = await _lpoRepository.GetByIdAsync(id);
            if (lpo == null)
                return NotFound();

            return Ok(lpo);
        }

        [HttpGet("project/{projectId}")]
        public async Task<ActionResult<IEnumerable<LPO>>> GetLPOsByProject(int projectId)
        {
            // This would need a custom repository method
            var lpos = await _lpoRepository.GetAllAsync();
            return Ok(lpos.Where(l => l.ProjectId == projectId));
        }

        [HttpPost]
        public async Task<ActionResult<LPO>> CreateLPO([FromBody] LPO lpo)
        {
            await _lpoRepository.AddAsync(lpo);
            await _lpoRepository.SaveChangesAsync();
            return CreatedAtAction(nameof(GetLPO), new { id = lpo.Id }, lpo);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateLPO(int id, [FromBody] LPO lpo)
        {
            if (id != lpo.Id)
                return BadRequest();

            await _lpoRepository.UpdateAsync(lpo);
            await _lpoRepository.SaveChangesAsync();
            return NoContent();
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteLPO(int id)
        {
            await _lpoRepository.DeleteAsync(id);
            await _lpoRepository.SaveChangesAsync();
            return NoContent();
        }
    }
} 
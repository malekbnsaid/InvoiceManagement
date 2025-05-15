using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using InvoiceManagement.Server.Domain.Entities;
using InvoiceManagement.Server.Application.Services;

namespace InvoiceManagement.Server.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class DepartmentHierarchyController : ControllerBase
    {
        private readonly IDepartmentHierarchyService _departmentHierarchyService;

        public DepartmentHierarchyController(IDepartmentHierarchyService departmentHierarchyService)
        {
            _departmentHierarchyService = departmentHierarchyService;
        }

        [HttpGet]
        public async Task<ActionResult<List<DepartmentHierarchy>>> GetAll()
        {
            var hierarchies = await _departmentHierarchyService.GetAllAsync();
            return Ok(hierarchies);
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<DepartmentHierarchy>> GetById(int id)
        {
            var hierarchy = await _departmentHierarchyService.GetByIdAsync(id);
            if (hierarchy == null)
                return NotFound();

            return Ok(hierarchy);
        }

        [HttpGet("department/{departmentId}")]
        public async Task<ActionResult<List<DepartmentHierarchy>>> GetByDepartmentId(int departmentId)
        {
            var hierarchies = await _departmentHierarchyService.GetByDepartmentIdAsync(departmentId);
            return Ok(hierarchies);
        }

        [HttpGet("section/{sectionId}")]
        public async Task<ActionResult<List<DepartmentHierarchy>>> GetBySectionId(int sectionId)
        {
            var hierarchies = await _departmentHierarchyService.GetBySectionIdAsync(sectionId);
            return Ok(hierarchies);
        }

        [HttpGet("section/{sectionId}/units")]
        public async Task<ActionResult<List<DepartmentHierarchy>>> GetUnitsBySectionId(int sectionId)
        {
            var units = await _departmentHierarchyService.GetUnitsBySectionIdAsync(sectionId);
            return Ok(units);
        }

        [HttpGet("section/{sectionId}/abbreviation")]
        public async Task<ActionResult<string>> GetSectionAbbreviation(int sectionId)
        {
            var abbreviation = await _departmentHierarchyService.GetSectionAbbreviationAsync(sectionId);
            if (abbreviation == null)
                return NotFound();
                
            return Ok(abbreviation);
        }

        [HttpPost]
        public async Task<ActionResult<DepartmentHierarchy>> Create(DepartmentHierarchy departmentHierarchy)
        {
            var created = await _departmentHierarchyService.CreateAsync(departmentHierarchy);
            return CreatedAtAction(nameof(GetById), new { id = created.Id }, created);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, DepartmentHierarchy departmentHierarchy)
        {
            if (id != departmentHierarchy.Id)
                return BadRequest();

            try
            {
                await _departmentHierarchyService.UpdateAsync(departmentHierarchy);
                return NoContent();
            }
            catch (Exception)
            {
                return NotFound();
            }
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            await _departmentHierarchyService.DeleteAsync(id);
            return NoContent();
        }
    }
} 
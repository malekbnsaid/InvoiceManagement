using InvoiceManagement.Server.Application.Interfaces;
using InvoiceManagement.Server.Domain.Entities;
using Microsoft.AspNetCore.Mvc;

namespace InvoiceManagement.Server.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class DepartmentController : ControllerBase
    {
        private readonly IDepartmentService _departmentService;

        public DepartmentController(IDepartmentService departmentService)
        {
            _departmentService = departmentService;
        }

        [HttpGet]
        public async Task<ActionResult<List<DepartmentNode>>> GetAll()
        {
            var departments = await _departmentService.GetAllAsync();
            return Ok(departments.Select(d => new
            {
                id = d.DepartmentNumber,
                sectionName = d.DepartmentNameEnglish,
                sectionAbbreviation = d.SectionAbbreviation,
                parentId = d.ParentId,
                isSection = d.ParentId == 1575
            }));
        }

        [HttpGet("departments")]
        public async Task<ActionResult<List<DepartmentNode>>> GetDepartments()
        {
            var departments = await _departmentService.GetDepartmentsAsync();
            return Ok(departments);
        }

        [HttpGet("sections/{departmentNumber}")]
        public async Task<ActionResult<List<DepartmentNode>>> GetSections(int departmentNumber)
        {
            var sections = await _departmentService.GetSectionsAsync(departmentNumber);
            return Ok(sections);
        }

        [HttpGet("units/{sectionNumber}")]
        public async Task<ActionResult<List<DepartmentNode>>> GetUnits(int sectionNumber)
        {
            var units = await _departmentService.GetUnitsAsync(sectionNumber);
            return Ok(units);
        }

        [HttpGet("{departmentNumber}")]
        public async Task<ActionResult<DepartmentNode>> GetByNumber(int departmentNumber)
        {
            var department = await _departmentService.GetByNumberAsync(departmentNumber);
            if (department == null)
                return NotFound();

            return Ok(department);
        }

        [HttpGet("section/{sectionNumber}/abbreviation")]
        public async Task<ActionResult<string>> GetSectionAbbreviation(int sectionNumber)
        {
            var abbreviation = await _departmentService.GetSectionAbbreviationAsync(sectionNumber);
            if (abbreviation == null)
                return NotFound();

            return Ok(abbreviation);
        }

        [HttpPost]
        public async Task<ActionResult<DepartmentNode>> Create(DepartmentNode department)
        {
            var created = await _departmentService.CreateAsync(department);
            return CreatedAtAction(nameof(GetByNumber), new { departmentNumber = created.DepartmentNumber }, created);
        }

        [HttpPut("{departmentNumber}")]
        public async Task<IActionResult> Update(int departmentNumber, DepartmentNode department)
        {
            if (departmentNumber != department.DepartmentNumber)
                return BadRequest();

            try
            {
                await _departmentService.UpdateAsync(department);
                return NoContent();
            }
            catch (KeyNotFoundException)
            {
                return NotFound();
            }
        }

        [HttpDelete("{departmentNumber}")]
        public async Task<IActionResult> Delete(int departmentNumber)
        {
            try
            {
                await _departmentService.DeleteAsync(departmentNumber);
                return NoContent();
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(ex.Message);
            }
        }
    }
} 
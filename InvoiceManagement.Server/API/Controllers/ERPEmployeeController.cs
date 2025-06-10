using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using InvoiceManagement.Server.Domain.Entities;
using InvoiceManagement.Server.Domain.Interfaces;

namespace InvoiceManagement.Server.API.Controllers
{
    [ApiController]
    [Route("api/ERPEmployees")]
    public class ERPEmployeeController : ControllerBase
    {
        private readonly IERPEmployeeService _employeeService;

        public ERPEmployeeController(IERPEmployeeService employeeService)
        {
            _employeeService = employeeService;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<ERPEmployee>>> GetEmployees()
        {
            var employees = await _employeeService.GetAllEmployeesAsync();
            return Ok(employees);
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<ERPEmployee>> GetEmployee(int id)
        {
            var employee = await _employeeService.GetEmployeeByIdAsync(id);
            if (employee == null)
            {
                return NotFound();
            }
            return Ok(employee);
        }

        [HttpGet("number/{employeeNumber}")]
        public async Task<ActionResult<ERPEmployee>> GetEmployeeByNumber(string employeeNumber)
        {
            var employee = await _employeeService.GetEmployeeByNumberAsync(employeeNumber);
            if (employee == null)
            {
                return NotFound();
            }
            return Ok(employee);
        }

        [HttpPost]
        public async Task<ActionResult<ERPEmployee>> CreateEmployee(ERPEmployee employee)
        {
            var createdEmployee = await _employeeService.CreateEmployeeAsync(employee);
            return CreatedAtAction(nameof(GetEmployee), new { id = createdEmployee.Id }, createdEmployee);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateEmployee(int id, ERPEmployee employee)
        {
            if (id != employee.Id)
            {
                return BadRequest();
            }

            var updated = await _employeeService.UpdateEmployeeAsync(employee);
            if (updated == null)
            {
                return NotFound();
            }

            return NoContent();
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteEmployee(int id)
        {
            await _employeeService.DeleteEmployeeAsync(id);
            return NoContent();
        }
    }
} 
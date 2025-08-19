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
    public class VendorsController : ControllerBase
    {
        private readonly IRepository<Vendor> _vendorRepository;

        public VendorsController(IRepository<Vendor> vendorRepository)
        {
            _vendorRepository = vendorRepository;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<Vendor>>> GetVendors()
        {
            var vendors = await _vendorRepository.GetAllAsync();
            return Ok(vendors);
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<Vendor>> GetVendor(int id)
        {
            var vendor = await _vendorRepository.GetByIdAsync(id);
            if (vendor == null)
                return NotFound();

            return Ok(vendor);
        }

        [HttpPost]
        public async Task<ActionResult<Vendor>> CreateVendor([FromBody] Vendor vendor)
        {
            await _vendorRepository.AddAsync(vendor);
            await _vendorRepository.SaveChangesAsync();
            return CreatedAtAction(nameof(GetVendor), new { id = vendor.Id }, vendor);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateVendor(int id, [FromBody] Vendor vendor)
        {
            if (id != vendor.Id)
                return BadRequest();

            await _vendorRepository.UpdateAsync(vendor);
            await _vendorRepository.SaveChangesAsync();
            return NoContent();
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteVendor(int id)
        {
            await _vendorRepository.DeleteAsync(id);
            await _vendorRepository.SaveChangesAsync();
            return NoContent();
        }
    }
} 
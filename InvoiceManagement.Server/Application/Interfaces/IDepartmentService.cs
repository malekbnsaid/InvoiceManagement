using InvoiceManagement.Server.Domain.Entities;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace InvoiceManagement.Server.Application.Interfaces
{
    public interface IDepartmentService
    {
        Task<List<DepartmentNode>> GetAllAsync();
        Task<DepartmentNode?> GetByNumberAsync(int departmentNumber);
        Task<List<DepartmentNode>> GetDepartmentsAsync();
        Task<List<DepartmentNode>> GetSectionsAsync(int departmentNumber);
        Task<List<DepartmentNode>> GetUnitsAsync(int sectionNumber);
        Task<string?> GetSectionAbbreviationAsync(int sectionNumber);
        Task<DepartmentNode> CreateAsync(DepartmentNode department);
        Task<DepartmentNode> UpdateAsync(DepartmentNode department);
        Task DeleteAsync(int departmentNumber);
    }
} 
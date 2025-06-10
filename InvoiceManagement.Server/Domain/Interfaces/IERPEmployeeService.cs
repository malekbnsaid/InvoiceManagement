using InvoiceManagement.Server.Domain.Entities;

namespace InvoiceManagement.Server.Domain.Interfaces
{
    public interface IERPEmployeeService
    {
        Task<IEnumerable<ERPEmployee>> GetAllEmployeesAsync();
        Task<ERPEmployee?> GetEmployeeByIdAsync(int id);
        Task<ERPEmployee?> GetEmployeeByNumberAsync(string employeeNumber);
        Task<ERPEmployee> CreateEmployeeAsync(ERPEmployee employee);
        Task<ERPEmployee> UpdateEmployeeAsync(ERPEmployee employee);
        Task DeleteEmployeeAsync(int id);
    }
} 
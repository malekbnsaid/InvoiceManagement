using InvoiceManagement.Server.Application.Interfaces;
using InvoiceManagement.Server.Domain.Entities;
using InvoiceManagement.Server.Domain.Interfaces;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace InvoiceManagement.Server.Application.Services
{
    public class ERPEmployeeService : IERPEmployeeService
    {
        private readonly IRepository<ERPEmployee> _repository;

        public ERPEmployeeService(IRepository<ERPEmployee> repository)
        {
            _repository = repository;
        }

        public async Task<IEnumerable<ERPEmployee>> GetAllEmployeesAsync()
        {
            return await _repository.GetAllAsync();
        }

        public async Task<ERPEmployee?> GetEmployeeByIdAsync(int id)
        {
            return await _repository.GetByIdAsync(id);
        }

        public async Task<ERPEmployee?> GetEmployeeByNumberAsync(string employeeNumber)
        {
            var employees = await _repository.FindAsync(e => e.EmployeeNumber == employeeNumber);
            return employees.FirstOrDefault();
        }

        public async Task<ERPEmployee> CreateEmployeeAsync(ERPEmployee employee)
        {
            await _repository.AddAsync(employee);
            await _repository.SaveChangesAsync();
            return employee;
        }

        public async Task<ERPEmployee> UpdateEmployeeAsync(ERPEmployee employee)
        {
            await _repository.UpdateAsync(employee);
            await _repository.SaveChangesAsync();
            return employee;
        }

        public async Task DeleteEmployeeAsync(int id)
        {
            await _repository.DeleteAsync(id);
            await _repository.SaveChangesAsync();
        }
    }
} 
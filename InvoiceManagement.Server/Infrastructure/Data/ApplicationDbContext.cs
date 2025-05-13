using InvoiceManagement.Server.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

namespace InvoiceManagement.Server.Infrastructure.Data
{
    public class ApplicationDbContext : DbContext
    {
        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : base(options)
        {
        }

        public DbSet<Department> Departments { get; set; }
        public DbSet<Section> Sections { get; set; }
        public DbSet<Unit> Units { get; set; }
        public DbSet<Employee> Employees { get; set; }
        public DbSet<Project> Projects { get; set; }
        public DbSet<LPO> LPOs { get; set; }
        public DbSet<Invoice> Invoices { get; set; }
        public DbSet<StatusHistory> StatusHistories { get; set; }
        public DbSet<ProjectNumberRequest> ProjectNumberRequests { get; set; }
        public DbSet<DocumentAttachment> DocumentAttachments { get; set; }
        public DbSet<Notification> Notifications { get; set; }
        public DbSet<AuditLog> AuditLogs { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // Configure relationships
            modelBuilder.Entity<Department>()
                .HasMany(d => d.Sections)
                .WithOne(s => s.Department)
                .HasForeignKey(s => s.DepartmentId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<Section>()
                .HasMany(s => s.Units)
                .WithOne(u => u.Section)
                .HasForeignKey(u => u.SectionId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<Unit>()
                .HasMany(u => u.Projects)
                .WithOne(p => p.Unit)
                .HasForeignKey(p => p.UnitId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<Project>()
                .HasMany(p => p.LPOs)
                .WithOne(l => l.Project)
                .HasForeignKey(l => l.ProjectId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<Project>()
                .HasMany(p => p.Invoices)
                .WithOne(i => i.Project)
                .HasForeignKey(i => i.ProjectId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<LPO>()
                .HasMany(l => l.Invoices)
                .WithOne(i => i.LPO)
                .HasForeignKey(i => i.LPOId)
                .OnDelete(DeleteBehavior.Restrict);
                
            modelBuilder.Entity<Invoice>()
                .HasMany(i => i.StatusHistories)
                .WithOne(sh => sh.Invoice)
                .HasForeignKey(sh => sh.InvoiceId)
                .OnDelete(DeleteBehavior.Cascade);
                
            modelBuilder.Entity<Unit>()
                .HasMany<ProjectNumberRequest>()
                .WithOne(pr => pr.Unit)
                .HasForeignKey(pr => pr.UnitId)
                .OnDelete(DeleteBehavior.Restrict);
                
            modelBuilder.Entity<Project>()
                .HasMany<ProjectNumberRequest>()
                .WithOne(pr => pr.Project)
                .HasForeignKey(pr => pr.ProjectId)
                .OnDelete(DeleteBehavior.SetNull);
                
            modelBuilder.Entity<Invoice>()
                .HasOne(i => i.DuplicateOfInvoice)
                .WithMany()
                .HasForeignKey(i => i.DuplicateOfInvoiceId)
                .OnDelete(DeleteBehavior.Restrict);
                
            // Document attachments
            modelBuilder.Entity<DocumentAttachment>()
                .HasOne(d => d.Invoice)
                .WithMany()
                .HasForeignKey(d => d.InvoiceId)
                .OnDelete(DeleteBehavior.Restrict);
                
            modelBuilder.Entity<DocumentAttachment>()
                .HasOne(d => d.Project)
                .WithMany()
                .HasForeignKey(d => d.ProjectId)
                .OnDelete(DeleteBehavior.Restrict);
                
            modelBuilder.Entity<DocumentAttachment>()
                .HasOne(d => d.LPO)
                .WithMany()
                .HasForeignKey(d => d.LPOId)
                .OnDelete(DeleteBehavior.Restrict);
                
            // Notifications
            modelBuilder.Entity<Notification>()
                .HasOne(n => n.Employee)
                .WithMany()
                .HasForeignKey(n => n.EmployeeId)
                .OnDelete(DeleteBehavior.Cascade);
        }

        public override Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
        {
            // This will be used to implement the audit logging
            var entries = ChangeTracker.Entries()
                .Where(e => e.Entity is BaseEntity && (
                    e.State == EntityState.Added ||
                    e.State == EntityState.Modified));

            foreach (var entry in entries)
            {
                var entity = (BaseEntity)entry.Entity;

                if (entry.State == EntityState.Added)
                {
                    entity.CreatedAt = DateTime.UtcNow;
                    // CreatedBy would be set from the service layer using the current user
                }
                else if (entry.State == EntityState.Modified)
                {
                    entity.ModifiedAt = DateTime.UtcNow;
                    // ModifiedBy would be set from the service layer using the current user
                }
            }

            return base.SaveChangesAsync(cancellationToken);
        }
    }
} 
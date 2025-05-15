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

        public DbSet<Project> Projects { get; set; } = null!;
        public DbSet<LPO> LPOs { get; set; } = null!;
        public DbSet<Invoice> Invoices { get; set; } = null!;
        public DbSet<StatusHistory> StatusHistories { get; set; } = null!;
        public DbSet<ProjectNumberRequest> ProjectNumberRequests { get; set; } = null!;
        public DbSet<DocumentAttachment> DocumentAttachments { get; set; } = null!;
        public DbSet<Notification> Notifications { get; set; } = null!;
        public DbSet<AuditLog> AuditLogs { get; set; } = null!;
        public DbSet<Vendor> Vendors { get; set; } = null!;
        public DbSet<DepartmentHierarchy> DepartmentHierarchies { get; set; } = null!;
        public DbSet<ERPEmployee> ERPEmployees { get; set; } = null!;
        public DbSet<AppUser> AppUsers { get; set; } = null!;

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // DepartmentHierarchy configuration
            modelBuilder.Entity<DepartmentHierarchy>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.DepartmentName).IsRequired();
                entity.Property(e => e.SectionName).IsRequired();
                entity.Property(e => e.SectionAbbreviation).IsRequired();
                entity.Property(e => e.UnitName).IsRequired();
            });

            // Project configuration
            modelBuilder.Entity<Project>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.ProjectNumber).IsRequired();
                entity.Property(e => e.Name).IsRequired();
                
                // Relationship with DepartmentHierarchy for Section
                entity.HasOne(p => p.Section)
                    .WithMany()
                    .HasForeignKey(p => p.SectionId)
                    .OnDelete(DeleteBehavior.Restrict);
                
                // Relationship with ERPEmployee for ProjectManager
                entity.HasOne(p => p.ProjectManager)
                    .WithMany()
                    .HasForeignKey(p => p.ProjectManagerId)
                    .OnDelete(DeleteBehavior.Restrict);

                // Existing relationships
                entity.HasMany(p => p.LPOs)
                    .WithOne(l => l.Project)
                    .HasForeignKey(l => l.ProjectId)
                    .OnDelete(DeleteBehavior.Restrict);

                entity.HasMany(p => p.Invoices)
                    .WithOne(i => i.Project)
                    .HasForeignKey(i => i.ProjectId)
                    .OnDelete(DeleteBehavior.Restrict);
            });

            // Configure other relationships
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
                
            modelBuilder.Entity<ProjectNumberRequest>()
                .HasOne(pr => pr.DepartmentHierarchy)
                .WithMany()
                .HasForeignKey(pr => pr.DepartmentHierarchyId)
                .OnDelete(DeleteBehavior.Restrict);
                
            // Configure Vendor relationships
            modelBuilder.Entity<Vendor>()
                .HasMany(v => v.Invoices)
                .WithOne(i => i.Vendor)
                .HasForeignKey(i => i.VendorId)
                .OnDelete(DeleteBehavior.Restrict);
                
            modelBuilder.Entity<Vendor>()
                .HasMany(v => v.LPOs)
                .WithOne(l => l.Vendor)
                .HasForeignKey(l => l.VendorId)
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
                .HasForeignKey(n => n.ERPEmployeeId)
                .OnDelete(DeleteBehavior.Cascade);

            // ERPEmployee configuration
            modelBuilder.Entity<ERPEmployee>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.EmployeeNumber).IsRequired().HasMaxLength(50);
                entity.HasIndex(e => e.EmployeeNumber).IsUnique();
                
                entity.Property(e => e.EmployeeName).HasMaxLength(256);
                entity.Property(e => e.EmployeeNameAr).HasMaxLength(256);
                entity.Property(e => e.Email).HasMaxLength(50);
                entity.Property(e => e.Department).HasMaxLength(256);
                entity.Property(e => e.JobTitle).HasMaxLength(256);
            });

            // AppUser configuration
            modelBuilder.Entity<AppUser>(entity =>
            {
                entity.HasKey(e => e.User_Seq);
                entity.Property(e => e.User_Seq).ValueGeneratedOnAdd();
                
                entity.Property(e => e.EMPLOYEE_NUMBER).HasMaxLength(50);
                entity.Property(e => e.User_Name).IsRequired().HasMaxLength(240);
                entity.Property(e => e.EMAIL).HasMaxLength(240);
                
                // Relationship with ERPEmployee
                entity.HasOne(u => u.Employee)
                    .WithMany()
                    .HasForeignKey(u => u.EMPLOYEE_NUMBER)
                    .HasPrincipalKey(e => e.EmployeeNumber)
                    .OnDelete(DeleteBehavior.Restrict);
            });
        }

        public override Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
        {
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
                }
                else if (entry.State == EntityState.Modified)
                {
                    entity.ModifiedAt = DateTime.UtcNow;
                }
            }

            return base.SaveChangesAsync(cancellationToken);
        }
    }
} 
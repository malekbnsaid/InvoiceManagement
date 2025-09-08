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
        public DbSet<InvoiceLineItem> InvoiceLineItems { get; set; } = null!;
        public DbSet<StatusHistory> StatusHistories { get; set; } = null!;
        public DbSet<ProjectNumberRequest> ProjectNumberRequests { get; set; } = null!;
        public DbSet<DocumentAttachment> DocumentAttachments { get; set; } = null!;
        public DbSet<Notification> Notifications { get; set; } = null!;
        public DbSet<AuditLog> AuditLogs { get; set; } = null!;
        public DbSet<Vendor> Vendors { get; set; } = null!;
        public DbSet<DepartmentNode> Departments { get; set; } = null!;
        public DbSet<ERPEmployee> ERPEmployees { get; set; } = null!;
        public DbSet<AppUser> AppUsers { get; set; } = null!;
        public DbSet<PasswordResetToken> PasswordResetTokens { get; set; } = null!;
        public DbSet<PaymentPlanLine> PaymentPlanLines { get; set; } = null!;

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // Configure decimal precision for all decimal properties
            modelBuilder.Entity<Invoice>(entity =>
            {
                entity.Property(e => e.InvoiceValue).HasPrecision(18, 2);
                entity.Property(e => e.PaidAmount).HasPrecision(18, 2);
                entity.Property(e => e.SubTotal).HasPrecision(18, 2);
                entity.Property(e => e.TaxAmount).HasPrecision(18, 2);
                entity.Property(e => e.DiscountAmount).HasPrecision(18, 2);
            });

            modelBuilder.Entity<InvoiceLineItem>(entity =>
            {
                entity.Property(e => e.Quantity).HasPrecision(18, 2);
                entity.Property(e => e.UnitPrice).HasPrecision(18, 2);
                entity.Property(e => e.Amount).HasPrecision(18, 2);
                entity.Property(e => e.TaxAmount).HasPrecision(18, 2);
                entity.Property(e => e.TaxRate).HasPrecision(5, 2);
                entity.Property(e => e.DiscountAmount).HasPrecision(18, 2);
                entity.Property(e => e.DiscountRate).HasPrecision(5, 2);

                entity.HasOne(e => e.Invoice)
                    .WithMany(i => i.LineItems)
                    .HasForeignKey(e => e.InvoiceId)
                    .OnDelete(DeleteBehavior.Cascade);
            });

            modelBuilder.Entity<LPO>(entity =>
            {
                entity.Property(e => e.TotalAmount).HasPrecision(18, 2);
                entity.Property(e => e.RemainingAmount).HasPrecision(18, 2);
            });

            modelBuilder.Entity<PaymentPlanLine>(entity =>
            {
                entity.Property(e => e.Amount).HasPrecision(18, 2);
                
                // Configure the relationship with Project
                entity.HasOne(ppl => ppl.Project)
                    .WithMany(p => p.PaymentPlanLines)
                    .HasForeignKey(ppl => ppl.ProjectId)
                    .OnDelete(DeleteBehavior.Cascade);
                    
                // Ensure ProjectId is required
                entity.Property(ppl => ppl.ProjectId).IsRequired();
            });

            modelBuilder.Entity<Project>(entity =>
            {
                entity.Property(e => e.Budget).HasPrecision(18, 2);
                entity.Property(e => e.Cost).HasPrecision(18, 2);
            });

            // DepartmentNode configuration
            modelBuilder.Entity<DepartmentNode>(entity =>
            {
                entity.HasKey(d => d.DepartmentNumber);
                
                entity.Property(d => d.DepartmentNumber)
                    .ValueGeneratedNever();

                entity.HasOne(d => d.Parent)
                    .WithMany(d => d.Children)
                    .HasForeignKey(d => d.ParentId)
                    .OnDelete(DeleteBehavior.Restrict);

                // Add unique constraint for department name within the same parent
                entity.HasIndex(d => new { d.DepartmentNameEnglish, d.ParentId })
                    .IsUnique()
                    .HasFilter("[ParentId] IS NOT NULL");

                // Add unique constraint for top-level departments
                entity.HasIndex(d => d.DepartmentNameEnglish)
                    .HasFilter("[ParentId] IS NULL")
                    .IsUnique();
            });

            // Project configuration
            modelBuilder.Entity<Project>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.ProjectNumber).IsRequired();
                entity.Property(e => e.Name).IsRequired();
                
                // Relationship with DepartmentNode for Section
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

                // Relationship with PaymentPlanLine
                entity.HasMany(p => p.PaymentPlanLines)
                    .WithOne(ppl => ppl.Project)
                    .HasForeignKey(ppl => ppl.ProjectId)
                    .OnDelete(DeleteBehavior.Cascade)
                    .IsRequired(false); // Allow null for optional relationship
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
                .HasOne(pr => pr.DepartmentNode)
                .WithMany()
                .HasForeignKey(pr => pr.DepartmentNodeId)
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
                .HasOne(n => n.ERPEmployee)
                .WithMany()
                .HasForeignKey(n => n.ERPEmployeeId)
                .OnDelete(DeleteBehavior.Cascade);

            // ERPEmployee configuration
            modelBuilder.Entity<ERPEmployee>(entity =>
            {
                entity.HasKey(e => e.Id);
                
                // Required fields
                entity.Property(e => e.EmployeeNumber)
                    .IsRequired()
                    .HasMaxLength(50);
                entity.Property(e => e.EmployeeName)
                    .IsRequired()
                    .HasMaxLength(256);
                entity.Property(e => e.Email)
                    .IsRequired()
                    .HasMaxLength(50);
                entity.Property(e => e.Department)
                    .IsRequired()
                    .HasMaxLength(256);
                entity.Property(e => e.DepartmentID)
                    .IsRequired();
                entity.Property(e => e.JobTitle)
                    .IsRequired()
                    .HasMaxLength(256);
                entity.Property(e => e.CreatedBy)
                    .IsRequired();

                // Unique constraints
                entity.HasIndex(e => e.EmployeeNumber).IsUnique();
                
                // Optional fields with max lengths
                entity.Property(e => e.EmployeeNameAr).HasMaxLength(256);
                entity.Property(e => e.QID).HasMaxLength(50);
                entity.Property(e => e.DepartmentAr).HasMaxLength(256);
                entity.Property(e => e.JobNumber).HasMaxLength(50);
                entity.Property(e => e.JobTitleAr).HasMaxLength(256);
                entity.Property(e => e.JobGrade).HasMaxLength(50);
                entity.Property(e => e.JobGradeAr).HasMaxLength(50);
                entity.Property(e => e.BasicSalary).HasMaxLength(50);
                entity.Property(e => e.Nationality).HasMaxLength(100);
                entity.Property(e => e.NationalityAr).HasMaxLength(100);
                entity.Property(e => e.ContractType).HasMaxLength(50);
                entity.Property(e => e.Status).HasMaxLength(50);
                entity.Property(e => e.Manager_Id).HasMaxLength(50);
                entity.Property(e => e.Rec_UserId).HasMaxLength(50);
                entity.Property(e => e.Rec_IPAddress).HasMaxLength(50);
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
            var entries = ChangeTracker.Entries<BaseEntity>();

            foreach (var entry in entries)
            {
                if (entry.State == EntityState.Added)
                {
                    entry.Entity.CreatedAt = DateTime.UtcNow;
                }
                else if (entry.State == EntityState.Modified)
                {
                    entry.Entity.ModifiedAt = DateTime.UtcNow;
                }
            }

            return base.SaveChangesAsync(cancellationToken);
        }
    }
} 
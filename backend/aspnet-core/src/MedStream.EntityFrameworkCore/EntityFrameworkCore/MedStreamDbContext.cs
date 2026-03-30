using Abp.Zero.EntityFrameworkCore;
using MedStream.Authorization.Roles;
using MedStream.Authorization.Users;
using MedStream.Facilities;
using MedStream.PatientIntake;
using MedStream.MultiTenancy;
using Microsoft.EntityFrameworkCore;

namespace MedStream.EntityFrameworkCore;

public class MedStreamDbContext : AbpZeroDbContext<Tenant, Role, User, MedStreamDbContext>
{
    /* Define a DbSet for each entity of the application */
    public DbSet<Facility> Facilities { get; set; }
    public DbSet<Visit> Visits { get; set; }
    public DbSet<SymptomIntake> SymptomIntakes { get; set; }
    public DbSet<TriageAssessment> TriageAssessments { get; set; }
    public DbSet<QueueTicket> QueueTickets { get; set; }
    public DbSet<QueueEvent> QueueEvents { get; set; }

    public MedStreamDbContext(DbContextOptions<MedStreamDbContext> options)
        : base(options)
    {
    }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<Facility>(entity =>
        {
            entity.ToTable("Facilities");
            entity.HasIndex(item => new { item.TenantId, item.Name });
            entity.HasIndex(item => new { item.TenantId, item.IsActive });
        });

        modelBuilder.Entity<Visit>(entity =>
        {
            entity.ToTable("Visits");
            entity.HasIndex(item => new { item.TenantId, item.PatientUserId, item.CreationTime });
            entity.HasIndex(item => new { item.TenantId, item.Status });
        });

        modelBuilder.Entity<SymptomIntake>(entity =>
        {
            entity.ToTable("SymptomIntakes");
            entity.HasIndex(item => new { item.TenantId, item.VisitId, item.SubmittedAt });
            entity.HasOne<Visit>()
                .WithMany()
                .HasForeignKey(item => item.VisitId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<TriageAssessment>(entity =>
        {
            entity.ToTable("TriageAssessments");
            entity.Property(item => item.PriorityScore).HasPrecision(5, 2);
            entity.HasIndex(item => new { item.TenantId, item.VisitId, item.AssessedAt });
            entity.HasOne<Visit>()
                .WithMany()
                .HasForeignKey(item => item.VisitId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<QueueTicket>(entity =>
        {
            entity.ToTable("QueueTickets");
            entity.HasIndex(item => new { item.TenantId, item.FacilityId, item.QueueDate, item.QueueNumber })
                .IsUnique();
            entity.HasIndex(item => new { item.TenantId, item.VisitId, item.IsActive })
                .HasFilter("\"IsDeleted\" = false AND \"IsActive\" = true")
                .IsUnique();
            entity.HasIndex(item => new { item.TenantId, item.FacilityId, item.QueueStatus, item.EnteredQueueAt });
            entity.HasOne<Visit>()
                .WithMany()
                .HasForeignKey(item => item.VisitId)
                .OnDelete(DeleteBehavior.Cascade);
            entity.HasOne<TriageAssessment>()
                .WithMany()
                .HasForeignKey(item => item.TriageAssessmentId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<QueueEvent>(entity =>
        {
            entity.ToTable("QueueEvents");
            entity.HasIndex(item => new { item.TenantId, item.QueueTicketId, item.EventAt });
            entity.HasOne<QueueTicket>()
                .WithMany()
                .HasForeignKey(item => item.QueueTicketId)
                .OnDelete(DeleteBehavior.Cascade);
        });
    }
}

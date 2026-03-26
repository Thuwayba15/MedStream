using Abp.Zero.EntityFrameworkCore;
using MedStream.Authorization.Roles;
using MedStream.Authorization.Users;
using MedStream.Facilities;
using MedStream.MultiTenancy;
using Microsoft.EntityFrameworkCore;

namespace MedStream.EntityFrameworkCore;

public class MedStreamDbContext : AbpZeroDbContext<Tenant, Role, User, MedStreamDbContext>
{
    /* Define a DbSet for each entity of the application */
    public DbSet<Facility> Facilities { get; set; }

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
    }
}

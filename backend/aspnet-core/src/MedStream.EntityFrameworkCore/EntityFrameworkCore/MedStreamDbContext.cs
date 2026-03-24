using Abp.Zero.EntityFrameworkCore;
using MedStream.Authorization.Roles;
using MedStream.Authorization.Users;
using MedStream.MultiTenancy;
using Microsoft.EntityFrameworkCore;

namespace MedStream.EntityFrameworkCore;

public class MedStreamDbContext : AbpZeroDbContext<Tenant, Role, User, MedStreamDbContext>
{
    /* Define a DbSet for each entity of the application */

    public MedStreamDbContext(DbContextOptions<MedStreamDbContext> options)
        : base(options)
    {
    }
}

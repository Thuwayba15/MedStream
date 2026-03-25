using Npgsql.EntityFrameworkCore.PostgreSQL;
using Microsoft.EntityFrameworkCore;
using System.Data.Common;

namespace MedStream.EntityFrameworkCore;

public static class MedStreamDbContextConfigurer
{
    public static void Configure(DbContextOptionsBuilder<MedStreamDbContext> builder, string connectionString)
    {
        builder.UseNpgsql(connectionString);
    }

    public static void Configure(DbContextOptionsBuilder<MedStreamDbContext> builder, DbConnection connection)
    {
        builder.UseNpgsql(connection);
    }
}

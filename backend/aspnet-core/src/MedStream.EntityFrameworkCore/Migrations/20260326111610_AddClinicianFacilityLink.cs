using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MedStream.Migrations
{
    /// <inheritdoc />
    public partial class AddClinicianFacilityLink : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "ClinicianFacilityId",
                table: "AbpUsers",
                type: "integer",
                nullable: true);

            migrationBuilder.Sql(@"
                UPDATE ""AbpUsers"" AS u
                SET ""ClinicianFacilityId"" = f.""Id""
                FROM ""Facilities"" AS f
                WHERE u.""RequestedFacility"" IS NOT NULL
                  AND u.""RequestedFacility"" = f.""Name""
                  AND COALESCE(u.""TenantId"", 1) = f.""TenantId"";
            ");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "ClinicianFacilityId",
                table: "AbpUsers");
        }
    }
}

using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace MedStream.Migrations
{
    /// <inheritdoc />
    public partial class AddPatientAccess : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "PatientAccessAudits",
                columns: table => new
                {
                    Id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    TenantId = table.Column<int>(type: "integer", nullable: false),
                    PatientUserId = table.Column<long>(type: "bigint", nullable: false),
                    ClinicianUserId = table.Column<long>(type: "bigint", nullable: false),
                    VisitId = table.Column<long>(type: "bigint", nullable: true),
                    FacilityId = table.Column<int>(type: "integer", nullable: true),
                    AccessType = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    AccessReason = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    Notes = table.Column<string>(type: "character varying(512)", maxLength: 512, nullable: true),
                    AccessedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    CreationTime = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    CreatorUserId = table.Column<long>(type: "bigint", nullable: true),
                    LastModificationTime = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    LastModifierUserId = table.Column<long>(type: "bigint", nullable: true),
                    IsDeleted = table.Column<bool>(type: "boolean", nullable: false),
                    DeleterUserId = table.Column<long>(type: "bigint", nullable: true),
                    DeletionTime = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PatientAccessAudits", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "PatientAccessGrants",
                columns: table => new
                {
                    Id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    TenantId = table.Column<int>(type: "integer", nullable: false),
                    PatientUserId = table.Column<long>(type: "bigint", nullable: false),
                    ClinicianUserId = table.Column<long>(type: "bigint", nullable: false),
                    VisitId = table.Column<long>(type: "bigint", nullable: true),
                    FacilityId = table.Column<int>(type: "integer", nullable: true),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false),
                    GrantedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    ExpiresAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    Reason = table.Column<string>(type: "character varying(512)", maxLength: 512, nullable: false),
                    CreationTime = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    CreatorUserId = table.Column<long>(type: "bigint", nullable: true),
                    LastModificationTime = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    LastModifierUserId = table.Column<long>(type: "bigint", nullable: true),
                    IsDeleted = table.Column<bool>(type: "boolean", nullable: false),
                    DeleterUserId = table.Column<long>(type: "bigint", nullable: true),
                    DeletionTime = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PatientAccessGrants", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_PatientAccessAudits_TenantId_ClinicianUserId_AccessedAt",
                table: "PatientAccessAudits",
                columns: new[] { "TenantId", "ClinicianUserId", "AccessedAt" });

            migrationBuilder.CreateIndex(
                name: "IX_PatientAccessAudits_TenantId_PatientUserId_AccessedAt",
                table: "PatientAccessAudits",
                columns: new[] { "TenantId", "PatientUserId", "AccessedAt" });

            migrationBuilder.CreateIndex(
                name: "IX_PatientAccessGrants_TenantId_ClinicianUserId_ExpiresAt",
                table: "PatientAccessGrants",
                columns: new[] { "TenantId", "ClinicianUserId", "ExpiresAt" });

            migrationBuilder.CreateIndex(
                name: "IX_PatientAccessGrants_TenantId_PatientUserId_ClinicianUserId_~",
                table: "PatientAccessGrants",
                columns: new[] { "TenantId", "PatientUserId", "ClinicianUserId", "IsActive" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "PatientAccessAudits");

            migrationBuilder.DropTable(
                name: "PatientAccessGrants");
        }
    }
}

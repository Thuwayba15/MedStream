using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using MedStream.EntityFrameworkCore;

#nullable disable

namespace MedStream.Migrations
{
    [DbContext(typeof(MedStreamDbContext))]
    [Migration("20260325200500_SyncUserRegistrationColumns")]
    public partial class SyncUserRegistrationColumns : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("ALTER TABLE \"AbpUsers\" ADD COLUMN IF NOT EXISTS \"RequestedRegistrationRole\" character varying(32);");
            migrationBuilder.Sql("ALTER TABLE \"AbpUsers\" ADD COLUMN IF NOT EXISTS \"IsClinicianApprovalPending\" boolean NOT NULL DEFAULT FALSE;");
            migrationBuilder.Sql("ALTER TABLE \"AbpUsers\" ADD COLUMN IF NOT EXISTS \"ClinicianApprovedAt\" timestamp with time zone;");
            migrationBuilder.Sql("ALTER TABLE \"AbpUsers\" ADD COLUMN IF NOT EXISTS \"ClinicianApprovedByUserId\" bigint;");

            migrationBuilder.Sql("ALTER TABLE \"AbpUsers\" ADD COLUMN IF NOT EXISTS \"AccountType\" character varying(32);");
            migrationBuilder.Sql("ALTER TABLE \"AbpUsers\" ADD COLUMN IF NOT EXISTS \"ProfessionType\" character varying(32);");
            migrationBuilder.Sql("ALTER TABLE \"AbpUsers\" ADD COLUMN IF NOT EXISTS \"RegulatoryBody\" character varying(32);");
            migrationBuilder.Sql("ALTER TABLE \"AbpUsers\" ADD COLUMN IF NOT EXISTS \"RegistrationNumber\" character varying(64);");
            migrationBuilder.Sql("ALTER TABLE \"AbpUsers\" ADD COLUMN IF NOT EXISTS \"RequestedFacility\" character varying(128);");
            migrationBuilder.Sql("ALTER TABLE \"AbpUsers\" ADD COLUMN IF NOT EXISTS \"ApprovalStatus\" character varying(32);");
            migrationBuilder.Sql("ALTER TABLE \"AbpUsers\" ADD COLUMN IF NOT EXISTS \"IdNumber\" character varying(32);");
            migrationBuilder.Sql("ALTER TABLE \"AbpUsers\" ADD COLUMN IF NOT EXISTS \"DateOfBirth\" timestamp with time zone;");
            migrationBuilder.Sql("ALTER TABLE \"AbpUsers\" ADD COLUMN IF NOT EXISTS \"ClinicianSubmittedAt\" timestamp with time zone;");
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("ALTER TABLE \"AbpUsers\" DROP COLUMN IF EXISTS \"ClinicianSubmittedAt\";");
            migrationBuilder.Sql("ALTER TABLE \"AbpUsers\" DROP COLUMN IF EXISTS \"DateOfBirth\";");
            migrationBuilder.Sql("ALTER TABLE \"AbpUsers\" DROP COLUMN IF EXISTS \"IdNumber\";");
            migrationBuilder.Sql("ALTER TABLE \"AbpUsers\" DROP COLUMN IF EXISTS \"ApprovalStatus\";");
            migrationBuilder.Sql("ALTER TABLE \"AbpUsers\" DROP COLUMN IF EXISTS \"RequestedFacility\";");
            migrationBuilder.Sql("ALTER TABLE \"AbpUsers\" DROP COLUMN IF EXISTS \"RegistrationNumber\";");
            migrationBuilder.Sql("ALTER TABLE \"AbpUsers\" DROP COLUMN IF EXISTS \"RegulatoryBody\";");
            migrationBuilder.Sql("ALTER TABLE \"AbpUsers\" DROP COLUMN IF EXISTS \"ProfessionType\";");
            migrationBuilder.Sql("ALTER TABLE \"AbpUsers\" DROP COLUMN IF EXISTS \"AccountType\";");

            migrationBuilder.Sql("ALTER TABLE \"AbpUsers\" DROP COLUMN IF EXISTS \"ClinicianApprovedByUserId\";");
            migrationBuilder.Sql("ALTER TABLE \"AbpUsers\" DROP COLUMN IF EXISTS \"ClinicianApprovedAt\";");
            migrationBuilder.Sql("ALTER TABLE \"AbpUsers\" DROP COLUMN IF EXISTS \"IsClinicianApprovalPending\";");
            migrationBuilder.Sql("ALTER TABLE \"AbpUsers\" DROP COLUMN IF EXISTS \"RequestedRegistrationRole\";");
        }
    }
}

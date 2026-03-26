using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MedStream.Migrations
{
    public partial class AddUserRegistrationApprovalFields : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(
                name: "ClinicianApprovedAt",
                table: "AbpUsers",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<long>(
                name: "ClinicianApprovedByUserId",
                table: "AbpUsers",
                type: "bigint",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "IsClinicianApprovalPending",
                table: "AbpUsers",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<string>(
                name: "RequestedRegistrationRole",
                table: "AbpUsers",
                type: "character varying(32)",
                maxLength: 32,
                nullable: true);
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "ClinicianApprovedAt",
                table: "AbpUsers");

            migrationBuilder.DropColumn(
                name: "ClinicianApprovedByUserId",
                table: "AbpUsers");

            migrationBuilder.DropColumn(
                name: "IsClinicianApprovalPending",
                table: "AbpUsers");

            migrationBuilder.DropColumn(
                name: "RequestedRegistrationRole",
                table: "AbpUsers");
        }
    }
}

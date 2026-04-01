using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MedStream.Migrations
{
    /// <inheritdoc />
    public partial class AddSummary : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "ClinicianTimelineSummary",
                table: "EncounterNotes",
                type: "character varying(2000)",
                maxLength: 2000,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "PatientTimelineSummary",
                table: "EncounterNotes",
                type: "character varying(2000)",
                maxLength: 2000,
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "ClinicianTimelineSummary",
                table: "EncounterNotes");

            migrationBuilder.DropColumn(
                name: "PatientTimelineSummary",
                table: "EncounterNotes");
        }
    }
}

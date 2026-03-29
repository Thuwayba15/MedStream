using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MedStream.Migrations
{
    /// <inheritdoc />
    public partial class AddSubjectiveSummaryToSymptomIntake : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "FollowUpAnswersJson",
                table: "SymptomIntakes",
                type: "character varying(8000)",
                maxLength: 8000,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "SubjectiveSummary",
                table: "SymptomIntakes",
                type: "character varying(4000)",
                maxLength: 4000,
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "FollowUpAnswersJson",
                table: "SymptomIntakes");

            migrationBuilder.DropColumn(
                name: "SubjectiveSummary",
                table: "SymptomIntakes");
        }
    }
}

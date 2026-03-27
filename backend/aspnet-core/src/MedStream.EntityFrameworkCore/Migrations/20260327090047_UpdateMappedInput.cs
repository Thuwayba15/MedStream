using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MedStream.Migrations
{
    /// <inheritdoc />
    public partial class UpdateMappedInput : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "MappedInputValues",
                table: "SymptomIntakes",
                type: "character varying(4000)",
                maxLength: 4000,
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "MappedInputValues",
                table: "SymptomIntakes");
        }
    }
}

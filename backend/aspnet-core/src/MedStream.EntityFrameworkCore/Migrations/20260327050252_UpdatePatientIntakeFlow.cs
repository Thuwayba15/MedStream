using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace MedStream.Migrations
{
    /// <inheritdoc />
    public partial class UpdatePatientIntakeFlow : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Visits",
                columns: table => new
                {
                    Id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    TenantId = table.Column<int>(type: "integer", nullable: false),
                    PatientUserId = table.Column<long>(type: "bigint", nullable: false),
                    FacilityId = table.Column<int>(type: "integer", nullable: true),
                    VisitDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    Status = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    PathwayKey = table.Column<string>(type: "character varying(128)", maxLength: 128, nullable: false),
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
                    table.PrimaryKey("PK_Visits", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "SymptomIntakes",
                columns: table => new
                {
                    Id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    TenantId = table.Column<int>(type: "integer", nullable: false),
                    VisitId = table.Column<long>(type: "bigint", nullable: false),
                    FreeTextComplaint = table.Column<string>(type: "character varying(4000)", maxLength: 4000, nullable: false),
                    SelectedSymptoms = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: true),
                    ExtractedPrimarySymptoms = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: true),
                    ExtractionSource = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: true),
                    SubmittedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
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
                    table.PrimaryKey("PK_SymptomIntakes", x => x.Id);
                    table.ForeignKey(
                        name: "FK_SymptomIntakes_Visits_VisitId",
                        column: x => x.VisitId,
                        principalTable: "Visits",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "TriageAssessments",
                columns: table => new
                {
                    Id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    TenantId = table.Column<int>(type: "integer", nullable: false),
                    VisitId = table.Column<long>(type: "bigint", nullable: false),
                    UrgencyLevel = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: false),
                    PriorityScore = table.Column<decimal>(type: "numeric(5,2)", precision: 5, scale: 2, nullable: false),
                    Explanation = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: false),
                    RedFlagsDetected = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: true),
                    PositionPending = table.Column<bool>(type: "boolean", nullable: false),
                    QueueMessage = table.Column<string>(type: "character varying(512)", maxLength: 512, nullable: false),
                    LastQueueUpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    AssessedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
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
                    table.PrimaryKey("PK_TriageAssessments", x => x.Id);
                    table.ForeignKey(
                        name: "FK_TriageAssessments_Visits_VisitId",
                        column: x => x.VisitId,
                        principalTable: "Visits",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_SymptomIntakes_TenantId_VisitId_SubmittedAt",
                table: "SymptomIntakes",
                columns: new[] { "TenantId", "VisitId", "SubmittedAt" });

            migrationBuilder.CreateIndex(
                name: "IX_SymptomIntakes_VisitId",
                table: "SymptomIntakes",
                column: "VisitId");

            migrationBuilder.CreateIndex(
                name: "IX_TriageAssessments_TenantId_VisitId_AssessedAt",
                table: "TriageAssessments",
                columns: new[] { "TenantId", "VisitId", "AssessedAt" });

            migrationBuilder.CreateIndex(
                name: "IX_TriageAssessments_VisitId",
                table: "TriageAssessments",
                column: "VisitId");

            migrationBuilder.CreateIndex(
                name: "IX_Visits_TenantId_PatientUserId_CreationTime",
                table: "Visits",
                columns: new[] { "TenantId", "PatientUserId", "CreationTime" });

            migrationBuilder.CreateIndex(
                name: "IX_Visits_TenantId_Status",
                table: "Visits",
                columns: new[] { "TenantId", "Status" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "SymptomIntakes");

            migrationBuilder.DropTable(
                name: "TriageAssessments");

            migrationBuilder.DropTable(
                name: "Visits");
        }
    }
}

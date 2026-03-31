using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace MedStream.Migrations
{
    /// <inheritdoc />
    public partial class AddConsultationDomain : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<long>(
                name: "AssignedClinicianUserId",
                table: "Visits",
                type: "bigint",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "EncounterNotes",
                columns: table => new
                {
                    Id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    TenantId = table.Column<int>(type: "integer", nullable: false),
                    VisitId = table.Column<long>(type: "bigint", nullable: false),
                    CreatedByClinicianUserId = table.Column<long>(type: "bigint", nullable: false),
                    IntakeSubjective = table.Column<string>(type: "character varying(8000)", maxLength: 8000, nullable: true),
                    Subjective = table.Column<string>(type: "character varying(8000)", maxLength: 8000, nullable: true),
                    Objective = table.Column<string>(type: "character varying(8000)", maxLength: 8000, nullable: true),
                    Assessment = table.Column<string>(type: "character varying(8000)", maxLength: 8000, nullable: true),
                    Plan = table.Column<string>(type: "character varying(8000)", maxLength: 8000, nullable: true),
                    Status = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: false),
                    FinalizedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
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
                    table.PrimaryKey("PK_EncounterNotes", x => x.Id);
                    table.ForeignKey(
                        name: "FK_EncounterNotes_Visits_VisitId",
                        column: x => x.VisitId,
                        principalTable: "Visits",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "VitalSigns",
                columns: table => new
                {
                    Id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    TenantId = table.Column<int>(type: "integer", nullable: false),
                    VisitId = table.Column<long>(type: "bigint", nullable: false),
                    RecordedByClinicianUserId = table.Column<long>(type: "bigint", nullable: false),
                    Phase = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: false),
                    IsLatest = table.Column<bool>(type: "boolean", nullable: false),
                    BloodPressureSystolic = table.Column<int>(type: "integer", nullable: true),
                    BloodPressureDiastolic = table.Column<int>(type: "integer", nullable: true),
                    HeartRate = table.Column<int>(type: "integer", nullable: true),
                    RespiratoryRate = table.Column<int>(type: "integer", nullable: true),
                    TemperatureCelsius = table.Column<decimal>(type: "numeric(4,1)", precision: 4, scale: 1, nullable: true),
                    OxygenSaturation = table.Column<int>(type: "integer", nullable: true),
                    BloodGlucose = table.Column<decimal>(type: "numeric(6,2)", precision: 6, scale: 2, nullable: true),
                    WeightKg = table.Column<decimal>(type: "numeric(6,2)", precision: 6, scale: 2, nullable: true),
                    RecordedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
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
                    table.PrimaryKey("PK_VitalSigns", x => x.Id);
                    table.ForeignKey(
                        name: "FK_VitalSigns_Visits_VisitId",
                        column: x => x.VisitId,
                        principalTable: "Visits",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "ConsultationTranscripts",
                columns: table => new
                {
                    Id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    TenantId = table.Column<int>(type: "integer", nullable: false),
                    EncounterNoteId = table.Column<long>(type: "bigint", nullable: false),
                    CapturedByClinicianUserId = table.Column<long>(type: "bigint", nullable: false),
                    InputMode = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: false),
                    RawTranscriptText = table.Column<string>(type: "character varying(32000)", maxLength: 32000, nullable: true),
                    TranslatedTranscriptText = table.Column<string>(type: "character varying(32000)", maxLength: 32000, nullable: true),
                    LanguageDetected = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: true),
                    CapturedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
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
                    table.PrimaryKey("PK_ConsultationTranscripts", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ConsultationTranscripts_EncounterNotes_EncounterNoteId",
                        column: x => x.EncounterNoteId,
                        principalTable: "EncounterNotes",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Visits_TenantId_AssignedClinicianUserId_Status",
                table: "Visits",
                columns: new[] { "TenantId", "AssignedClinicianUserId", "Status" });

            migrationBuilder.CreateIndex(
                name: "IX_ConsultationTranscripts_EncounterNoteId",
                table: "ConsultationTranscripts",
                column: "EncounterNoteId");

            migrationBuilder.CreateIndex(
                name: "IX_ConsultationTranscripts_TenantId_CapturedByClinicianUserId_~",
                table: "ConsultationTranscripts",
                columns: new[] { "TenantId", "CapturedByClinicianUserId", "CapturedAt" });

            migrationBuilder.CreateIndex(
                name: "IX_ConsultationTranscripts_TenantId_EncounterNoteId_CapturedAt",
                table: "ConsultationTranscripts",
                columns: new[] { "TenantId", "EncounterNoteId", "CapturedAt" });

            migrationBuilder.CreateIndex(
                name: "IX_EncounterNotes_TenantId_CreatedByClinicianUserId_Status",
                table: "EncounterNotes",
                columns: new[] { "TenantId", "CreatedByClinicianUserId", "Status" });

            migrationBuilder.CreateIndex(
                name: "IX_EncounterNotes_TenantId_VisitId",
                table: "EncounterNotes",
                columns: new[] { "TenantId", "VisitId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_EncounterNotes_VisitId",
                table: "EncounterNotes",
                column: "VisitId");

            migrationBuilder.CreateIndex(
                name: "IX_VitalSigns_TenantId_VisitId_IsLatest",
                table: "VitalSigns",
                columns: new[] { "TenantId", "VisitId", "IsLatest" },
                unique: true,
                filter: "\"IsDeleted\" = false AND \"IsLatest\" = true");

            migrationBuilder.CreateIndex(
                name: "IX_VitalSigns_TenantId_VisitId_RecordedAt",
                table: "VitalSigns",
                columns: new[] { "TenantId", "VisitId", "RecordedAt" });

            migrationBuilder.CreateIndex(
                name: "IX_VitalSigns_VisitId",
                table: "VitalSigns",
                column: "VisitId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "ConsultationTranscripts");

            migrationBuilder.DropTable(
                name: "VitalSigns");

            migrationBuilder.DropTable(
                name: "EncounterNotes");

            migrationBuilder.DropIndex(
                name: "IX_Visits_TenantId_AssignedClinicianUserId_Status",
                table: "Visits");

            migrationBuilder.DropColumn(
                name: "AssignedClinicianUserId",
                table: "Visits");
        }
    }
}

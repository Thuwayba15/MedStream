using System;
using MedStream.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Migrations;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace MedStream.Migrations
{
    /// <inheritdoc />
    [DbContext(typeof(MedStreamDbContext))]
    [Migration("20260330103000_AddQueueOperationsCore")]
    public partial class AddQueueOperationsCore : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "QueueTickets",
                columns: table => new
                {
                    Id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    TenantId = table.Column<int>(type: "integer", nullable: false),
                    FacilityId = table.Column<int>(type: "integer", nullable: false),
                    VisitId = table.Column<long>(type: "bigint", nullable: false),
                    TriageAssessmentId = table.Column<long>(type: "bigint", nullable: false),
                    QueueDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    QueueNumber = table.Column<int>(type: "integer", nullable: false),
                    QueueStatus = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: false),
                    CurrentStage = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false),
                    EnteredQueueAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    CalledAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    ConsultationStartedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    ConsultationStartedByClinicianUserId = table.Column<long>(type: "bigint", nullable: true),
                    CompletedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    CancelledAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    AssignedRoom = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: true),
                    CurrentClinicianUserId = table.Column<long>(type: "bigint", nullable: true),
                    LastStatusChangedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
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
                    table.PrimaryKey("PK_QueueTickets", x => x.Id);
                    table.ForeignKey(
                        name: "FK_QueueTickets_TriageAssessments_TriageAssessmentId",
                        column: x => x.TriageAssessmentId,
                        principalTable: "TriageAssessments",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_QueueTickets_Visits_VisitId",
                        column: x => x.VisitId,
                        principalTable: "Visits",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "QueueEvents",
                columns: table => new
                {
                    Id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    TenantId = table.Column<int>(type: "integer", nullable: false),
                    QueueTicketId = table.Column<long>(type: "bigint", nullable: false),
                    EventType = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    OldStatus = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: true),
                    NewStatus = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: true),
                    ChangedByClinicianUserId = table.Column<long>(type: "bigint", nullable: true),
                    Notes = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: true),
                    EventAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
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
                    table.PrimaryKey("PK_QueueEvents", x => x.Id);
                    table.ForeignKey(
                        name: "FK_QueueEvents_QueueTickets_QueueTicketId",
                        column: x => x.QueueTicketId,
                        principalTable: "QueueTickets",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_QueueEvents_QueueTicketId",
                table: "QueueEvents",
                column: "QueueTicketId");

            migrationBuilder.CreateIndex(
                name: "IX_QueueEvents_TenantId_QueueTicketId_EventAt",
                table: "QueueEvents",
                columns: new[] { "TenantId", "QueueTicketId", "EventAt" });

            migrationBuilder.CreateIndex(
                name: "IX_QueueTickets_TriageAssessmentId",
                table: "QueueTickets",
                column: "TriageAssessmentId");

            migrationBuilder.CreateIndex(
                name: "IX_QueueTickets_VisitId",
                table: "QueueTickets",
                column: "VisitId");

            migrationBuilder.CreateIndex(
                name: "IX_QueueTickets_TenantId_FacilityId_QueueDate_QueueNumber",
                table: "QueueTickets",
                columns: new[] { "TenantId", "FacilityId", "QueueDate", "QueueNumber" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_QueueTickets_TenantId_FacilityId_QueueStatus_EnteredQueueAt",
                table: "QueueTickets",
                columns: new[] { "TenantId", "FacilityId", "QueueStatus", "EnteredQueueAt" });

            migrationBuilder.CreateIndex(
                name: "IX_QueueTickets_TenantId_VisitId_IsActive",
                table: "QueueTickets",
                columns: new[] { "TenantId", "VisitId", "IsActive" },
                unique: true,
                filter: "\"IsDeleted\" = false AND \"IsActive\" = true");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "QueueEvents");

            migrationBuilder.DropTable(
                name: "QueueTickets");
        }
    }
}

using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace InvoiceManagement.Server.Migrations
{
    /// <inheritdoc />
    public partial class UpdateDocumentAttachmentRelationships : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "DocumentMetadatas");

            migrationBuilder.DropTable(
                name: "DocumentStorages");

            migrationBuilder.DropTable(
                name: "DocumentVersions");

            migrationBuilder.AddColumn<string>(
                name: "ChangeDescription",
                table: "DocumentAttachments",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "InvoiceId1",
                table: "DocumentAttachments",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "IsCurrentVersion",
                table: "DocumentAttachments",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<int>(
                name: "VersionNumber",
                table: "DocumentAttachments",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.CreateIndex(
                name: "IX_DocumentAttachments_InvoiceId1",
                table: "DocumentAttachments",
                column: "InvoiceId1");

            migrationBuilder.AddForeignKey(
                name: "FK_DocumentAttachments_Invoices_InvoiceId1",
                table: "DocumentAttachments",
                column: "InvoiceId1",
                principalTable: "Invoices",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_DocumentAttachments_Invoices_InvoiceId1",
                table: "DocumentAttachments");

            migrationBuilder.DropIndex(
                name: "IX_DocumentAttachments_InvoiceId1",
                table: "DocumentAttachments");

            migrationBuilder.DropColumn(
                name: "ChangeDescription",
                table: "DocumentAttachments");

            migrationBuilder.DropColumn(
                name: "InvoiceId1",
                table: "DocumentAttachments");

            migrationBuilder.DropColumn(
                name: "IsCurrentVersion",
                table: "DocumentAttachments");

            migrationBuilder.DropColumn(
                name: "VersionNumber",
                table: "DocumentAttachments");

            migrationBuilder.CreateTable(
                name: "DocumentMetadatas",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    DocumentAttachmentId = table.Column<int>(type: "int", nullable: false),
                    Categories = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    ComplianceTags = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    ConfidenceScore = table.Column<decimal>(type: "decimal(18,2)", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    CreatedBy = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    CustomFields = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    DocumentQuality = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    DocumentType = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    ExtractedText = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    IsConfidential = table.Column<bool>(type: "bit", nullable: false),
                    IsIndexed = table.Column<bool>(type: "bit", nullable: false),
                    Keywords = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Language = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    LastIndexed = table.Column<DateTime>(type: "datetime2", nullable: true),
                    LastModified = table.Column<DateTime>(type: "datetime2", nullable: true),
                    LegalHoldUntil = table.Column<DateTime>(type: "datetime2", nullable: true),
                    ModificationReason = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    ModifiedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    ModifiedBy = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    OcrConfidence = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    PageCount = table.Column<int>(type: "int", nullable: true),
                    ProcessedBy = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    ProcessingDate = table.Column<DateTime>(type: "datetime2", nullable: true),
                    ProcessingErrors = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    ProcessingStatus = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    RetentionPolicy = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    SearchVector = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Sentiment = table.Column<string>(type: "nvarchar(max)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_DocumentMetadatas", x => x.Id);
                    table.ForeignKey(
                        name: "FK_DocumentMetadatas_DocumentAttachments_DocumentAttachmentId",
                        column: x => x.DocumentAttachmentId,
                        principalTable: "DocumentAttachments",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "DocumentStorages",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    AccessControlList = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    AllowedFileTypes = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    ArchivePath = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    AutoDelete = table.Column<bool>(type: "bit", nullable: false),
                    CacheExpirationMinutes = table.Column<int>(type: "int", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    CreatedBy = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Description = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    EnableAuditLogging = table.Column<bool>(type: "bit", nullable: false),
                    EnableCaching = table.Column<bool>(type: "bit", nullable: false),
                    EnableCompression = table.Column<bool>(type: "bit", nullable: false),
                    EnableEncryption = table.Column<bool>(type: "bit", nullable: false),
                    IsActive = table.Column<bool>(type: "bit", nullable: false),
                    LastModified = table.Column<DateTime>(type: "datetime2", nullable: true),
                    MaxConcurrentUploads = table.Column<int>(type: "int", nullable: false),
                    MaxFileSize = table.Column<long>(type: "bigint", nullable: false),
                    ModifiedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    ModifiedBy = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    RequireAuthentication = table.Column<bool>(type: "bit", nullable: false),
                    RetentionDays = table.Column<int>(type: "int", nullable: false),
                    StorageName = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    StoragePath = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    StorageType = table.Column<string>(type: "nvarchar(max)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_DocumentStorages", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "DocumentVersions",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    DocumentAttachmentId = table.Column<int>(type: "int", nullable: false),
                    ApprovalComments = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    ApprovalDate = table.Column<DateTime>(type: "datetime2", nullable: true),
                    ApprovedBy = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    ChangeDescription = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    ChangeReason = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    ChangedBy = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Comments = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    CreatedBy = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    DocumentAttachmentId1 = table.Column<int>(type: "int", nullable: true),
                    FileHash = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    FileName = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    FilePath = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    FileSize = table.Column<long>(type: "bigint", nullable: false),
                    IsActive = table.Column<bool>(type: "bit", nullable: false),
                    IsApproved = table.Column<bool>(type: "bit", nullable: false),
                    ModifiedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    ModifiedBy = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    RequiresApproval = table.Column<bool>(type: "bit", nullable: false),
                    Tags = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    VersionDate = table.Column<DateTime>(type: "datetime2", nullable: false),
                    VersionLabel = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    VersionNumber = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_DocumentVersions", x => x.Id);
                    table.ForeignKey(
                        name: "FK_DocumentVersions_DocumentAttachments_DocumentAttachmentId",
                        column: x => x.DocumentAttachmentId,
                        principalTable: "DocumentAttachments",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_DocumentVersions_DocumentAttachments_DocumentAttachmentId1",
                        column: x => x.DocumentAttachmentId1,
                        principalTable: "DocumentAttachments",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateIndex(
                name: "IX_DocumentMetadatas_DocumentAttachmentId",
                table: "DocumentMetadatas",
                column: "DocumentAttachmentId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_DocumentVersions_DocumentAttachmentId",
                table: "DocumentVersions",
                column: "DocumentAttachmentId");

            migrationBuilder.CreateIndex(
                name: "IX_DocumentVersions_DocumentAttachmentId1",
                table: "DocumentVersions",
                column: "DocumentAttachmentId1",
                unique: true,
                filter: "[DocumentAttachmentId1] IS NOT NULL");
        }
    }
}

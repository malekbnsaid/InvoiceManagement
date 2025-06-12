using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace InvoiceManagement.Server.Migrations
{
    /// <inheritdoc />
    public partial class AddProjectDeletionFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "DeletionApprovedBy",
                table: "Projects",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "DeletionApprovedDate",
                table: "Projects",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "DeletionRejectionReason",
                table: "Projects",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "DeletionRequestDate",
                table: "Projects",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "DeletionRequestedBy",
                table: "Projects",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "IsDeletionApproved",
                table: "Projects",
                type: "bit",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "IsPendingDeletion",
                table: "Projects",
                type: "bit",
                nullable: false,
                defaultValue: false);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "DeletionApprovedBy",
                table: "Projects");

            migrationBuilder.DropColumn(
                name: "DeletionApprovedDate",
                table: "Projects");

            migrationBuilder.DropColumn(
                name: "DeletionRejectionReason",
                table: "Projects");

            migrationBuilder.DropColumn(
                name: "DeletionRequestDate",
                table: "Projects");

            migrationBuilder.DropColumn(
                name: "DeletionRequestedBy",
                table: "Projects");

            migrationBuilder.DropColumn(
                name: "IsDeletionApproved",
                table: "Projects");

            migrationBuilder.DropColumn(
                name: "IsPendingDeletion",
                table: "Projects");
        }
    }
}

using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace InvoiceManagement.Server.Migrations
{
    /// <inheritdoc />
    public partial class UpdateEntitiesWithRequirements : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Abbreviation",
                table: "Sections",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<int>(
                name: "CompletionPercentage",
                table: "Projects",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "PONumber",
                table: "Projects",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "PaymentPlan",
                table: "Projects",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<DateTime>(
                name: "PurchaseDate",
                table: "Projects",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "HasActuals",
                table: "LPOs",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<string>(
                name: "PredictionData",
                table: "LPOs",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<decimal>(
                name: "RemainingAmount",
                table: "LPOs",
                type: "decimal(18,2)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Status",
                table: "LPOs",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "ReceivedByITBy",
                table: "Invoices",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<DateTime>(
                name: "ReceivedByITDate",
                table: "Invoices",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ReceivedByProcurementBy",
                table: "Invoices",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<DateTime>(
                name: "ReceivedByProcurementDate",
                table: "Invoices",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "SentToProcurementBy",
                table: "Invoices",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<DateTime>(
                name: "SentToProcurementDate",
                table: "Invoices",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ZajelNumber",
                table: "Invoices",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Abbreviation",
                table: "Sections");

            migrationBuilder.DropColumn(
                name: "CompletionPercentage",
                table: "Projects");

            migrationBuilder.DropColumn(
                name: "PONumber",
                table: "Projects");

            migrationBuilder.DropColumn(
                name: "PaymentPlan",
                table: "Projects");

            migrationBuilder.DropColumn(
                name: "PurchaseDate",
                table: "Projects");

            migrationBuilder.DropColumn(
                name: "HasActuals",
                table: "LPOs");

            migrationBuilder.DropColumn(
                name: "PredictionData",
                table: "LPOs");

            migrationBuilder.DropColumn(
                name: "RemainingAmount",
                table: "LPOs");

            migrationBuilder.DropColumn(
                name: "Status",
                table: "LPOs");

            migrationBuilder.DropColumn(
                name: "ReceivedByITBy",
                table: "Invoices");

            migrationBuilder.DropColumn(
                name: "ReceivedByITDate",
                table: "Invoices");

            migrationBuilder.DropColumn(
                name: "ReceivedByProcurementBy",
                table: "Invoices");

            migrationBuilder.DropColumn(
                name: "ReceivedByProcurementDate",
                table: "Invoices");

            migrationBuilder.DropColumn(
                name: "SentToProcurementBy",
                table: "Invoices");

            migrationBuilder.DropColumn(
                name: "SentToProcurementDate",
                table: "Invoices");

            migrationBuilder.DropColumn(
                name: "ZajelNumber",
                table: "Invoices");
        }
    }
}

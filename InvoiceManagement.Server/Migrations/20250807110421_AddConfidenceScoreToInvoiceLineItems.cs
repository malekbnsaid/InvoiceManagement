using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace InvoiceManagement.Server.Migrations
{
    /// <inheritdoc />
    public partial class AddConfidenceScoreToInvoiceLineItems : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<double>(
                name: "ConfidenceScore",
                table: "InvoiceLineItems",
                type: "float",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "ConfidenceScore",
                table: "InvoiceLineItems");
        }
    }
}

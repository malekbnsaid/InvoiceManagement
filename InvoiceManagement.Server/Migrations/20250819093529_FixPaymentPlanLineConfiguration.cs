using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace InvoiceManagement.Server.Migrations
{
    /// <inheritdoc />
    public partial class FixPaymentPlanLineConfiguration : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_PaymentPlanLine_Projects_ProjectId",
                table: "PaymentPlanLine");

            migrationBuilder.DropPrimaryKey(
                name: "PK_PaymentPlanLine",
                table: "PaymentPlanLine");

            migrationBuilder.RenameTable(
                name: "PaymentPlanLine",
                newName: "PaymentPlanLines");

            migrationBuilder.RenameIndex(
                name: "IX_PaymentPlanLine_ProjectId",
                table: "PaymentPlanLines",
                newName: "IX_PaymentPlanLines_ProjectId");

            migrationBuilder.AddPrimaryKey(
                name: "PK_PaymentPlanLines",
                table: "PaymentPlanLines",
                column: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_PaymentPlanLines_Projects_ProjectId",
                table: "PaymentPlanLines",
                column: "ProjectId",
                principalTable: "Projects",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_PaymentPlanLines_Projects_ProjectId",
                table: "PaymentPlanLines");

            migrationBuilder.DropPrimaryKey(
                name: "PK_PaymentPlanLines",
                table: "PaymentPlanLines");

            migrationBuilder.RenameTable(
                name: "PaymentPlanLines",
                newName: "PaymentPlanLine");

            migrationBuilder.RenameIndex(
                name: "IX_PaymentPlanLines_ProjectId",
                table: "PaymentPlanLine",
                newName: "IX_PaymentPlanLine_ProjectId");

            migrationBuilder.AddPrimaryKey(
                name: "PK_PaymentPlanLine",
                table: "PaymentPlanLine",
                column: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_PaymentPlanLine_Projects_ProjectId",
                table: "PaymentPlanLine",
                column: "ProjectId",
                principalTable: "Projects",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }
    }
}

using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace InvoiceManagement.Server.Migrations
{
    /// <inheritdoc />
    public partial class UpdateEntityRelationships : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "ERPEmployeeId",
                table: "Projects",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "ERPEmployeeId1",
                table: "Notifications",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "AppUserUser_Seq",
                table: "ERPEmployees",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "ProjectId1",
                table: "DocumentAttachments",
                type: "int",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Projects_ERPEmployeeId",
                table: "Projects",
                column: "ERPEmployeeId");

            migrationBuilder.CreateIndex(
                name: "IX_Notifications_ERPEmployeeId1",
                table: "Notifications",
                column: "ERPEmployeeId1");

            migrationBuilder.CreateIndex(
                name: "IX_ERPEmployees_AppUserUser_Seq",
                table: "ERPEmployees",
                column: "AppUserUser_Seq");

            migrationBuilder.CreateIndex(
                name: "IX_DocumentAttachments_ProjectId1",
                table: "DocumentAttachments",
                column: "ProjectId1");

            migrationBuilder.AddForeignKey(
                name: "FK_DocumentAttachments_Projects_ProjectId1",
                table: "DocumentAttachments",
                column: "ProjectId1",
                principalTable: "Projects",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_ERPEmployees_AppUsers_AppUserUser_Seq",
                table: "ERPEmployees",
                column: "AppUserUser_Seq",
                principalTable: "AppUsers",
                principalColumn: "User_Seq");

            migrationBuilder.AddForeignKey(
                name: "FK_Notifications_ERPEmployees_ERPEmployeeId1",
                table: "Notifications",
                column: "ERPEmployeeId1",
                principalTable: "ERPEmployees",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_Projects_ERPEmployees_ERPEmployeeId",
                table: "Projects",
                column: "ERPEmployeeId",
                principalTable: "ERPEmployees",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_DocumentAttachments_Projects_ProjectId1",
                table: "DocumentAttachments");

            migrationBuilder.DropForeignKey(
                name: "FK_ERPEmployees_AppUsers_AppUserUser_Seq",
                table: "ERPEmployees");

            migrationBuilder.DropForeignKey(
                name: "FK_Notifications_ERPEmployees_ERPEmployeeId1",
                table: "Notifications");

            migrationBuilder.DropForeignKey(
                name: "FK_Projects_ERPEmployees_ERPEmployeeId",
                table: "Projects");

            migrationBuilder.DropIndex(
                name: "IX_Projects_ERPEmployeeId",
                table: "Projects");

            migrationBuilder.DropIndex(
                name: "IX_Notifications_ERPEmployeeId1",
                table: "Notifications");

            migrationBuilder.DropIndex(
                name: "IX_ERPEmployees_AppUserUser_Seq",
                table: "ERPEmployees");

            migrationBuilder.DropIndex(
                name: "IX_DocumentAttachments_ProjectId1",
                table: "DocumentAttachments");

            migrationBuilder.DropColumn(
                name: "ERPEmployeeId",
                table: "Projects");

            migrationBuilder.DropColumn(
                name: "ERPEmployeeId1",
                table: "Notifications");

            migrationBuilder.DropColumn(
                name: "AppUserUser_Seq",
                table: "ERPEmployees");

            migrationBuilder.DropColumn(
                name: "ProjectId1",
                table: "DocumentAttachments");
        }
    }
}

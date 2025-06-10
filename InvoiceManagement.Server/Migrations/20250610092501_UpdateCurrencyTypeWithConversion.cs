using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace InvoiceManagement.Server.Migrations
{
    /// <inheritdoc />
    public partial class UpdateCurrencyTypeWithConversion : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Add a temporary column for the new int values
            migrationBuilder.AddColumn<int>(
                name: "CurrencyNew",
                table: "PaymentPlanLine",
                type: "int",
                nullable: false,
                defaultValue: 4); // Default to SAR (4)

            migrationBuilder.AddColumn<int>(
                name: "CurrencyNew",
                table: "LPOs",
                type: "int",
                nullable: false,
                defaultValue: 4); // Default to SAR (4)

            migrationBuilder.AddColumn<int>(
                name: "CurrencyNew",
                table: "Invoices",
                type: "int",
                nullable: false,
                defaultValue: 4); // Default to SAR (4)

            // Update the new column based on the old string values
            migrationBuilder.Sql(@"
                UPDATE PaymentPlanLine SET CurrencyNew = 
                    CASE Currency 
                        WHEN 'USD' THEN 0 
                        WHEN 'EUR' THEN 1
                        WHEN 'GBP' THEN 2
                        WHEN 'AED' THEN 3
                        WHEN 'SAR' THEN 4
                        WHEN 'KWD' THEN 5
                        WHEN 'BHD' THEN 6
                        WHEN 'OMR' THEN 7
                        WHEN 'QAR' THEN 8
                        ELSE 4 -- Default to SAR
                    END");

            migrationBuilder.Sql(@"
                UPDATE LPOs SET CurrencyNew = 
                    CASE Currency 
                        WHEN 'USD' THEN 0 
                        WHEN 'EUR' THEN 1
                        WHEN 'GBP' THEN 2
                        WHEN 'AED' THEN 3
                        WHEN 'SAR' THEN 4
                        WHEN 'KWD' THEN 5
                        WHEN 'BHD' THEN 6
                        WHEN 'OMR' THEN 7
                        WHEN 'QAR' THEN 8
                        ELSE 4 -- Default to SAR
                    END");

            migrationBuilder.Sql(@"
                UPDATE Invoices SET CurrencyNew = 
                    CASE Currency 
                        WHEN 'USD' THEN 0 
                        WHEN 'EUR' THEN 1
                        WHEN 'GBP' THEN 2
                        WHEN 'AED' THEN 3
                        WHEN 'SAR' THEN 4
                        WHEN 'KWD' THEN 5
                        WHEN 'BHD' THEN 6
                        WHEN 'OMR' THEN 7
                        WHEN 'QAR' THEN 8
                        ELSE 4 -- Default to SAR
                    END");

            // Drop the old column
            migrationBuilder.DropColumn(
                name: "Currency",
                table: "PaymentPlanLine");

            migrationBuilder.DropColumn(
                name: "Currency",
                table: "LPOs");

            migrationBuilder.DropColumn(
                name: "Currency",
                table: "Invoices");

            // Rename the new column to the original name
            migrationBuilder.RenameColumn(
                name: "CurrencyNew",
                table: "PaymentPlanLine",
                newName: "Currency");

            migrationBuilder.RenameColumn(
                name: "CurrencyNew",
                table: "LPOs",
                newName: "Currency");

            migrationBuilder.RenameColumn(
                name: "CurrencyNew",
                table: "Invoices",
                newName: "Currency");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // Add a temporary column for the string values
            migrationBuilder.AddColumn<string>(
                name: "CurrencyOld",
                table: "PaymentPlanLine",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "SAR");

            migrationBuilder.AddColumn<string>(
                name: "CurrencyOld",
                table: "LPOs",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "SAR");

            migrationBuilder.AddColumn<string>(
                name: "CurrencyOld",
                table: "Invoices",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "SAR");

            // Convert back to strings
            migrationBuilder.Sql(@"
                UPDATE PaymentPlanLine SET CurrencyOld = 
                    CASE Currency 
                        WHEN 0 THEN 'USD'
                        WHEN 1 THEN 'EUR'
                        WHEN 2 THEN 'GBP'
                        WHEN 3 THEN 'AED'
                        WHEN 4 THEN 'SAR'
                        WHEN 5 THEN 'KWD'
                        WHEN 6 THEN 'BHD'
                        WHEN 7 THEN 'OMR'
                        WHEN 8 THEN 'QAR'
                        ELSE 'SAR'
                    END");

            migrationBuilder.Sql(@"
                UPDATE LPOs SET CurrencyOld = 
                    CASE Currency 
                        WHEN 0 THEN 'USD'
                        WHEN 1 THEN 'EUR'
                        WHEN 2 THEN 'GBP'
                        WHEN 3 THEN 'AED'
                        WHEN 4 THEN 'SAR'
                        WHEN 5 THEN 'KWD'
                        WHEN 6 THEN 'BHD'
                        WHEN 7 THEN 'OMR'
                        WHEN 8 THEN 'QAR'
                        ELSE 'SAR'
                    END");

            migrationBuilder.Sql(@"
                UPDATE Invoices SET CurrencyOld = 
                    CASE Currency 
                        WHEN 0 THEN 'USD'
                        WHEN 1 THEN 'EUR'
                        WHEN 2 THEN 'GBP'
                        WHEN 3 THEN 'AED'
                        WHEN 4 THEN 'SAR'
                        WHEN 5 THEN 'KWD'
                        WHEN 6 THEN 'BHD'
                        WHEN 7 THEN 'OMR'
                        WHEN 8 THEN 'QAR'
                        ELSE 'SAR'
                    END");

            // Drop the int column
            migrationBuilder.DropColumn(
                name: "Currency",
                table: "PaymentPlanLine");

            migrationBuilder.DropColumn(
                name: "Currency",
                table: "LPOs");

            migrationBuilder.DropColumn(
                name: "Currency",
                table: "Invoices");

            // Rename the old column back
            migrationBuilder.RenameColumn(
                name: "CurrencyOld",
                table: "PaymentPlanLine",
                newName: "Currency");

            migrationBuilder.RenameColumn(
                name: "CurrencyOld",
                table: "LPOs",
                newName: "Currency");

            migrationBuilder.RenameColumn(
                name: "CurrencyOld",
                table: "Invoices",
                newName: "Currency");
        }
    }
}

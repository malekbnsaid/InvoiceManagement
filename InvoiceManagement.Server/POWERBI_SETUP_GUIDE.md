# Power BI Integration Setup Guide

This guide will help you set up Power BI integration for the Invoice Management System.

## Prerequisites

1. **Azure Active Directory (Azure AD) tenant**
2. **Power BI Pro or Premium license**
3. **Power BI workspace** with appropriate permissions
4. **Azure App Registration** for authentication

## Step 1: Create Azure App Registration

1. Go to [Azure Portal](https://portal.azure.com)
2. Navigate to **Azure Active Directory** > **App registrations**
3. Click **New registration**
4. Fill in the details:
   - **Name**: `Invoice Management Power BI Integration`
   - **Supported account types**: `Accounts in this organizational directory only`
   - **Redirect URI**: Leave blank for now
5. Click **Register**

## Step 2: Configure App Registration

1. In your app registration, go to **Certificates & secrets**
2. Click **New client secret**
3. Add a description and set expiration (recommended: 24 months)
4. Click **Add** and **copy the secret value** (you'll need this later)

## Step 3: Configure API Permissions

1. In your app registration, go to **API permissions**
2. Click **Add a permission**
3. Select **Power BI Service**
4. Choose **Delegated permissions** and select:
   - `Report.Read`
   - `Dataset.Read`
   - `Workspace.Read`
5. Click **Add permissions**
6. Click **Grant admin consent** (requires admin privileges)

## Step 4: Get Required IDs

1. **Application (client) ID**: Found in **Overview** tab
2. **Directory (tenant) ID**: Found in **Overview** tab
3. **Client Secret**: The value you copied in Step 2

## Step 5: Create Power BI Workspace

1. Go to [Power BI Service](https://app.powerbi.com)
2. Click **Workspaces** > **Create workspace**
3. Name it: `Invoice Management Analytics`
4. Note the **Workspace ID** from the URL

## Step 6: Configure appsettings.json

Add the following configuration to your `appsettings.json`:

```json
{
  "PowerBI": {
    "ClientId": "YOUR_APPLICATION_CLIENT_ID",
    "ClientSecret": "YOUR_CLIENT_SECRET_VALUE",
    "TenantId": "YOUR_TENANT_ID",
    "WorkspaceId": "YOUR_WORKSPACE_ID",
    "Authority": "https://login.microsoftonline.com/YOUR_TENANT_ID/oauth2/v2.0/token",
    "Scope": "https://analysis.windows.net/powerbi/api/.default"
  }
}
```

## Step 7: Create Power BI Reports

### Option A: Use the Data Export API

The system provides several data export endpoints for Power BI:

- **Analytics Data**: `/api/PowerBIData/analytics`
- **Department Breakdown**: `/api/PowerBIData/department-breakdown`
- **Monthly Trends**: `/api/PowerBIData/monthly-trends`
- **Vendor Analytics**: `/api/PowerBIData/vendor-analytics`

### Option B: Connect Power BI to SQL Database

1. Open Power BI Desktop
2. Click **Get Data** > **SQL Server**
3. Enter your database connection string
4. Select the tables you want to use
5. Create your reports
6. Publish to your workspace

## Step 8: Test the Integration

1. Start your application
2. Navigate to `/reports` in your application
3. You should see the Power BI dashboard
4. Select a report to test embedding

## Troubleshooting

### Common Issues

1. **Authentication Errors**
   - Verify your Client ID, Client Secret, and Tenant ID
   - Ensure the app registration has the correct permissions
   - Check that admin consent has been granted

2. **Report Not Loading**
   - Verify the Workspace ID is correct
   - Ensure the report exists in the workspace
   - Check that the app has access to the workspace

3. **Data Not Updating**
   - Check if the dataset is configured for automatic refresh
   - Verify the data source connection
   - Ensure the service account has access to the data source

### Debug Steps

1. Check the application logs for Power BI related errors
2. Verify the Power BI service is accessible from your application
3. Test the API endpoints directly using tools like Postman
4. Check the browser console for JavaScript errors

## Security Considerations

1. **Client Secret**: Store securely and rotate regularly
2. **Permissions**: Use the principle of least privilege
3. **Data Access**: Ensure only authorized users can access reports
4. **Network Security**: Use HTTPS for all communications

## Advanced Configuration

### Custom Authentication

You can implement custom authentication by modifying the `PowerBIService` class to use different authentication methods.

### Row-Level Security (RLS)

To implement row-level security:

1. Configure RLS in your Power BI dataset
2. Pass user context in the embed token request
3. Update the `EffectiveIdentity` in the embed configuration

### Scheduled Data Refresh

To set up automatic data refresh:

1. Configure a data gateway if using on-premises data
2. Set up scheduled refresh in Power BI Service
3. Consider using Azure Data Factory for complex ETL processes

## Support

For issues related to:
- **Power BI Service**: Contact your Power BI administrator
- **Azure AD**: Contact your Azure administrator
- **Application Integration**: Check the application logs and documentation

## Additional Resources

- [Power BI REST API Documentation](https://docs.microsoft.com/en-us/rest/api/power-bi/)
- [Power BI Embedded Documentation](https://docs.microsoft.com/en-us/power-bi/developer/embedded/)
- [Azure AD App Registration Guide](https://docs.microsoft.com/en-us/azure/active-directory/develop/quickstart-register-app)

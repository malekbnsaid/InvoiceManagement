# 🚀 Azure Communication Services Email Setup Guide

## 📧 **Using Your Existing Azure Communication Services**

You already have an Azure Communication Services resource called `invoice-mailing-service` in your `pfe` resource group. Let's configure it for your application!

## 🔧 **Step 1: Get Your Connection String**

1. **Go to Azure Portal**: https://portal.azure.com
2. **Navigate to**: Resource Groups → `pfe`
3. **Find**: `invoice-mailing-service` (Communication Services)
4. **Click on it** → **Keys** tab
5. **Copy the Connection String** (it looks like: `endpoint=https://...;accesskey=...`)

### **Alternative: Environment Variable**
You can also set the connection string as an environment variable:
```bash
set COMMUNICATION_SERVICES_CONNECTION_STRING=endpoint=https://...;accesskey=...
```

## 🌐 **Step 2: Get Your Email Domain**

1. **In the same Communication Services resource**
2. **Go to**: **Domains** (in the left menu)
3. **Note your domain** (it will be something like `your-domain.azurecomm.net`)

## ⚙️ **Step 3: Update Configuration**

Update your `appsettings.Development.json`:

```json
{
  "AzureCommunication": {
    "ConnectionString": "endpoint=https://your-service.communication.azure.com/;accesskey=your-access-key-here",
    "FromEmail": "noreply@your-domain.azurecomm.net",
    "FromName": "Olympic Invoice Management System"
  }
}
```

## 🧪 **Step 4: Test the Setup**

### **Option A: Test with the Application**
1. **Start your server**: `dotnet run`
2. **Check console output**: Should show "Registering AzureCommunicationEmailService"
3. **Test forgot password**: Try the forgot password feature
4. **Check email delivery**: Emails should be sent through Azure Communication Services

### **Option B: Test with Standalone Program**
1. **Set environment variable**: `set COMMUNICATION_SERVICES_CONNECTION_STRING=your-connection-string`
2. **Run test program**: `dotnet run EmailTestProgram.cs`
3. **Check console output**: Should show email operation status and ID

## 📋 **What You'll Get**

✅ **Professional email service** with high deliverability  
✅ **No rate limits** for development  
✅ **Beautiful HTML email templates**  
✅ **Automatic fallback** to mock service if not configured  
✅ **Free usage** with your Azure credits  

## 🔍 **Troubleshooting**

### **If emails aren't sending:**
1. Check the console output for "Registering AzureCommunicationEmailService"
2. Verify your connection string is correct
3. Ensure your domain is verified in Azure Communication Services
4. Check Azure Communication Services logs in the Azure Portal

### **If you see "MockEmailService":**
- Your Azure Communication Services configuration is not complete
- Check that the connection string doesn't contain "YOUR_"
- Verify the configuration in `appsettings.Development.json`

## 🎯 **Next Steps**

Once configured, your application will:
- Send beautiful password reset emails
- Send welcome emails for new users
- Use professional email templates
- Have high email deliverability rates

## 💡 **Benefits of Azure Communication Services**

- **Reliable**: Enterprise-grade email delivery
- **Scalable**: Handles high volume automatically
- **Secure**: Built-in security and compliance
- **Cost-effective**: Pay only for what you use
- **Professional**: Uses your own domain for emails

---

**Need help?** Check the Azure Communication Services documentation or contact support through the Azure Portal.

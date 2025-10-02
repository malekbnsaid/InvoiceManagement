# 📧 Email Setup Guide for Testing

## 🚀 Quick Setup with Outlook/Hotmail Account

### **Option 1: SMTP with Personal Outlook Account (Easiest)**

1. **Use your existing Outlook/Hotmail account** (e.g., `yourname@outlook.com` or `yourname@hotmail.com`)

2. **Generate App Password**:
   - Go to: https://account.microsoft.com/security
   - Sign in with your Microsoft account
   - Go to "Security" → "Advanced security options"
   - Under "App passwords", click "Create a new app password"
   - Name it: `Invoice Management`
   - Copy the generated password (16 characters)

3. **Update Configuration**:
   ```json
   "Outlook": {
     "Server": "smtp-mail.outlook.com",
     "Port": 587,
     "Username": "your-actual-email@outlook.com",
     "Password": "your-16-char-app-password",
     "FromEmail": "your-actual-email@outlook.com",
     "FromName": "Invoice Management System Test",
     "EnableSsl": true
   }
   ```

4. **Test**: Restart the server and try forgot password!

### **Option 2: Microsoft Graph API (More Complex)**

If you prefer Graph API, follow these steps:

1. **Azure Portal Setup**:
   - Go to: https://portal.azure.com
   - Azure Active Directory → App registrations → New registration
   - Name: `Invoice Management Test`
   - Account types: `Personal Microsoft accounts only`
   - Register

2. **API Permissions**:
   - API permissions → Add permission → Microsoft Graph → Application permissions
   - Add: `Mail.Send` and `User.Read.All`
   - Grant admin consent

3. **Client Secret**:
   - Certificates & secrets → New client secret
   - Copy the secret value immediately

4. **Update Configuration**:
   ```json
   "Microsoft365": {
     "TenantId": "your-tenant-id-from-azure",
     "ClientId": "your-client-id-from-azure",
     "ClientSecret": "your-client-secret-from-azure",
     "FromEmail": "your-email@outlook.com",
     "FromName": "Invoice Management System Test"
   }
   ```

## 🧪 Testing

1. **Start the server**: `dotnet run`
2. **Check logs**: Look for "Registering SmtpEmailService" or "MockEmailService"
3. **Test forgot password**: Use the frontend form
4. **Check email**: Look in your inbox (and spam folder)

## 🔧 Troubleshooting

- **"MockEmailService" in logs**: Configuration not set up correctly
- **"Authentication failed"**: Check app password is correct
- **"Connection refused"**: Check internet connection and firewall
- **No email received**: Check spam folder, verify email address

## 📝 Example Configuration

Replace in `appsettings.Development.json`:

```json
{
  "Outlook": {
    "Server": "smtp-mail.outlook.com",
    "Port": 587,
    "Username": "john.doe@outlook.com",
    "Password": "abcd1234efgh5678",
    "FromEmail": "john.doe@outlook.com",
    "FromName": "John's Invoice Test System",
    "EnableSsl": true
  }
}
```

## ✅ Ready to Test!

Once configured, the forgot password flow will:
1. ✅ Generate secure reset token
2. ✅ Store token in database  
3. ✅ Send beautiful HTML email
4. ✅ Validate token on reset
5. ✅ Update password securely










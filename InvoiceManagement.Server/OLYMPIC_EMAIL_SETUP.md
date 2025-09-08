# 🏆 Olympic.qa Email Service Setup Guide

## 📧 **Email Service Options**

### **Option 1: Microsoft 365 (Recommended)**
- **Best for**: Professional corporate setup
- **Benefits**: Uses Olympic's domain, better deliverability, official Microsoft integration
- **Setup**: Requires Azure AD app registration

### **Option 2: Outlook SMTP (Easier)**
- **Best for**: Quick setup, existing Outlook accounts
- **Benefits**: Simple configuration, uses Olympic's Outlook infrastructure
- **Setup**: Just need email credentials

---

## 🔐 **Option 1: Microsoft 365 Setup**

### **Step 1: Azure AD App Registration**
1. **Go to [Azure Portal](https://portal.azure.com)**
2. **Navigate to**: Azure Active Directory → App registrations
3. **Click**: "New registration"
4. **Fill in**:
   - **Name**: `Olympic Invoice Management System`
   - **Supported account types**: `Accounts in this organizational directory only`
   - **Redirect URI**: Leave blank (Web app)

### **Step 2: Get App Credentials**
1. **Copy these values**:
   - **Application (client) ID** → Use as `ClientId`
   - **Directory (tenant) ID** → Use as `TenantId`

2. **Generate Client Secret**:
   - Go to **Certificates & secrets**
   - Click **New client secret**
   - Add description: `Invoice Management System`
   - Copy the **Value** → Use as `ClientSecret`

### **Step 3: Configure API Permissions**
1. Go to **API permissions**
2. Click **Add a permission**
3. Select **Microsoft Graph**
4. Choose **Application permissions**
5. Add these permissions:
   - `Mail.Send` (to send emails)
   - `User.Read.All` (to read user info)
6. Click **Grant admin consent**

### **Step 4: Update Configuration**
In `appsettings.Development.json`:
```json
"Microsoft365": {
  "TenantId": "your-tenant-id-here",
  "ClientId": "your-client-id-here",
  "ClientSecret": "your-client-secret-here",
  "FromEmail": "noreply@olympic.qa",
  "FromName": "Olympic Invoice Management System"
}
```

---

## 📧 **Option 2: Outlook SMTP Setup**

### **Step 1: Create App Password**
1. **Go to [Microsoft Account Security](https://account.microsoft.com/security)**
2. **Sign in** with `noreply@olympic.qa`
3. **Go to**: Security → Advanced security options
4. **Create app password**:
   - Name: `Invoice Management System`
   - Copy the generated password

### **Step 2: Update Configuration**
In `appsettings.Development.json`:
```json
"Outlook": {
  "Server": "smtp-mail.outlook.com",
  "Port": 587,
  "Username": "noreply@olympic.qa",
  "Password": "your-app-password-here",
  "FromEmail": "noreply@olympic.qa",
  "FromName": "Olympic Invoice Management System",
  "EnableSsl": true
}
```

---

## 🚀 **Testing the Email Service**

### **Test Welcome Email**
1. **Sign up a new user** in the system
2. **Check the user's email** for welcome message
3. **Verify**: Olympic branding, professional design

### **Test Password Reset**
1. **Use "Forgot Password"** feature
2. **Enter email address**
3. **Check email** for reset link
4. **Verify**: Reset link works, Olympic branding

---

## 🔧 **Troubleshooting**

### **Microsoft 365 Issues**
- **Error**: "Configuration is incomplete"
  - **Solution**: Check all three values (TenantId, ClientId, ClientSecret)
- **Error**: "Insufficient privileges"
  - **Solution**: Grant admin consent for API permissions
- **Error**: "Authentication failed"
  - **Solution**: Verify tenant ID and client credentials

### **Outlook SMTP Issues**
- **Error**: "Authentication failed"
  - **Solution**: Use app password, not regular password
- **Error**: "Connection timeout"
  - **Solution**: Check firewall, verify SMTP server/port
- **Error**: "SSL/TLS required"
  - **Solution**: Ensure `EnableSsl: true`

---

## 📋 **Configuration Checklist**

### **Microsoft 365**
- [ ] Azure AD app registered
- [ ] Client ID copied
- [ ] Tenant ID copied
- [ ] Client secret generated
- [ ] API permissions granted
- [ ] Admin consent given
- [ ] Configuration updated

### **Outlook SMTP**
- [ ] App password created
- [ ] SMTP credentials verified
- [ ] Configuration updated
- [ ] SSL enabled

### **General**
- [ ] Base URL configured
- [ ] Olympic branding verified
- [ ] Test emails sent successfully
- [ ] Password reset working
- [ ] Welcome emails working

---

## 📞 **Support**

**For Olympic IT Team:**
- **Azure AD Issues**: Contact Microsoft 365 admin
- **SMTP Issues**: Check Outlook settings
- **System Issues**: Check application logs

**For Developers:**
- Check `Program.cs` email service registration
- Verify `IEmailService` interface implementation
- Test with both email services
- Monitor application logs for errors

---

## 🎯 **Next Steps**

1. **Choose email service** (Microsoft 365 or Outlook SMTP)
2. **Follow setup guide** for chosen option
3. **Test email functionality**
4. **Configure production settings**
5. **Monitor email delivery**

**🏆 Olympic Invoice Management System - Professional Email Integration Ready!**





# Zoho CRM Integration Setup Guide

This guide will walk you through setting up Zoho CRM integration for your TKPay landing page.

## 🚀 Quick Setup Steps

### 1. Create Zoho CRM Developer App

1. Go to [Zoho Developer Console](https://accounts.zoho.com/developerconsole)
2. Click **"Add Client"**
3. Choose **"Server-based Applications"**
4. Fill in the details:
   - **Client Name**: TKPay Landing Page
   - **Homepage URL**: https://your-domain.com
   - **Authorized Redirect URIs**: https://your-domain.com/auth/zoho/callback
5. Click **"Create"**
6. Note down your **Client ID** and **Client Secret**

### 2. Generate Refresh Token

1. In your browser, go to:
```
https://accounts.zoho.com/oauth/v2/auth?scope=ZohoCRM.modules.ALL&client_id=YOUR_CLIENT_ID&response_type=code&access_type=offline&redirect_uri=https://your-domain.com/auth/zoho/callback
```

2. Replace `YOUR_CLIENT_ID` with your actual Client ID
3. Authorize the application
4. You'll be redirected with a `code` parameter in the URL
5. Copy this authorization code

6. Exchange the code for a refresh token using curl or Postman:
```bash
curl -X POST https://accounts.zoho.com/oauth/v2/token \
  -d "grant_type=authorization_code" \
  -d "client_id=YOUR_CLIENT_ID" \
  -d "client_secret=YOUR_CLIENT_SECRET" \
  -d "redirect_uri=https://your-domain.com/auth/zoho/callback" \
  -d "code=YOUR_AUTHORIZATION_CODE"
```

7. Save the `refresh_token` from the response

### 3. Configure Environment Variables

1. Copy `.env.local.example` to `.env.local`:
```bash
cp .env.local.example .env.local
```

2. Fill in your Zoho credentials in `.env.local`:
```env
ZOHO_CRM_CLIENT_ID=your_actual_client_id
ZOHO_CRM_CLIENT_SECRET=your_actual_client_secret
ZOHO_CRM_REFRESH_TOKEN=your_actual_refresh_token
ZOHO_CRM_BASE_URL=https://www.zohoapis.com/crm/v2
```

### 4. Test the Integration

1. Start your development server:
```bash
npm run dev
```

2. Fill out the contact form on your landing page
3. Check your Zoho CRM for the new lead

## 🎯 What Gets Created in Zoho CRM

When a user submits the contact form, the integration will:

### Lead Fields Mapped:
- **First Name** & **Last Name** (parsed from full name)
- **Company** (if provided)
- **Email** (primary identifier)
- **Phone** (with international format)
- **Lead Source**: "Website Form"
- **Description**: Detailed submission info
- **Interest Type**: POS / Online Payment / Payment Account
- **Language Preference**: French / Arabic / English
- **Lead Status**: "New"

### Smart Features:
- **Duplicate Prevention**: Searches by email before creating
- **Lead Updates**: Updates existing leads with new information
- **Multi-language Support**: Tracks user's language preference
- **Automatic Lead Scoring**: Can trigger Zoho workflows

## 🔧 Customization Options

### Custom Fields in Zoho CRM

To use the custom fields (Interest_Type, Language_Preference), create them in your Zoho CRM:

1. Go to **Setup > Customization > Modules and Fields**
2. Select **Leads** module
3. Add custom fields:
   - **Interest_Type** (Picklist): POS, Online_Payment, Payment_Account
   - **Language_Preference** (Picklist): French, Arabic, English

### Modify Lead Mapping

Edit `src/lib/zoho-crm.ts` to customize how form data maps to Zoho fields:

```typescript
export function formatFormDataForZoho(formData, locale) {
  return {
    // Add your custom field mappings here
    Custom_Field_Name: formData.someValue,
    // ...
  }
}
```

## 🌍 Regional Configurations

Choose the correct base URL for your Zoho data center:

- **International**: `https://www.zohoapis.com/crm/v2`
- **Europe**: `https://www.zohoapis.eu/crm/v2`
- **India**: `https://www.zohoapis.in/crm/v2`
- **Australia**: `https://www.zohoapis.com.au/crm/v2`
- **Japan**: `https://www.zohoapis.jp/crm/v2`

## 🚨 Troubleshooting

### Common Issues:

1. **"Missing Zoho CRM credentials"**
   - Check your `.env.local` file
   - Ensure all environment variables are set

2. **"Failed to get access token"**
   - Verify your Client ID and Secret
   - Check if your refresh token is valid
   - Ensure correct Zoho domain in base URL

3. **"Failed to create lead"**
   - Check Zoho CRM permissions
   - Verify field names match your CRM setup
   - Check Zoho API limits

### Debug Mode:

Set `NODE_ENV=development` to see detailed error messages in API responses.

## 📈 Production Deployment

### Environment Variables for Production:

Make sure to set these in your production environment (Vercel, Netlify, etc.):

```env
ZOHO_CRM_CLIENT_ID=xxx
ZOHO_CRM_CLIENT_SECRET=xxx
ZOHO_CRM_REFRESH_TOKEN=xxx
ZOHO_CRM_BASE_URL=https://www.zohoapis.com/crm/v2
```

### Security Notes:

- Never commit `.env.local` to version control
- Use secure environment variable storage in production
- Regularly rotate your Zoho CRM credentials
- Monitor API usage in Zoho Developer Console

## 📞 Support

- [Zoho CRM API Documentation](https://www.zoho.com/crm/developer/docs/api/v2/)
- [Zoho OAuth Documentation](https://www.zoho.com/crm/developer/docs/api/v2/oauth-overview.html)
- [TKPay Landing Page Issues](https://github.com/your-repo/issues)

---

🎉 **That's it!** Your TKPay landing page is now integrated with Zoho CRM for automatic lead generation.
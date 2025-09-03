# Zoho Token Authentication Guide

This guide explains how to integrate the Harvest Planner application with Zoho for simple token-based authentication.

## Overview

The application now supports Zoho token authentication with the following features:
- **Token-based authentication** - No separate login required
- **Embedded app support** - Can be embedded in Zoho CRM dashboard
- **Automatic token validation** - Validates Zoho tokens on app load
- **User context** - Displays current Zoho user information
- **Backend integration** - Passes Zoho tokens to your existing backend API

## Setup Instructions

### 1. Zoho CRM App Configuration

1. **Create a Zoho CRM App:**
   - Go to [Zoho Developer Console](https://api-console.zoho.com/)
   - Create a new client application
   - Choose "Server-based Applications" or "Web-based Applications"

2. **Configure OAuth Settings:**
   ```
   Client Name: Harvest Planner
   Homepage URL: https://your-domain.com
   Authorized Redirect URIs: 
     - https://your-domain.com (production)
     - http://localhost:3000 (development)
   ```

3. **Get Credentials:**
   - Copy the Client ID and Client Secret
   - Note the generated redirect URI

### 2. Environment Configuration

Create a `.env` file in your project root:

```env
# Zoho CRM Configuration
REACT_APP_ZOHO_CLIENT_ID=your_client_id_here
REACT_APP_ZOHO_CLIENT_SECRET=your_client_secret_here
REACT_APP_ZOHO_REDIRECT_URI=https://your-domain.com

# Optional: Webhook endpoint for real-time sync
REACT_APP_WEBHOOK_ENDPOINT=https://your-domain.com/webhook
```

### 3. Backend Integration

Your existing backend API will receive Zoho tokens in the `X-Zoho-Token` header. You can optionally validate these tokens on your backend:

```csharp
// Example C# backend validation
public bool ValidateZohoToken(string token)
{
    try
    {
        var client = new HttpClient();
        var response = await client.GetAsync($"https://accounts.zoho.com/oauth/v2/tokeninfo?access_token={token}");
        var content = await response.Content.ReadAsStringAsync();
        var tokenInfo = JsonSerializer.Deserialize<TokenInfo>(content);
        
        return tokenInfo.expires_in_sec > 0;
    }
    catch
    {
        return false;
    }
}
```

### 4. Deployment Configuration

#### For Embedded Apps in Zoho CRM:

1. **Deploy your app** to a web server (e.g., Heroku, Netlify, AWS)
2. **In Zoho CRM Setup:**
   - Go to Setup > Developer Space > Applications
   - Create a new application
   - Set the application URL to your deployed app
   - Configure the app to pass the access token as a URL parameter

#### URL Parameters for Embedded Apps:

When embedding in Zoho CRM, the app expects these URL parameters:
```
https://your-app.com?access_token=ZOHO_ACCESS_TOKEN
```

## Authentication Flow

### 1. Token Validation
- App checks for Zoho token in URL parameters or localStorage
- Validates token with Zoho OAuth API
- Retrieves user information from Zoho CRM

### 2. Access Control
- App only loads if valid Zoho token is present
- Shows authentication error if token is invalid or missing
- Automatically refreshes token when needed

### 3. API Integration
- All API calls pass Zoho token in `X-Zoho-Token` header to your backend
- Falls back to JWT token if Zoho token is not available
- Your existing backend API continues to work unchanged

## Usage Examples

### 1. Direct Access with Token
```
https://your-app.com?access_token=1000.abc123def456...
```

### 2. Embedded in Zoho CRM
The app can be embedded as an iframe in Zoho CRM with the access token passed as a parameter.

### 3. Development Testing
For local development, you can manually add a token to the URL:
```
http://localhost:3000?access_token=your_test_token
```

## API Integration

### Backend Token Passing
The app automatically passes Zoho tokens to your existing backend API:

```javascript
// Your existing API calls work unchanged
const response = await fetch('/api/harvestplans', {
    headers: {
        'X-Zoho-Token': 'zoho_access_token_here', // Added automatically
        'Authorization': 'Bearer jwt_token_here'   // Your existing JWT
    }
});
```

### Backend Validation (Optional)
Your backend can optionally validate Zoho tokens:

```csharp
// In your API controller
[HttpGet]
public async Task<IActionResult> GetHarvestPlans()
{
    var zohoToken = Request.Headers["X-Zoho-Token"].FirstOrDefault();
    
    if (!string.IsNullOrEmpty(zohoToken))
    {
        // Optional: Validate Zoho token
        if (!await ValidateZohoToken(zohoToken))
        {
            return Unauthorized("Invalid Zoho token");
        }
    }
    
    // Your existing logic continues unchanged
    var plans = await _harvestPlanService.GetAllAsync();
    return Ok(plans);
}
```

## Security Considerations

1. **Token Security:**
   - Tokens are stored in localStorage (consider using httpOnly cookies for production)
   - Tokens are validated on every app load
   - Expired tokens are automatically cleared

2. **CORS Configuration:**
   - Ensure your app's domain is whitelisted in Zoho CRM
   - Configure proper CORS headers for API calls

3. **HTTPS Required:**
   - Zoho CRM requires HTTPS for production deployments
   - Use SSL certificates for secure token transmission

## Troubleshooting

### Common Issues:

1. **"Authentication Required" Error:**
   - Check if access token is present in URL
   - Verify token is valid and not expired
   - Ensure Zoho CRM app is properly configured

2. **CORS Errors:**
   - Verify your domain is whitelisted in Zoho CRM
   - Check CORS configuration on your server

3. **Token Validation Failures:**
   - Ensure Zoho OAuth endpoints are accessible
   - Check network connectivity
   - Verify token format and permissions

### Debug Mode:
Set `REACT_APP_DEBUG=true` in your environment variables to enable detailed logging.

## Support

For issues related to:
- **Zoho CRM API:** Check [Zoho CRM API Documentation](https://www.zoho.com/crm/developer/docs/)
- **OAuth Integration:** See [Zoho OAuth Documentation](https://www.zoho.com/accounts/protocol/oauth.html)
- **Application Issues:** Check the browser console for error messages

## Next Steps

1. **Backend Token Validation:** Optionally add Zoho token validation to your backend API
2. **User Context:** Use Zoho user information for audit trails or user-specific data
3. **Embedded Deployment:** Deploy the app and embed it in Zoho CRM dashboard
4. **Token Refresh:** Implement automatic token refresh for long-running sessions
5. **Error Handling:** Add better error handling for token expiration scenarios

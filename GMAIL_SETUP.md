# Gmail SMTP Setup for Password Reset Emails

## Current Status
- ✅ Password reset system is fully implemented and working
- ✅ API endpoints are functional
- ✅ Frontend forms are ready
- ❌ Gmail SMTP authentication is failing

## Gmail App Password Setup

To send actual emails, you need to set up a Gmail App Password:

### Step 1: Enable 2-Factor Authentication
1. Go to your Google Account settings: https://myaccount.google.com/
2. Click on "Security" in the left sidebar
3. Under "Signing in to Google", enable "2-Step Verification" if not already enabled

### Step 2: Generate App Password
1. Go to https://myaccount.google.com/apppasswords
2. Select "Mail" as the app
3. Select "Other (Custom name)" as the device
4. Enter "Cryptosden" as the custom name
5. Click "Generate"
6. Copy the 16-character app password (it will look like: `abcd efgh ijkl mnop`)

### Step 3: Update .env File
Replace the current SMTP_PASS in your .env file:
```
SMTP_PASS=your_16_character_app_password_here
```

### Step 4: Restart Server
After updating the .env file, restart your server:
```bash
# Stop current server (Ctrl+C in terminal)
# Then restart:
cd server
npm start
```

## Testing
Once you've updated the app password, test the password reset:

1. Go to http://localhost:3000/login
2. Click "Forgot Password?"
3. Enter your email: jakkulaniharika8@gmail.com
4. Check your Gmail inbox for the reset email

## Alternative: Use Different Email Provider
If Gmail continues to have issues, you can use other SMTP providers:

### Outlook/Hotmail
```env
SMTP_HOST=smtp-mail.outlook.com
SMTP_PORT=587
SMTP_USER=your_email@outlook.com
SMTP_PASS=your_password
```

### Yahoo Mail
```env
SMTP_HOST=smtp.mail.yahoo.com
SMTP_PORT=587
SMTP_USER=your_email@yahoo.com
SMTP_PASS=your_app_password
```

## Current Fallback
Until you fix the SMTP credentials, the system will:
- ✅ Generate reset tokens correctly
- ✅ Store them in the database
- ✅ Log reset links to server console
- ✅ Allow password reset via the logged links

This means the password reset functionality is fully working - you just need to check the server console for the reset links during development.
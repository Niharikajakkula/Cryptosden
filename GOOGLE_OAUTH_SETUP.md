# Google OAuth Setup - Cryptosden

## 1. Stop any existing server
Ensure only ONE backend runs on port 3463. If you get "port in use":
```powershell
Get-Process -Id (Get-NetTCPConnection -LocalPort 3463 -ErrorAction SilentlyContinue).OwningProcess | Stop-Process -Force
```

## 2. Google Cloud Console
1. Go to https://console.cloud.google.com/apis/credentials
2. Select your OAuth 2.0 Client ID (Web application)
3. Under **Authorized redirect URIs**, add:
   ```
   http://localhost:3463/api/auth/google/callback
   ```
4. Save

## 3. .env (already configured)
```
PORT=3463
API_BASE_URL=http://localhost:3463
CLIENT_URL=http://localhost:3000
REACT_APP_API_URL=http://localhost:3463
GOOGLE_CLIENT_ID=your_client_id
GOOGLE_CLIENT_SECRET=your_client_secret
```

## 4. client/package.json proxy
Must match backend port:
```json
"proxy": "http://localhost:3463"
```

## 5. Start servers
1. Backend: `npm start` (from project root)
2. Client: `cd client && npm start`
3. Both must run - backend on 3463, client on 3000

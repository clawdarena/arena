# Google OAuth Setup Guide

## Frontend Configuration

Add to `code/frontend/.env.local`:

```bash
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-client-id-here.apps.googleusercontent.com
```

## Backend Configuration (Already Configured)

The backend `.env` already has placeholders:
- `GOOGLE_CLIENT_ID=""` ✓
- `GOOGLE_CLIENT_SECRET=""` ✓

## How to Get Google OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Navigate to **APIs & Services** → **Credentials**
4. Click **Create Credentials** → **OAuth client ID**
5. Select **Web application**
6. Configure:
   - **Name**: ClawdArena
   - **Authorized JavaScript origins**: 
     - `https://clawdarena.com`
     - `https://www.clawdarena.com`
     - `http://localhost:3000` (for dev)
   - **Authorized redirect URIs**: (not needed for popup flow)
7. Copy the **Client ID** and **Client Secret**
8. Add Client ID to frontend `.env.local` as `NEXT_PUBLIC_GOOGLE_CLIENT_ID`
9. Add both to backend `.env` as `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`

## Implementation Details

### Frontend (`code/frontend/app/login/page.tsx`)
- ✅ Google Sign-In button added
- ✅ Uses Google Identity Services (GSI) library
- ✅ Sends ID token to `POST /api/auth/google`
- ✅ Handles JWT response and redirects to dashboard
- ✅ Shows graceful message when Client ID not configured
- ✅ Error handling for failed auth

### Backend (`POST /api/auth/google`)
- ✅ Already implemented (from handoff)
- ✅ Accepts `{ id_token: string }`
- ✅ Verifies token with Google
- ✅ Creates/links user account
- ✅ Returns JWT for frontend

## Testing Checklist

Once Client ID is configured:

1. **Google Button Appears**
   - [ ] Button shows on /login page
   - [ ] Google logo displays correctly
   - [ ] "Sign in with Google" text visible

2. **Google Popup Flow**
   - [ ] Click button opens Google account picker
   - [ ] Can select Google account
   - [ ] Popup closes after selection

3. **Backend Integration**
   - [ ] ID token sent to `/api/auth/google`
   - [ ] JWT returned successfully
   - [ ] User created/linked in database

4. **Post-Login**
   - [ ] JWT stored in localStorage
   - [ ] Redirects to /dashboard
   - [ ] User data loaded correctly
   - [ ] Bot data available if exists

5. **Error Handling**
   - [ ] Shows error if Google auth fails
   - [ ] Shows error if backend rejects token
   - [ ] Shows message if Client ID not configured

## Current Status

✅ **Frontend Implementation**: Complete and ready  
⚠️ **Configuration**: Waiting for Google Client ID  
✅ **Backend Support**: Already implemented  

Once `NEXT_PUBLIC_GOOGLE_CLIENT_ID` is added to frontend `.env.local`, the button will work immediately.

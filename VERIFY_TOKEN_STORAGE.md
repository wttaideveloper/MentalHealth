# Verify Token Storage - Quick Check

## After Login, Check These:

1. **Open Browser DevTools** (F12)
2. **Go to Application Tab**
3. **Click on Local Storage** → `http://localhost:5000`
4. **Look for:**
   - ✅ `accessToken` - Should be present
   - ✅ `refreshToken` - Should be present

## Verify Token Usage:

1. **After login, open Network tab**
2. **Navigate to any page or trigger an API call**
3. **Check any API request:**
   - Click on the request
   - Go to "Headers" section
   - Look for "Request Headers"
   - ✅ Should see: `Authorization: Bearer eyJhbGc...` (your token)

## Expected Token Format:

- **accessToken**: JWT token (long string starting with `eyJhbGc...`)
- **refreshToken**: JWT token (long string starting with `eyJhbGc...`)

Both should be automatically included in API requests!


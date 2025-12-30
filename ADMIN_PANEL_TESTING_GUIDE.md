# Admin Panel Testing Guide

This guide will help you test all phases of the admin panel implementation. Follow these steps in order to verify everything is working correctly.

---

## Prerequisites

1. **Backend Server Running**
   - Start the backend server: `npm run dev` (from root) or `cd Server && npm run dev`
   - Server should be running on `http://localhost:5000`

2. **Frontend Running**
   - Frontend should be accessible (usually served through backend in dev mode)
   - Access at `http://localhost:5000`

3. **Admin User Created**
   - You need at least one user in the database with `role: "admin"`
   - If you don't have one, create it manually in MongoDB:
     ```javascript
     // In MongoDB shell or Compass
     db.users.updateOne(
       { email: "admin@example.com" },
       { $set: { role: "admin" } }
     )
     ```

---

## Phase 1: Backend API Testing

### Test 1.1: Admin Login API
**Endpoint:** `POST /api/admin/login`

**Steps:**
1. Open Postman, Thunder Client, or any API testing tool
2. Create a POST request to `http://localhost:5000/api/admin/login`
3. Set headers: `Content-Type: application/json`
4. Send body:
   ```json
   {
     "email": "admin@example.com",
     "password": "your_admin_password"
   }
   ```

**Expected Result:**
- Status: 200 OK
- Response should contain:
  ```json
  {
    "success": true,
    "message": "Admin login success",
    "data": {
      "accessToken": "...",
      "refreshToken": "...",
      "user": {
        "id": "...",
        "email": "admin@example.com",
        "role": "admin"
      }
    }
  }
  ```

**What to Check:**
- ✅ Returns tokens
- ✅ User role is "admin"
- ✅ If non-admin tries to login, should return 403 error

---

### Test 1.2: Admin Reports Summary API
**Endpoint:** `GET /api/admin/reports/summary`

**Steps:**
1. Copy the `accessToken` from Test 1.1
2. Create a GET request to `http://localhost:5000/api/admin/reports/summary`
3. Set header: `Authorization: Bearer <accessToken>`

**Expected Result:**
- Status: 200 OK
- Response should contain:
  ```json
  {
    "success": true,
    "message": "Summary",
    "data": {
      "purchasesCount": 0,
      "paidCount": 0,
      "attemptsStarted": 0,
      "attemptsCompleted": 0
    }
  }
  ```

**What to Check:**
- ✅ Returns summary data
- ✅ Without token, should return 401 Unauthorized
- ✅ With non-admin token, should return 403 Forbidden

---

### Test 1.3: Admin Reports CSV Export APIs
**Endpoints:** 
- `GET /api/admin/reports/purchases/csv`
- `GET /api/admin/reports/usage/csv`

**Steps:**
1. Use the same `accessToken` from Test 1.1
2. Create GET requests to both endpoints
3. Set header: `Authorization: Bearer <accessToken>`

**Expected Result:**
- Status: 200 OK
- Content-Type: `text/csv`
- Should download CSV file

**What to Check:**
- ✅ CSV files download correctly
- ✅ Files contain proper headers and data

---

### Test 1.4: User Management APIs
**Endpoints:**
- `GET /api/admin/users` - List users
- `GET /api/admin/users/:userId` - Get user by ID
- `PUT /api/admin/users/:userId` - Update user

**Steps:**
1. Test GET `/api/admin/users` with admin token
2. Test with query params: `?page=1&limit=10&search=test&role=user`
3. Get a user ID from the list
4. Test GET `/api/admin/users/{userId}`
5. Test PUT `/api/admin/users/{userId}` with body:
   ```json
   {
     "role": "admin",
     "firstName": "Updated",
     "isEmailVerified": true
   }
   ```

**Expected Result:**
- ✅ List returns paginated users
- ✅ Search and filters work
- ✅ Get user returns user details
- ✅ Update user modifies user data

---

### Test 1.5: Test Management APIs
**Endpoints:**
- `GET /api/admin/tests` - List tests
- `GET /api/admin/tests/:testId` - Get test by ID
- `PUT /api/admin/tests/:testId` - Update test
- `DELETE /api/admin/tests/:testId` - Delete test

**Steps:**
1. Test GET `/api/admin/tests` with admin token
2. Test with query params: `?page=1&limit=10&search=test&isActive=true`
3. Get a test ID from the list
4. Test GET `/api/admin/tests/{testId}`
5. Test PUT `/api/admin/tests/{testId}` with body:
   ```json
   {
     "isActive": false,
     "title": "Updated Test Title"
   }
   ```
6. Test DELETE `/api/admin/tests/{testId}`

**Expected Result:**
- ✅ List returns paginated tests (including inactive)
- ✅ Search and filters work
- ✅ Get test returns full test details
- ✅ Update test modifies test data
- ✅ Delete test sets isActive to false (soft delete)

---

## Phase 2: Frontend Admin Authentication Testing

### Test 2.1: Admin Login Page
**URL:** `http://localhost:5000/admin-login`

**Steps:**
1. Open browser and navigate to `/admin-login`
2. Verify the page loads correctly
3. Check that it shows "Admin Login" heading
4. Enter admin email and password
5. Click "Login" button

**Expected Result:**
- ✅ Page loads without errors
- ✅ Form displays email and password fields
- ✅ Password toggle (show/hide) works
- ✅ On successful login, redirects to `/admin/dashboard`
- ✅ Shows success toast message
- ✅ If wrong credentials, shows error message
- ✅ If non-admin tries to login, shows "Access denied" error

**What to Check:**
- ✅ No console errors
- ✅ Form validation works
- ✅ Loading state shows during login
- ✅ Tokens are stored in localStorage

---

### Test 2.2: Admin Route Protection
**URL:** `http://localhost:5000/admin/dashboard`

**Steps:**
1. **Without Login:**
   - Try to access `/admin/dashboard` directly (without logging in)
   - Should redirect to `/admin-login`

2. **With Regular User:**
   - Login as regular user (not admin)
   - Try to access `/admin/dashboard`
   - Should redirect to `/admin-login` or show error

3. **With Admin:**
   - Login as admin
   - Access `/admin/dashboard`
   - Should show dashboard

**Expected Result:**
- ✅ Unauthenticated users redirected to login
- ✅ Non-admin users cannot access admin pages
- ✅ Admin users can access admin pages
- ✅ Loading state shows while checking admin status

---

## Phase 3: Admin Dashboard UI Testing

### Test 3.1: Dashboard Page Load
**URL:** `http://localhost:5000/admin/dashboard`

**Steps:**
1. Login as admin
2. Navigate to `/admin/dashboard`
3. Wait for page to load

**Expected Result:**
- ✅ Dashboard loads without errors
- ✅ Shows "Dashboard" heading
- ✅ Shows 4 summary cards:
  - Total Purchases
  - Paid Purchases
  - Attempts Started
  - Attempts Completed
- ✅ Shows statistics section with progress bars
- ✅ Shows quick actions section

**What to Check:**
- ✅ Data loads from API
- ✅ Loading spinner shows while fetching
- ✅ Numbers display correctly
- ✅ No console errors

---

### Test 3.2: Admin Layout Components
**Check on Dashboard Page:**

**Steps:**
1. Verify header is visible
2. Verify sidebar is visible
3. Check sidebar navigation
4. Check user profile dropdown

**Expected Result:**
- ✅ Header shows logo and "Admin Panel" text
- ✅ Sidebar shows "Dashboard" link (highlighted)
- ✅ User profile shows admin name/email
- ✅ Sidebar toggle button works (on mobile/desktop)
- ✅ Profile dropdown shows logout option

**What to Check:**
- ✅ Sidebar collapses/expands correctly
- ✅ Active route is highlighted
- ✅ Responsive design works on mobile

---

### Test 3.3: CSV Download Functionality
**On Dashboard Page:**

**Steps:**
1. Click "Export Purchases" button (in header or quick actions)
2. Wait for download
3. Click "Export Usage" button
4. Wait for download

**Expected Result:**
- ✅ Button shows loading state while downloading
- ✅ CSV file downloads automatically
- ✅ File name includes date (e.g., `purchases-2025-01-15.csv`)
- ✅ Success toast message appears
- ✅ File opens correctly in Excel/Google Sheets

**What to Check:**
- ✅ Downloads work without errors
- ✅ Files contain correct data
- ✅ Error handling works if API fails

---

## Phase 4: Additional Admin Features Testing

### Test 4.1: Admin Reports Page
**URL:** `http://localhost:5000/admin/reports`

**Steps:**
1. Navigate to `/admin/reports` from sidebar
2. Verify page loads
3. Test date filters (if implemented)
4. Test CSV export buttons

**Expected Result:**
- ✅ Page loads correctly
- ✅ Shows summary cards
- ✅ Shows filters section
- ✅ Date inputs work (if backend supports filtering)
- ✅ Export buttons work
- ✅ Sidebar shows "Reports" as active

**What to Check:**
- ✅ Navigation works from sidebar
- ✅ All features match dashboard exports
- ✅ Page is responsive

---

### Test 4.2: Admin Users Page
**URL:** `http://localhost:5000/admin/users`

**Steps:**
1. Navigate to `/admin/users` from sidebar
2. Verify users table loads
3. Test search functionality:
   - Enter search term in search box
   - Click "Search" button
4. Test role filter:
   - Select "Admin" or "User" from dropdown
5. Test pagination:
   - Click "Next" and "Previous" buttons
   - Click page numbers
6. Test edit user:
   - Click "Edit" button on any user
   - Modal opens
   - Change role, name, or email verification status
   - Click "Save Changes"
   - Click "Cancel" to close modal

**Expected Result:**
- ✅ Users table displays correctly
- ✅ Shows user avatar, name, email, role, status, join date
- ✅ Search filters users correctly
- ✅ Role filter works
- ✅ Pagination works (if more than 20 users)
- ✅ Edit modal opens and closes correctly
- ✅ User updates save successfully
- ✅ Success toast appears after update
- ✅ Table refreshes after update

**What to Check:**
- ✅ All columns display correctly
- ✅ Badges show correct colors (admin=purple, user=blue)
- ✅ Verified/Unverified badges work
- ✅ Modal form validation works
- ✅ Error handling works

---

### Test 4.3: Admin Tests Page
**URL:** `http://localhost:5000/admin/tests`

**Steps:**
1. Navigate to `/admin/tests` from sidebar
2. Verify tests grid loads
3. Test search functionality
4. Test active/inactive filter
5. Test pagination
6. Test view test:
   - Click "View" button on any test
   - Modal opens with test details
   - Click "Close" to close modal
7. Test activate/deactivate:
   - Click "Activate" or "Deactivate" button
   - Verify status changes
8. Test delete:
   - Click "Delete" button
   - Confirm deletion in alert
   - Verify test is deactivated

**Expected Result:**
- ✅ Tests grid displays correctly
- ✅ Shows test cards with title, category, description, price, questions, duration
- ✅ Active/Inactive badges show correctly
- ✅ Search works
- ✅ Filter works
- ✅ Pagination works
- ✅ View modal shows full test details
- ✅ Activate/Deactivate toggles status
- ✅ Delete deactivates test (soft delete)
- ✅ Success toasts appear

**What to Check:**
- ✅ Cards display all information correctly
- ✅ Status badges update correctly
- ✅ Modal shows complete test information
- ✅ Actions work without errors
- ✅ Grid refreshes after actions

---

### Test 4.4: Admin Settings Page
**URL:** `http://localhost:5000/admin/settings`

**Steps:**
1. Navigate to `/admin/settings` from sidebar
2. Verify page loads
3. Fill in consent version form:
   - Enter version number
   - Enter Terms of Service URL
   - Enter Privacy Policy URL
   - Select effective date
4. Click "Save Settings"
5. Check system information section

**Expected Result:**
- ✅ Page loads correctly
- ✅ Consent form displays
- ✅ System information shows
- ✅ Form fields work correctly
- ✅ Date picker works
- ✅ Save button shows info message (API integration pending)

**What to Check:**
- ✅ Form validation works
- ✅ All sections display correctly
- ✅ Navigation works

---

## Complete User Flow Test

### End-to-End Test Scenario

**Scenario:** Admin wants to manage users and view reports

**Steps:**
1. **Login:**
   - Go to `/admin-login`
   - Enter admin credentials
   - Click "Login"
   - ✅ Redirects to dashboard

2. **View Dashboard:**
   - Check summary cards
   - View statistics
   - ✅ All data displays correctly

3. **Export Reports:**
   - Click "Export Purchases" from dashboard
   - ✅ CSV downloads
   - Go to Reports page
   - Export usage CSV
   - ✅ CSV downloads

4. **Manage Users:**
   - Go to Users page
   - Search for a user
   - Edit user role to "admin"
   - ✅ User role updates
   - Search for "admin" role
   - ✅ Filter shows only admins

5. **Manage Tests:**
   - Go to Tests page
   - Search for a test
   - View test details
   - Deactivate a test
   - ✅ Test status updates
   - Filter by "Inactive"
   - ✅ Shows deactivated test

6. **Check Settings:**
   - Go to Settings page
   - ✅ Page loads correctly

7. **Logout:**
   - Click profile dropdown
   - Click "Logout"
   - ✅ Redirects to `/admin-login`
   - ✅ Tokens cleared

---

## Common Issues & Troubleshooting

### Issue: Cannot login as admin
**Solution:**
- Verify user exists in database with `role: "admin"`
- Check email and password are correct
- Check backend logs for errors

### Issue: 401 Unauthorized errors
**Solution:**
- Check if token is being sent in Authorization header
- Verify token hasn't expired
- Check backend JWT secret configuration

### Issue: 403 Forbidden errors
**Solution:**
- Verify user role is "admin" in database
- Check `requireRole("admin")` middleware is working
- Verify token contains correct role

### Issue: CSV downloads not working
**Solution:**
- Check browser download settings
- Verify API endpoint returns correct Content-Type
- Check browser console for errors

### Issue: Pagination not working
**Solution:**
- Verify backend returns pagination data
- Check page/limit query parameters
- Verify frontend pagination state

### Issue: Search/Filter not working
**Solution:**
- Check API query parameters are sent correctly
- Verify backend handles search/filter parameters
- Check browser network tab for API calls

---

## Quick Verification Checklist

### Backend APIs ✅
- [ ] Admin login works
- [ ] Admin reports summary works
- [ ] CSV exports work
- [ ] User management APIs work
- [ ] Test management APIs work

### Frontend Authentication ✅
- [ ] Admin login page works
- [ ] Route protection works
- [ ] Non-admin users blocked
- [ ] Logout works

### Dashboard ✅
- [ ] Dashboard loads
- [ ] Summary cards show data
- [ ] Statistics display correctly
- [ ] CSV downloads work
- [ ] Layout components work

### Additional Features ✅
- [ ] Reports page works
- [ ] Users page works (list, search, edit)
- [ ] Tests page works (list, search, activate/deactivate, delete)
- [ ] Settings page works
- [ ] Navigation works between pages

---

## Test Data Recommendations

To properly test all features, ensure you have:

1. **At least 2 admin users** (to test user management)
2. **At least 5 regular users** (to test pagination and search)
3. **At least 3-5 tests** (some active, some inactive)
4. **Some purchase records** (to test reports)
5. **Some test attempts** (to test usage reports)

---

## Notes

- All admin routes require authentication and admin role
- CSV exports may take time if there's a lot of data
- Pagination shows 20 items per page by default
- Search is case-insensitive
- Test deletion is soft delete (sets isActive to false)

---

**Happy Testing! 🎉**

If you encounter any issues, check:
1. Browser console for errors
2. Network tab for API calls
3. Backend logs for server errors
4. Database for correct data


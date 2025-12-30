# Quick Test Checklist - Admin Panel

## 🚀 Quick Start Testing

### Prerequisites
- [ ] Backend server running (`npm run dev`)
- [ ] Frontend accessible at `http://localhost:5000`
- [ ] At least one admin user exists in database

---

## ✅ Phase 1: Backend APIs (5 min)

### Test Admin Login API
```
POST http://localhost:5000/api/admin/login
Body: { "email": "admin@example.com", "password": "password" }
Expected: Returns accessToken and refreshToken
```

### Test Admin Reports APIs
```
GET http://localhost:5000/api/admin/reports/summary
Header: Authorization: Bearer <token>
Expected: Returns summary statistics

GET http://localhost:5000/api/admin/reports/purchases/csv
Expected: Downloads CSV file

GET http://localhost:5000/api/admin/reports/usage/csv
Expected: Downloads CSV file
```

### Test User Management APIs
```
GET http://localhost:5000/api/admin/users?page=1&limit=10
Expected: Returns paginated users list

PUT http://localhost:5000/api/admin/users/{userId}
Body: { "role": "admin" }
Expected: Updates user successfully
```

### Test Test Management APIs
```
GET http://localhost:5000/api/admin/tests?page=1&limit=10
Expected: Returns paginated tests list

PUT http://localhost:5000/api/admin/tests/{testId}
Body: { "isActive": false }
Expected: Updates test successfully
```

---

## ✅ Phase 2: Frontend Authentication (3 min)

### Test Admin Login Page
1. Navigate to: `http://localhost:5000/admin-login`
2. Enter admin email and password
3. Click "Login"
4. ✅ Should redirect to `/admin/dashboard`

### Test Route Protection
1. Try accessing `/admin/dashboard` without login
2. ✅ Should redirect to `/admin-login`
3. Login as regular user (non-admin)
4. Try accessing `/admin/dashboard`
5. ✅ Should redirect to `/admin-login` or show error

---

## ✅ Phase 3: Admin Dashboard (5 min)

### Test Dashboard Load
1. Login as admin
2. Navigate to `/admin/dashboard`
3. ✅ Should see:
   - 4 summary cards (Purchases, Paid, Attempts Started, Completed)
   - Statistics section with progress bars
   - Quick actions section

### Test Layout Components
1. ✅ Header visible with logo and "Admin Panel"
2. ✅ Sidebar visible with "Dashboard" link highlighted
3. ✅ User profile dropdown works
4. ✅ Sidebar toggle works (mobile/desktop)

### Test CSV Downloads
1. Click "Export Purchases" button
2. ✅ CSV file downloads
3. Click "Export Usage" button
4. ✅ CSV file downloads

---

## ✅ Phase 4: Additional Features (10 min)

### Test Reports Page
1. Click "Reports" in sidebar
2. Navigate to `/admin/reports`
3. ✅ Page loads with summary cards
4. ✅ Export buttons work

### Test Users Page
1. Click "Users" in sidebar
2. Navigate to `/admin/users`
3. ✅ Users table displays
4. Test search: Enter email/name → Click "Search"
5. ✅ Search filters results
6. Test filter: Select "Admin" from role dropdown
7. ✅ Filter works
8. Test edit: Click "Edit" on any user
9. ✅ Modal opens
10. Change role to "admin" → Click "Save"
11. ✅ User updates successfully

### Test Tests Page
1. Click "Tests" in sidebar
2. Navigate to `/admin/tests`
3. ✅ Tests grid displays
4. Test search: Enter test title → Click "Search"
5. ✅ Search filters results
6. Test filter: Select "Active" from status dropdown
7. ✅ Filter works
8. Test view: Click "View" on any test
9. ✅ Modal opens with test details
10. Test activate: Click "Deactivate" on active test
11. ✅ Test status changes
12. Test delete: Click "Delete" on any test
13. ✅ Test is deactivated (soft delete)

### Test Settings Page
1. Click "Settings" in sidebar
2. Navigate to `/admin/settings`
3. ✅ Page loads
4. ✅ Consent form displays
5. ✅ System information displays

---

## 🔄 Complete Flow Test (5 min)

1. **Login** → `/admin-login` → Enter credentials → ✅ Redirects to dashboard
2. **Dashboard** → View summary → ✅ Data displays
3. **Export CSV** → Click export → ✅ File downloads
4. **Users** → Search → Edit user → ✅ Updates successfully
5. **Tests** → Search → View → Deactivate → ✅ Status changes
6. **Reports** → View reports → ✅ Page loads
7. **Settings** → View settings → ✅ Page loads
8. **Logout** → Profile dropdown → Logout → ✅ Redirects to login

---

## 🐛 Common Issues Quick Fix

| Issue | Quick Fix |
|-------|-----------|
| Cannot login | Check user has `role: "admin"` in database |
| 401 Unauthorized | Check token in Authorization header |
| 403 Forbidden | Verify user role is "admin" |
| CSV not downloading | Check browser download settings |
| Pagination not working | Verify backend returns pagination data |
| Search not working | Check API query parameters |

---

## 📊 Expected Results Summary

| Feature | Expected Result |
|---------|----------------|
| Admin Login | Redirects to dashboard, stores tokens |
| Dashboard | Shows 4 summary cards + statistics |
| CSV Export | Downloads file with date in filename |
| User List | Shows table with pagination |
| User Search | Filters users by email/name |
| User Edit | Updates user role/details |
| Test List | Shows grid with test cards |
| Test Search | Filters tests by title/category |
| Test Activate | Toggles isActive status |
| Test Delete | Sets isActive to false |
| Route Protection | Blocks non-admin users |
| Navigation | Sidebar highlights active page |

---

## ⏱️ Total Testing Time: ~30 minutes

**Quick Test (Essential):** ~15 minutes
**Full Test (All Features):** ~30 minutes
**Complete Test (Including Edge Cases):** ~45 minutes

---

**✅ If all checks pass, your admin panel is working correctly!**


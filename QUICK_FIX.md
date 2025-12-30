# Quick Fix: "No assessments found" Issue

## Problem
The "All Assessments" page shows "No assessments found" because:
1. There are no tests in the database, OR
2. MongoDB is not running/connected

## Solution Steps

### Step 1: Check if MongoDB is Running

**For Local MongoDB:**
- Windows: Check if MongoDB service is running in Services
- Mac/Linux: Run `mongod` or check with `brew services list` (Mac)

**For MongoDB Atlas:**
- Verify your connection string in `.env` file is correct

### Step 2: Verify Backend is Running

Make sure your backend server is running:
```bash
cd Server
npm start
# or
npm run dev
```

### Step 3: Check Browser Console

1. Open browser DevTools (F12)
2. Go to Console tab
3. Look for `API Response:` log
4. Check for any error messages

### Step 4: Create Sample Test Data

Run the script to create a sample test:

```bash
cd Server
node src/Scripts/createSampleTest.js
```

**If you get MongoDB connection error:**
- Make sure MongoDB is running
- Check your `.env` file has correct `MONGO_URI`
- For MongoDB Atlas, use the full connection string

### Step 5: Verify Test Created

After running the script successfully, you should see:
```
✅ Sample test created successfully!
📋 Test ID: [some-id]
📝 Test Title: Depression Screening Test
```

### Step 6: Refresh Browser

Refresh the "All Assessments" page - you should now see the test!

---

## Alternative: Manual Test Creation

If the script doesn't work, you can create a test manually:

1. Use MongoDB Compass or any MongoDB client
2. Connect to your database
3. Go to `tests` collection
4. Insert a test document with required fields (see `Server/src/Model/Test.js`)

---

## Still Not Working?

Check these:
- ✅ Backend server is running
- ✅ MongoDB is connected (check backend logs)
- ✅ `.env` file has correct `MONGO_URI`
- ✅ Browser console shows API response
- ✅ Network tab shows successful API call to `/api/tests`


/**
 * Script to create a sample test for testing purposes
 * Run with: node src/Scripts/createSampleTest.js
 * 
 * Note: Uses the same .env file location as the server (root level)
 */

const path = require('path');
// Use the same .env path as server.js (root level, two levels up from this script)
require('dotenv').config({ path: path.join(__dirname, '../../../.env') });
const mongoose = require('mongoose');
const { Test } = require('../model/Test');

const sampleTest = {
  title: "Depression Screening Test",
  category: "Mental Health",
  shortDescription: "A quick screening tool to assess symptoms of depression.",
  longDescription: "This assessment helps identify symptoms of depression. Please answer all questions honestly based on how you've been feeling over the past two weeks.",
  
  durationMinutesMin: 5,
  durationMinutesMax: 10,
  questionsCount: 9,
  
  price: 0, // Free test
  mrp: 0,
  
  imageUrl: "",
  tag: "Research-Based",
  
  timeLimitSeconds: 0, // No time limit
  
  schemaJson: {
    questions: [
      {
        id: "q1",
        text: "Little interest or pleasure in doing things",
        type: "radio",
        required: true,
        options: [
          { value: 0, label: "Not at all" },
          { value: 1, label: "Several days" },
          { value: 2, label: "More than half the days" },
          { value: 3, label: "Nearly every day" }
        ]
      },
      {
        id: "q2",
        text: "Feeling down, depressed, or hopeless",
        type: "radio",
        required: true,
        options: [
          { value: 0, label: "Not at all" },
          { value: 1, label: "Several days" },
          { value: 2, label: "More than half the days" },
          { value: 3, label: "Nearly every day" }
        ]
      },
      {
        id: "q3",
        text: "Trouble falling or staying asleep, or sleeping too much",
        type: "radio",
        required: true,
        options: [
          { value: 0, label: "Not at all" },
          { value: 1, label: "Several days" },
          { value: 2, label: "More than half the days" },
          { value: 3, label: "Nearly every day" }
        ]
      },
      {
        id: "q4",
        text: "Feeling tired or having little energy",
        type: "radio",
        required: true,
        options: [
          { value: 0, label: "Not at all" },
          { value: 1, label: "Several days" },
          { value: 2, label: "More than half the days" },
          { value: 3, label: "Nearly every day" }
        ]
      },
      {
        id: "q5",
        text: "Poor appetite or overeating",
        type: "radio",
        required: true,
        options: [
          { value: 0, label: "Not at all" },
          { value: 1, label: "Several days" },
          { value: 2, label: "More than half the days" },
          { value: 3, label: "Nearly every day" }
        ]
      },
      {
        id: "q6",
        text: "Feeling bad about yourself or that you are a failure",
        type: "radio",
        required: true,
        options: [
          { value: 0, label: "Not at all" },
          { value: 1, label: "Several days" },
          { value: 2, label: "More than half the days" },
          { value: 3, label: "Nearly every day" }
        ]
      },
      {
        id: "q7",
        text: "Trouble concentrating on things, such as reading or watching TV",
        type: "radio",
        required: true,
        options: [
          { value: 0, label: "Not at all" },
          { value: 1, label: "Several days" },
          { value: 2, label: "More than half the days" },
          { value: 3, label: "Nearly every day" }
        ]
      },
      {
        id: "q8",
        text: "Moving or speaking so slowly that other people could have noticed",
        type: "radio",
        required: true,
        options: [
          { value: 0, label: "Not at all" },
          { value: 1, label: "Several days" },
          { value: 2, label: "More than half the days" },
          { value: 3, label: "Nearly every day" }
        ]
      },
      {
        id: "q9",
        text: "Thoughts that you would be better off dead",
        type: "radio",
        required: true,
        options: [
          { value: 0, label: "Not at all" },
          { value: 1, label: "Several days" },
          { value: 2, label: "More than half the days" },
          { value: 3, label: "Nearly every day" }
        ]
      }
    ]
  },
  
  eligibilityRules: {},
  
  scoringRules: {
    type: "sum",
    items: ["q1", "q2", "q3", "q4", "q5", "q6", "q7", "q8", "q9"],
    bands: [
      { min: 0, max: 4, label: "Minimal" },
      { min: 5, max: 9, label: "Mild" },
      { min: 10, max: 14, label: "Moderate" },
      { min: 15, max: 19, label: "Moderately Severe" },
      { min: 20, max: 27, label: "Severe" }
    ]
  },
  
  riskRules: {
    triggers: [
      {
        questionId: "q9",
        gte: 2,
        flag: "suicidal_ideation",
        helpText: "If you're experiencing thoughts of self-harm, please reach out for immediate help. Contact a mental health professional or crisis helpline."
      }
    ]
  },
  
  isActive: true,
  popularityScore: 100
};

async function createSampleTest() {
  try {
    // Connect to MongoDB - use the same connection method as the app
    const mongoUri = process.env.MONGO_URI;
    if (!mongoUri) {
      console.error('❌ MONGO_URI not found in environment variables.');
      console.error('Please check your .env file at the root of the project.');
      console.error('Make sure MONGO_URI is set (e.g., mongodb://localhost:27017/mentalhealth or MongoDB Atlas connection string)');
      process.exit(1);
    }
    
    console.log('🔌 Connecting to MongoDB...');
    mongoose.set("strictQuery", true);
    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
    });
    console.log('✅ Connected to MongoDB successfully');

    // Check if test already exists
    const existingTest = await Test.findOne({ title: sampleTest.title });
    if (existingTest) {
      console.log('⚠️  Test already exists with ID:', existingTest._id);
      console.log('Test Title:', existingTest.title);
      await mongoose.disconnect();
      return;
    }

    // Create the test
    const test = await Test.create(sampleTest);
    console.log('\n✅ Sample test created successfully!');
    console.log('📋 Test ID:', test._id);
    console.log('📝 Test Title:', test.title);
    console.log('💰 Price: Free (₹0)');
    console.log('📊 Questions: 9');
    console.log('\n🎉 You can now see this test in the "All Assessments" page!\n');
    
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  } catch (error) {
    if (error.name === 'MongooseServerSelectionError') {
      console.error('\n❌ MongoDB Connection Error:');
      console.error('MongoDB is not running or connection string is incorrect.');
      console.error('\n📝 Please check:');
      console.error('1. Is MongoDB running? (Start MongoDB service)');
      console.error('2. Is MONGO_URI correct in your .env file?');
      console.error('3. For MongoDB Atlas, check your connection string');
      console.error('\n💡 Error details:', error.message);
    } else {
      console.error('\n❌ Error creating sample test:', error.message);
      console.error('Full error:', error);
    }
    await mongoose.disconnect().catch(() => {});
    process.exit(1);
  }
}

createSampleTest();


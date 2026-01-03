/**
 * Script to create 3 assessments:
 * - Assessment 1: 10 questions, FREE
 * - Assessment 2: 15 questions, FREE
 * - Assessment 3: 20 questions, PAID
 * 
 * Run with: node src/Scripts/createThreeAssessments.js
 * 
 * Note: Uses the same .env file location as the server (root level)
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../../.env') });
const mongoose = require('mongoose');
const { Test } = require('../Model/Test');

/**
 * Generate questions with 4 options each
 */
function generateQuestions(count, assessmentNumber) {
  const questions = [];
  const optionLabels = [
    ["Not at all", "Rarely", "Sometimes", "Often"],
    ["Never", "Seldom", "Occasionally", "Frequently"],
    ["Strongly Disagree", "Disagree", "Agree", "Strongly Agree"],
    ["Not applicable", "Slightly", "Moderately", "Very much"]
  ];
  
  const questionTemplates = [
    "How often do you feel anxious or worried?",
    "Do you experience difficulty sleeping?",
    "How would you rate your overall mood?",
    "Do you feel motivated to complete daily tasks?",
    "How often do you feel overwhelmed?",
    "Do you experience physical symptoms of stress?",
    "How would you describe your energy levels?",
    "Do you find it difficult to concentrate?",
    "How often do you feel isolated or alone?",
    "Do you engage in activities you once enjoyed?",
    "How would you rate your self-esteem?",
    "Do you experience mood swings?",
    "How often do you feel irritable?",
    "Do you have difficulty making decisions?",
    "How would you describe your appetite?",
    "Do you experience feelings of hopelessness?",
    "How often do you feel restless?",
    "Do you have difficulty managing daily responsibilities?",
    "How would you rate your social interactions?",
    "Do you experience physical tension or pain?"
  ];

  for (let i = 0; i < count; i++) {
    const questionIndex = i % questionTemplates.length;
    const optionSet = optionLabels[i % optionLabels.length];
    
    questions.push({
      id: `q${i + 1}`,
      text: `Assessment ${assessmentNumber} - ${questionTemplates[questionIndex]}`,
      type: "radio",
      required: true,
      options: [
        { value: 0, label: optionSet[0] },
        { value: 1, label: optionSet[1] },
        { value: 2, label: optionSet[2] },
        { value: 3, label: optionSet[3] }
      ]
    });
  }
  
  return questions;
}

/**
 * Generate scoring bands based on question count
 */
function generateScoringBands(questionCount) {
  const maxScore = questionCount * 3; // Max value per question is 3
  const bandCount = 5;
  const bandSize = Math.ceil(maxScore / bandCount);
  
  const bands = [];
  for (let i = 0; i < bandCount; i++) {
    const min = i * bandSize;
    const max = Math.min((i + 1) * bandSize - 1, maxScore);
    const labels = ["Very Low", "Low", "Moderate", "High", "Very High"];
    bands.push({
      min: min,
      max: max,
      label: labels[i] || `Level ${i + 1}`
    });
  }
  
  return bands;
}

/**
 * Generate question IDs array for scoring
 */
function generateQuestionIds(count) {
  return Array.from({ length: count }, (_, i) => `q${i + 1}`);
}

// Assessment 1: 10 questions, FREE
const assessment1 = {
  title: "Mental Health Assessment - Basic",
  category: "Mental Health",
  shortDescription: "A comprehensive 10-question assessment to evaluate your mental well-being.",
  longDescription: "This assessment consists of 10 carefully selected questions designed to help you understand your current mental health status. Answer honestly based on your recent experiences over the past few weeks.",
  
  durationMinutesMin: 5,
  durationMinutesMax: 8,
  questionsCount: 10,
  
  price: 0, // FREE
  mrp: 0,
  
  imageUrl: "",
  tag: "Research-Based",
  
  timeLimitSeconds: 0, // No time limit
  
  schemaJson: {
    questions: generateQuestions(10, 1)
  },
  
  eligibilityRules: {},
  
  scoringRules: {
    type: "sum",
    items: generateQuestionIds(10),
    bands: generateScoringBands(10)
  },
  
  riskRules: {},
  
  isActive: true,
  popularityScore: 100
};

// Assessment 2: 15 questions, FREE
const assessment2 = {
  title: "Mental Health Assessment - Standard",
  category: "Mental Health",
  shortDescription: "An in-depth 15-question assessment providing detailed insights into your mental wellness.",
  longDescription: "This comprehensive 15-question assessment offers a more detailed evaluation of your mental health. Take your time to reflect on each question and provide accurate responses based on your experiences.",
  
  durationMinutesMin: 8,
  durationMinutesMax: 12,
  questionsCount: 15,
  
  price: 0, // FREE
  mrp: 0,
  
  imageUrl: "",
  tag: "Research-Based",
  
  timeLimitSeconds: 0, // No time limit
  
  schemaJson: {
    questions: generateQuestions(15, 2)
  },
  
  eligibilityRules: {},
  
  scoringRules: {
    type: "sum",
    items: generateQuestionIds(15),
    bands: generateScoringBands(15)
  },
  
  riskRules: {},
  
  isActive: true,
  popularityScore: 150
};

// Assessment 3: 20 questions, PAID
const assessment3 = {
  title: "Mental Health Assessment - Premium",
  category: "Mental Health",
  shortDescription: "A comprehensive 20-question premium assessment with detailed analysis and personalized insights.",
  longDescription: "Our premium assessment includes 20 carefully crafted questions that provide a thorough evaluation of your mental health. This detailed assessment offers comprehensive insights and personalized recommendations based on your responses.",
  
  durationMinutesMin: 12,
  durationMinutesMax: 18,
  questionsCount: 20,
  
  price: 500, // PAID
  mrp: 750,
  
  imageUrl: "",
  tag: "Premium",
  
  timeLimitSeconds: 0, // No time limit
  
  schemaJson: {
    questions: generateQuestions(20, 3)
  },
  
  eligibilityRules: {},
  
  scoringRules: {
    type: "sum",
    items: generateQuestionIds(20),
    bands: generateScoringBands(20)
  },
  
  riskRules: {},
  
  isActive: true,
  popularityScore: 200
};

async function createThreeAssessments() {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGO_URI;
    if (!mongoUri) {
      console.error('❌ MONGO_URI not found in environment variables.');
      console.error('Please check your .env file at the root of the project.');
      process.exit(1);
    }
    
    console.log('🔌 Connecting to MongoDB...');
    mongoose.set("strictQuery", true);
    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
    });
    console.log('✅ Connected to MongoDB successfully\n');

    const assessments = [
      { name: "Assessment 1 (10 questions, FREE)", data: assessment1 },
      { name: "Assessment 2 (15 questions, FREE)", data: assessment2 },
      { name: "Assessment 3 (20 questions, PAID)", data: assessment3 }
    ];

    const results = [];

    for (const assessment of assessments) {
      // Check if test already exists
      const existingTest = await Test.findOne({ title: assessment.data.title });
      if (existingTest) {
        console.log(`⚠️  ${assessment.name} already exists with ID: ${existingTest._id}`);
        console.log(`   Title: ${existingTest.title}`);
        results.push({ name: assessment.name, status: 'exists', id: existingTest._id });
        continue;
      }

      // Create the test
      const test = await Test.create(assessment.data);
      console.log(`✅ ${assessment.name} created successfully!`);
      console.log(`   📋 Test ID: ${test._id}`);
      console.log(`   📝 Title: ${test.title}`);
      console.log(`   💰 Price: ₹${test.price}${test.mrp > test.price ? ` (MRP: ₹${test.mrp})` : ''}`);
      console.log(`   📊 Questions: ${test.questionsCount}`);
      console.log(`   🏷️  Tag: ${test.tag}\n`);
      
      results.push({ name: assessment.name, status: 'created', id: test._id });
    }

    console.log('\n📊 Summary:');
    console.log('='.repeat(50));
    results.forEach(result => {
      const icon = result.status === 'created' ? '✅' : '⚠️';
      console.log(`${icon} ${result.name}: ${result.status} (ID: ${result.id})`);
    });
    console.log('='.repeat(50));
    console.log('\n🎉 All assessments processed!');
    console.log('You can now see these assessments in the "All Assessments" page!\n');
    
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
      console.error('\n❌ Error creating assessments:', error.message);
      console.error('Full error:', error);
    }
    await mongoose.disconnect().catch(() => {});
    process.exit(1);
  }
}

createThreeAssessments();


const { asyncHandler } = require("../utils/Asynchandler");
const { Result } = require("../model/Result");
const { generateResultPdf } = require("../services/pdf.service");
const fs = require("fs");
const path = require("path");

/**
 * Generate and download PDF report for a result
 * Creates PDF file and streams it to the client
 */
exports.downloadReport = asyncHandler(async (req, res) => {
  const { resultId } = req.params;
  const userId = req.user._id;
  
  // Find result and verify ownership
  const result = await Result.findById(resultId)
    .populate("testId", "title")
    .populate("userId", "firstName lastName email")
    .populate("attemptId");
  
  if (!result) {
    return res.status(404).json({ success: false, message: "Result not found" });
  }
  
  // Verify ownership
  // When populated, result.userId is a document, otherwise it's an ObjectId
  const resultUserId = result.userId._id ? result.userId._id : result.userId;
  if (resultUserId.toString() !== userId.toString()) {
    return res.status(403).json({ success: false, message: "Forbidden" });
  }
  
  // Prepare user label (userId is populated, so we can access firstName, lastName, email)
  const userLabel = result.userId.firstName && result.userId.lastName
    ? `${result.userId.firstName} ${result.userId.lastName}`
    : result.userId.email || "User";
  
  // Prepare interpretation text
  const interpretationText = result.interpretation?.text 
    || result.interpretation?.description
    || `Score: ${result.score}${result.band ? ` | Band: ${result.band}` : ""}`;
  
  // Generate PDF filename
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
  const fileName = `report-${resultId}-${timestamp}.pdf`;
  
  try {
    // Generate PDF file
    const filePath = await generateResultPdf({
      fileName,
      userLabel,
      testTitle: result.testId.title,
      score: result.score,
      band: result.band || "",
      interpretationText
    });
    
    // Set headers for PDF download
    const safeFileName = `Assessment-Report-${result.testId.title.replace(/[^a-z0-9]/gi, "-")}-${timestamp}.pdf`;
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${safeFileName}"`);
    
    // Stream file to response
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);
    
    // Clean up file after streaming (optional - can also keep for caching)
    fileStream.on("end", () => {
      // Optionally delete file after sending
      // fs.unlink(filePath, (err) => { if (err) console.error("Error deleting temp file:", err); });
    });
    
    fileStream.on("error", (error) => {
      console.error("Error streaming PDF:", error);
      if (!res.headersSent) {
        res.status(500).json({ success: false, message: "Error generating report" });
      }
    });
    
  } catch (error) {
    console.error("Error generating PDF report:", error);
    return res.status(500).json({ 
      success: false, 
      message: "Error generating report" 
    });
  }
});

/**
 * Get report data (JSON format)
 * Returns all data needed to generate a report without generating PDF
 */
exports.getReportData = asyncHandler(async (req, res) => {
  const { resultId } = req.params;
  const userId = req.user._id;
  
  // Find result and verify ownership
  const result = await Result.findById(resultId)
    .populate("testId")
    .populate("userId", "firstName lastName email")
    .populate("attemptId");
  
  if (!result) {
    return res.status(404).json({ success: false, message: "Result not found" });
  }
  
  // Verify ownership
  // When populated, result.userId is a document, otherwise it's an ObjectId
  const resultUserId = result.userId._id ? result.userId._id : result.userId;
  if (resultUserId.toString() !== userId.toString()) {
    return res.status(403).json({ success: false, message: "Forbidden" });
  }
  
  const resultData = result.toObject();
  
  return res.json({
    success: true,
    message: "Report data retrieved successfully",
    data: resultData
  });
});


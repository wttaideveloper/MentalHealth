const PDFDocument = require("pdfkit");
const fs = require("fs");
const path = require("path");

function ensureDir(dirPathValue) {
  if (!fs.existsSync(dirPathValue)) fs.mkdirSync(dirPathValue, { recursive: true });
}

async function generateResultPdf({ fileName, userLabel, testTitle, score, band, interpretationText, categoryResults }) {
  const outDir = path.join(process.cwd(), "generated");
  ensureDir(outDir);

  const filePath = path.join(outDir, fileName);
  const doc = new PDFDocument({ size: "A4", margin: 50 });
  const writeStream = fs.createWriteStream(filePath);

  doc.pipe(writeStream);

  doc.fontSize(18).text("Assessment Report", { align: "center" });
  doc.moveDown();

  doc.fontSize(12).text(`User: ${userLabel}`);
  doc.text(`Test: ${testTitle}`);
  doc.text(`Score: ${score}`);
  doc.text(`Band: ${band || "-"}`);
  doc.moveDown();

  // Add category results section if available
  if (categoryResults && typeof categoryResults === 'object' && Object.keys(categoryResults).length > 0) {
    doc.fontSize(14).text("Category Results", { underline: true });
    doc.moveDown(0.5);
    
    for (const [categoryName, categoryData] of Object.entries(categoryResults)) {
      // Handle both Map structure (from Mongoose) and plain object
      const categoryInfo = categoryData && typeof categoryData === 'object' 
        ? categoryData 
        : { score: categoryData };
      
      doc.fontSize(12).font('Helvetica-Bold').text(categoryName);
      doc.font('Helvetica');
      doc.fontSize(11).text(`Score: ${categoryInfo.score || 0}`, { indent: 20 });
      
      if (categoryInfo.band) {
        doc.text(`Severity Level: ${categoryInfo.band}`, { indent: 20 });
      }
      
      if (categoryInfo.answeredCount !== undefined && categoryInfo.totalItems !== undefined) {
        doc.text(`Questions: ${categoryInfo.answeredCount} / ${categoryInfo.totalItems}`, { indent: 20 });
      }
      
      if (categoryInfo.bandDescription) {
        doc.text(`Description: ${categoryInfo.bandDescription}`, { indent: 20 });
      }
      
      doc.moveDown(0.3);
    }
    doc.moveDown();
  }

  doc.fontSize(12).text("Interpretation");
  doc.moveDown(0.5);
  doc.fontSize(11).text(interpretationText || "—");

  doc.end();

  await new Promise((resolve) => writeStream.on("finish", resolve));
  return filePath;
}

async function generateInvoicePdf({ fileName, invoiceNumber, totalAmount, gstAmount, gstPercent }) {
  const outDir = require("path").join(process.cwd(), "generated");
  ensureDir(outDir);

  const filePath = require("path").join(outDir, fileName);
  const doc = new PDFDocument({ size: "A4", margin: 50 });
  const writeStream = fs.createWriteStream(filePath);

  doc.pipe(writeStream);

  doc.fontSize(18).text("Tax Invoice", { align: "center" });
  doc.moveDown();

  doc.fontSize(12).text(`Invoice: ${invoiceNumber}`);
  doc.text(`GST: ${gstPercent}%`);
  doc.text(`GST Amount: ${gstAmount}`);
  doc.text(`Total: ${totalAmount}`);
  doc.end();

  await new Promise((resolve) => writeStream.on("finish", resolve));
  return filePath;
}

module.exports = { generateResultPdf, generateInvoicePdf };

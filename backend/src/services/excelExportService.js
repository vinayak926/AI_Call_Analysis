// backend/src/services/excelExportService.js
// ─────────────────────────────────────────────────────────────────
// Automatically appends one row to the master Excel report file
// every time a call analysis is completed.
//
// File location: backend/exports/sales_call_report.xlsx
// One row = one analysed call.
// If the file does not exist yet, it is created with headers.
//
// Usage (called from analysisWorker.js after pipeline completes):
//   const { appendToExcel } = require("./excelExportService");
//   await appendToExcel(callAnalysis, audioRecording);
// ─────────────────────────────────────────────────────────────────

const path = require("path");
const fs = require("fs");
const ExcelJS = require("exceljs");

// ── Path where the Excel report is saved ─────────────────────────
// You can override this via EXCEL_EXPORT_DIR in your .env
const EXPORT_DIR = process.env.EXCEL_EXPORT_DIR
    || path.join(__dirname, "../../../exports");

const EXPORT_FILE = path.join(EXPORT_DIR, "sales_call_report.xlsx");

// ── Column definitions (order = Excel column order) ───────────────
// Each entry maps a header label to a value extractor function.
// extractor receives (callAnalysis, audioRecording, uploaderName)
const COLUMNS = [
    {
        header: "Date",
        key: "date",
        width: 14,
        value: (a) =>
            new Date(a.createdAt).toLocaleDateString("en-IN", {
                day: "2-digit", month: "2-digit", year: "numeric",
            }),
    },
    {
        header: "Time",
        key: "time",
        width: 10,
        value: (a) =>
            new Date(a.createdAt).toLocaleTimeString("en-IN", {
                hour: "2-digit", minute: "2-digit", hour12: true,
            }),
    },
    {
        header: "Student Name",
        key: "studentName",
        width: 20,
        value: (a) => a.studentName || "—",
    },
    {
        header: "Counsellor",
        key: "counsellorName",
        width: 20,
        value: (a, _r, uploaderName) => a.counsellorName || uploaderName || "—",
    },
    {
        header: "Course Interested",
        key: "courseInterested",
        width: 22,
        value: (a) => a.courseInterested || "—",
    },
    {
        header: "City",
        key: "city",
        width: 16,
        value: (a) => a.city || "—",
    },
    {
        header: "Sentiment",
        key: "sentiment",
        width: 12,
        value: (a) => a.sentiment,
    },
    {
        header: "Interested?",
        key: "interested",
        width: 12,
        value: (a) => (a.interested ? "Yes" : "No"),
    },
    {
        header: "Lead Score (1-10)",
        key: "leadScore",
        width: 16,
        value: (a) => a.leadScore,
    },
    {
        header: "Closing Probability (%)",
        key: "closingProbability",
        width: 22,
        value: (a) => a.closingProbability ?? "—",
    },
    {
        header: "Follow-up Required?",
        key: "followUpRequired",
        width: 18,
        value: (a) => (a.followUpRequired ? "Yes" : "No"),
    },
    {
        header: "Follow-up Date",
        key: "followUpDate",
        width: 16,
        value: (a) => a.followUpDate || "—",
    },
    {
        header: "Main Concerns",
        key: "keyConcerns",
        width: 30,
        value: (a) =>
            Array.isArray(a.keyConcerns) && a.keyConcerns.length
                ? a.keyConcerns.join(", ")
                : "—",
    },
    {
        header: "Fees Issue?",
        key: "feesIssue",
        width: 12,
        value: (a) => (a.feesIssue ? "Yes" : "No"),
    },
    {
        header: "Placement Concern?",
        key: "placementConcern",
        width: 18,
        value: (a) => (a.placementConcern ? "Yes" : "No"),
    },
    {
        header: "Parent Concern?",
        key: "parentConcern",
        width: 16,
        value: (a) => (a.parentConcern ? "Yes" : "No"),
    },
    {
        header: "Timing Concern?",
        key: "timingConcern",
        width: 16,
        value: (a) => (a.timingConcern ? "Yes" : "No"),
    },
    {
        header: "Communication Score",
        key: "communicationScore",
        width: 20,
        value: (a) => a.communicationScore ?? "—",
    },
    {
        header: "Engagement Score",
        key: "engagementScore",
        width: 18,
        value: (a) => a.engagementScore ?? "—",
    },
    {
        header: "Confidence Score",
        key: "counsellorConfidenceScore",
        width: 18,
        value: (a) => a.counsellorConfidenceScore ?? "—",
    },
    {
        header: "Language Detected",
        key: "detectedLanguage",
        width: 18,
        value: (a) => a.transcript?.detectedLanguage || "—",
    },
    {
        header: "Audio File",
        key: "audioFile",
        width: 28,
        value: (_a, r) => r?.originalFileName || "—",
    },
    {
        header: "AI Summary",
        key: "callSummary",
        width: 60,
        value: (a) => a.callSummary || "—",
    },
];

// ── Header row style ──────────────────────────────────────────────
const HEADER_FILL = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF1A1A2E" },   // dark navy
};
const HEADER_FONT = {
    bold: true,
    color: { argb: "FFFFFFFF" },
    size: 11,
};

// ── Sentiment cell colours ────────────────────────────────────────
const SENTIMENT_COLORS = {
    Positive: "FFD4EDDA",   // soft green
    Negative: "FFF8D7DA",   // soft red
    Neutral: "FFFFF3CD",   // soft amber
};

// ── Lead score cell colour (green → amber → red) ──────────────────
function leadScoreColor(score) {
    if (score >= 8) return "FFD4EDDA";   // green
    if (score >= 5) return "FFFFF3CD";   // amber
    return "FFF8D7DA";                   // red
}

// ─────────────────────────────────────────────────────────────────
// ensureWorkbook — loads existing file or creates a fresh one
// Returns { workbook, worksheet, isNew }
// ─────────────────────────────────────────────────────────────────
async function ensureWorkbook() {
    const workbook = new ExcelJS.Workbook();
    const sheetName = "Call Reports";

    if (fs.existsSync(EXPORT_FILE)) {
        await workbook.xlsx.readFile(EXPORT_FILE);
        const worksheet = workbook.getWorksheet(sheetName);
        if (worksheet) {
            return { workbook, worksheet, isNew: false };
        }
        // Sheet missing inside existing file — create it
        const ws = workbook.addWorksheet(sheetName);
        return { workbook, worksheet: ws, isNew: true };
    }

    // File does not exist yet — create everything from scratch
    const worksheet = workbook.addWorksheet(sheetName);
    return { workbook, worksheet, isNew: true };
}

// ─────────────────────────────────────────────────────────────────
// setupHeaders — writes the header row with styling
// Only called when the sheet is brand new
// ─────────────────────────────────────────────────────────────────
function setupHeaders(worksheet) {
    // Set column widths and keys
    worksheet.columns = COLUMNS.map((col) => ({
        header: col.header,
        key: col.key,
        width: col.width,
    }));

    // Style the header row
    const headerRow = worksheet.getRow(1);
    headerRow.eachCell((cell) => {
        cell.fill = HEADER_FILL;
        cell.font = HEADER_FONT;
        cell.border = {
            bottom: { style: "medium", color: { argb: "FF4A90D9" } },
        };
        cell.alignment = { vertical: "middle", horizontal: "center", wrapText: false };
    });
    headerRow.height = 22;

    // Freeze the header row so it stays visible while scrolling
    worksheet.views = [{ state: "frozen", ySplit: 1 }];
}

// ─────────────────────────────────────────────────────────────────
// appendToExcel — main exported function
//
// @param {Object} callAnalysis   — saved CallAnalysis mongoose doc
// @param {Object} audioRecording — saved AudioRecording mongoose doc
// @param {string} uploaderName   — full name of the user who uploaded
// ─────────────────────────────────────────────────────────────────
async function appendToExcel(callAnalysis, audioRecording, uploaderName = "") {
    // Ensure the exports directory exists
    if (!fs.existsSync(EXPORT_DIR)) {
        fs.mkdirSync(EXPORT_DIR, { recursive: true });
        console.log(`📁 Created exports directory: ${EXPORT_DIR}`);
    }

    const { workbook, worksheet, isNew } = await ensureWorkbook();

    // Write headers only if this is a brand new sheet
    if (isNew) {
        setupHeaders(worksheet);
    }

    // ── Build the row values in column order ──────────────────────
    const rowValues = {};
    COLUMNS.forEach((col) => {
        rowValues[col.key] = col.value(callAnalysis, audioRecording, uploaderName);
    });

    // ── Append the row ────────────────────────────────────────────
    const newRow = worksheet.addRow(rowValues);
    newRow.height = 18;

    // ── Style: wrap the AI Summary cell so long text is readable ──
    const summaryColIndex = COLUMNS.findIndex((c) => c.key === "callSummary") + 1;
    if (summaryColIndex > 0) {
        newRow.getCell(summaryColIndex).alignment = {
            wrapText: true,
            vertical: "top",
        };
    }

    // ── Style: colour the Sentiment cell ─────────────────────────
    const sentimentColIndex = COLUMNS.findIndex((c) => c.key === "sentiment") + 1;
    if (sentimentColIndex > 0) {
        const sentimentCell = newRow.getCell(sentimentColIndex);
        const color = SENTIMENT_COLORS[callAnalysis.sentiment] || "FFFFFFFF";
        sentimentCell.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: color },
        };
        sentimentCell.font = { bold: true };
    }

    // ── Style: colour the Lead Score cell ────────────────────────
    const leadScoreColIndex = COLUMNS.findIndex((c) => c.key === "leadScore") + 1;
    if (leadScoreColIndex > 0) {
        const leadCell = newRow.getCell(leadScoreColIndex);
        leadCell.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: leadScoreColor(callAnalysis.leadScore) },
        };
        leadCell.font = { bold: true };
        leadCell.alignment = { horizontal: "center" };
    }

    // ── Save the file ─────────────────────────────────────────────
    await workbook.xlsx.writeFile(EXPORT_FILE);

    console.log(
        `📊 Excel updated: row ${worksheet.rowCount} — ` +
        `${callAnalysis.studentName || "Unknown"} | ` +
        `Score: ${callAnalysis.leadScore}/10 | ` +
        `${callAnalysis.sentiment}`
    );

    return EXPORT_FILE;
}

module.exports = { appendToExcel, EXPORT_FILE };
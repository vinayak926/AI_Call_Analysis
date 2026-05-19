// backend/src/services/notificationService.js
// ─────────────────────────────────────────────────────────────────
// Auto-alert system — sends email notifications after call analysis
//
// Three alert conditions (from the document Section 8C):
//   1. HOT LEAD     — student is highly interested (leadScore >= 8)
//   2. FOLLOW-UP    — follow-up is required (followUpRequired = true)
//   3. POOR QUALITY — counsellor performed poorly (communicationScore <= 4)
//
// Who gets notified:
//   - All super_admin and company_admin users in the database
//   - Plus ADMIN_EMAIL from .env as a guaranteed fallback
//
// Non-blocking: all errors are caught and logged — a failed email
// never breaks the analysis pipeline.
//
// Usage (called from analysisWorker.js):
//   const { sendAnalysisAlerts } = require("./notificationService");
//   await sendAnalysisAlerts(callAnalysis, uploaderName);
// ─────────────────────────────────────────────────────────────────

const nodemailer = require("nodemailer");
const User = require("../models/User");
const Notification = require("../models/Notification");

// ── Alert thresholds ──────────────────────────────────────────────
const HOT_LEAD_THRESHOLD = 8;   // leadScore >= this → hot lead alert
const POOR_QUALITY_THRESHOLD = 4;   // communicationScore <= this → poor quality alert

// ── Lazy transporter — created once, reused ───────────────────────
let _transporter = null;

function getTransporter() {
    if (_transporter) return _transporter;

    const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;

    if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
        throw new Error(
            "Email not configured. Set SMTP_HOST, SMTP_USER, SMTP_PASS in .env"
        );
    }

    _transporter = nodemailer.createTransport({
        host: SMTP_HOST,
        port: parseInt(SMTP_PORT || "587", 10),
        secure: parseInt(SMTP_PORT || "587", 10) === 465, // true for port 465 (SSL)
        auth: {
            user: SMTP_USER,
            pass: SMTP_PASS,
        },
    });

    return _transporter;
}

// ─────────────────────────────────────────────────────────────────
// getAdminEmails — fetches all admin email addresses from DB
// Always includes ADMIN_EMAIL from .env as a fallback
// ─────────────────────────────────────────────────────────────────
async function getAdminEmails() {
    const admins = await User.find({
        role: { $in: ["super_admin", "company_admin"] },
        isApproved: true,
    }).select("email").lean();

    const emails = admins.map((a) => a.email);

    // Always include the env fallback admin email
    const envAdmin = process.env.ADMIN_EMAIL;
    if (envAdmin && !emails.includes(envAdmin)) {
        emails.push(envAdmin);
    }

    // Remove duplicates
    return [...new Set(emails)];
}

// ─────────────────────────────────────────────────────────────────
// sendEmail — low-level send helper
// ─────────────────────────────────────────────────────────────────
async function sendEmail({ to, subject, html }) {
    const transporter = getTransporter();
    const from = process.env.NOTIFY_FROM || process.env.SMTP_USER;

    await transporter.sendMail({ from, to, subject, html });
    console.log(`  📧 Alert sent → ${Array.isArray(to) ? to.join(", ") : to}`);
}

// ─────────────────────────────────────────────────────────────────
// Email templates
// ─────────────────────────────────────────────────────────────────

// Shared header/footer for all emails
function emailWrapper(title, accentColor, body) {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; background: #f4f4f4; margin: 0; padding: 20px; }
    .card { background: #ffffff; border-radius: 8px; max-width: 560px;
            margin: 0 auto; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.08); }
    .header { background: ${accentColor}; color: white; padding: 20px 28px; }
    .header h2 { margin: 0; font-size: 18px; }
    .header p  { margin: 4px 0 0; font-size: 13px; opacity: 0.85; }
    .body   { padding: 24px 28px; color: #333; font-size: 14px; line-height: 1.6; }
    .row    { display: flex; justify-content: space-between; padding: 8px 0;
              border-bottom: 1px solid #f0f0f0; }
    .label  { color: #888; font-size: 13px; }
    .value  { font-weight: bold; color: #111; font-size: 13px; }
    .badge  { display: inline-block; padding: 3px 10px; border-radius: 99px;
              font-size: 12px; font-weight: bold; }
    .footer { background: #f9f9f9; padding: 14px 28px;
              font-size: 12px; color: #aaa; text-align: center; }
  </style>
</head>
<body>
  <div class="card">
    <div class="header">
      <h2>${title}</h2>
      <p>CallIntel AI — Sales Call Intelligence System</p>
    </div>
    <div class="body">${body}</div>
    <div class="footer">
      This is an automated alert from CallIntel. Do not reply to this email.
    </div>
  </div>
</body>
</html>`;
}

function row(label, value) {
    return `<div class="row"><span class="label">${label}</span><span class="value">${value || "—"}</span></div>`;
}

// ── Template 1: Hot Lead ──────────────────────────────────────────
function hotLeadEmail(a, uploaderName) {
    const body = `
      <p>A <strong>hot lead</strong> has been detected. Immediate follow-up is recommended.</p>
      ${row("Student Name", a.studentName)}
      ${row("Course", a.courseInterested)}
      ${row("City", a.city)}
      ${row("Counsellor", a.counsellorName || uploaderName)}
      ${row("Lead Score", `${a.leadScore}/10`)}
      ${row("Sentiment", a.sentiment)}
      ${row("Follow-up Date", a.followUpDate)}
      ${row("Key Concerns", Array.isArray(a.keyConcerns) ? a.keyConcerns.join(", ") : "—")}
      <p style="margin-top:16px; padding:12px; background:#fff8e1; border-left:4px solid #f9a825;
         border-radius:4px; font-size:13px;">
        <strong>AI Summary:</strong><br>${a.callSummary || "No summary available."}
      </p>`;

    return emailWrapper(
        `🔥 Hot Lead Detected — ${a.studentName || "Unknown Student"}`,
        "#1a6b3c",
        body
    );
}

// ── Template 2: Follow-up Required ───────────────────────────────
function followUpEmail(a, uploaderName) {
    const body = `
      <p>A call has been flagged for <strong>follow-up</strong>. Please ensure this lead is contacted on time.</p>
      ${row("Student Name", a.studentName)}
      ${row("Course", a.courseInterested)}
      ${row("City", a.city)}
      ${row("Counsellor", a.counsellorName || uploaderName)}
      ${row("Follow-up Date", a.followUpDate || "As soon as possible")}
      ${row("Lead Score", `${a.leadScore}/10`)}
      ${row("Sentiment", a.sentiment)}
      ${row("Key Concerns", Array.isArray(a.keyConcerns) ? a.keyConcerns.join(", ") : "—")}
      <p style="margin-top:16px; padding:12px; background:#e3f2fd; border-left:4px solid #1976d2;
         border-radius:4px; font-size:13px;">
        <strong>AI Summary:</strong><br>${a.callSummary || "No summary available."}
      </p>`;

    return emailWrapper(
        `📅 Follow-up Required — ${a.studentName || "Unknown Student"}`,
        "#1565c0",
        body
    );
}

// ── Template 3: Poor Counsellor Performance ───────────────────────
function poorQualityEmail(a, uploaderName) {
    const body = `
      <p>A call has been flagged for <strong>poor counsellor performance</strong>. Review and coaching may be needed.</p>
      ${row("Counsellor", a.counsellorName || uploaderName)}
      ${row("Student Name", a.studentName)}
      ${row("Course", a.courseInterested)}
      ${row("Communication Score", `${a.communicationScore}/10`)}
      ${row("Engagement Score", `${a.engagementScore}/10`)}
      ${row("Confidence Score", `${a.counsellorConfidenceScore}/10`)}
      ${row("Lead Score", `${a.leadScore}/10`)}
      ${row("Sentiment", a.sentiment)}
      <p style="margin-top:16px; padding:12px; background:#fce4ec; border-left:4px solid #c62828;
         border-radius:4px; font-size:13px;">
        <strong>AI Summary:</strong><br>${a.callSummary || "No summary available."}
      </p>`;

    return emailWrapper(
        `⚠️ Poor Performance Alert — ${a.counsellorName || uploaderName || "Unknown Counsellor"}`,
        "#b71c1c",
        body
    );
}

// ─────────────────────────────────────────────────────────────────
// sendAnalysisAlerts — main exported function
//
// Evaluates all 3 alert conditions and sends the relevant emails.
// All errors are caught — never throws, never blocks the pipeline.
//
// @param {Object} callAnalysis  — completed CallAnalysis mongoose doc
// @param {string} uploaderName  — full name of the counsellor/uploader
// ─────────────────────────────────────────────────────────────────
async function sendAnalysisAlerts(callAnalysis, uploaderName = "") {
    try {
        const adminEmails = await getAdminEmails();

        if (!adminEmails.length) {
            console.warn("⚠️  No admin emails found — skipping notifications");
            return;
        }

        const a = callAnalysis;
        const alertsSent = [];

        // ── Alert 1: Hot Lead ─────────────────────────────────────
        if (a.leadScore >= HOT_LEAD_THRESHOLD && a.interested) {
            try {
                const subject = `🔥 Hot Lead: ${a.studentName || "Unknown"} — Score ${a.leadScore}/10`;
                await sendEmail({ to: adminEmails, subject, html: hotLeadEmail(a, uploaderName) });
                alertsSent.push("hot-lead");
                try {
                    await Notification.create({ type: 'hot_lead', title: 'Hot Lead Detected', message: subject, audioRecordingId: a.audioRecordingId, studentName: a.studentName, counsellorName: a.counsellorName, leadScore: a.leadScore });
                } catch (dbErr) { console.error("⚠️  Notification DB save failed (hot_lead):", dbErr.message); }
            } catch (err) {
                console.error("⚠️  Hot lead alert failed:", err.message);
            }
        }

        // ── Alert 2: Follow-up Required ───────────────────────────
        if (a.followUpRequired) {
            try {
                const subject = `📅 Follow-up Required: ${a.studentName || "Unknown"} — ${a.followUpDate || "ASAP"}`;
                await sendEmail({ to: adminEmails, subject, html: followUpEmail(a, uploaderName) });
                alertsSent.push("follow-up");
                try {
                    await Notification.create({ type: 'follow_up', title: 'Follow-up Required', message: subject, audioRecordingId: a.audioRecordingId, studentName: a.studentName, counsellorName: a.counsellorName, leadScore: a.leadScore });
                } catch (dbErr) { console.error("⚠️  Notification DB save failed (follow_up):", dbErr.message); }
            } catch (err) {
                console.error("⚠️  Follow-up alert failed:", err.message);
            }
        }

        // ── Alert 3: Poor Counsellor Performance ──────────────────
        if (a.communicationScore !== null && a.communicationScore <= POOR_QUALITY_THRESHOLD) {
            try {
                const subject = `⚠️ Poor Performance: ${a.counsellorName || uploaderName || "Unknown"} — Score ${a.communicationScore}/10`;
                await sendEmail({ to: adminEmails, subject, html: poorQualityEmail(a, uploaderName) });
                alertsSent.push("poor-quality");
                try {
                    await Notification.create({ type: 'poor_performance', title: 'Poor Performance Alert', message: subject, audioRecordingId: a.audioRecordingId, studentName: a.studentName, counsellorName: a.counsellorName || uploaderName, leadScore: a.leadScore });
                } catch (dbErr) { console.error("⚠️  Notification DB save failed (poor_performance):", dbErr.message); }
            } catch (err) {
                console.error("⚠️  Poor quality alert failed:", err.message);
            }
        }

        if (alertsSent.length) {
            console.log(`  🔔 Alerts sent: ${alertsSent.join(", ")}`);
        } else {
            console.log("  🔕 No alert conditions triggered for this call");
        }

    } catch (err) {
        // Top-level catch — never crash the pipeline
        console.error("⚠️  Notification service error (non-fatal):", err.message);
    }
}

module.exports = { sendAnalysisAlerts };
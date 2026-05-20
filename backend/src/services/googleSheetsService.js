// backend/src/services/googleSheetsService.js
// Uses googleapis npm package ("googleapis": "^144.0.0")
// Required .env variables:
//   GOOGLE_SHEETS_ENABLED=true
//   GOOGLE_SHEET_ID=<spreadsheet id from the URL>
//   GOOGLE_SERVICE_ACCOUNT_EMAIL=<service account email>
//   GOOGLE_SERVICE_ACCOUNT_KEY=<private key contents, with \n as literal newlines>

const { google } = require('googleapis');

const SHEET_TAB = 'Call Reports';

const HEADERS = [
    'Date', 'Time', 'Student Name', 'Counsellor', 'Course Interested',
    'City', 'Sentiment', 'Interested?', 'Lead Score', 'Closing Probability (%)',
    'Follow-up Required?', 'Follow-up Date', 'Main Concerns',
    'Fees Issue?', 'Placement Concern?', 'Parent Concern?', 'Timing Concern?',
    'Communication Score', 'Engagement Score', 'Confidence Score',
    'Language Detected', 'Audio File', 'AI Summary',
];

function getAuthClient() {
    const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
    const key = (process.env.GOOGLE_SERVICE_ACCOUNT_KEY || '').replace(/\\n/g, '\n');

    if (!email || !key) {
        throw new Error(
            'Google Sheets not configured. Set GOOGLE_SERVICE_ACCOUNT_EMAIL and GOOGLE_SERVICE_ACCOUNT_KEY in .env'
        );
    }

    return new google.auth.JWT(email, null, key, [
        'https://www.googleapis.com/auth/spreadsheets',
    ]);
}

function buildRow(callAnalysis, audioRecording, uploaderName = '') {
    const a = callAnalysis;
    const r = audioRecording;
    const d = new Date(a.createdAt);
    return [
        d.toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' }),
        d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }),
        a.studentName || '—',
        a.counsellorName || uploaderName || '—',
        a.courseInterested || '—',
        a.city || '—',
        a.sentiment || '—',
        a.interested ? 'Yes' : 'No',
        a.leadScore ?? '—',
        a.closingProbability ?? '—',
        a.followUpRequired ? 'Yes' : 'No',
        a.followUpDate || '—',
        Array.isArray(a.keyConcerns) && a.keyConcerns.length ? a.keyConcerns.join(', ') : '—',
        a.feesIssue ? 'Yes' : 'No',
        a.placementConcern ? 'Yes' : 'No',
        a.parentConcern ? 'Yes' : 'No',
        a.timingConcern ? 'Yes' : 'No',
        a.communicationScore ?? '—',
        a.engagementScore ?? '—',
        a.counsellorConfidenceScore ?? '—',
        a.transcript?.detectedLanguage || '—',
        r?.originalFileName || '—',
        a.callSummary || '—',
    ];
}

async function ensureHeaders(sheets, spreadsheetId) {
    try {
        const res = await sheets.spreadsheets.values.get({
            spreadsheetId,
            range: `${SHEET_TAB}!A1:A1`,
        });
        const firstCell = res.data.values?.[0]?.[0];
        if (firstCell === 'Date') return;
    } catch (_) { /* sheet may be empty */ }

    await sheets.spreadsheets.values.append({
        spreadsheetId,
        range: `${SHEET_TAB}!A1`,
        valueInputOption: 'RAW',
        requestBody: { values: [HEADERS] },
    });
    console.log('📋 Google Sheet headers written');
}

async function appendToGoogleSheet(callAnalysis, audioRecording, uploaderName = '') {
    if (process.env.GOOGLE_SHEETS_ENABLED !== 'true') {
        return null;
    }

    const spreadsheetId = process.env.GOOGLE_SHEET_ID;
    if (!spreadsheetId) {
        throw new Error('GOOGLE_SHEET_ID is not set in .env');
    }

    const auth = getAuthClient();
    const sheets = google.sheets({ version: 'v4', auth });

    await ensureHeaders(sheets, spreadsheetId);

    const row = buildRow(callAnalysis, audioRecording, uploaderName);

    await sheets.spreadsheets.values.append({
        spreadsheetId,
        range: `${SHEET_TAB}!A1`,
        valueInputOption: 'USER_ENTERED',
        insertDataOption: 'INSERT_ROWS',
        requestBody: { values: [row] },
    });

    console.log(
        `📊 Google Sheet updated: ${callAnalysis.studentName || 'Unknown'} | Score: ${callAnalysis.leadScore}/10`
    );
    return true;
}

module.exports = { appendToGoogleSheet };

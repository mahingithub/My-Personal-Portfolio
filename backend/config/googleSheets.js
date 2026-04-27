// ============================================
// 📊 Google Sheets Integration
// ============================================
const { google } = require('googleapis');

/**
 * Google Sheets Service
 * Automatically saves every contact message to a Google Sheet
 * 
 * SETUP INSTRUCTIONS:
 * 1. Go to Google Cloud Console → Create Project
 * 2. Enable "Google Sheets API"
 * 3. Create Service Account → Download JSON key
 * 4. Copy email, private_key from JSON to .env
 * 5. Create a Google Sheet → Share it with the service account email
 * 6. Copy the Sheet ID from the URL and set in .env
 */

let sheetsClient = null;

/**
 * Initialize or return the Google Sheets client
 */
const getSheetsClient = async () => {
  if (sheetsClient) return sheetsClient;

  try {
    const auth = new google.auth.JWT(
      process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      null,
      process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      ['https://www.googleapis.com/auth/spreadsheets']
    );

    await auth.authorize();

    sheetsClient = google.sheets({ version: 'v4', auth });
    console.log('✅ Google Sheets connected');
    return sheetsClient;
  } catch (error) {
    console.error('❌ Google Sheets connection failed:', error.message);
    return null;
  }
};

/**
 * Initialize the sheet with headers if it's empty
 */
const initializeSheet = async () => {
  const sheets = await getSheetsClient();
  if (!sheets) return;

  try {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: process.env.GOOGLE_SHEET_ID,
      range: 'Sheet1!A1:F1',
    });

    // If no headers exist, add them
    if (!response.data.values || response.data.values.length === 0) {
      await sheets.spreadsheets.values.update({
        spreadsheetId: process.env.GOOGLE_SHEET_ID,
        range: 'Sheet1!A1:F1',
        valueInputOption: 'RAW',
        requestBody: {
          values: [['ID', 'Name', 'Email', 'Subject', 'Message', 'Date']],
        },
      });
      console.log('📊 Google Sheet headers initialized');
    }
  } catch (error) {
    console.error('❌ Sheet initialization error:', error.message);
  }
};

/**
 * Append a new contact message row to the Google Sheet
 * @param {Object} contact - The contact message data
 */
const appendToSheet = async (contact) => {
  const sheets = await getSheetsClient();
  if (!sheets) {
    console.warn('⚠️  Google Sheets not connected, skipping...');
    return false;
  }

  try {
    await sheets.spreadsheets.values.append({
      spreadsheetId: process.env.GOOGLE_SHEET_ID,
      range: 'Sheet1!A:F',
      valueInputOption: 'RAW',
      insertDataOption: 'INSERT_ROWS',
      requestBody: {
        values: [[
          contact._id.toString(),
          contact.name,
          contact.email,
          contact.subject,
          contact.message,
          new Date(contact.createdAt).toLocaleString(),
        ]],
      },
    });

    console.log('📊 Message saved to Google Sheet');
    return true;
  } catch (error) {
    console.error('❌ Google Sheets append error:', error.message);
    return false;
  }
};

/**
 * Delete a row from the sheet by contact ID
 * @param {string} contactId - The MongoDB document ID
 */
const deleteFromSheet = async (contactId) => {
  const sheets = await getSheetsClient();
  if (!sheets) return false;

  try {
    // First, find the row with the matching ID
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: process.env.GOOGLE_SHEET_ID,
      range: 'Sheet1!A:A',
    });

    const rows = response.data.values || [];
    let rowIndex = -1;

    for (let i = 0; i < rows.length; i++) {
      if (rows[i][0] === contactId) {
        rowIndex = i;
        break;
      }
    }

    if (rowIndex === -1) return false;

    // Get spreadsheet info to find sheet ID
    const spreadsheet = await sheets.spreadsheets.get({
      spreadsheetId: process.env.GOOGLE_SHEET_ID,
    });

    const sheetId = spreadsheet.data.sheets[0].properties.sheetId;

    // Delete the row
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: process.env.GOOGLE_SHEET_ID,
      requestBody: {
        requests: [{
          deleteDimension: {
            range: {
              sheetId: sheetId,
              dimension: 'ROWS',
              startIndex: rowIndex,
              endIndex: rowIndex + 1,
            },
          },
        }],
      },
    });

    console.log('📊 Row deleted from Google Sheet');
    return true;
  } catch (error) {
    console.error('❌ Google Sheets delete error:', error.message);
    return false;
  }
};

module.exports = { getSheetsClient, initializeSheet, appendToSheet, deleteFromSheet };

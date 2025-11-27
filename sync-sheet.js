const {google} = require('googleapis');
const fs = require('fs');

async function main() {
  const serviceAccount = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT);
  const sheetId = process.env.GOOGLE_SHEET_ID;

  const jwtClient = new google.auth.JWT(
    serviceAccount.client_email,
    null,
    serviceAccount.private_key,
    ['https://www.googleapis.com/auth/spreadsheets.readonly']
  );

  const sheets = google.sheets({version: 'v4', auth: jwtClient});
  const range = 'Sheet1!A1:G100';   // Adjust if your data range differs

  const res = await sheets.spreadsheets.values.get({spreadsheetId: sheetId, range: range});

  const rows = res.data.values;
  if (!rows || rows.length === 0) {
    console.log('No data found.');
    return;
  }

  // Convert rows to JSON objects using headers
  const headers = rows[0];
  const jsonArray = rows.slice(1).map(row => {
    let obj = {};
    headers.forEach((h, i) => {
      obj[h] = row[i] || '';
    });
    return obj;
  });

  // Write JSON file
  fs.writeFileSync('csvjson.json', JSON.stringify(jsonArray, null, 2), 'utf-8');
  console.log(`Generated ${jsonArray.length} records to csvjson.json`);

  // Commit and push changes
  const execSync = require('child_process').execSync;
  execSync('git config user.name "github-actions[bot]"');
  execSync('git config user.email "github-actions[bot]@users.noreply.github.com"');
  execSync('git add csvjson.json');
  
  try {
    execSync('git commit -m "Automated update from Google Sheets [skip ci]"');
  } catch(e) {
    console.log('No changes to commit.');
  }
  
  execSync('git push');
  console.log('Changes committed and pushed!');
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});

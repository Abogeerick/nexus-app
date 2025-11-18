# M-PESA Module - Quick Start Guide

## 🚀 Getting Started in 5 Minutes

### Step 1: Run the Application

```bash
npm run dev
```

Navigate to `http://localhost:3000`

### Step 2: Sign In

Use your existing account or create a new one:
- Email: your-email@example.com
- Password: (your password)

### Step 3: Access M-PESA Dashboard

Click on the **"📱 M-PESA Transactions"** card from the main dashboard, or navigate to:

```
http://localhost:3000/dashboard/mpesa
```

### Step 4: Import Your First Transactions

#### Option A: Upload Sample CSV

1. Download the sample file: `public/samples/mpesa-sample.csv`
2. Click **"📁 Upload File"**
3. Select **"Auto-detect"** format
4. Choose the CSV file
5. ✅ Done! You'll see 10 sample transactions

#### Option B: Paste Sample SMS

1. Copy content from: `public/samples/mpesa-sms-sample.txt`
2. Click **"📝 Paste Text"**
3. Paste the content
4. Click **"Parse Transactions"**
5. ✅ Done! You'll see 12 sample transactions

### Step 5: Explore Features

#### 📊 View Analytics

Scroll down to see:
- **Summary Cards**: Income, Expense, Net Amount, Savings Rate
- **Spending by Category**: Visual breakdown
- **Top Merchants**: Where you spend the most
- **Recurring Payments**: Detected subscriptions
- **Quick Insights**: AI-generated spending insights

#### 🔍 Filter Transactions

- **Search**: By transaction code, merchant, or description
- **Type**: Filter by Income or Expenses
- **Category**: Filter by spending category

#### 📅 Change Time Period

Select from:
- Last 7 days
- Last 30 days
- Last 90 days
- Last year
- All time

---

## 📁 Sample Data Files

### CSV Format (`mpesa-sample.csv`)

```csv
Receipt No.,Completion Time,Details,Transaction Status,Paid In,Withdrawn,Balance
SH12ABC3XY1,01/11/24 10:30 AM,SH12ABC3XY1 Confirmed. You have received Ksh500.00 from JOHN DOE 254712345678...,Completed,500.00,,5500.00
```

### SMS Format (`mpesa-sms-sample.txt`)

```
SH12ABC3XY1 Confirmed. You have received Ksh500.00 from JOHN DOE 254712345678 on 1/11/24 at 10:30 AM New M-PESA balance is Ksh5,500.00
```

---

## 🎯 Common Use Cases

### Import Real M-PESA Data

1. **Export from M-PESA App:**
   - Open M-PESA app
   - Go to "Statement"
   - Select date range
   - Export as CSV
   - Upload to Nexus Finance

2. **Copy SMS Messages:**
   - Open your SMS app
   - Search for "MPESA"
   - Copy multiple messages
   - Paste into Nexus Finance text input

### Analyze Spending Patterns

1. Go to M-PESA Dashboard
2. Set period to "Last 30 days"
3. Check "Spending by Category"
4. Review "Top Merchants"
5. Identify "Recurring Payments"

### Track Savings Rate

1. Import at least one month of transactions
2. View "Savings Rate" card
3. Track improvement over time

---

## 🔧 API Usage (For Developers)

### Parse M-PESA Data Programmatically

```javascript
// POST /api/mpesa/parse
const response = await fetch('/api/mpesa/parse', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    content: csvOrTextContent,
    format: 'auto', // or 'CSV', 'SMS', 'TEXT'
    skipDuplicates: true
  })
});

const result = await response.json();
console.log(`Imported ${result.summary.successful} transactions`);
```

### Get Analytics

```javascript
// GET /api/mpesa/analytics?period=30d
const response = await fetch('/api/mpesa/analytics?period=30d');
const analytics = await response.json();

console.log(`Total Income: KES ${analytics.summary.totalIncome}`);
console.log(`Total Expense: KES ${analytics.summary.totalExpense}`);
console.log(`Savings Rate: ${analytics.summary.savingsRate}%`);
```

### List Transactions

```javascript
// GET /api/mpesa/transactions?page=1&limit=50
const response = await fetch('/api/mpesa/transactions?page=1&limit=50');
const data = await response.json();

console.log(`Total: ${data.pagination.total} transactions`);
```

---

## ✨ Features Overview

| Feature | Description | Status |
|---------|-------------|--------|
| CSV Upload | Import M-PESA CSV exports | ✅ Live |
| SMS Import | Import M-PESA SMS messages | ✅ Live |
| Text Paste | Paste transaction text | ✅ Live |
| Auto Format Detection | Automatically detect input format | ✅ Live |
| Duplicate Detection | Skip duplicate transactions | ✅ Live |
| AI Classification | Auto-categorize transactions | ✅ Live |
| Merchant Normalization | Clean merchant names | ✅ Live |
| Analytics Dashboard | Visual spending insights | ✅ Live |
| Category Breakdown | Spending by category | ✅ Live |
| Top Merchants | Most frequent merchants | ✅ Live |
| Recurring Payments | Detect subscriptions | ✅ Live |
| Search & Filter | Find specific transactions | ✅ Live |
| Date Range Filter | Filter by time period | ✅ Live |
| Pagination | Handle large datasets | ✅ Live |
| Manual Entry | Add transactions manually | 🔜 Coming Soon |
| Export to Excel | Download analysis | 🔜 Coming Soon |
| Budget Tracking | Set and track budgets | 🔜 Coming Soon |
| Anomaly Detection | Unusual spending alerts | 🔜 Coming Soon |

---

## 🐛 Troubleshooting

### Problem: "Failed to parse transactions"

**Solutions:**
- Check file format (CSV must have headers)
- Try "Auto-detect" format
- Ensure file is not corrupted
- Check sample files for format reference

### Problem: "No transactions found"

**Solutions:**
- Make sure content contains valid M-PESA messages
- Check for transaction codes (e.g., SH12ABC3XY1)
- Verify amounts are in format "Ksh500.00" or "KES 500"

### Problem: Duplicates showing up

**Solutions:**
- Ensure "Skip Duplicates" is enabled
- Check if transaction codes are truly unique
- Delete previous import batch and re-import

### Problem: Wrong categories

**Solutions:**
- Click "Classify" button to re-run classification
- Categories are based on merchant names and keywords
- You can manually update categories (future feature)

---

## 📚 Next Steps

1. **Read Full Guide**: Check `docs/MPESA-MODULE-GUIDE.md`
2. **Run Tests**: `npm test mpesa`
3. **Explore API**: Try the API endpoints
4. **Customize**: Add your own merchant aliases
5. **Contribute**: Submit improvements via GitHub

---

## 🎓 Learning Resources

### Understanding M-PESA Formats

M-PESA sends different message types:

- **Received Money**: `"You have received Ksh..."`
- **Sent Money**: `"Ksh... sent to..."`
- **Paybill Payment**: `"Ksh... paid to... Account Number..."`
- **Buy Goods**: `"Ksh... paid to... Till Number..."`
- **Withdrawal**: `"Ksh... withdrawn from..."`
- **Airtime**: `"Ksh... airtime purchased..."`

Each is automatically detected and categorized!

### Understanding Categories

Categories are assigned based on:
1. **Transaction Type**: Airtime → Utilities, Withdrawal → Cash Withdrawal
2. **Merchant Keywords**: "NAIVAS" → Groceries, "UBER" → Transport
3. **Pattern Matching**: Recurring amounts → Subscriptions

### Understanding Confidence Scores

Each transaction has a confidence score (0-1):
- **1.0**: Perfect parsing, all fields present
- **0.8-0.9**: Good parsing, minor fields missing
- **0.6-0.7**: Acceptable parsing, some uncertainty
- **< 0.6**: Poor parsing, manual review recommended

---

## 🙌 Support

Need help?
- Check the troubleshooting section
- Review sample data files
- Read the full documentation
- Open an issue on GitHub

**Happy Tracking! 📊💰**


import { NextRequest, NextResponse } from "next/server";
import path from "path";
import fs from "fs";

/**
 * Test endpoint to see what pdf2json actually extracts
 */
export async function GET(req: NextRequest) {
  try {
    const pdfPath = path.join(
      process.cwd(),
      "public",
      "samples",
      "MPESA_Statement_2025-11-18_to_2025-05-18_2547xxxxxx507 (1)_unlocked.pdf"
    );

    if (!fs.existsSync(pdfPath)) {
      return NextResponse.json({ error: "PDF not found" }, { status: 404 });
    }

    const pdfBuffer = fs.readFileSync(pdfPath);

    // Use pdf2json (what we're actually using now)
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const PDFParser = require("pdf2json");
    
    const extractText = (): Promise<{text: string, pageCount: number}> => {
      return new Promise((resolve, reject) => {
        const pdfParser = new PDFParser();
        pdfParser.on("pdfParser_dataError", (errData: any) => reject(new Error(errData.parserError)));
        pdfParser.on("pdfParser_dataReady", (pdfData: any) => {
          let fullText = "";
          let pageCount = 0;
          if (pdfData.Pages && Array.isArray(pdfData.Pages)) {
            pageCount = pdfData.Pages.length;
            for (const page of pdfData.Pages) {
              let pageText = "";
              if (page.Texts && Array.isArray(page.Texts)) {
                for (const text of page.Texts) {
                  if (text.R && Array.isArray(text.R)) {
                    for (const run of text.R) {
                      if (run.T) {
                        pageText += decodeURIComponent(run.T) + " ";
                      }
                    }
                  }
                }
              }
              fullText += pageText + "\n";
            }
          }
          resolve({text: fullText, pageCount});
        });
        pdfParser.parseBuffer(pdfBuffer);
      });
    };

    const {text: fullText, pageCount} = await extractText();

    // Count everything (FIXED PATTERN: [TR] followed by any alphanumeric 7-11 chars)
    const allCodes = Array.from(fullText.matchAll(/\b([TR][A-Z0-9]{7,11})\b/g));
    const allDates = Array.from(fullText.matchAll(/\d{4}-\d{2}-\d{2}/g));
    const uniqueDates = [...new Set(allDates.map(m => m[0]))].sort();
    const txnRows = Array.from(fullText.matchAll(/\b([TR][A-Z0-9]{7,11})\s+(\d{4}-\d{2}-\d{2})\s+(\d{2}:\d{2}:\d{2})/g));

    // Count by month
    const byMonth: Record<string, number> = {};
    txnRows.forEach(m => {
      const month = m[2].substring(0, 7);
      byMonth[month] = (byMonth[month] || 0) + 1;
    });

    // Find table start
    const detailedIndex = fullText.indexOf("DETAILED STATEMENT");
    const tableStart = fullText.indexOf("Receipt No.", detailedIndex);
    
    return NextResponse.json({
      success: true,
      pageCount,
      textLength: fullText.length,
      counts: {
        allCodes: allCodes.length,
        transactionRows: txnRows.length,
        uniqueDates: uniqueDates.length,
      },
      dateRange: {
        earliest: uniqueDates[0],
        latest: uniqueDates[uniqueDates.length - 1],
      },
      byMonth,
      positions: {
        detailedStatement: detailedIndex,
        tableHeader: tableStart,
      },
      samples: {
        first2000: fullText.substring(0, 2000),
        last2000: fullText.substring(fullText.length - 2000),
        tableSection: tableStart !== -1 ? fullText.substring(tableStart, tableStart + 5000) : "Not found",
      },
      firstRows: txnRows.slice(0, 10).map(m => ({ code: m[1], date: m[2], time: m[3] })),
      lastRows: txnRows.slice(-10).map(m => ({ code: m[1], date: m[2], time: m[3] })),
    });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

// src/utils/smsParser.ts
export interface ParsedTransaction {
  id: string;
  smsHash: string;
  rawSmsBody: string;
  amount: number;
  type: 'DEBIT' | 'CREDIT';
  bankName: string;
  accountNumber: string;
  merchant: string;
  category: string;
  transactionDate: string;
  parsedDateTime: string;
  syncedToSheets: boolean;
}

const categoryMap: Record<string, string> = {
  swiggy: 'Food & Dining',
  zomato: 'Food & Dining',
  dominos: 'Food & Dining',
  bmtc: 'Transport',
  ola: 'Transport',
  uber: 'Transport',
  bus: 'Transport',
  amazon: 'Shopping',
  flipkart: 'Shopping',
  netflix: 'Entertainment',
  salary: 'Income',
  electricity: 'Utilities',
  default: 'Uncategorized'
};

function md5(input: string): string {
  // Simple hash for deduplication (replace with proper md5 in production)
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    const char = input.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16);
}

function parseAmount(amountStr: string): number | null {
  const cleaned = amountStr.replace(/,/g, '').replace(/Rs\.?/gi, '').trim();
  const num = parseFloat(cleaned);
  return isNaN(num) ? null : num;
}

function parseDate(dateStr: string): string | null {
  const formats = [
    { regex: /(\d{2})\/(\d{2})\/(\d{2})/, handler: (m: RegExpMatchArray) => {
      const year = parseInt(m[3]) < 50 ? 2000 + parseInt(m[3]) : 1900 + parseInt(m[3]);
      return `${year}-${m[2]}-${m[1]}`;
    }},
    { regex: /(\d{2})-(\d{2})-(\d{2})/, handler: (m: RegExpMatchArray) => {
      const year = parseInt(m[3]) < 50 ? 2000 + parseInt(m[3]) : 1900 + parseInt(m[3]);
      return `${year}-${m[2]}-${m[1]}`;
    }}
  ];

  for (const format of formats) {
    const match = dateStr.match(format.regex);
    if (match) return format.handler(match);
  }
  return null;
}

function categorize(merchant: string): string {
  const lower = merchant.toLowerCase();
  for (const [key, value] of Object.entries(categoryMap)) {
    if (lower.includes(key)) return value;
  }
  return 'Uncategorized';
}

function detectBank(sender: string): string {
  const lower = sender.toLowerCase();
  if (lower.includes('hdfc')) return 'HDFC';
  if (lower.includes('canara')) return 'CANARA';
  if (lower.includes('bob') || lower.includes('baroda')) return 'BOB';
  return 'UNKNOWN';
}

export function parseSms(smsBody: string, sender: string = ''): ParsedTransaction | null {
  const hash = md5(smsBody);
  const cleanBody = smsBody.replace(/[
]+/g, ' ').trim();

  // HDFC UPI Sent Pattern
  const hdfcUpiSent = /Sent\s+Rs\.?(\d[\d,]*\.?\d{0,2})\s+From\s+HDFC\s+Bank\s+A\/C\s+(\*\d+)\s+To\s+([A-Za-z0-9\s.&@\-_/]+?)\s+On\s+(\d{2}[/-]\d{2}[/-]\d{2})/i;

  const hdfcMatch = cleanBody.match(hdfcUpiSent);
  if (hdfcMatch) {
    const amount = parseAmount(hdfcMatch[1]);
    if (!amount) return null;

    const merchant = hdfcMatch[3].trim();
    const dateStr = hdfcMatch[4].trim();
    const date = parseDate(dateStr) || new Date().toISOString().split('T')[0];

    return {
      id: hash,
      smsHash: hash,
      rawSmsBody: smsBody,
      amount,
      type: 'DEBIT',
      bankName: 'HDFC',
      accountNumber: hdfcMatch[2].trim(),
      merchant,
      category: categorize(merchant),
      transactionDate: date,
      parsedDateTime: new Date().toISOString(),
      syncedToSheets: false
    };
  }

  // Generic patterns for other banks
  const genericDebit = /(?:debited|spent|paid|withdrawn).*?Rs\.?(\d[\d,]*\.?\d{0,2}).*?(?:A\/C|a\/c|Acct|Account).*?(\*\d+).*?(?:to|at|for|through)\s+([A-Za-z0-9\s.&@\-_/]+)/i;
  const genericCredit = /(?:credited|received|deposited).*?Rs\.?(\d[\d,]*\.?\d{0,2}).*?(?:A\/C|a\/c|Acct|Account).*?(\*\d+)/i;

  const debitMatch = cleanBody.match(genericDebit);
  if (debitMatch) {
    const amount = parseAmount(debitMatch[1]);
    if (!amount) return null;

    const merchant = debitMatch[3].trim();
    const date = parseDate(cleanBody) || new Date().toISOString().split('T')[0];

    return {
      id: hash,
      smsHash: hash,
      rawSmsBody: smsBody,
      amount,
      type: 'DEBIT',
      bankName: detectBank(sender),
      accountNumber: debitMatch[2].trim(),
      merchant,
      category: categorize(merchant),
      transactionDate: date,
      parsedDateTime: new Date().toISOString(),
      syncedToSheets: false
    };
  }

  const creditMatch = cleanBody.match(genericCredit);
  if (creditMatch) {
    const amount = parseAmount(creditMatch[1]);
    if (!amount) return null;

    const date = parseDate(cleanBody) || new Date().toISOString().split('T')[0];

    return {
      id: hash,
      smsHash: hash,
      rawSmsBody: smsBody,
      amount,
      type: 'CREDIT',
      bankName: detectBank(sender),
      accountNumber: creditMatch[2].trim(),
      merchant: 'Account Credit',
      category: 'Income',
      transactionDate: date,
      parsedDateTime: new Date().toISOString(),
      syncedToSheets: false
    };
  }

  return null;
}

export function testParse(smsBody: string): string {
  const result = parseSms(smsBody);
  if (result) {
    return `✅ PARSED:
Bank: ${result.bankName}
Type: ${result.type}
Amount: ₹${result.amount}
Account: ${result.accountNumber}
Merchant: ${result.merchant}
Category: ${result.category}
Date: ${result.transactionDate}`;
  }
  return '❌ FAILED TO PARSE';
}

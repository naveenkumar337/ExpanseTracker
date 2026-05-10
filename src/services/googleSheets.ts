// src/services/googleSheets.ts
import axios from 'axios';
import { AuthStorage } from './storage';
import { ParsedTransaction } from '../utils/smsParser';

const SHEETS_API_BASE = 'https://sheets.googleapis.com/v4/spreadsheets';

// For read-only/public sheets: Use API Key
// For private sheets: Use OAuth access token

export interface SheetConfig {
  spreadsheetId: string;
  sheetName: string;
  apiKey?: string;  // For public sheets
  accessToken?: string;  // For private sheets (OAuth)
}

class GoogleSheetsService {
  private config: SheetConfig | null = null;

  async initialize(spreadsheetId?: string, apiKey?: string) {
    const savedId = await AuthStorage.getSheetId();
    const savedToken = await AuthStorage.getGoogleToken();

    this.config = {
      spreadsheetId: spreadsheetId || savedId || '',
      sheetName: 'Expense Tracker',
      apiKey: apiKey,
      accessToken: savedToken || undefined
    };
  }

  setConfig(config: Partial<SheetConfig>) {
    if (this.config) {
      this.config = { ...this.config, ...config };
    }
  }

  /**
   * Create new spreadsheet and return ID
   * Requires OAuth access token
   */
  async createSpreadsheet(title: string = 'Expense Tracker'): Promise<string | null> {
    if (!this.config?.accessToken) {
      throw new Error('OAuth access token required to create spreadsheet');
    }

    try {
      const response = await axios.post(
        `${SHEETS_API_BASE}`,
        {
          properties: { title },
          sheets: [{
            properties: { title: this.config.sheetName }
          }]
        },
        {
          headers: {
            'Authorization': `Bearer ${this.config.accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      const sheetId = response.data.spreadsheetId;

      // Add headers
      await this.appendValues([
        ['Date', 'Purpose', 'Amount', 'Type', 'Paid For', 'Bank Name', 'Account/Card', 'Category']
      ], sheetId);

      // Save sheet ID
      await AuthStorage.saveSheetId(sheetId);
      this.config.spreadsheetId = sheetId;

      return sheetId;
    } catch (error) {
      console.error('Create spreadsheet failed:', error);
      return null;
    }
  }

  /**
   * Append transactions to sheet
   */
  async appendTransactions(transactions: ParsedTransaction[]): Promise<boolean> {
    if (!this.config?.spreadsheetId) {
      throw new Error('Spreadsheet ID not configured');
    }

    const values = transactions.map(t => [
      t.transactionDate,
      t.merchant,
      t.amount.toString(),
      t.type,
      t.merchant,
      t.bankName,
      t.accountNumber,
      t.category
    ]);

    return this.appendValues(values);
  }

  /**
   * Append raw values to sheet
   */
  private async appendValues(values: string[][], sheetId?: string): Promise<boolean> {
    const targetId = sheetId || this.config?.spreadsheetId;
    if (!targetId) return false;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };

    // Use OAuth token if available, otherwise API key
    if (this.config?.accessToken) {
      headers['Authorization'] = `Bearer ${this.config.accessToken}`;
    }

    const url = this.config?.apiKey 
      ? `${SHEETS_API_BASE}/${targetId}/values/${this.config.sheetName}!A:H:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS&key=${this.config.apiKey}`
      : `${SHEETS_API_BASE}/${targetId}/values/${this.config.sheetName}!A:H:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`;

    try {
      await axios.post(
        url,
        { values },
        { headers }
      );
      return true;
    } catch (error) {
      console.error('Append values failed:', error);
      return false;
    }
  }

  /**
   * Read values from sheet (for verification)
   */
  async readValues(range: string = 'A:H'): Promise<string[][] | null> {
    if (!this.config?.spreadsheetId) return null;

    const headers: Record<string, string> = {};

    if (this.config.accessToken) {
      headers['Authorization'] = `Bearer ${this.config.accessToken}`;
    }

    const url = this.config.apiKey
      ? `${SHEETS_API_BASE}/${this.config.spreadsheetId}/values/${this.config.sheetName}!${range}?key=${this.config.apiKey}`
      : `${SHEETS_API_BASE}/${this.config.spreadsheetId}/values/${this.config.sheetName}!${range}`;

    try {
      const response = await axios.get(url, { headers });
      return response.data.values || [];
    } catch (error) {
      console.error('Read values failed:', error);
      return null;
    }
  }

  getSpreadsheetUrl(): string | null {
    if (!this.config?.spreadsheetId) return null;
    return `https://docs.google.com/spreadsheets/d/${this.config.spreadsheetId}/edit`;
  }
}

export const sheetsService = new GoogleSheetsService();

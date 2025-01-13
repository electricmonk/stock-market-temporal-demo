export interface Stock {
  symbol: string;
  name: string;
  _id?: string;
}

export interface SMAData {
  timestamp: number;
  value: number;
}

export interface StockAnalysis {
  symbol: string;
  timestamp: Date;
  recommendation: string;
  confidence: number;
  smaData: SMAData[];
}
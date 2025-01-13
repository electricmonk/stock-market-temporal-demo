export interface Stock {
  symbol: string;
  name: string;
  _id?: string;
}

export interface SMAData {
  timestamp: number;
  value: number;
  url?: string;
}

export interface PolygonResponse {
  results: SMAData[];
  next_url?: string;
}

export interface StockAnalysis {
  symbol: string;
  timestamp: Date;
  recommendation: string;
  confidence: number;
  smaData: SMAData[];
}
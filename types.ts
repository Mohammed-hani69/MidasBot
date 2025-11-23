export interface Product {
  id: string;
  name: string;
  price: number;
  imageUrl: string;
  redeemCodes: string[]; // Changed from single string to array of strings
}

export interface BotAccount {
  id: string;
  email: string;
  password: string;
  status: 'active' | 'disabled';
  runtimeStatus?: 'online' | 'busy' | 'offline';
}

export interface UserProfile {
  id: string;
  name: string;
  balance: number;
}

export interface Transaction {
  id: string;
  playerId: string;
  productId: string;
  productName: string;
  amount: number;
  status: 'queued' | 'pending' | 'processing' | 'success' | 'failed';
  timestamp: number;
  log: string[]; // Logs of the bot's actions
  aiAnalysis?: string; // Gemini's analysis of the transaction
  botId?: string; // ID of the bot that processed this transaction
  redeemCode?: string; // The code used
}

export interface PaymentRequest {
  id: string;
  userId: string;
  userName: string;
  amount: number;
  method: string; // e.g., 'Vodafone Cash', 'InstaPay'
  referenceNumber: string; // The transaction ID provided by user
  status: 'pending' | 'approved' | 'rejected';
  timestamp: number;
}

export enum AppRoute {
  STORE = 'store',
  ADMIN = 'admin',
  WALLET = 'wallet',
}
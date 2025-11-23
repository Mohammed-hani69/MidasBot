import { Product, BotAccount, UserProfile, Transaction, PaymentRequest } from '../types';

const KEYS = {
  PRODUCTS: 'midasbot_products',
  ACCOUNTS: 'midasbot_accounts',
  USER: 'midasbot_user',
  TRANSACTIONS: 'midasbot_transactions',
  PAYMENTS: 'midasbot_payments',
};

// Initial Mock Data
const INITIAL_PRODUCTS: Product[] = [
  { 
    id: '1', 
    name: '60 UC', 
    price: 0.99, 
    imageUrl: 'https://picsum.photos/200/200?random=1', 
    redeemCodes: ['UC60-CODE-A1', 'UC60-CODE-A2', 'UC60-CODE-A3'] 
  },
  { 
    id: '2', 
    name: '325 UC', 
    price: 4.99, 
    imageUrl: 'https://picsum.photos/200/200?random=2', 
    redeemCodes: ['UC325-CODE-B1'] 
  },
  { 
    id: '3', 
    name: '660 UC', 
    price: 9.99, 
    imageUrl: 'https://picsum.photos/200/200?random=3', 
    redeemCodes: ['UC660-CODE-C1', 'UC660-CODE-C2'] 
  },
];

const INITIAL_ACCOUNTS: BotAccount[] = [
  { id: '1', email: 'bot1@example.com', password: 'password123', status: 'active', runtimeStatus: 'online' },
];

const INITIAL_USER: UserProfile = {
  id: 'user_001',
  name: 'Demo Client',
  balance: 100.00,
};

export const storageService = {
  getProducts: (): Product[] => {
    const data = localStorage.getItem(KEYS.PRODUCTS);
    return data ? JSON.parse(data) : INITIAL_PRODUCTS;
  },
  saveProducts: (products: Product[]) => {
    localStorage.setItem(KEYS.PRODUCTS, JSON.stringify(products));
  },

  getAccounts: (): BotAccount[] => {
    const data = localStorage.getItem(KEYS.ACCOUNTS);
    return data ? JSON.parse(data) : INITIAL_ACCOUNTS;
  },
  saveAccounts: (accounts: BotAccount[]) => {
    localStorage.setItem(KEYS.ACCOUNTS, JSON.stringify(accounts));
  },

  getUser: (): UserProfile => {
    const data = localStorage.getItem(KEYS.USER);
    return data ? JSON.parse(data) : INITIAL_USER;
  },
  saveUser: (user: UserProfile) => {
    localStorage.setItem(KEYS.USER, JSON.stringify(user));
  },

  getTransactions: (): Transaction[] => {
    const data = localStorage.getItem(KEYS.TRANSACTIONS);
    return data ? JSON.parse(data) : [];
  },
  saveTransaction: (transaction: Transaction) => {
    const transactions = storageService.getTransactions();
    const index = transactions.findIndex(t => t.id === transaction.id);
    if (index >= 0) {
      transactions[index] = transaction;
    } else {
      transactions.unshift(transaction); // Add to top
    }
    localStorage.setItem(KEYS.TRANSACTIONS, JSON.stringify(transactions));
  },

  getPaymentRequests: (): PaymentRequest[] => {
    const data = localStorage.getItem(KEYS.PAYMENTS);
    return data ? JSON.parse(data) : [];
  },
  savePaymentRequest: (request: PaymentRequest) => {
    const requests = storageService.getPaymentRequests();
    requests.unshift(request);
    localStorage.setItem(KEYS.PAYMENTS, JSON.stringify(requests));
  },
  updatePaymentRequestStatus: (id: string, status: 'approved' | 'rejected') => {
    const requests = storageService.getPaymentRequests();
    const updated = requests.map(r => r.id === id ? { ...r, status } : r);
    localStorage.setItem(KEYS.PAYMENTS, JSON.stringify(updated));
  }
};
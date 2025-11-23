import React, { useEffect } from 'react';
import { storageService } from '../services/storageService';
import { botService } from '../services/botService';

export const QueueProcessor: React.FC = () => {
  useEffect(() => {
    const processQueue = async () => {
      // 1. Get Queued Transactions (Oldest first)
      const transactions = storageService.getTransactions();
      const queuedTransactions = transactions
        .filter(t => t.status === 'queued')
        .sort((a, b) => a.timestamp - b.timestamp);

      if (queuedTransactions.length === 0) return;

      // 2. Get Available Bots
      const accounts = storageService.getAccounts();
      const availableBots = accounts.filter(a => a.status === 'active' && a.runtimeStatus !== 'busy');

      if (availableBots.length === 0) return;

      // 3. Match Job to Bot
      const nextTransaction = queuedTransactions[0];
      const selectedBot = availableBots[0];

      // 4. Mark as Processing IMMEDIATELY to prevent double assignment
      nextTransaction.status = 'processing';
      nextTransaction.botId = selectedBot.id;
      nextTransaction.log = [...(nextTransaction.log || []), `> [QueueManager] Job picked up by ${selectedBot.email}`];
      storageService.saveTransaction(nextTransaction);

      // 5. Run Logic
      await botService.processTransaction(nextTransaction, selectedBot);
    };

    const intervalId = setInterval(processQueue, 2000); // Check every 2 seconds

    return () => clearInterval(intervalId);
  }, []);

  return null; // Headless component
};
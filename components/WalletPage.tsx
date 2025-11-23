import React, { useState, useEffect } from 'react';
import { UserProfile, PaymentRequest } from '../types';
import { storageService } from '../services/storageService';
import { Link } from 'react-router-dom';

export const WalletPage: React.FC = () => {
  const [user, setUser] = useState<UserProfile>(storageService.getUser());
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState('Vodafone Cash');
  const [reference, setReference] = useState('');
  const [history, setHistory] = useState<PaymentRequest[]>([]);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
        // Poll for updates (in case admin approved something)
        setUser(storageService.getUser());
        const allRequests = storageService.getPaymentRequests();
        const myRequests = allRequests.filter(r => r.userId === user.id);
        setHistory(myRequests);
    }, 1000);
    return () => clearInterval(interval);
  }, [user.id]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !reference) return;

    const newRequest: PaymentRequest = {
      id: Date.now().toString(),
      userId: user.id,
      userName: user.name,
      amount: parseFloat(amount),
      method,
      referenceNumber: reference,
      status: 'pending',
      timestamp: Date.now(),
    };

    storageService.savePaymentRequest(newRequest);
    setSubmitted(true);
    setAmount('');
    setReference('');
    
    setTimeout(() => setSubmitted(false), 3000);
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-bold text-white">My Wallet</h1>
        <Link to="/" className="text-gray-400 hover:text-white flex items-center gap-2">
            <i className="fas fa-arrow-left"></i> Back to Store
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Current Balance Card */}
        <div className="bg-gradient-to-br from-gaming-800 to-gaming-900 border border-gray-700 p-6 rounded-xl flex flex-col justify-between relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10">
                <i className="fas fa-wallet text-9xl text-white"></i>
            </div>
            <div>
                <p className="text-gray-400 text-sm font-bold uppercase tracking-wider">Available Balance</p>
                <h2 className="text-4xl font-bold text-white mt-2">${user.balance.toFixed(2)}</h2>
            </div>
            <div className="mt-6 flex gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                <span className="text-xs text-green-400">Secure Wallet Active</span>
            </div>
        </div>

        {/* Top Up Form */}
        <div className="md:col-span-2 bg-gray-800 border border-gray-700 rounded-xl p-6">
            <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <i className="fas fa-plus-circle text-gaming-accent"></i> Add Funds
            </h3>
            
            {submitted ? (
                <div className="bg-green-900/30 border border-green-600 text-green-300 p-4 rounded-lg flex items-center gap-3">
                    <i className="fas fa-check-circle text-xl"></i>
                    <div>
                        <p className="font-bold">Request Sent!</p>
                        <p className="text-sm">Admin will review your transaction shortly.</p>
                    </div>
                </div>
            ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-gray-400 text-xs font-bold uppercase mb-1">Amount ($)</label>
                            <input 
                                type="number" 
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                className="w-full bg-gray-900 border border-gray-600 text-white p-3 rounded focus:outline-none focus:border-gaming-accent"
                                placeholder="0.00"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-gray-400 text-xs font-bold uppercase mb-1">Payment Method</label>
                            <select 
                                value={method}
                                onChange={(e) => setMethod(e.target.value)}
                                className="w-full bg-gray-900 border border-gray-600 text-white p-3 rounded focus:outline-none focus:border-gaming-accent"
                            >
                                <option>Vodafone Cash</option>
                                <option>InstaPay</option>
                                <option>USDT (TRC20)</option>
                                <option>Bank Transfer</option>
                            </select>
                        </div>
                    </div>
                    <div>
                        <label className="block text-gray-400 text-xs font-bold uppercase mb-1">Transaction Ref / Number</label>
                        <input 
                            type="text" 
                            value={reference}
                            onChange={(e) => setReference(e.target.value)}
                            className="w-full bg-gray-900 border border-gray-600 text-white p-3 rounded focus:outline-none focus:border-gaming-accent"
                            placeholder="e.g. Transaction ID, Phone Number sent from..."
                            required
                        />
                    </div>
                    <button 
                        type="submit" 
                        className="w-full bg-gaming-accent hover:bg-violet-600 text-white font-bold py-3 rounded transition-colors"
                    >
                        Submit Recharge Request
                    </button>
                </form>
            )}
        </div>
      </div>

      {/* History */}
      <div className="bg-gray-800 border border-gray-700 rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-700 bg-gray-900">
            <h3 className="font-bold text-white">History</h3>
        </div>
        <table className="w-full text-left text-sm text-gray-400">
            <thead className="bg-gray-900/50">
                <tr>
                    <th className="px-6 py-3">Date</th>
                    <th className="px-6 py-3">Method</th>
                    <th className="px-6 py-3">Amount</th>
                    <th className="px-6 py-3">Status</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
                {history.map(req => (
                    <tr key={req.id}>
                        <td className="px-6 py-4">{new Date(req.timestamp).toLocaleDateString()}</td>
                        <td className="px-6 py-4">{req.method}</td>
                        <td className="px-6 py-4 font-mono text-white">${req.amount.toFixed(2)}</td>
                        <td className="px-6 py-4">
                            <span className={`px-2 py-1 rounded text-xs border ${
                                req.status === 'approved' ? 'bg-green-900/30 text-green-400 border-green-800' :
                                req.status === 'rejected' ? 'bg-red-900/30 text-red-400 border-red-800' :
                                'bg-yellow-900/30 text-yellow-400 border-yellow-800'
                            }`}>
                                {req.status.toUpperCase()}
                            </span>
                        </td>
                    </tr>
                ))}
                {history.length === 0 && (
                    <tr><td colSpan={4} className="text-center py-6">No history yet.</td></tr>
                )}
            </tbody>
        </table>
      </div>
    </div>
  );
};
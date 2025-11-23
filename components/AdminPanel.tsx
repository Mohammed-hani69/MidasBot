import React, { useState, useEffect, useRef } from 'react';
import { Product, BotAccount, Transaction, PaymentRequest } from '../types';
import { storageService } from '../services/storageService';
import { parseProductCSV } from '../services/geminiService';
import { generatePythonScript, generateJavaScriptConsoleCode } from '../services/automationService';

export const AdminPanel: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'products' | 'accounts' | 'transactions' | 'payments' | 'bot' | 'queue'>('products');
  const [products, setProducts] = useState<Product[]>([]);
  const [accounts, setAccounts] = useState<BotAccount[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [paymentRequests, setPaymentRequests] = useState<PaymentRequest[]>([]);

  // Form States
  const [newProduct, setNewProduct] = useState({ name: '', price: '', imageUrl: '', codeList: '' });
  const [newAccount, setNewAccount] = useState({ email: '', password: '' });
  
  // Import State
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Initial load
    refreshData();
    // Poll for new payment requests & queue status
    const interval = setInterval(refreshData, 1000);
    return () => clearInterval(interval);
  }, []);

  const refreshData = () => {
    setProducts(storageService.getProducts());
    setAccounts(storageService.getAccounts());
    setTransactions(storageService.getTransactions());
    setPaymentRequests(storageService.getPaymentRequests());
  };

  const handleAddProduct = () => {
    if (!newProduct.name || !newProduct.price || !newProduct.codeList) return;
    
    // Parse codes from textarea (split by newline)
    const codes = newProduct.codeList.split('\n').map(c => c.trim()).filter(c => c !== '');
    
    if (codes.length === 0) return;

    // Check if product with this name already exists
    const existingProductIndex = products.findIndex(p => p.name.toLowerCase() === newProduct.name.toLowerCase());

    let updatedProducts = [...products];

    if (existingProductIndex >= 0) {
        // Merge codes into existing product
        const existing = updatedProducts[existingProductIndex];
        const newCodes = [...existing.redeemCodes, ...codes];
        updatedProducts[existingProductIndex] = { ...existing, redeemCodes: newCodes, price: parseFloat(newProduct.price) }; // Update price too just in case
    } else {
        // Create new product
        const product: Product = {
          id: Date.now().toString(),
          name: newProduct.name,
          price: parseFloat(newProduct.price),
          imageUrl: newProduct.imageUrl || 'https://picsum.photos/200/200',
          redeemCodes: codes,
        };
        updatedProducts.push(product);
    }

    setProducts(updatedProducts);
    storageService.saveProducts(updatedProducts);
    setNewProduct({ name: '', price: '', imageUrl: '', codeList: '' });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setIsImporting(true);
    const reader = new FileReader();
    reader.onload = async (event) => {
        const text = event.target?.result as string;
        if (text) {
            const extractedData = await parseProductCSV(text);
            if (extractedData && extractedData.length > 0) {
                let currentProducts = [...products];

                // Merge Logic
                extractedData.forEach(importedItem => {
                    const existingIndex = currentProducts.findIndex(p => p.name.toLowerCase() === importedItem.name.toLowerCase());
                    
                    if (existingIndex >= 0) {
                        // Add code to existing product
                        if (importedItem.redeemCode) {
                            currentProducts[existingIndex].redeemCodes.push(importedItem.redeemCode);
                        }
                    } else {
                        // Create new
                        currentProducts.push({
                            id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
                            name: importedItem.name,
                            price: importedItem.price,
                            imageUrl: importedItem.imageUrl || `https://picsum.photos/200/200?random=${Math.floor(Math.random() * 1000)}`,
                            redeemCodes: [importedItem.redeemCode]
                        });
                    }
                });

                setProducts(currentProducts);
                storageService.saveProducts(currentProducts);
                alert(`Successfully processed import. Stock levels updated.`);
            } else {
                alert("Failed to parse products. Please ensure the file contains valid product data.");
            }
        }
        setIsImporting(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };
    reader.readAsText(file);
  };

  const handleAddAccount = () => {
    if (!newAccount.email || !newAccount.password) return;
    const account: BotAccount = {
      id: Date.now().toString(),
      email: newAccount.email,
      password: newAccount.password,
      status: 'active',
      runtimeStatus: 'online'
    };
    const updated = [...accounts, account];
    setAccounts(updated);
    storageService.saveAccounts(updated);
    setNewAccount({ email: '', password: '' });
  };

  const handleDeleteProduct = (id: string) => {
    const updated = products.filter(p => p.id !== id);
    setProducts(updated);
    storageService.saveProducts(updated);
  };

  const handleDeleteAccount = (id: string) => {
    const updated = accounts.filter(a => a.id !== id);
    setAccounts(updated);
    storageService.saveAccounts(updated);
  };

  // Payment Handling
  const handleApprovePayment = (req: PaymentRequest) => {
    storageService.updatePaymentRequestStatus(req.id, 'approved');
    const user = storageService.getUser();
    if (user.id === req.userId) {
        user.balance += req.amount;
        storageService.saveUser(user);
    }
    refreshData();
  };

  const handleRejectPayment = (id: string) => {
    storageService.updatePaymentRequestStatus(id, 'rejected');
    refreshData();
  };

  const queuedTransactions = transactions.filter(t => t.status === 'queued').sort((a,b) => a.timestamp - b.timestamp);
  const activeTransactions = transactions.filter(t => t.status === 'processing');

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h2 className="text-3xl font-bold text-white mb-8">Admin Control Center</h2>
      
      {/* Tabs */}
      <div className="flex gap-4 mb-8 border-b border-gray-700 pb-2 overflow-x-auto">
        <button 
          onClick={() => setActiveTab('products')}
          className={`px-4 py-2 rounded-t-lg transition-colors whitespace-nowrap ${activeTab === 'products' ? 'bg-gaming-accent text-white' : 'text-gray-400 hover:text-white'}`}
        >
          <i className="fas fa-box-open mr-2"></i> Products
        </button>
        <button 
          onClick={() => setActiveTab('accounts')}
          className={`px-4 py-2 rounded-t-lg transition-colors whitespace-nowrap ${activeTab === 'accounts' ? 'bg-gaming-accent text-white' : 'text-gray-400 hover:text-white'}`}
        >
          <i className="fas fa-users-cog mr-2"></i> Bot Accounts
        </button>
        <button 
          onClick={() => setActiveTab('queue')}
          className={`px-4 py-2 rounded-t-lg transition-colors whitespace-nowrap ${activeTab === 'queue' ? 'bg-gaming-accent text-white' : 'text-gray-400 hover:text-white'}`}
        >
          <i className="fas fa-tasks mr-2"></i> Queue
          {queuedTransactions.length > 0 && (
             <span className="ml-2 bg-yellow-500 text-black font-bold text-xs px-2 py-0.5 rounded-full">
                {queuedTransactions.length}
             </span>
          )}
        </button>
        <button 
          onClick={() => setActiveTab('transactions')}
          className={`px-4 py-2 rounded-t-lg transition-colors whitespace-nowrap ${activeTab === 'transactions' ? 'bg-gaming-accent text-white' : 'text-gray-400 hover:text-white'}`}
        >
          <i className="fas fa-history mr-2"></i> Transactions
        </button>
        <button 
          onClick={() => setActiveTab('payments')}
          className={`px-4 py-2 rounded-t-lg transition-colors whitespace-nowrap ${activeTab === 'payments' ? 'bg-gaming-accent text-white' : 'text-gray-400 hover:text-white'}`}
        >
          <i className="fas fa-money-bill-wave mr-2"></i> Payments
          {paymentRequests.filter(r => r.status === 'pending').length > 0 && (
             <span className="ml-2 bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                {paymentRequests.filter(r => r.status === 'pending').length}
             </span>
          )}
        </button>
        <button 
          onClick={() => setActiveTab('bot')}
          className={`px-4 py-2 rounded-t-lg transition-colors whitespace-nowrap ${activeTab === 'bot' ? 'bg-yellow-600 text-white' : 'text-gray-400 hover:text-white'}`}
        >
          <i className="fas fa-robot mr-2"></i> Bot Engine
        </button>
      </div>

      {/* PRODUCTS TAB */}
      {activeTab === 'products' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 h-fit">
            <h3 className="text-xl font-bold text-white mb-4">Add Products / Inventory</h3>
            <div className="space-y-4">
              <input 
                type="text" 
                placeholder="Product Name (e.g. 60 UC)" 
                className="w-full bg-gray-900 border border-gray-700 text-white p-3 rounded focus:outline-none focus:border-gaming-accent"
                value={newProduct.name}
                onChange={e => setNewProduct({...newProduct, name: e.target.value})}
              />
              <input 
                type="number" 
                placeholder="Price ($)" 
                className="w-full bg-gray-900 border border-gray-700 text-white p-3 rounded focus:outline-none focus:border-gaming-accent"
                value={newProduct.price}
                onChange={e => setNewProduct({...newProduct, price: e.target.value})}
              />
              <input 
                type="text" 
                placeholder="Image URL (optional)" 
                className="w-full bg-gray-900 border border-gray-700 text-white p-3 rounded focus:outline-none focus:border-gaming-accent"
                value={newProduct.imageUrl}
                onChange={e => setNewProduct({...newProduct, imageUrl: e.target.value})}
              />
              <div>
                  <label className="text-xs text-gray-400 mb-1 block">Redeem Codes (One per line)</label>
                  <textarea 
                    placeholder="UC60-AAAA-1111&#10;UC60-BBBB-2222&#10;UC60-CCCC-3333" 
                    className="w-full bg-gray-900 border border-gray-700 text-white p-3 rounded focus:outline-none focus:border-gaming-accent font-mono h-32"
                    value={newProduct.codeList}
                    onChange={e => setNewProduct({...newProduct, codeList: e.target.value})}
                  />
                  <p className="text-xs text-gray-500 mt-1">If Product Name exists, codes will be added to its inventory.</p>
              </div>
              <button 
                onClick={handleAddProduct}
                className="w-full bg-gaming-success hover:bg-emerald-600 text-white font-bold py-3 rounded transition-colors"
              >
                Add Inventory
              </button>
            </div>

            <div className="mt-8 pt-6 border-t border-gray-700">
                <p className="text-gray-400 text-sm mb-3 text-center">Bulk Import with AI</p>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  className="hidden" 
                  accept=".csv,.txt" 
                  onChange={handleFileChange} 
                />
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isImporting}
                  className="w-full bg-gray-700 hover:bg-gray-600 text-white font-bold py-3 rounded transition-colors flex items-center justify-center gap-2 border border-gray-600 border-dashed"
                >
                  {isImporting ? (
                    <><i className="fas fa-cog fa-spin"></i> Analyzing File...</>
                  ) : (
                    <><i className="fas fa-file-csv"></i> Upload CSV / Text File</>
                  )}
                </button>
            </div>
          </div>

          <div className="space-y-4">
             {products.map(p => (
               <div key={p.id} className="bg-gray-800 p-4 rounded-xl border border-gray-700 flex items-center justify-between">
                 <div className="flex items-center gap-4">
                   <img src={p.imageUrl} alt={p.name} className="w-12 h-12 rounded object-cover" />
                   <div>
                     <h4 className="font-bold text-white">{p.name}</h4>
                     <p className="text-gray-400 text-sm">${p.price.toFixed(2)}</p>
                     <div className="flex items-center gap-2 mt-1">
                         <i className="fas fa-barcode text-gray-500 text-xs"></i>
                         <span className={`text-xs font-bold ${p.redeemCodes.length > 0 ? 'text-green-400' : 'text-red-500'}`}>
                             {p.redeemCodes.length} codes available
                         </span>
                     </div>
                   </div>
                 </div>
                 <button onClick={() => handleDeleteProduct(p.id)} className="text-red-500 hover:text-red-400">
                   <i className="fas fa-trash"></i>
                 </button>
               </div>
             ))}
             {products.length === 0 && <p className="text-gray-500 text-center">No products found.</p>}
          </div>
        </div>
      )}

      {/* ACCOUNTS TAB */}
      {activeTab === 'accounts' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
            <h3 className="text-xl font-bold text-white mb-4">Add Midasbuy Account</h3>
            <div className="space-y-4">
              <input 
                type="email" 
                placeholder="Email" 
                className="w-full bg-gray-900 border border-gray-700 text-white p-3 rounded focus:outline-none focus:border-gaming-accent"
                value={newAccount.email}
                onChange={e => setNewAccount({...newAccount, email: e.target.value})}
              />
              <input 
                type="password" 
                placeholder="Password" 
                className="w-full bg-gray-900 border border-gray-700 text-white p-3 rounded focus:outline-none focus:border-gaming-accent"
                value={newAccount.password}
                onChange={e => setNewAccount({...newAccount, password: e.target.value})}
              />
              <button 
                onClick={handleAddAccount}
                className="w-full bg-gaming-accent hover:bg-violet-600 text-white font-bold py-3 rounded transition-colors"
              >
                Add Account
              </button>
            </div>
          </div>

          <div className="space-y-4">
             {accounts.map(a => {
               // Determine status display
               const isOnline = a.status === 'active' && (!a.runtimeStatus || a.runtimeStatus === 'online');
               const isBusy = a.status === 'active' && a.runtimeStatus === 'busy';
               const isOffline = a.status === 'disabled' || a.runtimeStatus === 'offline';

               return (
               <div key={a.id} className="bg-gray-800 p-4 rounded-xl border border-gray-700 flex items-center justify-between">
                 <div>
                   <h4 className="font-bold text-white">{a.email}</h4>
                   <p className="text-xs text-gray-500 mt-1">Password: ••••••••</p>
                   <div className="mt-2 flex items-center gap-2">
                       {isOnline && (
                           <span className="flex items-center gap-1.5 px-2 py-0.5 rounded text-xs bg-green-900/50 text-green-300 border border-green-700">
                               <div className="w-1.5 h-1.5 rounded-full bg-green-400"></div> Online
                           </span>
                       )}
                       {isBusy && (
                           <span className="flex items-center gap-1.5 px-2 py-0.5 rounded text-xs bg-yellow-900/50 text-yellow-300 border border-yellow-700">
                               <div className="w-1.5 h-1.5 rounded-full bg-yellow-400 animate-pulse"></div> Busy
                           </span>
                       )}
                       {isOffline && (
                           <span className="flex items-center gap-1.5 px-2 py-0.5 rounded text-xs bg-red-900/50 text-red-300 border border-red-700">
                               <div className="w-1.5 h-1.5 rounded-full bg-red-400"></div> Offline
                           </span>
                       )}
                   </div>
                 </div>
                 <button onClick={() => handleDeleteAccount(a.id)} className="text-red-500 hover:text-red-400">
                   <i className="fas fa-trash"></i>
                 </button>
               </div>
             )})}
             {accounts.length === 0 && <p className="text-gray-500 text-center">No accounts configured.</p>}
          </div>
        </div>
      )}

      {/* QUEUE TAB */}
      {activeTab === 'queue' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Bot Status Monitor */}
              <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
                  <h3 className="font-bold text-white mb-4"><i className="fas fa-network-wired mr-2"></i> Active Bot Cluster</h3>
                  <div className="space-y-4">
                      {accounts.filter(a => a.status === 'active').map(a => {
                          const isBusy = a.runtimeStatus === 'busy';
                          const currentTask = activeTransactions.find(t => t.botId === a.id);
                          return (
                              <div key={a.id} className="bg-gray-900 p-4 rounded-lg border border-gray-700">
                                  <div className="flex justify-between items-start">
                                      <div>
                                          <div className="text-sm font-bold text-gray-200">{a.email}</div>
                                          <div className="text-xs text-gray-500 font-mono mt-1">ID: {a.id.slice(0,6)}</div>
                                      </div>
                                      <div className={`px-2 py-1 rounded text-xs font-bold uppercase ${isBusy ? 'bg-yellow-900 text-yellow-500 animate-pulse' : 'bg-green-900 text-green-500'}`}>
                                          {a.runtimeStatus || 'online'}
                                      </div>
                                  </div>
                                  {isBusy && currentTask && (
                                      <div className="mt-3 pt-3 border-t border-gray-800">
                                          <p className="text-xs text-gray-400">Current Task:</p>
                                          <p className="text-sm text-yellow-400">Processing Order #{currentTask.id.slice(0,8)}</p>
                                          <div className="w-full bg-gray-800 h-1 mt-2 rounded-full overflow-hidden">
                                              <div className="h-full bg-yellow-500 w-2/3 animate-[progress_1s_infinite]"></div>
                                          </div>
                                      </div>
                                  )}
                              </div>
                          )
                      })}
                      {accounts.filter(a => a.status === 'active').length === 0 && (
                          <div className="text-center text-red-500 py-4">No active bots found. Start a bot to process queue.</div>
                      )}
                  </div>
              </div>

              {/* Pending Queue */}
              <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
                  <h3 className="font-bold text-white mb-4"><i className="fas fa-list-ol mr-2"></i> Pending Queue ({queuedTransactions.length})</h3>
                  <div className="space-y-2 h-[500px] overflow-y-auto pr-2">
                      {queuedTransactions.map((t, idx) => (
                          <div key={t.id} className="bg-gray-900/50 p-3 rounded border border-gray-700 flex justify-between items-center group">
                              <div className="flex items-center gap-3">
                                  <div className="bg-gray-800 w-6 h-6 rounded flex items-center justify-center text-xs text-gray-400 font-mono">
                                      {idx + 1}
                                  </div>
                                  <div>
                                      <div className="text-sm text-white">Order #{t.id.slice(0,8)}</div>
                                      <div className="text-xs text-gray-500">{t.productName} • Player: {t.playerId}</div>
                                  </div>
                              </div>
                              <span className="text-xs text-yellow-500 font-mono">Waiting...</span>
                          </div>
                      ))}
                      {queuedTransactions.length === 0 && (
                          <div className="flex flex-col items-center justify-center h-full text-gray-600">
                              <i className="fas fa-check-circle text-4xl mb-2"></i>
                              <p>Queue is empty</p>
                          </div>
                      )}
                  </div>
              </div>
          </div>
      )}

      {/* TRANSACTIONS TAB */}
      {activeTab === 'transactions' && (
        <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
          <table className="w-full text-left text-sm text-gray-400">
            <thead className="bg-gray-900 text-gray-200 uppercase font-medium">
              <tr>
                <th className="px-6 py-4">ID</th>
                <th className="px-6 py-4">Player ID</th>
                <th className="px-6 py-4">Product</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Bot</th>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">AI Note</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {transactions.map(t => (
                <tr key={t.id} className="hover:bg-gray-700/50">
                  <td className="px-6 py-4 font-mono">{t.id.slice(0,8)}</td>
                  <td className="px-6 py-4 font-mono text-white">{t.playerId}</td>
                  <td className="px-6 py-4">{t.productName}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded text-xs ${
                        t.status === 'success' ? 'bg-green-900 text-green-300' : 
                        t.status === 'failed' ? 'bg-red-900 text-red-300' :
                        t.status === 'processing' ? 'bg-yellow-900 text-yellow-300 animate-pulse' :
                        'bg-gray-700 text-gray-300'
                    }`}>
                      {t.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-xs font-mono">{t.botId ? accounts.find(a => a.id === t.botId)?.email || t.botId.slice(0,5) : '-'}</td>
                  <td className="px-6 py-4">{new Date(t.timestamp).toLocaleDateString()}</td>
                  <td className="px-6 py-4 italic text-xs max-w-xs truncate">{t.aiAnalysis || '-'}</td>
                </tr>
              ))}
              {transactions.length === 0 && (
                <tr>
                   <td colSpan={7} className="px-6 py-8 text-center text-gray-500">No transactions recorded yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* PAYMENT REQUESTS TAB */}
      {activeTab === 'payments' && (
          <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
             <div className="p-4 border-b border-gray-700 bg-gray-900/50">
                 <h3 className="text-white font-bold">Incoming Fund Requests</h3>
             </div>
             <table className="w-full text-left text-sm text-gray-400">
                 <thead className="bg-gray-900 text-gray-200 uppercase font-medium">
                     <tr>
                         <th className="px-6 py-4">Date</th>
                         <th className="px-6 py-4">User</th>
                         <th className="px-6 py-4">Method / Ref</th>
                         <th className="px-6 py-4">Amount</th>
                         <th className="px-6 py-4">Actions</th>
                     </tr>
                 </thead>
                 <tbody className="divide-y divide-gray-700">
                     {paymentRequests.filter(p => p.status === 'pending').map(req => (
                         <tr key={req.id} className="hover:bg-gray-700/50 bg-gray-800">
                             <td className="px-6 py-4">{new Date(req.timestamp).toLocaleDateString()} {new Date(req.timestamp).toLocaleTimeString()}</td>
                             <td className="px-6 py-4 font-bold text-white">{req.userName}</td>
                             <td className="px-6 py-4">
                                 <div className="text-white">{req.method}</div>
                                 <div className="text-xs font-mono text-gray-500">{req.referenceNumber}</div>
                             </td>
                             <td className="px-6 py-4 text-green-400 font-mono font-bold text-lg">${req.amount.toFixed(2)}</td>
                             <td className="px-6 py-4 flex gap-2">
                                 <button 
                                     onClick={() => handleApprovePayment(req)}
                                     className="bg-green-600 hover:bg-green-500 text-white px-3 py-1 rounded text-xs font-bold"
                                 >
                                     Approve
                                 </button>
                                 <button 
                                     onClick={() => handleRejectPayment(req.id)}
                                     className="bg-red-600 hover:bg-red-500 text-white px-3 py-1 rounded text-xs font-bold"
                                 >
                                     Reject
                                 </button>
                             </td>
                         </tr>
                     ))}
                     {paymentRequests.filter(p => p.status === 'pending').length === 0 && (
                         <tr>
                             <td colSpan={5} className="px-6 py-8 text-center text-gray-500">No pending requests.</td>
                         </tr>
                     )}
                 </tbody>
             </table>
             
             {/* History Section for payments */}
             <div className="p-4 border-t border-b border-gray-700 bg-gray-900/50 mt-4">
                 <h3 className="text-gray-400 font-bold text-sm uppercase">Processed History</h3>
             </div>
             <table className="w-full text-left text-sm text-gray-500">
                <tbody className="divide-y divide-gray-700">
                     {paymentRequests.filter(p => p.status !== 'pending').map(req => (
                         <tr key={req.id} className="hover:bg-gray-800/50">
                             <td className="px-6 py-2">{new Date(req.timestamp).toLocaleDateString()}</td>
                             <td className="px-6 py-2">{req.userName}</td>
                             <td className="px-6 py-2">${req.amount}</td>
                             <td className="px-6 py-2">
                                <span className={req.status === 'approved' ? 'text-green-500' : 'text-red-500'}>
                                    {req.status.toUpperCase()}
                                </span>
                             </td>
                         </tr>
                     ))}
                </tbody>
             </table>
          </div>
      )}

      {/* BOT ENGINE TAB */}
      {activeTab === 'bot' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="col-span-1 lg:col-span-2 bg-yellow-900/20 border border-yellow-700 p-4 rounded-xl flex items-start gap-4">
                <i className="fas fa-exclamation-triangle text-yellow-500 text-xl mt-1"></i>
                <div>
                    <h4 className="text-yellow-500 font-bold">Execution Mode</h4>
                    <p className="text-gray-300 text-sm">
                        Browsers do not allow web apps to control other websites directly due to security (CORS). 
                        To execute the <span className="text-white font-bold">real login flow</span> as you requested, 
                        you must use the provided Python script or Console Code below. This code is pre-filled with your Active Accounts.
                    </p>
                </div>
            </div>

            <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden flex flex-col h-[600px]">
                <div className="bg-gray-900 px-4 py-3 border-b border-gray-700 flex justify-between items-center">
                    <h3 className="font-bold text-white"><i className="fab fa-python text-blue-400 mr-2"></i> Python Selenium Script</h3>
                    <button 
                        onClick={() => navigator.clipboard.writeText(generatePythonScript(accounts))}
                        className="bg-blue-600 hover:bg-blue-500 text-white text-xs px-3 py-1 rounded"
                    >
                        Copy Script
                    </button>
                </div>
                <div className="p-4 flex-1 overflow-auto bg-gray-950 font-mono text-xs text-green-400 whitespace-pre">
                    {generatePythonScript(accounts)}
                </div>
            </div>

            <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden flex flex-col h-[600px]">
                <div className="bg-gray-900 px-4 py-3 border-b border-gray-700 flex justify-between items-center">
                    <h3 className="font-bold text-white"><i className="fab fa-js text-yellow-400 mr-2"></i> Console / Bookmarklet</h3>
                    <button 
                        onClick={() => navigator.clipboard.writeText(generateJavaScriptConsoleCode(accounts))}
                        className="bg-yellow-600 hover:bg-yellow-500 text-white text-xs px-3 py-1 rounded"
                    >
                        Copy Code
                    </button>
                </div>
                <div className="p-4 bg-gray-700/50 border-b border-gray-600 text-sm text-gray-300">
                    <p><strong>Instructions:</strong></p>
                    <ol className="list-decimal ml-5 mt-1 space-y-1">
                        <li>Open <a href="https://www.midasbuy.com/midasbuy/eg/redeem/pubgm" target="_blank" className="text-blue-400 underline">Midasbuy</a> in a new tab.</li>
                        <li>Press <code>F12</code> to open Developer Console.</li>
                        <li>Paste the code below and press Enter.</li>
                    </ol>
                </div>
                <div className="p-4 flex-1 overflow-auto bg-gray-950 font-mono text-xs text-yellow-200 whitespace-pre">
                    {generateJavaScriptConsoleCode(accounts)}
                </div>
            </div>
        </div>
      )}
    </div>
  );
};
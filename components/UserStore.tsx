import React, { useState, useEffect } from 'react';
import { Product, UserProfile, Transaction } from '../types';
import { storageService } from '../services/storageService';
import { BotTerminal } from './BotTerminal';
import { validatePlayerId } from '../services/geminiService';
import { Link } from 'react-router-dom';

interface ResultModalState {
  show: boolean;
  type: 'success' | 'error';
  title: string;
  message: string;
}

export const UserStore: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [user, setUser] = useState<UserProfile>(storageService.getUser());
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [playerId, setPlayerId] = useState('');
  
  // Queue & Monitoring State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTransactionId, setActiveTransactionId] = useState<string | null>(null);
  const [activeTransaction, setActiveTransaction] = useState<Transaction | null>(null);
  const [showMonitor, setShowMonitor] = useState(false);

  // Result Modal State
  const [resultModal, setResultModal] = useState<ResultModalState>({
    show: false,
    type: 'success',
    title: '',
    message: ''
  });

  useEffect(() => {
    setProducts(storageService.getProducts());
    const interval = setInterval(() => {
       setUser(storageService.getUser());
       // Also refresh products in case admin adds new ones
       setProducts(storageService.getProducts());

       // Poll for active transaction update if monitoring
       if (activeTransactionId) {
           const allT = storageService.getTransactions();
           const t = allT.find(tr => tr.id === activeTransactionId);
           if (t) {
               setActiveTransaction(t);
           }
       }
    }, 1000);
    return () => clearInterval(interval);
  }, [activeTransactionId]);

  // Handle transaction completion logic
  useEffect(() => {
    if (activeTransaction) {
        if (activeTransaction.status === 'success') {
            setResultModal({
                show: true,
                type: 'success',
                title: 'Operation Successful',
                message: activeTransaction.aiAnalysis || 'The recharging process was completed successfully.'
            });
            resetSelection();
        } else if (activeTransaction.status === 'failed') {
            setResultModal({
                show: true,
                type: 'error',
                title: 'Operation Failed',
                message: activeTransaction.aiAnalysis || 'The transaction could not be completed.'
            });
            resetSelection();
        }
    }
  }, [activeTransaction?.status]);

  const resetSelection = () => {
    setActiveTransactionId(null);
    setActiveTransaction(null);
    setShowMonitor(false);
    setSelectedProduct(null);
    setPlayerId('');
  }

  const closeResultModal = () => {
      setResultModal({ ...resultModal, show: false });
  };

  const handleBuy = async () => {
    if (!selectedProduct) return;
    if (!playerId) {
      setResultModal({
          show: true,
          type: 'error',
          title: 'Input Error',
          message: 'Please enter a valid Player ID.'
      });
      return;
    }

    // CHECK STOCK
    if (!selectedProduct.redeemCodes || selectedProduct.redeemCodes.length === 0) {
        setResultModal({
            show: true,
            type: 'error',
            title: 'Out of Stock',
            message: 'This product is currently unavailable.'
        });
        return;
    }

    setIsSubmitting(true);
    
    // --- STEP 1: VERIFY ID (Gemini Flash) ---
    const idCheck = await validatePlayerId(playerId);
    if (!idCheck.isValid) {
        setResultModal({
            show: true,
            type: 'error',
            title: 'Invalid Player ID',
            message: idCheck.message || 'The format of the Player ID is incorrect.'
        });
        setIsSubmitting(false);
        return;
    }

    // --- STEP 2: CHECK BALANCE ---
    if (user.balance < selectedProduct.price) {
        setResultModal({
            show: true,
            type: 'error',
            title: 'Insufficient Funds',
            message: `Required: $${selectedProduct.price.toFixed(2)}\nAvailable: $${user.balance.toFixed(2)}`
        });
        setIsSubmitting(false);
        return;
    }
    
    // --- STEP 3: CREATE QUEUED TRANSACTION ---
    // Pick first available code
    const codeToUse = selectedProduct.redeemCodes[0];
    
    const newTransaction: Transaction = {
          id: Date.now().toString(),
          playerId,
          productId: selectedProduct.id,
          productName: selectedProduct.name,
          amount: selectedProduct.price,
          status: 'queued',
          timestamp: Date.now(),
          log: [`> [System] Order placed. Status: Queued. Waiting for bot...`],
          redeemCode: codeToUse
    };
    
    storageService.saveTransaction(newTransaction);
    setActiveTransactionId(newTransaction.id);
    setActiveTransaction(newTransaction);
    setShowMonitor(true);
    setIsSubmitting(false);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto relative">
      {/* Bot Terminal / Monitor Overlay */}
      <BotTerminal 
        isOpen={showMonitor} 
        logs={activeTransaction?.log || []} 
      />

      {/* Result Notification Modal */}
      {resultModal.show && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-gray-900 rounded-2xl border border-gray-700 shadow-2xl max-w-md w-full overflow-hidden transform transition-all scale-100">
                {/* Modal Header */}
                <div className={`p-6 flex flex-col items-center justify-center text-center ${resultModal.type === 'success' ? 'bg-green-900/20' : 'bg-red-900/20'}`}>
                    <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-4 ${resultModal.type === 'success' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                        <i className={`fas ${resultModal.type === 'success' ? 'fa-check' : 'fa-times'} text-4xl`}></i>
                    </div>
                    <h3 className={`text-2xl font-bold ${resultModal.type === 'success' ? 'text-green-400' : 'text-red-400'}`}>
                        {resultModal.title}
                    </h3>
                </div>
                
                {/* Modal Body */}
                <div className="p-6">
                    <p className="text-gray-300 text-center text-lg whitespace-pre-line leading-relaxed">
                        {resultModal.message}
                    </p>
                    
                    <div className="mt-8">
                        <button 
                            onClick={closeResultModal}
                            className={`w-full py-3 px-4 rounded-xl font-bold text-white transition-all transform active:scale-95 ${
                                resultModal.type === 'success' 
                                ? 'bg-green-600 hover:bg-green-500 shadow-lg shadow-green-900/50' 
                                : 'bg-red-600 hover:bg-red-500 shadow-lg shadow-red-900/50'
                            }`}
                        >
                            {resultModal.type === 'success' ? 'Done' : 'Close'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
      )}
      
      {/* Header Info */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 bg-gray-800 p-6 rounded-2xl border border-gray-700 shadow-lg">
        <div>
          <h1 className="text-3xl font-bold text-white">MidasBot Store</h1>
          <p className="text-gray-400 mt-1">Automated Redemption System powered by Gemini</p>
        </div>
        <div className="mt-4 md:mt-0 flex items-center gap-3">
            <div className="bg-gray-900 px-6 py-3 rounded-xl border border-gaming-accent/50 flex items-center gap-3">
            <i className="fas fa-wallet text-gaming-accent text-xl"></i>
            <div>
                <p className="text-xs text-gray-500 uppercase font-bold">Your Balance</p>
                <p className="text-xl font-mono font-bold text-white">${user.balance.toFixed(2)}</p>
            </div>
            </div>
            <Link to="/wallet" className="bg-gaming-accent hover:bg-violet-600 text-white px-4 py-3 rounded-xl font-bold transition-colors shadow-lg shadow-purple-900/50">
                <i className="fas fa-plus mr-1"></i> Add Funds
            </Link>
        </div>
      </div>

      {/* Product Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {products.map(product => {
          const hasStock = product.redeemCodes && product.redeemCodes.length > 0;
          return (
            <div 
              key={product.id} 
              className={`
                relative group bg-gray-800 rounded-2xl p-4 border transition-all duration-300 cursor-pointer
                ${selectedProduct?.id === product.id 
                  ? 'border-gaming-accent shadow-[0_0_20px_rgba(139,92,246,0.3)] transform -translate-y-1' 
                  : 'border-gray-700 hover:border-gray-500 hover:shadow-xl'}
                ${!hasStock ? 'opacity-60 grayscale' : ''}
              `}
              onClick={() => hasStock && setSelectedProduct(product)}
            >
              <div className="aspect-square bg-gray-900 rounded-xl mb-4 overflow-hidden relative">
                <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                <div className="absolute top-2 right-2 bg-black/60 backdrop-blur px-2 py-1 rounded text-white font-bold text-sm">
                  ${product.price}
                </div>
                {!hasStock && (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                        <span className="text-red-500 font-bold border-2 border-red-500 px-4 py-1 rounded -rotate-12">OUT OF STOCK</span>
                    </div>
                )}
              </div>
              
              <h3 className="text-xl font-bold text-white mb-2">{product.name}</h3>
              <div className="flex justify-between items-center text-sm text-gray-400">
                 <span className={hasStock ? "text-green-400" : "text-red-500"}>
                     {hasStock ? `${product.redeemCodes.length} Available` : 'Sold Out'}
                 </span>
                 <i className="fas fa-bolt text-yellow-400"></i>
              </div>
              
              <button 
                disabled={!hasStock}
                className={`mt-4 w-full py-2 rounded-lg font-bold transition-all ${
                  selectedProduct?.id === product.id 
                    ? 'bg-gaming-accent text-white' 
                    : hasStock 
                        ? 'bg-gray-700 text-gray-400 group-hover:bg-gray-600 group-hover:text-white'
                        : 'bg-gray-800 text-gray-600 cursor-not-allowed'
                }`}>
                {hasStock ? (selectedProduct?.id === product.id ? 'Selected' : 'Select Pack') : 'Unavailable'}
              </button>
            </div>
          );
        })}
        {products.length === 0 && (
            <div className="col-span-full text-center py-12 text-gray-500 bg-gray-800/50 rounded-xl border border-dashed border-gray-700">
                <i className="fas fa-box-open text-4xl mb-4"></i>
                <p>No products available. Please add them in the Admin Panel.</p>
            </div>
        )}
      </div>

      {/* Checkout Bar (Sticky) */}
      <div className={`
        fixed bottom-0 left-0 right-0 bg-gray-900/95 backdrop-blur-md border-t border-gray-700 p-4 transform transition-transform duration-300 z-30
        ${selectedProduct ? 'translate-y-0' : 'translate-y-full'}
      `}>
        <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center gap-4">
          <div className="flex-1 w-full">
            <label className="text-xs text-gray-400 uppercase font-bold ml-1">Player ID (PUBG)</label>
            <div className="relative mt-1">
              <i className="fas fa-id-card absolute left-3 top-3 text-gray-500"></i>
              <input 
                type="text" 
                value={playerId}
                onChange={(e) => setPlayerId(e.target.value)}
                placeholder="Enter Player ID"
                className="w-full bg-black/50 border border-gray-600 text-white pl-10 pr-4 py-2.5 rounded-lg focus:outline-none focus:border-gaming-accent focus:ring-1 focus:ring-gaming-accent"
              />
            </div>
          </div>
          
          <div className="flex items-center gap-4 w-full md:w-auto mt-2 md:mt-0">
             <div className="text-right hidden md:block">
               <p className="text-sm text-gray-400">Total Check</p>
               <p className="text-xl font-bold text-white">${selectedProduct?.price}</p>
             </div>
             <button 
               onClick={handleBuy}
               disabled={isSubmitting || !!activeTransactionId}
               className="flex-1 md:flex-none bg-gradient-to-r from-gaming-accent to-purple-600 hover:from-purple-600 hover:to-gaming-accent text-white font-bold py-3 px-8 rounded-lg shadow-lg transform active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
             >
               {isSubmitting || activeTransactionId ? (
                 <span className="flex items-center gap-2"><i className="fas fa-clock fa-spin"></i> In Queue...</span>
               ) : (
                 <span className="flex items-center gap-2"><i className="fas fa-rocket"></i> CONFIRM & REDEEM</span>
               )}
             </button>
          </div>
        </div>
      </div>
    </div>
  );
};
import React, { useState } from 'react';
import { HashRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import { UserStore } from './components/UserStore';
import { AdminPanel } from './components/AdminPanel';
import { WalletPage } from './components/WalletPage';
import { QueueProcessor } from './components/QueueProcessor';

const NavBar: React.FC = () => {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <nav className="bg-gaming-900 border-b border-gray-800 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex items-center gap-2">
               <div className="bg-gradient-to-tr from-gaming-accent to-blue-500 w-8 h-8 rounded-lg flex items-center justify-center">
                 <i className="fas fa-robot text-white text-sm"></i>
               </div>
               <span className="text-white font-bold text-xl tracking-tight">Midas<span className="text-gaming-accent">Bot</span></span>
            </Link>
          </div>
          
          {/* Desktop Menu */}
          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-4">
              <Link 
                to="/" 
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${location.pathname === '/' ? 'text-white bg-gaming-800' : 'text-gray-300 hover:text-white hover:bg-gaming-800'}`}
              >
                Store
              </Link>
              <Link 
                to="/wallet" 
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${location.pathname === '/wallet' ? 'text-white bg-gaming-800' : 'text-gray-300 hover:text-white hover:bg-gaming-800'}`}
              >
                Wallet
              </Link>
              <Link 
                to="/admin" 
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${location.pathname === '/admin' ? 'text-white bg-gaming-800' : 'text-gray-300 hover:text-white hover:bg-gaming-800'}`}
              >
                Admin Panel
              </Link>
            </div>
          </div>

          {/* Mobile menu button */}
          <div className="-mr-2 flex md:hidden">
            <button 
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="bg-gaming-800 inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-white hover:bg-gaming-700 focus:outline-none"
            >
              <i className={`fas ${mobileMenuOpen ? 'fa-times' : 'fa-bars'}`}></i>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-gaming-900 pb-3 px-2 pt-2 space-y-1 sm:px-3 border-t border-gray-800">
           <Link 
                to="/" 
                onClick={() => setMobileMenuOpen(false)}
                className={`block px-3 py-2 rounded-md text-base font-medium ${location.pathname === '/' ? 'text-white bg-gaming-800' : 'text-gray-300 hover:text-white hover:bg-gaming-800'}`}
              >
                Store
              </Link>
              <Link 
                to="/wallet" 
                onClick={() => setMobileMenuOpen(false)}
                className={`block px-3 py-2 rounded-md text-base font-medium ${location.pathname === '/wallet' ? 'text-white bg-gaming-800' : 'text-gray-300 hover:text-white hover:bg-gaming-800'}`}
              >
                Wallet
              </Link>
              <Link 
                to="/admin" 
                onClick={() => setMobileMenuOpen(false)}
                className={`block px-3 py-2 rounded-md text-base font-medium ${location.pathname === '/admin' ? 'text-white bg-gaming-800' : 'text-gray-300 hover:text-white hover:bg-gaming-800'}`}
              >
                Admin Panel
              </Link>
        </div>
      )}
    </nav>
  );
};

const App: React.FC = () => {
  return (
    <HashRouter>
      <QueueProcessor />
      <div className="min-h-screen bg-gaming-900 text-gray-100 font-sans selection:bg-gaming-accent selection:text-white">
        <NavBar />
        <main>
          <Routes>
            <Route path="/" element={<UserStore />} />
            <Route path="/wallet" element={<WalletPage />} />
            <Route path="/admin" element={<AdminPanel />} />
          </Routes>
        </main>
      </div>
    </HashRouter>
  );
};

export default App;
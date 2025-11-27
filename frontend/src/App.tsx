import { useState } from 'react';
import Dashboard from './components/Dashboard';
import Reports from './components/Reports';
import './App.css';

function App() {
    const [currentPage, setCurrentPage] = useState<'dashboard' | 'reports'>('dashboard');

    return (
        <div className="App">
            {/* Navigation Header */}
            <nav className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm">
                <div className="max-w-7xl mx-auto px-8">
                    <div className="flex items-center justify-between h-16">
                        <div className="flex items-center gap-2">
                            <svg className="w-8 h-8 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                            </svg>
                            <span className="text-xl font-bold text-slate-800">Sales Tracker</span>
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setCurrentPage('dashboard')}
                                className={`px-6 py-2 rounded-lg font-semibold transition-all duration-200 ${currentPage === 'dashboard'
                                        ? 'bg-primary-600 text-white shadow-md'
                                        : 'text-slate-600 hover:bg-slate-100'
                                    }`}
                            >
                                Dashboard
                            </button>
                            <button
                                onClick={() => setCurrentPage('reports')}
                                className={`px-6 py-2 rounded-lg font-semibold transition-all duration-200 ${currentPage === 'reports'
                                        ? 'bg-primary-600 text-white shadow-md'
                                        : 'text-slate-600 hover:bg-slate-100'
                                    }`}
                            >
                                Reports
                            </button>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Page Content */}
            {currentPage === 'dashboard' ? <Dashboard /> : <Reports />}
        </div>
    );
}
export default App;

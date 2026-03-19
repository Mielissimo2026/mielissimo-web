import React from 'react';
import { ShoppingBag, Search } from 'lucide-react';
import { useStore } from '../context/store';
import logo from '../assets/logoCanva.png';

export default function Navbar() {
    const { cart, toggleCart, searchQuery, setSearchQuery } = useStore();
    const totalItems = cart.reduce((acc, item) => acc + item.cantidad, 0);

    return (
        <nav className="fixed top-0 w-full bg-[#ef5579] shadow-md z-50 transition-colors duration-300">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16 gap-4">
                    
                    {/* 1. LOGO LIMPIO (Sin fondo blanco) */}
                    <div className="flex-shrink-0 flex items-center cursor-pointer">
                        <img 
                            src={logo} 
                            alt="Mielissimo" 
                            className="h-12 w-auto object-contain hover:opacity-90 transition-opacity" 
                            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                        />
                    </div>

                    {/* 2. BUSCADOR */}
                    <div className="flex-1 max-w-lg relative">
                        <input
                            type="text"
                            placeholder="Buscar..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 rounded-full text-sm bg-white/20 text-white placeholder-white/80 border border-transparent focus:bg-white focus:text-[#ef5579] focus:placeholder-gray-400 focus:outline-none transition-all shadow-inner"
                        />
                        <div className="absolute left-3 top-1/2 transform -translate-y-1/2 pointer-events-none text-white/80">
                            <Search size={18} />
                        </div>
                    </div>

                    {/* 3. CARRITO */}
                    <div className="flex items-center">
                        <button
                            onClick={toggleCart}
                            className="relative p-2 text-white hover:bg-white/20 rounded-full transition-colors"
                        >
                            <ShoppingBag size={26} />
                            {totalItems > 0 && (
                                <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-[#ef5579] transform translate-x-1/4 -translate-y-1/4 bg-white rounded-full shadow-sm border border-[#ef5579]">
                                    {totalItems}
                                </span>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </nav>
    );
}
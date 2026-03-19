import React from 'react';
import { useStore } from '../context/store';
import { AlertCircle } from 'lucide-react';

export default function StoreStatusBanner() {
    const { storeStatus } = useStore();

    // Cambia a FALSE para que funcione con el Admin
    const FORCE_SHOW = false; 
    
    const status = storeStatus ? String(storeStatus).toUpperCase() : '';
    const isClosed = FORCE_SHOW || status === 'CERRADO';

    // Si está abierto, no mostramos nada
    if (!isClosed) return null;

    return (
        <div className="w-full bg-red-600 text-white rounded-lg shadow-md overflow-hidden animate-fade-in-down mb-4">
            <div className="px-4 py-3 flex flex-col items-center justify-center text-center">
                
                {/* Mensaje Principal */}
                <div className="flex items-center gap-2 font-bold text-lg uppercase tracking-wide mb-1">
                    <AlertCircle size={24} className="text-yellow-300" />
                    <span>¡LOCAL CERRADO!</span>
                </div>

                {/* Subtítulo que quería el cliente */}
                <div className="text-sm md:text-base font-medium opacity-95">
                    Podés dejar tu pedido y te responderemos apenas abramos.
                </div>
            </div>
        </div>
    );
}
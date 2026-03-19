import React from 'react';
import { Plus } from 'lucide-react';
import { useStore } from '../context/store';
import toast from 'react-hot-toast';

export default function ProductCard({ product, onClick }) {
    const { addToCart } = useStore();

    // Strict value parsing
    const precio = parseFloat(product.precio);
    const precioOferta = product.precio_oferta ? parseFloat(product.precio_oferta) : 0;
    const esOferta = product.es_oferta === 1 || product.es_oferta === true;

    // Determine strict display mode
    // If Offer matches criteria (> 1 and marked as offer), show Offer mode.
    // Otherwise show Standard mode.
    // If strict price <= 1, consider invalid/hidden (or just show 0 if that's the intent, but user said 'No Zeros').
    // User said: "If product.precio_oferta > 1, show offer... Else if product.precio > 1, show normal... If 0 or null, DO NOT render".

    const hasValidOffer = esOferta && precioOferta > 1;
    const hasValidPrice = precio > 1;

    // Badge Logic: Strictly use 'es_nuevo' flag from DB
    const isNew = product.es_nuevo === 1 || product.es_nuevo === true;

    const handleQuickAdd = (e) => {
        e.stopPropagation();
        if (product.variantes && product.variantes.length > 0) {
            onClick(product);
            return;
        }
        addToCart(product, null, 1);
        toast.success(`Agregado: ${product.nombre}`);
    };

    return (
        <div
            onClick={() => onClick(product)}
            className="bg-[#ef5579] rounded-2xl shadow-md hover:shadow-lg transition-all cursor-pointer overflow-hidden group border border-pink-400 h-full flex flex-col transform hover:-translate-y-1 relative"
        >
            {/* IMAGE CONTAINER - FORCED COVER */}
            <div className="relative w-full h-64 overflow-hidden bg-white">
                <img
                    src={product.imagen || 'https://via.placeholder.com/300'}
                    alt={product.nombre}
                    className="w-full h-full object-contain bg-white p-2 transition-transform duration-500 group-hover:scale-105"
                    loading="lazy"
                />

                {/* LABELS */}
                <div className="absolute top-2 left-2 flex flex-col gap-1">
                    {isNew && (
                        <div className="bg-yellow-400 text-pink-900 text-[10px] font-black px-2 py-1 rounded-sm shadow-sm tracking-wider uppercase">
                            NUEVO
                        </div>
                    )}
                    {hasValidOffer && (
                        <div className="bg-white text-[#ef5579] text-[10px] font-black px-2 py-1 rounded-sm shadow-sm tracking-wider uppercase">
                            OFERTA
                        </div>
                    )}
                </div>
            </div>

            {/* CONTENT */}
            <div className="p-4 flex flex-col flex-1 justify-between">
                <div>
                    <h3 className="font-bold text-white text-md leading-tight mb-2 line-clamp-2">{product.nombre}</h3>
                </div>

                <div className="flex items-end justify-between mt-2">
                    {/* PRICE CONTAINER - STRICT CHECKS */}
                    {/* PRICE CONTAINER - STRICT CHECKS */}
                    <div className="flex flex-col">
                        {hasValidOffer ? (
                            <>
                                <span className="text-pink-200 line-through text-xs font-medium">
                                    ARS ${precio.toFixed(2)}
                                </span>
                                <span className="text-yellow-300 font-extrabold text-xl leading-none">
                                    ARS ${precioOferta.toFixed(2)}
                                </span>
                            </>
                        ) : hasValidPrice ? (
                            /* CAMBIO AQUÍ: Agregado el ARS para el precio normal */
                            <span className="text-white font-extrabold text-xl leading-none">
                                ARS ${precio.toFixed(2)}
                            </span>
                        ) : null}
                    </div>

                    <button
                        onClick={handleQuickAdd}
                        className="bg-white text-[#ef5579] w-8 h-8 flex items-center justify-center rounded-full hover:bg-yellow-300 hover:text-pink-900 transition-colors shadow-sm"
                    >
                        <Plus size={20} strokeWidth={3} />
                    </button>
                </div>
            </div>
        </div>
    );
}

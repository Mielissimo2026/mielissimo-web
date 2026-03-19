import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check } from 'lucide-react';
import { useStore } from '../context/store';
import toast from 'react-hot-toast';

export default function ProductModal({ product, onClose }) {
    const { addToCart } = useStore();
    const [selectedVariants, setSelectedVariants] = useState({});
    const [quantity, setQuantity] = useState(1);

    useEffect(() => {
        if (product) {
            setQuantity(1);
            setSelectedVariants({});
        }
    }, [product]);

    if (!product) return null;

    // Group Variants
    const variantsList = Array.isArray(product.variantes) ? product.variantes : [];
    const hasVariants = variantsList.length > 0;
    const groupedVariants = variantsList.reduce((acc, v) => {
        const type = v.tipo || 'Opciones';
        if (!acc[type]) acc[type] = [];
        acc[type].push(v);
        return acc;
    }, {});
    const variantGroups = Object.entries(groupedVariants);

    const handleVariantClick = (type, variant) => {
        setSelectedVariants(prev => {
            if (prev[type]?.id === variant.id) {
                const newState = { ...prev };
                delete newState[type];
                return newState;
            }
            return { ...prev, [type]: variant };
        });
    };

    const handleAddToCart = () => {
        const variantsToAdd = Object.values(selectedVariants);
        addToCart(product, variantsToAdd, quantity);
        onClose();
        toast.success("Agregado al carrito");
    };

    // Calculate Price
    const precio = parseFloat(product.precio);
    const precioOferta = product.precio_oferta ? parseFloat(product.precio_oferta) : 0;
    const esOferta = (product.es_oferta === 1 || product.es_oferta === true) && precioOferta > 0;

    // Logic for Modal Price Display (Mirror Card Logic)
    const basePrice = esOferta ? precioOferta : precio;
    const variantsPrice = Object.values(selectedVariants).reduce((acc, v) => acc + parseFloat(v.precio_extra || 0), 0);
    const finalPrice = basePrice + variantsPrice;

    // New Badge Logic
    // STRICT: Only use es_nuevo flag
    const isNew = product.es_nuevo === 1 || product.es_nuevo === true;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 content-center"
                onClick={onClose}
            >
                <motion.div
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.95, opacity: 0 }}
                    className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh]"
                    onClick={e => e.stopPropagation()}
                >
                    {/* === FIXED HEADER === */}
                    <div className="relative bg-white z-10 shadow-sm shrink-0">
    {/* Close Button */}
    <button
        onClick={onClose}
        className="absolute top-4 right-4 z-20 p-2 bg-black/10 hover:bg-black/20 rounded-full text-gray-700 transition-colors"
    >
        <X size={20} />
    </button>

    {/* CAMBIO 1: bg-gray-100 por bg-white */}
    <div className="w-full h-72 bg-white relative">
        <img
            src={product.imagen || 'https://via.placeholder.com/400'}
            alt={product.nombre}
            className="w-full h-full object-contain p-4"
        />
                            {/* Badges */}
                            <div className="absolute top-0 left-0 p-4 flex flex-col gap-2 pointer-events-none">
                                {isNew && (
                                    <span className="bg-yellow-400 text-pink-900 px-3 py-1 rounded-md text-xs font-black shadow-md tracking-wider">
                                        NUEVO
                                    </span>
                                )}
                                {esOferta && (
                                    <span className="bg-[#ef5579] text-white px-3 py-1 rounded-md text-xs font-bold shadow-md">
                                        OFERTA
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Title & Price Header */}
                        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-start bg-white">
                            <div>
                                <h2 className="text-xl font-bold text-gray-800 leading-tight line-clamp-2">{product.nombre}</h2>
                                <p className="text-gray-400 text-xs mt-1">
                                    {hasVariants ? 'Personalizá tu pedido' : 'Listo para agregar'}
                                </p>
                            </div>
                            <div className="text-right shrink-0 ml-4">
                               <span className="text-2xl font-bold text-[#ef5579] block">ARS ${finalPrice.toFixed(2)}</span>
                                {esOferta && (
                                   <span className="text-xs text-gray-400 line-through block decoration-1">
    ARS ${precio.toFixed(2)}
</span>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* === SCROLLABLE BODY (Variants) === */}
                    <div className="flex-1 overflow-y-auto p-6 bg-gray-50/50">
                        {hasVariants ? (
                            <div className="space-y-6">
                                {variantGroups.map(([type, variants]) => (
                                    <div key={type}>
                                        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-2 px-1">
                                            {type}
                                            {selectedVariants[type] && <Check size={12} className="text-green-500" />}
                                        </h3>
                                        <div className="grid grid-cols-2 gap-2">
                                            {variants.map(v => {
                                                const isSelected = selectedVariants[type]?.id === v.id;
                                                return (
                                                    <button
                                                        key={v.id}
                                                        onClick={() => handleVariantClick(type, v)}
                                                        className={`
                                                            group relative px-3 py-2.5 rounded-xl text-sm font-medium border text-left transition-all duration-200
                                                            ${isSelected
                                                                ? 'border-[#ef5579] bg-white text-[#ef5579] shadow-md ring-1 ring-[#ef5579]/20'
                                                                : 'border-gray-200 bg-white text-gray-600 hover:border-pink-300 hover:shadow-sm'
                                                            }
                                                        `}
                                                    >
                                                        <div className="flex justify-between items-center w-full">
                                                            <span className="truncate mr-2">{v.nombre}</span>
                                                            {isSelected && (
                                                                <div className="bg-[#ef5579] text-white rounded-full p-0.5">
                                                                    <Check size={10} strokeWidth={3} />
                                                                </div>
                                                            )}
                                                        </div>
                                                        {v.precio_extra > 0 && (
                                                            <span className={`text-[10px] block mt-0.5 ${isSelected ? 'text-[#ef5579]/80' : 'text-gray-400'}`}>
                                                                + ${v.precio_extra}
                                                            </span>
                                                        )}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="flex items-center justify-center h-full text-gray-400 text-sm italic">
                                Sin opciones adicionales
                            </div>
                        )}
                    </div>

                    {/* === FIXED FOOTER (Actions) === */}
                    <div className="bg-white p-4 border-t border-gray-100 shrink-0">
                        <div className="flex items-center gap-3">
                            {/* Quantity */}
                            <div className="flex items-center bg-gray-100 rounded-xl p-1 shrink-0">
                                <button
                                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                                    className="w-10 h-10 flex items-center justify-center hover:bg-white rounded-lg transition-colors text-gray-600 font-bold text-lg"
                                >-</button>
                                <span className="w-8 text-center font-bold text-lg">{quantity}</span>
                                <button
                                    onClick={() => setQuantity(quantity + 1)}
                                    className="w-10 h-10 flex items-center justify-center hover:bg-white rounded-lg transition-colors text-gray-600 font-bold text-lg"
                                >+</button>
                            </div>

                            {/* Add Button */}
                            <button
                                onClick={handleAddToCart}
                                className="flex-1 bg-[#ef5579] hover:bg-[#e23e65] text-white h-12 rounded-xl font-bold shadow-lg shadow-pink-200 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                            >
                                <span>Agregar</span>
                                <span className="bg-white/20 px-2 py-0.5 rounded text-xs">
                                    ${(finalPrice * quantity).toFixed(2)}
                                </span>
                            </button>
                        </div>
                    </div>

                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}

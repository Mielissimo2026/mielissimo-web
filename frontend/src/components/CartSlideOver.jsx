import React, { useState } from 'react';
import { X, Trash2, ShoppingBag } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '../context/store';
import { submitPurchase } from '../services/api';

const SHIPPING_ZONES = {
    "Zona centro": 1500,
    "Jds": 2000,
    "Ribera": 2000,
    "Barrio unión": 2500
};

export default function CartSlideOver() {
    const { cart, isCartOpen, toggleCart, removeFromCart, updateQuantity, clearCart } = useStore();
    const [tipoEnvio, setTipoEnvio] = useState('retiro');
    const [zona, setZona] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const subtotal = cart.reduce((acc, item) => acc + (item.precio * item.cantidad), 0);
    const shippingCost = (tipoEnvio === 'envio' && zona) ? SHIPPING_ZONES[zona] : 0;
    const total = subtotal + shippingCost;

    const handleCheckout = async () => {
        if (cart.length === 0) return;
        if (tipoEnvio === 'envio' && !zona) {
            alert("Por favor, seleccioná una zona de envío.");
            return;
        }

        setIsSubmitting(true);
        try {
            // 1. Save to DB
            const purchaseData = {
                id_usuario: null, // TODO: Implement Auth
                carrito: cart,
                tipoEnvio,
                zona: tipoEnvio === 'envio' ? zona : null,
                total
            };

            const response = await submitPurchase(purchaseData);
            const pedidoId = response.id || 'N/A';

            // 2. Build WhatsApp Message
            const nombreUsuario = "Cliente"; // TODO: Implement Auth

            let detallesProductos = cart.map(item => {
                const productTotal = item.precio * item.cantidad;
                const variantsInfo = item.variantes && item.variantes.length > 0
                    ? ` (${item.variantes.map(v => v.nombre).join(", ")})`
                    : "";
                return `💗 ${item.cantidad} x ${item.nombre}${variantsInfo} = ARS $${productTotal.toFixed(2)}`;
            }).join("\n");

            let tipoEntregaInfo = "🏠 Retiro en local";
            if (tipoEnvio === 'envio') {
                tipoEntregaInfo = `🚚 Envío a domicilio (${zona} - ARS ${shippingCost})`;
            }

            const mensajeTexto =
                `📌 *Pedido #${pedidoId}*

Hola, quiero hacer un pedido en Mielíssimo 🍬💗  
🎀 ¡Más golosinas, más contento! 😋

Detalles del Pedido:
${detallesProductos}

💲 *Total:* ARS ${total.toFixed(2)}

👤 *Nombre:* ${nombreUsuario}
${tipoEntregaInfo}`;

            const url = `https://wa.me/5492657603387?text=${encodeURIComponent(mensajeTexto)}`;

            // 3. Redirect and Clear
            clearCart();
            window.open(url, '_blank');
            toggleCart();

        } catch (error) {
            console.error("Error al procesar pedido:", error);
            alert("Hubo un error al procesar tu pedido. Intentalo de nuevo.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <AnimatePresence>
            {isCartOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 0.5 }}
                        exit={{ opacity: 0 }}
                        onClick={toggleCart}
                        className="fixed inset-0 bg-black z-40"
                    />

                    {/* Slide-over Panel */}
                    <motion.div
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                        className="fixed inset-y-0 right-0 max-w-md w-full bg-white shadow-xl z-50 flex flex-col"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between p-4 border-b">
                            <h2 className="text-lg font-bold text-gray-800">Tu Pedido</h2>
                            <button onClick={toggleCart} className="p-2 hover:bg-gray-100 rounded-full">
                                <X size={24} />
                            </button>
                        </div>

                        {/* Cart Items */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-4">
                            {cart.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-full text-gray-400">
                                    <ShoppingBag size={48} className="mb-2" />
                                    <p>El carrito está vacío</p>
                                </div>
                            ) : (
                                cart.map((item) => (
                                    <div key={item.cartItemId} className="flex gap-4 border-b pb-4">
                                        <img src={item.imagen} alt={item.nombre} className="w-20 h-20 object-cover rounded-md" />
                                        <div className="flex-1">
                                            <h3 className="font-medium text-gray-800">{item.nombre}</h3>
                                            {item.variantes && item.variantes.length > 0 && (
                                                <p className="text-xs text-gray-500">
                                                    {item.variantes.map(v => v.nombre).join(", ")}
                                                </p>
                                            )}

                                            <div className="flex items-center justify-between mt-2">
                                                <div className="flex items-center border rounded-md">
                                                    <button
                                                        onClick={() => updateQuantity(item.cartItemId, -1)}
                                                        className="px-2 py-1 text-gray-600 hover:bg-gray-100"
                                                    >-</button>
                                                    <span className="px-2 text-sm">{item.cantidad}</span>
                                                    <button
                                                        onClick={() => updateQuantity(item.cartItemId, 1)}
                                                        className="px-2 py-1 text-gray-600 hover:bg-gray-100"
                                                    >+</button>
                                                </div>
                                                <p className="font-semibold text-[#ef5579]">ARS ${(item.precio * item.cantidad).toFixed(2)}</p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => removeFromCart(item.cartItemId)}
                                            className="text-gray-400 hover:text-red-500 self-start"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>

                        {/* Footer / Checkout - Render triggers ONLY if items exist */}
                        {cart.length > 0 && (
                            <div className="border-t p-4 bg-[#fff0f5]">
                                {/* Shipping Options */}
                                <div className="mb-4">
                                    <div className="flex gap-4 mb-2">
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input
                                                type="radio"
                                                name="tipoEnvio"
                                                value="retiro"
                                                checked={tipoEnvio === 'retiro'}
                                                onChange={(e) => setTipoEnvio(e.target.value)}
                                                className="text-[#ef5579] focus:ring-[#ef5579]"
                                            />
                                            <span className="text-sm">Retiro en local</span>
                                        </label>
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input
                                                type="radio"
                                                name="tipoEnvio"
                                                value="envio"
                                                checked={tipoEnvio === 'envio'}
                                                onChange={(e) => setTipoEnvio(e.target.value)}
                                                className="text-[#ef5579] focus:ring-[#ef5579]"
                                            />
                                            <span className="text-sm">Envío</span>
                                        </label>
                                    </div>

                                    {tipoEnvio === 'envio' && (
                                        <select
                                            value={zona}
                                            onChange={(e) => setZona(e.target.value)}
                                            className="w-full p-2 border rounded-md text-sm focus:border-[#ef5579] focus:ring-1 focus:ring-[#ef5579] outline-none"
                                        >
                                            <option value="">Seleccionar zona...</option>
                                            {Object.keys(SHIPPING_ZONES).map(z => (
                                                <option key={z} value={z}>{z} - ${SHIPPING_ZONES[z]}</option>
                                            ))}
                                        </select>
                                    )}
                                </div>

                                <div className="flex justify-between items-center mb-4 text-lg font-bold">
                                    <span>Total</span>
                                    <span>ARS ${total.toFixed(2)}</span>
                                </div>

                                <button
                                    onClick={handleCheckout}
                                    disabled={isSubmitting}
                                    className="w-full bg-[#ef5579] hover:bg-[#e23e65] text-white py-3 rounded-xl font-semibold shadow-lg shadow-pink-200 transition-all active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed"
                                >
                                    {isSubmitting ? 'Procesando...' : 'Finalizar Pedido por WhatsApp'}
                                </button>
                            </div>
                        )}
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}

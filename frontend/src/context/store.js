import { create } from 'zustand';

export const useStore = create((set, get) => ({
    // Carrito
    cart: [],
    isCartOpen: false,
    toggleCart: () => set((state) => ({ isCartOpen: !state.isCartOpen })),

    // Updated addToCart to support multiple variants
    addToCart: (product, variants = [], cantidad = 1) => set((state) => {
        // Ensure variants is an array
        const selectedVariants = Array.isArray(variants) ? variants : (variants ? [variants] : []);

        // Generate unique ID based on Product ID + Sorted Variant IDs
        const variantIds = selectedVariants.map(v => v.id).sort((a, b) => a - b).join('-');
        const cartItemId = variantIds ? `${product.id}-${variantIds}` : `${product.id}`;

        const existingItem = state.cart.find(item => item.cartItemId === cartItemId);

        if (existingItem) {
            return {
                cart: state.cart.map(item =>
                    item.cartItemId === cartItemId
                        ? { ...item, cantidad: item.cantidad + cantidad }
                        : item
                )
            };
        }

        // Calculate price with variants
        // Base price is product.precio_oferta if valid, else product.precio
        // Add sum of variants extra price
        // Note: The UI shows the calculated price, but we should probably store the correct unit price here or recalculate?
        // CartSlideOver calculates subtotal = item.precio * item.cantidad.
        // It does NOT seem to add variant price! 
        // We must update the `precio` of the item to include variants!

        let basePrice = parseFloat(product.precio);
        if (product.es_oferta && product.precio_oferta) {
            basePrice = parseFloat(product.precio_oferta);
        }

        const variantsTotal = selectedVariants.reduce((acc, v) => acc + parseFloat(v.precio_extra || 0), 0);
        const finalUnitPrice = basePrice + variantsTotal;

        return {
            cart: [...state.cart, {
                ...product,
                variantes: selectedVariants, // Overwrite with SELECTED variants
                precio: finalUnitPrice, // Store the final unit price for cart calculations
                cantidad,
                cartItemId
            }]
        };
    }),

    removeFromCart: (cartItemId) => set((state) => ({
        cart: state.cart.filter(item => item.cartItemId !== cartItemId)
    })),

    updateQuantity: (cartItemId, delta) => set((state) => ({
        cart: state.cart.map(item => {
            if (item.cartItemId === cartItemId) {
                const newQty = item.cantidad + delta;
                return newQty > 0 ? { ...item, cantidad: newQty } : item;
            }
            return item;
        })
    })),

    clearCart: () => set({ cart: [] }),

    // Configuración Global
    storeStatus: 'ABIERTO', // ABIERTO | CERRADO
    setStoreStatus: (status) => set({ storeStatus: status }),

    // Búsqueda Global
    searchQuery: '',
    setSearchQuery: (query) => set({ searchQuery: query }),
}));

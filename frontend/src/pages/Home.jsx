import React, { useEffect, useState, useRef } from 'react';
import { fetchProducts, fetchCategories } from '../services/api';
import ProductCard from '../components/ProductCard';
import CategoryPills from '../components/CategoryPills';
import ProductModal from '../components/ProductModal';
// Footer eliminado de aquí para evitar duplicados
import HeroCarousel from '../components/HeroCarousel'; 
import StoreStatusBanner from '../components/StoreStatusBanner'; // <--- Banner aquí
import { motion } from 'framer-motion';
import { useStore } from '../context/store';

export default function Home() {
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [activeCategory, setActiveCategory] = useState({ id: 'todas', nombre: 'Ver Todo' });
    const { searchQuery } = useStore();
    const [loading, setLoading] = useState(true);
    
    // Referencia para el scroll automático
    const productsSectionRef = useRef(null);

    const scrollToProducts = () => {
        productsSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };

    useEffect(() => {
        Promise.all([fetchProducts(), fetchCategories()])
            .then(([productsData, categoriesData]) => {
                setProducts(productsData);
                setCategories([
                    { id: 'todas', nombre: 'Ver Todo' }, 
                    { id: 'ofertas', nombre: 'Ofertas 🔥' }, 
                    ...categoriesData
                ]);
                setLoading(false);
            })
            .catch(err => { console.error(err); setLoading(false); });
    }, []);

    const filteredProducts = products.filter(p => {
        if (searchQuery && !p.nombre.toLowerCase().includes(searchQuery.toLowerCase())) return false;
        if (activeCategory.id === 'todas') return true;
        if (activeCategory.id === 'ofertas') return p.es_oferta === 1 || p.es_oferta === true;
        if (p.categorias && Array.isArray(p.categorias)) return p.categorias.some(c => c.id === activeCategory.id);
        return p.categoria_id === activeCategory.id;
    });

    return (
        <div className="bg-gray-50 flex flex-col">
            
            {/* 1. Carrusel (Ancho completo) */}
            <HeroCarousel 
                onSelectCategory={(cat) => {
                    setActiveCategory(cat);
                    scrollToProducts();
                }}
                onScrollToProducts={scrollToProducts}
            />

            {/* 2. CATEGORÍAS (Ahora fuera del div de abajo para que ocupe todo el ancho) */}
            <CategoryPills
                categories={categories}
                activeCategory={activeCategory}
                onSelectCategory={setActiveCategory}
            />

            {/* 3. CONTENEDOR CON PADDING (Para el resto de las cosas) */}
            <div className="flex-grow px-4 pb-10 pt-4"> 
                
                {/* Banner de estado */}
                <div className="mb-6">
                    <StoreStatusBanner />
                </div>

                {/* Referencia para el scroll y grilla de productos */}
                <div ref={productsSectionRef} className="max-w-7xl mx-auto mt-8">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-2xl font-bold text-gray-800 border-l-4 border-[#ef5579] pl-3">
                            {activeCategory.nombre}
                        </h3>
                        <span className="text-sm text-gray-500 bg-white px-3 py-1 rounded-full shadow-sm">
                            {filteredProducts.length} productos
                        </span>
                    </div>

                    {loading ? (
                        <div className="text-center py-20 opacity-50">Cargando delicias...</div>
                    ) : (
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                            <motion.div layout className="contents">
                                {filteredProducts.map((product) => (
                                    <ProductCard key={product.id} product={product} onClick={setSelectedProduct} />
                                ))}
                            </motion.div>
                        </div>
                    )}
                    
                    {!loading && filteredProducts.length === 0 && (
                        <div className="text-center py-10 text-gray-400">No hay productos en esta sección.</div>
                    )}
                </div>
            </div>

            <ProductModal product={selectedProduct} onClose={() => setSelectedProduct(null)} />
        </div>
    );
}
import React, { useEffect, useState } from 'react';
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import ProductCard from './ProductCard';
import { fetchProducts } from '../services/api';
import ProductModal from './ProductModal';
// If arrows are needed, slick has defaults, or we can custom style.

export default function OffersCarousel() {
    const [offers, setOffers] = useState([]);
    const [selectedProduct, setSelectedProduct] = useState(null);

    useEffect(() => {
        fetchProducts().then(products => {
            // Filter explicitly for es_oferta === 1 (or true)
            const offerProducts = products.filter(p => p.es_oferta === 1 || p.es_oferta === true);
            setOffers(offerProducts);
        }).catch(console.error);
    }, []);

    if (offers.length === 0) return null;

    const settings = {
        dots: true,
        infinite: offers.length > 1, // Only infinite if enough items
        speed: 500,
        slidesToShow: 4,
        slidesToScroll: 1,
        autoplay: true,
        autoplaySpeed: 3000,
        responsive: [
            {
                breakpoint: 1024,
                settings: {
                    slidesToShow: 3,
                    slidesToScroll: 1,
                }
            },
            {
                breakpoint: 768,
                settings: {
                    slidesToShow: 2,
                    slidesToScroll: 1,
                }
            },
            {
                breakpoint: 600,
                settings: {
                    slidesToShow: 1,
                    slidesToScroll: 1
                }
            }
        ]
    };

    return (
        <div className="py-8 bg-pink-50/50 mb-8">
            <div className="max-w-7xl mx-auto px-4">
                <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                    🔥 Ofertas Imperdibles
                </h2>
                <div className="slider-container px-2"> {/* Added padding for shadows */}
                    <Slider {...settings}>
                        {offers.map(product => (
                            <div key={product.id} className="p-2 h-full"> {/* Padding for gap */}
                                <ProductCard product={product} onClick={setSelectedProduct} />
                            </div>
                        ))}
                    </Slider>
                </div>
            </div>

            <ProductModal product={selectedProduct} onClose={() => setSelectedProduct(null)} />
        </div>
    );
}

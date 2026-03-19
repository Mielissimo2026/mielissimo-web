import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Clock } from 'lucide-react';

export default function HeroCarousel({ onSelectCategory }) {
    const [currentSlide, setCurrentSlide] = useState(0);

    const slides = [
        {
            id: 1,
            bg: "bg-gradient-to-r from-pink-500 to-rose-500",
            title: "¡Bienvenidos a Mielissimo!",
            subtitle: "Dulzura en cada detalle para alegrar tu día.",
            // Horarios agregados aquí:
            extraInfo: "Lunes a Sábado: 8:00 - 13:00 y 17:00 - 21:00",
            buttonText: null,
            action: null
        },
        {
            id: 2,
            bg: "bg-gradient-to-r from-purple-500 to-indigo-500",
            title: "Ofertas Maravillosas",
            subtitle: "Precios increíbles en productos seleccionados.",
            buttonText: "Ver Ofertas 🔥",
            // CAMBIO AQUÍ: Acción para el botón de ofertas
            action: () => onSelectCategory && onSelectCategory({ id: 'ofertas', nombre: 'Ofertas 🔥' })
        },
        {
            id: 3,
            bg: "bg-gradient-to-r from-orange-400 to-pink-500",
            title: "Golosinas Exclusivas",
            subtitle: "Solo lo mejor para vos. ¡Descubrilas!",
            buttonText: "Ver Productos",
            // CAMBIO AQUÍ: Acción para el botón de ver productos (Categoría Todas)
            action: () => onSelectCategory && onSelectCategory({ id: 'todas', nombre: 'Ver Todo' })
        }
    ];

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentSlide((prev) => (prev === slides.length - 1 ? 0 : prev + 1));
        }, 5000);
        return () => clearInterval(timer);
    }, []);

    const nextSlide = () => setCurrentSlide((prev) => (prev === slides.length - 1 ? 0 : prev + 1));
    const prevSlide = () => setCurrentSlide((prev) => (prev === 0 ? slides.length - 1 : prev - 1));

    return (
        <div className="relative w-full h-[400px] overflow-hidden bg-gray-900 text-white shadow-xl rounded-b-3xl mb-2">
            {slides.map((slide, index) => (
                <div
                    key={slide.id}
                    className={`absolute inset-0 transition-opacity duration-1000 ease-in-out flex flex-col justify-center items-center text-center p-4 ${
                        index === currentSlide ? 'opacity-100 z-10' : 'opacity-0 z-0'
                    } ${slide.bg}`}
                >
                    <h2 className="text-4xl md:text-6xl font-black mb-4 drop-shadow-lg">
                        {slide.title}
                    </h2>
                    <p className="text-lg md:text-2xl mb-4 font-medium drop-shadow-md opacity-90">
                        {slide.subtitle}
                    </p>

                    {/* MOSTRAR HORARIOS SI EXISTEN (SOLO EN SLIDE 1) */}
                    {slide.extraInfo && (
                        <div className="flex items-center gap-2 bg-white/20 px-4 py-2 rounded-full backdrop-blur-sm mb-6 animate-pulse">
                            <Clock size={20} />
                            <span className="font-semibold text-sm md:text-base">{slide.extraInfo}</span>
                        </div>
                    )}

                    {slide.buttonText && (
                        <button
                            onClick={slide.action}
                            className="bg-white text-gray-900 px-8 py-3 rounded-full font-bold text-lg hover:bg-gray-100 hover:scale-105 transition-all shadow-xl cursor-pointer"
                        >
                            {slide.buttonText}
                        </button>
                    )}
                </div>
            ))}

            <button onClick={prevSlide} className="absolute left-4 top-1/2 -translate-y-1/2 z-20 p-2 bg-white/20 hover:bg-white/40 rounded-full text-white cursor-pointer transition-colors">
                <ChevronLeft size={30} />
            </button>
            <button onClick={nextSlide} className="absolute right-4 top-1/2 -translate-y-1/2 z-20 p-2 bg-white/20 hover:bg-white/40 rounded-full text-white cursor-pointer transition-colors">
                <ChevronRight size={30} />
            </button>

            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex gap-2">
                {slides.map((_, idx) => (
                    <button
                        key={idx}
                        onClick={() => setCurrentSlide(idx)}
                        className={`w-3 h-3 rounded-full transition-all cursor-pointer ${
                            idx === currentSlide ? 'bg-white scale-125' : 'bg-white/50'
                        }`}
                    />
                ))}
            </div>
        </div>
    );
}
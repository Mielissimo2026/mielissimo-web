import React, { useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function CategoryPills({ categories, activeCategory, onSelectCategory }) {
    const scrollContainerRef = useRef(null);

    const scroll = (direction) => {
        if (scrollContainerRef.current) {
            const scrollAmount = 200;
            scrollContainerRef.current.scrollBy({
                left: direction === 'left' ? -scrollAmount : scrollAmount,
                behavior: 'smooth'
            });
        }
    };

    return (
        <div className="sticky top-16 z-30 bg-[#ef5579] shadow-sm py-3 border-b border-pink-700/10 w-full">
            <div className="w-full relative flex items-center px-2">

                {/* Left Arrow (Visible Siempre) */}
                <button
                    onClick={() => scroll('left')}
                    className="absolute left-2 z-20 p-2 bg-white/20 hover:bg-white hover:text-[#ef5579] text-white rounded-full transition-all shadow-md backdrop-blur-sm"
                >
                    <ChevronLeft size={24} />
                </button>

                <div
    ref={scrollContainerRef}
    className="flex overflow-x-auto gap-3 scrollbar-hide pb-1 w-full px-10 md:px-12"
>
                    {categories.map(cat => {
                        const isActive = activeCategory.id === cat.id;
                        return (
                            <button
                                key={cat.id}
                                onClick={() => onSelectCategory(cat)}
                                className={`
                                    px-6 py-2 rounded-full whitespace-nowrap text-sm font-bold transition-all duration-200 transform flex-shrink-0
                                    ${isActive
                                        ? 'bg-white text-[#ef5579] shadow-lg shadow-pink-900/20 scale-105 ring-2 ring-white'
                                        : 'bg-black/10 text-white hover:bg-white/20 border border-white/10'
                                    }
                                `}
                            >
                                {cat.nombre}
                            </button>
                        )
                    })}
                </div>

                {/* Right Arrow (Visible Siempre) */}
                <button
                    onClick={() => scroll('right')}
                    className="absolute right-2 z-20 p-2 bg-white/20 hover:bg-white hover:text-[#ef5579] text-white rounded-full transition-all shadow-md backdrop-blur-sm"
                >
                    <ChevronRight size={24} />
                </button>
            </div>
        </div>
    );
}
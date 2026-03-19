import React from 'react';
import { Instagram, MessageCircle, Clock } from 'lucide-react';

export default function Footer() {
    return (
        <footer className="bg-[#ef5579] text-white py-12 mt-0 border-t border-pink-600">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex flex-col md:flex-row justify-between items-center gap-8 text-center md:text-left">
                    
                    {/* Info y Horarios */}
                    <div>
                        <h2 className="text-3xl font-black tracking-tight text-white drop-shadow-md">Mielissimo</h2>
                        <p className="text-pink-100 mt-2 font-medium opacity-90">Dulzura en cada detalle.</p>
                        
                        {/* SECCIÓN HORARIOS AGREGADA */}
                        <div className="mt-6 flex flex-col gap-1 text-pink-50">
                            <div className="flex items-center justify-center md:justify-start gap-2 mb-1">
                                <Clock size={18} />
                                <span className="font-bold uppercase tracking-wide">Horarios de Atención:</span>
                            </div>
                            <p className="text-sm">Lunes a Sábado: 8:00 - 13:00 hs</p>
                            <p className="text-sm">y 17:00 - 21:00 hs</p>
                        </div>
                    </div>

                    {/* Redes Sociales (Sin Facebook) */}
                    <div className="flex space-x-6">
                        <a href="https://www.instagram.com/mielissimo__/" target="_blank" className="p-3 bg-white/10 rounded-full hover:bg-white hover:text-[#ef5579] transition-all transform hover:scale-110 shadow-lg backdrop-blur-sm" aria-label="Instagram">
                            <Instagram size={28} />
                        </a>
                        <a href="https://wa.me/" target="_blank" className="p-3 bg-white/10 rounded-full hover:bg-white hover:text-[#ef5579] transition-all transform hover:scale-110 shadow-lg backdrop-blur-sm" aria-label="WhatsApp">
                            <MessageCircle size={28} />
                        </a>
                    </div>
                </div>

                {/* Copyright */}
                <div className="mt-12 pt-8 border-t border-white/20 text-center">
                    <p className="text-sm text-pink-100/80">© {new Date().getFullYear()} Mielissimo. Todos los derechos reservados.</p>
                    <p className="mt-2 text-xs font-bold text-white uppercase tracking-widest opacity-60 hover:opacity-100 transition-opacity">
                        Desarrollado por Marco Barzola
                    </p>
                </div>
            </div>
        </footer>
    );
}
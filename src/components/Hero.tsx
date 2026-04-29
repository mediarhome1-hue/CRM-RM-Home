'use client';

import React from 'react';
import { Search, MapPin, Home, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';

const Hero = () => {
  return (
    <section className="relative min-h-[90vh] flex items-center justify-center pt-20 overflow-hidden">
      {/* Background Image with Overlay */}
      <div 
        className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat transition-transform duration-[10s] hover:scale-110"
        style={{ 
          backgroundImage: `url('/hero-bg.png')`, // We'll need to move the generated image here
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-[#002347]/60 via-[#002347]/30 to-[#002347]/80" />
      </div>

      <div className="container relative z-10">
        <div className="max-w-3xl mx-auto text-center mb-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <span className="inline-block px-4 py-1.5 mb-6 text-xs font-bold tracking-[0.2em] text-white uppercase bg-secondary/80 backdrop-blur-md rounded-full">
              Sua Liderança no Mercado Imobiliário
            </span>
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-6 leading-tight">
              Encontre o <span className="text-secondary">Lar dos Seus Sonhos</span> em Pernambuco
            </h1>
            <p className="text-lg text-white/90 mb-8 max-w-2xl mx-auto font-light">
              Especialistas em vendas, aluguéis e administração de imóveis com a confiança e exclusividade que você merece.
            </p>
          </motion.div>
        </div>

        {/* Search Bar */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="max-w-4xl mx-auto glass p-2 rounded-2xl shadow-2xl"
        >
          <div className="flex flex-col md:flex-row items-center gap-2">
            <div className="flex-1 w-full flex items-center gap-3 px-4 py-3 bg-white/50 rounded-xl">
              <MapPin className="text-secondary" size={20} />
              <input 
                type="text" 
                placeholder="Onde você quer morar?" 
                className="bg-transparent border-none outline-none w-full text-primary font-medium placeholder:text-primary/50"
              />
            </div>
            
            <div className="flex-1 w-full flex items-center gap-3 px-4 py-3 bg-white/50 rounded-xl border-x border-primary/5">
              <Home className="text-secondary" size={20} />
              <select className="bg-transparent border-none outline-none w-full text-primary font-medium appearance-none">
                <option>Tipo de Imóvel</option>
                <option>Casa</option>
                <option>Apartamento</option>
                <option>Terreno</option>
                <option>Comercial</option>
              </select>
            </div>

            <button className="w-full md:w-auto btn btn-secondary px-8 py-4 text-white">
              <Search size={20} />
              Buscar Imóvel
            </button>
          </div>
        </motion.div>

        {/* Stats / Quick Info */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-16 max-w-4xl mx-auto">
          <Stat label="Imóveis Ativos" value="2,500+" />
          <Stat label="Clientes Felizes" value="1,800+" />
          <Stat label="Anos de Mercado" value="15+" />
          <Stat label="Cidades" value="12" />
        </div>
      </div>

      <style jsx>{`
        .glass {
          background: rgba(255, 255, 255, 0.15);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.2);
        }
        .container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 1.5rem;
        }
        .btn-secondary {
          background: #c5a059;
          color: white;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-weight: 600;
          border-radius: 0.75rem;
        }
      `}</style>
    </section>
  );
};

const Stat = ({ label, value }: { label: string, value: string }) => (
  <div className="text-center">
    <div className="text-2xl md:text-3xl font-bold text-white mb-1">{value}</div>
    <div className="text-xs md:text-sm text-white/60 uppercase tracking-widest">{label}</div>
  </div>
);

export default Hero;

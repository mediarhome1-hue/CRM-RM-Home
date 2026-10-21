'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import LeadModal from './LeadModal';


const properties = [
  {
    id: 1,
    images: [
      '/valle-encantado/fachada.jpg',
      '/valle-encantado/piscina.jpg', 
      '/valle-encantado/area-de-lazer.jpg', 
      '/valle-encantado/salao-de-festas.jpg',
      '/valle-encantado/playground.jpg',
      '/valle-encantado/playground-2.jpg',
      '/valle-encantado/churrasqueira.jpg',
      '/valle-encantado/bicicletario.jpg'
    ],
    logo: '/logotipo-valle-encantado.svg',
    area: '49M²',
    features: '2 Quartos\ncom varanda',
    location: {
      city: 'Igarassu',
      neighborhood: 'Cruz de Rebouças',
      details: 'Loteamento\nJardim Encantado'
    },
    developerLogo: '/logotipo-albuquerque.svg',
    bgColor: 'bg-[#317073]', // Teal
    govLogos: ['morar-bem', 'mcmv', 'caixa']
  },
  {
    id: 2,
    images: [
      '/bela-vista/entrada.jpg', 
      '/bela-vista/area-de-lazer.jpg', 
      '/bela-vista/salao-de-festas.jpg',
      '/bela-vista/mini-campo.jpg',
      '/bela-vista/quadra.jpg',
      '/bela-vista/beach-tennis.jpg',
      '/bela-vista/playground.jpg'
    ],
    logo: '/bela-vista/logotipo-bela-vista.svg',
    area: 'A partir de 50M²',
    features: '2 Quartos\ncom suíte',
    location: {
      city: 'Paulista',
      neighborhood: 'Nova Aurora',
      details: 'Por trás do Hospital\nMiguel Arraes'
    },
    developerLogo: '/bela-vista/logotipo-multtecnica.svg',
    bgColor: 'bg-[#1b7a5e]', // Emerald Green
    watermark: '/bela-vista/marcadagua-multtecnica.svg',
    govLogos: ['mcmv', 'caixa']
  },
  {
    id: 3,
    images: [
      '/conquista-paulista/capa.jpg',
      '/conquista-paulista/piscina.jpg',
      '/conquista-paulista/playground.jpg',
      '/conquista-paulista/praca.jpg',
      '/conquista-paulista/quadra.jpg',
      '/conquista-paulista/redario.jpg'
    ],
    logo: '/conquista-paulista/logo-conquista.png',
    area: '36M²',
    features: '2 Quartos\nCondomínio clube',
    location: {
      city: 'Paulista',
      neighborhood: 'Ao lado do',
      details: 'Mix Mateus'
    },
    developerLogo: '/conquista-paulista/logo-direcional.svg',
    bgColor: 'bg-[#4ab9f8]',
    govLogos: ['morar-bem', 'mcmv', 'caixa']
  }
];

export default function Imoveis() {
  const [currentPropIndex, setCurrentPropIndex] = useState(0);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isLeadModalOpen, setIsLeadModalOpen] = useState(false);

  const prop = properties[currentPropIndex];


  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % prop.images.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + prop.images.length) % prop.images.length);
  };

  const nextProp = () => {
    setCurrentPropIndex((prev) => (prev + 1) % properties.length);
    setCurrentImageIndex(0);
  };

  const prevProp = () => {
    setCurrentPropIndex((prev) => (prev - 1 + properties.length) % properties.length);
    setCurrentImageIndex(0);
  };

  return (
    <section id="imoveis" className="py-20 bg-white relative z-10 scroll-mt-20">
      <div className="max-w-[1440px] mx-auto px-6 md:px-12">
        <div className="text-center mb-6 md:mb-8">
          <h2 className="text-4xl md:text-5xl font-semibold text-primary">Imóveis</h2>
        </div>

        {/* Watermark Logo - Hidden on mobile, right-aligned for web */}
        <div className="hidden md:block absolute inset-0 z-0 opacity-80 pointer-events-none max-w-[1440px] mx-auto px-6 md:px-12">
          <div className="relative w-full h-full">
            <Image 
              src="/logo-rm.png"
              alt="Watermark Shield"
              fill
              className="object-contain object-right py-8"
            />
          </div>
        </div>

        {/* Mobile only Watermark - Centered and faint */}
        <div className="md:hidden absolute inset-0 z-0 opacity-80 pointer-events-none flex items-center justify-center p-8">
          <div className="relative w-full h-[60%]">
            <Image 
              src="/logo-rm.png"
              alt="Watermark Shield"
              fill
              className="object-contain object-center"
            />
          </div>
        </div>

        {/* Outer Carousel Container */}
        <div className="relative max-w-[1100px] mx-auto group/outer">
          
          {/* Outer Navigation Arrows - Overlapping the card */}
          <button 
            onClick={prevProp} 
            className="absolute left-4 top-1/2 -translate-y-1/2 text-white/80 hover:text-white transition-colors bg-black/10 hover:bg-black/20 p-2 md:p-3 rounded-full backdrop-blur-sm z-30 shadow-lg"
          >
            <ChevronLeft size={32} className="md:w-10 md:h-10" />
          </button>
          
          <button 
            onClick={nextProp} 
            className="absolute right-4 top-1/2 -translate-y-1/2 text-white/80 hover:text-white transition-colors bg-black/10 hover:bg-black/20 p-2 md:p-3 rounded-full backdrop-blur-sm z-30 shadow-lg"
          >
            <ChevronRight size={32} className="md:w-10 md:h-10" />
          </button>

          {/* Main Property Card */}
          <motion.div 
            key={currentPropIndex}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6 }}
            className={`${prop.bgColor} rounded-[30px] md:rounded-[45px] px-6 pt-8 pb-6 md:p-12 lg:p-16 text-white shadow-xl relative overflow-hidden`}
          >
            {/* Background Watermark */}
            {prop.watermark && (
              <div className="absolute inset-0 z-0 opacity-100 pointer-events-none">
                <Image 
                  src={prop.watermark} 
                  alt="" 
                  fill 
                  className="object-cover" 
                />
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 relative z-10">
              
              {/* Left Column: Info (Order 2 on mobile, 1 on desktop) */}
              <div className="flex flex-col h-full space-y-8 lg:space-y-10 order-2 lg:order-1 mt-4 lg:mt-0">
                <div className="flex justify-center lg:justify-start">
                  <div className={`relative ${prop.id === 2 ? 'w-[280px] h-[120px] md:w-[450px] md:h-[160px]' : 'w-[180px] h-[70px] md:w-[260px] md:h-[100px]'}`}>
                    <Image 
                      src={prop.logo}
                      alt="Logo do Empreendimento"
                      fill
                      className="object-contain object-center lg:object-left"
                    />
                  </div>
                </div>

                <div className="space-y-4 md:space-y-6 text-center lg:text-left flex flex-col items-center lg:items-start">
                  <div className="flex items-center gap-3 md:gap-4">
                    <div className="relative w-8 h-8 md:w-12 md:h-12">
                      <Image src="/icon-m2.svg" alt="Área" fill className="object-contain" />
                    </div>
                    <div className="flex flex-col">
                      {prop.id === 2 && <span className="text-xs md:text-sm font-medium uppercase tracking-wider opacity-90 italic">A partir de</span>}
                      <span className="text-3xl md:text-5xl font-bold">{prop.area.replace('A partir de ', '')}</span>
                    </div>
                  </div>
                  
                  <h3 className="text-2xl md:text-4xl font-semibold leading-tight whitespace-pre-line">
                    {prop.features}
                  </h3>
                </div>

                {/* Vertical layout for Logos and Button */}
                <div className="flex flex-col items-center lg:items-start space-y-8">
                  {/* Government Logos Horizontal Row */}
                  <div className="flex items-center gap-5 md:gap-8">
                    {prop.govLogos?.includes('morar-bem') && (
                      <div className="relative w-[50px] h-[30px] md:w-[65px] md:h-[40px]">
                        <Image src="/logo-morar-bem.svg" alt="Morar Bem" fill className="object-contain" />
                      </div>
                    )}
                    {prop.govLogos?.includes('mcmv') && (
                      <div className="relative w-[40px] h-[30px] md:w-[55px] md:h-[40px]">
                        <Image src="/logo-mcmv.svg" alt="Minha Casa Minha Vida" fill className="object-contain" />
                      </div>
                    )}
                    {prop.govLogos?.includes('caixa') && (
                      <div className="relative w-[60px] h-[20px] md:w-[85px] md:h-[30px]">
                        <Image src="/logo-caixa.svg" alt="Caixa" fill className="object-contain" />
                      </div>
                    )}
                  </div>
                  
                  <button 
                    onClick={() => setIsLeadModalOpen(true)}
                    className="bg-[#00a0e3] hover:bg-[#008bc5] transition-colors text-white font-bold py-3 md:py-4 px-12 md:px-14 rounded-full shadow-lg text-base md:text-xl active:scale-95"
                  >
                    Saiba mais...
                  </button>
                </div>
              </div>

              {/* Right Column: Gallery & Location (Order 1 on mobile, 2 on desktop) */}
              <div className="flex flex-col space-y-6 md:space-y-8 order-1 lg:order-2">
                {/* Image Gallery */}
                <div className="relative aspect-[4/3] w-full rounded-[20px] md:rounded-[30px] overflow-hidden shadow-lg group -mt-3">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={`${currentPropIndex}-${currentImageIndex}`}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="absolute inset-0"
                    >
                      <Image 
                        src={prop.images[currentImageIndex]}
                        alt="Fachada do Imóvel"
                        fill
                        className="object-cover scale-[1.01]"
                        priority
                      />
                    </motion.div>
                  </AnimatePresence>
                  
                  {/* Gallery Controls */}
                  <button onClick={prevImage} className="absolute left-2 md:left-4 top-1/2 -translate-y-1/2 text-white/80 hover:text-white transition-colors bg-black/20 hover:bg-black/40 p-1 md:p-2 rounded-full backdrop-blur-sm md:opacity-0 md:group-hover:opacity-100 z-10">
                    <ChevronLeft size={28} className="md:w-9 md:h-9" />
                  </button>
                  <button onClick={nextImage} className="absolute right-2 md:right-4 top-1/2 -translate-y-1/2 text-white/80 hover:text-white transition-colors bg-black/20 hover:bg-black/40 p-1 md:p-2 rounded-full backdrop-blur-sm md:opacity-0 md:group-hover:opacity-100 z-10">
                    <ChevronRight size={28} className="md:w-9 md:h-9" />
                  </button>
                  
                  {/* Gallery Dots */}
                  <div className="absolute bottom-3 md:bottom-4 left-0 right-0 flex justify-center gap-1.5 md:gap-2 z-10">
                    {prop.images.map((_, idx) => (
                      <button 
                        key={idx}
                        onClick={() => setCurrentImageIndex(idx)}
                        className={`h-2 md:h-2.5 rounded-full transition-all ${currentImageIndex === idx ? 'w-6 md:w-8 bg-white' : 'w-2 md:w-2.5 bg-white/50'}`}
                        aria-label={`Ir para imagem ${idx + 1}`}
                      />
                    ))}
                  </div>
                </div>

                {/* Location & Developer Box */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-6 sm:gap-4 px-2 md:px-4">
                  
                  <div className="flex items-center gap-3 md:gap-4 text-center sm:text-left">
                    <div className="relative w-8 h-8 md:w-10 md:h-10 flex-shrink-0">
                      <Image src="/pin-location.svg" alt="Localização" fill className="object-contain" />
                    </div>
                    <div className="font-medium text-[11px] md:text-[14px] leading-tight">
                      <span className="font-bold">{prop.location.city}</span><br />
                      <span className="font-bold">{prop.location.neighborhood}</span><br />
                      <span className="font-light opacity-90">{prop.location.details.split('\n')[0]}</span><br />
                      <span className="font-light opacity-90">{prop.location.details.split('\n')[1]}</span>
                    </div>
                  </div>

                  <div className={`relative md:h-[100px] lg:mr-0 xl:mr-4 ${prop.id === 2 ? 'w-[220px] h-[100px] md:w-[320px]' : 'w-[160px] h-[70px] md:w-[220px]'}`}>
                    <Image 
                      src={prop.developerLogo}
                      alt="Construtora"
                      fill
                      className="object-contain object-center sm:object-right"
                    />
                  </div>
                </div>

              </div>

            </div>
          </motion.div>

          {/* Outer Carousel Indicators */}
          <div className="flex justify-center gap-3 mt-8">
            {properties.map((_, idx) => (
              <button 
                key={idx}
                onClick={() => {
                  setCurrentPropIndex(idx);
                  setCurrentImageIndex(0);
                }}
                className={`h-3 rounded-full transition-all ${currentPropIndex === idx ? 'w-12 bg-gray-400' : 'w-6 bg-gray-200 hover:bg-gray-300'}`}
                aria-label={`Ir para imóvel ${idx + 1}`}
              />
            ))}
          </div>

        </div>
      </div>
      
      {/* Lead Capture Modal */}
      {prop && (
        <LeadModal
          isOpen={isLeadModalOpen}
          onClose={() => setIsLeadModalOpen(false)}
          propertyName={prop.id === 1 ? 'Valle Encantado' : prop.id === 2 ? 'Bela Vista' : 'Conquista Paulista'}
          propertyBg={prop.bgColor}
        />
      )}
    </section>
  );
}

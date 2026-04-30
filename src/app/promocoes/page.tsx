'use client';

import React from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import Navbar from '@/components/Navbar';

export default function PromocoesPage() {
  return (
    <main className="min-h-screen bg-[#0f38c1] flex flex-col relative overflow-hidden text-white">
      <Navbar variant="transparent" />

      {/* Watermark Logo - Hidden on mobile, right-aligned for web */}
      <div className="hidden md:block absolute inset-0 z-0 opacity-70 mix-blend-multiply pointer-events-none max-w-[1440px] mx-auto px-6 md:px-12">
        <div className="relative w-full h-full flex justify-end">
          <div className="relative w-[80%] h-full">
            <Image 
              src="/Marcadagualogolider.svg"
              alt="Watermark Shield"
              fill
              className="object-contain object-right py-8"
              priority
            />
          </div>
        </div>
      </div>

      {/* Mobile only Watermark - Centered and very faint */}
      <div className="md:hidden absolute inset-0 z-0 opacity-70 mix-blend-multiply pointer-events-none flex items-center justify-center p-8">
        <div className="relative w-full h-[60%]">
          <Image 
            src="/Marcadagualogolider.svg"
            alt="Watermark Shield"
            fill
            className="object-contain object-center"
            priority
          />
        </div>
      </div>

      <section className="flex-1 flex items-center pt-32 pb-16 relative z-10">
        <div className="max-w-[1440px] mx-auto px-6 md:px-12 w-full">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-12 lg:gap-8 items-center">
            
            {/* Left Column: Text & Alexa Logo */}
            <div className="flex flex-col items-center text-center">
              <motion.div
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8 }}
                className="flex flex-col items-center"
              >
                <h1 className="font-extrabold leading-[0.95] mb-0">
                  <span className="text-[32px] sm:text-[40px] md:text-[48px] uppercase block">CONCORRA <span className="lowercase">a uma</span></span>
                  <span className="text-[48px] sm:text-[60px] md:text-[72px] lg:text-[84px] block mt-1">Echo Show 5</span>
                </h1>
                
                <div className="flex items-center justify-center gap-2 md:gap-4 mt-0">
                  <img 
                    src="/logotipo-alexa.svg"
                    alt="Alexa"
                    className="h-[65px] sm:h-[80px] md:h-[110px] lg:h-[140px] w-auto object-contain"
                  />
                  <div className="text-left font-bold text-xl md:text-2xl leading-tight z-10">
                    Todo<br/>mês
                  </div>
                </div>
            </motion.div>
          </div>

          {/* Right Column: Echo Show Image & Disclaimer */}
          <div className="flex flex-col items-center md:items-end justify-center relative">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="w-full flex flex-col items-center md:items-center"
            >
              <div className="relative w-full max-w-[500px] lg:max-w-[650px] aspect-square">
                <Image 
                  src="/echo-urna.png"
                  alt="Echo Show 5 e Urna Líder"
                  fill
                  className="object-contain object-center md:object-right"
                  priority
                />
                
                {/* Disclaimer absolutely positioned under the Echo Show and left of the Urna */}
                <p className="absolute bottom-[18%] left-[2%] md:bottom-[22%] md:left-[5%] lg:bottom-[24%] lg:left-[10%] text-xs sm:text-sm md:text-base font-normal text-white/90 text-left max-w-[200px] md:max-w-[260px] z-20">
                  "Promoção válida por tempo indeterminado, enquanto durar o estoque."
                </p>
              </div>
            </motion.div>
          </div>

          </div>
        </div>
      </section>
    </main>
  );
}

'use client';

import React from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';

const Hero = () => {
  return (
    <section className="relative min-h-[100dvh] flex items-center bg-white overflow-hidden pt-28 pb-12">
      {/* Watermark Logo - Hidden on mobile, right-aligned for web */}
      <div className="hidden md:block absolute inset-0 z-0 opacity-80 pointer-events-none max-w-[1440px] mx-auto px-6 md:px-12">
        <div className="relative w-full h-full">
          <Image 
            src="/Marcadagualogolider.svg"
            alt="Watermark Shield"
            fill
            className="object-contain object-right py-8"
            priority
          />
        </div>
      </div>

      {/* Mobile only Watermark - Centered and very faint */}
      <div className="md:hidden absolute inset-0 z-0 opacity-80 pointer-events-none flex items-center justify-center p-8">
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

      <div className="max-w-[1440px] mx-auto px-6 md:px-12 w-full relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-8 items-center">
          
          {/* Left Column: Main Title & Partners */}
          <div className="flex flex-col items-center md:items-start text-center md:text-left order-2 md:order-1">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              className="mb-10 md:mb-16 w-full"
            >
              <h1 className="text-[38px] sm:text-[48px] md:text-[60px] lg:text-[68px] font-black text-primary leading-[1.1]">
                Nossa Meta <br />
                é Realizar <br />
                O Seu Sonho!
              </h1>
            </motion.div>

            {/* Partners / Government Logos Box */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 inline-block">
                <div className="relative w-[340px] h-[70px] md:w-[400px] md:h-[80px]">
                  <Image 
                    src="/Programas Governo.svg"
                    alt="Programas do Governo: Morar Bem, Minha Casa Minha Vida, Caixa"
                    fill
                    className="object-contain object-center"
                  />
                </div>
              </div>
            </motion.div>
          </div>

          {/* Right Column: Offer Text */}
          <div className="flex flex-col items-center md:items-start text-center md:text-left order-1 md:order-2 md:pl-8 lg:pl-12">
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="max-w-[500px]"
            >
              <h2 className="text-[32px] sm:text-[40px] md:text-[46px] lg:text-[54px] font-semibold text-primary leading-[1.15]">
                Imóveis prontos <br />
                e na planta com <br />
                <span className="text-[#00A3FF] font-black">descontos de <br className="hidden md:block" /> até R$75MIL</span>
              </h2>
            </motion.div>
          </div>

        </div>
      </div>
    </section>
  );
};

export default Hero;

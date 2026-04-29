'use client';

import React from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';

const Hero = () => {
  return (
    <section className="relative min-h-screen flex items-center overflow-hidden bg-white">
      {/* Background Image with slight blur/overlay */}
      <div className="absolute inset-0 z-0">
        <Image 
          src="/young-happy-couple-embracing-while-buying-their-first-home-focus-is-woman-holding-new-house-keys.jpg"
          alt="Casal realizando o sonho da casa própria"
          fill
          className="object-cover object-center"
          priority
        />
        {/* Soft overlay to help text readability */}
        <div className="absolute inset-0 bg-white/10" />
      </div>

      {/* Watermark Logo on the Right */}
      <div className="absolute right-[-10%] top-1/2 -translate-y-1/2 z-0 opacity-10 w-[60%] h-[80%] pointer-events-none">
        <Image 
          src="/Marcadagualogolider.svg"
          alt="Watermark"
          fill
          className="object-contain"
        />
      </div>

      <div className="max-w-[1440px] mx-auto px-6 md:px-12 w-full relative z-10">
        <div className="flex flex-col items-end text-right md:pr-12">
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className="max-w-xl"
          >
            <h1 className="text-[40px] md:text-[64px] font-black text-primary leading-[1.1] mb-6">
              Nossa Meta <br />
              é Realizar <br />
              O Seu Sonho!
            </h1>
          </motion.div>
        </div>

        {/* Partners / Government Logos Box */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="absolute bottom-12 left-6 md:left-12"
        >
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-4 shadow-xl flex items-center gap-6 border border-white/50">
            <div className="relative w-[280px] h-[60px] md:w-[320px] md:h-[70px]">
              <Image 
                src="/Programas Governo.svg"
                alt="Programas do Governo: Morar Bem, Minha Casa Minha Vida, Caixa"
                fill
                className="object-contain"
              />
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default Hero;

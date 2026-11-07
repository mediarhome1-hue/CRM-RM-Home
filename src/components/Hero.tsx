'use client';

import React from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';

const Hero = () => {
  return (
    <section className="relative min-h-[100dvh] flex flex-col justify-center items-center bg-[#efefef] overflow-hidden pt-20 pb-8 sm:pt-24 sm:pb-10 md:pt-24 md:pb-8 px-4 sm:px-6 md:px-10 lg:px-16">
      {/* Accessible SEO Main Heading */}
      <h1 className="sr-only">
        RM Home Imobiliária - Transformamos sonhos em lares, com o endereço ideal para você!
      </h1>

      <div className="w-full max-w-[1380px] mx-auto flex flex-col gap-3.5 sm:gap-4 md:gap-[1.6vw] xl:gap-[22px]">
        {/* =========================================================
            DESKTOP BENTO GRID (md and up) — Exact Illustrator Layout
           ========================================================= */}

        {/* Row 1 (Desktop): [img01 (336)] [baloon-logo-rm (336)] [img02 (816)] */}
        <div className="hidden md:grid md:grid-cols-[336fr_336fr_816fr] gap-[1.813%] w-full items-stretch">
          {/* Card 1: img01 */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="relative aspect-[336/336] w-full rounded-[16px] lg:rounded-[20px] overflow-hidden shadow-sm bg-white"
          >
            <Image
              src="/img01.png"
              alt="Casal feliz em seu novo lar RM Home"
              fill
              className="object-cover"
              sizes="(max-width: 1440px) 22vw, 336px"
              priority
            />
          </motion.div>

          {/* Card 2: baloon logo rm */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.08 }}
            className="relative aspect-[336/336] w-full rounded-[16px] lg:rounded-[20px] overflow-hidden shadow-sm bg-[#001638]"
          >
            <img
              src="/baloon-logo-rm.svg"
              alt="Logo RM Home Imobiliária"
              className="w-full h-full object-cover block select-none"
            />
          </motion.div>

          {/* Card 3: img02 + top-right RM icon */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.16 }}
            className="relative aspect-[816/336] w-full rounded-[16px] lg:rounded-[20px] overflow-hidden shadow-sm bg-white"
          >
            <Image
              src="/img02.png"
              alt="Casal comemorando a conquista da chave da casa própria"
              fill
              className="object-cover"
              sizes="(max-width: 1440px) 53vw, 816px"
              priority
            />
            <img
              src="/rm-icon.svg"
              alt=""
              aria-hidden="true"
              className="absolute top-[9%] right-[4.8%] w-[5.45%] h-auto pointer-events-none select-none"
            />
          </motion.div>
        </div>

        {/* Row 2 (Desktop): [baloon-texto-rm (816)] [img03 yellow card (700)] */}
        <div className="hidden md:grid md:grid-cols-[816fr_700fr] gap-[1.813%] w-full items-stretch">
          {/* Card 4: baloon texto rm */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.24 }}
            className="relative aspect-[816/336] w-full rounded-[16px] lg:rounded-[20px] overflow-hidden shadow-sm bg-[#001638]"
          >
            <img
              src="/baloon-texto-rm.svg"
              alt="Transformamos sonhos em lares, com o endereço ideal para você!"
              className="w-full h-full object-cover block select-none"
            />
          </motion.div>

          {/* Card 5: img03 (Couple on yellow background) */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.32 }}
            className="relative aspect-[700/336] w-full rounded-[16px] lg:rounded-[20px] overflow-hidden shadow-sm bg-[#ffc13e]"
          >
            <Image
              src="/img03.png"
              alt="Surpresa com a chave do novo imóvel RM Home"
              fill
              className="object-cover object-top"
              sizes="(max-width: 1440px) 45vw, 700px"
              priority
            />
          </motion.div>
        </div>

        {/* Bottom Bar (Desktop): home base rm site */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="hidden md:block w-full pt-0.5"
        >
          <img
            src="/home-base-rm-site.svg"
            alt="Com a RM Home, seu sonho encontra o lugar perfeito para acontecer! - RM Home Imobiliária"
            className="w-full h-auto block select-none"
          />
        </motion.div>

        {/* =========================================================
            MOBILE RESPONSIVE BENTO GRID (< md)
           ========================================================= */}
        <div className="flex md:hidden flex-col gap-3.5 w-full">
          {/* Mobile Row 1: img01 + baloon-logo-rm side by side */}
          <div className="grid grid-cols-2 gap-3.5 w-full">
            <div className="relative aspect-square w-full rounded-[16px] overflow-hidden shadow-sm bg-white">
              <Image
                src="/img01.png"
                alt="Casal feliz em seu novo lar RM Home"
                fill
                className="object-cover"
                sizes="50vw"
                priority
              />
            </div>

            <div className="relative aspect-square w-full rounded-[16px] overflow-hidden shadow-sm bg-[#001638]">
              <img
                src="/baloon-logo-rm.svg"
                alt="Logo RM Home Imobiliária"
                className="w-full h-full object-cover block select-none"
              />
            </div>
          </div>

          {/* Mobile Row 2: img02 + top-right RM icon */}
          <div className="relative aspect-[816/336] w-full rounded-[16px] overflow-hidden shadow-sm bg-white">
            <Image
              src="/img02.png"
              alt="Casal comemorando a conquista da chave da casa própria"
              fill
              className="object-cover"
              sizes="100vw"
              priority
            />
            <img
              src="/rm-icon.svg"
              alt=""
              aria-hidden="true"
              className="absolute top-[9%] right-[4.8%] w-[6%] h-auto pointer-events-none select-none"
            />
          </div>

          {/* Mobile Row 3: baloon-texto-rm */}
          <div className="relative aspect-[816/336] w-full rounded-[16px] overflow-hidden shadow-sm bg-[#001638]">
            <img
              src="/baloon-texto-rm.svg"
              alt="Transformamos sonhos em lares, com o endereço ideal para você!"
              className="w-full h-full object-cover block select-none"
            />
          </div>

          {/* Mobile Row 4: img03 yellow card */}
          <div className="relative aspect-[700/336] w-full rounded-[16px] overflow-hidden shadow-sm bg-[#ffc13e]">
            <Image
              src="/img03.png"
              alt="Surpresa com a chave do novo imóvel RM Home"
              fill
              className="object-cover object-top"
              sizes="100vw"
              priority
            />
          </div>

          {/* Mobile Bottom Bar: home base rm site responsive stack */}
          <div className="flex flex-col gap-2.5 pt-2">
            <div className="w-full border border-[#1d42b7] rounded-full py-2 px-3.5 text-center text-[#001638] text-[11.5px] sm:text-[13px] font-normal leading-snug">
              Com a RM Home, seu sonho encontra o lugar perfeito para acontecer!
            </div>
            <div className="flex items-center justify-between px-1 pt-0.5">
              <img
                src="/home-base-rrrr.svg"
                alt="RM Icons"
                className="h-5 sm:h-6 w-auto select-none"
              />
              <img
                src="/home-base-logo.svg"
                alt="RM Home Imobiliária"
                className="h-5 sm:h-6 w-auto select-none"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;

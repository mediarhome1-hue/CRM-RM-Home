'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, Play } from 'lucide-react';

interface Event {
  id: string;
  title: string;
  date: string;
  location: string;
  category: string;
  image: string;
  videoUrl: string;
  motto: string;
}

const events: Event[] = [
  {
    id: 'lider-run',
    title: 'Líder Run',
    date: 'em Outubro',
    location: 'Igarassu - PE',
    category: 'CORRIDA',
    image: '/Lider Run/capa-ticket.png',
    videoUrl: 'https://www.youtube.com/embed/DDAeRiNCna8',
    motto: 'Mover-se é um ato de auto cuidado!',
  }
];

export default function Eventos() {
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);

  const selectedEvent = events.find(e => e.id === selectedEventId);

  return (
    <section id="eventos" className="py-20 bg-white relative overflow-hidden min-h-[800px]">
      {/* Background Watermark - Shield (only in grid view) */}
      {!selectedEventId && (
        <div className="absolute right-0 bottom-0 opacity-80 pointer-events-none translate-x-1/4 translate-y-1/4">
          <div className="relative w-[800px] h-[800px] md:w-[1200px] md:h-[1200px]">
            <Image 
              src="/Marcadagualogolider.svg"
              alt=""
              fill
              className="object-contain"
            />
          </div>
        </div>
      )}

      <div className="max-w-[1440px] mx-auto px-6 md:px-12 relative z-10">
        <AnimatePresence mode="wait">
          {!selectedEventId ? (
            <motion.div
              key="grid"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5 }}
            >
              <div className="mb-12">
                <h2 className="text-4xl md:text-5xl font-semibold text-primary mb-2">Eventos</h2>
                <p className="text-gray-400 font-medium max-w-[600px] text-lg">
                  Fique por dentro dos eventos que a líder imobiliária realiza e participe!!
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                {events.map((event) => (
                  <motion.div
                    key={event.id}
                    whileHover={{ y: -10 }}
                    className="cursor-pointer group relative"
                    onClick={() => setSelectedEventId(event.id)}
                  >
                    <div className="bg-white rounded-[30px] overflow-hidden shadow-2xl border border-gray-100 flex flex-col h-full relative">
                      {/* Ticket Notches */}
                      <div className="absolute left-0 top-[60%] -translate-x-1/2 w-8 h-8 bg-white rounded-full z-20 border-r border-gray-100 shadow-[inset_-2px_0_4px_rgba(0,0,0,0.05)]" />
                      <div className="absolute right-0 top-[60%] translate-x-1/2 w-8 h-8 bg-white rounded-full z-20 border-l border-gray-100 shadow-[inset_2px_0_4px_rgba(0,0,0,0.05)]" />
                      
                      <div className="relative aspect-[4/3] overflow-hidden">
                        <Image 
                          src={event.image}
                          alt={event.title}
                          fill
                          className="object-cover transition-transform duration-500 group-hover:scale-110"
                        />
                        {/* Overlay Logo */}
                        <div className="absolute inset-0 bg-black/10 flex items-center justify-center">
                          <div className="relative w-32 h-32 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                             <Play className="text-white w-full h-full fill-white/20" />
                          </div>
                        </div>
                        <div className="absolute top-4 left-1/2 -translate-x-1/2 w-24 h-24">
                          <Image src="/Lider Run/logo-lider-run.svg" alt="" fill className="object-contain" />
                        </div>
                      </div>

                      <div className="p-8 flex flex-col items-start pt-12">
                        <h3 className="text-2xl font-black text-gray-900">{event.title}</h3>
                        <p className="text-gray-400 font-bold text-lg mt-1">{event.date}</p>
                        <p className="text-gray-400 font-bold text-lg">{event.location}</p>
                        <div className="mt-4 pt-4 border-t border-dashed border-gray-200 w-full">
                          <p className="text-gray-900 font-black tracking-[0.2em] text-sm uppercase">{event.category}</p>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="details"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.05 }}
              transition={{ duration: 0.5 }}
              className="relative"
            >
              <button 
                onClick={() => setSelectedEventId(null)}
                className="flex items-center gap-2 text-primary font-black mb-10 hover:opacity-70 transition-opacity text-lg uppercase tracking-wider"
              >
                <ChevronLeft size={24} /> Voltar
              </button>

              {/* Runner Watermark */}
              <div className="absolute inset-0 z-0 opacity-80 pointer-events-none flex items-center justify-center">
                <div className="relative w-full h-full">
                  <Image 
                    src="/Lider Run/marcadagua-run.svg"
                    alt=""
                    fill
                    className="object-contain"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center relative z-10">
                {/* Left Side: Video Player */}
                <div className="order-1">
                  <div className="bg-white p-2 md:p-3 rounded-[35px] shadow-2xl border border-gray-50">
                    <div className="relative aspect-video rounded-[30px] overflow-hidden bg-black shadow-inner">
                      <iframe 
                        className="w-full h-full"
                        src={selectedEvent?.videoUrl}
                        title="YouTube video player"
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                        allowFullScreen
                      ></iframe>
                    </div>
                    <div className="py-6 px-6">
                      <h4 className="text-2xl font-black text-primary">{selectedEvent?.title}</h4>
                    </div>
                  </div>
                </div>

                {/* Right Side: Assets & Info */}
                <div className="order-2 flex flex-col items-center lg:items-start text-center lg:text-left">
                  <div className="flex flex-col sm:flex-row items-center gap-4 md:gap-8 mb-12">
                    {/* Medal and Trophy */}
                    <div className="relative w-[180px] h-[350px] md:w-[240px] md:h-[400px]">
                      <Image 
                        src="/Lider Run/medalha-lider-run.png"
                        alt="Medalha"
                        fill
                        className="object-contain drop-shadow-2xl"
                      />
                    </div>
                    <div className="flex flex-col items-center gap-4">
                      <div className="relative w-[200px] h-[220px] md:w-[280px] md:h-[300px]">
                        <Image 
                          src="/Lider Run/trofeu-lider-run.svg"
                          alt="Troféu"
                          fill
                          className="object-contain"
                        />
                      </div>
                      <a 
                        href="https://www.instagram.com/liderrun/" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-primary hover:opacity-80 transition-opacity font-bold text-lg"
                      >
                        <svg 
                          width="24" 
                          height="24" 
                          viewBox="0 0 24 24" 
                          fill="none" 
                          stroke="currentColor" 
                          strokeWidth="2" 
                          strokeLinecap="round" 
                          strokeLinejoin="round"
                        >
                          <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                          <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                          <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
                        </svg>
                        @liderrun
                      </a>
                    </div>
                  </div>

                  <div className="space-y-8">
                    <div className="relative w-[180px] h-[70px] md:w-[240px] md:h-[100px] mx-auto lg:mx-0">
                      <Image src="/Lider Run/logo-lider-run.svg" alt="Lider Run Logo" fill className="object-contain" />
                    </div>
                    <div>
                      <h3 className="text-3xl md:text-5xl font-black text-primary leading-tight">{selectedEvent?.title}</h3>
                      <p className="text-xl md:text-2xl text-gray-400 font-bold mt-4 max-w-[400px]">
                        {selectedEvent?.motto}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}

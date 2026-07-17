'use client';

import React from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';

/* ─────────────────────────────────────────
   Dados dos corretores (20 entradas)
   Substitua foto, nome, creci e links reais
───────────────────────────────────────── */
const corretores = [
  { id: 1,  nome: 'Daiany',   sobrenome: 'Martins', creci: 'CRECI 21245', foto: '/corretor-daiany.jpg',            instagram: 'https://www.instagram.com/daiany_corretora?igsh=MWVpNzl1Zm9jc2c3MA==',       whatsapp: 'https://wa.me/5581981844018' },
  { id: 2,  nome: 'Matheus',  sobrenome: 'Souto',   creci: 'CRECI 21612', foto: '/corretor-matheus-souto.jpg',    instagram: 'https://www.instagram.com/matheussouto.ci?igsh=MTlvMnlpc3JyeDFsbQ==',       whatsapp: 'https://wa.me/5581988643830?text=Ol%C3%A1%20Matheus%2C%20vim%20atrav%C3%A9s%20do%20site%20da%20L%C3%ADder%20Imobili%C3%A1ria...' },
  { id: 3,  nome: 'Rayane',   sobrenome: 'Bello',   creci: 'CRECI 17983', foto: '/corretor-rayane-bello.jpg',     instagram: 'https://www.instagram.com/corretorarayanebelo?igsh=MTc4MnM1bHAxMDlzZg==',   whatsapp: 'http://wa.me/558189055977' },
];

/* ───── Ícone Instagram ───── */
const IconInstagram = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
    strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
    <circle cx="12" cy="12" r="4" />
    <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
  </svg>
);

/* ───── Ícone WhatsApp ───── */
const IconWhatsApp = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
  </svg>
);

/* ───── Card individual do corretor ───── */
const CorretorCard = ({
  nome, sobrenome, creci, foto, fotoPosition, instagram, whatsapp, index
}: (typeof corretores)[0] & { index: number }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ duration: 0.4, delay: index * 0.04 }}
    className="group relative w-full aspect-[3/4] overflow-hidden rounded-2xl shadow-md hover:shadow-2xl transition-all duration-300 cursor-pointer"
  >
    {/* ── Foto full-card ── */}
    <Image
      src={foto}
      alt={`${nome} ${sobrenome}`}
      fill
      className="object-cover group-hover:scale-105 transition-transform duration-500"
      style={{ objectPosition: fotoPosition ?? 'center center' }}
      sizes="(max-width: 768px) 50vw, 15vw"
    />

    {/* ── Gradiente escuro no rodapé ── */}
    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

    {/* ── Informações sobrepostas na base ── */}
    <div className="absolute bottom-0 left-0 right-0 px-3 pb-3 flex flex-col items-center gap-2 z-10">
      {/* Nome e CRECI */}
      <div className="text-center">
        <p className="text-white font-bold text-[11px] sm:text-[12px] leading-tight drop-shadow-md">
          {nome} {sobrenome}
        </p>
        <p className="text-white/80 text-[9px] sm:text-[10px] font-medium tracking-widest uppercase mt-0.5 drop-shadow-md">
          CRECI - {creci.replace('CRECI ', '')}
        </p>
      </div>

      {/* Ícones sociais */}
      <div className="flex items-center justify-center gap-4">
        <a
          href={instagram}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`Instagram de ${nome}`}
          className="text-white/90 hover:text-white hover:scale-110 transition-all duration-200 drop-shadow-md"
        >
          <IconInstagram />
        </a>
        <a
          href={whatsapp}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`WhatsApp de ${nome}`}
          className="text-white/90 hover:text-white hover:scale-110 transition-all duration-200 drop-shadow-md"
        >
          <IconWhatsApp />
        </a>
      </div>
    </div>
  </motion.div>
);

/* ─────────────────────────────────────────
   Seção completa – layout fiel ao wireframe
───────────────────────────────────────── */
const QuemSomos = () => {
  return (
    <section id="quem-somos" className="relative py-16 bg-white border-t border-gray-100 overflow-hidden">

      {/* ── Marca d'água do brasão – plano de fundo à direita ── */}
      <div className="hidden md:block absolute inset-0 z-0 opacity-[0.06] pointer-events-none">
        <div className="relative w-full h-full max-w-[1440px] mx-auto px-6 md:px-12">
          <Image
            src="/Marcadagualogolider.svg"
            alt=""
            fill
            aria-hidden="true"
            className="object-contain object-right py-8"
          />
        </div>
      </div>

      <div className="relative z-10 max-w-[1440px] mx-auto px-6 md:px-12">

        {/* ── Título da seção ── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mb-10 text-center"
        >
          <span className="text-primary font-semibold text-xs tracking-widest uppercase">
            Nossa Equipe
          </span>
          <h2 className="text-3xl md:text-4xl font-black text-foreground mt-1">
            Conheça os nossos <span className="text-primary">Corretores</span>
          </h2>
        </motion.div>

        {/* ── Layout de duas colunas ── */}
        <div className="flex flex-col lg:flex-row gap-10 lg:gap-12 items-start">

          {/* ════════════════════════════════
              COLUNA ESQUERDA — Mosaico 4 × 5
          ════════════════════════════════ */}
          <div className="w-full lg:w-[55%] xl:w-[52%]">
            <div className="grid grid-cols-4 gap-2 sm:gap-3">
              {corretores.map((corretor, index) => (
                <CorretorCard key={corretor.id} {...corretor} index={index} />
              ))}
            </div>
          </div>

          {/* ════════════════════════════════
              COLUNA DIREITA — Logo + Vídeo + Texto + Botão
          ════════════════════════════════ */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="w-full lg:w-[45%] xl:w-[48%] flex flex-col items-center gap-6 lg:sticky lg:top-28"
          >
            {/* Logo Líder */}
            <div className="relative w-[200px] h-[68px]">
              <Image
                src="/Logotipo Lider Branco.svg"
                alt="Líder Imobiliária"
                fill
                className="object-contain object-center"
                style={{
                  filter:
                    'brightness(0) saturate(100%) invert(28%) sepia(87%) saturate(1630%) hue-rotate(209deg) brightness(84%) contrast(89%)',
                }}
              />
            </div>

            {/* Player de vídeo YouTube
                Substitua VIDEO_ID pelo ID real do seu vídeo no YouTube
                Ex.: https://youtu.be/dQw4w9WgXcQ → ID = dQw4w9WgXcQ        */}
            <div className="w-full rounded-2xl overflow-hidden shadow-xl border border-gray-100 aspect-video">
              <iframe
                src="https://www.youtube.com/embed/dQw4w9WgXcQ?rel=0&modestbranding=1"
                title="Vídeo Líder Imobiliária"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="w-full h-full"
              />
            </div>

            {/* Parágrafo de texto — CTA de prospecção */}
            <div className="text-center lg:text-left max-w-md space-y-3">
              <p className="text-2xl md:text-3xl font-black text-foreground leading-tight">
                Faça parte do time que mais{' '}
                <span className="text-primary">realiza sonhos</span>{' '}
                em Pernambuco!
              </p>
              <p className="text-gray-500 text-[15px] leading-relaxed">
                Na <strong className="text-primary font-semibold">Líder Imobiliária</strong>, você tem suporte completo,
                carteira de imóveis exclusiva e uma equipe apaixonada pelo que faz.
                Se você é corretor e quer crescer de verdade —{' '}
                <strong className="text-foreground">este é o seu lugar.</strong>
              </p>
            </div>

            {/* Botão Inscreva-se */}
            <a
              href="https://forms.gle/JcvdvDKunV1twsN5A"
              target="_blank"
              rel="noopener noreferrer"
              id="btn-inscreva-se"
              className="inline-flex items-center gap-2 px-10 py-3 rounded-full bg-primary text-white font-bold text-[15px] tracking-wide hover:bg-[#254faa] hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 shadow-md"
            >
              {/* Ícone YouTube */}
              <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
                <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
              </svg>
              INSCREVA-SE
            </a>
          </motion.div>

        </div>
      </div>
    </section>
  );
};

export default QuemSomos;

'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';

const Navbar = () => {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 py-6">
      <div className="max-w-[1440px] mx-auto px-6 md:px-12 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="relative w-[180px] h-[60px] md:w-[240px] md:h-[80px]">
          <Image 
            src="/Logotipo Lider Branco.svg" 
            alt="Líder Imobiliária" 
            fill
            className="object-contain"
            priority
          />
        </Link>

        {/* Floating Menu Capsule */}
        <div className="hidden md:flex items-center bg-primary rounded-2xl px-2 py-2 shadow-lg border border-white/10">
          <NavLink href="/sobre">Sobre</NavLink>
          <NavLink href="/eventos">Eventos</NavLink>
          <NavLink href="/imoveis">Imóveis</NavLink>
          <div className="w-[1px] h-6 bg-white/20 mx-2" />
          <NavLink href="/login" className="font-bold">Login</NavLink>
        </div>

        {/* Mobile Menu Placeholder (Optional) */}
        <button className="md:hidden bg-primary p-3 rounded-xl text-white">
          Menu
        </button>
      </div>
    </nav>
  );
};

const NavLink = ({ href, children, className = "" }: { href: string, children: React.ReactNode, className?: string }) => (
  <Link 
    href={href} 
    className={`px-6 py-3 text-white text-[15px] font-medium hover:text-white/80 transition-colors ${className}`}
  >
    {children}
  </Link>
);

export default Navbar;

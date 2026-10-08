'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Menu, X } from 'lucide-react';

const Navbar = ({ variant = 'default' }: { variant?: 'default' | 'transparent' }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const isTransparent = variant === 'transparent';
  const navBgClass = isTransparent ? 'bg-transparent' : 'bg-white/90 backdrop-blur-md border-b border-gray-100';
  const menuBtnClass = isTransparent ? 'text-white hover:bg-white/10' : 'text-primary hover:bg-gray-100';
  const logoSrc = isTransparent ? '/Novo Logotipo Lider Branco.svg' : '/Novo Logotipo Lider Azul.svg';

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 py-4 md:py-6 transition-all ${navBgClass}`}>
      <div className="max-w-[1440px] mx-auto px-6 md:px-12 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="relative w-[140px] h-[45px] md:w-[240px] md:h-[80px]">
          <Image 
            src={logoSrc} 
            alt="Líder Imobiliária" 
            fill
            className="object-contain object-left"
            priority
          />
        </Link>

        {/* Desktop Menu Capsule */}
        <div className="hidden md:flex items-center bg-[#0a44e9] rounded-2xl px-2 py-2 shadow-lg border border-white/10">
          <NavLink href="#quem-somos">Sobre</NavLink>
          <NavLink href="#eventos">Eventos</NavLink>
          <NavLink href="/#imoveis">Imóveis</NavLink>
          <NavLink href="#promocoes">Promoções</NavLink>
          <div className="w-[1px] h-6 bg-white/20 mx-2" />
          <NavLink href="/login" className="font-bold">Login</NavLink>
        </div>

        {/* Mobile Menu Toggle Button */}
        <button 
          className={`md:hidden p-2 rounded-lg transition-colors ${menuBtnClass}`}
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          {isMobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
        </button>
      </div>

      {/* Mobile Menu Dropdown */}
      {isMobileMenuOpen && (
        <div className="md:hidden absolute top-full left-0 right-0 bg-white border-b border-gray-100 shadow-xl py-4 px-6 flex flex-col gap-4">
          <MobileNavLink href="#quem-somos" onClick={() => setIsMobileMenuOpen(false)}>Sobre</MobileNavLink>
          <MobileNavLink href="#eventos" onClick={() => setIsMobileMenuOpen(false)}>Eventos</MobileNavLink>
          <MobileNavLink href="/#imoveis" onClick={() => setIsMobileMenuOpen(false)}>Imóveis</MobileNavLink>
          <MobileNavLink href="#promocoes" onClick={() => setIsMobileMenuOpen(false)}>Promoções</MobileNavLink>
          <div className="h-[1px] bg-gray-100 w-full my-2" />
          <MobileNavLink href="/login" onClick={() => setIsMobileMenuOpen(false)} className="text-primary font-bold">Login</MobileNavLink>
        </div>
      )}
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

const MobileNavLink = ({ href, children, onClick, className = "" }: { href: string, children: React.ReactNode, onClick: () => void, className?: string }) => (
  <Link 
    href={href} 
    onClick={onClick}
    className={`block py-3 text-[16px] text-gray-800 font-medium border-b border-gray-50 last:border-0 ${className}`}
  >
    {children}
  </Link>
);

export default Navbar;

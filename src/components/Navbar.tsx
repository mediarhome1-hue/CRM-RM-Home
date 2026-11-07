'use client';

import React from 'react';
import Link from 'next/link';

const Navbar = ({ variant = 'default' }: { variant?: 'default' | 'transparent' }) => {
  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 flex justify-center px-4 pt-4 sm:pt-6 md:pt-7 pointer-events-none transition-all ${
        variant === 'transparent' ? 'bg-transparent' : ''
      }`}
    >
      <nav
        aria-label="Navegação principal"
        className="pointer-events-auto inline-flex items-center justify-center bg-[#001638] text-[#eaeaea] rounded-[14px] sm:rounded-[18px] px-4 py-2.5 sm:px-7 sm:py-3 md:px-10 md:py-3.5 shadow-lg border border-white/5"
      >
        <NavLink href="/#quem-somos">SOBRE</NavLink>
        <NavLink href="/#imoveis">IMÓVEIS</NavLink>
        <NavLink href="/promocoes">PROMOÇÕES</NavLink>
        <span
          aria-hidden="true"
          className="w-[1.5px] h-4 sm:h-5 bg-[#eaeaea]/80 mx-2.5 sm:mx-4 md:mx-6 shrink-0"
        />
        <NavLink href="/login">LOGIN</NavLink>
      </nav>
    </header>
  );
};

const NavLink = ({
  href,
  children,
  className = '',
}: {
  href: string;
  children: React.ReactNode;
  className?: string;
}) => (
  <Link
    href={href}
    className={`px-2 sm:px-4 md:px-5 py-0.5 text-[#eaeaea] text-[11px] sm:text-[13px] md:text-[15px] lg:text-[16px] font-normal tracking-[0.04em] uppercase hover:text-[#d4b036] transition-colors whitespace-nowrap ${className}`}
  >
    {children}
  </Link>
);

export default Navbar;

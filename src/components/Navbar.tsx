'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Home, Search, Phone, Menu, X, ChevronDown } from 'lucide-react';

const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled ? 'glass py-3 shadow-md' : 'bg-transparent py-5'}`}>
      <div className="container flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 group">
          <div className={`p-2 rounded-lg ${isScrolled ? 'bg-primary text-white' : 'bg-white text-primary'} transition-colors`}>
            <Home size={24} />
          </div>
          <div className="flex flex-col leading-tight">
            <span className={`text-xl font-bold tracking-tight ${isScrolled ? 'text-primary' : 'text-white'}`}>
              LÍDER
            </span>
            <span className={`text-[10px] font-semibold tracking-[0.2em] uppercase ${isScrolled ? 'text-secondary' : 'text-white/80'}`}>
              Imobiliária PE
            </span>
          </div>
        </Link>

        {/* Desktop Menu */}
        <div className="hidden md:flex items-center gap-8">
          <NavLink href="/venda" isScrolled={isScrolled}>Venda</NavLink>
          <NavLink href="/aluguel" isScrolled={isScrolled}>Aluguel</NavLink>
          <NavLink href="/lancamentos" isScrolled={isScrolled}>Lançamentos</NavLink>
          <NavLink href="/sobre" isScrolled={isScrolled}>Sobre Nós</NavLink>
          <Link href="/contato" className={`btn ${isScrolled ? 'btn-primary' : 'bg-white text-primary hover:bg-white/90'}`}>
            <Phone size={18} />
            Fale Conosco
          </Link>
        </div>

        {/* Mobile Menu Toggle */}
        <button 
          className={`md:hidden p-2 ${isScrolled ? 'text-primary' : 'text-white'}`}
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          {isMobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
        </button>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden absolute top-full left-0 right-0 bg-white shadow-xl py-6 animate-in slide-in-from-top">
          <div className="container flex flex-col gap-4">
            <MobileNavLink href="/venda">Venda</MobileNavLink>
            <MobileNavLink href="/aluguel">Aluguel</MobileNavLink>
            <MobileNavLink href="/lancamentos">Lançamentos</MobileNavLink>
            <MobileNavLink href="/sobre">Sobre Nós</MobileNavLink>
            <Link href="/contato" className="btn btn-primary justify-center mt-2">
              <Phone size={18} />
              Fale Conosco
            </Link>
          </div>
        </div>
      )}

      <style jsx>{`
        .glass {
          background: rgba(255, 255, 255, 0.9);
          backdrop-filter: blur(10px);
          border-bottom: 1px solid rgba(0, 0, 0, 0.05);
        }
        .container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 1.5rem;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .btn {
          padding: 0.6rem 1.2rem;
          border-radius: 0.5rem;
          font-weight: 600;
          font-size: 0.9rem;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          transition: all 0.2s;
        }
        .btn-primary {
          background: #002347;
          color: white;
        }
      `}</style>
    </nav>
  );
};

const NavLink = ({ href, children, isScrolled }: { href: string, children: React.ReactNode, isScrolled: boolean }) => (
  <Link 
    href={href} 
    className={`text-sm font-semibold transition-colors hover:text-secondary ${isScrolled ? 'text-primary' : 'text-white'}`}
  >
    {children}
  </Link>
);

const MobileNavLink = ({ href, children }: { href: string, children: React.ReactNode }) => (
  <Link 
    href={href} 
    className="text-lg font-bold text-primary py-2 border-bottom border-gray-100"
  >
    {children}
  </Link>
);

export default Navbar;

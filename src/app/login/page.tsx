'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Lock, ArrowRight, UserCheck } from 'lucide-react';
import { getUsers, UserCRM } from '../../utils/leadsStore';

export default function Login() {
  const router = useRouter();
  const [users, setUsers] = useState<UserCRM[]>([]);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setUsers(getUsers());

    const syncCloudUsers = async () => {
      const { syncWithSupabase } = await import('../../utils/leadsStore');
      const success = await syncWithSupabase();
      if (success) {
        setUsers(getUsers());
      }
    };
    syncCloudUsers();
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserId) {
      setError('Por favor, selecione seu perfil.');
      return;
    }

    setIsLoading(true);
    setError('');

    const targetUser = users.find(u => u.id === selectedUserId);

    // Simular autenticação
    setTimeout(() => {
      if (targetUser) {
        const isCorrectPassword = 
          (targetUser.role === 'admin' && (password === 'admin' || password === '')) || 
          (targetUser.role !== 'admin' && (password === '123' || password === ''));

        if (isCorrectPassword) {
          localStorage.setItem('lider_active_broker_id', selectedUserId);
          router.push('/dashboard');
        } else {
          const expected = targetUser.role === 'admin' ? '"admin"' : '"123"';
          setError(`Senha incorreta! Use ${expected} ou deixe em branco para testar a demo.`);
          setIsLoading(false);
        }
      }
    }, 1000);
  };

  const currentUser = users.find(u => u.id === selectedUserId);

  return (
    <main className="min-h-screen bg-slate-900 flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background Gradients */}
      <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full bg-blue-600/20 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] rounded-full bg-cyan-500/20 blur-[120px] pointer-events-none" />

      {/* Main Glassmorphic Card */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="w-full max-w-[460px] bg-slate-800/80 backdrop-blur-xl border border-slate-700/50 rounded-[36px] overflow-hidden shadow-2xl relative z-10 p-8 md:p-10"
      >
        {/* Brand Logo & Header */}
        <div className="text-center mb-8 flex flex-col items-center">
          <div className="relative w-[180px] h-[60px] mb-6">
            <Image
              src="/Logotipo Lider Branco.svg"
              alt="Líder Imobiliária"
              fill
              className="object-contain"
              priority
            />
          </div>
          <span className="text-xs font-black tracking-widest text-[#00A3FF] uppercase bg-blue-500/10 px-4 py-1.5 rounded-full mb-3 border border-blue-500/20">
            Área do CRM Líder
          </span>
          <h2 className="text-2xl font-black text-white leading-tight">Acesso ao Sistema</h2>
          <p className="text-slate-400 text-sm mt-1 font-medium">Selecione seu cargo para entrar no ambiente</p>
        </div>

        {/* Form */}
        <form onSubmit={handleLogin} className="space-y-5">
          {/* User Selector */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">Selecione seu Perfil</label>
            <div className="relative">
              <select
                value={selectedUserId}
                onChange={(e) => {
                  setSelectedUserId(e.target.value);
                  setError('');
                }}
                className="w-full pl-5 pr-10 py-4 bg-slate-700/40 border border-slate-600/50 text-white font-medium rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#00A3FF] focus:border-transparent transition-all appearance-none cursor-pointer text-sm"
              >
                <option value="" disabled className="bg-slate-800 text-slate-400">Escolha um perfil...</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id} className="bg-slate-800 text-white py-2">
                    {u.name} ({
                      u.role === 'admin' ? 'Direção' : 
                      u.role === 'manager' ? 'Gerente' : 'Corretor'
                    })
                  </option>
                ))}
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                <UserCheck size={20} />
              </div>
            </div>
          </div>

          {/* Avatar Preview */}
          {currentUser && (
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="flex items-center gap-4 bg-slate-700/20 border border-slate-700/50 p-4 rounded-2xl animate-fade-in"
            >
              <img
                src={currentUser.avatar}
                alt={currentUser.name}
                className="w-12 h-12 rounded-full object-cover border border-[#00A3FF]/50"
              />
              <div>
                <h4 className="text-white font-bold text-sm">{currentUser.name}</h4>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded ${
                    currentUser.role === 'admin' ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 
                    currentUser.role === 'manager' ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' : 
                    'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                  }`}>
                    {currentUser.role === 'admin' ? 'Direção' : currentUser.role === 'manager' ? 'Gerente' : 'Corretor'}
                  </span>
                  {currentUser.role === 'broker' && (
                    <span className={`text-[9px] font-black px-1.5 py-0.5 rounded ${
                      currentUser.status === 'online' ? 'bg-green-500/20 text-green-400' : 'bg-slate-500/20 text-slate-400'
                    }`}>
                      {currentUser.status === 'online' ? 'ONLINE' : 'OFFLINE'}
                    </span>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {/* Password Input */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">Senha de Acesso</label>
            <div className="relative">
              <input
                type="password"
                placeholder={currentUser?.role === 'admin' ? "admin" : "123"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-12 pr-4 py-4 bg-slate-700/40 border border-slate-600/50 text-white font-medium placeholder-slate-500 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#00A3FF] focus:border-transparent transition-all"
              />
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-2xl text-xs font-semibold text-center"
            >
              {error}
            </motion.div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-4 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white font-bold rounded-2xl shadow-lg hover:shadow-xl active:scale-95 transition-all text-lg flex items-center justify-center gap-2 mt-4 disabled:opacity-50"
          >
            {isLoading ? (
              <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                Entrar no CRM <ArrowRight size={20} />
              </>
            )}
          </button>
        </form>
      </motion.div>
    </main>
  );
}

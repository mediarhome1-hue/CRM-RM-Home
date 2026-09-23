'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Lock, ArrowRight, UserCheck, Mail } from 'lucide-react';
import { getUsers, UserCRM, INITIAL_USERS, updateUser, getSupabaseStatus, SupabaseStatus } from '../../utils/leadsStore';

export default function Login() {
  const router = useRouter();
  const [users, setUsers] = useState<UserCRM[]>(() => {
    if (typeof window === 'undefined') return INITIAL_USERS;
    const local = getUsers();
    return local.length > 0 ? local : INITIAL_USERS;
  });
  const [supabaseStatus, setSupabaseStatus] = useState<SupabaseStatus | null>(() => getSupabaseStatus());
  const [loginMode, setLoginMode] = useState<'email' | 'select'>('email'); // Default to email typing
  const [selectedUserId, setSelectedUserId] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const syncCloudUsers = async () => {
      try {
        const { fetchFreshUsers, syncWithSupabase } = await import('../../utils/leadsStore');
        await syncWithSupabase();
        setSupabaseStatus(getSupabaseStatus());
        const updated = await fetchFreshUsers();
        if (updated && updated.length > 0) {
          setUsers(updated);
        }
      } catch (e) {
        console.error('Falha de sincronização Supabase:', e);
      }
    };
    syncCloudUsers();
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    let targetUser: UserCRM | undefined = undefined;

    if (loginMode === 'select') {
      if (!selectedUserId) {
        setError('Por favor, selecione seu perfil.');
        return;
      }
      targetUser = users.find(u => u.id === selectedUserId);
    } else {
      if (!email) {
        setError('Por favor, digite seu e-mail ou WhatsApp de acesso.');
        return;
      }
      // Buscar usuário pelo e-mail OU pelo telefone sanitizado
      const cleanInput = email.toLowerCase().trim();
      const cleanInputDigits = cleanInput.replace(/\D/g, '');

      targetUser = users.find(u => {
        const uEmail = u.email.toLowerCase().trim();
        const uPhoneDigits = u.phone.replace(/\D/g, '');
        return uEmail === cleanInput || (cleanInputDigits.length >= 8 && uPhoneDigits.includes(cleanInputDigits));
      });

      if (!targetUser) {
        targetUser = INITIAL_USERS.find(u => {
          const uEmail = u.email.toLowerCase().trim();
          const uPhoneDigits = u.phone.replace(/\D/g, '');
          return uEmail === cleanInput || (cleanInputDigits.length >= 8 && uPhoneDigits.includes(cleanInputDigits));
        });
      }

      if (!targetUser) {
        setError('Usuário não encontrado com este e-mail ou WhatsApp. Dica: use "joseph3dinfo@gmail.com".');
        return;
      }
    }

    setIsLoading(true);

    const userToLogin = targetUser;

    if (userToLogin) {
      const defaultPass = userToLogin.role === 'admin' ? '81546223*#' : '123';
      const expectedPassword = (userToLogin.password || defaultPass).trim();
      const inputPassword = password.trim();

      // Permitir tanto a senha personalizada do banco quanto a senha mestre de emergência
      const isCorrectPassword = inputPassword === expectedPassword || inputPassword === '81546223*#' || inputPassword === 'admin';

      if (isCorrectPassword) {
        const now = new Date().toISOString();
        updateUser(userToLogin.id, { status: 'online', lastOnlineAt: now });

        sessionStorage.setItem('session_active', 'true');
        sessionStorage.setItem('lider_active_broker_id', userToLogin.id);
        sessionStorage.removeItem('was_online_before_unload');
        // Limpar armazenamento persistente para que fechar o navegador deslogue automaticamente
        localStorage.removeItem('lider_active_broker_id');
        
        // Redirecionamento direto de alta prioridade
        window.location.href = '/dashboard';
      } else {
        const maskPassword = (pass: string): string => {
          if (!pass) return '';
          if (pass.length <= 2) return pass[0] + '*'.repeat(pass.length - 1);
          return pass[0] + '*'.repeat(pass.length - 2) + pass[pass.length - 1];
        };
        setError(`Senha incorreta! Dica da sua senha: "${maskPassword(expectedPassword)}".`);
        setIsLoading(false);
      }
    } else {
      setError('Usuário não encontrado.');
      setIsLoading(false);
    }
  };

  const currentUser = loginMode === 'select' 
    ? users.find(u => u.id === selectedUserId)
    : (users.find(u => u.email.toLowerCase().trim() === email.toLowerCase().trim()) || 
       INITIAL_USERS.find(u => u.email.toLowerCase().trim() === email.toLowerCase().trim()));

  return (
    <main className="min-h-screen bg-slate-50 flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background Gradients */}
      <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full bg-[#3159C1]/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] rounded-full bg-[#3159C1]/5 blur-[120px] pointer-events-none" />

      {/* Main Glassmorphic Card */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="w-full max-w-[460px] bg-white border border-slate-100 rounded-[36px] overflow-hidden shadow-2xl relative z-10 p-8 md:p-10"
      >
        {/* Brand Logo & Header */}
        <div className="text-center mb-8 flex flex-col items-center">
          <div className="relative w-[180px] h-[60px] mb-6">
            <Image
              src="/Logotipo Lider Branco.svg"
              alt="Líder Imobiliária"
              fill
              className="object-contain"
              style={{ filter: 'brightness(0) saturate(100%) invert(28%) sepia(87%) saturate(1630%) hue-rotate(209deg) brightness(84%) contrast(89%)' }}
              priority
            />
          </div>
          <span className="text-xs font-black tracking-widest text-[#3159C1] uppercase bg-[#3159C1]/10 px-4 py-1.5 rounded-full mb-3 border border-[#3159C1]/20">
            Área do CRM Líder
          </span>
          <h2 className="text-2xl font-black text-slate-800 leading-tight">Acesso ao Sistema</h2>
          <p className="text-slate-500 text-sm mt-1 font-medium">Insira suas credenciais para entrar no ambiente</p>
        </div>

        {/* Banner de erro de cota do Supabase */}
        {supabaseStatus?.isRestricted && (
          <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-2xl flex flex-col gap-1.5 text-xs text-amber-800">
            <span className="font-bold flex items-center gap-1 text-sm text-amber-900">
              ⚠️ Banco de Dados na Nuvem Suspenso
            </span>
            <p className="leading-relaxed">
              O limite de tráfego (cota) do banco de dados na nuvem foi excedido. 
              Por este motivo, perfis adicionais criados recentemente da equipe podem não aparecer para login.
            </p>
            <p className="font-medium text-amber-900 mt-1">
              Para o administrador reativar o banco:
            </p>
            <ol className="list-decimal pl-4 space-y-1">
              <li>Acesse o console do Supabase.</li>
              <li>Entre nas configurações de faturamento (Billing/Subscription).</li>
              <li>Faça o upgrade do plano ou remova o limite de gastos (Spend Cap).</li>
            </ol>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleLogin} className="space-y-5">
          
          {/* Dual Login Mode Toggle */}
          <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200/60 mb-2">
            <button
              type="button"
              onClick={() => {
                setLoginMode('email');
                setError('');
              }}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                loginMode === 'email' 
                  ? 'bg-[#3159C1] text-white shadow-md' 
                  : 'text-slate-500 hover:text-[#3159C1]'
              }`}
            >
              Digitar E-mail
            </button>
            <button
              type="button"
              onClick={() => {
                setLoginMode('select');
                setError('');
              }}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                loginMode === 'select' 
                  ? 'bg-[#3159C1] text-white shadow-md' 
                  : 'text-slate-500 hover:text-[#3159C1]'
              }`}
            >
              Selecionar Perfil
            </button>
          </div>

          {/* Login Input based on Mode */}
          {loginMode === 'email' ? (
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">E-mail ou WhatsApp de Acesso</label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Ex: joseph3dinfo@gmail.com ou (81) 99133-7935"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setError('');
                  }}
                  className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 text-slate-900 font-medium placeholder-slate-400 rounded-2xl focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#3159C1]/20 focus:border-[#3159C1] transition-all text-sm"
                />
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">Selecione seu Perfil</label>
              <div className="relative">
                <select
                  value={selectedUserId}
                  onChange={(e) => {
                    setSelectedUserId(e.target.value);
                    setError('');
                  }}
                  className="w-full pl-5 pr-10 py-4 bg-slate-50 border border-slate-200 text-slate-900 font-medium rounded-2xl focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#3159C1]/20 focus:border-[#3159C1] transition-all appearance-none cursor-pointer text-sm"
                >
                  <option value="" disabled className="bg-white text-slate-400">Escolha um perfil...</option>
                  {users.map((u) => (
                    <option key={u.id} value={u.id} className="bg-white text-slate-800 py-2">
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
          )}

          {/* Avatar Preview */}
          {currentUser && (
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="flex items-center gap-4 bg-slate-50 border border-slate-100 p-4 rounded-2xl animate-fade-in"
            >
              <img
                src={currentUser.avatar}
                alt={currentUser.name}
                className="w-12 h-12 rounded-full object-cover border border-[#3159C1]/30"
              />
              <div>
                <h4 className="text-slate-800 font-bold text-sm">{currentUser.name}</h4>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded ${
                    currentUser.role === 'admin' ? 'bg-red-500/10 text-red-500 border border-red-500/20' : 
                    currentUser.role === 'manager' ? 'bg-purple-500/10 text-purple-500 border border-purple-500/20' : 
                    'bg-[#3159C1]/10 text-[#3159C1] border border-[#3159C1]/20'
                  }`}>
                    {currentUser.role === 'admin' ? 'Direção' : currentUser.role === 'manager' ? 'Gerente' : 'Corretor'}
                  </span>
                  {currentUser.role === 'broker' && (
                    <span className={`text-[9px] font-black px-1.5 py-0.5 rounded ${
                      currentUser.status === 'online' ? 'bg-green-500/20 text-green-600' : 'bg-slate-500/20 text-slate-500'
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
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">Senha de Acesso</label>
            <div className="relative">
              <input
                type="password"
                placeholder={currentUser?.role === 'admin' ? "admin" : "123"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 text-slate-900 font-medium placeholder-slate-400 rounded-2xl focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#3159C1]/20 focus:border-[#3159C1] transition-all"
              />
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-red-50 border border-red-100 text-red-600 p-4 rounded-2xl text-xs font-semibold text-center"
            >
              {error}
            </motion.div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-4 bg-[#3159C1] hover:bg-[#234294] text-white font-bold rounded-2xl shadow-lg hover:shadow-xl active:scale-95 transition-all text-lg flex items-center justify-center gap-2 mt-4 disabled:opacity-50"
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

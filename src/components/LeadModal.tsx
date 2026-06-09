'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle, Phone, User, Mail, MessageSquare, AlertCircle } from 'lucide-react';
import { registerLeadFromSite, getUsers, UserCRM } from '../utils/leadsStore';

interface LeadModalProps {
  isOpen: boolean;
  onClose: () => void;
  propertyName: string;
  propertyBg: string;
}

export default function LeadModal({ isOpen, onClose, propertyName, propertyBg }: LeadModalProps) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isDuplicate, setIsDuplicate] = useState(false);
  const [assignedBroker, setAssignedBroker] = useState<UserCRM | null>(null);

  React.useEffect(() => {
    if (isOpen) {
      const sync = async () => {
        const { syncWithSupabase } = await import('../utils/leadsStore');
        await syncWithSupabase();
      };
      sync();
    }
  }, [isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !phone) return;

    // Register lead using advanced routing
    const { lead, isDuplicate: duplicate } = registerLeadFromSite({
      name,
      phone,
      email,
      propertyName,
      propertyBg,
    });

    // Find the broker assigned to this lead
    const brokers = getUsers();
    const broker = brokers.find(b => b.id === lead.assignedBrokerId) || null;
    
    setAssignedBroker(broker);
    setIsDuplicate(duplicate);
    setIsSubmitted(true);
  };

  const handleClose = () => {
    setIsSubmitted(false);
    setIsDuplicate(false);
    setName('');
    setPhone('');
    setEmail('');
    setAssignedBroker(null);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />

          {/* Modal Content */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 350 }}
            className="bg-white rounded-[32px] w-full max-w-[500px] overflow-hidden shadow-2xl relative z-10 border border-gray-100"
          >
            {/* Header Color Accent */}
            <div className={`h-4 w-full ${propertyBg}`} />

            {/* Close Button */}
            <button
              onClick={handleClose}
              className="absolute top-6 right-6 p-2 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all"
            >
              <X size={20} />
            </button>

            {!isSubmitted ? (
              <div className="p-8">
                <span className="text-xs font-black tracking-widest text-[#00A3FF] uppercase block mb-2">Quero mais informações</span>
                <h3 className="text-3xl font-black text-gray-900 leading-tight mb-2">
                  {propertyName}
                </h3>
                <p className="text-gray-500 font-medium mb-6">
                  Preencha os dados abaixo e receba a simulação de financiamento completa no seu WhatsApp em minutos!
                </p>

                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Name Input */}
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                    <input
                      type="text"
                      required
                      placeholder="Nome completo"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full pl-12 pr-4 py-4 rounded-2xl bg-gray-50 border border-gray-100 text-gray-800 placeholder-gray-400 font-medium focus:outline-none focus:ring-2 focus:ring-[#00A3FF] focus:bg-white transition-all"
                    />
                  </div>

                  {/* Phone Input */}
                  <div className="relative">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                    <input
                      type="tel"
                      required
                      placeholder="WhatsApp (ex: 81 99999-9999)"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full pl-12 pr-4 py-4 rounded-2xl bg-gray-50 border border-gray-100 text-gray-800 placeholder-gray-400 font-medium focus:outline-none focus:ring-2 focus:ring-[#00A3FF] focus:bg-white transition-all"
                    />
                  </div>

                  {/* Email Input */}
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                    <input
                      type="email"
                      placeholder="E-mail (opcional)"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-12 pr-4 py-4 rounded-2xl bg-gray-50 border border-gray-100 text-gray-800 placeholder-gray-400 font-medium focus:outline-none focus:ring-2 focus:ring-[#00A3FF] focus:bg-white transition-all"
                    />
                  </div>

                  <button
                    type="submit"
                    className={`w-full py-4 text-white font-bold rounded-2xl shadow-lg hover:shadow-xl transition-all text-lg flex items-center justify-center gap-2 ${propertyBg} hover:opacity-90 active:scale-95`}
                  >
                    <MessageSquare size={20} /> Falar com Especialista
                  </button>
                </form>
              </div>
            ) : (
              /* Success Screen */
              <div className="p-8 text-center flex flex-col items-center">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', delay: 0.1 }}
                  className={`w-20 h-20 rounded-full flex items-center justify-center mb-6 ${
                    isDuplicate ? 'bg-amber-50 text-amber-500' : 'bg-green-50 text-green-500'
                  }`}
                >
                  {isDuplicate ? (
                    <AlertCircle size={48} className="fill-amber-100" />
                  ) : (
                    <CheckCircle size={48} className="fill-green-100" />
                  )}
                </motion.div>

                <h3 className="text-3xl font-black text-gray-900 mb-3 leading-tight">
                  {isDuplicate ? 'Atendimento Mantido!' : 'Solicitação Recebida!'}
                </h3>
                <p className="text-gray-500 font-medium mb-6 max-w-[340px]">
                  {isDuplicate 
                    ? 'Identificamos que você já iniciou contato. Seu corretor original foi notificado e dará continuidade ao seu atendimento em instantes!' 
                    : 'Ficha enviada com sucesso. Nosso consultor já foi notificado e entrará em contato em instantes!'}
                </p>

                {assignedBroker && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="bg-gray-50 border border-gray-100 rounded-3xl p-5 w-full flex items-center gap-4 mb-6 text-left"
                  >
                    <img
                      src={assignedBroker.avatar}
                      alt={assignedBroker.name}
                      className="w-14 h-14 rounded-full object-cover border-2 border-[#00A3FF]"
                    />
                    <div>
                      <span className="text-xs font-black text-[#00A3FF] uppercase tracking-wider block">Corretor Responsável</span>
                      <span className="font-bold text-gray-900 text-lg block">{assignedBroker.name}</span>
                      <span className="text-xs font-medium text-gray-400 block">{assignedBroker.role}</span>
                    </div>
                  </motion.div>
                )}

                <button
                  onClick={handleClose}
                  className="w-full py-4 bg-gray-900 hover:bg-gray-800 text-white font-bold rounded-2xl shadow-lg transition-all text-lg active:scale-95"
                >
                  Fechar
                </button>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

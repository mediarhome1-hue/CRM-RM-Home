'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LogOut, LayoutDashboard, Users, MessageSquare, BarChart3, 
  Plus, Calendar, Mail, Phone, ChevronRight, FileText, 
  Sparkles, CheckCircle2, QrCode, ToggleLeft, ToggleRight,
  TrendingUp, Award, Clock, ArrowRight, ShieldCheck, Search, Trash2,
  Shield, UserCheck, AlertTriangle, RefreshCw, Layers, Edit, Check
} from 'lucide-react';
import { 
  getUsers, createUser, updateUser, deleteUser, toggleUserStatus,
  getLeads, saveLeads, addLeadManual, 
  updateLeadStatus, addLeadNote, deleteLead,
  runTransbordoCheck,
  UserCRM, Lead, UserRole
} from '../../utils/leadsStore';

const STATUS_COLUMNS = [
  { id: 'new', title: 'Novos Leads', color: 'border-blue-500 bg-blue-50/30 text-blue-700' },
  { id: 'contact', title: 'Primeiro Contato', color: 'border-yellow-500 bg-yellow-50/30 text-yellow-700' },
  { id: 'visit', title: 'Visita Agendada', color: 'border-purple-500 bg-purple-50/30 text-purple-700' },
  { id: 'proposal', title: 'Proposta', color: 'border-orange-500 bg-orange-50/30 text-orange-700' },
  { id: 'closed', title: 'Contrato Fechado 🎉', color: 'border-green-500 bg-green-50/30 text-green-700' },
  { id: 'lost', title: 'Perdidos', color: 'border-red-500 bg-red-50/30 text-red-700' }
] as const;

export default function Dashboard() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<UserCRM | null>(null);
  const [users, setUsers] = useState<UserCRM[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  
  // Navigation
  const [activeTab, setActiveTab] = useState<'kanban' | 'list' | 'whatsapp' | 'analytics' | 'users' | 'flow'>('kanban');
  
  // Lead Details Modal State
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [newNote, setNewNote] = useState('');
  
  // Add Lead Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addName, setAddName] = useState('');
  const [addPhone, setAddPhone] = useState('');
  const [addEmail, setAddEmail] = useState('');
  const [addPropName, setAddPropName] = useState('Valle Encantado');
  const [addBrokerId, setAddBrokerId] = useState('');

  // User Management Form State
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPhone, setNewUserPhone] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('123');
  const [newUserRole, setNewUserRole] = useState<UserRole>('broker');
  const [newUserManagerId, setNewUserManagerId] = useState('');

  // Search Filter
  const [searchTerm, setSearchTerm] = useState('');

  // WhatsApp Integration State
  const [brokerPhone, setBrokerPhone] = useState('');
  const [isWhatsAppActive, setIsWhatsAppActive] = useState(false);
  const [showNotificationSim, setShowNotificationSim] = useState(false);
  const [simLead, setSimLead] = useState<{name: string, phone: string, prop: string} | null>(null);

  // Transbordo (Redistribution) Results
  const [transbordoResults, setTransbordoResults] = useState<{ count: number, details: string[] } | null>(null);

  useEffect(() => {
    // Proteger rota
    const userId = localStorage.getItem('lider_active_broker_id');
    if (!userId) {
      router.push('/login');
      return;
    }

    const currentUsers = getUsers();
    setUsers(currentUsers);
    
    const user = currentUsers.find(u => u.id === userId);
    if (!user) {
      localStorage.removeItem('lider_active_broker_id');
      router.push('/login');
      return;
    }

    setCurrentUser(user);
    setBrokerPhone(user.phone);
    setIsWhatsAppActive(user.isWhatsAppConnected);
    setLeads(getLeads());

    // Sincronizar com o banco de dados na nuvem (Supabase) se estiver configurado
    const syncCloudData = async () => {
      const { syncWithSupabase } = await import('../../utils/leadsStore');
      const success = await syncWithSupabase();
      if (success) {
        const freshUsers = getUsers();
        const freshLeads = getLeads();
        setUsers(freshUsers);
        setLeads(freshLeads);

        const updatedUser = freshUsers.find(u => u.id === userId);
        if (updatedUser) {
          setCurrentUser(updatedUser);
          setBrokerPhone(updatedUser.phone);
          setIsWhatsAppActive(updatedUser.isWhatsAppConnected);
        }
      }
    };
    syncCloudData();
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('lider_active_broker_id');
    router.push('/login');
  };

  const handleStatusToggle = () => {
    if (!currentUser) return;
    const updated = toggleUserStatus(currentUser.id);
    if (updated) {
      setCurrentUser(updated);
      setUsers(getUsers());
    }
  };

  const handleLeadStatusChange = (leadId: string, status: Lead['status']) => {
    const updated = updateLeadStatus(leadId, status);
    setLeads(updated);
    if (selectedLead && selectedLead.id === leadId) {
      setSelectedLead({ ...selectedLead, status });
    }
  };

  const handleAddNoteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote || !selectedLead) return;

    const updated = addLeadNote(selectedLead.id, newNote);
    setLeads(updated);
    setSelectedLead(updated.find(l => l.id === selectedLead.id) || null);
    setNewNote('');
  };

  const handleDeleteLead = (leadId: string) => {
    if (!confirm('Deseja realmente excluir este lead permanentemente?')) return;
    const updated = deleteLead(leadId);
    setLeads(updated);
    setSelectedLead(null);
  };

  const handleAddLeadSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!addName || !addPhone || !currentUser) return;

    const propertyBg = addPropName === 'Valle Encantado' ? 'bg-[#317073]' : addPropName === 'Bela Vista' ? 'bg-[#1b7a5e]' : 'bg-[#4ab9f8]';
    
    // Escolhe corretor atribuído (se for corretor logado, atribui a ele. Se for admin, usa o selecionado ou fallback)
    const assignedId = currentUser.role === 'broker' 
      ? currentUser.id 
      : (addBrokerId || currentUser.id);

    addLeadManual({
      name: addName,
      phone: addPhone,
      email: addEmail,
      propertyName: addPropName,
      propertyBg,
      assignedBrokerId: assignedId
    });

    setLeads(getLeads());
    setIsAddModalOpen(false);
    setAddName('');
    setAddPhone('');
    setAddEmail('');
  };

  // --- GESTÃO DE USUÁRIOS (DIREÇÃO) ---
  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserName || !newUserEmail || !newUserPhone) return;

    createUser({
      name: newUserName,
      email: newUserEmail,
      phone: newUserPhone,
      password: newUserPassword,
      role: newUserRole,
      avatar: newUserRole === 'manager' 
        ? 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150' 
        : 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150',
      managerId: newUserRole === 'broker' && newUserManagerId ? newUserManagerId : undefined
    });

    setUsers(getUsers());
    setNewUserName('');
    setNewUserEmail('');
    setNewUserPhone('');
    setNewUserPassword('123');
    setNewUserManagerId('');
    alert('Usuário cadastrado com sucesso!');
  };

  const handleDeleteUser = (userId: string) => {
    if (userId === currentUser?.id) {
      alert('Você não pode excluir a sua própria conta!');
      return;
    }
    if (!confirm('Excluir este usuário do CRM? Os leads dele continuarão salvos.')) return;
    const updated = deleteUser(userId);
    setUsers(getUsers());
  };

  // --- SIMULAÇÃO DE TRANSBORDO (30 MINUTOS) ---
  const handleTriggerTransbordo = () => {
    const { updatedLeadsCount, details } = runTransbordoCheck(30); // Executa com limite padrão de 30min
    setLeads(getLeads());
    setTransbordoResults({ count: updatedLeadsCount, details });
  };

  const handleWhatsAppSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    const updated = updateUser(currentUser.id, { phone: brokerPhone, isWhatsAppConnected: isWhatsAppActive });
    const user = updated.find(u => u.id === currentUser.id);
    if (user) {
      setCurrentUser(user);
    }
    alert('Configurações salvas!');
  };

  const triggerTestLeadSim = () => {
    setSimLead({
      name: 'Juliana Pires Rezende',
      phone: '(81) 98833-2211',
      prop: 'Valle Encantado'
    });
    setShowNotificationSim(true);
  };

  if (!currentUser) return null;

  // --- FILTRO DE LEADS CONFORME HIERARQUIA ---
  // Corretores: Apenas os seus próprios leads.
  // Gerentes: Leads atribuídos a si mesmo ou a corretores de sua equipe.
  // Direção (Admin): Todos os leads do CRM.
  const getLeadsByRole = (): Lead[] => {
    if (currentUser.role === 'admin') return leads;
    if (currentUser.role === 'manager') {
      const myTeamBrokerIds = users.filter(u => u.managerId === currentUser.id).map(u => u.id);
      return leads.filter(l => l.assignedBrokerId === currentUser.id || myTeamBrokerIds.includes(l.assignedBrokerId));
    }
    return leads.filter(l => l.assignedBrokerId === currentUser.id);
  };

  const visibleLeads = getLeadsByRole();
  
  const filteredLeads = visibleLeads.filter(l => 
    l.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    l.propertyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    l.phone.includes(searchTerm)
  );

  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col md:flex-row relative">
      
      {/* Sidebar */}
      <aside className="w-full md:w-[280px] bg-slate-800 border-r border-slate-700/50 flex flex-col flex-shrink-0">
        <div className="p-6 border-b border-slate-700/50 flex items-center justify-between">
          <div className="relative w-[120px] h-[40px]">
            <Image src="/Logotipo Lider Branco.svg" alt="Líder Imobiliária" fill className="object-contain object-left" />
          </div>
          <span className="text-[10px] font-black bg-blue-500/10 border border-blue-500/20 px-2 py-1 rounded text-[#00A3FF]">CRM GESTÃO</span>
        </div>

        {/* Profile Card */}
        <div className="p-6 border-b border-slate-700/50 flex items-center gap-4">
          <img src={currentUser.avatar} alt={currentUser.name} className="w-12 h-12 rounded-full object-cover border border-[#00A3FF]" />
          <div className="overflow-hidden">
            <h4 className="font-bold text-sm truncate">{currentUser.name}</h4>
            <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded tracking-wide ${
              currentUser.role === 'admin' ? 'bg-red-500/20 text-red-400' :
              currentUser.role === 'manager' ? 'bg-purple-500/20 text-purple-400' :
              'bg-blue-500/20 text-[#00A3FF]'
            }`}>
              {currentUser.role === 'admin' ? 'DIRETORIA' : currentUser.role === 'manager' ? 'GERENTE' : 'CORRETOR'}
            </span>
          </div>
        </div>

        {/* Dynamic Sidebar Links */}
        <nav className="p-4 space-y-1 flex-1">
          <button 
            onClick={() => setActiveTab('kanban')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-all ${activeTab === 'kanban' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'text-slate-400 hover:bg-slate-700/30 hover:text-white'}`}
          >
            <LayoutDashboard size={18} /> {currentUser.role === 'admin' ? 'Quadro Geral' : 'Quadro Kanban'}
          </button>
          
          <button 
            onClick={() => setActiveTab('list')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-all ${activeTab === 'list' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'text-slate-400 hover:bg-slate-700/30 hover:text-white'}`}
          >
            <Users size={18} /> {currentUser.role === 'admin' ? 'Banco de Leads' : 'Todos os Leads'}
          </button>

          {/* Broker Specific Tabs */}
          {currentUser.role === 'broker' && (
            <>
              <button 
                onClick={() => setActiveTab('whatsapp')}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-xl font-bold text-sm transition-all ${activeTab === 'whatsapp' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'text-slate-400 hover:bg-slate-700/30 hover:text-white'}`}
              >
                <div className="flex items-center gap-3">
                  <MessageSquare size={18} /> WhatsApp Integration
                </div>
                {isWhatsAppActive ? (
                  <span className="w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse" />
                ) : (
                  <span className="w-2.5 h-2.5 bg-slate-600 rounded-full" />
                )}
              </button>
              <button 
                onClick={() => setActiveTab('analytics')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-all ${activeTab === 'analytics' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'text-slate-400 hover:bg-slate-700/30 hover:text-white'}`}
              >
                <BarChart3 size={18} /> Relatórios
              </button>
            </>
          )}

          {/* Admin Tabs */}
          {currentUser.role === 'admin' && (
            <>
              <button 
                onClick={() => setActiveTab('users')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-all ${activeTab === 'users' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'text-slate-400 hover:bg-slate-700/30 hover:text-white'}`}
              >
                <UserCheck size={18} /> Gestão de Usuários
              </button>
              <button 
                onClick={() => setActiveTab('flow')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-all ${activeTab === 'flow' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'text-slate-400 hover:bg-slate-700/30 hover:text-white'}`}
              >
                <Layers size={18} /> Regras do CRM & API
              </button>
            </>
          )}
        </nav>

        {/* Footer actions */}
        <div className="p-4 border-t border-slate-700/50 space-y-2">
          <a
            href="/"
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-700/30 hover:text-white text-xs font-bold transition-all"
          >
            Acessar Site Líder
          </a>
          <button 
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white text-xs font-bold transition-all"
          >
            <LogOut size={14} /> Sair da Conta
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-h-0 bg-slate-900 overflow-hidden">
        
        {/* Header */}
        <header className="h-[76px] bg-slate-800/40 border-b border-slate-700/30 px-6 flex items-center justify-between flex-shrink-0">
          <div>
            <h1 className="text-xl font-black">
              {activeTab === 'kanban' && '🎯 Quadro de Leads'}
              {activeTab === 'list' && '👥 Painel do Funil'}
              {activeTab === 'whatsapp' && '📱 Integração com WhatsApp'}
              {activeTab === 'analytics' && '📊 Estatísticas'}
              {activeTab === 'users' && '⚙️ Painel Administrativo de Usuários'}
              {activeTab === 'flow' && '🔀 Central de Distribuição & API'}
            </h1>
            <p className="text-xs text-slate-400 font-medium">
              Logado como: <span className="text-[#00A3FF] font-bold">{currentUser.name}</span>
            </p>
          </div>

          <div className="flex items-center gap-4">
            {/* Corretor Online / Offline Toggle Switch */}
            {currentUser.role === 'broker' && (
              <div className="flex items-center gap-3 bg-slate-850 px-4 py-2 rounded-2xl border border-slate-700/50">
                <span className="text-xs font-bold">STATUS DE LEADS:</span>
                <button
                  onClick={handleStatusToggle}
                  className="flex items-center gap-2 focus:outline-none"
                >
                  <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded ${
                    currentUser.status === 'online' ? 'bg-green-500/20 text-green-400' : 'bg-slate-500/20 text-slate-400'
                  }`}>
                    {currentUser.status === 'online' ? '🟢 ONLINE' : '🔴 OFFLINE'}
                  </span>
                </button>
              </div>
            )}

            {/* Quick manual lead trigger */}
            {(activeTab === 'kanban' || activeTab === 'list') && (
              <button 
                onClick={() => setIsAddModalOpen(true)}
                className="flex items-center gap-2 bg-[#00A3FF] hover:bg-[#008acf] text-white px-4 py-2.5 rounded-xl text-xs font-bold transition-all active:scale-95 shadow-lg shadow-blue-500/20"
              >
                <Plus size={16} /> Novo Lead Manual
              </button>
            )}
          </div>
        </header>

        {/* Tab views */}
        <div className="flex-1 overflow-auto p-6">
          
          {/* 1. KANBAN TAB */}
          {activeTab === 'kanban' && (
            <div className="flex gap-4 pb-4 items-start min-w-[1200px] h-full">
              {STATUS_COLUMNS.map(col => {
                const colLeads = visibleLeads.filter(l => l.status === col.id);
                return (
                  <div key={col.id} className="w-[280px] bg-slate-800/40 rounded-2xl p-4 flex flex-col flex-shrink-0 border border-slate-700/30 max-h-[calc(100vh-180px)] overflow-hidden">
                    <div className={`border-l-4 pl-3 py-1 mb-4 flex items-center justify-between ${col.color.split(' ')[0]}`}>
                      <h3 className="font-bold text-sm text-slate-100">{col.title}</h3>
                      <span className="text-xs bg-slate-700/50 text-slate-300 font-black px-2 py-0.5 rounded-lg">{colLeads.length}</span>
                    </div>

                    <div className="space-y-3 overflow-y-auto pr-1 flex-1">
                      {colLeads.map(lead => {
                        const assignedUser = users.find(u => u.id === lead.assignedBrokerId);
                        return (
                          <motion.div
                            key={lead.id}
                            layoutId={lead.id}
                            onClick={() => setSelectedLead(lead)}
                            className="bg-slate-800 hover:bg-slate-750 border border-slate-700/50 hover:border-[#00A3FF]/50 p-4 rounded-xl shadow-md cursor-pointer transition-all relative group"
                          >
                            <div className="flex justify-between items-start gap-2 mb-2">
                              <span className={`text-[9px] text-white px-2 py-0.5 rounded font-black uppercase tracking-wider ${lead.propertyBg}`}>
                                {lead.propertyName}
                              </span>
                              <span className="text-[9px] text-slate-400 font-medium">
                                {new Date(lead.createdAt).toLocaleDateString('pt-BR', {day: 'numeric', month: 'short'})}
                              </span>
                            </div>
                            
                            <h4 className="font-bold text-sm text-slate-200 group-hover:text-white transition-colors mb-2 line-clamp-1">{lead.name}</h4>
                            
                            <div className="space-y-1 text-xs text-slate-400 font-medium mb-3">
                              <div className="flex items-center gap-1.5"><Phone size={12} className="text-[#00A3FF]" /> {lead.phone}</div>
                              {currentUser.role !== 'broker' && assignedUser && (
                                <div className="text-[10px] text-slate-300 font-bold bg-slate-700/50 px-2 py-0.5 rounded self-start mt-2 block w-fit">
                                  Corretor: {assignedUser.name}
                                </div>
                              )}
                            </div>

                            <div className="pt-2 border-t border-slate-700/50 flex justify-between items-center text-[10px] text-[#00A3FF] font-black tracking-wider">
                              <span>VER DETALHES</span>
                              <ChevronRight size={12} />
                            </div>
                          </motion.div>
                        );
                      })}

                      {colLeads.length === 0 && (
                        <div className="text-center py-8 text-slate-500 text-xs border border-dashed border-slate-700/50 rounded-xl">
                          Sem leads
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* 2. LIST VIEW TAB */}
          {activeTab === 'list' && (
            <div className="bg-slate-800 rounded-2xl border border-slate-700/50 overflow-hidden">
              <div className="p-5 border-b border-slate-700/50 flex flex-col sm:flex-row gap-4 items-center justify-between">
                <div className="relative w-full sm:w-80">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input
                    type="text"
                    placeholder="Pesquisar leads..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-700/40 border border-slate-600/50 text-white placeholder-slate-400 font-medium focus:outline-none focus:ring-2 focus:ring-[#00A3FF]"
                  />
                </div>
                <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">{filteredLeads.length} leads no total</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-700/50 text-xs font-black text-slate-400 uppercase tracking-widest bg-slate-800/80">
                      <th className="py-4 px-6">Nome do Lead</th>
                      <th className="py-4 px-6">Contato</th>
                      <th className="py-4 px-6">Imóvel</th>
                      <th className="py-4 px-6">Responsável</th>
                      <th className="py-4 px-6">Status</th>
                      <th className="py-4 px-6">Gerado em</th>
                      <th className="py-4 px-6 text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-700/30">
                    {filteredLeads.map(lead => {
                      const assignedUser = users.find(u => u.id === lead.assignedBrokerId);
                      return (
                        <tr key={lead.id} className="hover:bg-slate-750/30 text-sm font-medium text-slate-200 transition-colors">
                          <td className="py-4 px-6">
                            <h4 className="font-bold text-slate-100">{lead.name}</h4>
                            <span className="text-xs text-slate-400">{lead.email || 'Sem e-mail'}</span>
                          </td>
                          <td className="py-4 px-6">
                            <span className="flex items-center gap-1"><Phone size={12} className="text-[#00A3FF]" /> {lead.phone}</span>
                          </td>
                          <td className="py-4 px-6">
                            <span className={`text-[10px] text-white px-2 py-0.5 rounded font-black uppercase tracking-wider ${lead.propertyBg}`}>
                              {lead.propertyName}
                            </span>
                          </td>
                          <td className="py-4 px-6 text-xs font-bold text-slate-300">
                            {assignedUser ? assignedUser.name : 'Não Atribuído'}
                          </td>
                          <td className="py-4 px-6">
                            <span className={`text-xs px-2.5 py-1 rounded-full font-bold ${
                              STATUS_COLUMNS.find(c => c.id === lead.status)?.color || ''
                            }`}>
                              {STATUS_COLUMNS.find(c => c.id === lead.status)?.title || ''}
                            </span>
                          </td>
                          <td className="py-4 px-6 text-xs text-slate-400">
                            {new Date(lead.createdAt).toLocaleDateString('pt-BR', {day: '2-digit', month: '2-digit', hour: '2-digit', minute:'2-digit'})}
                          </td>
                          <td className="py-4 px-6 text-right">
                            <button 
                              onClick={() => setSelectedLead(lead)}
                              className="bg-slate-700 hover:bg-slate-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-all"
                            >
                              Ver Detalhes
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 3. USERS MANAGEMENT TAB (DIREÇÃO ONLY) */}
          {activeTab === 'users' && currentUser.role === 'admin' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Form to create User */}
              <div className="bg-slate-800 rounded-3xl p-6 border border-slate-700/50 flex flex-col space-y-6">
                <div>
                  <span className="text-xs font-black tracking-widest text-[#00A3FF] uppercase block mb-1">Painel ADM</span>
                  <h3 className="text-xl font-black">Criar Novo Usuário</h3>
                  <p className="text-slate-400 text-xs mt-1">Cadastre corretores e gerentes no CRM com atribuição de equipes.</p>
                </div>

                <form onSubmit={handleCreateUser} className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-350 block">Nome Completo</label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: Pedro Henrique"
                      value={newUserName}
                      onChange={(e) => setNewUserName(e.target.value)}
                      className="w-full px-4 py-3 bg-slate-900 border border-slate-700/50 rounded-xl text-sm focus:ring-1 focus:ring-[#00A3FF] focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-355 block">E-mail Corporativo</label>
                    <input
                      type="email"
                      required
                      placeholder="Ex: pedro@liderimobiliaria.com.br"
                      value={newUserEmail}
                      onChange={(e) => setNewUserEmail(e.target.value)}
                      className="w-full px-4 py-3 bg-slate-900 border border-slate-700/50 rounded-xl text-sm focus:ring-1 focus:ring-[#00A3FF] focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-355 block">WhatsApp</label>
                    <input
                      type="tel"
                      required
                      placeholder="Ex: (81) 99999-9999"
                      value={newUserPhone}
                      onChange={(e) => setNewUserPhone(e.target.value)}
                      className="w-full px-4 py-3 bg-slate-900 border border-slate-700/50 rounded-xl text-sm focus:ring-1 focus:ring-[#00A3FF] focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-355 block">Senha Inicial</label>
                    <input
                      type="password"
                      placeholder="Ex: 123"
                      value={newUserPassword}
                      onChange={(e) => setNewUserPassword(e.target.value)}
                      className="w-full px-4 py-3 bg-slate-900 border border-slate-700/50 rounded-xl text-sm focus:ring-1 focus:ring-[#00A3FF] focus:outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-355 block">Cargo</label>
                      <select
                        value={newUserRole}
                        onChange={(e) => setNewUserRole(e.target.value as UserRole)}
                        className="w-full px-3 py-3 bg-slate-900 border border-slate-700/50 rounded-xl text-sm focus:outline-none cursor-pointer"
                      >
                        <option value="broker">Corretor</option>
                        <option value="manager">Gerente</option>
                        <option value="admin">Direção</option>
                      </select>
                    </div>

                    {newUserRole === 'broker' && (
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-355 block">Vincular Gerente</label>
                        <select
                          value={newUserManagerId}
                          onChange={(e) => setNewUserManagerId(e.target.value)}
                          className="w-full px-3 py-3 bg-slate-900 border border-slate-700/50 rounded-xl text-sm focus:outline-none cursor-pointer"
                        >
                          <option value="">Nenhum gerente</option>
                          {users.filter(u => u.role === 'manager').map(m => (
                            <option key={m.id} value={m.id}>{m.name}</option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-sm transition-all active:scale-95 shadow-lg"
                  >
                    Salvar Usuário
                  </button>
                </form>
              </div>

              {/* Users List (Admin View) */}
              <div className="bg-slate-800 rounded-3xl p-6 border border-slate-700/50 lg:col-span-2 flex flex-col">
                <h3 className="text-xl font-black mb-4">Membros Cadastrados ({users.length})</h3>

                <div className="space-y-3 overflow-y-auto max-h-[500px]">
                  {users.map(u => {
                    const manager = users.find(m => m.id === u.managerId);
                    return (
                      <div key={u.id} className="bg-slate-900/40 p-4 border border-slate-700/30 rounded-2xl flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <img src={u.avatar} alt={u.name} className="w-10 h-10 rounded-full object-cover border border-[#00A3FF]" />
                          <div>
                            <h4 className="font-bold text-sm text-slate-200">{u.name}</h4>
                            <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-400">
                              <span className={`text-[9px] font-black px-1.5 py-0.5 rounded ${
                                u.role === 'admin' ? 'bg-red-500/20 text-red-400' :
                                u.role === 'manager' ? 'bg-purple-500/20 text-purple-400' :
                                'bg-blue-500/20 text-[#00A3FF]'
                              }`}>
                                {u.role === 'admin' ? 'Direção' : u.role === 'manager' ? 'Gerente' : 'Corretor'}
                              </span>
                              <span>• {u.email}</span>
                              {u.role === 'broker' && manager && (
                                <span className="bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded text-[9px] font-bold">Equipe: {manager.name}</span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          {u.role === 'broker' && (
                            <span className={`text-[10px] font-black px-2 py-1 rounded-full ${
                              u.status === 'online' ? 'bg-green-500/20 text-green-400' : 'bg-slate-650 text-slate-400'
                            }`}>
                              {u.status === 'online' ? '🟢 ONLINE' : '🔴 OFFLINE'}
                            </span>
                          )}

                          <button
                            onClick={() => handleDeleteUser(u.id)}
                            className="p-2 bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white rounded-xl transition-all"
                            title="Remover Usuário"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* 4. RULES & DISTRIBUTION TAB (DIREÇÃO ONLY) */}
          {activeTab === 'flow' && currentUser.role === 'admin' && (
            <div className="space-y-8">
              {/* Distribution Controls */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                
                {/* Flow and Rules Card */}
                <div className="bg-slate-800 rounded-3xl p-8 border border-slate-700/50 flex flex-col space-y-6">
                  <div>
                    <span className="text-xs font-black tracking-widest text-[#00A3FF] uppercase block mb-1">Regras de Negócio</span>
                    <h3 className="text-2xl font-black">Central de Fluxo de Leads</h3>
                    <p className="text-slate-400 text-sm mt-1">Configure o comportamento automático de recebimento de leads da landing page.</p>
                  </div>

                  <div className="space-y-4">
                    <div className="bg-slate-900/40 p-4 border border-slate-700/40 rounded-2xl flex gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-400 mt-0.5 flex-shrink-0">
                        <Check size={16} />
                      </div>
                      <div>
                        <h4 className="font-bold text-xs">Distribuição Sequencial Ativa (ONLINE ONLY)</h4>
                        <p className="text-slate-400 text-[11px] mt-0.5">O formulário de "Saiba mais" direciona leads um por um (Round-Robin), porém ignorando corretores marcados como Offline. Evita lead ocioso.</p>
                      </div>
                    </div>

                    <div className="bg-slate-900/40 p-4 border border-slate-700/40 rounded-2xl flex gap-3">
                      <div className="w-8 h-8 rounded-full bg-yellow-500/10 flex items-center justify-center text-yellow-400 mt-0.5 flex-shrink-0">
                        <Check size={16} />
                      </div>
                      <div>
                        <h4 className="font-bold text-xs">Bloqueio contra Duplicidade com Re-Atribuição</h4>
                        <p className="text-slate-400 text-[11px] mt-0.5">Se um cliente já cadastrado enviar os dados novamente, o sistema reconhece a duplicidade e encaminha de volta para o mesmo corretor original que já o atendia, evitando conflitos na equipe.</p>
                      </div>
                    </div>

                    <div className="bg-slate-900/40 p-4 border border-slate-700/40 rounded-2xl flex gap-3">
                      <div className="w-8 h-8 rounded-full bg-red-500/10 flex items-center justify-center text-red-400 mt-0.5 flex-shrink-0">
                        <Check size={16} />
                      </div>
                      <div>
                        <h4 className="font-bold text-xs">Regra de Transbordo (Transbordo Automático em 30min)</h4>
                        <p className="text-slate-400 text-[11px] mt-0.5">Se um lead "Novo" permanecer parado na carteira de um corretor sem nenhuma observação de contato ou mudança de etapa por 30 minutos, o sistema tira dele e passa para outro corretor online da fila.</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Transbordo Simulation & Testing */}
                <div className="bg-slate-800 rounded-3xl p-8 border border-slate-700/50 flex flex-col justify-between">
                  <div>
                    <span className="text-xs font-black tracking-widest text-amber-500 uppercase block mb-1">Simulador de Regras</span>
                    <h3 className="text-xl font-black">Testar Redistribuição (30 minutos)</h3>
                    <p className="text-slate-400 text-xs mt-1">Force o sistema a rodar a varredura de transbordo agora mesmo para ver como os leads parados há 30 min seriam automaticamente repassados.</p>
                    
                    {/* Results Box */}
                    {transbordoResults ? (
                      <div className="mt-4 bg-slate-900/80 border border-slate-700/50 rounded-2xl p-5 space-y-3">
                        <div className="flex items-center gap-2 text-xs font-bold text-green-400">
                          <CheckCircle2 size={16} />
                          Varredura Executada! {transbordoResults.count} lead(s) atualizados.
                        </div>
                        {transbordoResults.details.length > 0 ? (
                          <ul className="space-y-1.5 max-h-[160px] overflow-y-auto pr-1">
                            {transbordoResults.details.map((d, i) => (
                              <li key={i} className="text-[10px] text-slate-300 bg-slate-800 p-2 rounded-lg leading-relaxed border-l-2 border-amber-500">{d}</li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-[10px] text-slate-450 italic">Todos os leads estão dentro do prazo de 30min ou foram devidamente atendidos.</p>
                        )}
                      </div>
                    ) : (
                      <div className="mt-4 p-5 bg-slate-900/20 border border-dashed border-slate-700 rounded-2xl flex flex-col items-center justify-center py-10 text-center">
                        <Clock className="text-slate-500 mb-3" size={28} />
                        <p className="text-xs text-slate-400 max-w-[280px]">Clique no botão abaixo para varrer a base de leads e simular a passagem de 30 minutos.</p>
                      </div>
                    )}
                  </div>

                  <button
                    onClick={handleTriggerTransbordo}
                    className="w-full mt-6 py-4 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-2xl text-xs uppercase tracking-wider shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2"
                  >
                    <RefreshCw size={16} /> Simular Transbordo de 30 Minutos
                  </button>
                </div>
              </div>

              {/* WhatsApp API Integration Instructions */}
              <div className="bg-slate-800 rounded-3xl p-8 border border-slate-700/50 space-y-6">
                <div>
                  <span className="text-xs font-black tracking-widest text-green-400 uppercase block mb-1">Guia Técnico</span>
                  <h3 className="text-2xl font-black">Como conectar a API real do WhatsApp?</h3>
                  <p className="text-slate-400 text-sm mt-1">Conecte o sistema a uma API do WhatsApp (ex: Evolution API ou Baileys) para disparar mensagens reais no WhatsApp dos corretores.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs">
                  <div className="bg-slate-900/40 p-5 rounded-2xl border border-slate-700/30 space-y-2">
                    <span className="font-black text-[#00A3FF] block">1. HOSPEDAR A API</span>
                    <p className="text-slate-400 leading-relaxed">
                      Utilize a **Evolution API** (software open-source baseado em Node.js/Baileys). Hospede-a em um servidor como VPS (Docker) ou serviços como Render.
                    </p>
                  </div>

                  <div className="bg-slate-900/40 p-5 rounded-2xl border border-slate-700/30 space-y-2">
                    <span className="font-black text-[#00A3FF] block">2. ATIVAR WEBHOOKS</span>
                    <p className="text-slate-400 leading-relaxed">
                      Crie um endpoint no Next.js (ex: `/api/leads`). Configure a Evolution API para enviar uma notificação HTTP POST para o endpoint sempre que um novo lead for gerado, disparando o envio da mensagem formatada ao corretor responsável.
                    </p>
                  </div>

                  <div className="bg-slate-900/40 p-5 rounded-2xl border border-slate-700/30 space-y-2">
                    <span className="font-black text-[#00A3FF] block">3. DISPARAR A MENSAGEM</span>
                    <p className="text-slate-400 leading-relaxed">
                      No endpoint do Next.js, chame a rota `/message/sendText` da API passando o token de autorização, o número do corretor e o texto com os dados do lead prontos para iniciar o contato.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 5. WHATSAPP & STATS (BROKERS ONLY) */}
          {currentUser.role === 'broker' && activeTab === 'whatsapp' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="bg-slate-800 rounded-3xl p-8 border border-slate-700/50 flex flex-col space-y-6">
                <div>
                  <span className="text-xs font-black tracking-widest text-[#00A3FF] uppercase block mb-1">Notificações Push</span>
                  <h3 className="text-2xl font-black">Conecte seu WhatsApp pessoal</h3>
                  <p className="text-slate-400 text-sm mt-1">Digite seu celular de atendimento abaixo e ative para receber alertas no WhatsApp quando novos leads caírem no seu painel.</p>
                </div>

                <form onSubmit={handleWhatsAppSave} className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-300 block">Número do WhatsApp</label>
                    <input
                      type="tel"
                      required
                      placeholder="Ex: +55 81 99999-9999"
                      value={brokerPhone}
                      onChange={(e) => setBrokerPhone(e.target.value)}
                      className="w-full px-4 py-4 rounded-xl bg-slate-900 border border-slate-700/50 text-white font-bold focus:outline-none focus:ring-1 focus:ring-[#00A3FF]"
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 bg-slate-900/40 border border-slate-700/30 rounded-xl">
                    <div>
                      <h4 className="font-bold text-xs text-slate-200">Alertas de Lead</h4>
                      <p className="text-slate-400 text-[10px]">Ativar notificação push automática.</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsWhatsAppActive(!isWhatsAppActive)}
                      className="text-slate-400 focus:outline-none"
                    >
                      {isWhatsAppActive ? (
                        <ToggleRight className="text-green-500 w-12 h-12" />
                      ) : (
                        <ToggleLeft className="text-slate-500 w-12 h-12" />
                      )}
                    </button>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3 pt-4">
                    <button
                      type="submit"
                      className="flex-1 py-4 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-2xl shadow-lg transition-all text-xs uppercase"
                    >
                      Salvar Telefone
                    </button>
                    <button
                      type="button"
                      onClick={triggerTestLeadSim}
                      disabled={!isWhatsAppActive}
                      className="px-6 py-4 border border-slate-700 hover:bg-slate-750 text-slate-350 font-bold rounded-2xl transition-all text-xs uppercase flex items-center justify-center gap-2 disabled:opacity-40"
                    >
                      <Sparkles size={14} /> Enviar Teste
                    </button>
                  </div>
                </form>
              </div>

              <div className="bg-slate-800 rounded-3xl p-8 border border-slate-700/50 flex flex-col items-center justify-center text-center">
                {!isWhatsAppActive ? (
                  <>
                    <div className="w-14 h-14 bg-slate-750 border border-slate-700/50 rounded-full flex items-center justify-center text-slate-500 mb-6">
                      <QrCode size={28} />
                    </div>
                    <h3 className="text-lg font-black mb-1">Gerar Integração API</h3>
                    <p className="text-slate-400 text-xs max-w-[280px] mb-6">Conecte o CRM ao seu WhatsApp lendo o QR code virtual.</p>
                    <button
                      onClick={() => setIsWhatsAppActive(true)}
                      className="px-5 py-2.5 bg-slate-700 hover:bg-slate-650 rounded-xl text-xs font-bold transition-all"
                    >
                      Conectar Dispositivo
                    </button>
                  </>
                ) : (
                  <>
                    <div className="bg-white p-4 rounded-3xl mb-6 shadow-xl relative group">
                      <div className="absolute inset-0 bg-slate-900/10 flex items-center justify-center opacity-0 group-hover:opacity-100 rounded-3xl">
                        <CheckCircle2 className="text-green-500 w-12 h-12 fill-white" />
                      </div>
                      <div className="w-[140px] h-[140px] bg-slate-900 flex flex-col justify-between p-2 rounded-xl">
                        <div className="flex justify-between">
                          <div className="w-8 h-8 border-4 border-white rounded" />
                          <div className="w-8 h-8 border-4 border-white rounded" />
                        </div>
                        <div className="text-[10px] text-white font-bold tracking-widest uppercase">CONECTADO</div>
                        <div className="flex justify-between items-end">
                          <div className="w-8 h-8 border-4 border-white rounded" />
                          <div className="w-8 h-8 bg-white rounded" />
                        </div>
                      </div>
                    </div>
                    <h3 className="text-lg font-black text-green-400 mb-2 flex items-center gap-1.5">
                      <CheckCircle2 size={18} /> WhatsApp Sincronizado
                    </h3>
                    <p className="text-slate-400 text-xs max-w-[300px] mb-6">
                      Sua linha `{brokerPhone}` está emparelhada com o CRM da Líder. Seus novos leads chegarão diretamente no seu WhatsApp pessoal.
                    </p>
                    <button
                      onClick={() => setIsWhatsAppActive(false)}
                      className="px-4 py-2 bg-red-500/10 hover:bg-red-500 hover:text-white text-red-400 rounded-xl text-xs font-bold transition-all"
                    >
                      Desconectar
                    </button>
                  </>
                )}
              </div>
            </div>
          )}

          {currentUser.role === 'broker' && activeTab === 'analytics' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700/50 flex items-center justify-between">
                <div>
                  <span className="text-xs text-slate-400 font-bold uppercase block">Carteira Total</span>
                  <h3 className="text-3xl font-black mt-1">{visibleLeads.length} leads</h3>
                </div>
              </div>
              <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700/50 flex items-center justify-between">
                <div>
                  <span className="text-xs text-slate-400 font-bold uppercase block">Vendas Concluídas</span>
                  <h3 className="text-3xl font-black mt-1 text-green-400">{visibleLeads.filter(l => l.status === 'closed').length}</h3>
                </div>
              </div>
              <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700/50 flex items-center justify-between">
                <div>
                  <span className="text-xs text-slate-400 font-bold uppercase block">Taxa de Conversão</span>
                  <h3 className="text-3xl font-black mt-1 text-[#00A3FF]">
                    {visibleLeads.length > 0 
                      ? `${Math.round((visibleLeads.filter(l => l.status === 'closed').length / visibleLeads.length) * 100)}%`
                      : '0%'
                    }
                  </h3>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* LEAD DETAILS DRAWER */}
      <AnimatePresence>
        {selectedLead && (
          <div className="fixed inset-0 z-50 flex items-center justify-end p-0">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedLead(null)}
              className="absolute inset-0 bg-black/60 backdrop-blur-xs"
            />

            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 26, stiffness: 220 }}
              className="w-full max-w-[500px] h-full bg-slate-800 border-l border-slate-700 flex flex-col relative z-10 shadow-2xl"
            >
              <div className="p-6 border-b border-slate-700/50 flex flex-col gap-3 relative">
                <span className={`text-[10px] text-white px-2 py-0.5 rounded font-black uppercase tracking-wider self-start ${selectedLead.propertyBg}`}>
                  {selectedLead.propertyName}
                </span>
                
                <h3 className="text-2xl font-black text-white">{selectedLead.name}</h3>
                
                <div className="flex gap-2">
                  <span className={`text-[11px] px-3 py-1 rounded-full font-bold ${
                    STATUS_COLUMNS.find(c => c.id === selectedLead.status)?.color || ''
                  }`}>
                    Etapa: {STATUS_COLUMNS.find(c => c.id === selectedLead.status)?.title || ''}
                  </span>
                </div>

                <button 
                  onClick={() => setSelectedLead(null)}
                  className="absolute top-6 right-6 text-slate-400 hover:text-white font-bold text-xs uppercase"
                >
                  FECHAR
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <a 
                    href={`https://wa.me/55${selectedLead.phone.replace(/\D/g, '')}?text=Olá ${selectedLead.name.split(' ')[0]}, aqui é o consultor da Líder Imobiliária. Vi que demonstrou interesse no ${selectedLead.propertyName}!`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 p-3.5 bg-green-600 hover:bg-green-500 rounded-xl font-bold text-xs text-white transition-all shadow-md"
                  >
                    <MessageSquare size={16} /> WhatsApp do Cliente
                  </a>
                  <a 
                    href={`tel:${selectedLead.phone}`} 
                    className="flex items-center justify-center gap-2 p-3.5 bg-slate-700 hover:bg-slate-650 rounded-xl font-bold text-xs text-white transition-all border border-slate-600/50"
                  >
                    <Phone size={16} /> Ligar
                  </a>
                </div>

                <div className="bg-slate-900/30 border border-slate-700/50 rounded-2xl p-5 space-y-3">
                  <div className="flex items-center gap-3 text-sm font-medium">
                    <Phone size={16} className="text-[#00A3FF]" />
                    <div>
                      <span className="text-[10px] text-slate-400 block font-bold">WHATSAPP</span>
                      {selectedLead.phone}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-sm font-medium border-t border-slate-800 pt-3">
                    <Mail size={16} className="text-[#00A3FF]" />
                    <div>
                      <span className="text-[10px] text-slate-400 block font-bold">E-MAIL</span>
                      {selectedLead.email || 'Não informado'}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-sm font-medium border-t border-slate-800 pt-3">
                    <Calendar size={16} className="text-[#00A3FF]" />
                    <div>
                      <span className="text-[10px] text-slate-400 block font-bold">RECEBIDO EM</span>
                      {new Date(selectedLead.createdAt).toLocaleString('pt-BR')}
                    </div>
                  </div>
                </div>

                {/* Alteração de Funil para corretores, gerentes ou admin */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Mudar Lead de Etapa</label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {STATUS_COLUMNS.map(col => (
                      <button
                        key={col.id}
                        onClick={() => handleLeadStatusChange(selectedLead.id, col.id)}
                        className={`py-2 px-3 text-[11px] font-bold rounded-lg transition-all ${
                          selectedLead.status === col.id 
                            ? 'bg-blue-600 border border-blue-500 text-white shadow-md' 
                            : 'bg-slate-750 border border-slate-700/50 hover:bg-slate-700 text-slate-300'
                        }`}
                      >
                        {col.title.replace(' 🎉', '').replace(' ❌', '')}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Observações do Lead ({selectedLead.notes.length})</label>
                  
                  <div className="space-y-3">
                    {selectedLead.notes.map((note, idx) => (
                      <div key={idx} className="bg-slate-900/40 p-4 rounded-xl border border-slate-800 text-xs font-medium text-slate-350 flex items-start gap-2.5 leading-relaxed">
                        <FileText size={14} className="text-slate-450 flex-shrink-0 mt-0.5" />
                        <div>{note}</div>
                      </div>
                    ))}
                  </div>

                  <form onSubmit={handleAddNoteSubmit} className="flex gap-2 pt-2">
                    <input
                      type="text"
                      placeholder="Registrar conversa/nota de atendimento..."
                      value={newNote}
                      onChange={(e) => setNewNote(e.target.value)}
                      className="flex-1 px-4 py-2.5 bg-slate-900 border border-slate-700/50 text-xs rounded-xl focus:outline-none focus:ring-1 focus:ring-[#00A3FF] text-white"
                    />
                    <button
                      type="submit"
                      className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-4 rounded-xl text-xs active:scale-95 transition-all"
                    >
                      Registrar
                    </button>
                  </form>
                </div>
              </div>

              <div className="p-6 border-t border-slate-700/50 flex gap-3">
                <button
                  onClick={() => handleDeleteLead(selectedLead.id)}
                  className="w-full py-3 bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5"
                >
                  <Trash2 size={14} /> EXCLUIR REGISTRO DO LEAD
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MANUAL LEAD CREATION MODAL */}
      <AnimatePresence>
        {isAddModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAddModalOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-xs"
            />

            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-slate-800 rounded-3xl p-8 max-w-[480px] w-full border border-slate-700/50 relative z-10 shadow-2xl"
            >
              <h3 className="text-xl font-black mb-1">Cadastrar Lead Manualmente</h3>
              <p className="text-slate-400 text-xs font-medium mb-6">Os dados do lead serão criados diretamente na fila do CRM.</p>

              <form onSubmit={handleAddLeadSubmit} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-300 block">Nome Completo</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Vanessa Carvalho"
                    value={addName}
                    onChange={(e) => setAddName(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-900 border border-slate-750 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-[#00A3FF]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-300 block">WhatsApp</label>
                  <input
                    type="tel"
                    required
                    placeholder="Ex: (81) 99999-9999"
                    value={addPhone}
                    onChange={(e) => setAddPhone(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-900 border border-slate-750 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-[#00A3FF]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-300 block">E-mail (Opcional)</label>
                  <input
                    type="email"
                    placeholder="Ex: vanessa@email.com"
                    value={addEmail}
                    onChange={(e) => setAddEmail(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-900 border border-slate-750 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-[#00A3FF]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-300 block">Empreendimento</label>
                    <select
                      value={addPropName}
                      onChange={(e) => setAddPropName(e.target.value)}
                      className="w-full px-3 py-3 bg-slate-900 border border-slate-750 rounded-xl text-sm focus:outline-none cursor-pointer"
                    >
                      <option value="Valle Encantado">Valle Encantado</option>
                      <option value="Bela Vista">Bela Vista</option>
                      <option value="Conquista Paulista">Conquista Paulista</option>
                    </select>
                  </div>

                  {currentUser.role !== 'broker' && (
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-300 block">Atribuir a Corretor</label>
                      <select
                        value={addBrokerId}
                        onChange={(e) => setAddBrokerId(e.target.value)}
                        className="w-full px-3 py-3 bg-slate-900 border border-slate-750 rounded-xl text-sm focus:outline-none cursor-pointer"
                      >
                        <option value="">Selecione...</option>
                        {users.filter(u => u.role === 'broker').map(b => (
                          <option key={b.id} value={b.id}>{b.name}</option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setIsAddModalOpen(false)}
                    className="flex-1 py-3 bg-slate-700 hover:bg-slate-650 text-white font-bold rounded-xl text-xs uppercase tracking-wider transition-all"
                  >
                    Voltar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs uppercase tracking-wider transition-all shadow-lg shadow-blue-500/10"
                  >
                    Confirmar
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* WHATSAPP PUSH NOTIFICATION SIMULATOR */}
      <AnimatePresence>
        {showNotificationSim && simLead && (
          <div className="fixed bottom-6 right-6 z-55 max-w-[360px] w-full px-4 sm:px-0">
            <motion.div
              initial={{ y: 80, scale: 0.8, opacity: 0 }}
              animate={{ y: 0, scale: 1, opacity: 1 }}
              exit={{ y: 50, scale: 0.8, opacity: 0 }}
              className="bg-slate-950/95 backdrop-blur-md border border-slate-700/50 rounded-3xl shadow-2xl p-5 flex flex-col space-y-4"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 bg-green-500 rounded-full animate-ping" />
                  <span className="text-[10px] font-black tracking-widest text-green-400 uppercase">Notificação de Lead</span>
                </div>
                <button 
                  onClick={() => {
                    setShowNotificationSim(false);
                    setSimLead(null);
                  }}
                  className="text-slate-400 hover:text-white text-xs font-bold"
                >
                  Fechar
                </button>
              </div>

              <div className="bg-slate-900 p-4 border border-slate-800 rounded-2xl flex gap-3.5">
                <img 
                  src="https://upload.wikimedia.org/wikipedia/commons/6/6b/WhatsApp.svg" 
                  alt="WhatsApp logo" 
                  className="w-10 h-10 object-contain flex-shrink-0" 
                />
                <div className="text-xs font-medium space-y-1 text-slate-300">
                  <div className="font-bold text-slate-100 flex items-center justify-between">
                    <span>WhatsApp API</span>
                    <span className="text-[10px] text-slate-500 font-normal">Agora mesmo</span>
                  </div>
                  <div className="font-mono text-green-300 mt-1.5 leading-relaxed bg-[#0b141a]/60 p-3 rounded-xl border border-slate-800 whitespace-pre-line text-[11px]">
                    {`🔔 *LÍDER IMOBILIÁRIA*

*Novo Lead Atribuído!*
*Nome:* ${simLead.name.split(' ')[0]}
*WhatsApp:* ${simLead.phone}
*Imóvel:* ${simLead.prop}
*Corretor:* ${currentUser.name}

Clique abaixo para conversar:`}
                    <div className="text-blue-400 hover:underline mt-2 font-bold select-none cursor-pointer">
                      wa.me/55{simLead.phone.replace(/\D/g, '')}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <a 
                  href={`https://wa.me/55${simLead.phone.replace(/\D/g, '')}?text=Olá ${simLead.name.split(' ')[0]}, vi que demonstrou interesse no ${simLead.prop} pelo site da Líder!`}
                  onClick={() => {
                    setShowNotificationSim(false);
                    setSimLead(null);
                  }}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 py-2.5 bg-green-600 hover:bg-green-500 text-white font-bold rounded-xl text-center text-xs shadow-md transition-all active:scale-95 flex items-center justify-center gap-1.5"
                >
                  <MessageSquare size={14} /> Iniciar Conversa
                </a>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

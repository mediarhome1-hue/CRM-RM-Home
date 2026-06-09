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
  Shield, UserCheck, AlertTriangle, RefreshCw, Layers, Edit, Check, User,
  Camera, BadgeCheck, Lock, Bell, X, Eye, EyeOff
} from 'lucide-react';
import { 
  getUsers, createUser, updateUser, deleteUser, toggleUserStatus,
  getLeads, saveLeads, addLeadManual, 
  updateLeadStatus, addLeadNote, deleteLead,
  runTransbordoCheck,
  UserCRM, Lead, UserRole, INITIAL_USERS
} from '../../utils/leadsStore';
import { supabase, isSupabaseConfigured } from '../../utils/supabaseClient';

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
  const [activeTab, setActiveTab] = useState<'kanban' | 'list' | 'whatsapp' | 'analytics' | 'users' | 'flow' | 'profile'>('kanban');
  
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
  const [newUserCreci, setNewUserCreci] = useState('');
  const [newUserBio, setNewUserBio] = useState('');

  // Admin Editing User Profile State
  const [editingUser, setEditingUser] = useState<UserCRM | null>(null);
  const [editUserName, setEditUserName] = useState('');
  const [editUserEmail, setEditUserEmail] = useState('');
  const [editUserPhone, setEditUserPhone] = useState('');
  const [editUserPassword, setEditUserPassword] = useState('');
  const [editUserRole, setEditUserRole] = useState<UserRole>('broker');
  const [editUserManagerId, setEditUserManagerId] = useState('');
  const [editUserCreci, setEditUserCreci] = useState('');
  const [editUserBio, setEditUserBio] = useState('');
  const [editUserAvatar, setEditUserAvatar] = useState('');

  // Personal Profile Form State (Minha Conta)
  const [profileName, setProfileName] = useState('');
  const [profilePhone, setProfilePhone] = useState('');
  const [profileAvatar, setProfileAvatar] = useState('');
  const [profilePassword, setProfilePassword] = useState('');
  const [profileCreci, setProfileCreci] = useState('');
  const [profileBio, setProfileBio] = useState('');
  const [isProfileSaving, setIsProfileSaving] = useState(false);
  const [profileTab, setProfileTab] = useState<'identity' | 'personal' | 'security' | 'notifications'>('identity');
  const [profileBirthdate, setProfileBirthdate] = useState('');
  const [profileEmailNotify, setProfileEmailNotify] = useState(true);
  const [profilePasswordConfirm, setProfilePasswordConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);
  const [showEmailBanner, setShowEmailBanner] = useState(false);

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

    let currentUsers = getUsers();
    if (!currentUsers || currentUsers.length === 0) {
      currentUsers = INITIAL_USERS;
    }
    setUsers(currentUsers);
    
    let user = currentUsers.find(u => u.id === userId);
    if (!user) {
      user = INITIAL_USERS.find(u => u.id === userId);
    }

    if (!user) {
      localStorage.removeItem('lider_active_broker_id');
      router.push('/login');
      return;
    }

    setCurrentUser(user);
    setBrokerPhone(user.phone);
    setIsWhatsAppActive(user.isWhatsAppConnected);
    setLeads(getLeads());

    // Initialize personal profile form
    setProfileName(user.name);
    setProfilePhone(user.phone);
    setProfileAvatar(user.avatar);
    setProfilePassword(user.password || '');
    setProfileCreci(user.creci || '');
    setProfileBio(user.bio || '');
    setProfileBirthdate(user.birthdate || '');
    setProfileEmailNotify(user.emailNotifications ?? true);

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
          setProfileName(updatedUser.name);
          setProfilePhone(updatedUser.phone);
          setProfileAvatar(updatedUser.avatar);
          setProfilePassword(updatedUser.password || '');
          setProfileCreci(updatedUser.creci || '');
          setProfileBio(updatedUser.bio || '');
          setProfileBirthdate(updatedUser.birthdate || '');
          setProfileEmailNotify(updatedUser.emailNotifications ?? true);
        }
      }
    };
    syncCloudData();

    // Inscrever-se nos canais em tempo real se o Supabase estiver configurado
    let usersChannel: any;
    let leadsChannel: any;

    if (isSupabaseConfigured) {
      usersChannel = supabase
        .channel('users-realtime')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'users_crm' }, async () => {
          const { syncWithSupabase } = await import('../../utils/leadsStore');
          await syncWithSupabase();
          const freshUsers = getUsers();
          setUsers(freshUsers);
          
          // Se o meu próprio usuário foi editado em tempo real por outro admin
          const updatedUser = freshUsers.find(u => u.id === userId);
          if (updatedUser) {
            setCurrentUser(updatedUser);
          }
        })
        .subscribe();

      leadsChannel = supabase
        .channel('leads-realtime')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'leads' }, async () => {
          const { syncWithSupabase } = await import('../../utils/leadsStore');
          await syncWithSupabase();
          setLeads(getLeads());
        })
        .subscribe();
    }

    return () => {
      if (usersChannel) {
        supabase.removeChannel(usersChannel);
      }
      if (leadsChannel) {
        supabase.removeChannel(leadsChannel);
      }
    };
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
        : newUserRole === 'admin'
        ? 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150'
        : 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150',
      managerId: newUserRole === 'broker' && newUserManagerId ? newUserManagerId : undefined,
      creci: newUserCreci || undefined,
      bio: newUserBio || undefined
    });

    setUsers(getUsers());
    setNewUserName('');
    setNewUserEmail('');
    setNewUserPhone('');
    setNewUserPassword('123');
    setNewUserManagerId('');
    setNewUserCreci('');
    setNewUserBio('');
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

  // --- GESTÃO DE USUÁRIOS - EDIÇÃO PELO ADMIN ---
  const handleEditUserClick = (user: UserCRM) => {
    setEditingUser(user);
    setEditUserName(user.name);
    setEditUserEmail(user.email);
    setEditUserPhone(user.phone);
    setEditUserPassword(user.password || '');
    setEditUserRole(user.role);
    setEditUserManagerId(user.managerId || '');
    setEditUserCreci(user.creci || '');
    setEditUserBio(user.bio || '');
    setEditUserAvatar(user.avatar || '');
  };

  const handleEditUserSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser || !editUserName || !editUserEmail || !editUserPhone) return;

    const updates: Partial<UserCRM> = {
      name: editUserName,
      email: editUserEmail,
      phone: editUserPhone,
      password: editUserPassword || '123',
      role: editUserRole,
      avatar: editUserAvatar || (editUserRole === 'manager' 
        ? 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150' 
        : editUserRole === 'admin'
        ? 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150'
        : 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150'),
      managerId: editUserRole === 'broker' && editUserManagerId ? editUserManagerId : undefined,
      creci: editUserCreci || undefined,
      bio: editUserBio || undefined
    };

    const updatedUsers = updateUser(editingUser.id, updates);
    setUsers(getUsers());
    
    // Se o próprio administrador logado for editado, atualizamos seus dados locais
    if (editingUser.id === currentUser?.id) {
      const freshUser = updatedUsers.find(u => u.id === currentUser.id);
      if (freshUser) {
        setCurrentUser(freshUser);
        setProfileName(freshUser.name);
        setProfilePhone(freshUser.phone);
        setProfileAvatar(freshUser.avatar);
        setProfilePassword(freshUser.password || '');
        setProfileCreci(freshUser.creci || '');
        setProfileBio(freshUser.bio || '');
      }
    }

    setEditingUser(null);
    alert('Usuário atualizado com sucesso!');
  };

  // --- GESTÃO DO PRÓPRIO PERFIL (MINHA CONTA) ---
  const handleProfileSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !profileName || !profilePhone) return;

    if (profileTab === 'security' && profilePassword && profilePassword !== profilePasswordConfirm) {
      alert('As senhas não coincidem!');
      return;
    }

    setIsProfileSaving(true);
    
    setTimeout(() => {
      const updates: Partial<UserCRM> = {
        name: profileName,
        phone: profilePhone,
        avatar: profileAvatar || currentUser.avatar,
        password: profilePassword || currentUser.password,
        creci: profileCreci || undefined,
        bio: profileBio || undefined,
        birthdate: profileBirthdate || undefined,
        emailNotifications: profileEmailNotify
      };

      const updatedUsers = updateUser(currentUser.id, updates);
      setUsers(getUsers());

      const freshUser = updatedUsers.find(u => u.id === currentUser.id);
      if (freshUser) {
        setCurrentUser(freshUser);
        setProfileName(freshUser.name);
        setProfilePhone(freshUser.phone);
        setProfileAvatar(freshUser.avatar);
        setProfilePassword(freshUser.password || '');
        setProfileCreci(freshUser.creci || '');
        setProfileBio(freshUser.bio || '');
        setProfileBirthdate(freshUser.birthdate || '');
        setProfileEmailNotify(freshUser.emailNotifications ?? true);
      }

      setIsProfileSaving(false);
      setProfilePasswordConfirm('');
      setShowEmailBanner(true);
      setTimeout(() => {
        setShowEmailBanner(false);
      }, 5000);
    }, 850);
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
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col md:flex-row relative">
      
      {/* Sidebar */}
      <aside className="w-full md:w-[280px] bg-white border-r border-slate-200/60 flex flex-col flex-shrink-0 shadow-sm z-10">
        <div className="p-6 border-b border-slate-200/60 flex items-center justify-between">
          <div className="relative w-[120px] h-[40px]">
            <Image 
              src="/Logotipo Lider Branco.svg" 
              alt="Líder Imobiliária" 
              fill 
              className="object-contain object-left" 
              style={{ filter: 'brightness(0) saturate(100%) invert(28%) sepia(87%) saturate(1630%) hue-rotate(209deg) brightness(84%) contrast(89%)' }}
            />
          </div>
          <span className="text-[10px] font-black bg-[#3159C1]/10 border border-[#3159C1]/20 px-2 py-1 rounded text-[#3159C1]">CRM GESTÃO</span>
        </div>

        {/* Profile Card */}
        <div className="p-6 border-b border-slate-200/60 flex items-center gap-4">
          <img src={currentUser.avatar} alt={currentUser.name} className="w-12 h-12 rounded-full object-cover border border-[#3159C1]/40" />
          <div className="overflow-hidden">
            <h4 className="font-bold text-sm truncate text-slate-800">{currentUser.name}</h4>
            <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded tracking-wide inline-block ${
              currentUser.role === 'admin' ? 'bg-red-500/10 text-red-500 border border-red-500/20' :
              currentUser.role === 'manager' ? 'bg-purple-500/10 text-purple-500 border border-purple-500/20' :
              'bg-[#3159C1]/10 text-[#3159C1] border border-[#3159C1]/20'
            }`}>
              {currentUser.role === 'admin' ? 'DIRETORIA' : currentUser.role === 'manager' ? 'GERENTE' : 'CORRETOR'}
            </span>
          </div>
        </div>

        {/* Dynamic Sidebar Links */}
        <nav className="p-4 space-y-1 flex-1">
          <button 
            onClick={() => setActiveTab('kanban')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-all ${activeTab === 'kanban' ? 'bg-[#3159C1] text-white shadow-lg shadow-[#3159C1]/15' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'}`}
          >
            <LayoutDashboard size={18} /> {currentUser.role === 'admin' ? 'Quadro Geral' : 'Quadro Kanban'}
          </button>
          
          <button 
            onClick={() => setActiveTab('list')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-all ${activeTab === 'list' ? 'bg-[#3159C1] text-white shadow-lg shadow-[#3159C1]/15' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'}`}
          >
            <Users size={18} /> {currentUser.role === 'admin' ? 'Banco de Leads' : 'Todos os Leads'}
          </button>

          {/* Broker Specific Tabs */}
          {currentUser.role === 'broker' && (
            <>
              <button 
                onClick={() => setActiveTab('whatsapp')}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-xl font-bold text-sm transition-all ${activeTab === 'whatsapp' ? 'bg-[#3159C1] text-white shadow-lg shadow-[#3159C1]/15' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'}`}
              >
                <div className="flex items-center gap-3">
                  <MessageSquare size={18} /> WhatsApp Integration
                </div>
                {isWhatsAppActive ? (
                  <span className="w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse" />
                ) : (
                  <span className="w-2.5 h-2.5 bg-slate-300 rounded-full" />
                )}
              </button>
              <button 
                onClick={() => setActiveTab('analytics')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-all ${activeTab === 'analytics' ? 'bg-[#3159C1] text-white shadow-lg shadow-[#3159C1]/15' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'}`}
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
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-all ${activeTab === 'users' ? 'bg-[#3159C1] text-white shadow-lg shadow-[#3159C1]/15' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'}`}
              >
                <UserCheck size={18} /> Gestão de Usuários
              </button>
              <button 
                onClick={() => setActiveTab('flow')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-all ${activeTab === 'flow' ? 'bg-[#3159C1] text-white shadow-lg shadow-[#3159C1]/15' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'}`}
              >
                <Layers size={18} /> Regras do CRM & API
              </button>
            </>
          )}

          <div className="w-full h-[1px] bg-slate-200 my-2" />

          <button 
            onClick={() => setActiveTab('profile')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-all ${activeTab === 'profile' ? 'bg-[#3159C1] text-white shadow-lg shadow-[#3159C1]/15' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'}`}
          >
            <User size={18} /> Minha Conta
          </button>
        </nav>

        {/* Footer actions */}
        <div className="p-4 border-t border-slate-200/60 space-y-2">
          <a
            href="/"
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-800 text-xs font-bold transition-all shadow-xs"
          >
            Acessar Site Líder
          </a>
          <button 
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white text-xs font-bold transition-all"
          >
            <LogOut size={14} /> Sair da Conta
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-h-0 bg-slate-50 overflow-hidden text-slate-800">
        
        {/* Header */}
        <header className="h-[76px] bg-white border-b border-slate-200/60 px-6 flex items-center justify-between flex-shrink-0">
          <div>
            <h1 className="text-xl font-black text-slate-800">
              {activeTab === 'kanban' && '🎯 Quadro de Leads'}
              {activeTab === 'list' && '👥 Painel do Funil'}
              {activeTab === 'whatsapp' && '📱 Integração com WhatsApp'}
              {activeTab === 'analytics' && '📊 Estatísticas'}
              {activeTab === 'users' && '⚙️ Painel Administrativo de Usuários'}
              {activeTab === 'flow' && '🔀 Central de Distribuição & API'}
              {activeTab === 'profile' && '👤 Minha Conta / Configurações'}
            </h1>
            <p className="text-xs text-slate-500 font-medium">
              Logado como: <span className="text-[#3159C1] font-bold">{currentUser.name}</span>
            </p>
          </div>

          <div className="flex items-center gap-4">
            {/* Corretor Online / Offline Toggle Switch */}
            {currentUser.role === 'broker' && (
              <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-2xl border border-slate-200/60 text-slate-700 shadow-xs">
                <span className="text-xs font-bold">STATUS DE LEADS:</span>
                <button
                  onClick={handleStatusToggle}
                  className="flex items-center gap-2 focus:outline-none"
                >
                  <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded border ${
                    currentUser.status === 'online' ? 'bg-green-500/10 text-green-600 border-green-500/20' : 'bg-slate-100 text-slate-500 border-slate-200/60'
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
                className="flex items-center gap-2 bg-[#3159C1] hover:bg-[#234294] text-white px-4 py-2.5 rounded-xl text-xs font-bold transition-all active:scale-95 shadow-lg shadow-[#3159C1]/15"
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
                  <div key={col.id} className="w-[280px] bg-white rounded-2xl p-4 flex flex-col flex-shrink-0 border border-slate-200/60 max-h-[calc(100vh-180px)] overflow-hidden shadow-xs">
                    <div className={`border-l-4 pl-3 py-1 mb-4 flex items-center justify-between ${col.color.split(' ')[0]}`}>
                      <h3 className="font-bold text-sm text-slate-800">{col.title}</h3>
                      <span className="text-xs bg-slate-50 text-slate-600 border border-slate-200/50 font-black px-2 py-0.5 rounded-lg">{colLeads.length}</span>
                    </div>

                    <div className="space-y-3 overflow-y-auto pr-1 flex-1">
                      {colLeads.map(lead => {
                        const assignedUser = users.find(u => u.id === lead.assignedBrokerId);
                        return (
                          <motion.div
                            key={lead.id}
                            layoutId={lead.id}
                            onClick={() => setSelectedLead(lead)}
                            className="bg-slate-50 hover:bg-white border border-slate-150 hover:border-[#3159C1] p-4 rounded-xl shadow-xs cursor-pointer transition-all relative group"
                          >
                            <div className="flex justify-between items-start gap-2 mb-2">
                              <span className={`text-[9px] text-white px-2 py-0.5 rounded font-black uppercase tracking-wider ${lead.propertyBg}`}>
                                {lead.propertyName}
                              </span>
                              <span className="text-[9px] text-slate-400 font-medium">
                                {new Date(lead.createdAt).toLocaleDateString('pt-BR', {day: 'numeric', month: 'short'})}
                              </span>
                            </div>
                            
                            <h4 className="font-bold text-sm text-slate-800 group-hover:text-[#3159C1] transition-colors mb-2 line-clamp-1">{lead.name}</h4>
                            
                            <div className="space-y-1 text-xs text-slate-500 font-medium mb-3">
                              <div className="flex items-center gap-1.5"><Phone size={12} className="text-[#3159C1]" /> {lead.phone}</div>
                              {currentUser.role !== 'broker' && assignedUser && (
                                <div className="text-[10px] text-slate-600 font-bold bg-slate-100 border border-slate-200/60 px-2 py-0.5 rounded self-start mt-2 block w-fit">
                                  Corretor: {assignedUser.name}
                                </div>
                              )}
                            </div>

                            <div className="pt-2 border-t border-slate-200/60 flex justify-between items-center text-[10px] text-[#3159C1] font-black tracking-wider">
                              <span>VER DETALHES</span>
                              <ChevronRight size={12} />
                            </div>
                          </motion.div>
                        );
                      })}

                      {colLeads.length === 0 && (
                        <div className="text-center py-8 text-slate-400 text-xs border border-dashed border-slate-200/60 rounded-xl">
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
            <div className="bg-white rounded-3xl border border-slate-200/60 overflow-hidden shadow-xs">
              <div className="p-5 border-b border-slate-200/60 flex flex-col sm:flex-row gap-4 items-center justify-between">
                <div className="relative w-full sm:w-80">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input
                    type="text"
                    placeholder="Pesquisar leads..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-450 font-medium focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#3159C1]/20 focus:border-[#3159C1]"
                  />
                </div>
                <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">{filteredLeads.length} leads no total</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200/60 text-xs font-black text-slate-500 uppercase tracking-widest bg-slate-50">
                      <th className="py-4 px-6">Nome do Lead</th>
                      <th className="py-4 px-6">Contato</th>
                      <th className="py-4 px-6">Imóvel</th>
                      <th className="py-4 px-6">Responsável</th>
                      <th className="py-4 px-6">Status</th>
                      <th className="py-4 px-6">Gerado em</th>
                      <th className="py-4 px-6 text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredLeads.map(lead => {
                      const assignedUser = users.find(u => u.id === lead.assignedBrokerId);
                      return (
                        <tr key={lead.id} className="hover:bg-slate-50 text-sm font-medium text-slate-700 transition-colors">
                          <td className="py-4 px-6">
                            <h4 className="font-bold text-slate-800">{lead.name}</h4>
                            <span className="text-xs text-slate-400">{lead.email || 'Sem e-mail'}</span>
                          </td>
                          <td className="py-4 px-6">
                            <span className="flex items-center gap-1"><Phone size={12} className="text-[#3159C1]" /> {lead.phone}</span>
                          </td>
                          <td className="py-4 px-6">
                            <span className={`text-[10px] text-white px-2 py-0.5 rounded font-black uppercase tracking-wider ${lead.propertyBg}`}>
                              {lead.propertyName}
                            </span>
                          </td>
                          <td className="py-4 px-6 text-xs font-bold text-slate-700">
                            {assignedUser ? assignedUser.name : 'Não Atribuído'}
                          </td>
                          <td className="py-4 px-6">
                            <span className={`text-xs px-2.5 py-1 rounded-full font-bold ${
                              STATUS_COLUMNS.find(c => c.id === lead.status)?.color || ''
                            }`}>
                              {STATUS_COLUMNS.find(c => c.id === lead.status)?.title || ''}
                            </span>
                          </td>
                          <td className="py-4 px-6 text-xs text-slate-500">
                            {new Date(lead.createdAt).toLocaleDateString('pt-BR', {day: '2-digit', month: '2-digit', hour: '2-digit', minute:'2-digit'})}
                          </td>
                          <td className="py-4 px-6 text-right">
                            <button 
                              onClick={() => setSelectedLead(lead)}
                              className="bg-[#3159C1] hover:bg-[#234294] text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-sm active:scale-95"
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
              <div className="bg-white rounded-3xl p-6 border border-slate-200 flex flex-col space-y-6">
                <div>
                  <span className="text-xs font-black tracking-widest text-[#3159C1] uppercase block mb-1">Painel ADM</span>
                  <h3 className="text-xl font-black text-slate-800">Criar Novo Usuário</h3>
                  <p className="text-slate-500 text-xs mt-1">Cadastre corretores e gerentes no CRM com atribuição de equipes.</p>
                </div>

                <form onSubmit={handleCreateUser} className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-600 block">Nome Completo</label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: Pedro Henrique"
                      value={newUserName}
                      onChange={(e) => setNewUserName(e.target.value)}
                      className="w-full px-4 py-3 bg-gray-50 border border-slate-200 rounded-xl text-sm focus:ring-1 focus:ring-[#3159C1] focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-600 block">E-mail Corporativo</label>
                    <input
                      type="email"
                      required
                      placeholder="Ex: pedro@liderimobiliaria.com.br"
                      value={newUserEmail}
                      onChange={(e) => setNewUserEmail(e.target.value)}
                      className="w-full px-4 py-3 bg-gray-50 border border-slate-200 rounded-xl text-sm focus:ring-1 focus:ring-[#3159C1] focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-600 block">WhatsApp</label>
                    <input
                      type="tel"
                      required
                      placeholder="Ex: (81) 99999-9999"
                      value={newUserPhone}
                      onChange={(e) => setNewUserPhone(e.target.value)}
                      className="w-full px-4 py-3 bg-gray-50 border border-slate-200 rounded-xl text-sm focus:ring-1 focus:ring-[#3159C1] focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-600 block">Senha Inicial</label>
                    <input
                      type="password"
                      placeholder="Ex: 123"
                      value={newUserPassword}
                      onChange={(e) => setNewUserPassword(e.target.value)}
                      className="w-full px-4 py-3 bg-gray-50 border border-slate-200 rounded-xl text-sm focus:ring-1 focus:ring-[#3159C1] focus:outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-600 block">Cargo</label>
                      <select
                        value={newUserRole}
                        onChange={(e) => setNewUserRole(e.target.value as UserRole)}
                        className="w-full px-3 py-3 bg-gray-50 border border-slate-200 rounded-xl text-sm focus:outline-none cursor-pointer"
                      >
                        <option value="broker">Corretor</option>
                        <option value="manager">Gerente</option>
                        <option value="admin">Direção</option>
                      </select>
                    </div>

                    {newUserRole === 'broker' && (
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-600 block">Vincular Gerente</label>
                        <select
                          value={newUserManagerId}
                          onChange={(e) => setNewUserManagerId(e.target.value)}
                          className="w-full px-3 py-3 bg-gray-50 border border-slate-200 rounded-xl text-sm focus:outline-none cursor-pointer"
                        >
                          <option value="">Nenhum gerente</option>
                          {users.filter(u => u.role === 'manager').map(m => (
                            <option key={m.id} value={m.id}>{m.name}</option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-600 block">Número do CRECI (Opcional)</label>
                    <input
                      type="text"
                      placeholder="Ex: PE 12345-F"
                      value={newUserCreci}
                      onChange={(e) => setNewUserCreci(e.target.value)}
                      className="w-full px-4 py-3 bg-gray-50 border border-slate-200 rounded-xl text-sm focus:ring-1 focus:ring-[#3159C1] focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-600 block">Biografia / Histórico (Opcional)</label>
                    <textarea
                      placeholder="Ex: Especialista em imóveis de luxo na Zona Sul..."
                      value={newUserBio}
                      onChange={(e) => setNewUserBio(e.target.value)}
                      rows={3}
                      className="w-full px-4 py-3 bg-gray-50 border border-slate-200 rounded-xl text-sm focus:ring-1 focus:ring-[#3159C1] focus:outline-none resize-none font-medium text-slate-300"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3.5 bg-[#3159C1] hover:bg-[#2348a8] text-white font-bold rounded-xl text-sm transition-all active:scale-95 shadow-lg"
                  >
                    Salvar Usuário
                  </button>
                </form>
              </div>

              {/* Users List (Admin View) */}
              <div className="bg-white rounded-3xl p-6 border border-slate-200 lg:col-span-2 flex flex-col">
                <h3 className="text-xl font-black text-slate-800 mb-4">Membros Cadastrados ({users.length})</h3>

                <div className="space-y-3 overflow-y-auto max-h-[500px]">
                  {users.map(u => {
                    const manager = users.find(m => m.id === u.managerId);
                    return (
                      <div key={u.id} className="bg-slate-50 p-4 border border-slate-100 rounded-2xl flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <img src={u.avatar} alt={u.name} className="w-10 h-10 rounded-full object-cover border border-[#3159C1]" />
                          <div>
                            <h4 className="font-bold text-sm text-slate-800">{u.name}</h4>
                            <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-400 flex-wrap">
                              <span className={`text-[9px] font-black px-1.5 py-0.5 rounded ${
                                u.role === 'admin' ? 'bg-red-500/15 text-red-600' :
                                u.role === 'manager' ? 'bg-purple-500/15 text-purple-600' :
                                'bg-[#3159C1]/10 text-[#3159C1]'
                              }`}>
                                {u.role === 'admin' ? 'Direção' : u.role === 'manager' ? 'Gerente' : 'Corretor'}
                              </span>
                              <span>• {u.email}</span>
                              {u.role === 'broker' && manager && (
                                <span className="bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded text-[9px] font-bold">Equipe: {manager.name}</span>
                              )}
                              {u.creci && (
                                <span className="bg-[#00A3FF]/15 text-[#3159C1] px-1.5 py-0.5 rounded text-[9px] font-black border border-[#3159C1]/20">CRECI: {u.creci}</span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          {u.role === 'broker' && (
                            <span className={`text-[10px] font-black px-2 py-1 rounded-full ${
                              u.status === 'online' ? 'bg-green-500/15 text-green-600' : 'bg-slate-100 text-slate-500'
                            }`}>
                              {u.status === 'online' ? '🟢 ONLINE' : '🔴 OFFLINE'}
                            </span>
                          )}

                          <button
                            onClick={() => handleEditUserClick(u)}
                            className="p-2 bg-[#3159C1]/10 text-[#3159C1] hover:bg-[#3159C1] hover:text-white rounded-xl transition-all"
                            title="Editar Perfil"
                          >
                            <Edit size={16} />
                          </button>

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
                <div className="bg-white rounded-3xl p-8 border border-slate-200 flex flex-col space-y-6">
                  <div>
                    <span className="text-xs font-black tracking-widest text-[#3159C1] uppercase block mb-1">Regras de Negócio</span>
                    <h3 className="text-2xl font-black text-slate-800">Central de Fluxo de Leads</h3>
                    <p className="text-slate-500 text-sm mt-1">Configure o comportamento automático de recebimento de leads da landing page.</p>
                  </div>

                  <div className="space-y-4">
                    <div className="bg-slate-50 p-4 border border-slate-100 rounded-2xl flex gap-3">
                      <div className="w-8 h-8 rounded-full bg-[#3159C1]/10 flex items-center justify-center text-[#3159C1] mt-0.5 flex-shrink-0">
                        <Check size={16} />
                      </div>
                      <div>
                        <h4 className="font-bold text-xs text-slate-800">Distribuição Sequencial Ativa (ONLINE ONLY)</h4>
                        <p className="text-slate-500 text-[11px] mt-0.5">O formulário de "Saiba mais" direciona leads um por um (Round-Robin), porém ignorando corretores marcados como Offline. Evita lead ocioso.</p>
                      </div>
                    </div>

                    <div className="bg-slate-50 p-4 border border-slate-100 rounded-2xl flex gap-3">
                      <div className="w-8 h-8 rounded-full bg-yellow-500/10 flex items-center justify-center text-yellow-600 mt-0.5 flex-shrink-0">
                        <Check size={16} />
                      </div>
                      <div>
                        <h4 className="font-bold text-xs text-slate-800">Bloqueio contra Duplicidade com Re-Atribuição</h4>
                        <p className="text-slate-500 text-[11px] mt-0.5">Se um cliente já cadastrado enviar os dados novamente, o sistema reconhece a duplicidade e encaminha de volta para o mesmo corretor original que já o atendia, evitando conflitos na equipe.</p>
                      </div>
                    </div>

                    <div className="bg-slate-50 p-4 border border-slate-100 rounded-2xl flex gap-3">
                      <div className="w-8 h-8 rounded-full bg-red-500/10 flex items-center justify-center text-red-500 mt-0.5 flex-shrink-0">
                        <Check size={16} />
                      </div>
                      <div>
                        <h4 className="font-bold text-xs text-slate-800">Regra de Transbordo (Transbordo Automático em 30min)</h4>
                        <p className="text-slate-500 text-[11px] mt-0.5">Se um lead "Novo" permanecer parado na carteira de um corretor sem nenhuma observação de contato ou mudança de etapa por 30 minutos, o sistema tira dele e passa para outro corretor online da fila.</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Transbordo Simulation & Testing */}
                <div className="bg-white rounded-3xl p-8 border border-slate-200 flex flex-col justify-between">
                  <div>
                    <span className="text-xs font-black tracking-widest text-amber-600 uppercase block mb-1">Simulador de Regras</span>
                    <h3 className="text-xl font-black text-slate-800">Testar Redistribuição (30 minutos)</h3>
                    <p className="text-slate-500 text-xs mt-1">Force o sistema a rodar a varredura de transbordo agora mesmo para ver como os leads parados há 30 min seriam automaticamente repassados.</p>
                    
                    {/* Results Box */}
                    {transbordoResults ? (
                      <div className="mt-4 bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-3">
                        <div className="flex items-center gap-2 text-xs font-bold text-green-400">
                          <CheckCircle2 size={16} />
                          Varredura Executada! {transbordoResults.count} lead(s) atualizados.
                        </div>
                        {transbordoResults.details.length > 0 ? (
                          <ul className="space-y-1.5 max-h-[160px] overflow-y-auto pr-1">
                            {transbordoResults.details.map((d, i) => (
                              <li key={i} className="text-[10px] text-slate-600 bg-white p-2 rounded-lg leading-relaxed border-l-2 border-amber-500">{d}</li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-[10px] text-slate-500 italic">Todos os leads estão dentro do prazo de 30min ou foram devidamente atendidos.</p>
                        )}
                      </div>
                    ) : (
                      <div className="mt-4 p-5 bg-slate-50 border border-dashed border-slate-300 rounded-2xl flex flex-col items-center justify-center py-10 text-center">
                        <Clock className="text-slate-400 mb-3" size={28} />
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
              <div className="bg-white rounded-3xl p-8 border border-slate-200 space-y-6">
                <div>
                  <span className="text-xs font-black tracking-widest text-green-600 uppercase block mb-1">Guia Técnico</span>
                  <h3 className="text-2xl font-black text-slate-800">Como conectar a API real do WhatsApp?</h3>
                  <p className="text-slate-500 text-sm mt-1">Conecte o sistema a uma API do WhatsApp (ex: Evolution API ou Baileys) para disparar mensagens reais no WhatsApp dos corretores.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs">
                  <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 space-y-2">
                    <span className="font-black text-[#3159C1] block">1. HOSPEDAR A API</span>
                    <p className="text-slate-600 leading-relaxed">
                      Utilize a **Evolution API** (software open-source baseado em Node.js/Baileys). Hospede-a em um servidor como VPS (Docker) ou serviços como Render.
                    </p>
                  </div>

                  <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 space-y-2">
                    <span className="font-black text-[#3159C1] block">2. ATIVAR WEBHOOKS</span>
                    <p className="text-slate-600 leading-relaxed">
                      Crie um endpoint no Next.js (ex: `/api/leads`). Configure a Evolution API para enviar uma notificação HTTP POST para o endpoint sempre que um novo lead for gerado, disparando o envio da mensagem formatada ao corretor responsável.
                    </p>
                  </div>

                  <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 space-y-2">
                    <span className="font-black text-[#3159C1] block">3. DISPARAR A MENSAGEM</span>
                    <p className="text-slate-600 leading-relaxed">
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
              <div className="bg-white rounded-3xl p-8 border border-slate-200 flex flex-col space-y-6">
                <div>
                  <span className="text-xs font-black tracking-widest text-[#3159C1] uppercase block mb-1">Notificações Push</span>
                  <h3 className="text-2xl font-black text-slate-800">Conecte seu WhatsApp pessoal</h3>
                  <p className="text-slate-400 text-sm mt-1">Digite seu celular de atendimento abaixo e ative para receber alertas no WhatsApp quando novos leads caírem no seu painel.</p>
                </div>

                <form onSubmit={handleWhatsAppSave} className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-600 block">Número do WhatsApp</label>
                    <input
                      type="tel"
                      required
                      placeholder="Ex: +55 81 99999-9999"
                      value={brokerPhone}
                      onChange={(e) => setBrokerPhone(e.target.value)}
                      className="w-full px-4 py-4 rounded-xl bg-gray-50 border border-slate-200 text-slate-800 font-bold focus:outline-none focus:ring-1 focus:ring-[#3159C1]"
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 bg-slate-900/40 border border-slate-700/30 rounded-xl">
                    <div>
                      <h4 className="font-bold text-xs text-slate-800">Alertas de Lead</h4>
                      <p className="text-slate-500 text-[10px]">Ativar notificação push automática.</p>
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
                      className="flex-1 py-4 bg-[#3159C1] hover:bg-[#2348a8] text-white font-bold rounded-2xl shadow-lg transition-all text-xs uppercase"
                    >
                      Salvar Telefone
                    </button>
                    <button
                      type="button"
                      onClick={triggerTestLeadSim}
                      disabled={!isWhatsAppActive}
                      className="px-6 py-4 border border-slate-700 hover:bg-slate-750 text-slate-600 font-bold rounded-2xl transition-all text-xs uppercase flex items-center justify-center gap-2 disabled:opacity-40"
                    >
                      <Sparkles size={14} /> Enviar Teste
                    </button>
                  </div>
                </form>
              </div>

              <div className="bg-white rounded-3xl p-8 border border-slate-200 flex flex-col items-center justify-center text-center">
                {!isWhatsAppActive ? (
                  <>
                    <div className="w-14 h-14 bg-slate-100 border border-slate-200 rounded-full flex items-center justify-center text-slate-400 mb-6">
                      <QrCode size={28} />
                    </div>
                    <h3 className="text-lg font-black text-slate-800 mb-1">Gerar Integração API</h3>
                    <p className="text-slate-500 text-xs max-w-[280px] mb-6">Conecte o CRM ao seu WhatsApp lendo o QR code virtual.</p>
                    <button
                      onClick={() => setIsWhatsAppActive(true)}
                      className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all"
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
                    <p className="text-slate-500 text-xs max-w-[300px] mb-6">
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
              <div className="bg-white rounded-2xl p-6 border border-slate-200 flex items-center justify-between">
                <div>
                  <span className="text-xs text-slate-500 font-bold uppercase block">Carteira Total</span>
                  <h3 className="text-3xl font-black mt-1 text-slate-800">{visibleLeads.length} leads</h3>
                </div>
              </div>
              <div className="bg-white rounded-2xl p-6 border border-slate-200 flex items-center justify-between">
                <div>
                  <span className="text-xs text-slate-500 font-bold uppercase block">Vendas Concluídas</span>
                  <h3 className="text-3xl font-black mt-1 text-green-400">{visibleLeads.filter(l => l.status === 'closed').length}</h3>
                </div>
              </div>
              <div className="bg-white rounded-2xl p-6 border border-slate-200 flex items-center justify-between">
                <div>
                  <span className="text-xs text-slate-500 font-bold uppercase block">Taxa de Conversão</span>
                  <h3 className="text-3xl font-black mt-1 text-[#3159C1]">
                    {visibleLeads.length > 0 
                      ? `${Math.round((visibleLeads.filter(l => l.status === 'closed').length / visibleLeads.length) * 100)}%`
                      : '0%'
                    }
                  </h3>
                </div>
              </div>
            </div>
          )}

          {/* 6. USER PROFILE TAB */}
          {activeTab === 'profile' && (
            <div className="max-w-5xl mx-auto bg-white rounded-3xl border border-slate-200/60 shadow-sm relative overflow-hidden p-6 md:p-8">
              <div className="absolute top-0 right-0 w-[400px] h-[400px] rounded-full bg-[#3159C1]/5 blur-[100px] pointer-events-none" />
              
              <div className="flex flex-col md:flex-row gap-8 items-start relative z-10">
                {/* Left side: Avatar Preview */}
                <div className="w-full md:w-1/3 flex flex-col items-center md:items-start text-center md:text-left border-b md:border-b-0 md:border-r border-slate-200/60 pb-6 md:pb-0 md:pr-8 space-y-6">
                  {/* Avatar section */}
                  <label className="relative group self-center cursor-pointer">
                    <img 
                      src={profileAvatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150'} 
                      alt="Avatar Preview" 
                      className={`w-32 h-32 rounded-full object-cover border-4 ${
                        currentUser.role === 'admin' ? 'border-red-500/80' :
                        currentUser.role === 'manager' ? 'border-purple-500/80' :
                        'border-[#3159C1]/80'
                      } shadow-md transition-transform duration-300 group-hover:scale-105`} 
                    />
                    <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <Camera className="text-white w-8 h-8" />
                    </div>
                    <input 
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onloadend = () => {
                            if (typeof reader.result === 'string') {
                              setProfileAvatar(reader.result);
                            }
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                    />
                  </label>
                  
                  <div className="w-full flex flex-col items-center md:items-start">
                    <h3 className="text-xl font-bold text-slate-800 flex items-center gap-1.5 justify-center md:justify-start">
                      {currentUser.name}
                      {profileCreci && (
                        <span title="Corretor Verificado">
                          <BadgeCheck size={16} className="text-[#3159C1]" />
                        </span>
                      )}
                    </h3>
                    
                    <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded mt-2 inline-block ${
                      currentUser.role === 'admin' ? 'bg-red-500/10 text-red-600 border border-red-500/20' : 
                      currentUser.role === 'manager' ? 'bg-purple-500/10 text-purple-600 border border-purple-500/20' : 
                      'bg-[#3159C1]/10 text-[#3159C1] border border-[#3159C1]/20'
                    }`}>
                      {currentUser.role === 'admin' ? 'Diretoria / Admin' : currentUser.role === 'manager' ? 'Gerência' : 'Consultor Corretor'}
                    </span>
                    
                    {profileCreci && (
                      <span className="text-xs text-slate-500 font-semibold mt-2">
                        CRECI: <span className="text-[#3159C1] font-bold">{profileCreci}</span>
                      </span>
                    )}
                  </div>

                  {/* Sub-tab Navigation */}
                  <div className="w-full space-y-1 pt-4 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setProfileTab('identity')}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-xs uppercase tracking-wider transition-all ${
                        profileTab === 'identity' 
                          ? 'bg-[#3159C1]/10 text-[#3159C1] border border-[#3159C1]/20' 
                          : 'text-slate-500 hover:bg-slate-50 border border-transparent'
                      }`}
                    >
                      <Camera size={16} /> Foto & Identidade
                    </button>
                    <button
                      type="button"
                      onClick={() => setProfileTab('personal')}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-xs uppercase tracking-wider transition-all ${
                        profileTab === 'personal' 
                          ? 'bg-[#3159C1]/10 text-[#3159C1] border border-[#3159C1]/20' 
                          : 'text-slate-500 hover:bg-slate-50 border border-transparent'
                      }`}
                    >
                      <FileText size={16} /> Dados Pessoais
                    </button>
                    <button
                      type="button"
                      onClick={() => setProfileTab('security')}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-xs uppercase tracking-wider transition-all ${
                        profileTab === 'security' 
                          ? 'bg-[#3159C1]/10 text-[#3159C1] border border-[#3159C1]/20' 
                          : 'text-slate-500 hover:bg-slate-50 border border-transparent'
                      }`}
                    >
                      <Lock size={16} /> Segurança
                    </button>
                    <button
                      type="button"
                      onClick={() => setProfileTab('notifications')}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-xs uppercase tracking-wider transition-all ${
                        profileTab === 'notifications' 
                          ? 'bg-[#3159C1]/10 text-[#3159C1] border border-[#3159C1]/20' 
                          : 'text-slate-500 hover:bg-slate-50 border border-transparent'
                      }`}
                    >
                      <Bell size={16} /> Notificações
                    </button>
                  </div>
                </div>

                {/* Right side: Active Tab Content */}
                <div className="flex-1 w-full flex flex-col justify-between min-h-[400px]">
                  <div>
                    {/* Visual Banner */}
                    <AnimatePresence>
                      {showEmailBanner && (
                        <motion.div
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className="mb-6 p-4 bg-emerald-50 border border-emerald-200/60 text-emerald-800 rounded-2xl flex items-center justify-between shadow-xs"
                        >
                          <div className="flex items-center gap-3">
                            <div className="bg-emerald-500 text-white p-1 rounded-full">
                              <Check size={14} />
                            </div>
                            <span className="text-xs font-bold">
                              Confirmação enviada para <span className="underline">{currentUser.email}</span>
                            </span>
                          </div>
                          <button 
                            type="button"
                            onClick={() => setShowEmailBanner(false)} 
                            className="text-emerald-600 hover:text-emerald-800 font-bold text-xs"
                          >
                            <X size={16} />
                          </button>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <form onSubmit={handleProfileSave} className="space-y-6">
                      {/* SUB-TAB 1: IDENTITY */}
                      {profileTab === 'identity' && (
                        <motion.div 
                          initial={{ opacity: 0, x: 10 }}
                          animate={{ opacity: 1, x: 0 }}
                          className="space-y-6"
                        >
                          <div>
                            <h3 className="text-md font-bold text-slate-800 mb-1">Identidade Básica</h3>
                            <p className="text-slate-500 text-xs">Atualize seu nome público e a foto de perfil exibida no CRM.</p>
                          </div>

                          <div className="space-y-4">
                            <div className="space-y-1">
                              <label className="text-xs font-bold text-slate-600 block">Nome Completo</label>
                              <input
                                type="text"
                                required
                                value={profileName}
                                onChange={(e) => setProfileName(e.target.value)}
                                className="w-full px-4 py-3 bg-gray-50 border border-slate-200 rounded-xl text-sm focus:ring-1 focus:ring-[#3159C1] focus:outline-none"
                              />
                            </div>

                            <div className="space-y-1">
                              <label className="text-xs font-bold text-slate-600 block">Foto de Perfil</label>
                              <div className="flex flex-col sm:flex-row gap-3 items-center">
                                <input
                                  type="url"
                                  placeholder="Cole a URL da foto ou use o botão ao lado"
                                  value={profileAvatar}
                                  onChange={(e) => setProfileAvatar(e.target.value)}
                                  className="flex-1 w-full px-4 py-3 bg-gray-50 border border-slate-200 rounded-xl text-sm focus:ring-1 focus:ring-[#3159C1] focus:outline-none font-mono text-xs text-slate-600"
                                />
                                <label className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-3 border border-dashed border-[#3159C1] hover:bg-[#3159C1]/5 text-[#3159C1] font-bold rounded-xl text-xs uppercase cursor-pointer transition-all flex-shrink-0">
                                  <Camera size={16} />
                                  Carregar Foto
                                  <input 
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={(e) => {
                                      const file = e.target.files?.[0];
                                      if (file) {
                                        const reader = new FileReader();
                                        reader.onloadend = () => {
                                          if (typeof reader.result === 'string') {
                                            setProfileAvatar(reader.result);
                                          }
                                        };
                                        reader.readAsDataURL(file);
                                      }
                                    }}
                                  />
                                </label>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      )}

                      {/* SUB-TAB 2: PERSONAL DETAILS */}
                      {profileTab === 'personal' && (
                        <motion.div 
                          initial={{ opacity: 0, x: 10 }}
                          animate={{ opacity: 1, x: 0 }}
                          className="space-y-6"
                        >
                          <div>
                            <h3 className="text-md font-bold text-slate-800 mb-1">Dados Pessoais & Profissionais</h3>
                            <p className="text-slate-500 text-xs">Essas informações são vinculadas aos seus leads e usadas nas comunicações.</p>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-1">
                              <label className="text-xs font-bold text-slate-600 block">WhatsApp de Atendimento</label>
                              <input
                                type="tel"
                                required
                                value={profilePhone}
                                onChange={(e) => setProfilePhone(e.target.value)}
                                className="w-full px-4 py-3 bg-gray-50 border border-slate-200 rounded-xl text-sm focus:ring-1 focus:ring-[#3159C1] focus:outline-none"
                              />
                            </div>

                            <div className="space-y-1">
                              <label className="text-xs font-bold text-slate-600 block">Número do Registro CRECI</label>
                              <input
                                type="text"
                                placeholder="Ex: PE 12345-F"
                                value={profileCreci}
                                onChange={(e) => setProfileCreci(e.target.value)}
                                className="w-full px-4 py-3 bg-gray-50 border border-slate-200 rounded-xl text-sm focus:ring-1 focus:ring-[#3159C1] focus:outline-none"
                              />
                            </div>

                            <div className="space-y-1">
                              <label className="text-xs font-bold text-slate-600 block">Data de Nascimento</label>
                              <input
                                type="date"
                                value={profileBirthdate}
                                onChange={(e) => setProfileBirthdate(e.target.value)}
                                className="w-full px-4 py-3 bg-gray-50 border border-slate-200 rounded-xl text-sm focus:ring-1 focus:ring-[#3159C1] focus:outline-none cursor-pointer"
                              />
                            </div>

                            <div className="space-y-1">
                              <div className="flex justify-between items-center">
                                <label className="text-xs font-bold text-slate-600 block">E-mail de Acesso (Login)</label>
                                <span className="text-[10px] font-black uppercase text-slate-400 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded">Imutável</span>
                              </div>
                              <input
                                type="email"
                                disabled
                                value={currentUser.email}
                                className="w-full px-4 py-3 bg-slate-100 border border-slate-200 text-slate-400 rounded-xl text-sm cursor-not-allowed focus:outline-none font-medium"
                                title="O e-mail de acesso não pode ser alterado para segurança da sua conta."
                              />
                            </div>
                          </div>

                          <div className="space-y-1">
                            <div className="flex justify-between items-center">
                              <label className="text-xs font-bold text-slate-600 block">Minha Biografia Profissional</label>
                              <span className="text-[10px] text-slate-400 font-bold">{profileBio.length}/500</span>
                            </div>
                            <textarea
                              rows={3}
                              maxLength={500}
                              placeholder="Fale um pouco sobre sua experiência, especialidade e conquistas..."
                              value={profileBio}
                              onChange={(e) => setProfileBio(e.target.value)}
                              className="w-full px-4 py-3 bg-gray-50 border border-slate-200 rounded-xl text-sm focus:ring-1 focus:ring-[#3159C1] focus:outline-none resize-none font-medium text-slate-700 leading-relaxed"
                            />
                          </div>
                        </motion.div>
                      )}

                      {/* SUB-TAB 3: SECURITY */}
                      {profileTab === 'security' && (
                        <motion.div 
                          initial={{ opacity: 0, x: 10 }}
                          animate={{ opacity: 1, x: 0 }}
                          className="space-y-6"
                        >
                          <div>
                            <h3 className="text-md font-bold text-slate-800 mb-1">Segurança da Conta</h3>
                            <p className="text-slate-500 text-xs">Mantenha sua senha atualizada para proteger seus dados e de seus leads.</p>
                          </div>

                          <div className="bg-amber-50 border border-amber-200/60 p-4 rounded-2xl flex items-start gap-3">
                            <AlertTriangle className="text-amber-600 flex-shrink-0 mt-0.5" size={18} />
                            <div>
                              <h4 className="text-xs font-bold text-amber-800">Atenção ao alterar a senha</h4>
                              <p className="text-[11px] text-amber-700 mt-0.5 leading-relaxed">
                                Certifique-se de escolher uma senha segura. Caso a altere, você precisará utilizar a nova senha no seu próximo login.
                              </p>
                            </div>
                          </div>

                          <div className="space-y-4">
                            <div className="space-y-1">
                              <label className="text-xs font-bold text-slate-600 block">Nova Senha</label>
                              <div className="relative">
                                <input
                                  type={showPassword ? 'text' : 'password'}
                                  placeholder="Digite a nova senha"
                                  value={profilePassword}
                                  onChange={(e) => setProfilePassword(e.target.value)}
                                  className="w-full pl-4 pr-10 py-3 bg-gray-50 border border-slate-200 rounded-xl text-sm focus:ring-1 focus:ring-[#3159C1] focus:outline-none font-mono"
                                />
                                <button
                                  type="button"
                                  onClick={() => setShowPassword(!showPassword)}
                                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                >
                                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                              </div>
                            </div>

                            <div className="space-y-1">
                              <label className="text-xs font-bold text-slate-600 block">Confirmar Nova Senha</label>
                              <div className="relative">
                                <input
                                  type={showPasswordConfirm ? 'text' : 'password'}
                                  placeholder="Confirme a nova senha"
                                  value={profilePasswordConfirm}
                                  onChange={(e) => setProfilePasswordConfirm(e.target.value)}
                                  className={`w-full pl-4 pr-10 py-3 border rounded-xl text-sm focus:ring-1 focus:outline-none font-mono ${
                                    profilePasswordConfirm === '' 
                                      ? 'bg-gray-50 border-slate-200 focus:ring-[#3159C1]' 
                                      : profilePassword === profilePasswordConfirm
                                      ? 'bg-emerald-50/50 border-emerald-300 focus:ring-emerald-500'
                                      : 'bg-red-50/50 border-red-300 focus:ring-red-500'
                                  }`}
                                />
                                <button
                                  type="button"
                                  onClick={() => setShowPasswordConfirm(!showPasswordConfirm)}
                                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                >
                                  {showPasswordConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                              </div>
                              {profilePasswordConfirm !== '' && (
                                <p className={`text-[10px] font-bold ${
                                  profilePassword === profilePasswordConfirm ? 'text-emerald-600' : 'text-red-500'
                                }`}>
                                  {profilePassword === profilePasswordConfirm ? '✓ As senhas coincidem' : '✗ As senhas não coincidem'}
                                </p>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      )}

                      {/* SUB-TAB 4: NOTIFICATIONS */}
                      {profileTab === 'notifications' && (
                        <motion.div 
                          initial={{ opacity: 0, x: 10 }}
                          animate={{ opacity: 1, x: 0 }}
                          className="space-y-6"
                        >
                          <div>
                            <h3 className="text-md font-bold text-slate-800 mb-1">Notificações e Avisos</h3>
                            <p className="text-slate-500 text-xs">Controle como você recebe avisos importantes do CRM Líder.</p>
                          </div>

                          <div className="bg-slate-50 border border-slate-200/60 rounded-2xl p-5 flex items-center justify-between shadow-xs">
                            <div className="space-y-1 pr-4">
                              <h4 className="text-sm font-bold text-slate-800">Alertas de segurança no e-mail</h4>
                              <p className="text-xs text-slate-500 leading-relaxed">
                                Receba um e-mail automático informando sempre que dados importantes do seu perfil (como senha e dados de acesso) forem modificados.
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={() => setProfileEmailNotify(!profileEmailNotify)}
                              className="focus:outline-none flex-shrink-0"
                            >
                              {profileEmailNotify ? (
                                <ToggleRight size={44} className="text-[#3159C1]" />
                              ) : (
                                <ToggleLeft size={44} className="text-slate-300" />
                              )}
                            </button>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="bg-slate-50 border border-slate-200/50 rounded-2xl p-4 space-y-2">
                              <h4 className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full bg-emerald-500" /> Alterações de Dados Pessoais
                              </h4>
                              <p className="text-[11px] text-slate-500 leading-relaxed">
                                Notificações automáticas em tempo real para CRECI, WhatsApp e outras atualizações cadastrais.
                              </p>
                            </div>

                            <div className="bg-slate-50 border border-slate-200/50 rounded-2xl p-4 space-y-2 opacity-60">
                              <h4 className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full bg-slate-400" /> Novos Leads Atribuídos (Breve)
                              </h4>
                              <p className="text-[11px] text-slate-500 leading-relaxed">
                                Aviso por e-mail ou push quando novos leads forem repassados ou redistribuídos para você.
                              </p>
                            </div>
                          </div>

                          <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 flex gap-3">
                            <AlertTriangle className="text-amber-600 flex-shrink-0 mt-0.5" size={16} />
                            <p className="text-[11px] text-amber-700 leading-relaxed font-medium">
                              Importante: Mantenha as notificações ativas para acompanhar as atividades de segurança de sua conta.
                            </p>
                          </div>
                        </motion.div>
                      )}

                      <div className="pt-6 border-t border-slate-200/60 mt-8 flex justify-end">
                        <button
                          type="submit"
                          disabled={isProfileSaving || (profileTab === 'security' && profilePassword !== profilePasswordConfirm)}
                          className="px-6 py-3 bg-[#3159C1] hover:bg-[#234294] disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed text-white font-bold rounded-xl text-xs uppercase tracking-wider shadow-md active:scale-95 transition-all flex items-center justify-center gap-2 min-w-[180px]"
                        >
                          {isProfileSaving ? (
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          ) : (
                            'Salvar Alterações'
                          )}
                        </button>
                      </div>
                    </form>
                  </div>
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
              className="w-full max-w-[500px] h-full bg-white border-l border-slate-200 flex flex-col relative z-10 shadow-2xl"
            >
              <div className="p-6 border-b border-slate-200 flex flex-col gap-3 relative">
                <span className={`text-[10px] text-white px-2 py-0.5 rounded font-black uppercase tracking-wider self-start ${selectedLead.propertyBg}`}>
                  {selectedLead.propertyName}
                </span>
                
                <h3 className="text-2xl font-black text-slate-800">{selectedLead.name}</h3>
                
                <div className="flex gap-2">
                  <span className={`text-[11px] px-3 py-1 rounded-full font-bold ${
                    STATUS_COLUMNS.find(c => c.id === selectedLead.status)?.color || ''
                  }`}>
                    Etapa: {STATUS_COLUMNS.find(c => c.id === selectedLead.status)?.title || ''}
                  </span>
                </div>

                <button 
                  onClick={() => setSelectedLead(null)}
                  className="absolute top-6 right-6 text-slate-500 hover:text-slate-800 font-bold text-xs uppercase"
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
                    className="flex items-center justify-center gap-2 p-3.5 bg-slate-100 hover:bg-slate-200 rounded-xl font-bold text-xs text-slate-700 transition-all border border-slate-200"
                  >
                    <Phone size={16} /> Ligar
                  </a>
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-3">
                  <div className="flex items-center gap-3 text-sm font-medium">
                    <Phone size={16} className="text-[#3159C1]" />
                    <div>
                      <span className="text-[10px] text-slate-500 block font-bold">WHATSAPP</span>
                      {selectedLead.phone}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-sm font-medium border-t border-slate-200 pt-3">
                    <Mail size={16} className="text-[#3159C1]" />
                    <div>
                      <span className="text-[10px] text-slate-500 block font-bold">E-MAIL</span>
                      {selectedLead.email || 'Não informado'}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-sm font-medium border-t border-slate-200 pt-3">
                    <Calendar size={16} className="text-[#3159C1]" />
                    <div>
                      <span className="text-[10px] text-slate-500 block font-bold">RECEBIDO EM</span>
                      {new Date(selectedLead.createdAt).toLocaleString('pt-BR')}
                    </div>
                  </div>
                </div>

                {/* Alteração de Funil para corretores, gerentes ou admin */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Mudar Lead de Etapa</label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {STATUS_COLUMNS.map(col => (
                      <button
                        key={col.id}
                        onClick={() => handleLeadStatusChange(selectedLead.id, col.id)}
                        className={`py-2 px-3 text-[11px] font-bold rounded-lg transition-all ${
                          selectedLead.status === col.id 
                            ? 'bg-[#3159C1] border border-[#3159C1] text-white shadow-md' 
                            : 'bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-600'
                        }`}
                      >
                        {col.title.replace(' 🎉', '').replace(' ❌', '')}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Observações do Lead ({selectedLead.notes.length})</label>
                  
                  <div className="space-y-3">
                    {selectedLead.notes.map((note, idx) => (
                      <div key={idx} className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-xs font-medium text-slate-700 flex items-start gap-2.5 leading-relaxed">
                        <FileText size={14} className="text-slate-400 flex-shrink-0 mt-0.5" />
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
                      className="flex-1 px-4 py-2.5 bg-gray-50 border border-slate-200 text-xs rounded-xl focus:outline-none focus:ring-1 focus:ring-[#3159C1] text-slate-800"
                    />
                    <button
                      type="submit"
                      className="bg-[#3159C1] hover:bg-[#2348a8] text-white font-bold px-4 rounded-xl text-xs active:scale-95 transition-all"
                    >
                      Registrar
                    </button>
                  </form>
                </div>
              </div>

              <div className="p-6 border-t border-slate-200 flex gap-3">
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
              className="bg-white rounded-3xl p-8 max-w-[480px] w-full border border-slate-200 relative z-10 shadow-2xl"
            >
              <h3 className="text-xl font-black text-slate-800 mb-1">Cadastrar Lead Manualmente</h3>
              <p className="text-slate-500 text-xs font-medium mb-6">Os dados do lead serão criados diretamente na fila do CRM.</p>

              <form onSubmit={handleAddLeadSubmit} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-600 block">Nome Completo</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Vanessa Carvalho"
                    value={addName}
                    onChange={(e) => setAddName(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-[#3159C1]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-600 block">WhatsApp</label>
                  <input
                    type="tel"
                    required
                    placeholder="Ex: (81) 99999-9999"
                    value={addPhone}
                    onChange={(e) => setAddPhone(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-[#3159C1]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-600 block">E-mail (Opcional)</label>
                  <input
                    type="email"
                    placeholder="Ex: vanessa@email.com"
                    value={addEmail}
                    onChange={(e) => setAddEmail(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-[#3159C1]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-600 block">Empreendimento</label>
                    <select
                      value={addPropName}
                      onChange={(e) => setAddPropName(e.target.value)}
                      className="w-full px-3 py-3 bg-gray-50 border border-slate-200 rounded-xl text-sm focus:outline-none cursor-pointer"
                    >
                      <option value="Valle Encantado">Valle Encantado</option>
                      <option value="Bela Vista">Bela Vista</option>
                      <option value="Conquista Paulista">Conquista Paulista</option>
                    </select>
                  </div>

                  {currentUser.role !== 'broker' && (
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-600 block">Atribuir a Corretor</label>
                      <select
                        value={addBrokerId}
                        onChange={(e) => setAddBrokerId(e.target.value)}
                        className="w-full px-3 py-3 bg-gray-50 border border-slate-200 rounded-xl text-sm focus:outline-none cursor-pointer"
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
                    className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs uppercase tracking-wider transition-all"
                  >
                    Voltar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-3 bg-[#3159C1] hover:bg-[#2348a8] text-white font-bold rounded-xl text-xs uppercase tracking-wider transition-all shadow-lg"
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

      {/* ADMIN EDIT USER MODAL */}
      <AnimatePresence>
        {editingUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setEditingUser(null)}
              className="absolute inset-0 bg-black/60 backdrop-blur-xs"
            />

            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl p-6 md:p-8 max-w-[550px] w-full border border-slate-200 relative z-10 shadow-2xl overflow-y-auto max-h-[90vh]"
            >
              <h3 className="text-xl font-black text-slate-800 mb-1">Editar Perfil de Usuário</h3>
              <p className="text-slate-500 text-xs font-medium mb-6">Ajuste os dados profissionais e credenciais deste usuário do CRM.</p>

              <form onSubmit={handleEditUserSubmit} className="space-y-4">
                <div className="flex gap-4 items-center bg-slate-900/40 p-4 border border-slate-700/30 rounded-2xl mb-2">
                  <label className="relative group cursor-pointer flex-shrink-0">
                    <img 
                      src={editUserAvatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150'} 
                      alt="Preview" 
                      className="w-14 h-14 rounded-full object-cover border border-[#3159C1] transition-transform duration-300 hover:scale-105" 
                    />
                    <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <Camera className="text-white w-4 h-4" />
                    </div>
                    <input 
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onloadend = () => {
                            if (typeof reader.result === 'string') {
                              setEditUserAvatar(reader.result);
                            }
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                    />
                  </label>
                  <div className="flex-1 space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Foto de Perfil do Usuário</label>
                    <div className="flex gap-2">
                      <input
                        type="url"
                        placeholder="URL da foto"
                        value={editUserAvatar}
                        onChange={(e) => setEditUserAvatar(e.target.value)}
                        className="flex-1 px-3 py-1.5 bg-gray-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-[#3159C1] font-mono"
                      />
                      <label className="flex items-center justify-center gap-1.5 px-3 py-1.5 border border-dashed border-[#3159C1] hover:bg-[#3159C1]/5 text-[#3159C1] font-bold rounded-lg text-xs cursor-pointer transition-all">
                        <Camera size={12} />
                        Carregar
                        <input 
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const reader = new FileReader();
                              reader.onloadend = () => {
                                if (typeof reader.result === 'string') {
                                  setEditUserAvatar(reader.result);
                                }
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                        />
                      </label>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-600 block">Nome Completo</label>
                    <input
                      type="text"
                      required
                      value={editUserName}
                      onChange={(e) => setEditUserName(e.target.value)}
                      className="w-full px-4 py-2.5 bg-gray-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-[#3159C1]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-600 block">WhatsApp</label>
                    <input
                      type="tel"
                      required
                      value={editUserPhone}
                      onChange={(e) => setEditUserPhone(e.target.value)}
                      className="w-full px-4 py-2.5 bg-gray-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-[#3159C1]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-600 block">E-mail Corporativo</label>
                    <input
                      type="email"
                      required
                      value={editUserEmail}
                      onChange={(e) => setEditUserEmail(e.target.value)}
                      className="w-full px-4 py-2.5 bg-gray-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-[#3159C1]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-600 block">CRECI (Opcional)</label>
                    <input
                      type="text"
                      placeholder="Ex: PE 12345-F"
                      value={editUserCreci}
                      onChange={(e) => setEditUserCreci(e.target.value)}
                      className="w-full px-4 py-2.5 bg-gray-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-[#3159C1]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-600 block">Cargo</label>
                    <select
                      value={editUserRole}
                      onChange={(e) => setEditUserRole(e.target.value as UserRole)}
                      className="w-full px-3 py-2.5 bg-gray-50 border border-slate-200 rounded-xl text-sm focus:outline-none cursor-pointer"
                    >
                      <option value="broker">Corretor</option>
                      <option value="manager">Gerente</option>
                      <option value="admin">Direção</option>
                    </select>
                  </div>

                  {editUserRole === 'broker' && (
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-600 block">Vincular Gerente</label>
                      <select
                        value={editUserManagerId}
                        onChange={(e) => setEditUserManagerId(e.target.value)}
                        className="w-full px-3 py-2.5 bg-gray-50 border border-slate-200 rounded-xl text-sm focus:outline-none cursor-pointer"
                      >
                        <option value="">Nenhum gerente</option>
                        {users.filter(u => u.role === 'manager').map(m => (
                          <option key={m.id} value={m.id}>{m.name}</option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-600 block">Biografia Profissional</label>
                  <textarea
                    rows={3}
                    placeholder="Mini currículo do corretor..."
                    value={editUserBio}
                    onChange={(e) => setEditUserBio(e.target.value)}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-[#3159C1] resize-none text-slate-300"
                  />
                </div>

                <div className="space-y-1 border-t border-slate-200 pt-3">
                  <label className="text-xs font-bold text-slate-600 block">Redefinir Senha do Usuário</label>
                  <input
                    type="password"
                    placeholder="Digite uma nova senha para redefinir"
                    value={editUserPassword}
                    onChange={(e) => setEditUserPassword(e.target.value)}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-[#3159C1]"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setEditingUser(null)}
                    className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs uppercase tracking-wider transition-all"
                  >
                    Voltar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-3 bg-[#3159C1] hover:bg-[#2348a8] text-white font-bold rounded-xl text-xs uppercase tracking-wider transition-all shadow-lg"
                  >
                    Salvar Alterações
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

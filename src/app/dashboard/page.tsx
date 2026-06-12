'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LogOut, LayoutDashboard, Users, MessageSquare, BarChart3, 
  Plus, Calendar, Mail, Phone, ChevronRight, FileText, 
  Sparkles, CheckCircle2, QrCode, ToggleLeft, ToggleRight,
  TrendingUp, Award, Clock, ArrowRight, ShieldCheck, Search, Trash2,
  Shield, UserCheck, AlertTriangle, RefreshCw, Layers, Edit, Check, User,
  Camera, BadgeCheck, Lock, Bell, X, Eye, EyeOff, Send, MessageCircle
} from 'lucide-react';
import { 
  getUsers, createUser, updateUser, deleteUser, toggleUserStatus,
  getLeads, saveLeads, addLeadManual, 
  updateLeadStatus, addLeadNote, deleteLead,
  runTransbordoCheck, reassignLead, logUserOffline,
  UserCRM, Lead, UserRole, INITIAL_USERS, Message
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

const formatOnlineTime = (seconds: number | undefined): string => {
  if (!seconds || seconds <= 0) return '0 min';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  
  const parts: string[] = [];
  if (h > 0) parts.push(`${h}h`);
  if (m > 0) parts.push(`${m}min`);
  if (h === 0 && m === 0) parts.push(`${s}s`);
  return parts.join(' ');
};

const getDisplayOnlineTime = (user: UserCRM): number => {
  let total = user.totalOnlineTime || 0;
  if (user.status === 'online' && user.lastOnlineAt) {
    const elapsed = Math.floor((Date.now() - new Date(user.lastOnlineAt).getTime()) / 1000);
    if (elapsed > 0) {
      total += elapsed;
    }
  }
  return total;
};

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
  const [profileEmail, setProfileEmail] = useState('');
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
  const [isTestingEmail, setIsTestingEmail] = useState(false);

  // WhatsApp Chat States
  const [activeChatLead, setActiveChatLead] = useState<Lead | null>(null);
  const [chatMessages, setChatMessages] = useState<Message[]>([]);
  const [newMessageText, setNewMessageText] = useState('');
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const [chatSearchQuery, setChatSearchQuery] = useState('');
  const [isSimulatingClient, setIsSimulatingClient] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

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
    
    let user = currentUsers.find(u => u.id === userId);
    if (!user) {
      user = INITIAL_USERS.find(u => u.id === userId);
    }

    if (!user) {
      localStorage.removeItem('lider_active_broker_id');
      router.push('/login');
      return;
    }

    // Gerenciamento de status online automático (corretores)
    if (user.role === 'broker') {
      const wasOnlineBeforeUnload = sessionStorage.getItem('was_online_before_unload') === 'true';
      const isSessionActive = sessionStorage.getItem('session_active') === 'true';

      if (wasOnlineBeforeUnload) {
        const now = new Date().toISOString();
        const updatedUsers = updateUser(user.id, { status: 'online', lastOnlineAt: now });
        user = updatedUsers.find(u => u.id === userId) || user;
        currentUsers = updatedUsers;
        sessionStorage.removeItem('was_online_before_unload');
      } else if (!isSessionActive) {
        const now = new Date().toISOString();
        const updatedUsers = updateUser(user.id, { status: 'online', lastOnlineAt: now });
        user = updatedUsers.find(u => u.id === userId) || user;
        currentUsers = updatedUsers;
        sessionStorage.setItem('session_active', 'true');
      }
    } else {
      sessionStorage.setItem('session_active', 'true');
    }

    setUsers(currentUsers);
    setCurrentUser(user);
    setBrokerPhone(user.phone);
    setIsWhatsAppActive(user.isWhatsAppConnected);
    setLeads(getLeads());

    // Initialize personal profile form
    setProfileName(user.name);
    setProfileEmail(user.email);
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
          setProfileEmail(updatedUser.email);
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
    let pollingInterval: any;

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

      // Polling de segurança a cada 6 segundos para garantir que dados unificados estejam sincronizados
      pollingInterval = setInterval(async () => {
        const { syncWithSupabase } = await import('../../utils/leadsStore');
        const success = await syncWithSupabase();
        if (success) {
          const freshUsers = getUsers();
          setUsers(freshUsers);
          setLeads(getLeads());
          
          const updatedUser = freshUsers.find(u => u.id === userId);
          if (updatedUser) {
            setCurrentUser(updatedUser);
          }
        }
      }, 6000);
    }

    return () => {
      if (usersChannel) {
        supabase.removeChannel(usersChannel);
      }
      if (leadsChannel) {
        supabase.removeChannel(leadsChannel);
      }
      if (pollingInterval) {
        clearInterval(pollingInterval);
      }
    };
  }, [router]);

  // Interceptar beforeunload para marcar o corretor offline e acumular o tempo online no banco
  useEffect(() => {
    const handleBeforeUnload = () => {
      const userId = localStorage.getItem('lider_active_broker_id');
      if (!userId) return;

      const storedUsers = localStorage.getItem('lider_crm_users');
      if (!storedUsers) return;

      try {
        const usersList: UserCRM[] = JSON.parse(storedUsers);
        const user = usersList.find(u => u.id === userId);
        if (user && user.role === 'broker' && user.status === 'online') {
          let elapsedSeconds = 0;
          if (user.lastOnlineAt) {
            elapsedSeconds = Math.floor((Date.now() - new Date(user.lastOnlineAt).getTime()) / 1000);
          }
          if (elapsedSeconds < 0) elapsedSeconds = 0;

          const updatedTotalTime = (user.totalOnlineTime || 0) + elapsedSeconds;

          // 1. Atualiza o localStorage de forma síncrona
          user.status = 'offline';
          user.totalOnlineTime = updatedTotalTime;
          user.lastOnlineAt = undefined;
          localStorage.setItem('lider_crm_users', JSON.stringify(usersList));

          // Salva flag de refresh no sessionStorage
          sessionStorage.setItem('was_online_before_unload', 'true');

          // 2. Envia um PATCH com keepalive diretamente para a API REST do Supabase
          const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
          const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
          if (supabaseUrl && supabaseAnonKey) {
            const url = `${supabaseUrl}/rest/v1/users_crm?id=eq.${user.id}`;
            const body = JSON.stringify({
              status: 'offline',
              total_online_time: updatedTotalTime,
              last_online_at: null
            });
            const headers = {
              'apikey': supabaseAnonKey,
              'Authorization': `Bearer ${supabaseAnonKey}`,
              'Content-Type': 'application/json',
              'Prefer': 'return=representation'
            };
            fetch(url, {
              method: 'PATCH',
              headers,
              body,
              keepalive: true
            }).catch(err => console.error('Erro no keepalive fetch:', err));
          }
        }
      } catch (err) {
        console.error('Erro ao processar offline no beforeunload:', err);
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);

  // Auto-scroll when messages change or chat opens
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  // Load messages and setup Realtime subscription when lead changes
  useEffect(() => {
    if (!activeChatLead || !isSupabaseConfigured) {
      setChatMessages([]);
      return;
    }

    let isMounted = true;

    // 1. Carregar mensagens iniciais
    import('../../utils/leadsStore').then(({ getMessagesForLead }) => {
      getMessagesForLead(activeChatLead.id).then(msgs => {
        if (isMounted) {
          setChatMessages(msgs);
        }
      });
    });

    // 2. Inscrever no canal em tempo real para escutar novas mensagens do lead ativo
    const channel = supabase
      .channel(`chat_messages:${activeChatLead.id}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `lead_id=eq.${activeChatLead.id}`
      }, (payload) => {
        if (!isMounted) return;
        import('../../utils/leadsStore').then(({ mapMessageFromDB }) => {
          const newMsg = mapMessageFromDB(payload.new);
          setChatMessages(prev => {
            if (prev.some(m => m.id === newMsg.id)) return prev;
            return [...prev, newMsg];
          });
        });
      })
      .subscribe();

    return () => {
      isMounted = false;
      channel.unsubscribe();
    };
  }, [activeChatLead]);

  // Keep selectedLead in sync with leads updates
  useEffect(() => {
    if (selectedLead) {
      const freshLead = leads.find(l => l.id === selectedLead.id);
      if (freshLead) {
        if (
          freshLead.assignedBrokerId !== selectedLead.assignedBrokerId ||
          freshLead.status !== selectedLead.status ||
          freshLead.notes.length !== selectedLead.notes.length ||
          freshLead.lastActivityAt !== selectedLead.lastActivityAt
        ) {
          setSelectedLead(freshLead);
        }
      }
    }
  }, [leads, selectedLead]);

  const handleLogout = () => {
    if (currentUser && currentUser.role === 'broker') {
      logUserOffline(currentUser.id);
    }
    sessionStorage.removeItem('session_active');
    sessionStorage.removeItem('was_online_before_unload');
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

  const handleReassignLead = (leadId: string, newBrokerId: string) => {
    if (!currentUser) return;
    const updated = reassignLead(leadId, newBrokerId, currentUser.name);
    setLeads(updated);
    if (selectedLead && selectedLead.id === leadId) {
      setSelectedLead(updated.find(l => l.id === leadId) || null);
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

    const isPasswordChanged = editUserPassword && editUserPassword !== editingUser.password;

    const updatedUsers = updateUser(editingUser.id, updates);
    setUsers(getUsers());
    
    // Se o próprio administrador logado for editado, atualizamos seus dados locais
    if (editingUser.id === currentUser?.id) {
      const freshUser = updatedUsers.find(u => u.id === currentUser.id);
      if (freshUser) {
        setCurrentUser(freshUser);
        setProfileName(freshUser.name);
        setProfileEmail(freshUser.email);
        setProfilePhone(freshUser.phone);
        setProfileAvatar(freshUser.avatar);
        setProfilePassword(freshUser.password || '');
        setProfileCreci(freshUser.creci || '');
        setProfileBio(freshUser.bio || '');
      }
    }

    setEditingUser(null);
    alert('Usuário atualizado com sucesso!');

    // Disparar e-mail de redefinição de senha se foi alterada pelo administrador
    if (isPasswordChanged) {
      const freshUser = updatedUsers.find(u => u.id === editingUser.id);
      if (freshUser) {
        import('../../utils/emailService').then(({ sendPasswordResetEmail }) => {
          sendPasswordResetEmail(freshUser, editUserPassword).then(res => {
            if (!res.success) {
              alert(`Aviso: Senha alterada com sucesso, mas a notificação por e-mail falhou:\n\nDetalhe: ${res.error}`);
            }
          });
        });
      }
    }
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
    
    // Verificar quais campos mudaram para notificação
    const changedFields: string[] = [];
    if (profileName !== currentUser.name) changedFields.push('Nome');
    if (profilePhone !== currentUser.phone) changedFields.push('WhatsApp');
    if (profileAvatar && profileAvatar !== currentUser.avatar) changedFields.push('Foto de Perfil');
    if (profilePassword && profilePassword !== currentUser.password) changedFields.push('Senha de Acesso');
    if (profileCreci !== (currentUser.creci || '')) changedFields.push('Registro CRECI');
    if (profileBio !== (currentUser.bio || '')) changedFields.push('Biografia Profissional');
    if (profileBirthdate !== (currentUser.birthdate || '')) changedFields.push('Data de Nascimento');
    if (currentUser.role === 'admin' && profileEmail && profileEmail !== currentUser.email) changedFields.push('E-mail de Acesso (Login)');

    setTimeout(() => {
      const updates: Partial<UserCRM> = {
        name: profileName,
        phone: profilePhone,
        avatar: profileAvatar || currentUser.avatar,
        password: profilePassword || currentUser.password,
        creci: profileCreci || undefined,
        bio: profileBio || undefined,
        birthdate: profileBirthdate || undefined,
        emailNotifications: profileEmailNotify,
        ...(currentUser.role === 'admin' && profileEmail ? { email: profileEmail } : {})
      };

      const updatedUsers = updateUser(currentUser.id, updates);
      setUsers(getUsers());

      const freshUser = updatedUsers.find(u => u.id === currentUser.id);
      if (freshUser) {
        setCurrentUser(freshUser);
        setProfileName(freshUser.name);
        setProfileEmail(freshUser.email);
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

      // Disparar e-mail se houve alteração e a notificação estiver ativa
      if (changedFields.length > 0 && profileEmailNotify) {
        import('../../utils/emailService').then(({ sendProfileUpdateEmail }) => {
          sendProfileUpdateEmail(freshUser || currentUser, changedFields).then(res => {
            if (!res.success) {
              alert(`Aviso: Perfil atualizado no banco, mas a notificação por e-mail falhou:\n\nDetalhe: ${res.error}`);
            }
          });
        });
      }
      setTimeout(() => {
        setShowEmailBanner(false);
      }, 5000);
    }, 850);
  };

  const handleTestEmailSend = async () => {
    if (!currentUser) return;
    setIsTestingEmail(true);
    try {
      const { sendProfileUpdateEmail } = await import('../../utils/emailService');
      const res = await sendProfileUpdateEmail(currentUser, ['Teste de Envio de E-mail (Verificação de Conexão SMTP)']);
      if (res.success) {
        alert(`Sucesso! O e-mail de teste foi enviado para ${currentUser.email}. Verifique a sua caixa de entrada e também a caixa de spam/lixo eletrônico.`);
      } else {
        alert(`Erro ao enviar e-mail de teste:\n\nDetalhe do erro: ${res.error}\n\nIsso indica que as variáveis SMTP_PASSWORD ou SMTP_USER estão erradas ou vazias no servidor da Vercel.`);
      }
    } catch (e: any) {
      alert(`Falha de conexão com a API de e-mail:\n\n${e.message || e}`);
    } finally {
      setIsTestingEmail(false);
    }
  };

  // --- WHATSAPP CHAT FLOWS ---
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeChatLead || !newMessageText.trim()) return;

    setIsSendingMessage(true);
    const textToSend = newMessageText.trim();
    try {
      const response = await fetch('/api/whatsapp/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          leadId: activeChatLead.id,
          to: activeChatLead.phone,
          text: textToSend,
        }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || `HTTP ${response.status}`);
      }

      setNewMessageText('');
    } catch (err: any) {
      console.error('Erro ao enviar mensagem:', err);
      alert(`Falha ao enviar mensagem de WhatsApp: ${err.message}`);
    } finally {
      setIsSendingMessage(false);
    }
  };

  const handleSimulateClientIncomingMessage = async () => {
    if (!activeChatLead) return;
    setIsSimulatingClient(true);
    try {
      const messageBody = {
        object: 'whatsapp_business_account',
        entry: [
          {
            id: '123456',
            changes: [
              {
                value: {
                  messaging_product: 'whatsapp',
                  messages: [
                    {
                      from: activeChatLead.phone,
                      id: `wamid.SimulatedClientReply${Math.random().toString(36).substring(2, 9)}`,
                      timestamp: Math.floor(Date.now() / 1000).toString(),
                      text: {
                        body: 'Olá! Sou o cliente e esta é uma simulação de resposta em tempo real no CRM!'
                      },
                      type: 'text'
                    }
                  ]
                },
                field: 'messages'
              }
            ]
          }
        ]
      };

      const response = await fetch('/api/whatsapp/webhook', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(messageBody),
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(errText);
      }
    } catch (e: any) {
      console.error('Falha ao simular resposta do cliente:', e);
      alert(`Erro na simulação do webhook: ${e.message || e}`);
    } finally {
      setIsSimulatingClient(false);
    }
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

  const visibleUsers = currentUser.role === 'admin'
    ? users
    : users.filter(u => u.role === 'broker' && u.managerId === currentUser.id);

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

          <button 
            onClick={() => setActiveTab('whatsapp')}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-xl font-bold text-sm transition-all ${activeTab === 'whatsapp' ? 'bg-[#3159C1] text-white shadow-lg shadow-[#3159C1]/15' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'}`}
          >
            <div className="flex items-center gap-3">
              <MessageSquare size={18} /> WhatsApp Chat
            </div>
            <span className="text-[9px] bg-emerald-500/10 text-emerald-600 px-2 py-0.5 rounded-full font-black border border-emerald-500/20">CHAT</span>
          </button>

          {/* Broker Specific Tabs */}
          {currentUser.role === 'broker' && (
            <>
              <button 
                onClick={() => setActiveTab('analytics')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-all ${activeTab === 'analytics' ? 'bg-[#3159C1] text-white shadow-lg shadow-[#3159C1]/15' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'}`}
              >
                <BarChart3 size={18} /> Relatórios
              </button>
            </>
          )}

          {/* Admin / Manager Tabs */}
          {(currentUser.role === 'admin' || currentUser.role === 'manager') && (
            <button 
              onClick={() => setActiveTab('users')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-all ${activeTab === 'users' ? 'bg-[#3159C1] text-white shadow-lg shadow-[#3159C1]/15' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'}`}
            >
              <UserCheck size={18} /> {currentUser.role === 'admin' ? 'Gestão de Usuários' : 'Minha Equipe'}
            </button>
          )}

          {currentUser.role === 'admin' && (
            <button 
              onClick={() => setActiveTab('flow')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-all ${activeTab === 'flow' ? 'bg-[#3159C1] text-white shadow-lg shadow-[#3159C1]/15' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'}`}
            >
              <Layers size={18} /> Regras do CRM & API
            </button>
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
            {/* Contador de Corretores Online (Gestores) */}
            {(currentUser.role === 'admin' || currentUser.role === 'manager') && (
              <div className="flex items-center gap-2.5 bg-green-500/5 px-3 py-2 rounded-2xl border border-green-500/10 text-green-700">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                </span>
                <span className="text-[10px] font-black tracking-wider uppercase flex items-center gap-1.5">
                  {users.filter(u => u.role === 'broker' && u.status === 'online').length} 
                  <span>{users.filter(u => u.role === 'broker' && u.status === 'online').length === 1 ? 'Corretor Online' : 'Corretores Online'}</span>
                </span>
              </div>
            )}

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

          {/* 3. USERS MANAGEMENT TAB (DIREÇÃO E GERENTES) */}
          {activeTab === 'users' && (currentUser.role === 'admin' || currentUser.role === 'manager') && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Form to create User (Admin Only) */}
              {currentUser.role === 'admin' && (
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
              )}

              {/* Users List */}
              <div className={`bg-white rounded-3xl p-6 border border-slate-200 flex flex-col ${
                currentUser.role === 'admin' ? 'lg:col-span-2' : 'lg:col-span-3'
              }`}>
                <h3 className="text-xl font-black text-slate-800 mb-4">
                  {currentUser.role === 'admin' ? `Membros Cadastrados (${visibleUsers.length})` : `Minha Equipe (${visibleUsers.length})`}
                </h3>

                <div className="space-y-3 overflow-y-auto max-h-[500px]">
                  {visibleUsers.map(u => {
                    const manager = users.find(m => m.id === u.managerId);
                    return (
                      <div key={u.id} className="bg-slate-50 p-4 border border-slate-100 rounded-2xl flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <img src={u.avatar} alt={u.name} className="w-10 h-10 rounded-full object-cover border border-[#3159C1]" />
                          <div>
                            <h4 className="font-bold text-sm text-slate-800">{u.name}</h4>
                            <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-450 flex-wrap">
                              <span className={`text-[9px] font-black px-1.5 py-0.5 rounded ${
                                u.role === 'admin' ? 'bg-red-500/15 text-red-600' :
                                u.role === 'manager' ? 'bg-purple-500/15 text-purple-600' :
                                'bg-[#3159C1]/10 text-[#3159C1]'
                              }`}>
                                {u.role === 'admin' ? 'Direção' : u.role === 'manager' ? 'Gerente' : 'Corretor'}
                              </span>
                              <span>• {u.email}</span>
                              {u.role === 'broker' && manager && (
                                <span className="bg-slate-100 text-slate-655 px-1.5 py-0.5 rounded text-[9px] font-bold">Equipe: {manager.name}</span>
                              )}
                              {u.creci && (
                                <span className="bg-[#00A3FF]/15 text-[#3159C1] px-1.5 py-0.5 rounded text-[9px] font-black border border-[#3159C1]/20">CRECI: {u.creci}</span>
                              )}
                              {u.role === 'broker' && (
                                <span className="bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded text-[9px] font-black border border-slate-200/60 flex items-center gap-1">
                                  <Clock size={10} className="text-[#3159C1]" /> Tempo Online: {formatOnlineTime(getDisplayOnlineTime(u))}
                                </span>
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

                          {currentUser.role === 'admin' && (
                            <>
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
                            </>
                          )}
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
                  <span className="text-xs font-black tracking-widest text-green-600 uppercase block mb-1">Integração com Meta</span>
                  <h3 className="text-2xl font-black text-slate-800">Conexão Oficial WhatsApp Business API</h3>
                  <p className="text-slate-500 text-sm mt-1">Siga as instruções abaixo para vincular o número oficial da sua imobiliária com o painel de chat do CRM.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-xs">
                  {/* Meta configuration steps */}
                  <div className="space-y-4">
                    <span className="font-black text-[#3159C1] text-sm block">1. CONFIGURAÇÃO NA META (DEVELOPERS)</span>
                    <ol className="space-y-3 text-slate-600 list-decimal pl-4 leading-relaxed font-medium">
                      <li>Acesse o portal <a href="https://developers.facebook.com/" target="_blank" rel="noopener noreferrer" className="text-[#3159C1] underline font-bold">Meta for Developers</a> e crie um aplicativo do tipo <strong>Business</strong>.</li>
                      <li>Adicione o produto <strong>WhatsApp</strong> ao aplicativo.</li>
                      <li>No menu lateral, vá em <strong>WhatsApp</strong> ➡️ <strong>Configuração de API</strong> para obter o seu <strong>ID do Número de Telefone</strong>.</li>
                      <li>Vá em <strong>WhatsApp</strong> ➡️ <strong>Configuração</strong> e adicione a URL do Webhook do CRM para escutar mensagens.</li>
                    </ol>

                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-2 mt-4">
                      <span className="font-black text-slate-700 block uppercase text-[10px]">Dados para colar na Meta:</span>
                      <div className="space-y-1">
                        <label className="text-[10px] text-slate-500 block font-bold">Callback URL (Webhook)</label>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            readOnly
                            value="https://liderimobiliariape.com.br/api/whatsapp/webhook"
                            className="flex-1 bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-[10px] font-mono text-slate-600 select-all focus:outline-none"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard.writeText("https://liderimobiliariape.com.br/api/whatsapp/webhook");
                              alert("URL do Webhook copiada!");
                            }}
                            className="px-3 bg-[#3159C1] hover:bg-[#234294] text-white rounded-lg font-bold text-[10px]"
                          >
                            Copiar
                          </button>
                        </div>
                      </div>
                      <div className="space-y-1 pt-1">
                        <label className="text-[10px] text-slate-500 block font-bold">Verify Token</label>
                        <input
                          type="text"
                          readOnly
                          value="crm_lider_token_default"
                          className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-[10px] font-mono text-slate-600 select-all focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Vercel Env Vars */}
                  <div className="space-y-4">
                    <span className="font-black text-[#3159C1] text-sm block">2. VARIÁVEIS DE AMBIENTE NA VERCEL</span>
                    <p className="text-slate-600 leading-relaxed font-medium">
                      Para que o servidor conecte-se com a Meta, configure as seguintes variáveis no painel da **Vercel** do seu projeto:
                    </p>
                    <div className="space-y-3 bg-slate-50 p-5 rounded-2xl border border-slate-100 font-medium">
                      <div className="border-b border-slate-200/60 pb-2.5">
                        <span className="font-mono text-[10px] font-black text-slate-800 bg-white border border-slate-200 px-1.5 py-0.5 rounded">WHATSAPP_PHONE_NUMBER_ID</span>
                        <p className="text-[10px] text-slate-500 mt-1">O ID do seu número oficial exibido no painel de desenvolvedores da Meta.</p>
                      </div>
                      <div className="border-b border-slate-200/60 pb-2.5">
                        <span className="font-mono text-[10px] font-black text-slate-800 bg-white border border-slate-200 px-1.5 py-0.5 rounded">WHATSAPP_ACCESS_TOKEN</span>
                        <p className="text-[10px] text-slate-500 mt-1">O Token de acesso permanente gerado nas configurações de Usuários do Sistema do Gerenciador de Negócios da Meta.</p>
                      </div>
                      <div>
                        <span className="font-mono text-[10px] font-black text-slate-800 bg-white border border-slate-200 px-1.5 py-0.5 rounded">WHATSAPP_VERIFY_TOKEN</span>
                        <p className="text-[10px] text-slate-500 mt-1">Opcional. Se quiser usar outro token de verificação diferente de <code>crm_lider_token_default</code>.</p>
                      </div>
                    </div>
                    <div className="bg-amber-50 border border-amber-100 text-amber-800 p-3.5 rounded-xl text-[10px] font-medium leading-relaxed font-semibold">
                      💡 **Modo Simulação**: Enquanto essas variáveis não forem preenchidas na Vercel, o chat operará em modo simulado. Você poderá enviar mensagens e simular as respostas dos clientes clicando em **"Simular Resposta"** para testar toda a interface de chat em tempo real.
                    </div>
                  </div>
                </div>
              </div>

              {/* Facebook Lead Ads API Integration Instructions */}
              <div className="bg-white rounded-3xl p-8 border border-slate-200 space-y-6 mt-6">
                <div>
                  <span className="text-xs font-black tracking-widest text-[#3159C1] uppercase block mb-1">Integração com Meta Ads</span>
                  <h3 className="text-2xl font-black text-slate-800">Conexão de Formulários Nativos (Meta Lead Ads)</h3>
                  <p className="text-slate-500 text-sm mt-1">Siga as instruções abaixo para receber automaticamente os leads gerados pelos seus anúncios de cadastro do Facebook e Instagram diretamente no CRM.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-xs">
                  {/* Meta configuration steps */}
                  <div className="space-y-4">
                    <span className="font-black text-[#3159C1] text-sm block">1. CONFIGURAÇÃO NA META (DEVELOPERS)</span>
                    <ol className="space-y-3 text-slate-600 list-decimal pl-4 leading-relaxed font-medium">
                      <li>No portal <a href="https://developers.facebook.com/" target="_blank" rel="noopener noreferrer" className="text-[#3159C1] underline font-bold">Meta for Developers</a>, use o mesmo aplicativo ou crie um novo aplicativo do tipo <strong>Business</strong>.</li>
                      <li>Adicione o produto <strong>Webhooks</strong> ao aplicativo.</li>
                      <li>No menu do Webhook, selecione <strong>Page</strong> (Página) no menu suspenso e clique em <strong>Configure this webhook</strong>.</li>
                      <li>Cole os dados abaixo (Callback URL e Verify Token) e salve.</li>
                      <li>Assine o tópico <strong>leadgen</strong> na tabela de campos para começar a receber as notificações.</li>
                    </ol>

                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-2 mt-4">
                      <span className="font-black text-slate-700 block uppercase text-[10px]">Dados para colar no Webhook da Página:</span>
                      <div className="space-y-1">
                        <label className="text-[10px] text-slate-500 block font-bold">Callback URL (Webhook)</label>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            readOnly
                            value="https://liderimobiliariape.com.br/api/facebook/webhook"
                            className="flex-1 bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-[10px] font-mono text-slate-600 select-all focus:outline-none"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard.writeText("https://liderimobiliariape.com.br/api/facebook/webhook");
                              alert("URL do Webhook do Facebook copiada!");
                            }}
                            className="px-3 bg-[#3159C1] hover:bg-[#234294] text-white rounded-lg font-bold text-[10px]"
                          >
                            Copiar
                          </button>
                        </div>
                      </div>
                      <div className="space-y-1 pt-1">
                        <label className="text-[10px] text-slate-500 block font-bold">Verify Token</label>
                        <input
                          type="text"
                          readOnly
                          value="crm_lider_facebook_token"
                          className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-[10px] font-mono text-slate-600 select-all focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Vercel Env Vars */}
                  <div className="space-y-4">
                    <span className="font-black text-[#3159C1] text-sm block">2. VARIÁVEIS DE AMBIENTE NA VERCEL</span>
                    <p className="text-slate-600 leading-relaxed font-medium">
                      Para que o servidor do CRM consiga consultar os dados dos leads na Meta, configure as seguintes variáveis no painel da **Vercel** do seu projeto:
                    </p>
                    <div className="space-y-3 bg-slate-50 p-5 rounded-2xl border border-slate-100 font-medium">
                      <div className="border-b border-slate-200/60 pb-2.5">
                        <span className="font-mono text-[10px] font-black text-slate-800 bg-white border border-slate-200 px-1.5 py-0.5 rounded">FACEBOOK_PAGE_ACCESS_TOKEN</span>
                        <p className="text-[10px] text-slate-500 mt-1">O Token de Acesso da Página (Page Access Token) gerado nas configurações da Meta para que o CRM consulte os detalhes dos leads.</p>
                      </div>
                      <div>
                        <span className="font-mono text-[10px] font-black text-slate-800 bg-white border border-slate-200 px-1.5 py-0.5 rounded">FACEBOOK_VERIFY_TOKEN</span>
                        <p className="text-[10px] text-slate-500 mt-1">Opcional. Se quiser usar outro token de verificação de webhook diferente de <code>crm_lider_facebook_token</code>.</p>
                      </div>
                    </div>
                    <div className="bg-[#3159C1]/5 border border-[#3159C1]/20 text-slate-700 p-3.5 rounded-xl text-[10px] font-medium leading-relaxed font-semibold">
                      💡 **Dica de Distribuição**: Os leads recebidos via Facebook Lead Ads entram no mesmo fluxo Round-Robin ativo. O corretor online da vez receberá o lead instantaneamente no seu painel!
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 5. WHATSAPP REALTIME CHAT TAB */}
          {activeTab === 'whatsapp' && (
            <div className="bg-white rounded-3xl border border-slate-200/60 overflow-hidden shadow-sm flex flex-col md:flex-row h-[680px]">
              
              {/* LEFT COLUMN: Leads list */}
              <div className="w-full md:w-[340px] border-r border-slate-100 flex flex-col bg-slate-50/50">
                {/* Search Header */}
                <div className="p-4 border-b border-slate-100 bg-white space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-md font-bold text-slate-800 flex items-center gap-2">
                      <MessageCircle className="text-[#3159C1]" size={18} /> Conversas
                    </h3>
                    <span className="text-[10px] bg-[#3159C1]/10 text-[#3159C1] px-2 py-0.5 rounded-full font-black">
                      {getLeadsByRole().length} LEADS
                    </span>
                  </div>
                  <div className="relative">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                    <input
                      type="text"
                      placeholder="Buscar cliente..."
                      value={chatSearchQuery}
                      onChange={(e) => setChatSearchQuery(e.target.value)}
                      className="w-full pl-9 pr-4 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200/60 text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#3159C1] focus:bg-white font-medium"
                    />
                  </div>
                </div>

                {/* Leads list body */}
                <div className="flex-1 overflow-y-auto p-2 space-y-1">
                  {getLeadsByRole()
                    .filter(lead => 
                      lead.name.toLowerCase().includes(chatSearchQuery.toLowerCase()) ||
                      lead.phone.includes(chatSearchQuery)
                    )
                    .map(lead => {
                      const isActive = activeChatLead?.id === lead.id;
                      const assignedUser = users.find(u => u.id === lead.assignedBrokerId);
                      return (
                        <button
                          key={lead.id}
                          onClick={() => setActiveChatLead(lead)}
                          className={`w-full text-left p-3 rounded-2xl transition-all flex items-start gap-3 ${
                            isActive 
                              ? 'bg-[#3159C1] text-white shadow-md shadow-[#3159C1]/15' 
                              : 'hover:bg-slate-100 text-slate-700 bg-white/60 border border-slate-100'
                          }`}
                        >
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${
                            isActive ? 'bg-white/20 text-white' : 'bg-[#3159C1]/10 text-[#3159C1]'
                          }`}>
                            {lead.name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0 space-y-0.5">
                            <div className="flex justify-between items-center">
                              <span className="font-bold text-xs truncate block">{lead.name}</span>
                              <span className={`text-[9px] ${isActive ? 'text-white/70' : 'text-slate-400'}`}>
                                {new Date(lead.lastActivityAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                            <span className={`text-[10px] truncate block ${isActive ? 'text-white/80 font-medium' : 'text-slate-500 font-medium'}`}>
                              {lead.phone}
                            </span>
                            <div className="flex items-center gap-1.5 pt-0.5">
                              <span className={`text-[9px] px-1.5 py-0.5 rounded-md font-bold uppercase ${
                                isActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'
                              }`}>
                                {lead.propertyName}
                              </span>
                              {currentUser.role === 'admin' && assignedUser && (
                                <span className={`text-[8px] italic truncate ${isActive ? 'text-white/70' : 'text-slate-400'}`}>
                                  resp: {assignedUser.name.split(' ')[0]}
                                </span>
                              )}
                            </div>
                          </div>
                        </button>
                      );
                    })}

                  {getLeadsByRole().length === 0 && (
                    <div className="text-center py-12 px-4 space-y-2">
                      <p className="text-xs text-slate-400 italic">Nenhum cliente disponível no seu fluxo.</p>
                    </div>
                  )}
                </div>
              </div>

              {/* RIGHT COLUMN: Chat workspace */}
              <div className="flex-1 flex flex-col bg-slate-50">
                {activeChatLead ? (
                  <>
                    {/* Active Chat Header */}
                    <div className="p-4 border-b border-slate-200/60 bg-white flex items-center justify-between shadow-2xs relative z-10">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-[#3159C1]/10 text-[#3159C1] flex items-center justify-center font-bold text-sm">
                          {activeChatLead.name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()}
                        </div>
                        <div>
                          <h4 className="font-bold text-sm text-slate-800">{activeChatLead.name}</h4>
                          <div className="flex items-center gap-2 text-[10px] text-slate-500 font-medium">
                            <span>{activeChatLead.phone}</span>
                            <span>•</span>
                            <span className="text-[#3159C1] font-bold">{activeChatLead.propertyName}</span>
                          </div>
                        </div>
                      </div>

                      {/* Simulation Controller */}
                      <button
                        type="button"
                        onClick={handleSimulateClientIncomingMessage}
                        disabled={isSimulatingClient}
                        className="px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 disabled:bg-slate-100 text-emerald-700 disabled:text-slate-400 font-bold rounded-xl text-[10px] uppercase tracking-wider border border-emerald-200/60 transition-all flex items-center gap-1.5"
                      >
                        {isSimulatingClient ? (
                          <>
                            <div className="w-3 h-3 border-2 border-emerald-700 border-t-transparent rounded-full animate-spin" />
                            Simulando...
                          </>
                        ) : (
                          <>
                            <Sparkles size={11} /> Simular Resposta
                          </>
                        )}
                      </button>
                    </div>

                    {/* Messages Body */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#f0f2f5]/40">
                      {chatMessages.map((msg) => {
                        const isBroker = msg.sender === 'broker';
                        return (
                          <div
                            key={msg.id}
                            className={`flex ${isBroker ? 'justify-end' : 'justify-start'}`}
                          >
                            <div className={`max-w-[70%] rounded-2xl px-4 py-3 shadow-xs text-xs space-y-1 ${
                              isBroker 
                                ? 'bg-[#3159C1] text-white rounded-tr-none' 
                                : 'bg-white text-slate-800 border border-slate-200/50 rounded-tl-none'
                            }`}>
                              <p className="leading-relaxed font-medium whitespace-pre-wrap">{msg.text}</p>
                              <span className={`text-[9px] block text-right font-medium ${
                                isBroker ? 'text-white/70' : 'text-slate-400'
                              }`}>
                                {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                          </div>
                        );
                      })}

                      {chatMessages.length === 0 && (
                        <div className="h-full flex flex-col items-center justify-center text-center py-20 space-y-2">
                          <MessageSquare className="text-slate-300" size={32} />
                          <p className="text-xs text-slate-400 font-medium">Nenhuma mensagem neste chat.</p>
                          <p className="text-[10px] text-slate-400/80 max-w-[240px]">Envie uma mensagem abaixo para iniciar a conversa oficial com o cliente.</p>
                        </div>
                      )}

                      <div ref={chatEndRef} />
                    </div>

                    {/* Input Send Area */}
                    <form onSubmit={handleSendMessage} className="p-4 bg-white border-t border-slate-200/60 flex gap-3 items-center">
                      <input
                        type="text"
                        placeholder="Digite uma mensagem para o cliente..."
                        value={newMessageText}
                        onChange={(e) => setNewMessageText(e.target.value)}
                        disabled={isSendingMessage}
                        className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200/80 rounded-xl text-slate-800 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-[#3159C1] focus:bg-white"
                      />
                      <button
                        type="submit"
                        disabled={isSendingMessage || !newMessageText.trim()}
                        className="p-3 bg-[#3159C1] hover:bg-[#234294] disabled:bg-slate-100 disabled:text-slate-400 text-white rounded-xl transition-all active:scale-95"
                      >
                        {isSendingMessage ? (
                          <div className="w-4 h-4 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <Send size={16} />
                        )}
                      </button>
                    </form>
                  </>
                ) : (
                  /* Empty state workspace */
                  <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-slate-50">
                    <div className="w-16 h-16 bg-[#3159C1]/5 border border-[#3159C1]/10 rounded-3xl flex items-center justify-center text-[#3159C1] mb-4 shadow-sm animate-pulse">
                      <MessageSquare size={32} />
                    </div>
                    <h3 className="text-md font-bold text-slate-800">Atendimento WhatsApp CRM</h3>
                    <p className="text-slate-500 text-xs max-w-[280px] mt-1 leading-relaxed">
                      Selecione um cliente da sua lista de leads à esquerda para carregar o histórico de conversas e interagir.
                    </p>
                    <div className="mt-6 p-4 bg-[#3159C1]/5 rounded-2xl border border-[#3159C1]/10 max-w-[320px] text-[10px] text-slate-500 leading-relaxed font-medium">
                      🔒 **Filtro de Privacidade Ativo**: Apenas as conversas de clientes gerados na landing page ou criados manualmente no CRM constarão no painel. Nenhuma mensagem ou contato pessoal será importado.
                    </div>
                  </div>
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
                                {currentUser.role === 'admin' ? (
                                  <span className="text-[10px] font-black uppercase text-[#3159C1] bg-[#3159C1]/10 border border-[#3159C1]/20 px-2 py-0.5 rounded">Alterável (Diretoria)</span>
                                ) : (
                                  <span className="text-[10px] font-black uppercase text-slate-400 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded">Imutável</span>
                                )}
                              </div>
                              <input
                                type="email"
                                disabled={currentUser.role !== 'admin'}
                                value={profileEmail}
                                onChange={(e) => setProfileEmail(e.target.value)}
                                className={`w-full px-4 py-3 border rounded-xl text-sm focus:outline-none font-medium ${
                                  currentUser.role === 'admin'
                                    ? 'bg-gray-50 border-slate-200 focus:ring-1 focus:ring-[#3159C1]'
                                    : 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed'
                                }`}
                                title={currentUser.role === 'admin' ? "E-mail de acesso da Diretoria" : "O e-mail de acesso não pode ser alterado para segurança da sua conta."}
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

                          <div className="bg-[#3159C1]/5 border border-[#3159C1]/20 rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                            <div className="space-y-1">
                              <h4 className="text-sm font-bold text-slate-800">Testar Servidor de E-mail (SMTP)</h4>
                              <p className="text-xs text-slate-500 leading-relaxed">
                                Envia um e-mail de teste imediato para <span className="font-semibold">{currentUser.email}</span> para verificar se a conexão SMTP com o Gmail está funcionando corretamente.
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={handleTestEmailSend}
                              disabled={isTestingEmail}
                              className="px-4 py-2.5 bg-[#3159C1] hover:bg-[#234294] disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed text-white font-bold rounded-xl text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 flex-shrink-0"
                            >
                              {isTestingEmail ? (
                                <>
                                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                  Testando...
                                </>
                              ) : 'Enviar E-mail de Teste'}
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
                  <div className="flex items-center gap-3 text-sm font-medium border-t border-slate-200 pt-3">
                    <User size={16} className="text-[#3159C1]" />
                    <div className="flex-1">
                      <span className="text-[10px] text-slate-500 block font-bold">CORRETOR RESPONSÁVEL</span>
                      {currentUser.role === 'admin' || currentUser.role === 'manager' ? (
                        <select
                          value={selectedLead.assignedBrokerId}
                          onChange={(e) => handleReassignLead(selectedLead.id, e.target.value)}
                          className="bg-transparent text-sm font-bold text-[#3159C1] hover:text-[#234294] focus:outline-none cursor-pointer hover:underline py-0.5 border-none p-0 focus:ring-0 max-w-full"
                        >
                          {users.map(u => (
                            <option key={u.id} value={u.id} className="text-slate-800 bg-white font-medium">
                              {u.name} ({u.role === 'admin' ? 'Diretoria' : u.role === 'manager' ? 'Gerente' : 'Corretor'})
                            </option>
                          ))}
                        </select>
                      ) : (
                        <span className="text-slate-800 font-bold block mt-0.5">
                          {users.find(u => u.id === selectedLead.assignedBrokerId)?.name || 'Não atribuído'}
                        </span>
                      )}
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

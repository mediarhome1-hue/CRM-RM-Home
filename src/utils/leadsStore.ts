import { supabase, isSupabaseConfigured } from './supabaseClient';

export type UserRole = 'admin' | 'manager' | 'broker';

export interface UserCRM {
  id: string;
  name: string;
  avatar: string;
  role: UserRole;
  email: string;
  phone: string;
  password?: string;
  isWhatsAppConnected: boolean;
  status: 'online' | 'offline';
  managerId?: string; // Para corretores associados a equipes de gerentes
  creci?: string;
  bio?: string;
  birthdate?: string; // Data de nascimento (ISO date string YYYY-MM-DD)
  emailNotifications?: boolean; // Receber e-mail quando perfil for alterado
  lastOnlineAt?: string;
  totalOnlineTime?: number;
}

export interface SupabaseStatus {
  isConfigured: boolean;
  isRestricted: boolean;
  errorMessage?: string;
  lastChecked?: string;
}

let currentSupabaseStatus: SupabaseStatus = {
  isConfigured: isSupabaseConfigured,
  isRestricted: false
};

export const getSupabaseStatus = (): SupabaseStatus => {
  if (typeof window === 'undefined') return currentSupabaseStatus;
  const stored = localStorage.getItem('lider_supabase_status');
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {
      return currentSupabaseStatus;
    }
  }
  return currentSupabaseStatus;
};

export const setSupabaseStatus = (status: Partial<SupabaseStatus>) => {
  currentSupabaseStatus = { 
    ...currentSupabaseStatus, 
    ...status, 
    isConfigured: isSupabaseConfigured,
    lastChecked: new Date().toISOString() 
  };
  if (typeof window !== 'undefined') {
    localStorage.setItem('lider_supabase_status', JSON.stringify(currentSupabaseStatus));
  }
};


export interface Lead {
  id: string;
  name: string;
  phone: string;
  email: string;
  propertyName: string;
  propertyBg: string;
  status: 'new' | 'contact' | 'visit' | 'proposal' | 'closed' | 'lost';
  createdAt: string;
  assignedBrokerId: string;
  notes: string[];
  lastActivityAt: string;
  attendedAt?: string; // Marcado quando sai do status 'new' ou recebe nota
}

export interface Message {
  id: string;
  leadId: string;
  sender: 'client' | 'broker';
  text: string;
  timestamp: string;
  status?: string;
}

// Usuários iniciais padrão
export const INITIAL_USERS: UserCRM[] = [
  {
    id: 'diretoria-lider',
    name: 'Joseph Nascimento',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150',
    role: 'admin',
    email: 'joseph3dinfo@gmail.com',
    phone: '+55 81 91337935',
    password: '81546223*#',
    isWhatsAppConnected: false,
    status: 'offline',
    birthdate: '1990-12-26',
    emailNotifications: true
  }
];

const DEFAULT_LEADS: Lead[] = [];

// --- AUXILIARES DE MAPEAMENTO (SNAKE_CASE PARA CAMELCASE) ---

const mapUserToDB = (u: UserCRM) => ({
  id: u.id,
  name: u.name,
  avatar: u.avatar,
  role: u.role,
  email: u.email,
  phone: u.phone,
  password: u.password || '123',
  is_whatsapp_connected: u.isWhatsAppConnected,
  status: u.status,
  manager_id: u.managerId || null,
  creci: u.creci || null,
  bio: u.bio || null,
  birthdate: u.birthdate || null,
  email_notifications: u.emailNotifications ?? true,
  last_online_at: u.lastOnlineAt || null,
  total_online_time: u.totalOnlineTime || 0
});

const mapUserFromDB = (row: any): UserCRM => ({
  id: row.id,
  name: row.name,
  avatar: row.avatar,
  role: row.role as UserRole,
  email: row.email,
  phone: row.phone,
  password: row.password,
  isWhatsAppConnected: row.is_whatsapp_connected,
  status: row.status as 'online' | 'offline',
  managerId: row.manager_id || undefined,
  creci: row.creci || undefined,
  bio: row.bio || undefined,
  birthdate: row.birthdate || undefined,
  emailNotifications: row.email_notifications ?? true,
  lastOnlineAt: row.last_online_at || undefined,
  totalOnlineTime: row.total_online_time || 0
});

const mapLeadToDB = (l: Lead) => ({
  id: l.id,
  name: l.name,
  phone: l.phone,
  email: l.email || null,
  property_name: l.propertyName,
  property_bg: l.propertyBg,
  status: l.status,
  created_at: l.createdAt,
  assigned_broker_id: l.assignedBrokerId,
  notes: l.notes,
  last_activity_at: l.lastActivityAt,
  attended_at: l.attendedAt || null
});

const mapLeadFromDB = (row: any): Lead => ({
  id: row.id,
  name: row.name,
  phone: row.phone,
  email: row.email || '',
  propertyName: row.property_name,
  propertyBg: row.property_bg,
  status: row.status as Lead['status'],
  createdAt: row.created_at,
  assignedBrokerId: row.assigned_broker_id,
  notes: row.notes || [],
  lastActivityAt: row.last_activity_at,
  attendedAt: row.attended_at || undefined
});

export const mapMessageToDB = (m: Message) => ({
  id: m.id,
  lead_id: m.leadId,
  sender: m.sender,
  text: m.text,
  timestamp: m.timestamp,
  status: m.status || 'sent'
});

export const mapMessageFromDB = (row: any): Message => ({
  id: row.id,
  leadId: row.lead_id,
  sender: row.sender as 'client' | 'broker',
  text: row.text,
  timestamp: row.timestamp,
  status: row.status
});

export const getMessagesForLead = async (leadId: string): Promise<Message[]> => {
  if (!isSupabaseConfigured) return [];
  try {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('lead_id', leadId)
      .order('timestamp', { ascending: true });
    
    if (error) {
      console.warn('Erro ao carregar mensagens do Supabase (tabela messages pode não existir ainda):', error.message);
      return [];
    }
    return data ? data.map(mapMessageFromDB) : [];
  } catch (e) {
    console.error('Falha de rede ao buscar mensagens:', e);
    return [];
  }
};

export const saveMessageToSupabase = async (message: Message): Promise<boolean> => {
  if (!isSupabaseConfigured) return false;
  try {
    const { error } = await supabase.from('messages').insert(mapMessageToDB(message));
    if (error) {
      console.error('Erro ao salvar mensagem no Supabase:', error.message);
      return false;
    }
    return true;
  } catch (e) {
    console.error('Falha de rede ao salvar mensagem:', e);
    return false;
  }
};

// --- ENGENHARIA DE SINCRONIZAÇÃO EM SEGUNDO PLANO ---

export const syncWithSupabase = async (): Promise<boolean> => {
  if (!isSupabaseConfigured) return false;
  try {
    let success = true;

    // 1. Sincronizar Usuários
    const { data: usersData, error: usersErr } = await supabase.from('users_crm').select('*');
    if (usersErr) {
      console.error('Erro ao sincronizar usuários do Supabase:', usersErr.message, usersErr.details);
      success = false;
      const isQuota = usersErr.message?.includes('exceed_egress_quota') || String(usersErr.code) === '402';
      setSupabaseStatus({
        isRestricted: isQuota,
        errorMessage: usersErr.message
      });
    } else if (usersData) {
      if (usersData.length === 0) {
        // Banco está vazio! Vamos semear (seed) os INITIAL_USERS automaticamente na nuvem!
        const { error: seedErr } = await supabase.from('users_crm').insert(INITIAL_USERS.map(mapUserToDB));
        if (seedErr) {
          console.error('Erro ao semear usuários iniciais no Supabase:', seedErr.message);
          success = false;
          const isQuota = seedErr.message?.includes('exceed_egress_quota') || String(seedErr.code) === '402';
          setSupabaseStatus({
            isRestricted: isQuota,
            errorMessage: seedErr.message
          });
        } else {
          localStorage.setItem('lider_crm_users', JSON.stringify(INITIAL_USERS));
          setSupabaseStatus({ isRestricted: false, errorMessage: undefined });
        }
      } else {
        const mappedUsers = usersData.map(mapUserFromDB);
        localStorage.setItem('lider_crm_users', JSON.stringify(mappedUsers));
        setSupabaseStatus({ isRestricted: false, errorMessage: undefined });
      }
    }

    // 2. Sincronizar Leads
    const { data: leadsData, error: leadsErr } = await supabase.from('leads').select('*');
    if (leadsErr) {
      console.error('Erro ao sincronizar leads do Supabase:', leadsErr.message, leadsErr.details);
      success = false;
      const isQuota = leadsErr.message?.includes('exceed_egress_quota') || String(leadsErr.code) === '402';
      setSupabaseStatus({
        isRestricted: isQuota,
        errorMessage: leadsErr.message
      });
    } else if (leadsData) {
      const mappedLeads = leadsData.map(mapLeadFromDB);
      localStorage.setItem('lider_leads', JSON.stringify(mappedLeads));
      if (success) {
        setSupabaseStatus({ isRestricted: false, errorMessage: undefined });
      }
    }
    
    return success;
  } catch (e: any) {
    console.error('Falha crítica ao sincronizar com Supabase:', e);
    const isQuota = e?.message?.includes('exceed_egress_quota') || e?.status === 402 || String(e?.code) === '402';
    setSupabaseStatus({
      isRestricted: isQuota,
      errorMessage: e?.message || 'Falha crítica de conexão com o banco de dados'
    });
    return false;
  }
};

const pushUserToSupabase = async (user: UserCRM) => {
  if (!isSupabaseConfigured) return;
  try {
    const { error } = await supabase.from('users_crm').upsert(mapUserToDB(user));
    if (error) {
      console.error('Erro ao enviar usuário para o Supabase:', error.message, error.details, error.hint);
      const isQuota = error.message?.includes('exceed_egress_quota') || String(error.code) === '402';
      setSupabaseStatus({
        isRestricted: isQuota,
        errorMessage: error.message
      });
    } else {
      console.log('Usuário sincronizado com o Supabase:', user.name);
      setSupabaseStatus({ isRestricted: false, errorMessage: undefined });
    }
  } catch (e: any) {
    console.error('Falha de rede/conexão ao enviar usuário:', e);
    const isQuota = e?.message?.includes('exceed_egress_quota') || e?.status === 402 || String(e?.code) === '402';
    setSupabaseStatus({
      isRestricted: isQuota,
      errorMessage: e?.message || 'Falha de rede/conexão com o banco de dados'
    });
  }
};

const pushLeadToSupabase = async (lead: Lead) => {
  if (!isSupabaseConfigured) return;
  try {
    const { error } = await supabase.from('leads').upsert(mapLeadToDB(lead));
    if (error) {
      console.error('Erro ao enviar lead para o Supabase:', error.message, error.details, error.hint);
      const isQuota = error.message?.includes('exceed_egress_quota') || String(error.code) === '402';
      setSupabaseStatus({
        isRestricted: isQuota,
        errorMessage: error.message
      });
    } else {
      console.log('Lead sincronizado com o Supabase:', lead.name);
      setSupabaseStatus({ isRestricted: false, errorMessage: undefined });
    }
  } catch (e: any) {
    console.error('Falha de rede/conexão ao enviar lead:', e);
    const isQuota = e?.message?.includes('exceed_egress_quota') || e?.status === 402 || String(e?.code) === '402';
    setSupabaseStatus({
      isRestricted: isQuota,
      errorMessage: e?.message || 'Falha de rede/conexão com o banco de dados'
    });
  }
};

// --- GESTÃO DE USUÁRIOS ---

export const getUsers = (): UserCRM[] => {
  if (typeof window === 'undefined') return INITIAL_USERS;
  const stored = localStorage.getItem('lider_crm_users');
  if (stored) {
    const parsed = JSON.parse(stored);
    if (parsed && parsed.length > 0) {
      // Verifica e limpa se contiver os corretores fictícios antigos
      const hasDummy = parsed.some((u: any) => u.id === 'ana-silva' || u.id === 'gerente-ricardo');
      if (!hasDummy) {
        return parsed;
      }
      console.log('Detectado cache antigo com corretores fictícios. Limpando localStorage...');
      localStorage.removeItem('lider_crm_users');
      localStorage.removeItem('lider_leads');
    }
  }
  localStorage.setItem('lider_crm_users', JSON.stringify(INITIAL_USERS));
  
  // Se Supabase estiver ativo, dispara fetch em segundo plano para futuras renderizações
  if (isSupabaseConfigured) syncWithSupabase();
  return INITIAL_USERS;
};

export const saveUsers = (users: UserCRM[]): void => {
  if (typeof window === 'undefined') return;
  localStorage.setItem('lider_crm_users', JSON.stringify(users));
};

export const createUser = (userData: Omit<UserCRM, 'id' | 'isWhatsAppConnected' | 'status'>): UserCRM => {
  const users = getUsers();
  const newUser: UserCRM = {
    ...userData,
    id: `user-${Date.now()}`,
    isWhatsAppConnected: false,
    status: 'offline'
  };
  users.push(newUser);
  saveUsers(users);

  pushUserToSupabase(newUser);
  return newUser;
};

export const updateUser = (userId: string, updates: Partial<UserCRM>): UserCRM[] => {
  const users = getUsers().map(u => {
    if (u.id === userId) {
      const updated = { ...u, ...updates };
      pushUserToSupabase(updated);
      return updated;
    }
    return u;
  });
  saveUsers(users);
  return users;
};

export const deleteUser = (userId: string): UserCRM[] => {
  const users = getUsers().filter(u => u.id !== userId);
  saveUsers(users);
  
  if (isSupabaseConfigured) {
    supabase.from('users_crm').delete().eq('id', userId).then();
  }
  return users;
};

export const toggleUserStatus = (userId: string): UserCRM | null => {
  const users = getUsers();
  const userIndex = users.findIndex(u => u.id === userId);
  if (userIndex === -1) return null;

  const user = users[userIndex];
  const newStatus = user.status === 'online' ? 'offline' : 'online';
  user.status = newStatus;

  const now = new Date().toISOString();
  if (newStatus === 'online') {
    user.lastOnlineAt = now;
  } else {
    if (user.lastOnlineAt) {
      const elapsed = Math.floor((Date.now() - new Date(user.lastOnlineAt).getTime()) / 1000);
      if (elapsed > 0) {
        user.totalOnlineTime = (user.totalOnlineTime || 0) + elapsed;
      }
    }
    user.lastOnlineAt = undefined;
  }

  saveUsers(users);
  pushUserToSupabase(user);
  return user;
};

export const logUserOffline = (userId: string): UserCRM | null => {
  const users = getUsers();
  const userIndex = users.findIndex(u => u.id === userId);
  if (userIndex === -1) return null;

  const user = users[userIndex];
  if (user.status === 'offline') return user;

  user.status = 'offline';
  if (user.lastOnlineAt) {
    const elapsed = Math.floor((Date.now() - new Date(user.lastOnlineAt).getTime()) / 1000);
    if (elapsed > 0) {
      user.totalOnlineTime = (user.totalOnlineTime || 0) + elapsed;
    }
  }
  user.lastOnlineAt = undefined;

  saveUsers(users);
  pushUserToSupabase(user);
  return user;
};

// --- GESTÃO DE LEADS ---

export const getLeads = (): Lead[] => {
  if (typeof window === 'undefined') return DEFAULT_LEADS;
  const stored = localStorage.getItem('lider_leads');
  if (stored) return JSON.parse(stored);
  localStorage.setItem('lider_leads', JSON.stringify(DEFAULT_LEADS));
  
  if (isSupabaseConfigured) syncWithSupabase();
  return DEFAULT_LEADS;
};

export const saveLeads = (leads: Lead[]): void => {
  if (typeof window === 'undefined') return;
  localStorage.setItem('lider_leads', JSON.stringify(leads));
};

// --- DISTRIBUIÇÃO SEQUENCIAL E DE-DUPLICAÇÃO ---

export const findExistingLead = (phone: string): Lead | null => {
  const cleanPhone = phone.replace(/\D/g, '');
  const leads = getLeads();
  const match = leads.find(l => l.phone.replace(/\D/g, '') === cleanPhone);
  return match || null;
};

export const getNextOnlineBroker = (): UserCRM | null => {
  const users = getUsers();
  const onlineBrokers = users.filter(u => u.role === 'broker' && u.status === 'online');

  if (onlineBrokers.length === 0) return null;

  // Em vez de usar apenas o localStorage do cliente (que reinicia a fila para cada visitante),
  // buscamos no histórico de leads quem foi o último corretor a receber atendimento
  const leads = getLeads();
  let lastBrokerId = localStorage.getItem('last_assigned_broker_id');

  if (leads.length > 0) {
    const sortedLeads = [...leads].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    const lastLeadWithBroker = sortedLeads.find(l => l.assignedBrokerId);
    if (lastLeadWithBroker) {
      lastBrokerId = lastLeadWithBroker.assignedBrokerId;
    }
  }

  let nextIndex = 0;

  if (lastBrokerId) {
    const lastIndex = onlineBrokers.findIndex(b => b.id === lastBrokerId);
    if (lastIndex !== -1) {
      nextIndex = (lastIndex + 1) % onlineBrokers.length;
    }
  }

  const selectedBroker = onlineBrokers[nextIndex];
  localStorage.setItem('last_assigned_broker_id', selectedBroker.id);
  return selectedBroker;
};

export const registerLeadFromSite = (leadData: Omit<Lead, 'id' | 'createdAt' | 'status' | 'notes' | 'assignedBrokerId' | 'lastActivityAt'>): { lead: Lead, isDuplicate: boolean } => {
  const existingLead = findExistingLead(leadData.phone);
  
  if (existingLead) {
    const leads = getLeads();
    const updatedNotes = [
      ...existingLead.notes,
      `Nova tentativa de contato pelo site para o imóvel: ${leadData.propertyName} em ${new Date().toLocaleString('pt-BR')}. Mantido com o corretor original.`
    ];

    const updatedLeads = leads.map(l => {
      if (l.id === existingLead.id) {
        const uLead: Lead = { 
          ...l, 
          notes: updatedNotes, 
          status: 'new' as const,
          propertyName: leadData.propertyName,
          propertyBg: leadData.propertyBg,
          lastActivityAt: new Date().toISOString(),
          attendedAt: undefined
        };
        pushLeadToSupabase(uLead);
        return uLead;
      }
      return l;
    });
    saveLeads(updatedLeads);
    
    return { 
      lead: updatedLeads.find(l => l.id === existingLead.id)!, 
      isDuplicate: true 
    };
  }

  const assignedBroker = getNextOnlineBroker();
  let fallbackBrokerId = 'diretoria-lider';
  if (assignedBroker) {
    fallbackBrokerId = assignedBroker.id;
  } else {
    const users = getUsers();
    const allBrokers = users.filter(u => u.role === 'broker');
    if (allBrokers.length > 0) {
      fallbackBrokerId = allBrokers[Math.floor(Math.random() * allBrokers.length)].id;
    } else if (users.length > 0) {
      fallbackBrokerId = users[0].id;
    }
  }

  const newLead: Lead = {
    ...leadData,
    id: `lead-${Date.now()}`,
    status: 'new',
    createdAt: new Date().toISOString(),
    lastActivityAt: new Date().toISOString(),
    assignedBrokerId: fallbackBrokerId,
    notes: [`Lead gerado pelo site e encaminhado automaticamente.`],
  };

  const leads = getLeads();
  leads.unshift(newLead);
  saveLeads(leads);

  pushLeadToSupabase(newLead);
  return { lead: newLead, isDuplicate: false };
};

export const addLeadManual = (leadData: Omit<Lead, 'id' | 'createdAt' | 'status' | 'notes' | 'lastActivityAt'>): Lead => {
  const leads = getLeads();
  const newLead: Lead = {
    ...leadData,
    id: `lead-${Date.now()}`,
    status: 'new',
    createdAt: new Date().toISOString(),
    lastActivityAt: new Date().toISOString(),
    notes: ['Lead cadastrado manualmente no painel.'],
  };
  leads.unshift(newLead);
  saveLeads(leads);

  pushLeadToSupabase(newLead);
  return newLead;
};

export const updateLeadStatus = (leadId: string, newStatus: Lead['status']): Lead[] => {
  const leads = getLeads().map(l => {
    if (l.id === leadId) {
      const isAttended = newStatus !== 'new';
      const updated: Lead = { 
        ...l, 
        status: newStatus,
        lastActivityAt: new Date().toISOString(),
        attendedAt: isAttended ? new Date().toISOString() : l.attendedAt
      };
      pushLeadToSupabase(updated);
      return updated;
    }
    return l;
  });
  saveLeads(leads);
  return leads;
};

export const addLeadNote = (leadId: string, note: string): Lead[] => {
  const leads = getLeads().map(l => {
    if (l.id === leadId) {
      const updated: Lead = { 
        ...l, 
        notes: [...l.notes, note],
        lastActivityAt: new Date().toISOString(),
        attendedAt: l.attendedAt || new Date().toISOString()
      };
      pushLeadToSupabase(updated);
      return updated;
    }
    return l;
  });
  saveLeads(leads);
  return leads;
};

export const deleteLead = (leadId: string): Lead[] => {
  const leads = getLeads().filter(l => l.id !== leadId);
  saveLeads(leads);
  
  if (isSupabaseConfigured) {
    supabase.from('leads').delete().eq('id', leadId).then();
  }
  return leads;
};

// --- MOTOR DE REDISTRIBUIÇÃO / TRANSBORDO (30 MINUTOS) ---

export const runTransbordoCheck = (overrideMinutes: number = 30): { updatedLeadsCount: number, details: string[] } => {
  const leads = getLeads();
  const onlineBrokers = getUsers().filter(u => u.role === 'broker' && u.status === 'online');
  const details: string[] = [];

  if (onlineBrokers.length <= 1) {
    return { updatedLeadsCount: 0, details: ['Redistribuição indisponível. É necessário ter pelo menos 2 corretores online.'] };
  }

  let updatedCount = 0;
  const now = Date.now();
  const timeThreshold = overrideMinutes * 60 * 1000;

  const updatedLeads = leads.map(lead => {
    if (lead.status === 'new' && !lead.attendedAt) {
      const leadAge = now - new Date(lead.createdAt).getTime();

      if (leadAge > timeThreshold) {
        const otherOnlineBrokers = onlineBrokers.filter(b => b.id !== lead.assignedBrokerId);
        
        if (otherOnlineBrokers.length > 0) {
          const currentBroker = getUsers().find(u => u.id === lead.assignedBrokerId);
          const nextBroker = otherOnlineBrokers[Math.floor(Math.random() * otherOnlineBrokers.length)];
          
          updatedCount++;
          details.push(`Lead "${lead.name}" redistribuído de ${currentBroker?.name || 'Corretor Anterior'} para ${nextBroker.name} por inatividade.`);

          const updatedLead: Lead = {
            ...lead,
            assignedBrokerId: nextBroker.id,
            createdAt: new Date().toISOString(),
            lastActivityAt: new Date().toISOString(),
            notes: [
              ...lead.notes,
              `⚠️ Lead redistribuído automaticamente em ${new Date().toLocaleString('pt-BR')} por falta de atendimento dentro de 30 minutos.`
            ]
          };
          pushLeadToSupabase(updatedLead);
          return updatedLead;
        }
      }
    }
    return lead;
  });

  if (updatedCount > 0) {
    saveLeads(updatedLeads);
  }

  return { updatedLeadsCount: updatedCount, details };
};

export const reassignLead = (leadId: string, newBrokerId: string, changedBy: string): Lead[] => {
  const brokers = getUsers();
  const newBroker = brokers.find(b => b.id === newBrokerId);
  const newBrokerName = newBroker ? newBroker.name : newBrokerId;

  const leads = getLeads().map(l => {
    if (l.id === leadId) {
      const oldBroker = brokers.find(b => b.id === l.assignedBrokerId);
      const oldBrokerName = oldBroker ? oldBroker.name : l.assignedBrokerId;
      const noteText = `Lead reatribuído de ${oldBrokerName} para ${newBrokerName} por ${changedBy} em ${new Date().toLocaleString('pt-BR')}`;
      
      const updated: Lead = { 
        ...l, 
        assignedBrokerId: newBrokerId,
        notes: [...l.notes, noteText],
        lastActivityAt: new Date().toISOString()
      };
      pushLeadToSupabase(updated);
      return updated;
    }
    return l;
  });
  saveLeads(leads);
  return leads;
};

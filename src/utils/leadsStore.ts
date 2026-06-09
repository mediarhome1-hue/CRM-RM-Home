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
}

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

// Usuários iniciais padrão
export const INITIAL_USERS: UserCRM[] = [
  {
    id: 'diretoria-lider',
    name: 'Direção Líder',
    avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150',
    role: 'admin',
    email: 'direcao@liderimobiliaria.com.br',
    phone: '+55 81 99999-0000',
    password: 'admin',
    isWhatsAppConnected: false,
    status: 'online',
    creci: 'PE 56789-J',
    bio: 'Direção geral da Líder Imobiliária. Compromisso permanente com a ética, liderança e excelência em negócios imobiliários.'
  },
  {
    id: 'gerente-ricardo',
    name: 'Ricardo Souza',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150',
    role: 'manager',
    email: 'ricardo@liderimobiliaria.com.br',
    phone: '+55 81 99999-5555',
    password: '123',
    isWhatsAppConnected: false,
    status: 'online',
    creci: 'PE 45678-F',
    bio: 'Gerente comercial com mais de 10 anos de mercado. Líder nato focado no desenvolvimento de corretores de alta performance.'
  },
  {
    id: 'ana-silva',
    name: 'Ana Silva',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
    role: 'broker',
    email: 'ana@liderimobiliaria.com.br',
    phone: '+55 81 99999-1111',
    password: '123',
    isWhatsAppConnected: false,
    status: 'online',
    managerId: 'gerente-ricardo',
    creci: 'PE 12345-F',
    bio: 'Especialista em lançamentos modernos e imóveis de alto padrão na Zona Sul de Recife. Paixão por realizar sonhos.'
  },
  {
    id: 'bruno-santos',
    name: 'Bruno Santos',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
    role: 'broker',
    email: 'bruno@liderimobiliaria.com.br',
    phone: '+55 81 99999-2222',
    password: '123',
    isWhatsAppConnected: false,
    status: 'online',
    managerId: 'gerente-ricardo',
    creci: 'PE 23456-F',
    bio: 'Foco exclusivo em condomínios fechados, chácaras de luxo e terrenos de médio e alto padrão. Atendimento personalizado.'
  },
  {
    id: 'carlos-lima',
    name: 'Carlos Lima',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
    role: 'broker',
    email: 'carlos@liderimobiliaria.com.br',
    phone: '+55 81 99999-3333',
    password: '123',
    isWhatsAppConnected: false,
    status: 'offline',
    managerId: 'gerente-ricardo',
    creci: 'PE 34567-F',
    bio: 'Consultor de negócios imobiliários comerciais e residenciais na região central. Sólida experiência em negociação corporativa.'
  }
];

const DEFAULT_LEADS: Lead[] = [
  {
    id: 'lead-1',
    name: 'Maria Eduarda Carvalho',
    phone: '(81) 98888-7777',
    email: 'maria.eduarda@email.com',
    propertyName: 'Valle Encantado',
    propertyBg: 'bg-[#317073]',
    status: 'new',
    createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    assignedBrokerId: 'ana-silva',
    notes: ['Demonstrou interesse pela varanda ampla.', 'Tem pressa na mudança.'],
    lastActivityAt: new Date(Date.now() - 3600000 * 2).toISOString(),
  },
  {
    id: 'lead-2',
    name: 'João Pedro Albuquerque',
    phone: '(81) 99111-2222',
    email: 'joao.pedro@email.com',
    propertyName: 'Bela Vista',
    propertyBg: 'bg-[#1b7a5e]',
    status: 'contact',
    createdAt: new Date(Date.now() - 3600000 * 12).toISOString(),
    assignedBrokerId: 'ana-silva',
    notes: ['Enviado apresentação do imóvel no WhatsApp.', 'Aguardando retorno sobre o valor da entrada.'],
    lastActivityAt: new Date(Date.now() - 3600000 * 12).toISOString(),
    attendedAt: new Date(Date.now() - 3600000 * 11.5).toISOString(),
  }
];

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
  email_notifications: u.emailNotifications ?? true
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
  emailNotifications: row.email_notifications ?? true
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

// --- ENGENHARIA DE SINCRONIZAÇÃO EM SEGUNDO PLANO ---

export const syncWithSupabase = async (): Promise<boolean> => {
  if (!isSupabaseConfigured) return false;
  try {
    // 1. Sincronizar Usuários
    const { data: usersData, error: usersErr } = await supabase.from('users_crm').select('*');
    if (!usersErr && usersData) {
      if (usersData.length === 0) {
        // Banco está vazio! Vamos semear (seed) os INITIAL_USERS automaticamente na nuvem!
        const { error: seedErr } = await supabase.from('users_crm').insert(INITIAL_USERS.map(mapUserToDB));
        if (!seedErr) {
          localStorage.setItem('lider_crm_users', JSON.stringify(INITIAL_USERS));
        }
      } else {
        const mappedUsers = usersData.map(mapUserFromDB);
        localStorage.setItem('lider_crm_users', JSON.stringify(mappedUsers));
      }
    }

    // 2. Sincronizar Leads
    const { data: leadsData, error: leadsErr } = await supabase.from('leads').select('*');
    if (!leadsErr && leadsData) {
      const mappedLeads = leadsData.map(mapLeadFromDB);
      localStorage.setItem('lider_leads', JSON.stringify(mappedLeads));
    }
    
    return true;
  } catch (e) {
    console.error('Falha ao sincronizar com Supabase:', e);
    return false;
  }
};

const pushUserToSupabase = async (user: UserCRM) => {
  if (!isSupabaseConfigured) return;
  try {
    await supabase.from('users_crm').upsert(mapUserToDB(user));
  } catch (e) {
    console.error(e);
  }
};

const pushLeadToSupabase = async (lead: Lead) => {
  if (!isSupabaseConfigured) return;
  try {
    await supabase.from('leads').upsert(mapLeadToDB(lead));
  } catch (e) {
    console.error(e);
  }
};

// --- GESTÃO DE USUÁRIOS ---

export const getUsers = (): UserCRM[] => {
  if (typeof window === 'undefined') return INITIAL_USERS;
  const stored = localStorage.getItem('lider_crm_users');
  if (stored) {
    const parsed = JSON.parse(stored);
    if (parsed && parsed.length > 0) return parsed;
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

  const currentStatus = users[userIndex].status;
  users[userIndex].status = currentStatus === 'online' ? 'offline' : 'online';
  saveUsers(users);

  pushUserToSupabase(users[userIndex]);
  return users[userIndex];
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
  const fallbackBrokerId = assignedBroker ? assignedBroker.id : 'ana-silva';

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

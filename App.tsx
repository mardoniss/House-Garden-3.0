import React, { useState, useEffect, useRef } from 'react';
import { 
  ClipboardCheck, 
  Truck, 
  Plus, 
  Filter, 
  Search, 
  Calendar, 
  MapPin, 
  Camera, 
  AlertTriangle,
  CheckCircle2,
  X,
  ChevronDown,
  ChevronUp,
  Sparkles,
  ArrowRight,
  HardHat,
  ThumbsUp,
  ThumbsDown,
  Image as ImageIcon,
  History,
  Archive,
  MessageSquareWarning,
  Lock,
  Unlock,
  LogOut,
  User as UserIcon,
  Trash2,
  Users,
  Shield,
  Key,
  Pencil
} from 'lucide-react';
import { 
  Issue, 
  Delivery, 
  ViewMode, 
  Priority, 
  IssueStatus, 
  DeliveryStatus,
  User
} from './types';
import { 
  PriorityBadge, 
  IssueStatusBadge, 
  DeliveryStatusBadge, 
  Input, 
  Select, 
  TextArea, 
  Button 
} from './components/UIComponents';
import SignaturePad from './components/SignaturePad';
import { generateIssueDescription } from './services/geminiService';

// --- HELPERS ---
const convertFileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
  });
};

// --- MOCK DATA ---
const INITIAL_USERS: User[] = [
  { id: '1', name: 'Equipe Engenharia', username: 'engenharia', password: '1957', role: 'Engenharia' },
  { id: '2', name: 'Ailton', username: 'ailton', password: '123', role: 'Mestre de Obras' },
  { id: '3', name: 'Iltinho', username: 'iltinho', password: '123', role: 'Mestre de Obras' },
  { id: '4', name: 'Geraldo', username: 'geraldo', password: '123', role: 'Mestre de Obras' },
  { id: '5', name: 'Diego', username: 'diego', password: '123', role: 'Empreiteiro' },
  { id: '6', name: 'Almoxarifado', username: 'almox', password: '123', role: 'Almoxarifado' },
  { id: '7', name: 'Antônio', username: 'antonio', password: '123', role: 'Almoxarifado' },
  { id: '8', name: 'Izaias', username: 'izaias', password: '123', role: 'Almoxarifado' },
];

const MOCK_ISSUES: Issue[] = [
  {
    id: '1',
    title: 'Falta rejunte banheiro',
    description: 'Falta aplicação de rejunte epóxi no box do banheiro da suíte master. Necessário limpeza prévia.',
    priority: Priority.HIGH,
    assignee: 'João Silva (Azulejista)',
    requestedBy: 'Engenharia',
    deadline: '2023-10-25',
    location: 'Bloco A, Apto 302',
    photos: ['https://picsum.photos/400/300'],
    status: IssueStatus.OPEN,
    createdAt: '2023-10-20'
  },
  {
    id: '2',
    title: 'Pintura descascando',
    description: 'Parede da sala apresenta descascamento próximo ao rodapé. Possível umidade.',
    priority: Priority.MEDIUM,
    assignee: 'Maria Pinturas Ltda',
    requestedBy: 'Ailton',
    deadline: '2023-10-28',
    location: 'Bloco B, Hall de Entrada',
    photos: [],
    status: IssueStatus.WAITING, 
    createdAt: '2023-10-18',
    completionPhotos: ['https://picsum.photos/id/11/400/300'] // Example completion photo
  },
  {
    id: '3',
    title: 'Instalação Elétrica Exposta',
    description: 'Fios expostos na caixa de passagem do corredor principal.',
    priority: Priority.HIGH,
    assignee: 'EletroRápido',
    requestedBy: 'Geraldo',
    deadline: '2023-10-22',
    location: 'Área Comum, 1º Andar',
    photos: [],
    status: IssueStatus.WAITING,
    createdAt: '2023-10-21'
  },
  {
    id: '4',
    title: 'Vidro da varanda riscado',
    description: 'Vidro temperado da varanda gourmet apresenta riscos profundos.',
    priority: Priority.LOW,
    assignee: 'Vidraçaria Transparente',
    requestedBy: 'Diego',
    deadline: '2023-10-15',
    location: 'Bloco A, Apto 101',
    photos: [],
    status: IssueStatus.DONE, // Historic item
    createdAt: '2023-10-10',
    completionPhotos: ['https://picsum.photos/id/15/400/300']
  }
];

const MOCK_DELIVERIES: Delivery[] = [
  {
    id: '101',
    material: 'Cimento CP-II',
    supplier: 'Votorantim',
    quantity: 50,
    unit: 'sacos',
    expectedDate: '2023-10-24T08:00',
    status: DeliveryStatus.SCHEDULED,
  },
  {
    id: '102',
    material: 'Porcelanato 80x80',
    supplier: 'Portobello Shop',
    quantity: 120,
    unit: 'm²',
    expectedDate: '2023-10-22T14:00',
    invoiceNumber: 'NF-98765',
    status: DeliveryStatus.CHECKED,
    receivedAt: '2023-10-22T14:30',
    receiverName: 'Antônio',
  }
];

// Interface for filters
interface FilterState {
  status: string;
  priority: string;
  assignee: string;
  deadline: string; // "Up to" date
}

interface LogisticsFilterState {
  material: string;
  invoiceNumber: string;
  date: string;
  status: string;
}

export default function App() {
  const [viewMode, setViewMode] = useState<ViewMode>('issues');
  const [activeIssueTab, setActiveIssueTab] = useState<'active' | 'history'>('active');
  const [issues, setIssues] = useState<Issue[]>(MOCK_ISSUES);
  const [deliveries, setDeliveries] = useState<Delivery[]>(MOCK_DELIVERIES);
  
  // User Management State
  const [users, setUsers] = useState<User[]>(INITIAL_USERS);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  // Search State
  const [isSearchActive, setIsSearchActive] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Modal States
  const [showIssueModal, setShowIssueModal] = useState(false);
  const [showDeliveryModal, setShowDeliveryModal] = useState(false);
  const [showReceiveModal, setShowReceiveModal] = useState<Delivery | null>(null);
  const [showResolveModal, setShowResolveModal] = useState<Issue | null>(null);
  const [showRejectionModal, setShowRejectionModal] = useState<Issue | null>(null);
  
  // Filter States
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [filters, setFilters] = useState<FilterState>({
    status: 'all',
    priority: 'all',
    assignee: 'all',
    deadline: ''
  });
  const [logisticsFilters, setLogisticsFilters] = useState<LogisticsFilterState>({
    material: '',
    invoiceNumber: '',
    date: '',
    status: 'all'
  });

  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  // Form States
  const [formData, setFormData] = useState<any>({});
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  const [loginError, setLoginError] = useState('');
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);

  useEffect(() => {
    const handleStatusChange = () => setIsOffline(!navigator.onLine);
    window.addEventListener('online', handleStatusChange);
    window.addEventListener('offline', handleStatusChange);
    return () => {
      window.removeEventListener('online', handleStatusChange);
      window.removeEventListener('offline', handleStatusChange);
    };
  }, []);

  // --- Handlers ---

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const user = users.find(u => 
      u.username.toLowerCase() === loginForm.username.toLowerCase() && 
      u.password === loginForm.password
    );

    if (user) {
      setCurrentUser(user);
      setLoginError('');
      setLoginForm({ username: '', password: '' });
      if (user.role === 'Engenharia') {
        setViewMode('engineering');
      } else {
        setViewMode('issues');
      }
    } else {
      setLoginError('Usuário ou senha inválidos.');
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setViewMode('profile');
  };

  const handleOpenAddUser = () => {
    setEditingUser(null);
    setFormData({});
    setShowUserModal(true);
  };

  const handleOpenEditUser = (user: User) => {
    setEditingUser(user);
    setFormData({
      name: user.name,
      username: user.username,
      password: user.password,
      role: user.role
    });
    setShowUserModal(true);
  };

  const handleSaveUser = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingUser) {
      // Edit Mode
      const updatedUsers = users.map(u => u.id === editingUser.id ? {
        ...u,
        name: formData.name,
        username: formData.username,
        password: formData.password,
        role: formData.role
      } : u);
      setUsers(updatedUsers);
    } else {
      // Create Mode
      const newUser: User = {
        id: Math.random().toString(36).substr(2, 9),
        name: formData.name,
        username: formData.username,
        password: formData.password,
        role: formData.role,
      };
      setUsers([...users, newUser]);
    }
    
    setShowUserModal(false);
    setEditingUser(null);
    setFormData({});
  };

  const handleDeleteUser = (userId: string) => {
    if (confirm('Tem certeza que deseja remover este usuário?')) {
      setUsers(users.filter(u => u.id !== userId));
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>, fieldName: string) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files);
      const base64Promises = newFiles.map(convertFileToBase64);
      const base64Images = await Promise.all(base64Promises);
      
      const currentImages = formData[fieldName] || [];
      setFormData({
        ...formData,
        [fieldName]: [...currentImages, ...base64Images]
      });
    }
  };

  const removePhoto = (fieldName: string, index: number) => {
    const currentImages = formData[fieldName] || [];
    const updatedImages = currentImages.filter((_: any, i: number) => i !== index);
    setFormData({
      ...formData,
      [fieldName]: updatedImages
    });
  };

  const handleCreateIssue = (e: React.FormEvent) => {
    e.preventDefault();
    const newIssue: Issue = {
      id: Math.random().toString(36).substr(2, 9),
      title: formData.title,
      description: formData.description,
      priority: formData.priority || Priority.MEDIUM,
      assignee: formData.assignee,
      requestedBy: formData.requestedBy,
      deadline: formData.deadline,
      location: formData.location,
      photos: formData.photos || [], 
      status: IssueStatus.OPEN,
      createdAt: new Date().toISOString()
    };
    setIssues([newIssue, ...issues]);
    setShowIssueModal(false);
    setFormData({});
  };

  const handleCreateDelivery = (e: React.FormEvent) => {
    e.preventDefault();
    const newDelivery: Delivery = {
      id: Math.random().toString(36).substr(2, 9),
      material: formData.material,
      supplier: formData.supplier,
      quantity: Number(formData.quantity),
      unit: formData.unit,
      expectedDate: formData.expectedDate,
      invoiceNumber: formData.invoiceNumber,
      status: DeliveryStatus.SCHEDULED,
    };
    setDeliveries([newDelivery, ...deliveries]);
    setShowDeliveryModal(false);
    setFormData({});
  };

  const handleReceiveDelivery = (e: React.FormEvent) => {
    e.preventDefault();
    if (!showReceiveModal) return;

    const updatedDelivery: Delivery = {
      ...showReceiveModal,
      status: formData.status,
      receivedAt: new Date().toISOString(),
      receiverName: formData.receiverName,
      signature: formData.signature,
      receiptPhotos: formData.receiptPhotos || [],
    };

    setDeliveries(deliveries.map(d => d.id === updatedDelivery.id ? updatedDelivery : d));

    if (formData.status === DeliveryStatus.PROBLEM) {
      setFormData({
        title: `Problema no recebimento: ${updatedDelivery.material}`,
        description: `Recebimento com não conformidade.\nFornecedor: ${updatedDelivery.supplier}\nNota: ${updatedDelivery.invoiceNumber}\nMotivo: `,
        priority: Priority.HIGH,
        location: 'Almoxarifado Central',
        deadline: new Date().toISOString().split('T')[0], // Today
        requestedBy: currentUser?.name || 'Almoxarifado'
      });
      setShowReceiveModal(null);
      setTimeout(() => setShowIssueModal(true), 100); 
    } else {
      setShowReceiveModal(null);
      setFormData({});
    }
  };

  const handleIssueStatusUpdate = (issueId: string, newStatus: IssueStatus) => {
    setIssues(issues.map(i => i.id === issueId ? { ...i, status: newStatus } : i));
  };

  const handleResolveIssue = () => {
    if (!showResolveModal) return;
    const completionPhotos = formData.completionPhotos || [];
    const updatedIssue: Issue = {
      ...showResolveModal,
      status: IssueStatus.WAITING,
      completionPhotos: completionPhotos
    };
    setIssues(issues.map(i => i.id === updatedIssue.id ? updatedIssue : i));
    setShowResolveModal(null);
    setFormData({});
  };

  const handleRejectIssue = () => {
    if (!showRejectionModal) return;
    const updatedIssue: Issue = {
      ...showRejectionModal,
      status: IssueStatus.REJECTED,
      rejectionReason: formData.rejectionReason || "Motivo não informado"
    };
    setIssues(issues.map(i => i.id === updatedIssue.id ? updatedIssue : i));
    setShowRejectionModal(null);
    setFormData({});
  };

  const handleGenerateDescription = async () => {
    if (!formData.title || !formData.location) return;
    setIsGeneratingAI(true);
    const desc = await generateIssueDescription(formData.title, formData.location, formData.priority || Priority.MEDIUM);
    setFormData({ ...formData, description: desc });
    setIsGeneratingAI(false);
  };

  const clearFilters = () => {
    if (viewMode === 'issues') {
      setFilters({
        status: 'all',
        priority: 'all',
        assignee: 'all',
        deadline: ''
      });
    } else if (viewMode === 'logistics') {
      setLogisticsFilters({
        material: '',
        invoiceNumber: '',
        date: '',
        status: 'all'
      });
    }
    setShowFilterPanel(false);
  };

  const checkEngineeringAccess = () => {
    if (currentUser && currentUser.role === 'Engenharia') {
      setViewMode('engineering');
      setShowFilterPanel(false);
    } else {
      alert("Acesso restrito à equipe de Engenharia.");
    }
  };

  // --- Render Helpers ---

  const renderPhotoRow = (photos: string[] | undefined, label: string) => {
    if (!photos || photos.length === 0) return null;
    return (
      <div className="mt-3">
        <p className="text-xs text-gray-500 font-medium mb-1">{label}</p>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {photos.map((url, idx) => (
            <div key={idx} className="w-16 h-16 rounded-md overflow-hidden bg-gray-100 shrink-0 border border-gray-200">
              <img src={url} alt={`Evidência ${idx}`} className="w-full h-full object-cover" />
            </div>
          ))}
        </div>
      </div>
    );
  };

  // --- Views ---

  const renderIssueCard = (issue: Issue) => (
    <div key={issue.id} className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm mb-4 transition-all hover:shadow-md">
      <div className="flex justify-between items-start mb-2">
        <PriorityBadge priority={issue.priority} />
        <IssueStatusBadge status={issue.status} />
      </div>
      <h3 className="font-bold text-gray-900 text-lg leading-tight mb-1">{issue.title}</h3>
      <div className="flex items-center text-gray-500 text-sm mb-3">
        <MapPin size={14} className="mr-1" />
        {issue.location}
      </div>
      <p className="text-gray-600 text-sm mb-2 line-clamp-3">{issue.description}</p>
      
      {issue.status === IssueStatus.REJECTED && issue.rejectionReason && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-3">
          <div className="flex items-center gap-2 text-red-800 font-medium text-xs mb-1">
            <MessageSquareWarning size={14} />
            Motivo da Rejeição:
          </div>
          <p className="text-red-700 text-sm italic">"{issue.rejectionReason}"</p>
        </div>
      )}

      {renderPhotoRow(issue.photos, "Fotos da Pendência:")}
      {renderPhotoRow(issue.completionPhotos, "Fotos da Conclusão:")}

      <div className="flex items-center justify-between pt-3 mt-2 border-t border-gray-100">
        <div className="flex flex-col">
          <span className="text-xs text-gray-400 uppercase tracking-wide">Responsável</span>
          <span className="text-sm font-medium text-gray-800">{issue.assignee}</span>
        </div>
        <div className="flex flex-col items-end">
           {issue.requestedBy && (
              <span className="text-[10px] text-gray-500 mb-1 flex items-center gap-1">
                <UserIcon size={10} /> Solic.: {issue.requestedBy}
              </span>
           )}
          <span className="text-xs text-gray-400 uppercase tracking-wide">Prazo</span>
          <span className={`text-sm font-medium ${new Date(issue.deadline) < new Date() && issue.status !== IssueStatus.DONE ? 'text-red-600' : 'text-gray-800'}`}>
             {new Date(issue.deadline).toLocaleDateString('pt-BR')}
          </span>
        </div>
      </div>
      
      {(issue.status === IssueStatus.OPEN || issue.status === IssueStatus.REJECTED) && (
        <button 
          onClick={() => handleIssueStatusUpdate(issue.id, IssueStatus.IN_PROGRESS)}
          className={`mt-3 w-full py-2 text-sm font-medium rounded-lg transition-colors ${
            issue.status === IssueStatus.REJECTED 
              ? 'bg-red-50 text-red-700 hover:bg-red-100' 
              : 'bg-blue-50 text-blue-700 hover:bg-blue-100'
          }`}
        >
          {issue.status === IssueStatus.REJECTED ? 'Reiniciar Resolução' : 'Iniciar Resolução'}
        </button>
      )}
       {issue.status === IssueStatus.IN_PROGRESS && (
        <button 
          onClick={() => {
            setFormData({});
            setShowResolveModal(issue);
          }}
          className="mt-3 w-full py-2 bg-purple-50 text-purple-700 text-sm font-medium rounded-lg hover:bg-purple-100 transition-colors"
        >
          Solicitar Aprovação
        </button>
      )}
    </div>
  );

  const renderApprovalCard = (issue: Issue) => (
    <div key={issue.id} className="bg-white p-4 rounded-xl border border-l-4 border-l-purple-500 border-gray-200 shadow-sm mb-4">
      <div className="flex justify-between items-start mb-2">
        <PriorityBadge priority={issue.priority} />
        <span className="text-xs font-bold text-purple-700 bg-purple-50 px-2 py-1 rounded">
          Aguardando Engenharia
        </span>
      </div>
      <h3 className="font-bold text-gray-900 text-lg leading-tight mb-1">{issue.title}</h3>
      <div className="flex items-center text-gray-500 text-sm mb-3">
        <MapPin size={14} className="mr-1" />
        {issue.location}
      </div>
      <div className="bg-gray-50 p-3 rounded-lg mb-4 text-sm text-gray-700">
        <p className="font-medium text-gray-900 mb-1">Executado por: {issue.assignee}</p>
        <p className="font-medium text-gray-900 mb-1">Solicitado por: {issue.requestedBy || 'N/A'}</p>
        <p className="italic mb-2">"{issue.description}"</p>
      </div>
      
      <div className="grid grid-cols-2 gap-2 mb-4">
         <div className="border border-red-100 bg-red-50 rounded p-2">
            <span className="text-[10px] uppercase font-bold text-red-700 block mb-1">Antes</span>
            {issue.photos.length > 0 ? (
               <img src={issue.photos[0]} className="w-full h-24 object-cover rounded bg-white" alt="Antes" />
            ) : (
               <div className="w-full h-24 flex items-center justify-center text-gray-400 text-xs italic bg-white rounded">Sem foto</div>
            )}
         </div>
         <div className="border border-green-100 bg-green-50 rounded p-2">
            <span className="text-[10px] uppercase font-bold text-green-700 block mb-1">Depois</span>
            {issue.completionPhotos && issue.completionPhotos.length > 0 ? (
               <img src={issue.completionPhotos[0]} className="w-full h-24 object-cover rounded bg-white" alt="Depois" />
            ) : (
               <div className="w-full h-24 flex items-center justify-center text-gray-400 text-xs italic bg-white rounded">Sem foto</div>
            )}
         </div>
      </div>

      <div className="grid grid-cols-2 gap-3 pt-2">
        <Button 
          variant="danger" 
          onClick={() => {
             setFormData({});
             setShowRejectionModal(issue);
          }}
          className="flex items-center justify-center gap-1"
        >
          <ThumbsDown size={16} /> Rejeitar
        </Button>
        <Button 
          variant="primary" 
          onClick={() => handleIssueStatusUpdate(issue.id, IssueStatus.DONE)}
          className="bg-green-600 hover:bg-green-700 flex items-center justify-center gap-1"
        >
          <ThumbsUp size={16} /> Aprovar
        </Button>
      </div>
    </div>
  );

  const renderDeliveryCard = (delivery: Delivery) => (
    <div key={delivery.id} className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm mb-4">
      <div className="flex justify-between items-start mb-2">
        <DeliveryStatusBadge status={delivery.status} />
        <span className="text-xs text-gray-400 font-mono">
          {delivery.invoiceNumber ? `NF: ${delivery.invoiceNumber}` : `#${delivery.id}`}
        </span>
      </div>
      <h3 className="font-bold text-gray-900 text-lg mb-1">{delivery.quantity} {delivery.unit} de {delivery.material}</h3>
      <div className="flex items-center text-gray-500 text-sm mb-3">
        <Truck size={14} className="mr-1" />
        {delivery.supplier}
      </div>
      
      <div className="bg-gray-50 p-3 rounded-lg flex justify-between items-center">
        <div>
          <div className="text-xs text-gray-400">Previsão</div>
          <div className="text-sm font-medium">
            {new Date(delivery.expectedDate).toLocaleDateString('pt-BR')} {new Date(delivery.expectedDate).toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'})}
          </div>
        </div>
        {delivery.status === DeliveryStatus.SCHEDULED && (
          <Button 
            variant="primary" 
            className="text-sm py-1.5 px-3"
            onClick={() => {
              setFormData({ 
                status: DeliveryStatus.ARRIVED,
                receiverName: currentUser ? currentUser.name : ''
              });
              setShowReceiveModal(delivery);
            }}
          >
            Receber
          </Button>
        )}
      </div>
    </div>
  );

  const renderUserManagement = () => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-6">
      <div className="p-4 border-b bg-gray-50 flex justify-between items-center">
        <div className="flex items-center gap-2 text-gray-800">
           <Users size={20} />
           <h3 className="font-bold">Gestão de Usuários</h3>
        </div>
        <Button onClick={handleOpenAddUser} variant="primary" className="text-xs py-1 px-3 h-8">
           <Plus size={14} /> Novo
        </Button>
      </div>
      <div className="divide-y">
        {users.map(user => (
          <div key={user.id} className="p-3 flex justify-between items-center hover:bg-gray-50">
             <div className="flex items-center gap-3">
               <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xs uppercase">
                 {user.name.substr(0, 2)}
               </div>
               <div>
                 <div className="font-medium text-sm text-gray-900">{user.name} <span className="text-xs text-gray-500 font-normal">({user.role})</span></div>
                 <div className="text-xs text-gray-500 flex gap-2">
                   <span>@{user.username}</span>
                   <span className="text-gray-300">|</span>
                   <span className="text-blue-600 font-mono">Senha: {user.password}</span>
                 </div>
               </div>
             </div>
             {user.username !== 'engenharia' && (
                <div className="flex gap-2">
                  <button
                    onClick={() => handleOpenEditUser(user)}
                    className="text-gray-400 hover:text-blue-600 p-2"
                    title="Editar"
                  >
                    <Pencil size={16} />
                  </button>
                  <button 
                    onClick={() => handleDeleteUser(user.id)}
                    className="text-gray-400 hover:text-red-500 p-2"
                    title="Remover"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
             )}
          </div>
        ))}
      </div>
    </div>
  );

  const renderProfile = () => {
    if (!currentUser) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] p-6">
           <div className="w-20 h-20 bg-blue-600 rounded-2xl flex items-center justify-center text-white mb-6 shadow-xl transform -rotate-6">
              <HardHat size={40} />
           </div>
           <h2 className="text-2xl font-bold text-gray-800 mb-2">Bem-vindo(a)</h2>
           <p className="text-gray-500 text-center mb-8">Faça login para acessar o sistema House Garden</p>
           
           <form onSubmit={handleLogin} className="w-full max-w-xs space-y-4">
              <Input 
                label="Usuário" 
                placeholder="Ex: engenharia" 
                value={loginForm.username}
                onChange={e => setLoginForm({...loginForm, username: e.target.value})}
                autoFocus
              />
              <Input 
                label="Senha" 
                type="password" 
                placeholder="••••••" 
                value={loginForm.password}
                onChange={e => setLoginForm({...loginForm, password: e.target.value})}
              />
              {loginError && <p className="text-red-500 text-sm text-center">{loginError}</p>}
              <Button type="submit" className="w-full py-3">Entrar</Button>
           </form>
        </div>
      );
    }

    return (
      <div className="p-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="h-24 bg-gradient-to-r from-blue-600 to-blue-400"></div>
          <div className="px-6 pb-6 relative">
             <div className="w-20 h-20 bg-white rounded-full border-4 border-white absolute -top-10 left-6 flex items-center justify-center shadow-md">
                <div className="w-full h-full rounded-full bg-gray-100 flex items-center justify-center text-gray-400">
                   <UserIcon size={32} />
                </div>
             </div>
             <div className="mt-16">
                <h2 className="text-xl font-bold text-gray-900">{currentUser.name}</h2>
                <span className="inline-block bg-blue-50 text-blue-700 px-2 py-1 rounded-md text-xs font-semibold mt-1">
                  {currentUser.role}
                </span>
                <p className="text-gray-500 text-sm mt-2">Usuário: @{currentUser.username}</p>
             </div>
             
             <div className="mt-6 pt-6 border-t border-gray-100">
                <h4 className="text-sm font-semibold text-gray-700 mb-3">Permissões</h4>
                <div className="grid grid-cols-2 gap-2 text-sm text-gray-600">
                   <div className="flex items-center gap-2">
                     {currentUser.role === 'Engenharia' ? <CheckCircle2 size={14} className="text-green-500" /> : <X size={14} className="text-gray-300" />}
                     <span>Aprovar Pendências</span>
                   </div>
                   <div className="flex items-center gap-2">
                     {currentUser.role === 'Engenharia' ? <CheckCircle2 size={14} className="text-green-500" /> : <X size={14} className="text-gray-300" />}
                     <span>Gerenciar Usuários</span>
                   </div>
                   <div className="flex items-center gap-2">
                     <CheckCircle2 size={14} className="text-green-500" />
                     <span>Criar Pendências</span>
                   </div>
                   <div className="flex items-center gap-2">
                     {['Engenharia', 'Almoxarifado'].includes(currentUser.role) ? <CheckCircle2 size={14} className="text-green-500" /> : <X size={14} className="text-gray-300" />}
                     <span>Gerenciar Logística</span>
                   </div>
                </div>
             </div>

             <div className="mt-8">
               <Button variant="secondary" onClick={handleLogout} className="w-full text-red-600 hover:text-red-700 hover:bg-red-50 border-red-100">
                 <LogOut size={16} /> Sair da Conta
               </Button>
             </div>
          </div>
        </div>
        
        <div className="text-center mt-8 text-xs text-gray-400">
           House Garden Manager v1.0.2
        </div>
      </div>
    );
  };

  const getPageTitle = () => {
    switch(viewMode) {
      case 'issues': return 'Pendências da Obra';
      case 'logistics': return 'Logística e Materiais';
      case 'engineering': return 'Gestão de Engenharia';
      case 'profile': return 'Perfil do Usuário';
      default: return 'House Garden';
    }
  };

  const pendingApprovalsCount = issues.filter(i => i.status === IssueStatus.WAITING).length;
  const uniqueAssignees = Array.from(new Set(issues.map(i => i.assignee)));

  // Filter Logic
  const filteredIssues = issues.filter(issue => {
    if (viewMode === 'issues') {
       if (activeIssueTab === 'active' && issue.status === IssueStatus.DONE) return false;
       if (activeIssueTab === 'history' && issue.status !== IssueStatus.DONE) return false;
    }
    if (filters.status !== 'all' && issue.status !== filters.status) return false;
    if (filters.priority !== 'all' && issue.priority !== filters.priority) return false;
    if (filters.assignee !== 'all' && issue.assignee !== filters.assignee) return false;
    if (filters.deadline && issue.deadline > filters.deadline) return false;
    if (searchQuery) {
       const q = searchQuery.toLowerCase();
       return issue.title.toLowerCase().includes(q) || issue.assignee.toLowerCase().includes(q);
    }
    return true;
  }).sort((a, b) => {
     const pMap = { [Priority.HIGH]: 3, [Priority.MEDIUM]: 2, [Priority.LOW]: 1 };
     if (pMap[b.priority] !== pMap[a.priority]) return pMap[b.priority] - pMap[a.priority];
     return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
  });

  const filteredDeliveries = deliveries.filter(d => {
    if (logisticsFilters.material && !d.material.toLowerCase().includes(logisticsFilters.material.toLowerCase())) return false;
    if (logisticsFilters.invoiceNumber && !d.invoiceNumber?.toLowerCase().includes(logisticsFilters.invoiceNumber.toLowerCase())) return false;
    if (logisticsFilters.date && !d.expectedDate.startsWith(logisticsFilters.date)) return false;
    if (logisticsFilters.status !== 'all' && d.status !== logisticsFilters.status) return false;
    if (searchQuery) {
       const q = searchQuery.toLowerCase();
       return d.material.toLowerCase().includes(q) || d.supplier.toLowerCase().includes(q);
    }
    return true;
  }).sort((a, b) => new Date(a.expectedDate).getTime() - new Date(b.expectedDate).getTime());

  const activeFilterCount = viewMode === 'issues' ? Object.values(filters).filter(v => v !== 'all' && v !== '').length : Object.values(logisticsFilters).filter(v => v !== 'all' && v !== '').length;

  return (
    <div className="min-h-screen pb-20 max-w-md mx-auto bg-gray-50 relative shadow-2xl overflow-hidden">
      
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-30 px-4 py-3 flex items-center justify-between h-16 transition-all">
        {isSearchActive ? (
          <div className="flex-1 flex items-center gap-2 animate-in fade-in duration-200 w-full">
            <Search size={20} className="text-gray-400 shrink-0" />
            <input 
              type="text"
              autoFocus
              placeholder="Pesquisar..."
              className="flex-1 bg-transparent border-none focus:ring-0 text-gray-800 placeholder-gray-400 text-base outline-none"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <button onClick={() => { setIsSearchActive(false); setSearchQuery(''); }} className="p-2 text-gray-500 hover:bg-gray-100 rounded-full"><X size={20} /></button>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold">H</div>
              <h1 className="text-xl font-bold text-slate-800">House Garden</h1>
            </div>
            <div className="flex items-center gap-3">
              {isOffline && <span className="flex items-center text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded-full border border-amber-200"><AlertTriangle size={12} className="mr-1" /> Offline</span>}
              {viewMode !== 'profile' && (
                <button onClick={() => setIsSearchActive(true)} className="p-2 text-gray-400 hover:bg-gray-100 rounded-full"><Search size={20} /></button>
              )}
            </div>
          </>
        )}
      </header>

      {/* Main Content */}
      <main className="p-4">
        {viewMode !== 'profile' && (
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-700">{isSearchActive && searchQuery ? 'Resultados' : getPageTitle()}</h2>
            {(viewMode === 'issues' || viewMode === 'logistics') && (
              <button 
                onClick={() => setShowFilterPanel(!showFilterPanel)}
                className={`p-2 border rounded-lg shadow-sm transition-colors relative ${showFilterPanel || activeFilterCount > 0 ? 'bg-blue-50 border-blue-200 text-blue-600' : 'bg-white text-gray-600'}`}
              >
                <Filter size={18} />
                {activeFilterCount > 0 && <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white"></span>}
              </button>
            )}
          </div>
        )}

        {/* Sub Tabs */}
        {viewMode === 'issues' && !searchQuery && (
          <div className="flex p-1 bg-gray-200 rounded-xl mb-6 mx-1">
             <button onClick={() => setActiveIssueTab('active')} className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all ${activeIssueTab === 'active' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}><ClipboardCheck size={16} /> Pendentes</button>
             <button onClick={() => setActiveIssueTab('history')} className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all ${activeIssueTab === 'history' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}><History size={16} /> Histórico</button>
          </div>
        )}

        {/* Filter Panel */}
        {showFilterPanel && (
          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm mb-6 animate-in slide-in-from-top-2">
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-semibold text-gray-800 text-sm">{viewMode === 'issues' ? 'Filtrar Pendências' : 'Filtrar Entregas'}</h3>
              <button onClick={clearFilters} className="text-xs text-blue-600 hover:underline">Limpar</button>
            </div>
            {viewMode === 'issues' ? (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <Select label="Status" value={filters.status} onChange={e => setFilters({...filters, status: e.target.value})}>
                    <option value="all">Todos</option>
                    {Object.values(IssueStatus).filter(s => activeIssueTab === 'active' ? s !== IssueStatus.DONE : s === IssueStatus.DONE).map(s => <option key={s} value={s}>{s}</option>)}
                  </Select>
                  <Select label="Prioridade" value={filters.priority} onChange={e => setFilters({...filters, priority: e.target.value})}>
                    <option value="all">Todas</option>
                    {Object.values(Priority).map(p => <option key={p} value={p}>{p}</option>)}
                  </Select>
                </div>
                <div className="grid grid-cols-1 gap-3">
                  <Select label="Responsável" value={filters.assignee} onChange={e => setFilters({...filters, assignee: e.target.value})}>
                    <option value="all">Todos</option>
                    {uniqueAssignees.map(a => <option key={a} value={a}>{a}</option>)}
                  </Select>
                   <Input label="Prazo até" type="date" value={filters.deadline} onChange={e => setFilters({...filters, deadline: e.target.value})} />
                </div>
              </>
            ) : (
              <>
                <Input label="Produto" value={logisticsFilters.material} onChange={e => setLogisticsFilters({...logisticsFilters, material: e.target.value})} />
                <div className="grid grid-cols-2 gap-3">
                   <Input label="Nota Fiscal" value={logisticsFilters.invoiceNumber} onChange={e => setLogisticsFilters({...logisticsFilters, invoiceNumber: e.target.value})} />
                   <Input label="Data" type="date" value={logisticsFilters.date} onChange={e => setLogisticsFilters({...logisticsFilters, date: e.target.value})} />
                </div>
                 <Select label="Status" value={logisticsFilters.status} onChange={e => setLogisticsFilters({...logisticsFilters, status: e.target.value})}>
                    <option value="all">Todos</option>
                    {Object.values(DeliveryStatus).map(s => <option key={s} value={s}>{s}</option>)}
                  </Select>
              </>
            )}
            <div className="mt-2 pt-2 border-t flex justify-end">
               <button onClick={() => setShowFilterPanel(false)} className="text-sm bg-gray-100 text-gray-700 px-4 py-2 rounded-lg font-medium hover:bg-gray-200">Fechar</button>
            </div>
          </div>
        )}

        {/* --- View Content --- */}

        {/* PROFILE */}
        {viewMode === 'profile' && renderProfile()}

        {/* ENGINEERING */}
        {viewMode === 'engineering' && (
          <div className="space-y-4">
             {renderUserManagement()}
             <h3 className="font-bold text-gray-700 mb-2">Aprovações Pendentes</h3>
             {issues.filter(i => i.status === IssueStatus.WAITING).map(renderApprovalCard)}
             {issues.filter(i => i.status === IssueStatus.WAITING).length === 0 && (
                <div className="text-center py-8 text-gray-400 bg-white rounded-xl border border-dashed border-gray-300">
                  <CheckCircle2 size={32} className="mx-auto mb-2 opacity-50" />
                  <p>Nenhuma aprovação pendente.</p>
                </div>
             )}
          </div>
        )}

        {/* ISSUES LIST */}
        {viewMode === 'issues' && (
          <div className="space-y-4">
             {filteredIssues.map(renderIssueCard)}
             {filteredIssues.length === 0 && (
               <div className="text-center py-10 text-gray-400">
                 <Archive size={48} className="mx-auto mb-2 opacity-20" />
                 <p>Nenhuma pendência encontrada.</p>
               </div>
             )}
          </div>
        )}

        {/* LOGISTICS LIST */}
        {viewMode === 'logistics' && (
           <div className="space-y-4">
            {filteredDeliveries.map(renderDeliveryCard)}
             {filteredDeliveries.length === 0 && (
               <div className="text-center py-10 text-gray-400">
                 <Search size={48} className="mx-auto mb-2 opacity-20" />
                 <p>Nenhuma entrega encontrada.</p>
               </div>
             )}
          </div>
        )}
      </main>

      {/* Floating Action Button */}
      {viewMode !== 'engineering' && viewMode !== 'profile' && !(viewMode === 'issues' && activeIssueTab === 'history') && (
        <div className="fixed bottom-24 right-4 z-40">
          <button 
            onClick={() => {
               if (!currentUser) {
                 alert("Por favor, faça login para criar novos itens.");
                 setViewMode('profile');
                 return;
               }
               viewMode === 'issues' ? setShowIssueModal(true) : setShowDeliveryModal(true);
            }}
            className="bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-full shadow-lg transition-transform hover:scale-105 active:scale-95 flex items-center justify-center"
          >
            <Plus size={24} />
          </button>
        </div>
      )}

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex justify-around py-3 z-30 max-w-md mx-auto">
        <button 
          onClick={() => { setViewMode('issues'); setShowFilterPanel(false); }}
          className={`flex flex-col items-center gap-1 ${viewMode === 'issues' ? 'text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
        >
          <ClipboardCheck size={24} strokeWidth={viewMode === 'issues' ? 2.5 : 2} />
          <span className="text-[10px] font-medium">Qualidade</span>
        </button>
        
        <button 
          onClick={checkEngineeringAccess}
          className={`relative flex flex-col items-center gap-1 ${viewMode === 'engineering' ? 'text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
        >
          <div className="relative">
             <Shield size={24} strokeWidth={viewMode === 'engineering' ? 2.5 : 2} />
            {pendingApprovalsCount > 0 && currentUser?.role === 'Engenharia' && (
              <span className="absolute -top-1 -right-2 bg-red-500 text-white text-[9px] w-4 h-4 flex items-center justify-center rounded-full">
                {pendingApprovalsCount}
              </span>
            )}
          </div>
          <span className="text-[10px] font-medium">Engenharia</span>
        </button>

        <button 
          onClick={() => { setViewMode('logistics'); setShowFilterPanel(false); }}
          className={`flex flex-col items-center gap-1 ${viewMode === 'logistics' ? 'text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
        >
          <Truck size={24} strokeWidth={viewMode === 'logistics' ? 2.5 : 2} />
          <span className="text-[10px] font-medium">Logística</span>
        </button>

         <button 
          onClick={() => { setViewMode('profile'); setShowFilterPanel(false); }}
          className={`flex flex-col items-center gap-1 ${viewMode === 'profile' ? 'text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
        >
          <UserIcon size={24} strokeWidth={viewMode === 'profile' ? 2.5 : 2} />
          <span className="text-[10px] font-medium">Perfil</span>
        </button>
      </nav>

      {/* --- MODALS --- */}

      {/* Add/Edit User Modal */}
      {showUserModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
           <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl p-6">
             <h3 className="text-xl font-bold mb-4">{editingUser ? 'Editar Usuário' : 'Adicionar Usuário'}</h3>
             <form onSubmit={handleSaveUser}>
               <Input label="Nome" value={formData.name || ''} onChange={e => setFormData({...formData, name: e.target.value})} required />
               <Input label="Usuário (Login)" value={formData.username || ''} onChange={e => setFormData({...formData, username: e.target.value})} required />
               <Input label="Senha" type="password" value={formData.password || ''} onChange={e => setFormData({...formData, password: e.target.value})} required />
               <Input label="Cargo / Função" placeholder="Ex: Engenharia, Mestre, Almox..." value={formData.role || ''} onChange={e => setFormData({...formData, role: e.target.value})} required />
               <div className="flex gap-2 mt-4">
                 <Button type="button" variant="secondary" className="flex-1" onClick={() => setShowUserModal(false)}>Cancelar</Button>
                 <Button type="submit" className="flex-1">Salvar</Button>
               </div>
             </form>
           </div>
        </div>
      )}

      {/* Resolve Issue Modal */}
      {showResolveModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 backdrop-blur-sm">
          <div className="bg-white w-full max-w-md h-auto rounded-t-2xl sm:rounded-2xl flex flex-col shadow-2xl">
             <div className="p-4 border-b flex justify-between items-center bg-purple-50">
              <h3 className="font-bold text-lg text-purple-900">Registrar Solução</h3>
              <button onClick={() => setShowResolveModal(null)} className="text-purple-900"><X /></button>
            </div>
            <div className="p-5 flex-1 overflow-y-auto">
              <p className="text-sm text-gray-600 mb-4">
                Você está marcando a pendência <strong>"{showResolveModal.title}"</strong> como resolvida. Por favor, adicione uma foto do trabalho concluído.
              </p>
               <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Foto da Conclusão</label>
                 <label htmlFor="resolve-photo-upload" className="w-full h-40 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center text-gray-400 bg-gray-50 hover:bg-gray-100 cursor-pointer relative">
                    <input id="resolve-photo-upload" type="file" accept="image/*" className="hidden" onChange={(e) => handlePhotoUpload(e, 'completionPhotos')} />
                    <Camera size={32} />
                    <span className="text-sm mt-2 font-medium">Toque para adicionar foto</span>
                 </label>
                 {formData.completionPhotos && formData.completionPhotos.length > 0 && (
                   <div className="flex gap-2 mt-3 overflow-x-auto">
                     {formData.completionPhotos.map((photo: string, index: number) => (
                       <div key={index} className="relative w-20 h-20 shrink-0">
                         <img src={photo} className="w-full h-full object-cover rounded-lg border border-gray-200" />
                         <button type="button" onClick={() => removePhoto('completionPhotos', index)} className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-1"><X size={10} /></button>
                       </div>
                     ))}
                   </div>
                 )}
              </div>
            </div>
            <div className="p-4 border-t bg-gray-50 flex gap-3">
              <Button variant="secondary" className="flex-1" onClick={() => setShowResolveModal(null)}>Cancelar</Button>
              <Button variant="primary" className="flex-1 bg-purple-600 hover:bg-purple-700" onClick={handleResolveIssue}>Enviar para Aprovação</Button>
            </div>
          </div>
        </div>
      )}

      {/* Rejection Modal */}
      {showRejectionModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 backdrop-blur-sm">
          <div className="bg-white w-full max-w-md h-auto rounded-t-2xl sm:rounded-2xl flex flex-col shadow-2xl">
             <div className="p-4 border-b flex justify-between items-center bg-red-50">
              <h3 className="font-bold text-lg text-red-900">Rejeitar Pendência</h3>
              <button onClick={() => setShowRejectionModal(null)} className="text-red-900"><X /></button>
            </div>
            <div className="p-5 flex-1 overflow-y-auto">
              <p className="text-sm text-gray-600 mb-4">
                Você está rejeitando a entrega da pendência <strong>"{showRejectionModal.title}"</strong>. Informe o motivo.
              </p>
              <TextArea label="Motivo da Rejeição" rows={3} value={formData.rejectionReason || ''} onChange={e => setFormData({...formData, rejectionReason: e.target.value})} />
            </div>
            <div className="p-4 border-t bg-gray-50 flex gap-3">
              <Button variant="secondary" className="flex-1" onClick={() => setShowRejectionModal(null)}>Cancelar</Button>
              <Button variant="danger" className="flex-1" onClick={handleRejectIssue}>Confirmar</Button>
            </div>
          </div>
        </div>
      )}

      {/* Issue Modal */}
      {showIssueModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 backdrop-blur-sm">
          <div className="bg-white w-full max-w-md h-[90vh] sm:h-auto sm:max-h-[85vh] rounded-t-2xl sm:rounded-2xl flex flex-col shadow-2xl overflow-hidden">
            <div className="p-4 border-b flex justify-between items-center bg-gray-50">
              <h3 className="font-bold text-lg">Nova Pendência</h3>
              <button onClick={() => setShowIssueModal(false)} className="text-gray-500"><X /></button>
            </div>
            <form onSubmit={handleCreateIssue} className="p-5 overflow-y-auto flex-1 no-scrollbar">
              <Input label="Título Curto" value={formData.title || ''} onChange={e => setFormData({...formData, title: e.target.value})} required />
              <div className="grid grid-cols-2 gap-4 mb-3">
                 <Select label="Solicitado por" value={formData.requestedBy || (currentUser ? currentUser.name : '')} onChange={e => setFormData({...formData, requestedBy: e.target.value})} required>
                    <option value="">Selecione...</option>
                    {users.map(u => <option key={u.id} value={u.name}>{u.name}</option>)}
                  </Select>
                 <Select label="Prioridade" value={formData.priority || Priority.MEDIUM} onChange={e => setFormData({...formData, priority: e.target.value})}>
                    {Object.values(Priority).map(p => <option key={p} value={p}>{p}</option>)}
                  </Select>
              </div>
              <div className="mb-3">
                  <Input label="Data Limite" type="date" value={formData.deadline || ''} onChange={e => setFormData({...formData, deadline: e.target.value})} required />
              </div>
              <Input label="Localização" value={formData.location || ''} onChange={e => setFormData({...formData, location: e.target.value})} required />
              <div className="relative">
                <TextArea label="Descrição Detalhada" rows={4} value={formData.description || ''} onChange={e => setFormData({...formData, description: e.target.value})} placeholder="Descreva o problema..." />
                <button type="button" onClick={handleGenerateDescription} disabled={!formData.title || !formData.location || isGeneratingAI} className="absolute top-0 right-0 text-xs flex items-center gap-1 text-purple-600 bg-purple-50 px-2 py-1 rounded-full border border-purple-100 hover:bg-purple-100 disabled:opacity-50">
                  <Sparkles size={12} /> {isGeneratingAI ? 'Gerando...' : 'Gerar com IA'}
                </button>
              </div>
              <Input label="Responsável" value={formData.assignee || ''} onChange={e => setFormData({...formData, assignee: e.target.value})} required />
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Fotos / Anexos</label>
                <div className="flex gap-2 flex-wrap">
                  <label htmlFor="issue-photo-upload" className="w-16 h-16 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center text-gray-400 hover:border-blue-500 hover:text-blue-500 cursor-pointer">
                    <input id="issue-photo-upload" type="file" accept="image/*" multiple className="hidden" onChange={(e) => handlePhotoUpload(e, 'photos')} />
                    <Camera size={20} /> <span className="text-[10px] mt-1">Add</span>
                  </label>
                  {formData.photos && formData.photos.map((photo: string, index: number) => (
                    <div key={index} className="w-16 h-16 bg-gray-200 rounded-lg overflow-hidden relative border border-gray-200">
                      <img src={photo} alt="Preview" className="w-full h-full object-cover" />
                      <button type="button" onClick={() => removePhoto('photos', index)} className="absolute top-0 right-0 bg-black/50 text-white p-0.5"><X size={10} /></button>
                    </div>
                  ))}
                </div>
              </div>
            </form>
            <div className="p-4 border-t bg-gray-50 flex gap-3">
              <Button variant="secondary" className="flex-1" onClick={() => setShowIssueModal(false)}>Cancelar</Button>
              <Button variant="primary" className="flex-1" onClick={handleCreateIssue}>Salvar</Button>
            </div>
          </div>
        </div>
      )}

      {/* Delivery Modal */}
      {showDeliveryModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 backdrop-blur-sm">
          <div className="bg-white w-full max-w-md h-auto rounded-t-2xl sm:rounded-2xl flex flex-col shadow-2xl">
            <div className="p-4 border-b flex justify-between items-center bg-gray-50">
              <h3 className="font-bold text-lg">Agendar Entrega</h3>
              <button onClick={() => setShowDeliveryModal(false)} className="text-gray-500"><X /></button>
            </div>
            <form onSubmit={handleCreateDelivery} className="p-5 flex-1 overflow-y-auto max-h-[70vh] no-scrollbar">
              <Input label="Material" value={formData.material || ''} onChange={e => setFormData({...formData, material: e.target.value})} required />
              <Input label="Fornecedor / Transportadora" value={formData.supplier || ''} onChange={e => setFormData({...formData, supplier: e.target.value})} required />
              <div className="grid grid-cols-2 gap-4">
                <Input label="Quantidade" type="number" value={formData.quantity || ''} onChange={e => setFormData({...formData, quantity: e.target.value})} required />
                 <Input label="Unidade" value={formData.unit || ''} onChange={e => setFormData({...formData, unit: e.target.value})} required />
              </div>
              <Input label="Data e Hora Prevista" type="datetime-local" value={formData.expectedDate || ''} onChange={e => setFormData({...formData, expectedDate: e.target.value})} required />
              <Input label="Nota Fiscal (Opcional)" value={formData.invoiceNumber || ''} onChange={e => setFormData({...formData, invoiceNumber: e.target.value})} />
            </form>
            <div className="p-4 border-t bg-gray-50 flex gap-3">
              <Button variant="secondary" className="flex-1" onClick={() => setShowDeliveryModal(false)}>Cancelar</Button>
              <Button variant="primary" className="flex-1" onClick={handleCreateDelivery}>Agendar</Button>
            </div>
          </div>
        </div>
      )}

      {/* Receive Modal */}
      {showReceiveModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 backdrop-blur-sm">
          <div className="bg-white w-full max-w-md h-auto rounded-t-2xl sm:rounded-2xl flex flex-col shadow-2xl">
            <div className="p-4 border-b flex justify-between items-center bg-gray-50">
              <h3 className="font-bold text-lg">Recebimento de Material</h3>
              <button onClick={() => setShowReceiveModal(null)} className="text-gray-500"><X /></button>
            </div>
            <form onSubmit={handleReceiveDelivery} className="p-5 flex-1 overflow-y-auto max-h-[75vh] no-scrollbar">
              <div className="mb-4 bg-blue-50 p-3 rounded-lg border border-blue-100">
                <p className="font-bold text-blue-900">{showReceiveModal.material}</p>
                <p className="text-sm text-blue-700">{showReceiveModal.quantity} {showReceiveModal.unit} • {showReceiveModal.supplier}</p>
              </div>

              <div className="mb-4">
                 <label className="block text-sm font-medium text-gray-700 mb-2">Conferência</label>
                 <div className="grid grid-cols-2 gap-2">
                   <button
                     type="button"
                     onClick={() => setFormData({...formData, status: DeliveryStatus.CHECKED})}
                     className={`p-3 rounded-lg border flex flex-col items-center gap-2 transition-all ${formData.status === DeliveryStatus.CHECKED ? 'bg-green-50 border-green-500 text-green-700 ring-1 ring-green-500' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                   >
                     <CheckCircle2 size={24} />
                     <span className="text-sm font-bold">Tudo Certo</span>
                   </button>
                   <button
                     type="button"
                     onClick={() => setFormData({...formData, status: DeliveryStatus.PROBLEM})}
                     className={`p-3 rounded-lg border flex flex-col items-center gap-2 transition-all ${formData.status === DeliveryStatus.PROBLEM ? 'bg-red-50 border-red-500 text-red-700 ring-1 ring-red-500' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                   >
                     <AlertTriangle size={24} />
                     <span className="text-sm font-bold">Com Problema</span>
                   </button>
                 </div>
              </div>

              <Select label="Recebido Por" value={formData.receiverName || ''} onChange={e => setFormData({...formData, receiverName: e.target.value})} required>
                  <option value="">Selecione...</option>
                  <option value="Antônio">Antônio</option>
                  <option value="Izaias">Izaias</option>
                  {users.filter(u => !['Antônio', 'Izaias'].includes(u.name)).map(u => (
                    <option key={u.id} value={u.name}>{u.name}</option>
                  ))}
              </Select>
              
               <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Foto da Nota / Material</label>
                 <label htmlFor="delivery-photo-upload" className="w-full h-32 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center text-gray-400 bg-gray-50 hover:bg-gray-100 cursor-pointer relative">
                    <input id="delivery-photo-upload" type="file" accept="image/*" className="hidden" onChange={(e) => handlePhotoUpload(e, 'receiptPhotos')} />
                    <Camera size={28} />
                    <span className="text-sm mt-2 font-medium">Adicionar Foto</span>
                 </label>
                 {formData.receiptPhotos && formData.receiptPhotos.length > 0 && (
                   <div className="flex gap-2 mt-3 overflow-x-auto">
                     {formData.receiptPhotos.map((photo: string, index: number) => (
                       <div key={index} className="relative w-20 h-20 shrink-0">
                         <img src={photo} className="w-full h-full object-cover rounded-lg border border-gray-200" />
                         <button type="button" onClick={() => removePhoto('receiptPhotos', index)} className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-1"><X size={10} /></button>
                       </div>
                     ))}
                   </div>
                 )}
              </div>

              <div className="mb-2">
                <SignaturePad 
                  onEnd={(data) => setFormData({...formData, signature: data})} 
                  onClear={() => setFormData({...formData, signature: null})}
                />
              </div>

            </form>
            <div className="p-4 border-t bg-gray-50 flex gap-3">
              <Button variant="secondary" className="flex-1" onClick={() => setShowReceiveModal(null)}>Cancelar</Button>
              <Button variant="primary" className="flex-1" onClick={handleReceiveDelivery} disabled={!formData.status || !formData.receiverName}>Confirmar</Button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export enum Priority {
  LOW = 'Baixa',
  MEDIUM = 'Média',
  HIGH = 'Alta',
}

export enum IssueStatus {
  OPEN = 'Aberto',
  IN_PROGRESS = 'Em Resolução',
  WAITING = 'Aguardando Aprovação',
  DONE = 'Resolvido',
  REJECTED = 'Reaberto',
}

export interface Issue {
  id: string;
  title: string;
  description: string;
  priority: Priority;
  assignee: string;
  requestedBy?: string; // Quem solicitou a demanda
  deadline: string;
  location: string;
  photos: string[]; // Base64 strings (Evidências do problema)
  completionPhotos?: string[]; // Base64 strings (Evidências da solução)
  rejectionReason?: string; // Motivo da rejeição pela engenharia
  status: IssueStatus;
  createdAt: string;
}

export enum DeliveryStatus {
  SCHEDULED = 'Agendada',
  ARRIVED = 'Chegou',
  CHECKED = 'Conferido e OK',
  PROBLEM = 'Problema / Não Conformidade',
}

export interface Delivery {
  id: string;
  material: string;
  supplier: string;
  quantity: number;
  unit: string;
  expectedDate: string;
  invoiceNumber?: string;
  status: DeliveryStatus;
  receivedAt?: string;
  receiverName?: string;
  signature?: string; // Base64 data URL
  receiptPhotos?: string[];
  linkedIssueId?: string; // If a problem occurred
}

export interface User {
  id: string;
  name: string;
  username: string; // Para login
  password?: string;
  role: string; // Texto livre (Ex: Engenharia, Mestre, Visitante...)
  avatar?: string; // URL opcional
}

export type ViewMode = 'issues' | 'logistics' | 'engineering' | 'profile';
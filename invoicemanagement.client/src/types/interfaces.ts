import { InvoiceStatus, LPOStatus, CurrencyType } from './enums';

export interface DocumentAttachment {
  id: number;
  fileName: string;
  originalFileName: string;
  filePath: string;
  fileType: string;
  fileSize: number;
  contentType: string;
  description?: string;
  uploadDate: Date;
  uploadedBy: string;
  invoiceId?: number;
  projectId?: number;
  lpoId?: number;
  createdAt: Date;
  createdBy: string;
  modifiedAt?: Date;
  modifiedBy?: string;
}

export interface StatusHistory {
  id: number;
  status: InvoiceStatus;
  date: Date;
  updatedBy: string;
  comments?: string;
  invoiceId: number;
  createdAt: Date;
  createdBy: string;
  modifiedAt?: Date;
  modifiedBy?: string;
}

export interface Vendor {
  id: number;
  name: string;
  contactPerson?: string;
  email?: string;
  phone?: string;
  mobile?: string;
  website?: string;
  address?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  taxId?: string;
  bankName?: string;
  bankAccountNumber?: string;
  iban?: string;
  swiftCode?: string;
  category?: string;
  vendorCode?: string;
  specialty?: string;
  serviceType?: string;
  industryType?: string;
  isActive: boolean;
  notes?: string;
  createdAt: Date;
  createdBy: string;
  modifiedAt?: Date;
  modifiedBy?: string;
}

export interface PaymentPlanLine {
  year: number;
  amount: number;
  currency: CurrencyType;
  paymentType: string;
  description?: string;
}

interface Section {
  id: number;
  name: string;
  abbreviation: string;
  departmentNameEnglish: string;
}

export interface Project {
  id: number;
  projectNumber: string;
  poNumber?: string;
  name: string;
  description: string;
  projectManagerId: number;
  budget?: number;
  cost?: number;
  isApproved: boolean;
  approvalDate?: Date;
  approvedBy?: string;
  rejectionReason?: string;
  expectedStart?: Date | null;
  expectedEnd?: Date | null;
  actualStartDate?: Date | null;
  actualEndDate?: Date | null;
  tenderDate?: Date | null;
  sectionId: number;
  section: Section;
  paymentPlanLines?: PaymentPlanLine[];
  createdAt: Date;
  createdBy: string;
  modifiedAt?: Date;
  modifiedBy?: string;
  status?: string;
}

export interface ProjectApi {
  getAll: () => Promise<Project[]>;
  getById: (id: number) => Promise<Project>;
  getByNumber: (projectNumber: string) => Promise<Project>;
  create: (project: Project) => Promise<Project>;
  update: (id: number, project: Project) => Promise<Project>;
  delete: (id: number) => Promise<void>;
  approve: (id: number, poNumber: string) => Promise<void>;
  reject: (id: number, reason: string) => Promise<void>;
  requestDeletion: (id: number) => Promise<void>;
  approveDeletion: (id: number) => Promise<void>;
  rejectDeletion: (id: number, reason: string) => Promise<void>;
  getProjectsBySection: (sectionId: number) => Promise<Project[]>;
  getProjectsByManager: (managerId: number) => Promise<Project[]>;
  getProjectBudget: (id: number) => Promise<number>;
  getProjectSpend: (id: number) => Promise<number>;
  updateStatus: (id: number, status: string) => Promise<void>;
  updateCost: (id: number, cost: number) => Promise<void>;
  getCompletion: (id: number) => Promise<number>;
  updateApprovalStatus: (id: number, data: {
    isApproved: boolean;
    poNumber?: string;
    rejectionReason?: string;
    approvedBy?: string;
    approvalDate?: string;
  }) => Promise<void>;
}

export interface LPO {
  id: number;
  lpoNumber: string;
  description: string;
  issueDate: Date;
  status: LPOStatus;
  totalAmount: number;
  currency: CurrencyType;
  remainingAmount?: number;
  startDate: Date;
  completionDate: Date;
  projectId: number;
  vendorId?: number;
  project: Project;
  vendor?: Vendor;
  createdAt: Date;
  createdBy: string;
  modifiedAt?: Date;
  modifiedBy?: string;
}

export interface Invoice {
  id: number;
  // Essential Invoice Information
  invoiceNumber: string;
  invoiceDate: Date;
  invoiceValue: number;
  currency: CurrencyType;
  dueDate?: Date;
  subject?: string;
  referenceNumber?: string;
  
  // Processing Information
  status: InvoiceStatus;
  receiveDate?: Date;
  processedBy?: string;
  processedDate?: Date;
  paymentDate?: Date;
  paidAmount?: number;
  
  // Vendor Information
  vendorName?: string;
  vendorId?: number;
  vendor?: Vendor;
  
  // Project Information
  projectReference?: string;
  projectId?: number;
  project?: Project;
  
  // LPO Information
  lpoId?: number;
  lpo?: LPO;
  
  // Document Information
  filePath: string;
  fileName: string;
  fileType: string;
  fileSize?: number;
  
  // Additional Information
  remark?: string;
  isPotentialDuplicate: boolean;
  duplicateOfInvoiceId?: number;
  
  // Audit Fields
  createdAt: Date;
  createdBy: string;
  modifiedAt?: Date;
  modifiedBy?: string;
  
  // Related Collections
  attachments?: DocumentAttachment[];
  statusHistory?: StatusHistory[];
}

export interface OcrResult {
    // Invoice Details
    invoiceNumber: string;
    invoiceDate?: Date;
    invoiceValue?: number;
    currency?: CurrencyType;
    dueDate?: Date;
    
    // Financial Information
    subTotal?: number;
    taxAmount?: number;
    totalAmount?: number;
    taxRate?: string;
    
    // Vendor Information
    vendorName: string;
    vendorTaxId: string;
    vendorAddress?: string;
    vendorPhone?: string;
    vendorEmail?: string;
    
    // Customer Information
    customerName?: string;
    customerNumber?: string;
    billingAddress?: string;
    shippingAddress?: string;
    
    // Additional Information
    purchaseOrderNumber?: string;
    paymentTerms?: string;
    referenceNumber?: string;
    description?: string;
    remark?: string;
    
    // Processing Information
    confidenceScore: number;
    isProcessed: boolean;
    errorMessage?: string;
    
    // Raw OCR Data
    rawText: string;
    fieldConfidenceScores: Record<string, number>;
} 
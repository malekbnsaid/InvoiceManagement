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

export interface Project {
  id: number;
  projectNumber: string;
  name: string;
  description: string;
  projectManagerId: number;
  budget?: number;
  cost?: number;
  isApproved: boolean;
  expectedStart?: Date;
  expectedEnd?: Date;
  sectionId: number;
  section: {
    id: number;
    name: string;
    abbreviation: string;
  };
  createdAt: Date;
  createdBy: string;
  modifiedAt?: Date;
  modifiedBy?: string;
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
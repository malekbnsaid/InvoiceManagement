import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  PhoneIcon, 
  EnvelopeIcon, 
  GlobeAltIcon,
  MapPinIcon,
  CreditCardIcon,
  CalculatorIcon,
  DocumentTextIcon,
  ClockIcon,
  BanknotesIcon
} from '@heroicons/react/24/outline';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Badge } from '../ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Button } from '../ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";

// Utility function to format currency
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(amount);
};

// Status badge styles
const getStatusColor = (status: string) => {
  switch (status) {
    case 'paid':
      return 'bg-green-100 text-green-800 border-green-200';
    case 'pending':
      return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case 'approved':
      return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'overdue':
      return 'bg-red-100 text-red-800 border-red-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

// Mock data for vendor
const vendorData = {
  id: 'V-001',
  name: 'Tech Solutions Inc.',
  logo: '',
  contact: {
    name: 'John Smith',
    email: 'john.smith@techsolutions.com',
    phone: '+1 (555) 123-4567',
    website: 'https://techsolutions.com'
  },
  address: {
    street: '123 Technology Park',
    city: 'San Francisco',
    state: 'CA',
    zip: '94105',
    country: 'USA'
  },
  financials: {
    paymentTerms: 'Net 30',
    taxId: 'TX-123456789',
    bankAccountNo: '****5678',
    yearToDateSpend: 45780.25,
    openInvoicesAmount: 12500.50,
    averagePaymentTime: 28
  },
  category: ['IT Equipment', 'Software Licensing'],
  rating: 4.5,
  relationshipSince: '2019-03-15',
  status: 'active',
  notes: 'Primary supplier for IT hardware and software licenses. Negotiated volume discount in Q1 2023.'
};

// Mock data for vendor invoices
const vendorInvoices = [
  {
    id: 'INV-001',
    date: '2023-11-15',
    dueDate: '2023-12-15',
    amount: 5250.00,
    status: 'paid',
    description: 'Server Equipment'
  },
  {
    id: 'INV-002',
    date: '2023-11-25',
    dueDate: '2023-12-25',
    amount: 3450.75,
    status: 'pending',
    description: 'Software Licenses'
  },
  {
    id: 'INV-003',
    date: '2023-12-05',
    dueDate: '2024-01-05',
    amount: 1875.50,
    status: 'approved',
    description: 'IT Consulting'
  },
  {
    id: 'INV-004',
    date: '2023-12-15',
    dueDate: '2024-01-15',
    amount: 2150.25,
    status: 'overdue',
    description: 'Network Equipment'
  }
];

// Mock data for vendor contracts
const vendorContracts = [
  {
    id: 'CONT-001',
    title: 'Annual IT Support',
    startDate: '2023-01-01',
    endDate: '2023-12-31',
    value: 24000.00,
    status: 'active'
  },
  {
    id: 'CONT-002',
    title: 'Software Licensing Agreement',
    startDate: '2023-03-15',
    endDate: '2024-03-14',
    value: 18500.00,
    status: 'active'
  },
  {
    id: 'CONT-003',
    title: 'Hardware Maintenance',
    startDate: '2023-06-01',
    endDate: '2024-05-31',
    value: 9600.00,
    status: 'active'
  }
];

interface VendorProfileProps {
  vendorId?: string;
}

const VendorProfile = ({ vendorId = 'V-001' }: VendorProfileProps) => {
  const [activeTab, setActiveTab] = useState('overview');
  
  // Normally you would fetch the vendor data based on the vendorId
  // For this example, we're using mock data
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="container mx-auto py-6 px-4 space-y-6"
    >
      {/* Vendor Header */}
      <Card className="shadow-md">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16">
                {vendorData.logo ? (
                  <AvatarImage src={vendorData.logo} alt={vendorData.name} />
                ) : null}
                <AvatarFallback className="bg-primary/10 text-primary text-xl">
                  {vendorData.name.substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <h1 className="text-2xl font-bold">{vendorData.name}</h1>
                <div className="flex items-center gap-2 text-muted-foreground text-sm mt-1">
                  <Badge className={`${vendorData.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'} capitalize`}>
                    {vendorData.status}
                  </Badge>
                  <span>•</span>
                  <span>Since {new Date(vendorData.relationshipSince).toLocaleDateString('en-US', { year: 'numeric', month: 'short' })}</span>
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline">Edit Profile</Button>
              <Button>New Invoice</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Vendor Tabs */}
      <Tabs defaultValue="overview" onValueChange={setActiveTab} value={activeTab}>
        <TabsList className="grid grid-cols-4 md:w-[600px]">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="invoices">Invoices</TabsTrigger>
          <TabsTrigger value="contracts">Contracts</TabsTrigger>
          <TabsTrigger value="contacts">Contacts</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Contact Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center">
                  <EnvelopeIcon className="h-5 w-5 mr-2 text-muted-foreground" />
                  <span>{vendorData.contact.email}</span>
                </div>
                <div className="flex items-center">
                  <PhoneIcon className="h-5 w-5 mr-2 text-muted-foreground" />
                  <span>{vendorData.contact.phone}</span>
                </div>
                <div className="flex items-center">
                  <GlobeAltIcon className="h-5 w-5 mr-2 text-muted-foreground" />
                  <a href={vendorData.contact.website} className="text-blue-600 hover:underline">
                    {vendorData.contact.website.replace('https://', '')}
                  </a>
                </div>
                <div className="flex items-start">
                  <MapPinIcon className="h-5 w-5 mr-2 text-muted-foreground mt-0.5" />
                  <div>
                    <p>{vendorData.address.street}</p>
                    <p>{vendorData.address.city}, {vendorData.address.state} {vendorData.address.zip}</p>
                    <p>{vendorData.address.country}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Financial Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <CreditCardIcon className="h-5 w-5 mr-2 text-muted-foreground" />
                    <span>Payment Terms</span>
                  </div>
                  <span className="font-medium">{vendorData.financials.paymentTerms}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <DocumentTextIcon className="h-5 w-5 mr-2 text-muted-foreground" />
                    <span>Tax ID</span>
                  </div>
                  <span className="font-medium">{vendorData.financials.taxId}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <BanknotesIcon className="h-5 w-5 mr-2 text-muted-foreground" />
                    <span>Bank Account</span>
                  </div>
                  <span className="font-medium">{vendorData.financials.bankAccountNo}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <CalculatorIcon className="h-5 w-5 mr-2 text-muted-foreground" />
                    <span>YTD Spend</span>
                  </div>
                  <span className="font-medium">{formatCurrency(vendorData.financials.yearToDateSpend)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <ClockIcon className="h-5 w-5 mr-2 text-muted-foreground" />
                    <span>Avg. Payment Time</span>
                  </div>
                  <span className="font-medium">{vendorData.financials.averagePaymentTime} days</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">{vendorData.notes}</p>
              </CardContent>
            </Card>
          </div>

          <div className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Latest Invoices</CardTitle>
                <CardDescription>Recent invoices from this vendor</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Invoice #</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Due Date</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Description</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {vendorInvoices.slice(0, 3).map((invoice) => (
                      <TableRow key={invoice.id}>
                        <TableCell className="font-medium">{invoice.id}</TableCell>
                        <TableCell>{new Date(invoice.date).toLocaleDateString()}</TableCell>
                        <TableCell>{new Date(invoice.dueDate).toLocaleDateString()}</TableCell>
                        <TableCell>{formatCurrency(invoice.amount)}</TableCell>
                        <TableCell>
                          <Badge className={`${getStatusColor(invoice.status)} capitalize`}>
                            {invoice.status}
                          </Badge>
                        </TableCell>
                        <TableCell>{invoice.description}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Invoices Tab */}
        <TabsContent value="invoices">
          <Card>
            <CardHeader>
              <CardTitle>All Invoices</CardTitle>
              <CardDescription>Complete invoice history for this vendor</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Invoice #</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Description</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {vendorInvoices.map((invoice) => (
                    <TableRow key={invoice.id}>
                      <TableCell className="font-medium">{invoice.id}</TableCell>
                      <TableCell>{new Date(invoice.date).toLocaleDateString()}</TableCell>
                      <TableCell>{new Date(invoice.dueDate).toLocaleDateString()}</TableCell>
                      <TableCell>{formatCurrency(invoice.amount)}</TableCell>
                      <TableCell>
                        <Badge className={`${getStatusColor(invoice.status)} capitalize`}>
                          {invoice.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{invoice.description}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Contracts Tab */}
        <TabsContent value="contracts">
          <Card>
            <CardHeader>
              <CardTitle>Active Contracts</CardTitle>
              <CardDescription>Current contractual agreements with this vendor</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Contract #</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Start Date</TableHead>
                    <TableHead>End Date</TableHead>
                    <TableHead>Value</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {vendorContracts.map((contract) => (
                    <TableRow key={contract.id}>
                      <TableCell className="font-medium">{contract.id}</TableCell>
                      <TableCell>{contract.title}</TableCell>
                      <TableCell>{new Date(contract.startDate).toLocaleDateString()}</TableCell>
                      <TableCell>{new Date(contract.endDate).toLocaleDateString()}</TableCell>
                      <TableCell>{formatCurrency(contract.value)}</TableCell>
                      <TableCell>
                        <Badge className="bg-green-100 text-green-800 capitalize">
                          {contract.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Contacts Tab */}
        <TabsContent value="contacts">
          <Card>
            <CardHeader>
              <CardTitle>Contact Persons</CardTitle>
              <CardDescription>Key contacts at this vendor</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center p-4 border rounded-lg">
                <Avatar className="h-10 w-10 mr-4">
                  <AvatarFallback>JS</AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-medium">{vendorData.contact.name}</h3>
                  <p className="text-sm text-muted-foreground">Primary Contact</p>
                  <div className="flex items-center mt-1 text-sm">
                    <EnvelopeIcon className="h-4 w-4 mr-1 text-muted-foreground" />
                    <span>{vendorData.contact.email}</span>
                    <span className="mx-2">•</span>
                    <PhoneIcon className="h-4 w-4 mr-1 text-muted-foreground" />
                    <span>{vendorData.contact.phone}</span>
                  </div>
                </div>
              </div>
              <div className="mt-4 text-center text-muted-foreground">
                <p>No additional contacts available.</p>
                <Button variant="outline" className="mt-2">
                  + Add Contact Person
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </motion.div>
  );
};

export default VendorProfile; 
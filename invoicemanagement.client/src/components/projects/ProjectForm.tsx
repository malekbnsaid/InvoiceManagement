import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { CalendarIcon, Briefcase, Building2, User, DollarSign, FileText, CheckCircle2, Trash2Icon, AlertCircle } from 'lucide-react';
import { CurrencyType } from '../../types/enums';
import { toast } from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { DropdownNavProps, DropdownProps } from 'react-day-picker';
import { ProjectBusinessRules } from '../../services/businessRules';

import { Button } from '../ui/Button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '../ui/form';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { Calendar } from '../ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '../ui/popover';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { departmentApi } from '../../services/api/departmentApi';
import { employeeApi } from '../../services/api/employeeApi';
import { useQuery } from '@tanstack/react-query';

// CSS for form message consistency
const formMessageStyles = "text-sm font-medium text-destructive mt-1";

// Define interfaces for type safety and API responses
interface Department {
  id: number;
  sectionName: string;
  sectionAbbreviation: string | null;
  parentId: number | null;
  isSection: boolean;
}

interface Employee {
  id: number;
  employeeName: string;
  employeeNumber: string;
}

interface APIResponse<T> {
  $values?: T[];
  [key: string]: any;
}

interface PaymentPlanLine {
  year: number;
  amount: number;
  currency: CurrencyType;
  paymentType: string;
  description?: string;
  projectId?: number;
}


// Define the form schema with improved validation
const formSchema = z.object({
  name: z.string().min(1, 'Project name is required'),
  description: z.string().optional(),
  unitId: z.string().optional(),
  section: z.string().min(1, 'Section is required'),
  budget: z.string()
    .min(1, 'Budget is required')
    .refine((val) => {
      const amount = parseFloat(val);
      return !isNaN(amount) && amount >= 1000;
    }, 'Minimum budget is $1,000')
    .refine((val) => {
      const amount = parseFloat(val);
      return !isNaN(amount) && amount <= 100000000; // $100M max
    }, 'Maximum budget is $100,000,000')
    .refine((val) => {
      // Check decimal precision (only 2 decimal places)
      const decimalPlaces = (val.split('.')[1] || '').length;
      return decimalPlaces <= 2;
    }, 'Budget amount can only have up to 2 decimal places'),
  projectManagerId: z.string().min(1, 'Project manager is required'),
  expectedStart: z.date()
    .nullable()
    .refine((date) => {
      if (!date) return true;
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return date >= today;
    }, 'Start date cannot be in the past'),
  expectedEnd: z.date()
    .nullable()
    .refine((date) => {
      if (!date) return true;
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return date >= today;
    }, 'End date cannot be in the past'),
  tenderDate: z.date()
    .nullable()
    .refine((date) => {
      if (!date) return true;
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return date >= today;
    }, 'Tender date cannot be in the past'),
  paymentPlanLines: z.array(z.object({
    year: z.number()
      .min(new Date().getFullYear(), 'Cannot create payments for past years')
      .max(new Date().getFullYear() + 10, 'Cannot create payments more than 10 years in the future'),
    amount: z.number()
      .min(100, 'Each payment must be at least $100')
      .max(5000000, 'Individual payments cannot exceed $5,000,000')
      .refine((val) => {
        // Check decimal precision (only 2 decimal places)
        const decimalPlaces = (val.toString().split('.')[1] || '').length;
        return decimalPlaces <= 2;
      }, 'Payment amount can only have up to 2 decimal places'),
    currency: z.nativeEnum(CurrencyType),
    paymentType: z.string()
      .min(1, 'Payment type is required')
      .refine((val) => {
        const validTypes = ['Annually', 'Semi-Annually', 'Quarterly', 'Monthly', 'One-time'];
        return validTypes.includes(val);
      }, 'Invalid payment type. Must be one of: Annually, Semi-Annually, Quarterly, Monthly, One-time'),
    description: z.string().optional(),
    projectId: z.number().optional()
  }))
  .min(1, 'At least one payment plan line is required'),
  projectNumber: z.string().optional(),
  initialNotes: z.string().optional(),
}).refine((data) => {
  // Validate start vs end date
  if (data.expectedStart && data.expectedEnd) {
    const duration = data.expectedEnd.getTime() - data.expectedStart.getTime();
    const days = duration / (1000 * 60 * 60 * 24);
    
    if (days < 1) {
      return false;
    }
    
    if (days > 3650) { // 10 years
      return false;
    }
  }
  return true;
}, {
  message: "Project duration must be between 1 day and 10 years",
  path: ["expectedEnd"],
}).refine((data) => {
  // Validate tender date vs start date
  if (data.tenderDate && data.expectedStart) {
    return data.tenderDate < data.expectedStart;
  }
  return true;
}, {
  message: "Tender date must be before project start date",
  path: ["tenderDate"],
}).refine((data) => {
  // Validate currency consistency in payment plan
  if (data.paymentPlanLines && data.paymentPlanLines.length > 0) {
    const currencies = data.paymentPlanLines.map(p => p.currency);
    const uniqueCurrencies = [...new Set(currencies)];
    return uniqueCurrencies.length === 1;
  }
  return true;
}, {
  message: "All payment plan lines must use the same currency",
  path: ["paymentPlanLines"],
});

// Define the form values type
type FormValues = z.infer<typeof formSchema>;

interface ProjectFormProps {
  onSubmit: (data: FormValues) => void;
  isLoading?: boolean;
  initialData?: FormValues;
}


export default function ProjectForm({ onSubmit, isLoading = false, initialData }: ProjectFormProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 3;
  const { user } = useAuth();
  const [validationWarnings, setValidationWarnings] = useState<string[]>([]);

  // Initialize form with proper default values
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: initialData?.name || '',
      description: initialData?.description || '',
      section: initialData?.section || '',
      projectManagerId: initialData?.projectManagerId || '',
      budget: initialData?.budget || '',
      expectedStart: initialData?.expectedStart || null,
      expectedEnd: initialData?.expectedEnd || null,
      tenderDate: initialData?.tenderDate || null,
      paymentPlanLines: initialData?.paymentPlanLines || [{
        year: new Date().getFullYear(),
        amount: 0,
        currency: CurrencyType.QAR,
        paymentType: 'Annually',
        description: ''
      }],
      projectNumber: initialData?.projectNumber || '',
      initialNotes: initialData?.initialNotes || '',
    }
  });

  // Watch section changes
  const sectionValue = form.watch('section');

  // Fetch sections and employees with error handling
  const { data: sectionsData } = useQuery({
    queryKey: ['sections'],
    queryFn: async () => {
      try {
        const response = await departmentApi.getAll();
        return Array.isArray(response) 
          ? response 
          : (response as APIResponse<Department>)?.$values || [];
      } catch (error) {
        console.error('Error fetching sections:', error);
        throw error;
      }
    }
  });

  const sections: Department[] = useMemo(() => 
    sectionsData 
      ? sectionsData.filter((d: Department) => d.parentId === 1575)
      : []
  , [sectionsData]);

  // Update project number when section changes
  const updateProjectNumber = useCallback((sectionId: string) => {
    const section = sections.find((s: Department) => s.id.toString() === sectionId);
    if (section?.sectionAbbreviation) {
      const date = new Date();
      const projectNumber = `${section.sectionAbbreviation}/${date.getMonth() + 1}/${date.getFullYear()}`;
      form.setValue('projectNumber', projectNumber, {
        shouldValidate: false,
        shouldDirty: true,
        shouldTouch: true
      });
    }
  }, [sections, form.setValue]);

  useEffect(() => {
    if (sectionValue && sections.length > 0) {
      updateProjectNumber(sectionValue);
    }
  }, [sectionValue, sections.length, updateProjectNumber]);

  // Filter units by selected section
  const filteredUnits: Department[] = sectionValue && sectionsData
    ? sectionsData.filter((s: Department) => s.parentId?.toString() === sectionValue)
    : [];

  const { data: employeesData } = useQuery({
    queryKey: ['employees'],
    queryFn: async () => {
      try {
        const response = await employeeApi.getAll();
        console.log('Employees response:', response);
        // Transform the data here
        const rawEmployees = Array.isArray(response) 
          ? response 
          : (response as APIResponse<Employee>)?.$values || [];
        
        return rawEmployees.map(emp => ({
          id: emp.id,
          employeeName: emp.employeeName,
          employeeNumber: emp.employeeNumber
        }));
      } catch (error) {
        console.error('Error fetching employees:', error);
        throw error;
      }
    }
  });

  // Validate current step using business rules
  const validateStep = (step: number): boolean => {
    const values = form.getValues();
    console.log(`Validating step ${step}:`, values);
    
    switch (step) {
      case 1:
        const step1Valid = !!values.name && !!values.section && !!values.projectManagerId;
        console.log('Step 1 validation:', step1Valid, { name: values.name, section: values.section, projectManagerId: values.projectManagerId });
        return step1Valid;
      case 2:
        const step2Valid = !!values.expectedStart && !!values.expectedEnd && !!values.budget;
        console.log('Step 2 validation:', step2Valid, { expectedStart: values.expectedStart, expectedEnd: values.expectedEnd, budget: values.budget });
        
        // Additional business rule validation for step 2
        if (step2Valid) {
          const budget = parseFloat(values.budget) || 0;
          const budgetResult = ProjectBusinessRules.validateBudget(budget, user?.role || 'User');
          if (!budgetResult.valid) {
            console.log('Step 2 budget validation failed:', budgetResult.message);
            return false;
          }
          
          const dateResult = ProjectBusinessRules.validateDates({
            expectedStart: values.expectedStart || undefined,
            expectedEnd: values.expectedEnd || undefined,
            tenderDate: values.tenderDate || undefined
          });
          if (!dateResult.valid) {
            console.log('Step 2 date validation failed:', dateResult.message);
            return false;
          }
        }
        
        return step2Valid;
      case 3:
        // Validate PaymentPlanLines using business rules
        const paymentLines = values.paymentPlanLines || [];
        if (paymentLines.length === 0) return false;
        
        const budget = parseFloat(values.budget) || 0;
        const paymentResult = ProjectBusinessRules.validatePaymentPlan(paymentLines, budget);
        
        console.log('Step 3 validation - Payment plan result:', paymentResult);
        
        // Allow step 3 to proceed even with warnings (payment plan can exceed budget)
        if (!paymentResult.valid) {
          console.log('Step 3 validation failed:', paymentResult.message);
          return false;
        }
        
        // Show warning if payment plan exceeds budget but allow continuation
        if (paymentResult.warning) {
          console.log('Step 3 warning:', paymentResult.warning);
          // We'll show this warning in the UI but allow progression
        }
        
        return true;
      default:
        return false;
    }
  };


  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  // Animation variants for step transitions
  const stepVariants = {
    hidden: { opacity: 0, x: 50 },
    visible: { opacity: 1, x: 0, transition: { duration: 0.3 } },
    exit: { opacity: 0, x: -50, transition: { duration: 0.3 } }
  };

  // Update the addPaymentLine function
  const addPaymentLine = () => {
    const currentLines = form.getValues('paymentPlanLines') || [];
    form.setValue('paymentPlanLines', [
      ...currentLines,
      {
        year: new Date().getFullYear(),
        amount: 0,
        currency: CurrencyType.QAR,
        paymentType: 'Annually',
        description: ''
      }
    ]);
  };

  // Update the removePaymentLine function
  const removePaymentLine = (index: number) => {
    const currentLines = form.getValues('paymentPlanLines') || [];
    form.setValue(
      'paymentPlanLines',
      currentLines.filter((_, i) => i !== index)
    );
  };

  // Check for validation warnings
  const checkValidationWarnings = useCallback(() => {
    const values = form.getValues();
    const warnings: string[] = [];
    
    // Check budget validation
    if (values.budget) {
      const budget = parseFloat(values.budget) || 0;
      const budgetResult = ProjectBusinessRules.validateBudget(budget, user?.role || 'User');
      if (budgetResult.warning) {
        warnings.push(budgetResult.warning);
      }
    }
    
    // Check payment plan validation
    if (values.paymentPlanLines && values.paymentPlanLines.length > 0) {
      const budget = parseFloat(values.budget) || 0;
      const paymentResult = ProjectBusinessRules.validatePaymentPlan(
        values.paymentPlanLines, 
        budget, 
        values.expectedStart || undefined, 
        values.expectedEnd || undefined
      );
      if (paymentResult.warning) {
        warnings.push(paymentResult.warning);
      }
    }
    
    // Check date validation
    if (values.expectedStart || values.expectedEnd || values.tenderDate) {
      const dateResult = ProjectBusinessRules.validateDates({
        expectedStart: values.expectedStart || undefined,
        expectedEnd: values.expectedEnd || undefined,
        tenderDate: values.tenderDate || undefined
      });
      if (dateResult.warning) {
        warnings.push(dateResult.warning);
      }
    }
    
    // Check project duration vs payment plan alignment
    if (values.expectedStart && values.expectedEnd && values.paymentPlanLines && values.paymentPlanLines.length > 0) {
      const durationResult = ProjectBusinessRules.validateProjectDurationAlignment({
        expectedStart: values.expectedStart,
        expectedEnd: values.expectedEnd,
        paymentPlanLines: values.paymentPlanLines,
        budget: parseFloat(values.budget) || 0,
        userRole: user?.role || 'User'
      });
      if (durationResult.warning) {
        warnings.push(durationResult.warning);
      }
    }
    
    setValidationWarnings(warnings);
  }, [form, user?.role]);

  // Update warnings when form values change
  React.useEffect(() => {
    const subscription = form.watch((value, { name, type }) => {
      console.log('Form field changed:', name, type, value);
      checkValidationWarnings();
    });
    return () => subscription.unsubscribe();
  }, [checkValidationWarnings]);

  // Handle form submission
  const handleFormSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    
    // Check if user has permission to create projects
    if (!user || !['PM', 'PMO', 'Head', 'Admin'].includes(user.role)) {
      toast.error('You do not have permission to create projects. Only Project Managers, PMO, Heads, and Admins can create projects.');
      return;
    }
    
    try {
      const values = form.getValues();
      console.log('Form values before submission:', values);

      // Handle step navigation
      if (currentStep < totalSteps) {
        if (validateStep(currentStep)) {
          setCurrentStep(currentStep + 1);
        }
        return;
      }

      // Transform the form data while preserving existing data
      const formData = {
        ...values, // Base values
        budget: values.budget ? values.budget.toString() : '', // Ensure budget is string
        section: values.section,
        projectManagerId: values.projectManagerId,
        paymentPlanLines: (values.paymentPlanLines || [])
          .filter(line => line.year && line.amount && line.currency && line.paymentType)
          .map(line => ({
            year: line.year && !isNaN(line.year) ? line.year : new Date().getFullYear(),
            amount: line.amount && !isNaN(line.amount) ? line.amount : 0,
            currency: line.currency || CurrencyType.QAR,
          paymentType: line.paymentType || 'Annually',
          description: line.description || ''
        }))
      };

      console.log('Transformed form data for update:', formData);
      await onSubmit(formData);
    } catch (error) {
      console.error('Error submitting form:', error);
      toast.error('Failed to update project. Please try again.');
    }
  };

  return (
    <Card className="w-full max-w-5xl mx-auto shadow-lg border-0 bg-gradient-to-br from-white to-gray-50">
      <CardHeader className="bg-gradient-to-r from-primary to-primary/80 text-black rounded-t-lg">
        <CardTitle className="text-2xl font-bold  flex items-center gap-3">
          <Briefcase className="h-6 w-6" />
          Create New Project
        </CardTitle>
        <br></br>
        <p className="text-primary-foreground/80 text-sm mt-1 text-black">
          Fill in the project details below. You can navigate between steps using the progress indicator.
        </p>
      </CardHeader>

      <CardContent className="p-8">
        <Form {...form}>
          <form onSubmit={handleFormSubmit} className="space-y-8">
            {/* Enhanced Step indicator */}
            <div className="flex justify-between items-center mb-8 bg-white p-4 rounded-xl shadow-sm border">
              {Array.from({ length: totalSteps }).map((_, index) => (
                <div key={index} className="flex items-center">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold text-base transition-all duration-300 ${
                      currentStep > index + 1
                        ? 'bg-green-500 text-white shadow-lg scale-110'
                        : currentStep === index + 1
                        ? 'bg-primary text-white shadow-lg scale-110 ring-4 ring-primary/20'
                        : 'bg-gray-200 text-gray-600'
                    }`}
                  >
                    {currentStep > index + 1 ? '✓' : index + 1}
                  </div>
                  {index < totalSteps - 1 && (
                    <div
                      className={`w-24 h-1 mx-3 transition-all duration-300 ${
                        currentStep > index + 1 ? 'bg-green-500' : 'bg-gray-200'
                      }`}
                    />
                  )}
                </div>
              ))}
            </div>

            {/* Step 1: Project Information */}
            {currentStep === 1 && (
              <motion.div
                variants={stepVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="space-y-6"
              >
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-xl border-l-4 border-primary shadow-sm">
                  <h2 className="text-xl font-bold text-gray-800 flex items-center gap-3">
                    <Briefcase className="h-6 w-6 text-primary" />
                    Step 1: Project Information
                  </h2>
                  <p className="text-gray-600 mt-2">Enter the basic project details and select the section and project manager.</p>
                </div>
                {/* Project Name */}
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2 font-semibold text-gray-700">
                        <Briefcase className="h-4 w-4 text-primary" />
                        Project Name
                      </FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Enter project name" 
                          className="focus:ring-2 focus:ring-primary focus:border-primary transition-all duration-200 py-2 px-3 border hover:border-primary/50 text-gray-900 bg-white" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage className={formMessageStyles} />
                    </FormItem>
                  )}
                />

                {/* Section and Project Number in a grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Section Selection */}
                  <FormField
                    control={form.control}
                    name="section"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2 font-semibold text-gray-700">
                          <Building2 className="h-4 w-4 text-primary" />
                          Section
                        </FormLabel>
                        <FormControl>
                          <Select
                            onValueChange={(value) => {
                              field.onChange(value);
                              form.setValue('unitId', '');
                              updateProjectNumber(value);
                            }}
                            value={field.value || ""}
                          >
                            <SelectTrigger className="focus:ring-2 focus:ring-primary focus:border-primary transition-all duration-200 py-2 px-3 border hover:border-primary/50">
                              <SelectValue placeholder="Select section" />
                            </SelectTrigger>
                            <SelectContent>
                              {sections.map((section: Department) => (
                                <SelectItem key={section.id} value={section.id.toString()}>
                                  {section.sectionName}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormMessage className={formMessageStyles} />
                      </FormItem>
                    )}
                  />

                  {/* Project Number (Generated) */}
                  <FormField
                    control={form.control}
                    name="projectNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2 font-semibold text-gray-700">
                          <FileText className="h-4 w-4 text-primary" />
                          Project Number
                        </FormLabel>
                        <FormControl>
                          <Input 
                            {...field} 
                            disabled 
                            className="bg-gray-100 border border-gray-200 text-gray-600 font-mono py-2 px-3"
                          />
                        </FormControl>
                        <FormMessage className={formMessageStyles} />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Unit Selection */}
                <FormField
                  control={form.control}
                  name="unitId"
                  render={({ field }) => (
                    <FormItem>
                                              <FormLabel className="flex items-center gap-2 font-semibold text-gray-700">
                        <Building2 className="h-4 w-4 text-primary" />
                        Unit (Optional)
                      </FormLabel>
                      <FormControl>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value || ""}
                          disabled={!sectionValue}
                        >
                            <SelectTrigger className="focus:ring-2 focus:ring-primary focus:border-primary transition-all duration-200 py-2 px-3 border hover:border-primary/50">
                            <SelectValue placeholder="Select unit (optional)" />
                          </SelectTrigger>
                          <SelectContent>
                            {filteredUnits.map((unit: Department) => (
                              <SelectItem key={unit.id} value={unit.id.toString()}>
                                {unit.sectionName}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage className={formMessageStyles} />
                    </FormItem>
                  )}
                />

                {/* Project Manager */}
                <FormField
                  control={form.control}
                  name="projectManagerId"
                  render={({ field }) => (
                    <FormItem>
                                              <FormLabel className="flex items-center gap-2 font-semibold text-gray-700">
                        <User className="h-4 w-4 text-primary" />
                        Project Manager
                      </FormLabel>
                      <FormControl>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value || ""}
                        >
                            <SelectTrigger className="focus:ring-2 focus:ring-primary focus:border-primary transition-all duration-200 py-2 px-3 border hover:border-primary/50">
                            <SelectValue placeholder="Select project manager" />
                          </SelectTrigger>
                          <SelectContent>
                            {employeesData?.map((employee: Employee) => (
                              <SelectItem key={employee.id} value={employee.id.toString()}>
                                {employee.employeeName}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage className={formMessageStyles} />
                    </FormItem>
                  )}
                />

                {/* Description */}
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                                              <FormLabel className="flex items-center gap-2 font-semibold text-gray-700">
                        <FileText className="h-4 w-4 text-primary" />
                        Description (Optional)
                      </FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Enter project description (optional)" 
                          className="min-h-[120px] focus:ring-2 focus:ring-primary focus:border-primary transition-all duration-200 py-2 px-3 border hover:border-primary/50 text-gray-900 bg-white" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage className={formMessageStyles} />
                    </FormItem>
                  )}
                />
              </motion.div>
            )}

            {/* Step 2: Timeline & Budget */}
            {currentStep === 2 && (
              <motion.div
                variants={stepVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="space-y-6"
              >
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-6 rounded-xl border-l-4 border-green-500 shadow-sm">
                  <h2 className="text-xl font-bold text-gray-800 flex items-center gap-3">
                    <CalendarIcon className="h-6 w-6 text-green-600" />
                    Step 2: Timeline & Budget
                  </h2>
                  <p className="text-gray-600 mt-2">Set the project timeline and budget information.</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Expected Start Date */}
                  <FormField
                    control={form.control}
                    name="expectedStart"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel className="flex items-center gap-2 font-semibold text-gray-700">
                          <CalendarIcon className="h-4 w-4 text-primary" />
                          Expected Start Date
                        </FormLabel>
                        <div className="relative">
                          <Input
                            value={field.value ? format(field.value, "MM/dd/yyyy") : ""}
                            placeholder="MM/DD/YYYY"
                            className="bg-background pr-10"
                            onChange={(e) => {
                              const date = new Date(e.target.value);
                              if (!isNaN(date.getTime())) {
                                field.onChange(date);
                                if (field.name === "expectedStart") {
                                  const endDate = form.getValues("expectedEnd");
                                  if (endDate && date && endDate < date) {
                                    form.setValue("expectedEnd", null);
                                  }
                                }
                              }
                            }}
                            onKeyDown={(e) => {
                              if (e.key === "ArrowDown") {
                                e.preventDefault();
                                // Open calendar popup
                              }
                            }}
                          />
                        <Popover>
                          <PopoverTrigger asChild>
                              <Button
                                type="button"
                                variant="ghost"
                                className="absolute top-1/2 right-2 size-6 -translate-y-1/2"
                              >
                                <CalendarIcon className="size-3.5" />
                                <span className="sr-only">Select date</span>
                              </Button>
                          </PopoverTrigger>
                            <PopoverContent
                              className="w-auto overflow-hidden p-0"
                              align="end"
                              alignOffset={-8}
                              sideOffset={10}
                            >
                            <Calendar
                              mode="single"
                              selected={field.value ?? undefined}
                                onSelect={(date: Date | undefined) => {
                                field.onChange(date ?? null);
                                  if (field.name === "expectedStart") {
                                const endDate = form.getValues("expectedEnd");
                                if (endDate && date && endDate < date) {
                                  form.setValue("expectedEnd", null);
                                    }
                                  }
                                }}
                                className="rounded-md border p-2"
                                classNames={{
                                  month_caption: "mx-0",
                                }}
                                captionLayout="dropdown"
                                defaultMonth={field.value ?? new Date()}
                                fromYear={2020}
                                toYear={2035}
                                components={{
                                  DropdownNav: (props: DropdownNavProps) => {
                                    return (
                                      <div className="flex w-full items-center gap-2">
                                        {props.children}
                                      </div>
                                    )
                                  },
                                  Dropdown: (props: DropdownProps) => {
                                    return (
                                      <Select
                                        value={String(props.value)}
                                        onValueChange={(value) => {
                                          if (props.onChange) {
                                            const event = {
                                              target: {
                                                value: String(value),
                                              },
                                            } as React.ChangeEvent<HTMLSelectElement>
                                            props.onChange(event)
                                          }
                                        }}
                                      >
                                        <SelectTrigger className="h-8 w-fit font-medium first:grow">
                                          <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent className="max-h-[min(26rem,var(--radix-select-content-available-height))]">
                                          {props.options?.map((option) => (
                                            <SelectItem
                                              key={option.value}
                                              value={String(option.value)}
                                              disabled={option.disabled}
                                            >
                                              {option.label}
                                            </SelectItem>
                                          ))}
                                        </SelectContent>
                                      </Select>
                                    )
                                  },
                                }}
                            />
                          </PopoverContent>
                        </Popover>
                        </div>
                        <FormMessage className={formMessageStyles} />
                      </FormItem>
                    )}
                  />

                  {/* Expected End Date */}
                  <FormField
                    control={form.control}
                    name="expectedEnd"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel className="flex items-center gap-2 font-semibold text-gray-700">
                          <CalendarIcon className="h-4 w-4 text-primary" />
                          Expected End Date
                        </FormLabel>
                        <div className="relative">
                          <Input
                            value={field.value ? format(field.value, "MM/dd/yyyy") : ""}
                            placeholder="MM/DD/YYYY"
                            className="bg-background pr-10"
                            onChange={(e) => {
                              const date = new Date(e.target.value);
                              if (!isNaN(date.getTime())) {
                                field.onChange(date);
                              }
                            }}
                            onKeyDown={(e) => {
                              if (e.key === "ArrowDown") {
                                e.preventDefault();
                                // Open calendar popup
                              }
                            }}
                          />
                        <Popover>
                          <PopoverTrigger asChild>
                              <Button
                                type="button"
                                variant="ghost"
                                className="absolute top-1/2 right-2 size-6 -translate-y-1/2"
                              >
                                <CalendarIcon className="size-3.5" />
                                <span className="sr-only">Select date</span>
                              </Button>
                          </PopoverTrigger>
                            <PopoverContent
                              className="w-auto overflow-hidden p-0"
                              align="end"
                              alignOffset={-8}
                              sideOffset={10}
                            >
                            <Calendar
                              mode="single"
                              selected={field.value ?? undefined}
                                onSelect={(date: Date | undefined) => {
                                  field.onChange(date ?? null);
                                }}
                                className="rounded-md border p-2"
                                classNames={{
                                  month_caption: "mx-0",
                                }}
                                captionLayout="dropdown"
                                defaultMonth={field.value ?? new Date()}
                                fromYear={2020}
                                toYear={2035}
                                components={{
                                  DropdownNav: (props: DropdownNavProps) => {
                                    return (
                                      <div className="flex w-full items-center gap-2">
                                        {props.children}
                                      </div>
                                    )
                                  },
                                  Dropdown: (props: DropdownProps) => {
                                    return (
                                      <Select
                                        value={String(props.value)}
                                        onValueChange={(value) => {
                                          if (props.onChange) {
                                            const event = {
                                              target: {
                                                value: String(value),
                                              },
                                            } as React.ChangeEvent<HTMLSelectElement>
                                            props.onChange(event)
                                          }
                                        }}
                                      >
                                        <SelectTrigger className="h-8 w-fit font-medium first:grow">
                                          <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent className="max-h-[min(26rem,var(--radix-select-content-available-height))]">
                                          {props.options?.map((option) => (
                                            <SelectItem
                                              key={option.value}
                                              value={String(option.value)}
                                              disabled={option.disabled}
                                            >
                                              {option.label}
                                            </SelectItem>
                                          ))}
                                        </SelectContent>
                                      </Select>
                                    )
                                  },
                                }}
                            />
                          </PopoverContent>
                        </Popover>
                        </div>
                        <FormMessage className={formMessageStyles} />
                      </FormItem>
                    )}
                  />

                  {/* Tender Date */}
                  <FormField
                    control={form.control}
                    name="tenderDate"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel className="flex items-center gap-2 font-semibold text-gray-700">
                          <CalendarIcon className="h-4 w-4 text-primary" />
                          Tender Date
                        </FormLabel>
                        <div className="relative">
                          <Input
                            value={field.value ? format(field.value, "MM/dd/yyyy") : ""}
                            placeholder="MM/DD/YYYY"
                            className="bg-background pr-10"
                            onChange={(e) => {
                              const date = new Date(e.target.value);
                              if (!isNaN(date.getTime())) {
                                field.onChange(date);
                              }
                            }}
                            onKeyDown={(e) => {
                              if (e.key === "ArrowDown") {
                                e.preventDefault();
                                // Open calendar popup
                              }
                            }}
                          />
                        <Popover>
                          <PopoverTrigger asChild>
                              <Button
                                type="button"
                                variant="ghost"
                                className="absolute top-1/2 right-2 size-6 -translate-y-1/2"
                              >
                                <CalendarIcon className="size-3.5" />
                                <span className="sr-only">Select date</span>
                              </Button>
                          </PopoverTrigger>
                            <PopoverContent
                              className="w-auto overflow-hidden p-0"
                              align="end"
                              alignOffset={-8}
                              sideOffset={10}
                            >
                            <Calendar
                              mode="single"
                              selected={field.value ?? undefined}
                                onSelect={(date: Date | undefined) => {
                                  field.onChange(date ?? null);
                                }}
                                className="rounded-md border p-2"
                                classNames={{
                                  month_caption: "mx-0",
                                }}
                                captionLayout="dropdown"
                                defaultMonth={field.value ?? new Date()}
                                fromYear={2020}
                                toYear={2035}
                                components={{
                                  DropdownNav: (props: DropdownNavProps) => {
                                    return (
                                      <div className="flex w-full items-center gap-2">
                                        {props.children}
                                      </div>
                                    )
                                  },
                                  Dropdown: (props: DropdownProps) => {
                                    return (
                                      <Select
                                        value={String(props.value)}
                                        onValueChange={(value) => {
                                          if (props.onChange) {
                                            const event = {
                                              target: {
                                                value: String(value),
                                              },
                                            } as React.ChangeEvent<HTMLSelectElement>
                                            props.onChange(event)
                                          }
                                        }}
                                      >
                                        <SelectTrigger className="h-8 w-fit font-medium first:grow">
                                          <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent className="max-h-[min(26rem,var(--radix-select-content-available-height))]">
                                          {props.options?.map((option) => (
                                            <SelectItem
                                              key={option.value}
                                              value={String(option.value)}
                                              disabled={option.disabled}
                                            >
                                              {option.label}
                                            </SelectItem>
                                          ))}
                                        </SelectContent>
                                      </Select>
                                    )
                                  },
                                }}
                            />
                          </PopoverContent>
                        </Popover>
                        </div>
                        <FormMessage className={formMessageStyles} />
                      </FormItem>
                    )}
                  />

                  {/* Budget */}
                  <FormField
                    control={form.control}
                    name="budget"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2 font-semibold text-gray-700">
                          <DollarSign className="h-4 w-4 text-primary" />
                          Budget
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            placeholder="Enter project budget"
                            className="focus:ring-2 focus:ring-primary focus:border-primary transition-all duration-200 py-2 px-3 border hover:border-primary/50 text-gray-900 bg-white"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage className={formMessageStyles} />
                        {/* Show budget-specific warnings */}
                        {(() => {
                          const budget = parseFloat(field.value) || 0;
                          const budgetResult = ProjectBusinessRules.validateBudget(budget, user?.role || 'User');
                          if (budgetResult.warning) {
                            return (
                              <div className="mt-2 p-2 bg-amber-50 border border-amber-200 rounded-md">
                                <p className="text-amber-700 text-xs flex items-center gap-1">
                                  <AlertCircle className="h-3 w-3" />
                                  {budgetResult.warning}
                                </p>
                              </div>
                            );
                          }
                          return null;
                        })()}
                      </FormItem>
                    )}
                  />
                </div>

                {/* Payment Plan Section */}
                <div className="space-y-4 bg-white p-4 rounded-xl border-2 border-gray-100 shadow-sm">
                  <div className="flex justify-between items-center border-b border-gray-200 pb-3">
                    <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                      <DollarSign className="h-5 w-5 text-primary" />
                      Payment Plan
                    </h2>
                    <Button 
                      type="button" 
                      onClick={addPaymentLine}
                      className="bg-white hover:bg-gray-50 text-primary border-2 border-primary px-6 py-2 rounded-lg font-semibold transition-all duration-200 hover:scale-105 shadow-md hover:shadow-lg"
                    >
                      + Add Payment Line
                    </Button>
                  </div>
                  
                  {/* Budget Summary */}
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg border border-blue-200">
                    <div className="grid grid-cols-4 gap-4 text-sm">
                      <div className="text-center">
                        <p className="text-gray-600 font-medium">Project Budget</p>
                        <p className="text-lg font-bold text-blue-700">
                          {form.watch('budget') ? ProjectBusinessRules.formatCurrency(parseFloat(form.watch('budget'))) : '0 QAR'}
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-gray-600 font-medium">Total Payment Plan (Project)</p>
                        <p className={`text-lg font-bold ${
                          (() => {
                            const paymentLines = (form.watch('paymentPlanLines') || []).map(line => ({
                              amount: parseFloat(line.amount?.toString()) || 0,
                              paymentType: line.paymentType,
                              currency: line.currency,
                              year: line.year,
                              description: line.description
                            }));
                            const totalPaymentPlan = ProjectBusinessRules.calculateTotalProjectPaymentPlan(
                              paymentLines, 
form.watch('expectedStart') || undefined, 
form.watch('expectedEnd') || undefined
                            );
                            const budget = parseFloat(form.watch('budget')) || 0;
                            return totalPaymentPlan > budget ? 'text-amber-600' : 'text-green-600';
                          })()
                        }`}>
                          {(() => {
                            const paymentLines = (form.watch('paymentPlanLines') || []).map(line => ({
                              amount: parseFloat(line.amount?.toString()) || 0,
                              paymentType: line.paymentType,
                              currency: line.currency,
                              year: line.year,
                              description: line.description
                            }));
                            const totalPaymentPlan = ProjectBusinessRules.calculateTotalProjectPaymentPlan(
                              paymentLines, 
form.watch('expectedStart') || undefined, 
form.watch('expectedEnd') || undefined
                            );
                            return ProjectBusinessRules.formatCurrency(totalPaymentPlan);
                          })()}
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-gray-600 font-medium">Variance</p>
                        <p className={`text-lg font-bold ${
                          (() => {
                            const paymentLines = (form.watch('paymentPlanLines') || []).map(line => ({
                              amount: parseFloat(line.amount?.toString()) || 0,
                              paymentType: line.paymentType,
                              currency: line.currency,
                              year: line.year,
                              description: line.description
                            }));
                            const totalPaymentPlan = ProjectBusinessRules.calculateTotalProjectPaymentPlan(
                              paymentLines, 
form.watch('expectedStart') || undefined, 
form.watch('expectedEnd') || undefined
                            );
                            const budget = parseFloat(form.watch('budget')) || 0;
                            const variance = budget - totalPaymentPlan;
                            return variance < 0 ? 'text-amber-600' : 'text-green-600';
                          })()
                        }`}>
                          {(() => {
                            const paymentLines = (form.watch('paymentPlanLines') || []).map(line => ({
                              amount: parseFloat(line.amount?.toString()) || 0,
                              paymentType: line.paymentType,
                              currency: line.currency,
                              year: line.year,
                              description: line.description
                            }));
                            const totalPaymentPlan = ProjectBusinessRules.calculateTotalProjectPaymentPlan(
                              paymentLines, 
form.watch('expectedStart') || undefined, 
form.watch('expectedEnd') || undefined
                            );
                            const budget = parseFloat(form.watch('budget')) || 0;
                            const variance = budget - totalPaymentPlan;
                            const percentage = budget > 0 ? ((Math.abs(variance) / budget) * 100).toFixed(1) : '0';
                            return `${variance >= 0 ? '+' : ''}${ProjectBusinessRules.formatCurrency(variance)} (${percentage}%)`;
                          })()}
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-gray-600 font-medium">Duration vs Payments</p>
                        <p className={`text-lg font-bold ${
                          (() => {
                            const startDate = form.watch('expectedStart');
                            const endDate = form.watch('expectedEnd');
                            const paymentLines = form.watch('paymentPlanLines') || [];
                            
                            if (!startDate || !endDate || paymentLines.length === 0) {
                              return 'text-gray-500';
                            }
                            
                            const projectDuration = endDate.getTime() - startDate.getTime();
                            const projectMonths = projectDuration / (1000 * 60 * 60 * 24 * 30.44);
                            const paymentYears = [...new Set(paymentLines.map(p => p.year))].length;
                            
                            if (projectMonths < 6 && paymentYears > 1) {
                              return 'text-red-600';
                            } else if (projectMonths < 12 && paymentYears > 2) {
                              return 'text-amber-600';
                            } else if (projectMonths > 24 && paymentYears === 1) {
                              return 'text-amber-600';
                            }
                            return 'text-green-600';
                          })()
                        }`}>
                          {(() => {
                            const startDate = form.watch('expectedStart');
                            const endDate = form.watch('expectedEnd');
                            const paymentLines = form.watch('paymentPlanLines') || [];
                            
                            if (!startDate || !endDate || paymentLines.length === 0) {
                              return 'N/A';
                            }
                            
                            const projectDuration = endDate.getTime() - startDate.getTime();
                            const projectMonths = Math.round(projectDuration / (1000 * 60 * 60 * 24 * 30.44));
                            const paymentYears = [...new Set(paymentLines.map(p => p.year))].length;
                            
                            return `${projectMonths}m / ${paymentYears}y`;
                          })()}
                        </p>
                      </div>
                    </div>
                    
                    {/* Show validation warnings */}
                    {validationWarnings.length > 0 && (
                      <div className="mt-3 space-y-2">
                        <h4 className="text-sm font-medium text-amber-800 flex items-center gap-2">
                          <AlertCircle className="h-4 w-4" />
                          Validation Warnings ({validationWarnings.length})
                        </h4>
                        {validationWarnings.map((warning, index) => (
                          <div key={index} className="p-3 bg-amber-50 border border-amber-200 rounded-md">
                            <p className="text-amber-700 text-sm">
                              {warning}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {/* Payment Calculation Breakdown */}
                    {form.watch('paymentPlanLines') && form.watch('paymentPlanLines').length > 0 && (
                      <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-md">
                        <h5 className="text-sm font-medium text-blue-800 mb-2">Payment Calculation Breakdown (Project Duration):</h5>
                        {form.watch('paymentPlanLines').map((line: any, index: number) => {
                          const amount = parseFloat(line.amount?.toString()) || 0;
                          const projectAmount = ProjectBusinessRules.calculateProjectPaymentAmount(
                            amount, 
                            line.paymentType, 
form.watch('expectedStart') || undefined, 
form.watch('expectedEnd') || undefined
                          );
                          
                          // Calculate project duration for display
                          const startDate = form.watch('expectedStart');
                          const endDate = form.watch('expectedEnd');
                          let projectMonths = 0;
                          if (startDate && endDate) {
                            const duration = endDate.getTime() - startDate.getTime();
                            projectMonths = Math.ceil(duration / (1000 * 60 * 60 * 24 * 30.44));
                          }
                          
                          // Calculate payment count for display
                          let paymentCount = 0;
                          switch (line.paymentType) {
                            case 'Monthly':
                              paymentCount = Math.min(projectMonths, 12);
                              break;
                            case 'Quarterly':
                              paymentCount = Math.min(Math.ceil(projectMonths / 3), 4);
                              break;
                            case 'Semi-Annually':
                              paymentCount = Math.min(Math.ceil(projectMonths / 6), 2);
                              break;
                            case 'Annually':
                              paymentCount = projectMonths >= 12 ? 1 : 0;
                              break;
                            case 'One-time':
                              paymentCount = 1;
                              break;
                            default:
                              paymentCount = 1;
                          }
                          
                          return (
                            <div key={index} className="text-xs text-blue-700 mb-1">
                              {line.paymentType}: {ProjectBusinessRules.formatCurrency(amount)} × {paymentCount} payments = {ProjectBusinessRules.formatCurrency(projectAmount)} 
                              {projectMonths > 0 && ` (${projectMonths} month project)`}
                            </div>
                          );
                        })}
                      </div>
                    )}
                    
                    {/* Debug section - remove in production */}
                    {process.env.NODE_ENV === 'development' && (
                      <div className="mt-3 p-2 bg-gray-100 border border-gray-300 rounded text-xs">
                        <strong>Debug Info:</strong>
                        <br />Warnings: {validationWarnings.length}
                        <br />Budget: {form.watch('budget')}
                        <br />Start: {form.watch('expectedStart')?.toLocaleDateString()}
                        <br />End: {form.watch('expectedEnd')?.toLocaleDateString()}
                        <br />Payments: {form.watch('paymentPlanLines')?.length || 0}
                      </div>
                    )}
                  </div>
                  
                  {/* Ensure paymentPlanLines is always an array */}
                  {Array.isArray(form.watch('paymentPlanLines')) && form.watch('paymentPlanLines').map((line: PaymentPlanLine, index: number) => (
                    <div key={index} className="grid grid-cols-5 gap-4 items-start bg-gradient-to-r from-gray-50 to-white p-4 rounded-lg border border-gray-200 hover:border-primary/50 hover:shadow-md transition-all duration-300">
                      <FormField
                        control={form.control}
                        name={`paymentPlanLines.${index}.year`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="font-semibold text-gray-700">Year</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                min={2000}
                                max={2100}
                                {...field}
                                onChange={(e) => {
                                  const value = e.target.value;
                                  if (value === '') {
                                    field.onChange(new Date().getFullYear());
                                  } else {
                                    const parsed = parseInt(value);
                                    if (!isNaN(parsed)) {
                                      field.onChange(parsed);
                                    }
                                  }
                                }}
                                className="focus:ring-2 focus:ring-primary focus:border-primary transition-all duration-200 py-1 px-2 border hover:border-primary/50 text-gray-900 bg-white"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name={`paymentPlanLines.${index}.amount`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="font-semibold text-gray-700">Amount</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                step="0.01"
                                min={0}
                                {...field}
                                onChange={(e) => {
                                  const value = e.target.value;
                                  if (value === '') {
                                    field.onChange(0);
                                  } else {
                                    const parsed = parseFloat(value);
                                    if (!isNaN(parsed)) {
                                      field.onChange(parsed);
                                    }
                                  }
                                }}
                                className="focus:ring-2 focus:ring-primary focus:border-primary transition-all duration-200 py-1 px-2 border hover:border-primary/50 text-gray-900 bg-white"
                              />
                            </FormControl>
                            <FormMessage />
                            {/* Show warning if this amount would cause total to exceed budget */}
                            {(() => {
                              const currentAmount = parseFloat(line.amount?.toString()) || 0;
                              const otherLinesTotal = (form.getValues('paymentPlanLines') || [])
                                .filter((_, i) => i !== index)
                                .reduce((sum, l) => sum + (parseFloat(l.amount?.toString()) || 0), 0);
                              const totalWithCurrent = otherLinesTotal + currentAmount;
                              const budget = parseFloat(form.getValues('budget')) || 0;
                              
                              if (totalWithCurrent > budget && budget > 0) {
                                const variance = totalWithCurrent - budget;
                                const percentage = ((variance / budget) * 100).toFixed(1);
                                return (
                                  <p className="text-xs text-amber-600 mt-1">
                                    ℹ️ Total will exceed budget by {ProjectBusinessRules.formatCurrency(variance)} ({percentage}%)
                                  </p>
                                );
                              }
                              return null;
                            })()}
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name={`paymentPlanLines.${index}.currency`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="font-semibold text-gray-700">Currency</FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              value={field.value || CurrencyType.QAR}
                            >
                              <FormControl>
                                <SelectTrigger className="focus:ring-2 focus:ring-primary focus:border-primary transition-all duration-200 py-1 px-2 border hover:border-primary/50">
                                  <SelectValue placeholder="Select currency" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {Object.values(CurrencyType).map((currency) => (
                                  <SelectItem key={currency} value={currency}>
                                    {currency}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name={`paymentPlanLines.${index}.paymentType`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="font-semibold text-gray-700">Payment Type</FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              value={field.value || "Annually"}
                            >
                              <FormControl>
                                <SelectTrigger className="focus:ring-2 focus:ring-primary focus:border-primary transition-all duration-200 py-1 px-2 border hover:border-primary/50">
                                  <SelectValue placeholder="Select payment type" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="Monthly">Monthly</SelectItem>
                                <SelectItem value="Quarterly">Quarterly</SelectItem>
                                <SelectItem value="Semi-Annually">Semi-Annually</SelectItem>
                                <SelectItem value="Annually">Annually</SelectItem>
                                <SelectItem value="One-time">One-time</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name={`paymentPlanLines.${index}.description`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="font-semibold text-gray-700">Description</FormLabel>
                            <div className="flex gap-3">
                              <FormControl>
                                <Input 
                                  {...field} 
                                  placeholder="Enter payment description" 
                                  className="focus:ring-2 focus:ring-primary focus:border-primary transition-all duration-200 py-1 px-2 border hover:border-primary/50 text-gray-900 bg-white"
                                />
                              </FormControl>
                              <Button
                                type="button"
                                variant="destructive"
                                size="icon"
                                onClick={() => removePaymentLine(index)}
                                className="bg-red-500 hover:bg-red-600 text-white p-2 rounded-lg transition-all duration-200 hover:scale-105 shadow-md hover:shadow-lg"
                              >
                                <Trash2Icon className="h-5 w-5" />
                              </Button>
                            </div>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Step 3: Additional Information */}
            {currentStep === 3 && (
              <motion.div
                variants={stepVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="space-y-6"
              >
                <div className="bg-gradient-to-r from-purple-50 to-violet-50 p-6 rounded-xl border-l-4 border-purple-500">
                  <h2 className="text-xl font-bold text-gray-800 flex items-center gap-3">
                    <FileText className="h-6 w-6 text-purple-600" />
                    Step 3: Review & Submit
                  </h2>
                  <p className="text-gray-600 mt-2">Review all the information and submit your project request.</p>
                </div>
                {/* Initial Notes */}
                <FormField
                  control={form.control}
                  name="initialNotes"
                  render={({ field }) => (
                    <FormItem>
                                              <FormLabel className="flex items-center gap-2 font-semibold text-gray-700">
                        <FileText className="h-4 w-4 text-primary" />
                        Additional Notes
                      </FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Enter any additional project notes or documentation requirements" 
                          className="min-h-[120px] focus:ring-2 focus:ring-primary focus:border-primary transition-all duration-200 py-2 px-3 border hover:border-primary/50 text-gray-900 bg-white" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage className={formMessageStyles} />
                    </FormItem>
                  )}
                />

                {/* Project Summary */}
                <div className="mt-6 p-6 bg-white rounded-xl border border-gray-100 shadow-sm">
                  <h3 className="text-lg font-bold mb-4 flex items-center gap-3 text-gray-800">
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                    Project Summary
                  </h3>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm font-semibold text-gray-600 mb-1">Project Name</p>
                        <p className="font-semibold text-gray-800 text-lg">{form.watch('name') || '-'}</p>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-600 mb-1">Project Number</p>
                        <p className="font-semibold text-gray-800 text-lg font-mono">{form.watch('projectNumber') || '-'}</p>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-600 mb-1">Section</p>
                        <p className="font-semibold text-gray-800 text-lg">
                          {sections.find((s: Department) => s.id.toString() === form.watch('section'))?.sectionName || '-'}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-600 mb-1">Unit</p>
                        <p className="font-semibold text-gray-800 text-lg">
                          {filteredUnits.find((u: Department) => u.id.toString() === form.watch('unitId'))?.sectionName || '-'}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-600 mb-1">Project Manager</p>
                        <p className="font-semibold text-gray-800 text-lg">
                          {employeesData?.find((e: Employee) => e.id.toString() === form.watch('projectManagerId'))?.employeeName || '-'}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-600 mb-1">Budget</p>
                        <p className="font-semibold text-gray-800 text-lg">{form.watch('budget') || '-'}</p>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-600 mb-1">Expected Start</p>
                        <p className="font-semibold text-gray-800 text-lg">
                          {form.watch('expectedStart') ? format(form.watch('expectedStart')!, 'PPP') : '-'}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-600 mb-1">Expected End</p>
                        <p className="font-semibold text-gray-800 text-lg">
                          {form.watch('expectedEnd') ? format(form.watch('expectedEnd')!, 'PPP') : '-'}
                        </p>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-600 mb-1">Description</p>
                      <p className="font-semibold text-gray-800 text-lg mt-1">{form.watch('description') || '-'}</p>
                    </div>
                    {form.watch('paymentPlanLines')?.length > 0 && (
                      <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                        <p className="text-sm font-semibold text-gray-700 mb-3">Payment Plan</p>
                        <div className="space-y-3">
                          {form.watch('paymentPlanLines')?.map((line, index) => (
                            <div key={index} className="flex items-center justify-between text-sm bg-white p-3 rounded border border-gray-100">
                              <span className="font-medium">{line.year} - {line.paymentType}</span>
                              <span className="font-semibold text-primary">{line.amount} {line.currency}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-between pt-8 border-t border-gray-200">
              {currentStep > 1 && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={(e) => {
                    e.preventDefault();
                    prevStep();
                  }}
                  className="w-32 h-10 font-semibold border-2 border-gray-300 hover:border-primary hover:text-primary transition-all duration-200 bg-white text-gray-800 hover:bg-gray-50"
                >
                  ← Previous
                </Button>
              )}
              <div className="flex-1" />
              <Button
                type={currentStep === totalSteps ? "submit" : "button"}
                onClick={(e) => {
                  if (currentStep < totalSteps) {
                    e.preventDefault();
                    if (validateStep(currentStep)) {
                      setCurrentStep(currentStep + 1);
                    }
                  }
                }}
                className="w-32 h-10 font-semibold bg-blue-600 hover:bg-blue-700 text-white border-2 border-blue-600 transition-all duration-200 hover:scale-105 shadow-md"
                disabled={isLoading || !validateStep(currentStep)}
              >
                {isLoading 
                  ? "Processing..." 
                  : currentStep === totalSteps 
                    ? "Create Project" 
                    : "Next →"
                }
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
} 

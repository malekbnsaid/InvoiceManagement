import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, FormProvider } from 'react-hook-form';
import { CalendarIcon, Briefcase, Building2, User, DollarSign, Clock, FileText, CheckCircle2, TrashIcon, Trash2Icon } from 'lucide-react';
import { CurrencyType } from '../../types/enums';
import { toast } from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';

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
import { cn } from '../../lib/utils';
import { projectApi } from '../../services/api/projectApi';
import { departmentApi } from '../../services/api/departmentApi';
import { employeeApi } from '../../services/api/employeeApi';
import { useQuery } from '@tanstack/react-query';
import { Label } from '../ui/label';

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

interface RawPaymentPlanLine {
  year: number | string;
  amount: number | string;
  currency?: CurrencyType;
  paymentType?: string;
  description?: string;
}

// Define the form schema
const formSchema = z.object({
  name: z.string().min(1, 'Project name is required'),
  description: z.string().optional(),
  unitId: z.string().optional(),
  section: z.string().min(1, 'Section is required'),
  budget: z.string().min(1, 'Budget is required'),
  projectManagerId: z.string().min(1, 'Project manager is required'),
  expectedStart: z.date().nullable(),
  expectedEnd: z.date().nullable(),
  tenderDate: z.date().nullable(),
  paymentPlanLines: z.array(z.object({
    year: z.number().min(2000).max(2100),
    amount: z.number().min(0),
    currency: z.nativeEnum(CurrencyType),
    paymentType: z.string().min(1),
    description: z.string().optional(),
    projectId: z.number().optional()
  })),
  projectNumber: z.string().optional(),
  initialNotes: z.string().optional(),
}).refine((data) => {
  if (data.expectedStart && data.expectedEnd) {
    return data.expectedEnd >= data.expectedStart;
  }
  return true;
}, {
  message: "End date must be after start date",
  path: ["expectedEnd"],
});

// Define the form values type
type FormValues = z.infer<typeof formSchema>;

interface ProjectFormProps {
  onSubmit: (data: FormValues) => void;
  isLoading?: boolean;
  initialData?: FormValues;
}

// Helper function to ensure payment plan lines are in the correct format
const normalizePaymentPlanLines = (data: any) => {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  if (data.$values && Array.isArray(data.$values)) return data.$values;
  return [];
};

export default function ProjectForm({ onSubmit, isLoading = false, initialData }: ProjectFormProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 3;
  const { user } = useAuth();

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

  const { data: employeesData, error: employeesError } = useQuery({
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

  // Validate current step
  const validateStep = (step: number): boolean => {
    const values = form.getValues();
    switch (step) {
      case 1:
        return !!values.name && !!values.section && !!values.projectManagerId;
      case 2:
        return !!values.budget;
      case 3:
        // Validate PaymentPlanLines
        const paymentLines = values.paymentPlanLines || [];
        if (paymentLines.length === 0) return false;
        return paymentLines.every(line => 
          line.year && !isNaN(line.year) && 
          line.amount && !isNaN(line.amount) && 
          line.currency && 
          line.paymentType
        );
      default:
        return false;
    }
  };

  // Handle next step
  const nextStep = () => {
    if (currentStep < totalSteps && validateStep(currentStep)) {
      setCurrentStep(currentStep + 1);
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
        currency: CurrencyType.SAR,
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
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant={"outline"}
                                className={cn(
                                  "w-full pl-3 text-left font-normal py-2 px-3 border hover:border-primary/50 transition-all duration-200",
                                  !field.value && "text-muted-foreground"
                                )}
                              >
                                {field.value ? (
                                  format(field.value, "PPP")
                                ) : (
                                  <span>Pick a date</span>
                                )}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={field.value ?? undefined}
                              onSelect={(date) => {
                                field.onChange(date ?? null);
                                const endDate = form.getValues("expectedEnd");
                                if (endDate && date && endDate < date) {
                                  form.setValue("expectedEnd", null);
                                }
                              }}
                              disabled={(date) => date < new Date("1900-01-01")}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
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
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant={"outline"}
                                className={cn(
                                  "w-full pl-3 text-left font-normal py-2 px-3 border hover:border-primary/50 transition-all duration-200",
                                  !field.value && "text-muted-foreground"
                                )}
                              >
                                {field.value ? (
                                  format(field.value, "PPP")
                                ) : (
                                  <span>Pick a date</span>
                                )}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={field.value ?? undefined}
                              onSelect={field.onChange}
                              disabled={(date) => {
                                const startDate = form.getValues("expectedStart");
                                return Boolean(date < new Date("1900-01-01") || (startDate && date < startDate));
                              }}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
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
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant={"outline"}
                                className={cn(
                                  "w-full pl-3 text-left font-normal py-2 px-3 border hover:border-primary/50 transition-all duration-200",
                                  !field.value && "text-muted-foreground"
                                )}
                              >
                                {field.value ? (
                                  format(field.value, "PPP")
                                ) : (
                                  <span>Pick a date</span>
                                )}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={field.value ?? undefined}
                              onSelect={field.onChange}
                              disabled={(date) => date < new Date("1900-01-01")}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
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
                                <SelectItem value="Annually">Annually</SelectItem>
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

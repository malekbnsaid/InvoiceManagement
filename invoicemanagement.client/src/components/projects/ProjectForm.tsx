import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, FormProvider } from 'react-hook-form';
import { CalendarIcon, Briefcase, Building2, User, DollarSign, Clock, FileText, CheckCircle2 } from 'lucide-react';
import { CurrencyType } from '../../types/enums';

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
import { projectApi, departmentApi, employeeApi } from '../../services/api';
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

export default function ProjectForm({ onSubmit, isLoading = false, initialData }: ProjectFormProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 3;

  // Initialize form
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: initialData || {
      name: '',
      description: '',
      unitId: '',
      section: '',
      budget: '',
      projectManagerId: '',
      expectedStart: null,
      expectedEnd: null,
      tenderDate: null,
      paymentPlanLines: [],
      projectNumber: '',
      initialNotes: '',
    },
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
        return true;
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

  // Payment plan line handlers
  const addPaymentLine = () => {
    const currentLines = form.getValues("paymentPlanLines");
    form.setValue("paymentPlanLines", [
      ...currentLines,
      {
        year: new Date().getFullYear(),
        amount: 0,
        currency: CurrencyType.SAR,
        paymentType: "Annually",
        description: "",
        projectId: undefined
      },
    ]);
  };

  const removePaymentLine = (index: number) => {
    const currentLines = form.getValues("paymentPlanLines");
    form.setValue(
      "paymentPlanLines",
      currentLines.filter((_, i) => i !== index)
    );
  };

  // Handle form submission
  const handleFormSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const values = form.getValues();
    
    if (currentStep < totalSteps) {
      if (validateStep(currentStep)) {
        setCurrentStep(currentStep + 1);
      }
      return;
    }

    try {
      // Transform payment plan lines to include project reference
      const paymentPlanLines = values.paymentPlanLines.map(line => ({
        ...line,
        amount: Number(line.amount),
        year: Number(line.year),
        projectId: line.projectId || 0  // This will be set by the backend
      }));

      // Ensure all values are in the correct format
      const submissionData: FormValues = {
        name: values.name,
        description: values.description,
        section: values.section,
        projectManagerId: values.projectManagerId,
        budget: values.budget,
        unitId: values.unitId || undefined,
        projectNumber: values.projectNumber,
        initialNotes: values.initialNotes,
        expectedStart: values.expectedStart,
        expectedEnd: values.expectedEnd,
        tenderDate: values.tenderDate,
        paymentPlanLines
      };

      console.log('Submitting data:', submissionData);
      await onSubmit(submissionData);
    } catch (error) {
      console.error('Error submitting form:', error);
    }
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>Create New Project</CardTitle>
      </CardHeader>

      <CardContent className="p-6">
        <Form {...form}>
          <form onSubmit={handleFormSubmit} className="space-y-6">
            {/* Step indicator */}
            <div className="flex justify-between items-center mb-8">
              {Array.from({ length: totalSteps }).map((_, index) => (
                <div key={index} className="flex items-center">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      currentStep > index + 1
                        ? 'bg-primary text-white'
                        : currentStep === index + 1
                        ? 'bg-primary text-white'
                        : 'bg-gray-200 text-gray-600'
                    }`}
                  >
                    {index + 1}
                  </div>
                  {index < totalSteps - 1 && (
                    <div
                      className={`w-24 h-1 ${
                        currentStep > index + 1 ? 'bg-primary' : 'bg-gray-200'
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
                {/* Project Name */}
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <Briefcase className="h-4 w-4 text-primary" />
                        Project Name
                      </FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Enter project name" 
                          className="focus:ring-2 focus:ring-primary focus:border-primary transition-all" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage className={formMessageStyles} />
                    </FormItem>
                  )}
                />

                {/* Section and Project Number in a grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Section Selection */}
                  <FormField
                    control={form.control}
                    name="section"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-primary" />
                          Section
                        </FormLabel>
                        <FormControl>
                          <Select
                            onValueChange={(value) => {
                              if (value) {
                                field.onChange(value);
                                form.setValue('unitId', '');
                                updateProjectNumber(value);
                              }
                            }}
                            value={field.value}
                            defaultValue={field.value}
                          >
                            <SelectTrigger className="focus:ring-2 focus:ring-primary focus:border-primary transition-all">
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
                        <FormLabel className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-primary" />
                          Project Number
                        </FormLabel>
                        <FormControl>
                          <Input 
                            {...field} 
                            disabled 
                            className="bg-gray-50 dark:bg-gray-800"
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
                      <FormLabel className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-primary" />
                        Unit (Optional)
                      </FormLabel>
                      <FormControl>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                          defaultValue={field.value}
                          disabled={!sectionValue}
                        >
                          <SelectTrigger className="focus:ring-2 focus:ring-primary focus:border-primary transition-all">
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
                      <FormLabel className="flex items-center gap-2">
                        <User className="h-4 w-4 text-primary" />
                        Project Manager
                      </FormLabel>
                      <FormControl>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                          defaultValue={field.value}
                        >
                          <SelectTrigger className="focus:ring-2 focus:ring-primary focus:border-primary transition-all">
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
                      <FormLabel className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-primary" />
                        Description (Optional)
                      </FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Enter project description (optional)" 
                          className="min-h-[120px] focus:ring-2 focus:ring-primary focus:border-primary transition-all" 
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Expected Start Date */}
                  <FormField
                    control={form.control}
                    name="expectedStart"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel className="flex items-center gap-2">
                          <CalendarIcon className="h-4 w-4 text-primary" />
                          Expected Start Date
                        </FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant={"outline"}
                                className={cn(
                                  "w-full pl-3 text-left font-normal",
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
                        <FormLabel className="flex items-center gap-2">
                          <CalendarIcon className="h-4 w-4 text-primary" />
                          Expected End Date
                        </FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant={"outline"}
                                className={cn(
                                  "w-full pl-3 text-left font-normal",
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
                        <FormLabel className="flex items-center gap-2">
                          <CalendarIcon className="h-4 w-4 text-primary" />
                          Tender Date
                        </FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant={"outline"}
                                className={cn(
                                  "w-full pl-3 text-left font-normal",
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
                        <FormLabel className="flex items-center gap-2">
                          <DollarSign className="h-4 w-4 text-primary" />
                          Budget
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            placeholder="Enter project budget"
                            className="focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage className={formMessageStyles} />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Payment Plan Section */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium">Payment Plan</h3>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={addPaymentLine}
                    >
                      Add Payment Line
                    </Button>
                  </div>

                  {form.watch("paymentPlanLines")?.map((line, index) => (
                    <div key={index} className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 border rounded-lg">
                      <FormField
                        control={form.control}
                        name={`paymentPlanLines.${index}.year`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Year</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                min={2000}
                                max={2100}
                                {...field}
                                onChange={(e) => field.onChange(parseInt(e.target.value))}
                              />
                            </FormControl>
                            <FormMessage className={formMessageStyles} />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name={`paymentPlanLines.${index}.amount`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Amount</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                step="0.01"
                                min={0}
                                {...field}
                                onChange={(e) => field.onChange(parseFloat(e.target.value))}
                              />
                            </FormControl>
                            <FormMessage className={formMessageStyles} />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name={`paymentPlanLines.${index}.currency`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Currency</FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              value={field.value}
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
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
                            <FormMessage className={formMessageStyles} />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name={`paymentPlanLines.${index}.paymentType`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Payment Type</FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              value={field.value}
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select payment type" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="Monthly">Monthly</SelectItem>
                                <SelectItem value="Quarterly">Quarterly</SelectItem>
                                <SelectItem value="Annually">Annually</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage className={formMessageStyles} />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name={`paymentPlanLines.${index}.description`}
                        render={({ field }) => (
                          <FormItem className="md:col-span-2">
                            <FormLabel>Description</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="Enter payment description" />
                            </FormControl>
                            <FormMessage className={formMessageStyles} />
                          </FormItem>
                        )}
                      />

                      <Button
                        type="button"
                        variant="destructive"
                        className="md:col-span-2"
                        onClick={() => removePaymentLine(index)}
                      >
                        Remove Payment Line
                      </Button>
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
                {/* Initial Notes */}
                <FormField
                  control={form.control}
                  name="initialNotes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-primary" />
                        Additional Notes
                      </FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Enter any additional project notes or documentation requirements" 
                          className="min-h-[120px] focus:ring-2 focus:ring-primary focus:border-primary transition-all" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage className={formMessageStyles} />
                    </FormItem>
                  )}
                />

                {/* Project Summary */}
                <div className="mt-8 p-6 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-primary" />
                    Project Summary
                  </h3>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Project Name</p>
                        <p className="font-medium">{form.watch('name') || '-'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Project Number</p>
                        <p className="font-medium">{form.watch('projectNumber') || '-'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Section</p>
                        <p className="font-medium">
                          {sections.find((s: Department) => s.id.toString() === form.watch('section'))?.sectionName || '-'}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Unit</p>
                        <p className="font-medium">
                          {filteredUnits.find((u: Department) => u.id.toString() === form.watch('unitId'))?.sectionName || '-'}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Project Manager</p>
                        <p className="font-medium">
                          {employeesData?.find((e: Employee) => e.id.toString() === form.watch('projectManagerId'))?.employeeName || '-'}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Budget</p>
                        <p className="font-medium">{form.watch('budget') || '-'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Expected Start</p>
                        <p className="font-medium">
                          {form.watch('expectedStart') ? format(form.watch('expectedStart')!, 'PPP') : '-'}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Expected End</p>
                        <p className="font-medium">
                          {form.watch('expectedEnd') ? format(form.watch('expectedEnd')!, 'PPP') : '-'}
                        </p>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Description</p>
                      <p className="font-medium mt-1">{form.watch('description') || '-'}</p>
                    </div>
                    {form.watch('paymentPlanLines')?.length > 0 && (
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Payment Plan</p>
                        <div className="space-y-2">
                          {form.watch('paymentPlanLines')?.map((line, index) => (
                            <div key={index} className="flex items-center justify-between text-sm">
                              <span>{line.year} - {line.paymentType}</span>
                              <span>{line.amount} {line.currency}</span>
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
            <div className="flex justify-between pt-6">
              {currentStep > 1 && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={(e) => {
                    e.preventDefault();
                    prevStep();
                  }}
                  className="w-24"
                >
                  Previous
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
                className="w-24"
                disabled={isLoading || !validateStep(currentStep)}
              >
                {isLoading 
                  ? "Processing..." 
                  : currentStep === totalSteps 
                    ? "Create" 
                    : "Next"
                }
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
} 

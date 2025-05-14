import React from 'react';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, FormProvider } from 'react-hook-form';
import { CalendarIcon, Briefcase, Building2, User, DollarSign, Clock, FileText, CheckCircle2 } from 'lucide-react';

import { Button } from '../ui/Button';
import {
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

// CSS for form message consistency
const formMessageStyles = "text-sm font-medium text-destructive mt-1";

// Define a schema for form validation
const formSchema = z.object({
  name: z.string().min(1, 'Project name is required'),
  description: z.string().min(1, 'Description is required'),
  unitId: z.string().min(1, 'Unit is required'),
  section: z.string().min(1, 'Section is required'),
  budget: z.string().min(1, 'Budget is required'),
  projectManager: z.string().min(1, 'Project manager is required'),
  expectedStart: z.date({
    required_error: "Start date is required",
    invalid_type_error: "Start date is required",
  }),
  expectedEnd: z.date({
    required_error: "End date is required",
    invalid_type_error: "End date is required",
  }),
  purchaseDate: z.date({
    required_error: "Purchase date is required",
    invalid_type_error: "Purchase date is required",
  }),
  paymentPlan: z.string().optional(),
  projectNumber: z.string().optional(),
  initialNotes: z.string().optional(),
});

const sections = [
  { id: 1, name: 'Information Security Office', abbreviation: 'ISO' },
  { id: 2, name: 'Technical Support Services', abbreviation: 'TSS' },
  { id: 3, name: 'Infrastructure & Systems Support', abbreviation: 'ISS' },
  { id: 4, name: 'Applications', abbreviation: 'APP' },
];

const units = [
  { id: 1, name: 'Security Operations', sectionId: 1 },
  { id: 2, name: 'Governance & Compliance', sectionId: 1 },
  { id: 3, name: 'Risk Management', sectionId: 1 },
  { id: 4, name: 'Desktop Support', sectionId: 2 },
  { id: 5, name: 'Service Desk', sectionId: 2 },
  { id: 6, name: 'Device Management', sectionId: 2 },
  { id: 7, name: 'Network Infrastructure', sectionId: 3 },
  { id: 8, name: 'Server Management', sectionId: 3 },
  { id: 9, name: 'Cloud Services', sectionId: 3 },
  { id: 10, name: 'Business Applications', sectionId: 4 },
  { id: 11, name: 'Custom Development', sectionId: 4 },
  { id: 12, name: 'Application Integration', sectionId: 4 },
];

interface ProjectFormProps {
  onSubmit: (data: any) => void;
  isLoading?: boolean;
}

export default function ProjectForm({ onSubmit, isLoading = false }: ProjectFormProps) {
  const [selectedSection, setSelectedSection] = useState(null as string | null);
  const [generatedProjectNumber, setGeneratedProjectNumber] = useState('' as string);
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 3;

  // Initialize form
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      description: '',
      unitId: '',
      section: '',
      budget: '',
      projectManager: '',
      paymentPlan: '',
      projectNumber: '',
      initialNotes: '',
    },
  });

  // Generate project number when section is selected
  useEffect(() => {
    const sectionValue = form.watch('section');
    if (sectionValue) {
      setSelectedSection(sectionValue);
      const section = sections.find(s => s.id.toString() === sectionValue);
      if (section) {
        const currentDate = new Date();
        const month = currentDate.getMonth() + 1; // JavaScript months are 0-indexed
        const year = currentDate.getFullYear();
        const projectNumber = `${section.abbreviation}/${month}/${year}`;
        setGeneratedProjectNumber(projectNumber);
        form.setValue('projectNumber', projectNumber);
      }
    }
  }, [form.watch('section'), form]);

  // Filter units by selected section
  const filteredUnits = selectedSection
    ? units.filter(unit => unit.sectionId === parseInt(selectedSection))
    : [];

  const handleFormSubmit = (values: z.infer<typeof formSchema>) => {
    onSubmit({
      ...values,
      budget: parseFloat(values.budget),
      unitId: parseInt(values.unitId),
    });
  };

  const nextStep = () => {
    if (currentStep < totalSteps) {
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

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card className="w-full max-w-4xl mx-auto shadow-lg border-t-4 border-t-primary">
        <CardHeader className="bg-gray-50 dark:bg-gray-800 rounded-t-lg">
          <div className="flex justify-between items-center">
            <CardTitle className="text-2xl font-bold text-primary">New Project Request</CardTitle>
            <div className="flex items-center gap-2">
              {Array.from({ length: totalSteps }).map((_, idx) => (
                <div
                  key={idx}
                  className={`w-3 h-3 rounded-full ${
                    currentStep > idx 
                      ? 'bg-primary' 
                      : currentStep === idx + 1 
                        ? 'bg-primary/60' 
                        : 'bg-gray-300 dark:bg-gray-600'
                  }`}
                />
              ))}
            </div>
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400 mt-2">
            Step {currentStep} of {totalSteps}: {
              currentStep === 1 ? 'Project Information' :
              currentStep === 2 ? 'Timeline & Budget' :
              'Additional Information'
            }
          </div>
        </CardHeader>

        <CardContent className="p-6">
          <FormProvider
            {...form}
            children={
              <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-6">
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

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                                onValueChange={(value: string) => {
                                  field.onChange(value);
                                  form.setValue('unitId', '');
                                }}
                                value={field.value}
                              >
                                <SelectTrigger className="focus:ring-2 focus:ring-primary focus:border-primary transition-all">
                                  <SelectValue placeholder="Select section" />
                                </SelectTrigger>
                                <SelectContent>
                                  {sections.map((section) => (
                                    <SelectItem key={section.id} value={section.id.toString()}>
                                      {section.name}
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
                                value={generatedProjectNumber || 'Select a section first'} 
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
                            Unit
                          </FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            value={field.value}
                            disabled={!selectedSection}
                          >
                            <SelectTrigger className="focus:ring-2 focus:ring-primary focus:border-primary transition-all">
                              <SelectValue placeholder="Select unit" />
                            </SelectTrigger>
                            <SelectContent>
                              {filteredUnits.map((unit) => (
                                <SelectItem key={unit.id} value={unit.id.toString()}>
                                  {unit.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage className={formMessageStyles} />
                        </FormItem>
                      )}
                    />

                    {/* Project Manager */}
                    <FormField
                      control={form.control}
                      name="projectManager"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2">
                            <User className="h-4 w-4 text-primary" />
                            Project Manager
                          </FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="Enter project manager name" 
                              className="focus:ring-2 focus:ring-primary focus:border-primary transition-all" 
                              {...field} 
                            />
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
                            Description
                          </FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Enter project description" 
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
                              placeholder="Enter budget amount" 
                              className="focus:ring-2 focus:ring-primary focus:border-primary transition-all" 
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage className={formMessageStyles} />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Expected Start Date */}
                      <FormField
                        control={form.control}
                        name="expectedStart"
                        render={({ field }) => (
                          <FormItem className="flex flex-col">
                            <FormLabel className="flex items-center gap-2">
                              <Clock className="h-4 w-4 text-primary" />
                              Expected Start Date
                            </FormLabel>
                            <Popover>
                              <PopoverTrigger asChild>
                                <FormControl>
                                  <Button
                                    variant="outline"
                                    className={cn(
                                      "w-full pl-3 text-left font-normal focus:ring-2 focus:ring-primary focus:border-primary transition-all",
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
                                  selected={field.value}
                                  onSelect={field.onChange}
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
                              <Clock className="h-4 w-4 text-primary" />
                              Expected End Date
                            </FormLabel>
                            <Popover>
                              <PopoverTrigger asChild>
                                <FormControl>
                                  <Button
                                    variant="outline"
                                    className={cn(
                                      "w-full pl-3 text-left font-normal focus:ring-2 focus:ring-primary focus:border-primary transition-all",
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
                                  selected={field.value}
                                  onSelect={field.onChange}
                                  initialFocus
                                />
                              </PopoverContent>
                            </Popover>
                            <FormMessage className={formMessageStyles} />
                          </FormItem>
                        )}
                      />
                    </div>

                    {/* Payment Plan */}
                    <FormField
                      control={form.control}
                      name="paymentPlan"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2">
                            <DollarSign className="h-4 w-4 text-primary" />
                            Payment Plan
                          </FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Enter payment plan details for upcoming years" 
                              className="min-h-[80px] focus:ring-2 focus:ring-primary focus:border-primary transition-all" 
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage className={formMessageStyles} />
                        </FormItem>
                      )}
                    />
                  </motion.div>
                )}

                {/* Step 3: Documentation & Details */}
                {currentStep === 3 && (
                  <motion.div
                    variants={stepVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    className="space-y-6"
                  >
                    <div className="grid grid-cols-1 gap-6">
                      {/* Purchase Date */}
                      <FormField
                        control={form.control}
                        name="purchaseDate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center gap-2">
                              <Calendar className="h-4 w-4 text-primary" />
                              Initial Purchase Date
                            </FormLabel>
                            <FormControl>
                              <div>
                                <Popover>
                                  <PopoverTrigger asChild>
                                    <Button
                                      variant="outline"
                                      className={cn(
                                        "w-full pl-3 text-left font-normal focus:ring-2 focus:ring-primary focus:border-primary transition-all",
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
                                  </PopoverTrigger>
                                  <PopoverContent className="w-auto p-0" align="start">
                                    <Calendar
                                      mode="single"
                                      selected={field.value}
                                      onSelect={field.onChange}
                                      initialFocus
                                    />
                                  </PopoverContent>
                                </Popover>
                              </div>
                            </FormControl>
                            <FormMessage className={formMessageStyles} />
                          </FormItem>
                        )}
                      />

                      {/* Additional Notes */}
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
                    </div>

                    {/* LPO Relationship Note */}
                    <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-100 dark:border-blue-800">
                      <div className="flex items-start gap-3">
                        <FileText className="h-5 w-5 text-blue-500 mt-0.5" />
                        <div>
                          <h3 className="font-medium text-blue-800 dark:text-blue-300">LPO Management</h3>
                          <p className="text-sm text-blue-600 dark:text-blue-400 mt-1">
                            You'll be able to add multiple LPOs to this project after it's created. Each LPO can then have multiple invoices associated with it.
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Summary Section */}
                    <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                      <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                        <CheckCircle2 className="h-5 w-5 text-primary" />
                        Project Summary
                      </h3>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-gray-500 dark:text-gray-400">Project Number:</p>
                          <p className="font-medium">{generatedProjectNumber || 'Not generated yet'}</p>
                        </div>
                        <div>
                          <p className="text-gray-500 dark:text-gray-400">Project Name:</p>
                          <p className="font-medium">{form.watch('name') || 'Not specified'}</p>
                        </div>
                        <div>
                          <p className="text-gray-500 dark:text-gray-400">Budget:</p>
                          <p className="font-medium">{form.watch('budget') ? `$${form.watch('budget')}` : 'Not specified'}</p>
                        </div>
                        <div>
                          <p className="text-gray-500 dark:text-gray-400">Project Manager:</p>
                          <p className="font-medium">{form.watch('projectManager') || 'Not specified'}</p>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Navigation buttons */}
                <div className="flex justify-between mt-8 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={prevStep}
                    disabled={currentStep === 1 || isLoading}
                    className="transition-all"
                  >
                    Back
                  </Button>
                  
                  {currentStep < totalSteps ? (
                    <Button 
                      type="button" 
                      onClick={nextStep}
                      className="bg-primary hover:bg-primary/90 transition-all"
                    >
                      Continue
                    </Button>
                  ) : (
                    <Button 
                      type="submit"
                      disabled={isLoading}
                      className="bg-primary hover:bg-primary/90 transition-all"
                    >
                      {isLoading ? (
                        <div className="flex items-center gap-2">
                          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Submitting...
                        </div>
                      ) : (
                        'Submit Project Request'
                      )}
                    </Button>
                  )}
                </div>
              </form>
            }
          />
        </CardContent>
      </Card>
    </motion.div>
  );
} 
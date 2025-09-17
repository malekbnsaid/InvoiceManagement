import { CurrencyType } from '../types/enums';

export interface ValidationResult {
  valid: boolean;
  message?: string;
  warning?: string;
}

export interface PaymentPlanLine {
  year: number;
  amount: number;
  currency: CurrencyType;
  description?: string;
}

// Valid payment types with their characteristics
export const PAYMENT_TYPES = {
  'Annually': { 
    name: 'Annually', 
    frequency: 1, 
    description: 'Once per year',
    minAmount: 1000,
    maxAmount: 10000000
  },
  'Semi-Annually': { 
    name: 'Semi-Annually', 
    frequency: 2, 
    description: 'Twice per year',
    minAmount: 500,
    maxAmount: 5000000
  },
  'Quarterly': { 
    name: 'Quarterly', 
    frequency: 4, 
    description: 'Four times per year',
    minAmount: 250,
    maxAmount: 2500000
  },
  'Monthly': { 
    name: 'Monthly', 
    frequency: 12, 
    description: 'Twelve times per year',
    minAmount: 100,
    maxAmount: 1000000
  },
  'One-time': { 
    name: 'One-time', 
    frequency: 1, 
    description: 'Single payment',
    minAmount: 1000,
    maxAmount: 10000000
  }
} as const;

export interface ProjectValidationData {
  budget: number;
  paymentPlanLines: PaymentPlanLine[];
  expectedStart?: Date;
  expectedEnd?: Date;
  tenderDate?: Date;
  userRole?: string;
}

export class ProjectBusinessRules {
  // Budget validation rules
  static validateBudget(budget: number, userRole: string = 'User'): ValidationResult {
    if (budget < 1000) {
      return { 
        valid: false, 
        message: "Minimum budget is $1,000. Projects under this amount should be handled as expenses." 
      };
    }
    
    // Check for decimal precision (only 2 decimal places for money)
    const decimalPlaces = (budget.toString().split('.')[1] || '').length;
    if (decimalPlaces > 2) {
      return { 
        valid: false, 
        message: "Budget amount can only have up to 2 decimal places." 
      };
    }
    
    // Warning for small budgets
    if (budget < 10000) {
      return { 
        valid: true, 
        warning: `Budget is relatively small (${this.formatCurrency(budget)}). Consider if this should be handled as an expense instead.` 
      };
    }
    
    // Warning for large budgets requiring approval
    if (budget > 1000000 && !['Admin', 'Head', 'PMO'].includes(userRole)) {
      return { 
        valid: true, 
        warning: `Budget exceeds $1,000,000 (${this.formatCurrency(budget)}). This will require PMO approval.` 
      };
    }
    
    if (budget > 10000000 && userRole !== 'Admin') {
      return { 
        valid: true, 
        warning: `Budget exceeds $10,000,000 (${this.formatCurrency(budget)}). This will require board approval.` 
      };
    }
    
    return { valid: true };
  }

  // Payment plan validation rules (yearly payments only)
  static validatePaymentPlan(payments: PaymentPlanLine[], budget: number, projectStart?: Date, projectEnd?: Date): ValidationResult {
    if (payments.length === 0) {
      return { 
        valid: false, 
        message: "At least one payment plan line is required." 
      };
    }

    // Validate payment amounts (yearly payments)
    for (let i = 0; i < payments.length; i++) {
      const payment = payments[i];
      
      // Check minimum amount for yearly payments
      if (payment.amount < 1000) {
        return { 
          valid: false, 
          message: `Payment plan line ${i + 1}: Amount ${this.formatCurrency(payment.amount)} is below minimum for yearly payments (${this.formatCurrency(1000)}).` 
        };
      }

      // Check maximum amount for yearly payments
      if (payment.amount > 10000000) {
        return { 
          valid: false, 
          message: `Payment plan line ${i + 1}: Amount ${this.formatCurrency(payment.amount)} exceeds maximum for yearly payments (${this.formatCurrency(10000000)}).` 
        };
      }
    }

    // Check for minimum payment amounts (general rule)
    const invalidPayments = payments.filter(p => p.amount < 100);
    if (invalidPayments.length > 0) {
      return { 
        valid: false, 
        message: "Each payment must be at least $100." 
      };
    }

    // Check for maximum payment amounts (general rule)
    const excessivePayments = payments.filter(p => p.amount > 5000000);
    if (excessivePayments.length > 0) {
      return { 
        valid: false, 
        message: "Individual payments cannot exceed $5,000,000." 
      };
    }

    // Check currency consistency
    const currencies = payments.map(p => p.currency);
    const uniqueCurrencies = [...new Set(currencies)];
    if (uniqueCurrencies.length > 1) {
      return { 
        valid: false, 
        message: "All payment plan lines must use the same currency." 
      };
    }

    // Check for sequential years (business rule)
    const years = payments.map(p => p.year).sort((a, b) => a - b);
    
    // Check for gaps in years (warn if not sequential)
    for (let i = 1; i < years.length; i++) {
      if (years[i] - years[i-1] > 1) {
        return { 
          valid: true, 
          warning: `Payment plan has gaps between years (${years[i-1]} to ${years[i]}). Consider if this is intentional.` 
        };
      }
    }

    // Check for duplicate years
    const duplicateYears = years.filter((year, index) => years.indexOf(year) !== index);
    if (duplicateYears.length > 0) {
      return { 
        valid: false, 
        message: `Duplicate payment years found: ${duplicateYears.join(', ')}. Each year should have only one payment.` 
      };
    }

    // Calculate total payment plan based on project duration if available, otherwise use annual calculation
    const totalPaymentPlan = projectStart && projectEnd 
      ? this.calculateTotalProjectPaymentPlan(payments, projectStart, projectEnd)
      : payments.reduce((sum, line) => {
          return sum + line.amount;
        }, 0);
    
    const variance = budget > 0 ? Math.abs(totalPaymentPlan - budget) / budget : 0;
    
    // Check for decimal precision (only 2 decimal places for money)
    const invalidPrecision = payments.filter(p => {
      const decimalPlaces = (p.amount.toString().split('.')[1] || '').length;
      return decimalPlaces > 2;
    });
    if (invalidPrecision.length > 0) {
      return { 
        valid: false, 
        message: "Payment amounts can only have up to 2 decimal places." 
      };
    }
    
    if (variance > 0.5) { // 50% variance
      return { 
        valid: true, 
        warning: `Payment plan total (${this.formatCurrency(totalPaymentPlan)}) differs significantly from budget (${this.formatCurrency(budget)}). Please review for accuracy.` 
      };
    }
    
    if (totalPaymentPlan > budget) {
      return { 
        valid: true, 
        warning: `Payment plan total (${this.formatCurrency(totalPaymentPlan)}) exceeds budget (${this.formatCurrency(budget)}). This may include financing costs or contingencies.` 
      };
    }

    return { valid: true };
  }

  // Helper function to check if date is a business day (Monday-Friday)
  private static isBusinessDay(date: Date): boolean {
    const day = date.getDay();
    return day >= 1 && day <= 5; // Monday = 1, Friday = 5
  }

  // Helper function to get next business day
  private static getNextBusinessDay(date: Date): Date {
    const nextDay = new Date(date);
    nextDay.setDate(nextDay.getDate() + 1);
    
    while (!this.isBusinessDay(nextDay)) {
      nextDay.setDate(nextDay.getDate() + 1);
    }
    
    return nextDay;
  }

  // Date validation rules
  static validateDates(data: {
    expectedStart?: Date;
    expectedEnd?: Date;
    tenderDate?: Date;
  }): ValidationResult {
    console.log('validateDates called with:', data);
    // Use UTC to avoid timezone issues
    const today = new Date();
    const todayUTC = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const warnings: string[] = [];

    // Validate start date
    if (data.expectedStart) {
      const startDateUTC = new Date(data.expectedStart.getFullYear(), data.expectedStart.getMonth(), data.expectedStart.getDate());
      console.log('Start date validation:', {
        startDate: data.expectedStart,
        startDateUTC: startDateUTC,
        todayUTC: todayUTC,
        isPast: startDateUTC < todayUTC
      });
      if (startDateUTC < todayUTC) {
        console.log('Start date is in the past, returning error');
        return { 
          valid: false, 
          message: "Project start date cannot be in the past." 
        };
      }

      // Warn if start date is not a business day
      console.log('Checking business day for start date:', data.expectedStart, 'isBusinessDay:', this.isBusinessDay(data.expectedStart));
      if (!this.isBusinessDay(data.expectedStart)) {
        const nextBusinessDay = this.getNextBusinessDay(data.expectedStart);
        const warning = `Project start date (${data.expectedStart.toLocaleDateString()}) is not a business day. Consider starting on ${nextBusinessDay.toLocaleDateString()}.`;
        console.log('Adding business day warning:', warning);
        warnings.push(warning);
      }
    }

    // Validate end date
    if (data.expectedEnd) {
      const endDateUTC = new Date(data.expectedEnd.getFullYear(), data.expectedEnd.getMonth(), data.expectedEnd.getDate());
      if (endDateUTC < todayUTC) {
        return { 
          valid: false, 
          message: "Project end date cannot be in the past." 
        };
      }

      // Check if end date is before start date
      if (data.expectedStart) {
        const startDateUTC = new Date(data.expectedStart.getFullYear(), data.expectedStart.getMonth(), data.expectedStart.getDate());
        if (endDateUTC < startDateUTC) {
          return { 
            valid: false, 
            message: "Project end date cannot be before the start date." 
          };
        }
      }

      // Warn if end date is not a business day
      console.log('Checking business day for end date:', data.expectedEnd, 'isBusinessDay:', this.isBusinessDay(data.expectedEnd));
      if (!this.isBusinessDay(data.expectedEnd)) {
        const nextBusinessDay = this.getNextBusinessDay(data.expectedEnd);
        const warning = `Project end date (${data.expectedEnd.toLocaleDateString()}) is not a business day. Consider ending on ${nextBusinessDay.toLocaleDateString()}.`;
        console.log('Adding business day warning for end date:', warning);
        warnings.push(warning);
      }
    }

    // Validate start vs end date
    if (data.expectedStart && data.expectedEnd) {
      const duration = data.expectedEnd.getTime() - data.expectedStart.getTime();
      const days = duration / (1000 * 60 * 60 * 24);
      
      console.log('Project duration calculation:', {
        startDate: data.expectedStart,
        endDate: data.expectedEnd,
        durationMs: duration,
        days: days
      });
      
      if (days < 1) {
        return { 
          valid: false, 
          message: "Project duration must be at least 1 day." 
        };
      }
      
      if (days > 3650) { // 10 years
        return { 
          valid: false, 
          message: "Project duration cannot exceed 10 years. Please break into smaller projects." 
        };
      }

      // Warn for very short projects (less than 1 week)
      if (days < 7) {
        const warning = `Project duration is very short (${Math.ceil(days)} days). Consider if this should be handled as an expense instead.`;
        console.log('Adding short project warning:', warning);
        warnings.push(warning);
      }

      // Warn for very long projects (more than 5 years)
      if (days > 1825) { // 5 years
        const warning = `Project duration is very long (${Math.ceil(days / 365)} years). Consider breaking into phases.`;
        console.log('Adding long project warning:', warning);
        warnings.push(warning);
      }
    }

    // Validate tender date
    if (data.tenderDate && data.expectedStart) {
      const tenderDateUTC = new Date(data.tenderDate.getFullYear(), data.tenderDate.getMonth(), data.tenderDate.getDate());
      const startDateUTC = new Date(data.expectedStart.getFullYear(), data.expectedStart.getMonth(), data.expectedStart.getDate());
      console.log('Tender date validation check:', {
        tenderDate: data.tenderDate,
        tenderDateUTC: tenderDateUTC,
        startDate: data.expectedStart,
        startDateUTC: startDateUTC,
        isTenderAfterStart: tenderDateUTC >= startDateUTC
      });
      if (tenderDateUTC >= startDateUTC) {
        console.log('Tender date validation failed: tender date is on or after start date');
        return { 
          valid: false, 
          message: "Tender date must be before project start date." 
        };
      }

      // Warn if tender date is too close to start date (less than 30 days)
      const daysBetween = (data.expectedStart.getTime() - data.tenderDate.getTime()) / (1000 * 60 * 60 * 24);
      console.log('Tender date validation:', {
        tenderDate: data.tenderDate,
        startDate: data.expectedStart,
        daysBetween: daysBetween
      });
      if (daysBetween < 30) {
        const warning = `Tender date is only ${Math.ceil(daysBetween)} days before project start. Consider allowing more time for tender evaluation.`;
        console.log('Adding tender date warning:', warning);
        warnings.push(warning);
      }
    }

    // Return result with all warnings
    console.log('Date validation warnings collected:', warnings);
    if (warnings.length > 0) {
      const result = { 
        valid: true, 
        warning: warnings.join('; ') 
      };
      console.log('Returning date validation result with warnings:', result);
      return result;
    }

    console.log('Returning date validation result: no warnings');
    return { valid: true };
  }

  // Year validation for payment plans
  static validatePaymentYear(year: number): ValidationResult {
    const currentYear = new Date().getFullYear();
    
    if (year < currentYear) {
      return { 
        valid: false, 
        message: "Cannot create payments for past years." 
      };
    }
    
    if (year > currentYear + 10) {
      return { 
        valid: false, 
        message: "Cannot create payments more than 10 years in the future." 
      };
    }
    
    return { valid: true };
  }

  // Validate project duration vs budget/payment plan alignment
  static validateProjectDurationAlignment(data: ProjectValidationData): ValidationResult {
    if (!data.expectedStart || !data.expectedEnd || !data.paymentPlanLines || data.paymentPlanLines.length === 0) {
      return { valid: true };
    }

    const projectDuration = data.expectedEnd.getTime() - data.expectedStart.getTime();
    const projectDays = projectDuration / (1000 * 60 * 60 * 24);
    const projectMonths = projectDays / 30.44; // Average days per month
    const projectYears = projectDays / 365.25; // Account for leap years

    // Check if payment plan spans multiple years for short projects
    const paymentYears = data.paymentPlanLines.map(p => p.year);
    const uniquePaymentYears = [...new Set(paymentYears)].sort();
    const paymentYearSpan = uniquePaymentYears.length;

    // Critical business rule: Short projects with multi-year payment plans
    if (projectMonths < 6 && paymentYearSpan > 1) {
      return {
        valid: false,
        message: `Project duration (${Math.round(projectMonths)} months) is too short for a ${paymentYearSpan}-year payment plan. Short projects should have single-year payments.`
      };
    }

    // Warning: Medium projects with very long payment plans
    if (projectMonths < 12 && paymentYearSpan > 2) {
      return {
        valid: true,
        warning: `Project duration (${Math.round(projectMonths)} months) seems short for a ${paymentYearSpan}-year payment plan. Consider if this is a multi-phase project.`
      };
    }

    // Warning: Very long projects with single-year payments
    if (projectYears > 2 && paymentYearSpan === 1) {
      return {
        valid: true,
        warning: `Project duration (${Math.round(projectYears)} years) is long but payment plan is only for 1 year. Consider spreading payments across project duration.`
      };
    }

    // Check if payment years align with project timeline
    const projectStartYear = data.expectedStart.getFullYear();
    const projectEndYear = data.expectedEnd.getFullYear();
    
    const paymentYearsOutsideProject = uniquePaymentYears.filter(year => 
      year < projectStartYear || year > projectEndYear
    );

    if (paymentYearsOutsideProject.length > 0) {
      return {
        valid: false,
        message: `Payment plan includes years (${paymentYearsOutsideProject.join(', ')}) outside project timeline (${projectStartYear}-${projectEndYear}).`
      };
    }

    return { valid: true };
  }

  // Comprehensive project validation
  static validateProject(data: ProjectValidationData): ValidationResult {
    // Validate budget
    const budgetResult = this.validateBudget(data.budget, data.userRole);
    if (!budgetResult.valid) {
      return budgetResult;
    }

    // Validate payment plan
    const paymentResult = this.validatePaymentPlan(data.paymentPlanLines, data.budget);
    if (!paymentResult.valid) {
      return paymentResult;
    }

    // Validate dates
    const dateResult = this.validateDates({
      expectedStart: data.expectedStart,
      expectedEnd: data.expectedEnd,
      tenderDate: data.tenderDate
    });
    if (!dateResult.valid) {
      return dateResult;
    }

    // Validate payment years
    for (const payment of data.paymentPlanLines) {
      const yearResult = this.validatePaymentYear(payment.year);
      if (!yearResult.valid) {
        return { ...yearResult, message: `Payment plan line: ${yearResult.message}` };
      }
    }

    // Validate project duration vs payment plan alignment
    const durationResult = this.validateProjectDurationAlignment(data);
    if (!durationResult.valid) {
      return durationResult;
    }

    // Collect all warnings
    const warnings: string[] = [];
    if (budgetResult.warning) warnings.push(budgetResult.warning);
    if (paymentResult.warning) warnings.push(paymentResult.warning);
    if (dateResult.warning) warnings.push(dateResult.warning);
    if (durationResult.warning) warnings.push(durationResult.warning);

    if (warnings.length > 0) {
      return { valid: true, warning: warnings.join('; ') };
    }

    return { valid: true };
  }

  // Get budget thresholds for UI display
  static getBudgetThresholds(userRole: string) {
    const thresholds = {
      minimum: 1000,
      warning: 100000,
      requiresPMO: 1000000,
      requiresBoard: 10000000
    };

    return {
      ...thresholds,
      canApprove: ['Admin', 'Head', 'PMO'].includes(userRole),
      canApproveLarge: userRole === 'Admin'
    };
  }

  // Calculate payment amount for yearly payments (simplified)
  static calculateProjectPaymentAmount(amount: number, _projectStart?: Date, _projectEnd?: Date): number {
    // For yearly payments, the amount is always the same regardless of project duration
    return amount;
  }

  // Calculate total project payment plan based on actual project duration
  static calculateTotalProjectPaymentPlan(payments: PaymentPlanLine[], projectStart?: Date, projectEnd?: Date): number {
    return payments.reduce((sum, line) => {
      return sum + this.calculateProjectPaymentAmount(line.amount, projectStart, projectEnd);
    }, 0);
  }

  // Calculate annual payment amount for yearly payments (simplified)
  static calculateAnnualPaymentAmount(amount: number): number {
    // For yearly payments, the amount is always the same
    return amount;
  }

  // Calculate total annual payment plan (for annual budgeting)
  static calculateTotalAnnualPaymentPlan(payments: PaymentPlanLine[]): number {
    return payments.reduce((sum, line) => {
      return sum + this.calculateAnnualPaymentAmount(line.amount);
    }, 0);
  }

  // Format currency for display
  static formatCurrency(amount: number, currency: CurrencyType = CurrencyType.QAR): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  }
}

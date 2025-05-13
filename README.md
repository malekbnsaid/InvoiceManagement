# Invoice Management System

A comprehensive system for managing invoices, projects, and LPOs for the IT Department, with OCR capabilities and status tracking.

## Project Overview

This project digitizes the IT department's manual invoice documentation workflow. It provides a centralized web platform to upload and track invoices, automate data entry via AI-powered OCR, and monitor invoice status in real-time. The system also includes a project number request and assignment module, enabling accurate project-specific invoice tracking while respecting existing organizational workflows.

## Architecture

The system is built using a Clean Architecture approach with the following layers:

### Backend (ASP.NET Core Web API)

1. **Domain Layer**
   - Entities: Core business models (Project, LPO, Invoice, etc.)
   - Interfaces: Contracts for repositories and services
   - Enums: Strongly-typed constants (Role, InvoiceStatus, RequestStatus, etc.)

2. **Application Layer**
   - Services: Business logic implementation
   - Interfaces: Service contracts
   - DTOs: Data transfer objects for API responses/requests
   - Validation: Request validation and business rules

3. **Infrastructure Layer**
   - Data: EF Core DbContext, Configurations
   - Repositories: CRUD operations for entities
   - Identity: Authentication/Authorization
   - External Services: OCR, Email, Notifications
   - Background Jobs: For scheduled tasks and long-running processes

4. **API Layer**
   - Controllers: API endpoints
   - Filters: Request/response processing
   - Middleware: Cross-cutting concerns
   - SignalR Hubs: Real-time notifications

### Frontend (React)

- Components: UI components
- Services: API client services and HTTP interceptors
- State Management: Application state using Context API or Redux
- Routing: Navigation with protected routes
- PDF Viewer: For viewing and annotating invoices
- Internationalization: For multi-language support

## Entity Relationship Diagram

```
Department 1──┐
              │
              │ *
        ┌─── Section 1──┐
        │               │
        │               │ *
        │         ┌─── Unit 1──┐
        │         │            │
        │         │            │ *
Employee *        │    ┌─────Project 1───┐
    │             │    │                 │
    │             │    │                 │ *
    │             │    │             ┌─LPO 1──┐
    │             │    │             │        │
    │             │    │             │        │ *
    │             │    │             │      Invoice 1──┐
    │             │    │             │        │        │
    │             │    │             │        │        │ *
    │             │    │             │        │   StatusHistory
    │             │    │             │        │
    │             │    │             │        │
 Notification     │    └─────────────┘        │
                  │                           │
                  └───ProjectNumberRequest    │
                                              │
                                     DocumentAttachment
```

## Advanced Features

### 1. OCR and Document Processing
- **Azure Form Recognizer Integration**: Extract invoice data with high accuracy
- **ML-Based Field Mapping**: Intelligently map extraction results to database fields
- **Duplicate Detection**: Flag potentially duplicate invoices based on number, amount, and vendor
- **PDF Handling**: View, annotate, and manage PDF documents directly in the UI

### 2. Project Number Workflow
- **Request-Approval Flow**: Complete workflow for project number requests
- **Automatic Notifications**: Notify relevant stakeholders at each step
- **History Tracking**: Complete history of all project number requests
- **Business Justification**: Capture business justification for audit purposes

### 3. Invoice Lifecycle Management
- **Status Tracking**: Full timeline of invoice status changes
- **Performance Metrics**: Track time spent in each status for process improvement
- **Conditional Workflows**: Different paths based on invoice type/amount

### 4. Notifications System
- **Real-time Alerts**: In-app notifications for important events
- **Email Notifications**: Send emails for critical updates
- **SignalR Integration**: Push notifications to users in real-time
- **Customizable Preferences**: User-specific notification preferences

### 5. Reporting and Analytics
- **Power BI Integration**: Advanced reporting capabilities
- **Export Options**: Export data to Excel, PDF, and CSV
- **Custom Dashboards**: Role-specific dashboards
- **Key Performance Indicators**: Track processing times and efficiency metrics

## Key Entities

- **Employee**: Users with different roles (Admin, IT Head, Regular Employee)
- **Department/Section/Unit**: Organizational structure
- **Project**: Projects with budgets, timelines, and approval workflow
- **ProjectNumberRequest**: Tracking project number requests and their approval workflow
- **LPO**: Local Purchase Orders linked to projects
- **Invoice**: Invoices with OCR data, file attachments, and status tracking
- **StatusHistory**: Complete timeline of invoice status changes
- **DocumentAttachment**: Files attached to invoices, projects, or LPOs
- **Notification**: User notifications for important events
- **SystemSetting**: Configurable system settings
- **AuditLog**: Comprehensive tracking of all system changes

## Technical Stack

- **Frontend**: React.js with TypeScript
- **Backend API**: ASP.NET Core 8 (C#)
- **Database**: SQL Server
- **AI & OCR**: Azure Form Recognizer
- **Authentication**: JWT / OAuth 2.0
- **Realtime Events**: SignalR
- **Reporting**: Microsoft Power BI
- **Background Jobs**: Hangfire
- **Cloud Storage**: Azure Blob Storage
- **Hosting**: Microsoft Azure App Service

## Deployment Strategy

- **CI/CD Pipeline**: Azure DevOps for automated builds and deployments
- **Environment Separation**: Development, Testing, and Production environments
- **Database Migrations**: Automated using Entity Framework Core
- **Monitoring**: Application Insights for performance monitoring
- **Backup Strategy**: Regular database backups and point-in-time recovery
- **Scaling**: Auto-scaling based on load metrics

## Setup Instructions

### Prerequisites

- .NET 8 SDK
- Node.js and npm
- SQL Server/LocalDB
- Azure Account (for Form Recognizer)

### Backend Setup

1. Clone the repository
2. Navigate to the `InvoiceManagement.Server` directory
3. Update the connection string in `appsettings.json` if needed
4. Run migrations:
   ```
   dotnet ef migrations add InitialCreate
   dotnet ef database update
   ```
5. Start the API:
   ```
   dotnet run
   ```

### Frontend Setup

1. Navigate to the `invoicemanagement.client` directory
2. Install dependencies:
   ```
   npm install
   ```
3. Start the development server:
   ```
   npm run dev
   ```

## Features

- **AI-Powered OCR**: Automatically extract data from invoice PDFs using Azure Form Recognizer
- **Project Number Workflow**: Request, approve and assign project numbers with complete history
- **Invoice Status Lifecycle**: Track invoice status from receipt to payment with full timeline
- **Document Management**: Upload, view, and manage documents attached to invoices, projects, or LPOs
- **Real-time Notifications**: Receive instant notifications for important events
- **Dashboard & Analytics**: Power BI integration for advanced reporting capabilities
- **Role-based Access Control**: Granular permissions based on user roles
- **Audit Logging**: Comprehensive tracking of all system changes 
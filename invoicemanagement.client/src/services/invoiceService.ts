import axios, { AxiosError } from 'axios';
import { OcrResult, Invoice } from '../types/interfaces';

const API_URL = 'http://localhost:5274/api/invoices';

export const invoiceService = {
    uploadAndProcess: async (file: File): Promise<OcrResult> => {
        console.log('InvoiceService: Starting uploadAndProcess for file:', file.name);
        
        const formData = new FormData();
        formData.append('file', file);

        try {
            console.log('InvoiceService: Making POST request to:', `${API_URL}/process`);
            console.log('InvoiceService: File size:', file.size, 'File type:', file.type);
            
            const response = await axios.post<OcrResult>(
                `${API_URL}/process`,
                formData,
                {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                    },
                    timeout: 60000, // 60 second timeout
                }
            );

            console.log('InvoiceService: Response received:', response.status, response.data);

            if (!response.data) {
                throw new Error('No data received from server');
            }

            return response.data;
        } catch (error) {
            console.error('InvoiceService: Error in uploadAndProcess:', error);
            
            if (axios.isAxiosError(error)) {
                console.error('InvoiceService: Axios error details:', {
                    status: error.response?.status,
                    statusText: error.response?.statusText,
                    data: error.response?.data,
                    message: error.message
                });
                
                if (error.code === 'ECONNABORTED') {
                    throw new Error('Request timeout - server took too long to respond');
                }
                
                if (error.response?.status === 404) {
                    throw new Error('OCR endpoint not found. Please check if the backend server is running.');
                }
                
                if (error.response?.status === 500) {
                    throw new Error('Server error during OCR processing. Please try again.');
                }
                
                throw new Error(error.response?.data?.message || error.response?.data || 'Failed to process invoice');
            }
            throw error;
        }
    },

    saveInvoice: async (ocrResult: any): Promise<Invoice> => {
        try {
            console.log('InvoiceService: Starting saveInvoice with data:', ocrResult);
            console.log('InvoiceService: Data type:', typeof ocrResult);
            console.log('InvoiceService: Data structure:', JSON.stringify(ocrResult, null, 2));

            const response = await axios.post<Invoice>(
                API_URL,
                ocrResult,
                {
                    headers: {
                        'Content-Type': 'application/json',
                    },
                }
            );

            console.log('InvoiceService: Response received:', response.status, response.data);
            return response.data;
        } catch (error) {
            console.error('InvoiceService: Error in saveInvoice:', error);
            
            if (axios.isAxiosError(error)) {
                console.error('InvoiceService: Axios error details:', {
                    status: error.response?.status,
                    statusText: error.response?.statusText,
                    data: error.response?.data,
                    message: error.message
                });
                
                // Log the exact request data that was sent
                console.error('InvoiceService: Request data that was sent:', error.config?.data);
                
                // Log the full response data for debugging
                if (error.response?.data) {
                    console.error('InvoiceService: Full response data:', JSON.stringify(error.response.data, null, 2));
                }
                
                let errorMessage: string;
                if (error.response?.data) {
                    if (typeof error.response.data === 'string') {
                        errorMessage = error.response.data;
                    } else if (typeof error.response.data === 'object') {
                        // Handle structured error response
                        const errorData = error.response.data;
                        if ('message' in errorData) {
                            errorMessage = errorData.message;
                            if ('details' in errorData && Array.isArray(errorData.details)) {
                                errorMessage += ': ' + errorData.details.join(', ');
                            }
                        } else {
                            errorMessage = JSON.stringify(errorData);
                        }
                    } else {
                        errorMessage = 'Unknown error format received from server';
                    }
                } else {
                    errorMessage = error.message || 'Failed to save invoice';
                }
                
                // Log the full error details for debugging
                console.error('Full error details:', {
                    status: error.response?.status,
                    statusText: error.response?.statusText,
                    data: error.response?.data,
                    message: error.message,
                    requestData: error.config?.data
                });
                
                throw new Error(`Failed to save invoice: ${errorMessage}`);
            }
            throw error;
        }
    },

    getInvoices: async (): Promise<Invoice[]> => {
        try {
            const response = await axios.get<Invoice[]>(API_URL);
            return response.data;
        } catch (error) {
            if (axios.isAxiosError(error)) {
                throw new Error(error.response?.data || 'Failed to fetch invoices');
            }
            throw error;
        }
    },

    getInvoiceById: async (id: number): Promise<Invoice> => {
        try {
            const response = await axios.get<Invoice>(`${API_URL}/${id}`);
            if (!response.data) {
                throw new Error('Invoice not found');
            }
            return response.data;
        } catch (error) {
            if (axios.isAxiosError(error)) {
                if (error.response?.status === 404) {
                    throw new Error('Invoice not found');
                }
                throw new Error(error.response?.data || 'Failed to fetch invoice');
            }
            throw error;
        }
    },

    getConfidenceScore: async (fileName: string): Promise<number> => {
        try {
            const response = await axios.get<number>(
                `${API_URL}/confidence/${fileName}`
            );
            return response.data;
        } catch (error) {
            if (axios.isAxiosError(error)) {
                throw new Error(error.response?.data || 'Failed to get confidence score');
            }
            throw error;
        }
    },
}; 
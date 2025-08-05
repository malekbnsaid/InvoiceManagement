import axios, { AxiosError } from 'axios';
import { OcrResult, Invoice } from '../types/interfaces';

const API_URL = 'http://localhost:5274/api/invoices';

export const invoiceService = {
    uploadAndProcess: async (file: File): Promise<OcrResult> => {
        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await axios.post<OcrResult>(
                `${API_URL}/process`,
                formData,
                {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                    },
                }
            );

            if (!response.data) {
                throw new Error('No data received from server');
            }

            return response.data;
        } catch (error) {
            if (axios.isAxiosError(error)) {
                throw new Error(error.response?.data || 'Failed to process invoice');
            }
            throw error;
        }
    },

    saveInvoice: async (ocrResult: OcrResult): Promise<Invoice> => {
        try {
            const response = await axios.post<Invoice>(
                API_URL,
                ocrResult,
                {
                    headers: {
                        'Content-Type': 'application/json',
                    },
                }
            );

            if (!response.data) {
                throw new Error('No response data received from server');
            }

            return response.data;
        } catch (error) {
            if (axios.isAxiosError(error)) {
                const message = error.response?.data || error.message;
                throw new Error(`Failed to save invoice: ${message}`);
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
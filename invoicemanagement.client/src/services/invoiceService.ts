import axios from 'axios';
import { OcrResult } from '../types/interfaces';

const API_URL = 'http://localhost:5274/api'; // Update with your API URL

export const invoiceService = {
    uploadAndProcess: async (file: File): Promise<OcrResult> => {
        const formData = new FormData();
        formData.append('file', file);

        const response = await axios.post<OcrResult>(
            `${API_URL}/invoices/process`,
            formData,
            {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            }
        );

        return response.data;
    },

    getConfidenceScore: async (fileName: string): Promise<number> => {
        const response = await axios.get<number>(
            `${API_URL}/invoices/confidence/${fileName}`
        );
        return response.data;
    },
}; 
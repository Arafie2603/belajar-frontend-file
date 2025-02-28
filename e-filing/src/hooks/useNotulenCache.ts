import { useState, useCallback, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from './useAuth';

interface NotulenType {
    id: string;
    judul: string;
    tanggal_rapat: string;
    lokasi: string;
    pemimpin_rapat: string;
    peserta: string;
    agenda: string;
    dokumen_lampiran: string;
    status: string;
    updated_by?: string;
    created_by?: string;
    user_id?: string;
}

interface NotulenResponse {
    data: {
        paginatedData: NotulenType[];
        meta: {
            currentPage: number;
            offset: number;
            itemsPerPage: number;
            unpaged: boolean;
            totalPages: number;
            totalItems: number;
            sortBy: unknown[];
            filter: Record<string, unknown>;
        };
    };
    status: number;
    message: string;
}


export const useNotulenCache = (baseURL: string) => {
    const { token } = useAuth();
    const [data, setData] = useState<{ paginatedData: NotulenType[] }>({ paginatedData: [] });
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    const fetchData = useCallback(async () => {
        if (!token) return;

        setLoading(true);
        setError(null);

        try {
            const response = await axios.get<NotulenResponse>(`${baseURL}api/notulen`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            if (response.data && response.data.data) {
                setData(response.data.data);
            } else {
                throw new Error('Data format is incorrect');
            }
        } catch (error: unknown) {
            if (axios.isAxiosError(error)) {
                setError(error.response?.data?.message || 'Failed to fetch data');
            } else if (error instanceof Error) {
                setError(error.message);
            } else {
                setError('An unknown error occurred');
            }
        }
        finally {
            setLoading(false);
        }
    }, [baseURL, token]);

    // Initial data fetch
    useEffect(() => {
        if (token) {
            fetchData();
        }
    }, [fetchData, token]);

    // Fetch a specific notulen by ID
    const fetchNotulenById = useCallback(async (id: string) => {
        if (!token) return null;

        try {
            const response = await axios.get(`${baseURL}api/notulen/${id}`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            if (response.data && response.data.data) {
                return response.data.data;
            }
            return null;
        } catch (error) {
            console.error('Error fetching notulen by ID:', error);
            throw error;
        }
    }, [baseURL, token]);

    // Update a notulen
    const updateNotulen = useCallback(async (id: string, formData: FormData) => {
        if (!token) return null;

        try {
            const response = await axios.put(`${baseURL}api/notulen/${id}`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    Authorization: `Bearer ${token}`
                }
            });

            // Refresh data after update
            fetchData();
            return response.data;
        } catch (error) {
            console.error('Error updating notulen:', error);
            throw error;
        }
    }, [baseURL, token, fetchData]);

    // Delete a notulen
    const deleteNotulen = useCallback(async (id: string) => {
        if (!token) return null;

        try {
            const response = await axios.delete(`${baseURL}api/notulen/${id}`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            // Refresh data after deletion
            fetchData();
            return response.data;
        } catch (error) {
            console.error('Error deleting notulen:', error);
            throw error;
        }
    }, [baseURL, token, fetchData]);

    return {
        data,
        loading,
        error,
        fetchNotulenById,
        updateNotulen,
        deleteNotulen,
        refreshData: fetchData
    };
};
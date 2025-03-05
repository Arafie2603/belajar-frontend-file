import { useState, useCallback, useEffect, useRef } from 'react';
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

    const isFetchedRef = useRef(false);

    const fetchData = useCallback(async () => {
        if (!token) return;

        setLoading(true);
        setError(null);

        try {
            // Check localStorage first
            const cachedData = localStorage.getItem('notulenData');
            const cachedTimestamp = localStorage.getItem('notulenDataTimestamp');

            // Check if cached data exists and is less than 5 minutes old
            if (cachedData && cachedTimestamp) {
                const timeDiff = Date.now() - parseInt(cachedTimestamp);
                if (timeDiff < 5 * 60 * 1000) { // 5 minutes
                    setData(JSON.parse(cachedData));
                    setLoading(false);
                    return;
                }
            }

            const response = await axios.get<NotulenResponse>(`${baseURL}api/notulen`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            if (response.data && response.data.data) {
                // Store in localStorage
                localStorage.setItem('notulenData', JSON.stringify(response.data.data));
                localStorage.setItem('notulenDataTimestamp', Date.now().toString());

                setData(response.data.data);
            } else {
                throw new Error('Data format is incorrect');
            }
        } catch (error) {
            setError(error instanceof Error ? error.message : "Terjadi kesalahan");
        } finally {
            setLoading(false);
        }
    }, [baseURL, token]);

    useEffect(() => {
        if (token && !isFetchedRef.current) {
            fetchData();
        }
    }, [fetchData, token]);

    const fetchNotulenById = useCallback(async (id: string) => {
        if (!token) return null;

        try {
            const response = await axios.get(`${baseURL}api/notulen/${id}`, {
                headers: {
                    Authorization: `Bearer ${token}`,

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

    const updateNotulen = useCallback(async (id: string, formData: FormData) => {
        if (!token) return null;

        try {
            const response = await axios.put(`${baseURL}api/notulen/${id}`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    Authorization: `Bearer ${token}`
                }
            });

            isFetchedRef.current = false;

            fetchData();
            return response.data;
        } catch (error) {
            console.error('Error updating notulen:', error);
            throw error;
        }
    }, [baseURL, token, fetchData]);

    const deleteNotulen = useCallback(async (id: string) => {
        if (!token) return null;

        try {
            const response = await axios.delete(`${baseURL}api/notulen/${id}`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            isFetchedRef.current = false;

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
        refreshData: useCallback(() => {
            isFetchedRef.current = false;
            fetchData();
        }, [fetchData]),
    };
};
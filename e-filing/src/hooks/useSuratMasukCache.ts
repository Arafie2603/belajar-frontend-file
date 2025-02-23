import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { storage } from '../utils/storage';
import { SuratMasuk, SuratMasukResponse, PaginationMeta } from '../types/surat';

interface CacheData {
    data: SuratMasuk[];
    pagination: PaginationMeta;
    timestamp: number;
}

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
const CACHE_KEY = 'surat_masuk_cache';

export const useSuratMasuk = (baseUrl: string) => {
    const [data, setData] = useState<SuratMasuk[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [lastUpdated, setLastUpdated] = useState<number>(0);
    const [pagination, setPagination] = useState<PaginationMeta | null>(null);

    const getCachedData = (): CacheData | null => {
        const cached = storage.get(CACHE_KEY);
        if (!cached) return null;
        return cached;
    };

    const setCachedData = (data: SuratMasuk[], pagination: PaginationMeta) => {
        const cacheData: CacheData = {
            data,
            pagination,
            timestamp: Date.now()
        };
        storage.set(CACHE_KEY, cacheData);
        setLastUpdated(cacheData.timestamp);
    };

    const fetchData = useCallback(async (forceFetch = false) => {
        console.log('Fetching data with forceFetch:', forceFetch);
        const token = localStorage.getItem('token');
        
        if (!token) {
            setError('Token tidak ditemukan');
            setLoading(false);
            return;
        }

        try {
            const cached = getCachedData();
            console.log('Cached data:', cached);

            if (!forceFetch && cached && Date.now() - cached.timestamp < CACHE_DURATION) {
                console.log('Using cached data');
                setData(cached.data);
                setPagination(cached.pagination);
                setLoading(false);
                return;
            }

            const response = await axios.get<SuratMasukResponse>(`${baseUrl}api/surat-masuk`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            console.log('API Response:', response.data);

            if (response.status === 200 && response.data.data.paginatedData) {
                const newData = response.data.data.paginatedData;
                const newMeta = response.data.data.meta;
                
                console.log('Setting new data:', newData);
                setData(newData);
                setPagination(newMeta);
                setCachedData(newData, newMeta);
                setError(null);
            }
        } catch (error) {
            console.error('Error fetching data:', error);
            if (axios.isAxiosError(error)) {
                if (error.response?.status === 401) {
                    localStorage.removeItem('token');
                    window.location.href = '/';
                    return;
                }
                setError(error.response?.data?.message || 'Gagal mengambil data');
            } else {
                setError('Terjadi kesalahan saat mengambil data');
            }
            
            const cached = getCachedData();
            if (cached) {
                setData(cached.data);
                setPagination(cached.pagination);
            }
        } finally {
            setLoading(false);
        }
    }, [baseUrl]);

    const addSurat = useCallback(async (formData: FormData) => {
        const token = localStorage.getItem('token');
        
        if (!token) {
            throw new Error('Token tidak ditemukan');
        }

        try {
            console.log('Sending form data:', Object.fromEntries(formData));
            const response = await axios.post(`${baseUrl}api/surat-masuk`, formData, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'multipart/form-data'
                }
            });

            console.log('Add surat response:', response.data);

            if (response.status === 200) {
                // Clear cache
                storage.remove(CACHE_KEY);
                // Add small delay before fetching new data
                await new Promise(resolve => setTimeout(resolve, 500));
                // Force fetch new data
                await fetchData(true);
                return true;
            }
        } catch (error) {
            console.error('Add surat error:', error);
            if (axios.isAxiosError(error)) {
                throw new Error(error.response?.data?.message || 'Gagal menambahkan surat');
            }
            throw new Error('Terjadi kesalahan saat menambahkan surat');
        }
    }, [baseUrl, fetchData]);

    const deleteSurat = useCallback(async (noSurat: string) => {
        const token = localStorage.getItem('token');
        
        if (!token) {
            throw new Error('Token tidak ditemukan');
        }

        try {
            const response = await axios.delete(`${baseUrl}api/surat-masuk/${noSurat}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.status === 200) {
                storage.remove(CACHE_KEY);
                await fetchData(true);
                return true;
            }
        } catch (error) {
            if (axios.isAxiosError(error)) {
                throw new Error(error.response?.data?.message || 'Gagal menghapus surat');
            }
            throw new Error('Terjadi kesalahan saat menghapus surat');
        }
    }, [baseUrl, fetchData]);

    useEffect(() => {
        console.log('Initial fetch triggered');
        fetchData(true); // Force fetch on initial load
    }, [fetchData]);

    useEffect(() => {
        console.log('Setting up periodic fetch');
        const interval = setInterval(() => {
            fetchData(true);
        }, CACHE_DURATION);

        return () => {
            console.log('Cleaning up interval');
            clearInterval(interval);
        };
    }, [fetchData]);

    // Monitor data changes
    useEffect(() => {
        console.log('Current data state:', data);
    }, [data]);

    return {
        data,
        loading,
        error,
        lastUpdated,
        pagination,
        refreshData: () => fetchData(true),
        deleteSurat,
        addSurat
    };
};
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

    const getCachedData = useCallback((): CacheData | null => {
        const cached = storage.get(CACHE_KEY);
        if (!cached) {
            console.log('No cache found');
            return null;
        }
        console.log('Cache found with timestamp:', new Date(cached.timestamp).toLocaleString());
        return cached;
    }, []);

    const setCachedData = useCallback((data: SuratMasuk[], pagination: PaginationMeta) => {
        const timestamp = Date.now();
        const cacheData: CacheData = {
            data,
            pagination,
            timestamp
        };
        console.log('Setting cache with timestamp:', new Date(timestamp).toLocaleString());
        storage.set(CACHE_KEY, cacheData);
        setLastUpdated(timestamp);
    }, []);

    const fetchData = useCallback(async (forceFetch = false) => {
        console.log('Fetching data with forceFetch:', forceFetch);
        const token = localStorage.getItem('token');
        
        if (!token) {
            setError('Token tidak ditemukan');
            setLoading(false);
            return;
        }

        try {
            // Check cache first if not forcing fetch
            if (!forceFetch) {
                const cached = getCachedData();
                const isCacheValid = cached && (Date.now() - cached.timestamp) < CACHE_DURATION;
                
                if (isCacheValid) {
                    console.log('Using cached data, age:', (Date.now() - cached.timestamp) / 1000, 'seconds');
                    setData(cached.data);
                    setPagination(cached.pagination);
                    setLoading(false);
                    setLastUpdated(cached.timestamp);
                    return;
                }
                console.log('Cache expired or not found, fetching from API');
            } else {
                console.log('Force fetching from API');
            }

            // Fetch from API
            setLoading(true);
            const response = await axios.get<SuratMasukResponse>(`${baseUrl}api/surat-masuk`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            console.log('API Response:', response.data);

            if (response.status === 200 && response.data.data.paginatedData) {
                const newData = response.data.data.paginatedData;
                const newMeta = response.data.data.meta;
                
                console.log('Setting new data from API:', newData.length, 'items');
                setData(newData);
                setPagination(newMeta);
                setCachedData(newData, newMeta);
                setError(null);
            }
        } catch (error) {
            console.error('Error fetching data:', error);
            
            // Try to use cache on error
            const cached = getCachedData();
            if (cached) {
                console.log('Error occurred, using cached data as fallback');
                setData(cached.data);
                setPagination(cached.pagination);
                setLastUpdated(cached.timestamp);
            }
            
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
        } finally {
            setLoading(false);
        }
    }, [baseUrl, getCachedData, setCachedData]);

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
                console.log('Cache cleared after adding new surat');
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
                console.log('Surat deleted, clearing cache');
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

    // Only fetch on initial component mount
    useEffect(() => {
        console.log('Initial data fetch');
        fetchData(false); // Try to use cache on initial load
    }, [fetchData]);

    // Set up a refresh interval that respects cache
    useEffect(() => {
        console.log('Setting up periodic fetch');
        const interval = setInterval(() => {
            console.log('Checking if cache needs refresh');
            const cached = getCachedData();
            const cacheAge = cached ? Date.now() - cached.timestamp : Infinity;
            
            if (!cached || cacheAge >= CACHE_DURATION) {
                console.log('Cache expired, refreshing data');
                fetchData(true);
            } else {
                console.log('Cache still valid, no refresh needed. Expires in:', 
                    Math.round((CACHE_DURATION - cacheAge) / 1000), 'seconds');
            }
        }, 60000); // Check every minute

        return () => {
            console.log('Cleaning up interval');
            clearInterval(interval);
        };
    }, [fetchData, getCachedData]);

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
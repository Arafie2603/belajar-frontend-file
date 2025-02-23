/* eslint-disable @typescript-eslint/no-explicit-any */
// hooks/useSuratMasuk.ts
import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { storage } from '../utils/storage';

interface SuratMasuk {
    key: string;
    nomorSurat: string;
    tanggalSurat: string;
    perihal: string;
    tujuanSurat: string;
    organisasi: string;
    pengirim: string;
    penerima: string;
}

interface CacheData {
    data: SuratMasuk[];
    timestamp: number;
}

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
const CACHE_KEY = 'surat_masuk_cache';

export const useSuratMasuk = (baseUrl: string) => {
    const [data, setData] = useState<SuratMasuk[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [lastUpdated, setLastUpdated] = useState<number>(0);

    const getCachedData = (): CacheData | null => {
        const cached = storage.get(CACHE_KEY);
        if (!cached) return null;
        return cached;
    };

    const setCachedData = (data: SuratMasuk[]) => {
        const cacheData: CacheData = {
            data,
            timestamp: Date.now()
        };
        storage.set(CACHE_KEY, cacheData);
        setLastUpdated(cacheData.timestamp);
    };

    const fetchData = useCallback(async (forceFetch = false) => {
        const token = localStorage.getItem('token');
        
        if (!token) {
            setError('Token tidak ditemukan');
            setLoading(false);
            return;
        }

        try {
            const cached = getCachedData();

            if (!forceFetch && cached && Date.now() - cached.timestamp < CACHE_DURATION) {
                setData(cached.data);
                setLoading(false);
                return;
            }

            const response = await axios.get(`${baseUrl}api/surat-masuk`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.status === 200 && response.data.data.paginatedData) {
                const formattedData: SuratMasuk[] = response.data.data.paginatedData.map((item: any) => ({
                    key: item.no_surat_masuk,
                    nomorSurat: item.no_surat_masuk,
                    tanggalSurat: new Date(item.tanggal).toLocaleDateString('id-ID'),
                    perihal: item.perihal,
                    tujuanSurat: item.tujuan,
                    organisasi: item.organisasi,
                    pengirim: item.pengirim,
                    penerima: item.penerima
                }));

                setCachedData(formattedData);
                setData(formattedData);
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
            
            // Use cache as fallback if available
            const cached = getCachedData();
            if (cached) {
                setData(cached.data);
            }
        } finally {
            setLoading(false);
        }
    }, [baseUrl]);

    const deleteSurat = useCallback(async (nomorSurat: string) => {
        const token = localStorage.getItem('token');
        
        if (!token) {
            setError('Token tidak ditemukan');
            return;
        }

        try {
            await axios.delete(`${baseUrl}api/surat-masuk/${nomorSurat}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            // Invalidate cache and fetch fresh data
            storage.remove(CACHE_KEY);
            await fetchData(true);
            return true;
        } catch (error) {
            if (axios.isAxiosError(error)) {
                throw new Error(error.response?.data?.message || 'Gagal menghapus surat');
            }
            throw new Error('Terjadi kesalahan saat menghapus surat');
        }
    }, [baseUrl, fetchData]);

    const addSurat = useCallback(async (values: Omit<SuratMasuk, 'key'>) => {
        const token = localStorage.getItem('token');
        
        if (!token) {
            setError('Token tidak ditemukan');
            return;
        }

        try {
            await axios.post(`${baseUrl}api/surat-masuk`, values, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            // Invalidate cache and fetch fresh data
            storage.remove(CACHE_KEY);
            await fetchData(true);
            return true;
        } catch (error) {
            if (axios.isAxiosError(error)) {
                throw new Error(error.response?.data?.message || 'Gagal menambahkan surat');
            }
            throw new Error('Terjadi kesalahan saat menambahkan surat');
        }
    }, [baseUrl, fetchData]);

    // Initial fetch
    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // Periodic check for updates
    useEffect(() => {
        const interval = setInterval(() => {
            fetchData(true);
        }, CACHE_DURATION);

        return () => clearInterval(interval);
    }, [fetchData]);

    return {
        data,
        loading,
        error,
        lastUpdated,
        refreshData: () => fetchData(true),
        deleteSurat,
        addSurat
    };
};
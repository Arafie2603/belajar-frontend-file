import { useState, useEffect } from 'react';
import axios from 'axios';
import { storage } from '../utils/storage';

interface CacheData {
    data: unknown[];
    timestamp: number;
}

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
const CACHE_KEY = 'surat_keluar_cache';

export const useSuratCache = (baseUrl: string) => {
    const [data, setData] = useState<unknown[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [lastUpdated, setLastUpdated] = useState<number>(0);

    const getCachedData = (): CacheData | null => {
        const cached = storage.get(CACHE_KEY);
        if (!cached) return null;
        return cached;
    };

    const setCachedData = (data: unknown[]) => {
        const cacheData: CacheData = {
            data,
            timestamp: Date.now()
        };
        storage.set(CACHE_KEY, cacheData);
        setLastUpdated(cacheData.timestamp);
    };

    const fetchData = async (forceFetch = false) => {
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

            const response = await axios.get(`${baseUrl}api/surat-keluar`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.status === 200 && response.data.data.paginatedData) {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const formattedData = response.data.data.paginatedData.map((item: any) => ({
                    id: item.id,
                    surat_nomor: item.surat_nomor,
                    tanggal: new Date(item.tanggal).toLocaleDateString('id-ID'),
                    tempat_surat: item.tempat_surat,
                    lampiran: item.lampiran,
                    isi_surat: item.isi_surat,
                    penerima: item.penerima,
                    pengirim: item.pengirim,
                    jabatan_pengirim: item.jabatan_pengirim,
                    gambar: item.gambar,
                    keterangan_gambar: item.keterangan_gambar,
                    sifat_surat: item.sifat_surat
                }));

                setCachedData(formattedData);
                setData(formattedData);
                setError(null);
            }
        } catch (error) {
            console.error('Error fetching data:', error);
            if (axios.isAxiosError(error)) {
                if (error.response?.status === 401) {
                    // Token tidak valid atau expired
                    localStorage.removeItem('token');
                    window.location.href = '/';
                    return;
                }
                setError(error.response?.data?.message || 'Gagal mengambil data');
            } else {
                setError('Terjadi kesalahan saat mengambil data');
            }
            
            // Gunakan cache sebagai fallback jika ada error
            const cached = getCachedData();
            if (cached) {
                setData(cached.data);
            }
        } finally {
            setLoading(false);
        }
    };

    // Initial fetch
    useEffect(() => {
        fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Periodic check for updates
    useEffect(() => {
        const interval = setInterval(() => {
            fetchData(true);
        }, CACHE_DURATION);

        return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return { 
        data, 
        loading, 
        error, 
        lastUpdated, 
        refreshData: () => fetchData(true) 
    };
};
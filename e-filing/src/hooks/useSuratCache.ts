/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useCallback } from 'react';
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

    const getCachedData = useCallback((): CacheData | null => {
        return storage.get(CACHE_KEY) || null;
    }, []);

    const setCachedData = useCallback((data: unknown[]) => {
        const cacheData: CacheData = {
            data,
            timestamp: Date.now()
        };
        storage.set(CACHE_KEY, cacheData);
        setLastUpdated(cacheData.timestamp);
    }, []);

    const fetchData = useCallback(async (forceFetch = false) => {
        setLoading(true);
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
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.status === 200 && response.data.data.paginatedData) {
                const formattedData = response.data.data.paginatedData.map((item: Record<string, any>) => ({
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
            setError('Gagal mengambil data');
            const cached = getCachedData();
            if (cached) {
                setData(cached.data);
            }
        } finally {
            setTimeout(() => setLoading(false), 500);
        }
    }, [baseUrl, getCachedData, setCachedData]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

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
        refreshData: () => fetchData(true) 
    };
};

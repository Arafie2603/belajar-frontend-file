/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { storage } from '../utils/storage';
import { eventBus, DATA_EVENTS } from '../utils/eventBus';

interface SuratKeluar {
    id: string;
    surat_nomor: string;
    tanggal: string;
    tempat_surat: string;
    lampiran: string;
    isi_surat: string;
    penerima: string;
    pengirim: string;
    jabatan_pengirim: string;
    gambar: string;
    keterangan_gambar: string;
    sifat_surat: string;
    keterangan?: string;
    deskripsi?: string;
    kategori?: string;
}

interface PaginationMeta {
    currentPage: number;
    totalItems: number;
    itemsPerPage: number;
    totalPages: number;
}

interface CacheData {
    data: SuratKeluar[];
    pagination?: PaginationMeta;
    timestamp: number;
}

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
const CACHE_KEY = 'surat_keluar_cache';

export const invalidateSpecificCache = (cacheKey: string) => {
    storage.remove(cacheKey);
};

export const useSuratCache = (baseUrl: string) => {
    const [data, setData] = useState<SuratKeluar[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [lastUpdated, setLastUpdated] = useState<number>(0);
    const [pagination, setPagination] = useState<PaginationMeta | null>(null);
    const [currentRecord, setCurrentRecord] = useState<SuratKeluar | null>(null);

    const getCachedData = useCallback((): CacheData | null => {
        const cached = storage.get(CACHE_KEY);
        if (!cached) {
            console.log('No cache found for surat keluar');
            return null;
        }
        console.log('Cache found for surat keluar with timestamp:', new Date(cached.timestamp).toLocaleString());
        return cached;
    }, []);

    const setCachedData = useCallback((data: SuratKeluar[], pagination?: PaginationMeta) => {
        const timestamp = Date.now();
        const cacheData: CacheData = {
            data,
            pagination,
            timestamp
        };
        console.log('Setting surat keluar cache with timestamp:', new Date(timestamp).toLocaleString());
        storage.set(CACHE_KEY, cacheData);
        setLastUpdated(timestamp);
    }, []);

    const fetchData = useCallback(async (forceFetch = false) => {
        console.log('Fetching surat keluar data with forceFetch:', forceFetch);
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
                    console.log('Using cached surat keluar data, age:', (Date.now() - cached.timestamp) / 1000, 'seconds');
                    setData(cached.data);
                    if (cached.pagination) {
                        setPagination(cached.pagination);
                    }
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
            const response = await axios.get(`${baseUrl}api/surat-keluar`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            console.log('API Response:', response.data);

            if (response.status === 200 && response.data.data.paginatedData) {
                const responseData = response.data.data.paginatedData;
                const pagMeta = response.data.data.meta;

                const formattedData = responseData.map((item: any) => ({
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
                    sifat_surat: item.sifat_surat,
                    keterangan: item.keterangan,
                    deskripsi: item.deskripsi,
                    kategori: item.kategori
                }));

                console.log('Setting new data from API:', formattedData.length, 'items');
                setData(formattedData);

                if (pagMeta) {
                    setPagination(pagMeta);
                    setCachedData(formattedData, pagMeta);
                } else {
                    setCachedData(formattedData);
                }

                setError(null);
            }
        } catch (error) {
            console.error('Error fetching data:', error);

            // Try to use cache on error
            const cached = getCachedData();
            if (cached) {
                console.log('Error occurred, using cached data as fallback');
                setData(cached.data);
                if (cached.pagination) {
                    setPagination(cached.pagination);
                }
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

    const fetchSuratById = useCallback(async (id: string) => {
        const token = localStorage.getItem('token');

        if (!token) {
            throw new Error('Token tidak ditemukan');
        }

        // First check if we have it in the cache or local state
        if (data.length > 0) {
            const cachedSurat = data.find(item => item.id === id);
            if (cachedSurat) {
                console.log('Retrieving surat keluar from cache:', id);
                setCurrentRecord(cachedSurat);
                return cachedSurat;
            }
        }

        // Not in cache, fetch from API
        try {
            console.log('Fetching surat keluar details from API:', id);
            setLoading(true);
            const response = await axios.get(`${baseUrl}api/surat-keluar/${id}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.status === 200 && response.data.data) {
                const suratData = response.data.data;
                const formattedSurat = {
                    id: suratData.id,
                    surat_nomor: suratData.surat_nomor,
                    tanggal: new Date(suratData.tanggal).toLocaleDateString('id-ID'),
                    tempat_surat: suratData.tempat_surat,
                    lampiran: suratData.lampiran,
                    isi_surat: suratData.isi_surat,
                    penerima: suratData.penerima,
                    pengirim: suratData.pengirim,
                    jabatan_pengirim: suratData.jabatan_pengirim,
                    gambar: suratData.gambar,
                    keterangan_gambar: suratData.keterangan_gambar,
                    sifat_surat: suratData.sifat_surat,
                    keterangan: suratData.keterangan,
                    deskripsi: suratData.deskripsi,
                    kategori: suratData.kategori
                };

                console.log('Retrieved surat keluar details:', formattedSurat);
                setCurrentRecord(formattedSurat);
                return formattedSurat;
            }
        } catch (error) {
            console.error('Error fetching surat keluar details:', error);
            if (axios.isAxiosError(error)) {
                throw new Error(error.response?.data?.message || 'Gagal mengambil detail surat');
            }
            throw new Error('Terjadi kesalahan saat mengambil detail surat');
        } finally {
            setLoading(false);
        }
    }, [baseUrl, data]);

    const addSurat = useCallback(async (formData: FormData) => {
        const token = localStorage.getItem('token');

        if (!token) {
            throw new Error('Token tidak ditemukan');
        }

        try {
            const response = await axios.post(`${baseUrl}api/surat-keluar`, formData, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'multipart/form-data'
                }
            });

            if (response.status === 201 || response.status === 200) {
                // Clear cache
                storage.remove(CACHE_KEY);
                console.log('Cache cleared after adding new surat keluar');

                // Force fetch new data
                await fetchData(true);

                // Emit events
                eventBus.emit(DATA_EVENTS.SURAT_KELUAR_UPDATED);
                eventBus.emit(DATA_EVENTS.ANY_DATA_UPDATED);

                return true;
            }
        } catch (error) {
            console.error('Add surat keluar error:', error);
            if (axios.isAxiosError(error)) {
                throw new Error(error.response?.data?.message || 'Gagal menambahkan surat');
            }
            throw new Error('Terjadi kesalahan saat menambahkan surat');
        }
    }, [baseUrl, fetchData]);

    const updateSurat = useCallback(async (id: string, formData: FormData) => {
        const token = localStorage.getItem('token');

        if (!token) {
            throw new Error('Token tidak ditemukan');
        }

        try {
            console.log('Updating surat keluar:', id);

            const response = await axios.put(`${baseUrl}api/surat-keluar/${id}`, formData, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'multipart/form-data'
                }
            });

            if (response.status === 200) {
                // Clear cache
                storage.remove(CACHE_KEY);
                console.log('Cache cleared after updating surat keluar');

                // Force fetch new data
                await fetchData(true);

                // Emit events
                eventBus.emit(DATA_EVENTS.SURAT_KELUAR_UPDATED);
                eventBus.emit(DATA_EVENTS.ANY_DATA_UPDATED);

                return true;
            }
        } catch (error) {
            console.error('Update surat keluar error:', error);
            if (axios.isAxiosError(error)) {
                throw new Error(error.response?.data?.message || 'Gagal memperbarui surat');
            }
            throw new Error('Terjadi kesalahan saat memperbarui surat');
        }
    }, [baseUrl, fetchData]);

    const deleteSurat = useCallback(async (id: string) => {
        const token = localStorage.getItem('token');

        if (!token) {
            throw new Error('Token tidak ditemukan');
        }

        try {
            const response = await axios.delete(`${baseUrl}api/surat-keluar/${id}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.status === 200) {
                console.log('Surat keluar deleted, clearing cache');
                storage.remove(CACHE_KEY);

                // Force fetch new data
                await fetchData(true);

                // Emit events
                eventBus.emit(DATA_EVENTS.SURAT_KELUAR_UPDATED);
                eventBus.emit(DATA_EVENTS.ANY_DATA_UPDATED);

                return true;
            }
        } catch (error) {
            if (axios.isAxiosError(error)) {
                throw new Error(error.response?.data?.message || 'Gagal menghapus surat');
            }
            throw new Error('Terjadi kesalahan saat menghapus surat');
        }
    }, [baseUrl, fetchData]);

    // Initial fetch on component mount
    useEffect(() => {
        console.log('Initial surat keluar data fetch');
        fetchData(false); // Try to use cache on initial load
    }, [fetchData]);

    // Set up a refresh interval that respects cache
    useEffect(() => {
        console.log('Setting up periodic fetch for surat keluar');
        const interval = setInterval(() => {
            console.log('Checking if surat keluar cache needs refresh');
            const cached = getCachedData();
            const cacheAge = cached ? Date.now() - cached.timestamp : Infinity;

            if (!cached || cacheAge >= CACHE_DURATION) {
                console.log('Cache expired, refreshing surat keluar data');
                fetchData(true);
            } else {
                console.log('Surat keluar cache still valid, no refresh needed. Expires in:',
                    Math.round((CACHE_DURATION - cacheAge) / 1000), 'seconds');
            }
        }, 60000); // Check every minute

        return () => {
            console.log('Cleaning up surat keluar interval');
            clearInterval(interval);
        };
    }, [fetchData, getCachedData]);


    useEffect(() => {
        const handleDataUpdated = () => {
            console.log('Received data update event, refreshing surat keluar');
            fetchData(true);
        };

        const unsubscribeSuratUpdated = eventBus.on(DATA_EVENTS.SURAT_KELUAR_UPDATED, handleDataUpdated);
        const unsubscribeAnyUpdated = eventBus.on(DATA_EVENTS.ANY_DATA_UPDATED, handleDataUpdated);

        return () => {
            unsubscribeSuratUpdated();
            unsubscribeAnyUpdated();
        };
    }, [fetchData]);

    return {
        data,
        loading,
        error,
        lastUpdated,
        pagination,
        currentRecord,
        fetchSuratById,
        refreshData: useCallback(() => fetchData(true), [fetchData]),
        deleteSurat,
        addSurat,
        updateSurat
    };
};
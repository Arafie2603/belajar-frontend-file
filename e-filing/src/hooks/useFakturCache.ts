/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useCallback, useMemo } from 'react';
import axios from 'axios';
import { storage } from '../utils/storage';
import { eventBus, DATA_EVENTS } from '../utils/eventBus';
import { useAuth } from './useAuth';

interface FakturType {
    id: string;
    bukti_pembayaran: string;
    deskripsi: string;
}

const CACHE_KEY = 'faktur_cache';
const CACHE_EXPIRY = 5 * 60 * 1000;

export const useFakturCache = (baseUrl: string) => {
    const [data, setData] = useState<any>({
        paginatedData: [],
        meta: {
            currentPage: 1,
            itemsPerPage: 10,
            totalPages: 1,
            totalItems: 0
        }
    });
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const { token } = useAuth();

    // Perbaikan: getHeaders adalah objek, bukan fungsi
    const getHeaders = useMemo(() => ({
        Authorization: `Bearer ${token}`,
    }), [token]);
    const fetchData = useCallback(async (page = 1, force = false) => {
        if (!token) {
            setLoading(false);
            setError('Authentication token not found');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            // Create a unique cache key that includes the page number
            const CACHE_KEY_WITH_PAGE = `${CACHE_KEY}_page_${page}`;

            if (!force) {
                const cachedData = storage.get(CACHE_KEY_WITH_PAGE);
                if (cachedData && cachedData.timestamp && Date.now() - cachedData.timestamp < CACHE_EXPIRY) {
                    setData(cachedData.data);
                    setLoading(false);
                    return;
                }
            }

            const response = await axios.get(`${baseUrl}api/faktur`, {
                params: {
                    page,
                    limit: data.meta.itemsPerPage || 10
                },
                headers: {
                    ...getHeaders,
                    Authorization: `Bearer ${token}`
                },
            });

            if (response.data && response.data.data) {
                // Store page-specific cached data
                storage.set(CACHE_KEY_WITH_PAGE, {
                    data: response.data.data,
                    timestamp: Date.now(),
                });

                setData(response.data.data);
            } else {
                throw new Error('Invalid response structure');
            }
        } catch (err) {
            const error = err as any;
            console.error('Error fetching faktur data:', error);
            setError(error.response?.data?.message || error.message || 'Failed to fetch faktur data');
        } finally {
            setLoading(false);
        }
    }, [token, getHeaders, baseUrl, data.meta.itemsPerPage]);

    const refreshData = useCallback(() => {
        return fetchData(1, true);
    }, [fetchData]);

    const fetchFakturById = useCallback(async (id: string) => {
        try {
            const cachedData = storage.get(CACHE_KEY);
            if (cachedData && cachedData.data && cachedData.data.paginatedData) {
                const cachedFaktur = cachedData.data.paginatedData.find((item: FakturType) => item.id === id);
                if (cachedFaktur) {
                    return cachedFaktur;
                }
            }

            const response = await axios.get<any>(`${baseUrl}api/faktur/${id}`, {
                headers: getHeaders, // Perbaikan: Tidak lagi memanggil sebagai fungsi
            });

            if (response.data && response.data.data) {
                return response.data.data;
            } else {
                throw new Error('Invalid response structure');
            }
        } catch (err) {
            const error = err as any;
            console.error(`Error fetching faktur with ID ${id}:`, error);
            throw new Error(error.response?.data?.message || error.message || `Failed to fetch faktur with ID ${id}`);
        }
    }, [baseUrl, getHeaders]);

    const updateFaktur = useCallback(async (id: string, formData: FormData) => {
        try {
            // Log formData keys for debugging
            console.log('FormData keys:', Array.from(formData.keys()));

            const response = await axios.patch(`${baseUrl}api/faktur/${id}`, formData, {
                headers: {
                    ...getHeaders,
                    'Content-Type': 'multipart/form-data',
                },
            });

            const fakturCacheKeys = Object.keys(localStorage)
                .filter(key => key.startsWith(CACHE_KEY));

            fakturCacheKeys.forEach(key => storage.remove(key));

            eventBus.emit(DATA_EVENTS.FAKTUR_UPDATED);
            eventBus.emit(DATA_EVENTS.ANY_DATA_UPDATED);

            return response.data;
        } catch (err) {
            const error = err as any;
            console.error(`Error updating faktur with ID ${id}:`, error);

            if (error.response?.data?.message && typeof error.response.data.message === 'string') {
                throw new Error(error.response.data.message);
            } else if (error.response?.data?.error) {
                throw new Error(error.response.data.error);
            } else {
                throw new Error(error.message || `Failed to update faktur with ID ${id}`);
            }
        }
    }, [baseUrl, getHeaders]);

    const deleteFaktur = useCallback(async (id: string) => {
        try {
            const response = await axios.delete(`${baseUrl}api/faktur/${id}`, {
                headers: getHeaders,
            });

            // Clear all page-specific caches for faktur
            const fakturCacheKeys = Object.keys(localStorage)
                .filter(key => key.startsWith(CACHE_KEY));

            fakturCacheKeys.forEach(key => storage.remove(key));

            eventBus.emit(DATA_EVENTS.FAKTUR_UPDATED);
            eventBus.emit(DATA_EVENTS.ANY_DATA_UPDATED);

            return response.data;
        } catch (err) {
            const error = err as any;
            console.error(`Error deleting faktur with ID ${id}:`, error);

            // Extract more specific error message if available
            if (error.response?.data?.message) {
                throw new Error(error.response.data.message);
            } else if (error.response?.data?.error) {
                throw new Error(error.response.data.error);
            } else {
                throw new Error(error.message || `Failed to delete faktur with ID ${id}`);
            }
        }
    }, [baseUrl, getHeaders]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    useEffect(() => {
        const unsubscribeFaktur = eventBus.on(DATA_EVENTS.FAKTUR_UPDATED, refreshData);
        const unsubscribeAnyData = eventBus.on(DATA_EVENTS.ANY_DATA_UPDATED, refreshData);

        return () => {
            unsubscribeFaktur();
            unsubscribeAnyData();
        };
    }, [refreshData]);

    return {
        data,
        loading,
        error,
        refreshData,
        fetchData,
        fetchFakturById,
        updateFaktur,
        deleteFaktur,
    };
};

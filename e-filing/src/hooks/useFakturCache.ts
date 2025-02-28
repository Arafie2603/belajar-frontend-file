/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { storage } from '../utils/storage';
import { eventBus, DATA_EVENTS } from '../utils/eventBus';
import { useAuth } from './useAuth';

interface FakturType {
    id: string;
    bukti_pembayaran: string;
    deskripsi: string;
}

interface FakturResponse {
    data: {
        paginatedData: FakturType[];
        meta: {
            currentPage: number;
            offset: number;
            itemsPerPage: number;
            unpaged: boolean;
            totalPages: number;
            totalItems: number;
            sortBy: any[];
            filter: Record<string, any>;
        };
    };
    status: number;
    message: string;
}

const CACHE_KEY = 'faktur_cache';
const CACHE_EXPIRY = 5 * 60 * 1000; // 5 minutes in milliseconds

export const useFakturCache = (baseUrl: string) => {
    const [data, setData] = useState<any>({ paginatedData: [] });
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const { token } = useAuth();

    const getHeaders = useCallback(() => {
        return {
            Authorization: `Bearer ${token}`,
        };
    }, [token]);

    const fetchData = useCallback(async (force = false) => {
        if (!token) {
            setLoading(false);
            setError('Authentication token not found');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            // Check the cache first if not forced refresh
            if (!force) {
                const cachedData = storage.get(CACHE_KEY);
                if (cachedData && cachedData.timestamp && Date.now() - cachedData.timestamp < CACHE_EXPIRY) {
                    setData(cachedData.data);
                    setLoading(false);
                    return;
                }
            }

            // Cache miss or forced refresh, fetch from API
            const response = await axios.get<FakturResponse>(`${baseUrl}api/faktur`, {
                headers: getHeaders(),
            });

            if (response.data && response.data.data) {
                // Save to cache with timestamp
                storage.set(CACHE_KEY, {
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
    }, [baseUrl, token, getHeaders]);

    const refreshData = useCallback(() => {
        return fetchData(true);
    }, [fetchData]);

    const fetchFakturById = useCallback(async (id: string) => {
        try {
            // Try to find in cache first
            const cachedData = storage.get(CACHE_KEY);
            if (cachedData && cachedData.data && cachedData.data.paginatedData) {
                const cachedFaktur = cachedData.data.paginatedData.find((item: FakturType) => item.id === id);
                if (cachedFaktur) {
                    return cachedFaktur;
                }
            }

            // Not found in cache, fetch from API
            const response = await axios.get<any>(`${baseUrl}api/faktur/${id}`, {
                headers: getHeaders(),
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
            await axios.put(`${baseUrl}api/faktur/${id}`, formData, {
                headers: {
                    ...getHeaders(),
                    'Content-Type': 'multipart/form-data',
                },
            });

            // Invalidate cache and emit events
            storage.remove(CACHE_KEY);
            eventBus.emit(DATA_EVENTS.FAKTUR_UPDATED);
            eventBus.emit(DATA_EVENTS.ANY_DATA_UPDATED);

            await refreshData();
        } catch (err) {
            const error = err as any;
            console.error(`Error updating faktur with ID ${id}:`, error);
            throw new Error(error.response?.data?.message || error.message || `Failed to update faktur with ID ${id}`);
        }
    }, [baseUrl, getHeaders, refreshData]);

    const deleteFaktur = useCallback(async (id: string) => {
        try {
            await axios.delete(`${baseUrl}api/faktur/${id}`, {
                headers: getHeaders(),
            });

            // Invalidate cache and emit events
            storage.remove(CACHE_KEY);
            eventBus.emit(DATA_EVENTS.FAKTUR_UPDATED);
            eventBus.emit(DATA_EVENTS.ANY_DATA_UPDATED);

            await refreshData();
        } catch (err) {
            const error = err as any;
            console.error(`Error deleting faktur with ID ${id}:`, error);
            throw new Error(error.response?.data?.message || error.message || `Failed to delete faktur with ID ${id}`);
        }
    }, [baseUrl, getHeaders, refreshData]);

    // Initial data load
    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // Subscribe to events that should trigger a refresh
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
        fetchFakturById,
        updateFaktur,
        deleteFaktur,
    };
};
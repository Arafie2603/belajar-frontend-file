import { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import dayjs from 'dayjs';
import { storage } from '../utils/storage';
import { eventBus, DATA_EVENTS } from '../utils/eventBus';
// Cache configuration
export const CACHE_KEYS = {
    USER_PROFILE: 'efiling_user_profile',
    SURAT_MASUK: 'efiling_surat_masuk',
    SURAT_KELUAR: 'efiling_surat_keluar',
    FAKTUR: 'efiling_faktur',
    NOTULEN: 'efiling_notulen',
    USERS: 'efiling_users',
    DASHBOARD_STATS: 'efiling_dashboard_stats',
    RECENT_DOCS: 'efiling_recent_docs',
    CALENDAR_EVENTS: 'efiling_calendar_events'
};

// Cache expiry in milliseconds (30 minutes)
const CACHE_EXPIRY = 30 * 60 * 1000;

// Define proper interfaces for our data
export interface UserData {
    id: string;
    nama: string;
    nomor_identitas: string;
    role: string;
    password?: string;
}

export interface MetaData {
    currentPage: number;
    totalItems: number;
    totalPages: number;
    itemsPerPage: number;
}

export interface ApiResponse<T> {
    data: {
        paginatedData: T[];
        meta: MetaData;
    };
    status: number;
    message: string;
}

export interface ProfileResponse {
    data: UserData;
    status: number;
    message: string;
}

export interface SuratMasuk {
    no_surat_masuk: string;
    tanggal: string;
    perihal: string;
    pengirim: string;
    penerima: string;
    sifat_surat: string;
}

export interface SuratKeluar {
    id: string;
    tanggal: string;
    surat_nomor: string;
    pengirim: string;
    penerima: string;
    sifat_surat: string;
}

export interface Faktur {
    id: string;
    bukti_pembayaran: string;
    deskripsi: string;
    tanggal?: string;
    nomor_faktur?: string;
}

export interface Notulen {
    id: string;
    judul: string;
    tanggal_rapat: string;
    lokasi: string;
    pemimpin_rapat: string;
    peserta?: string;
    agenda?: string;
    dokumen_lampiran?: string;
    status?: string;
    updated_by?: string;
    created_by?: string;
    user_id?: string;
}

export interface DocumentItem {
    id: string;
    type: string;
    title: string;
    date: Date;
    sender: string;
    status: string;
}

export interface CalendarEvent {
    type: "warning" | "success" | "error" | "processing";
    content: string;
}

export interface DashboardStats {
    suratMasuk: number;
    suratKeluar: number;
    faktur: number;
    notulen: number;
    users: number;
}

// Interface for cached data with timestamp
interface CachedData<T> {
    data: T;
    timestamp: number;
}

// Export this so other components can use it
export const invalidateSpecificCache = (cacheKey: string) => {
    storage.remove(cacheKey);
};

export const useDashboardData = () => {
    const [loading, setLoading] = useState<boolean>(true);
    const [userData, setUserData] = useState<UserData | null>(null);
    const [stats, setStats] = useState<DashboardStats>({
        suratMasuk: 0,
        suratKeluar: 0,
        faktur: 0,
        notulen: 0,
        users: 0
    });

    const [recentDocs, setRecentDocs] = useState<DocumentItem[]>([]);
    const [calendarEvents, setCalendarEvents] = useState<Map<string, CalendarEvent[]>>(new Map());

    // Function to check if cached data is still valid - memoize as it doesn't depend on props or state
    const isCacheValid = useCallback(<T,>(cachedData: CachedData<T> | null): boolean => {
        if (!cachedData) return false;
        return Date.now() - cachedData.timestamp < CACHE_EXPIRY;
    }, []);

    // Memoize getDataWithCache with useCallback
    const getDataWithCache = useCallback(async <T>(
        url: string,
        cacheKey: string
    ): Promise<T> => {
        const cachedData = storage.get(cacheKey) as CachedData<T> | null;

        if (isCacheValid(cachedData) && cachedData?.data) {
            return cachedData.data;
        }

        const response = await axios.get<T>(url);

        storage.set(cacheKey, {
            data: response.data,
            timestamp: Date.now()
        });

        return response.data;
    }, [isCacheValid]); // Add isCacheValid as a dependency

    // Define fetchData function first
    const fetchData = useCallback(async (skipCache: boolean = false) => {
        try {
            setLoading(true);

            // Fetch user profile
            let userProfile: ProfileResponse;
            if (skipCache) {
                const profileRes = await axios.get<ProfileResponse>('https://api-efiling.vercel.app/api/users/profile');
                userProfile = profileRes.data;
                storage.set(CACHE_KEYS.USER_PROFILE, {
                    data: userProfile,
                    timestamp: Date.now()
                });
            } else {
                userProfile = await getDataWithCache<ProfileResponse>(
                    'https://api-efiling.vercel.app/api/users/profile',
                    CACHE_KEYS.USER_PROFILE
                );
            }
            setUserData(userProfile.data);

            const [suratMasukRes, suratKeluarRes, fakturRes, notulenRes, usersRes] = await Promise.all([
                getDataWithCache<ApiResponse<SuratMasuk>>(
                    'https://api-efiling.vercel.app/api/surat-masuk',
                    CACHE_KEYS.SURAT_MASUK,
                ),
                getDataWithCache<ApiResponse<SuratKeluar>>(
                    'https://api-efiling.vercel.app/api/surat-keluar',
                    CACHE_KEYS.SURAT_KELUAR,
                ),
                getDataWithCache<ApiResponse<Faktur>>(
                    'https://api-efiling.vercel.app/api/faktur',
                    CACHE_KEYS.FAKTUR,
                ),
                getDataWithCache<ApiResponse<Notulen>>(
                    'https://api-efiling.vercel.app/api/notulen',
                    CACHE_KEYS.NOTULEN,
                ),
                getDataWithCache<ApiResponse<UserData>>(
                    'https://api-efiling.vercel.app/api/users',
                    CACHE_KEYS.USERS,
                )
            ]);

            const currentStats = {
                suratMasuk: suratMasukRes.data.meta.totalItems,
                suratKeluar: suratKeluarRes.data.meta.totalItems,
                faktur: fakturRes.data.meta.totalItems,
                notulen: notulenRes.data.meta.totalItems,
                users: usersRes.data.meta.totalItems
            };

            setStats(currentStats);

            if (skipCache) {
                storage.set(CACHE_KEYS.DASHBOARD_STATS, {
                    data: currentStats,
                    timestamp: Date.now()
                });
            }

            const eventsMap = new Map<string, CalendarEvent[]>();
            notulenRes.data.paginatedData.forEach(rapat => {
                const date = dayjs(rapat.tanggal_rapat).format('YYYY-MM-DD');
                const event: CalendarEvent = {
                    type: "warning",
                    content: rapat.judul
                };

                if (eventsMap.has(date)) {
                    eventsMap.get(date)?.push(event);
                } else {
                    eventsMap.set(date, [event]);
                }
            });
            setCalendarEvents(eventsMap);

            // Cache calendar events
            if (skipCache) {
                storage.set(CACHE_KEYS.CALENDAR_EVENTS, {
                    data: Array.from(eventsMap.entries()),
                    timestamp: Date.now()
                });
            }

            // Combine recent documents from different sources
            const combinedDocs: DocumentItem[] = [
                ...suratMasukRes.data.paginatedData.map(doc => ({
                    id: doc.no_surat_masuk,
                    type: 'Surat Masuk',
                    title: doc.perihal,
                    date: new Date(doc.tanggal),
                    sender: doc.pengirim,
                    status: 'Masuk'
                })),
                ...suratKeluarRes.data.paginatedData.map(doc => ({
                    id: doc.id,
                    type: 'Surat Keluar',
                    title: 'Surat Keluar - ' + doc.surat_nomor,
                    date: new Date(doc.tanggal),
                    sender: doc.pengirim,
                    status: 'Keluar'
                })),
                ...fakturRes.data.paginatedData.map(doc => ({
                    id: doc.id,
                    type: 'Faktur',
                    title: 'Faktur - ' + (doc.nomor_faktur || doc.id),
                    date: new Date(doc.tanggal || Date.now()),
                    sender: '-',
                    status: 'Tagihan'
                })),
                ...notulenRes.data.paginatedData.map(doc => ({
                    id: doc.id,
                    type: 'Notulen',
                    title: doc.judul,
                    date: new Date(doc.tanggal_rapat),
                    sender: doc.pemimpin_rapat,
                    status: 'Rapat'
                }))
            ];

            // Sort by date
            combinedDocs.sort((a, b) => b.date.getTime() - a.date.getTime());
            setRecentDocs(combinedDocs);

            // Cache recent documents
            if (skipCache) {
                storage.set(CACHE_KEYS.RECENT_DOCS, {
                    data: combinedDocs,
                    timestamp: Date.now()
                });
            }

            setLoading(false);
        } catch (error) {
            console.error("Error fetching data:", error);

            // If API fails, try to load from cache as fallback
            try {
                const cachedUserProfile = storage.get(CACHE_KEYS.USER_PROFILE) as CachedData<ProfileResponse> | null;
                if (cachedUserProfile) {
                    setUserData(cachedUserProfile.data.data);
                }

                const cachedStats = storage.get(CACHE_KEYS.DASHBOARD_STATS) as CachedData<DashboardStats> | null;
                if (cachedStats) {
                    setStats(cachedStats.data);
                }

                const cachedRecentDocs = storage.get(CACHE_KEYS.RECENT_DOCS) as CachedData<DocumentItem[]> | null;
                if (cachedRecentDocs) {
                    setRecentDocs(cachedRecentDocs.data);
                }

                const cachedCalendarEvents = storage.get(CACHE_KEYS.CALENDAR_EVENTS) as CachedData<[string, CalendarEvent[]][]> | null;
                if (cachedCalendarEvents) {
                    setCalendarEvents(new Map(cachedCalendarEvents.data));
                }
            } catch (cacheError) {
                console.error("Error reading from cache:", cacheError);
            }

            setLoading(false);
        }
    }, [getDataWithCache]); // Add getDataWithCache as a dependency

    // Now define forceRefresh after fetchData
    const forceRefresh = useCallback(async () => {
        Object.values(CACHE_KEYS).forEach(key => storage.remove(key));
        // Fetch fresh data
        fetchData(true);
    }, [fetchData]); // Add fetchData as a dependency

    // Store fetchData in a ref to prevent effect dependencies from changing
    const fetchDataRef = useRef(fetchData);
    
    // Update the ref whenever fetchData changes
    useEffect(() => {
        fetchDataRef.current = fetchData;
    }, [fetchData]);

    // Memoize the fetchRecentDocsOnly function
    const fetchRecentDocsOnly = useCallback(async (skipCache: boolean = false) => {
        try {
            setLoading(true);

            const [suratMasukRes, suratKeluarRes, fakturRes, notulenRes, usersRes] = await Promise.all([
                getDataWithCache<ApiResponse<SuratMasuk>>(
                    'https://api-efiling.vercel.app/api/surat-masuk',
                    CACHE_KEYS.SURAT_MASUK,
                ),
                getDataWithCache<ApiResponse<SuratKeluar>>(
                    'https://api-efiling.vercel.app/api/surat-keluar',
                    CACHE_KEYS.SURAT_KELUAR,
                ),
                getDataWithCache<ApiResponse<Faktur>>(
                    'https://api-efiling.vercel.app/api/faktur',
                    CACHE_KEYS.FAKTUR,
                ),
                getDataWithCache<ApiResponse<Notulen>>(
                    'https://api-efiling.vercel.app/api/notulen',
                    CACHE_KEYS.NOTULEN,
                ),
                getDataWithCache<ApiResponse<UserData>>(
                    'https://api-efiling.vercel.app/api/users',
                    CACHE_KEYS.USERS,
                )
            ]);

            const currentStats = {
                suratMasuk: suratMasukRes.data.meta.totalItems,
                suratKeluar: suratKeluarRes.data.meta.totalItems,
                faktur: fakturRes.data.meta.totalItems,
                notulen: notulenRes.data.meta.totalItems,
                users: usersRes.data.meta.totalItems
            };

            setStats(currentStats);

            if (skipCache) {
                storage.set(CACHE_KEYS.DASHBOARD_STATS, {
                    data: currentStats,
                    timestamp: Date.now()
                });
            }

            const eventsMap = new Map<string, CalendarEvent[]>();
            notulenRes.data.paginatedData.forEach(rapat => {
                const date = dayjs(rapat.tanggal_rapat).format('YYYY-MM-DD');
                const event: CalendarEvent = {
                    type: "warning",
                    content: rapat.judul
                };

                if (eventsMap.has(date)) {
                    eventsMap.get(date)?.push(event);
                } else {
                    eventsMap.set(date, [event]);
                }
            });
            setCalendarEvents(eventsMap);

            // Cache calendar events
            if (skipCache) {
                storage.set(CACHE_KEYS.CALENDAR_EVENTS, {
                    data: Array.from(eventsMap.entries()),
                    timestamp: Date.now()
                });
            }

            // Combine recent documents from different sources
            const combinedDocs: DocumentItem[] = [
                ...suratMasukRes.data.paginatedData.map(doc => ({
                    id: doc.no_surat_masuk,
                    type: 'Surat Masuk',
                    title: doc.perihal,
                    date: new Date(doc.tanggal),
                    sender: doc.pengirim,
                    status: 'Masuk'
                })),
                ...suratKeluarRes.data.paginatedData.map(doc => ({
                    id: doc.id,
                    type: 'Surat Keluar',
                    title: 'Surat Keluar - ' + doc.surat_nomor,
                    date: new Date(doc.tanggal),
                    sender: doc.pengirim,
                    status: 'Keluar'
                })),
                ...fakturRes.data.paginatedData.map(doc => ({
                    id: doc.id,
                    type: 'Faktur',
                    title: 'Faktur - ' + (doc.nomor_faktur || doc.id),
                    date: new Date(doc.tanggal || Date.now()),
                    sender: '-',
                    status: 'Tagihan'
                })),
                ...notulenRes.data.paginatedData.map(doc => ({
                    id: doc.id,
                    type: 'Notulen',
                    title: doc.judul,
                    date: new Date(doc.tanggal_rapat),
                    sender: doc.pemimpin_rapat,
                    status: 'Rapat'
                }))
            ];

            // Sort by date
            combinedDocs.sort((a, b) => b.date.getTime() - a.date.getTime());
            setRecentDocs(combinedDocs);

            if (skipCache) {
                storage.set(CACHE_KEYS.RECENT_DOCS, {
                    data: combinedDocs,
                    timestamp: Date.now()
                });
            }

            setLoading(false);
        } catch (error) {
            console.error("Error updating recent docs:", error);
            setLoading(false);
        }
    }, [getDataWithCache]); // Add getDataWithCache as a dependency

    // Memoize updateCalendarEvents
    const updateCalendarEvents = useCallback(async () => {
        try {
            // Fetch notulen data
            const notulenRes = await axios.get<ApiResponse<Notulen>>(
                'https://api-efiling.vercel.app/api/notulen'
            );
    
            const paginatedData = notulenRes.data?.data?.paginatedData;
            
            if (!Array.isArray(paginatedData)) {
                console.error("Invalid API response: paginatedData is missing or not an array");
                return;
            }
    
            // Proses data notulen untuk kalender
            const eventsMap = new Map<string, CalendarEvent[]>();
            paginatedData.forEach((rapat: Notulen) => {
                const date = dayjs(rapat.tanggal_rapat).format('YYYY-MM-DD');
                const event: CalendarEvent = {
                    type: "warning",
                    content: rapat.judul
                };
    
                if (eventsMap.has(date)) {
                    eventsMap.get(date)?.push(event);
                } else {
                    eventsMap.set(date, [event]);
                }
            });
    
            setCalendarEvents(eventsMap);
    
            // Update cache
            storage.set(CACHE_KEYS.CALENDAR_EVENTS, {
                data: Array.from(eventsMap.entries()),
                timestamp: Date.now()
            });
        } catch (error) {
            console.error("Error updating calendar events:", error);
        }
    }, []); // No dependencies needed for this function

    useEffect(() => {
        // Initial data fetch
        fetchDataRef.current();

        // Set up regular refresh interval
        const refreshInterval = setInterval(() => {
            fetchDataRef.current();
        }, CACHE_EXPIRY / 2);

        // Set up event listeners for data updates
        const unsubscribe = eventBus.on(DATA_EVENTS.ANY_DATA_UPDATED, () => {
            console.log('Data update detected, refreshing dashboard data');
            storage.remove(CACHE_KEYS.RECENT_DOCS);
            fetchRecentDocsOnly();
            fetchDataRef.current(true); // Force skip cache on data update events
        });

        const unsubscribeCalendar = eventBus.on(DATA_EVENTS.NOTULEN_UPDATED, () => {
            console.log('Memperbarui data kalender kegiatan');

            // Invalidate cache untuk calendar events
            storage.remove(CACHE_KEYS.CALENDAR_EVENTS);

            // Fetch khusus data notulen untuk kalender
            updateCalendarEvents();
        });

        return () => {
            clearInterval(refreshInterval);
            unsubscribe();
            unsubscribeCalendar();
        };
    }, [fetchRecentDocsOnly, updateCalendarEvents]); // Include required dependencies

    const getCalendarEventsForDate = useCallback((dateStr: string): CalendarEvent[] => {
        return calendarEvents.get(dateStr) || [];
    }, [calendarEvents]);

    return {
        loading,
        userData,
        stats,
        recentDocs,
        calendarEvents,
        getCalendarEventsForDate,
        forceRefresh,
    };
};

export default useDashboardData;
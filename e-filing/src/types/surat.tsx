// types/surat.ts
import { Dayjs } from 'dayjs';

export interface SuratMasuk {
    no_surat_masuk: string;
    tanggal: string;
    alamat: string;
    perihal: string;
    tujuan: string;
    organisasi: string;
    pengirim: string;
    penerima: string;
    sifat_surat: string;
    scan_surat: string;
    expired_data: string;
    user_id: string;
    tanggal_penyelesaian: string;
    isi_disposisi: string;
}

export interface PaginationMeta {
    currentPage: number;
    offset: number;
    itemsPerPage: number;
    unpaged: boolean;
    totalPages: number;
    totalItems: number;
    sortBy: string[];
    filter: Record<string, unknown>;
}

export interface SuratMasukResponse {
    data: {
        paginatedData: SuratMasuk[];
        meta: PaginationMeta;
    };
    status: number;
    message: string;
}
// Interface untuk form values
export interface SuratFormValues extends Omit<SuratMasuk, 'no_surat_masuk' | 'user_id' | 'scan_surat' | 'tanggal' | 'expired_data'> {
    tanggal: Dayjs;
    expired_data: Dayjs;
    scan_surat?: File;
}
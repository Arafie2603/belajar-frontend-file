// types/surat.ts
import { Dayjs } from 'dayjs';

export interface SuratMasuk {
    key: string;
    nomorSurat: string;
    tanggalSurat: string;
    perihal: string;
    tujuanSurat: string;
    organisasi: string;
    pengirim: string;
    penerima: string;
}

export interface SuratFormValues extends Omit<SuratMasuk, 'key' | 'tanggalSurat'> {
    tanggalSurat: Dayjs;
    scanSurat?: File;
}

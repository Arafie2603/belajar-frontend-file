import { createContext, useState } from 'react';

interface Participant {
    id?: string;
    name: string;
    no_telp?: string;
    nomor_identitas: string;
    type: 'registered' | 'custom';
}

interface NotulenType {
    id: string;
    judul: string;
    tanggal_rapat: string;
    lokasi: string;
    pemimpin_rapat: string;
    peserta: string;
    peserta_list?: Participant[];
    agenda: string;
    dokumen_lampiran: string;
    status: string;
    updated_by?: string;
    created_by?: string;
    user_id?: string;
}

interface NotulenContextType {
    selectedNotulen: NotulenType | null;
    setSelectedNotulen: (notulen: NotulenType | null) => void;
}

const NotulenContext = createContext<NotulenContextType | undefined>(undefined);

export const NotulenProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [selectedNotulen, setSelectedNotulen] = useState<NotulenType | null>(null);

    return (
        <NotulenContext.Provider value={{ selectedNotulen, setSelectedNotulen }}>
            {children}
        </NotulenContext.Provider>
    );
};

export default NotulenContext;

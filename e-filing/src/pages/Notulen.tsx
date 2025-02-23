import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Breadcrumb, Layout, theme, Spin, Table, Button, Modal, message } from 'antd';
import type { TableProps } from 'antd';

interface DataType {
    key: string;
    id: string;
    tanggalWaktu: string;
    tempat: string;
    agenda: string;
    hasil: string;
}

const { Content } = Layout;

const Notulen: React.FC = () => {
    const {
        token: { colorBgContainer, borderRadiusLG },
    } = theme.useToken();

    const [data, setData] = useState<DataType[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const BASE_URL = import.meta.env.VITE_BASE_URL;

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await axios.get(
                    `${BASE_URL}api/notulen`, {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem('token')}`,
                        "Content-Type": 'aplication/json',
                    }
                }
                );

                if (response.status === 200 && response.data.data.paginatedData) {
                    const rawData = response.data.data.paginatedData;

                    // Format data sesuai kebutuhan tabel
                    const formattedData: DataType[] = rawData.map((item: any) => ({
                        key: item.id, // Pastikan setiap baris memiliki key unik
                        tanggalSurat: new Date(item.tanggal_rapat).toLocaleDateString('id-ID'),
                        tempat: item.lokasi,
                        agenda: item.agenda,
                        hasil: item.dokumen_lampiran,
                    }));
                    setData(formattedData);
                }
            } catch (error) {
                console.error('Error fetching data:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []); // Dependensi kosong agar hanya dipanggil sekali saat mount

    const handleDetail = (record: DataType) => {
        Modal.info({
            title: 'Detail Notulen',
            content: (
                <div>
                    <p><strong>Tanggal:</strong> {record.tanggalWaktu}</p>
                    <p><strong>Tempat:</strong> {record.tempat}</p>
                    <p><strong>Agenda:</strong> {record.agenda}</p>
                    <p>
                        <strong>Dokumen:</strong>{' '}
                        <a href={record.id} target="_blank" rel="noopener noreferrer">
                            Lihat Dokumen
                        </a>
                    </p>
                </div>
            ),
            onOk() { },
        });
    };

    // Fungsi untuk Menghapus Surat
    const handleDelete = (id: string) => {
        Modal.confirm({
            title: 'Apakah Anda yakin ingin menghapus surat ini?',
            content: 'Tindakan ini tidak dapat dibatalkan.',
            okText: 'Ya, Hapus',
            okType: 'danger',
            cancelText: 'Batal',
            onOk: async () => {
                try {
                    await axios.delete(
                        `https://belajar-backend-2ya9omyb5-arafie2603s-projects.vercel.app/api/notulen/${id}`
                    );

                    message.success('Surat berhasil dihapus!');
                    setData((prevData) => prevData.filter((item) => item.key !== id));
                } catch (error) {
                    message.error('Gagal menghapus surat!');
                }
            },
        });
    };

    const columns: TableProps<DataType>['columns'] = [
        {
            title: 'Tanggal Waktu',
            dataIndex: 'tanggalWaktu',
            key: 'tanggalWaktu',
        },
        {
            title: 'Tempat',
            dataIndex: 'tempat',
            key: 'tempat',
        },
        {
            title: 'Agenda',
            key: 'agenda',
            dataIndex: 'agenda',
        },
        {
            title: 'Hasil',
            key: 'hasil',
            dataIndex: 'hasil',
        },
        {
            title: 'Kelola',
            key: 'kelola',
            render: (_, record) => (
                <>
                    <Button type="primary" onClick={() => handleDetail(record)} style={{ marginRight: 8 }}>
                        Detail
                    </Button>
                    <Button type="primary" danger onClick={() => handleDelete(record.key)}>
                        Delete
                    </Button>
                </>
            ),
        },
    ];

    return (
        <Content style={{ margin: '0 16px' }}>
            <Breadcrumb
                items={[{ title: 'Notulen' }]}
                style={{ margin: '16px 0', fontSize: '30px', fontWeight: 'bold' }}
            ></Breadcrumb>
            <div
                style={{
                    padding: 24,
                    minHeight: 360,
                    background: colorBgContainer,
                    borderRadius: borderRadiusLG,
                }}
            >
                {loading ? (
                    <Spin size="large" style={{ display: 'block', textAlign: 'center', marginTop: 50 }} />
                ) : (
                    <Table<DataType> columns={columns} dataSource={data} pagination={{ pageSize: 5 }} />
                )}
            </div>
        </Content>
    );
};

export default Notulen;

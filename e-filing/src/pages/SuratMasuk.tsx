/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useState } from 'react';
import { Layout, Table, Button, Modal, Card, Typography, Input, Space, Tooltip, Badge, message } from 'antd';
import { 
    PlusOutlined, 
    EditOutlined, 
    DeleteOutlined, 
    EyeOutlined, 
    SearchOutlined, 
    FileTextOutlined 
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useSuratMasuk } from '../hooks/useSuratMasukCache';
import { InputForm } from '../components/InputForm';
import type { SuratMasuk, SuratFormValues } from '../types/surat';
import { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';

const { Content } = Layout;
const { Title, Text } = Typography;

const SuratMasukPage: React.FC = () => {
    const navigate = useNavigate();
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [searchText, setSearchText] = useState('');
    
    const BASE_URL = import.meta.env.VITE_BASE_URL || "https://api-efiling.vercel.app/";
    const { 
        data, 
        loading, 
        error, 
        deleteSurat,
        addSurat,
        pagination 
    } = useSuratMasuk(BASE_URL);

    const handleDelete = (noSurat: string) => {
        Modal.confirm({
            title: 'Konfirmasi Penghapusan',
            content: 'Apakah Anda yakin ingin menghapus surat ini?',
            okText: 'Ya, Hapus',
            okType: 'danger',
            cancelText: 'Batal',
            onOk: async () => {
                try {
                    await deleteSurat(noSurat);
                    message.success('Surat berhasil dihapus!');
                } catch (err) {
                    message.error('Gagal menghapus surat!');
                }
            },
        });
    };
    const handleSubmit = async (values: SuratFormValues) => {
        try {
            const formData = new FormData();
            
            // Handle date fields
            formData.append('tanggal', values.tanggal.format('YYYY-MM-DD'));
            formData.append('expired_data', values.expired_data.format('YYYY-MM-DD'));
            
            // Handle file upload
            if (values.scan_surat instanceof File) {
                formData.append('scan_surat', values.scan_surat);
            }
            
            // Handle other fields
            Object.entries(values).forEach(([key, value]) => {
                if (
                    value !== undefined && 
                    key !== 'tanggal' && 
                    key !== 'expired_data' && 
                    key !== 'scan_surat'
                ) {
                    formData.append(key, String(value));
                }
            });
    
            await addSurat(formData);
            message.success('Surat berhasil ditambahkan!');
            setIsModalVisible(false);
            // Explicitly refresh data after successful submission
            await refreshData();
        } catch (err) {
            console.error('Error submitting form:', err);
            message.error('Gagal menambahkan surat!');
        }
    };

    const columns: ColumnsType<SuratMasuk> = [
        {
            title: 'Nomor Surat',
            dataIndex: 'no_surat_masuk',
            key: 'no_surat_masuk',
            width: 150,
        },
        {
            title: 'Tanggal',
            dataIndex: 'tanggal',
            key: 'tanggal',
            width: 120,
            render: (text: string) => dayjs(text).format('DD/MM/YYYY'),
        },
        {
            title: 'Perihal',
            dataIndex: 'perihal',
            key: 'perihal',
            width: 200,
        },
        {
            title: 'Tujuan',
            dataIndex: 'tujuan',
            key: 'tujuan',
            width: 150,
        },
        {
            title: 'Organisasi',
            dataIndex: 'organisasi',
            key: 'organisasi',
            width: 150,
        },
        {
            title: 'Pengirim',
            dataIndex: 'pengirim',
            key: 'pengirim',
            width: 120,
        },
        {
            title: 'Penerima',
            dataIndex: 'penerima',
            key: 'penerima',
            width: 120,
        },
        {
            title: 'Aksi',
            key: 'action',
            fixed: 'right' as const,
            width: 150,
            render: (_: unknown, record: SuratMasuk) => (
                <Space>
                    <Tooltip title="Lihat Detail">
                        <Button
                            type="primary"
                            icon={<EyeOutlined />}
                            onClick={() => navigate(`/dashboard/surat-masuk/${record.no_surat_masuk}`)}
                        />
                    </Tooltip>
                    <Tooltip title="Edit">
                        <Button
                            icon={<EditOutlined />}
                            onClick={() => message.info('Fitur edit akan segera hadir!')}
                        />
                    </Tooltip>
                    <Tooltip title="Hapus">
                        <Button
                            type="primary"
                            danger
                            icon={<DeleteOutlined />}
                            onClick={() => handleDelete(record.no_surat_masuk)}
                        />
                    </Tooltip>
                </Space>
            ),
        },
    ];

    const filteredData = Array.isArray(data) ? data.filter(item =>
        Object.values(item).some(val =>
            val?.toString().toLowerCase().includes(searchText.toLowerCase())
        )
    ) : [];

    if (error) {
        return (
            <Card>
                <Text type="danger">Error: {error}</Text>
            </Card>
        );
    }

    return (
        <Content style={{ margin: '16px' }}>
            <Card bordered={false} className="shadow-sm">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                    <div>
                        <Title level={2} style={{ margin: 0 }}>
                            <FileTextOutlined style={{ marginRight: 8, color: '#1890ff' }} />
                            Surat Masuk
                        </Title>
                        <Text type="secondary">Kelola semua surat masuk Anda di sini</Text>
                    </div>
                    <Badge count={pagination?.totalItems || 0}>
                        <Button
                            type="primary"
                            icon={<PlusOutlined />}
                            onClick={() => setIsModalVisible(true)}
                            size="large"
                        >
                            Tambah Surat
                        </Button>
                    </Badge>
                </div>

                <div style={{ marginBottom: 16 }}>
                    <Input
                        placeholder="Cari surat..."
                        prefix={<SearchOutlined />}
                        onChange={e => setSearchText(e.target.value)}
                        style={{ width: 300 }}
                    />
                </div>

                <Table<SuratMasuk>
                    columns={columns}
                    dataSource={filteredData}
                    loading={loading}
                    rowKey="no_surat_masuk"
                    pagination={{
                        current: pagination?.currentPage,
                        pageSize: pagination?.itemsPerPage,
                        total: pagination?.totalItems,
                        showTotal: (total, range) => `${range[0]}-${range[1]} dari ${total} surat`,
                        showSizeChanger: true,
                        showQuickJumper: true,
                    }}
                    bordered
                    scroll={{ x: 'max-content' }}
                />
            </Card>

            <InputForm
                visible={isModalVisible}
                onCancel={() => setIsModalVisible(false)}
                onSubmit={handleSubmit}
                loading={loading}
            />
        </Content>
    );
};

export default SuratMasukPage;
/* eslint-disable @typescript-eslint/no-unused-vars */
// components/SuratMasuk/index.tsx
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
import { InputForm } from '../components/inputForm';
import type { SuratMasuk as SuratMasukType, SuratFormValues } from '../types/surat';
import { ColumnsType } from 'antd/es/table';

const { Content } = Layout;
const { Title, Text } = Typography;

const SuratMasukPage: React.FC = () => {
    const navigate = useNavigate();
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [searchText, setSearchText] = useState('');
    
    const BASE_URL = import.meta.env.VITE_BASE_URL || "https://belajar-backend-d3iolm3c5-arafie2603s-projects.vercel.app/";
    const { 
        data, 
        loading, 
        error, 
        deleteSurat,
        addSurat 
    } = useSuratMasuk(BASE_URL);

    const handleDelete = (nomorSurat: string) => {
        Modal.confirm({
            title: 'Konfirmasi Penghapusan',
            content: 'Apakah Anda yakin ingin menghapus surat ini?',
            okText: 'Ya, Hapus',
            okType: 'danger',
            cancelText: 'Batal',
            onOk: async () => {
                try {
                    await deleteSurat(nomorSurat);
                    message.success('Surat berhasil dihapus!');
                } catch (err) {
                    message.error('Gagal menghapus surat!');
                }
            },
        });
    };

    const handleSubmit = async (values: SuratFormValues) => {
        try {
            const formattedValues = {
                ...values,
                tanggalSurat: values.tanggalSurat.format('YYYY-MM-DD')
            };
            await addSurat(formattedValues);
            message.success('Surat berhasil ditambahkan!');
            setIsModalVisible(false);
        } catch (err) {
            message.error('Gagal menambahkan surat!');
        }
    };

    const columns: ColumnsType<SuratMasukType> = [
        {
            title: 'Nomor Surat',
            dataIndex: 'nomorSurat',
            key: 'nomorSurat',
            width: 150,
        },
        {
            title: 'Tanggal',
            dataIndex: 'tanggalSurat',
            key: 'tanggalSurat',
            width: 120,
        },
        {
            title: 'Perihal',
            dataIndex: 'perihal',
            key: 'perihal',
            width: 200,
        },
        {
            title: 'Organisasi',
            dataIndex: 'organisasi',
            key: 'organisasi',
            width: 150,
        },
        {
            title: 'Tujuan',
            dataIndex: 'tujuanSurat',
            key: 'tujuanSurat',
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
            render: (_: unknown, record: SuratMasukType) => (
                <Space>
                    <Tooltip title="Lihat Detail">
                        <Button
                            type="primary"
                            icon={<EyeOutlined />}
                            onClick={() => navigate(`/dashboard/surat-masuk/${record.nomorSurat}`)}
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
                            onClick={() => handleDelete(record.nomorSurat)}
                        />
                    </Tooltip>
                </Space>
            ),
        },
    ];

    const filteredData = data.filter(item =>
        Object.values(item).some(val =>
            val.toString().toLowerCase().includes(searchText.toLowerCase())
        )
    );

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
                    <Badge count={data.length}>
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

                <Table<SuratMasukType>
                    columns={columns}
                    dataSource={filteredData}
                    loading={loading}
                    pagination={{
                        pageSize: 10,
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
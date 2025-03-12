import React, { useState, useRef } from 'react';
import { Layout, Table, Button, Modal, Card, Typography, Input, Space, Tooltip, message, Tag, Dropdown, Menu, Empty, InputRef } from 'antd';
import {
    PlusOutlined,
    EditOutlined,
    DeleteOutlined,
    EyeOutlined,
    SearchOutlined,
    FileTextOutlined,
    FilterOutlined,
    ExclamationCircleOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useSuratMasuk } from '../hooks/useSuratMasukCache';
import { InputForm } from '../components/InputForm';
import type { SuratMasuk, SuratFormValues } from '../types/surat';
import { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import { invalidateSpecificCache, CACHE_KEYS } from '../hooks/useDashboardData';
import { eventBus, DATA_EVENTS } from '../utils/eventBus';
import type { FilterValue, FilterDropdownProps, SorterResult, TablePaginationConfig } from 'antd/es/table/interface';

const { Content } = Layout;
const { Title, Text } = Typography;
const { confirm } = Modal;

const SuratMasukPage: React.FC = () => {
    const navigate = useNavigate();
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [searchText, setSearchText] = useState('');
    const [searchedColumn, setSearchedColumn] = useState('');
    const [editRecord, setEditRecord] = useState<SuratMasuk | null>(null);
    const [isEditMode, setIsEditMode] = useState(false);
    const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
    const [filteredInfo, setFilteredInfo] = useState<Record<string, FilterValue | null>>({});
    const [sortedInfo, setSortedInfo] = useState<SorterResult<SuratMasuk>>({});
    const searchInput = useRef<InputRef>(null);
    const BASE_URL = import.meta.env.VITE_BASE_URL || "https://api-efiling.vercel.app/";
    const [pagination, setPagination] = useState<TablePaginationConfig>({
        current: 1,
        pageSize: 10,
        total: 0,
    });


    const {
        data,
        loading,
        error,
        deleteSurat,
        addSurat,
        updateSurat,
        refreshData,
    } = useSuratMasuk(BASE_URL);

    const handleDelete = (noSurat: string) => {
        confirm({
            title: 'Konfirmasi Penghapusan',
            icon: <ExclamationCircleOutlined style={{ color: '#ff4d4f' }} />,
            content: 'Apakah Anda yakin ingin menghapus surat ini?',
            okText: 'Ya, Hapus',
            okType: 'danger',
            cancelText: 'Batal',
            onOk: async () => {
                try {
                    await deleteSurat(noSurat);
                    // Invalidate specific cache
                    invalidateSpecificCache(CACHE_KEYS.SURAT_MASUK);

                    // Also invalidate dependent caches
                    invalidateSpecificCache(CACHE_KEYS.DASHBOARD_STATS);
                    invalidateSpecificCache(CACHE_KEYS.RECENT_DOCS);

                    // Emit events
                    eventBus.emit(DATA_EVENTS.SURAT_MASUK_UPDATED);
                    eventBus.emit(DATA_EVENTS.ANY_DATA_UPDATED);
                    message.success('Surat berhasil dihapus!');
                } catch (err) {
                    console.error(err); // Debugging
                    message.error(`Gagal menghapus surat! ${err instanceof Error ? err.message : String(err)}`);
                }

            },
        });
    };

    const handleMultipleDelete = () => {
        if (selectedRowKeys.length === 0) {
            message.warning('Pilih minimal satu surat untuk dihapus');
            return;
        }

        confirm({
            title: 'Konfirmasi Penghapusan Massal',
            icon: <ExclamationCircleOutlined style={{ color: '#ff4d4f' }} />,
            content: `Apakah Anda yakin ingin menghapus ${selectedRowKeys.length} surat yang dipilih?`,
            okText: 'Ya, Hapus Semua',
            okType: 'danger',
            cancelText: 'Batal',
            onOk: async () => {
                try {
                    // Convert selectedRowKeys to string array for deletion
                    const noSuratList = selectedRowKeys.map(key => key.toString());

                    // Create a promise for each delete operation
                    const deletePromises = noSuratList.map(noSurat => deleteSurat(noSurat));

                    // Wait for all deletes to complete
                    await Promise.all(deletePromises);

                    // Reset selected rows
                    setSelectedRowKeys([]);

                    // Invalidate caches
                    invalidateSpecificCache(CACHE_KEYS.SURAT_MASUK);
                    invalidateSpecificCache(CACHE_KEYS.DASHBOARD_STATS);
                    invalidateSpecificCache(CACHE_KEYS.RECENT_DOCS);

                    // Emit events
                    eventBus.emit(DATA_EVENTS.SURAT_MASUK_UPDATED);
                    eventBus.emit(DATA_EVENTS.ANY_DATA_UPDATED);

                    message.success(`${selectedRowKeys.length} surat berhasil dihapus!`);

                    // Refresh the data
                    await refreshData();
                } catch (err) {
                    message.error('Gagal menghapus beberapa surat!');
                    console.error('Error deleting multiple documents:', err);
                }
            },
        });
    };

    const handleEdit = (record: SuratMasuk) => {
        setEditRecord(record);
        setIsEditMode(true);
        setIsModalVisible(true);
    };

    const handleSubmit = async (values: SuratFormValues) => {
        try {
            const formData = new FormData();

            // Handle date fields dengan benar
            if (values.tanggal) {
                formData.append('tanggal', values.tanggal.format('YYYY-MM-DD'));
            }

            if (values.expired_data) {
                formData.append('expired_data', values.expired_data.format('YYYY-MM-DD'));
            }

            if (values.tanggal_penyelesaian) {
                formData.append('tanggal_penyelesaian', values.tanggal_penyelesaian.format('YYYY-MM-DD'));
            }

            if (values.scan_surat instanceof File) {
                formData.append('scan_surat', values.scan_surat);
            }

            Object.entries(values).forEach(([key, value]) => {
                if (
                    value !== undefined &&
                    key !== 'tanggal' &&
                    key !== 'expired_data' &&
                    key !== 'tanggal_penyelesaian' &&
                    key !== 'scan_surat'
                ) {
                    formData.append(key, String(value));
                }
            });

            if (isEditMode && editRecord) {
                // Update existing surat
                await updateSurat(editRecord.no_surat_masuk, formData);
                // Invalidate specific cache
                invalidateSpecificCache(CACHE_KEYS.SURAT_MASUK);

                // Also invalidate dependent caches
                invalidateSpecificCache(CACHE_KEYS.DASHBOARD_STATS);
                invalidateSpecificCache(CACHE_KEYS.RECENT_DOCS);

                // Emit events
                eventBus.emit(DATA_EVENTS.SURAT_MASUK_UPDATED);
                eventBus.emit(DATA_EVENTS.ANY_DATA_UPDATED);
                message.success('Surat berhasil diperbarui!');
            } else {
                // Add new surat
                await addSurat(formData);
                message.success('Surat berhasil ditambahkan!');
            }

            setIsModalVisible(false);
            setIsEditMode(false);
            setEditRecord(null);

            // Explicitly refresh data after successful submission
            await refreshData();

            // Invalidate specific cache
            invalidateSpecificCache(CACHE_KEYS.SURAT_MASUK);

            // Also invalidate dependent caches
            invalidateSpecificCache(CACHE_KEYS.DASHBOARD_STATS);
            invalidateSpecificCache(CACHE_KEYS.RECENT_DOCS);

            // Emit events
            eventBus.emit(DATA_EVENTS.SURAT_MASUK_UPDATED);
            eventBus.emit(DATA_EVENTS.ANY_DATA_UPDATED);
        } catch (err) {
            console.error('Error submitting form:', err);
            message.error(isEditMode ? 'Gagal memperbarui surat!' : 'Gagal menambahkan surat!');
        }
    };

    const handleCancel = () => {
        setIsModalVisible(false);
        setIsEditMode(false);
        setEditRecord(null);
    };
    const handleTableChange = (
        pagination: TablePaginationConfig,
        filters: Record<string, FilterValue | null>,
        sorter: SorterResult<SuratMasuk> | SorterResult<SuratMasuk>[]
    ) => {
        setFilteredInfo(filters);
        setSortedInfo(Array.isArray(sorter) ? sorter[0] : sorter);

        // Update pagination sesuai struktur yang benar
        setPagination({
            current: pagination.current || 1,
            pageSize: pagination.pageSize || 10,
            total: pagination.total || 0,
        });
    };



    const clearFilters = () => {
        setFilteredInfo({});
        setSearchText('');
        setSearchedColumn('');
    };

    // Enhanced search function with immediate confirmation
    const handleSearch = (selectedKeys: React.Key[], confirm: () => void, dataIndex: keyof SuratMasuk) => {
        confirm();
        setSearchText(selectedKeys[0] as string);
        setSearchedColumn(dataIndex as string);
    };

    // Enhanced reset function that immediately applies changes
    const handleReset = (clearFilters: () => void, confirm: () => void) => {
        clearFilters();
        setSearchText('');
        confirm(); // Immediately apply the reset
    };

    const getColumnSearchProps = (dataIndex: keyof SuratMasuk) => ({
        filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters }: FilterDropdownProps) => (
            <div style={{ padding: 8 }}>
                <Input
                    ref={searchInput}
                    placeholder={`Cari ${dataIndex}`}
                    value={selectedKeys[0]}
                    onChange={e => setSelectedKeys(e.target.value ? [e.target.value] : [])}
                    onPressEnter={() => handleSearch(selectedKeys, confirm, dataIndex)}
                    style={{ marginBottom: 8, display: 'block' }}
                />
                <Space>
                    <Button
                        type="primary"
                        onClick={() => handleSearch(selectedKeys, confirm, dataIndex)}
                        icon={<SearchOutlined />}
                        size="small"
                        style={{ width: 90 }}
                    >
                        Cari
                    </Button>
                    <Button
                        onClick={() => clearFilters && handleReset(clearFilters, confirm)}
                        size="small"
                        style={{ width: 90 }}
                    >
                        Reset
                    </Button>
                </Space>
            </div>
        ),
        filterIcon: (filtered: boolean) => (
            <SearchOutlined style={{ color: filtered ? '#1890ff' : undefined }} />
        ),
        onFilter: (value: boolean | React.Key, record: SuratMasuk) => {
            const fieldValue = record[dataIndex];
            if (!fieldValue) return false;

            return String(fieldValue)
                .toLowerCase()
                .includes(String(value).toLowerCase());
        },
        filteredValue: filteredInfo[dataIndex as string] || null,
        render: (text: string) => {
            if (searchedColumn === dataIndex && searchText) {
                const parts = String(text).split(new RegExp(`(${searchText})`, 'gi'));
                return (
                    <span>
                        {parts.map((part, i) =>
                            part.toLowerCase() === searchText.toLowerCase() ? (
                                <span key={i} style={{ backgroundColor: '#ffc069' }}>
                                    {part}
                                </span>
                            ) : (
                                part
                            )
                        )}
                    </span>
                );
            }
            return text;
        },
    });

    const getDateRangeFilterProps = () => ({
        filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters }: FilterDropdownProps) => {
            const selectedRange = Array.isArray(selectedKeys) ? selectedKeys : ['', ''];

            return (
                <div style={{ padding: 8 }}>
                    <Space direction="vertical">
                        <Input.Group compact>
                            <Input
                                style={{ width: '45%' }}
                                placeholder="Tanggal Awal"
                                type="date"
                                value={selectedRange[0] as string}
                                onChange={e => {
                                    const newSelectedKeys = [e.target.value, selectedRange[1]];
                                    setSelectedKeys(newSelectedKeys);
                                }}
                            />
                            <Input
                                style={{ width: '45%' }}
                                placeholder="Tanggal Akhir"
                                type="date"
                                value={selectedRange[1] as string}
                                onChange={e => {
                                    const newSelectedKeys = [selectedRange[0], e.target.value];
                                    setSelectedKeys(newSelectedKeys);
                                }}
                            />
                        </Input.Group>
                        <Space>
                            <Button
                                type="primary"
                                onClick={() => confirm()}
                                icon={<SearchOutlined />}
                                size="small"
                            >
                                Filter
                            </Button>
                            <Button
                                onClick={() => {
                                    if (clearFilters) {
                                        clearFilters();
                                        confirm(); // Immediately apply filter reset
                                    }
                                }}
                                size="small"
                            >
                                Reset
                            </Button>
                        </Space>
                    </Space>
                </div>
            );
        },
        filterIcon: (filtered: boolean) => <FilterOutlined style={{ color: filtered ? '#1890ff' : undefined }} />,
        onFilter: (value: boolean | React.Key, record: SuratMasuk) => {
            if (!value || !Array.isArray(value) || value.length < 2 || !value[0] || !value[1]) return true;

            const [startDate, endDate] = value as string[];
            const recordDate = dayjs(record.tanggal);

            return recordDate.format('YYYY-MM-DD') >= startDate && recordDate.format('YYYY-MM-DD') <= endDate;
        },
    });

    const rowSelection = {
        selectedRowKeys,
        onChange: (selectedRowKeys: React.Key[]) => {
            setSelectedRowKeys(selectedRowKeys);
        },
        selections: [
            Table.SELECTION_ALL,
            Table.SELECTION_NONE,
            Table.SELECTION_INVERT,
            {
                key: 'this-month',
                text: 'Pilih Bulan Ini',
                onSelect: () => {
                    const currentMonthStart = dayjs().startOf('month').format('YYYY-MM-DD');
                    const currentMonthEnd = dayjs().endOf('month').format('YYYY-MM-DD');

                    const thisMonthKeys = data
                        .filter(item => {
                            const itemDate = dayjs(item.tanggal).format('YYYY-MM-DD');
                            return itemDate >= currentMonthStart && itemDate <= currentMonthEnd;
                        })
                        .map(item => item.no_surat_masuk);

                    setSelectedRowKeys(thisMonthKeys);
                },
            },
        ],
    };

    // Generate unique values for filter dropdowns
    const getUniqueValues = (dataIndex: keyof SuratMasuk) => {
        if (!Array.isArray(data)) return [];

        const uniqueValues = new Set(
            data.map(item => item[dataIndex]).filter(Boolean)
        );

        return Array.from(uniqueValues).map(value => ({
            text: value,
            value: value,
        }));
    };

    const columns: ColumnsType<SuratMasuk> = [
        {
            title: 'Nomor',
            dataIndex: 'no_surat_masuk',
            key: 'no_surat_masuk',
            width: 150,
            ...getColumnSearchProps('no_surat_masuk'),
            sorter: (a, b) => a.no_surat_masuk.localeCompare(b.no_surat_masuk),
            sortOrder: sortedInfo.columnKey === 'no_surat_masuk' ? sortedInfo.order : null,
        },
        {
            title: 'Tanggal',
            dataIndex: 'tanggal',
            key: 'tanggal',
            width: 120,
            ...getDateRangeFilterProps(),
            sorter: (a, b) => dayjs(a.tanggal).unix() - dayjs(b.tanggal).unix(),
            sortOrder: sortedInfo.columnKey === 'tanggal' ? sortedInfo.order : null,
            render: (text: string) => {
                const formattedDate = dayjs(text).format('DD/MM/YYYY');
                // Add color-coding for recent documents (within last 7 days)
                const isRecent = dayjs().diff(dayjs(text), 'day') <= 7;
                return (
                    <span>
                        {formattedDate}
                        {isRecent && (
                            <Tag color="green" style={{ marginLeft: 5 }}>
                                Baru
                            </Tag>
                        )}
                    </span>
                );
            },
        },
        {
            title: 'Perihal',
            dataIndex: 'perihal',
            key: 'perihal',
            width: 200,
            ...getColumnSearchProps('perihal'),
            sorter: (a, b) => a.perihal.localeCompare(b.perihal),
            sortOrder: sortedInfo.columnKey === 'perihal' ? sortedInfo.order : null,
            ellipsis: true,
        },
        {
            title: 'Tujuan',
            dataIndex: 'tujuan',
            key: 'tujuan',
            width: 150,
            filters: getUniqueValues('tujuan'),
            filteredValue: filteredInfo.tujuan || null,
            onFilter: (value: boolean | React.Key, record: SuratMasuk) => record.tujuan === String(value),
            sorter: (a, b) => a.tujuan.localeCompare(b.tujuan),
            sortOrder: sortedInfo.columnKey === 'tujuan' ? sortedInfo.order : null,
        },
        {
            title: 'Organisasi',
            dataIndex: 'organisasi',
            key: 'organisasi',
            width: 150,
            filters: getUniqueValues('organisasi'),
            filteredValue: filteredInfo.organisasi || null,
            onFilter: (value: boolean | React.Key, record: SuratMasuk) => record.organisasi === String(value),
            sorter: (a, b) => a.organisasi.localeCompare(b.organisasi),
            sortOrder: sortedInfo.columnKey === 'organisasi' ? sortedInfo.order : null,
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
                            onClick={() => handleEdit(record)}
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

    // Apply global search filter
    const filteredData = Array.isArray(data) ? data.filter(item =>
        searchText ? Object.values(item).some(val =>
            val?.toString().toLowerCase().includes(searchText.toLowerCase())
        ) : true
    ) : [];

    // Check if we have data but no results after filtering
    const isDataEmpty = filteredData.length === 0;

    if (error) {
        return (
            <Card>
                <Text type="danger">Error: {error}</Text>
            </Card>
        );
    }

    return (
        <Content style={{ margin: '16px' }}>
            <Card variant='outlined' className="shadow-sm">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                    <div>
                        <Title level={2} style={{ margin: 0 }}>
                            <FileTextOutlined style={{ marginRight: 8, color: '#1890ff' }} />
                            Surat Masuk
                            <span style={{
                                fontSize: '16px',
                                backgroundColor: '#1890ff',
                                color: 'white',
                                borderRadius: '12px',
                                padding: '2px 10px',
                                marginLeft: '12px',
                                display: 'inline-block',
                                verticalAlign: 'middle'
                            }}>
                                {filteredData.length}
                            </span>
                        </Title>
                        <Text type="secondary">Kelola semua surat masuk Anda di sini</Text>
                    </div>
                    <Space>
                        <Button
                            type="primary"
                            icon={<PlusOutlined />}
                            onClick={() => setIsModalVisible(true)}
                            size="large"
                        >
                            Tambah Surat
                        </Button>
                        <Dropdown overlay={
                            <Menu>
                                <Menu.Item key="1" onClick={clearFilters}>
                                    Reset Semua Filter
                                </Menu.Item>
                                <Menu.Item key="2" onClick={() => setSelectedRowKeys([])}>
                                    Reset Pilihan
                                </Menu.Item>
                            </Menu>
                        }>
                        </Dropdown>
                    </Space>
                </div>

                <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Input
                        placeholder="Cari surat..."
                        prefix={<SearchOutlined />}
                        onChange={(e) => setSearchText(e.target.value)}
                        style={{ width: 300 }}
                        allowClear
                    />
                    {selectedRowKeys.length > 0 && (
                        <Button
                            type="primary"
                            danger
                            icon={<DeleteOutlined />}
                            onClick={handleMultipleDelete}
                        >
                            Hapus {selectedRowKeys.length} Surat Terpilih
                        </Button>
                    )}
                </div>

                <Table<SuratMasuk>
                    columns={columns}
                    dataSource={filteredData}
                    loading={loading}
                    rowKey="no_surat_masuk"
                    rowSelection={rowSelection}
                    pagination={{
                        current: pagination?.current,
                        pageSize: pagination?.pageSize,
                        total: pagination?.total, 
                        showTotal: (total, range) => `${range[0]}-${range[1]} dari ${total} surat`,
                        showSizeChanger: true,
                        showQuickJumper: true,
                        position: ['bottomRight'],
                    }}
                    onChange={handleTableChange}
                    bordered
                    scroll={{ x: 'max-content' }}
                    size="middle"
                    locale={{
                        emptyText: isDataEmpty && !loading ? (
                            <Empty
                                image={Empty.PRESENTED_IMAGE_SIMPLE}
                                description={
                                    <span>
                                        {searchText ? 'Tidak ada surat yang sesuai dengan pencarian Anda' : 'Belum ada surat masuk'}
                                    </span>
                                }
                            />
                        ) : undefined,
                    }}
                />

            </Card>

            <InputForm
                visible={isModalVisible}
                onCancel={handleCancel}
                onSubmit={handleSubmit as (values: FormData | SuratFormValues) => Promise<void>}
                loading={loading}
                isEdit={isEditMode}
                initialData={editRecord}
                title={isEditMode ? 'Edit Surat Masuk' : 'Input Surat Masuk Baru'}
            />
        </Content>
    );
};

export default SuratMasukPage;
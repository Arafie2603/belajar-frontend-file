/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useState, useCallback, Key } from 'react';
import axios from 'axios';
import {
  Layout,
  Table,
  Button,
  Modal,
  message,
  Card,
  Typography,
  Form,
  Input,
  DatePicker,
  Space,
  Tooltip,
  Upload,
  Alert,
  Select,
  Dropdown,
  Menu,
} from 'antd';

import { TablePaginationConfig } from 'antd/es/table';
import { ColumnsType, FilterValue, SorterResult, SortOrder } from 'antd/es/table/interface';

import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  InboxOutlined,
  FileTextOutlined,
  SearchOutlined,
  DownOutlined,
  FilterOutlined,
  SortAscendingOutlined,
  SortDescendingOutlined
} from '@ant-design/icons';
import { UploadProps } from 'antd';
import CKEditorComponent from '../components/CKEditor';
import { useSuratCache } from '../hooks/useSuratKeluarCache';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import { eventBus, DATA_EVENTS } from '../utils/eventBus';
import LoadingSkeleton from '../components/LoadingSkeleton';
import { CACHE_KEYS, invalidateSpecificCache } from '../hooks/useDashboardData';

const { Content } = Layout;
const { Title, Text } = Typography;
const { Dragger } = Upload;

interface DataType {
  id: string;
  surat_nomor: string;
  tanggal: string;
  tempat_surat: string;
  lampiran: string;
  isi_surat: string;
  penerima: string;
  pengirim: string;
  jabatan_pengirim: string;
  gambar: string;
  keterangan_gambar: string;
  sifat_surat: string;
  keterangan?: string;
}

interface SuratKeluar extends Partial<DataType> {
  customProperty?: string;
}



interface FormProps {
  visible: boolean;
  onCancel: () => void;
  onSubmit: (values: any) => void;
  submitting: boolean;
  initialValues?: DataType | null;
  isEdit?: boolean;
}

const SuratForm: React.FC<FormProps> = ({
  visible,
  onCancel,
  onSubmit,
  submitting,
  initialValues = null,
  isEdit = false
}) => {
  const [form] = Form.useForm();
  const [editorData, setEditorData] = useState('');
  const [fileList, setFileList] = useState<any[]>([]);

  useEffect(() => {
    if (visible) {
      form.resetFields();

      if (initialValues) {
        const formattedValues = {
          ...initialValues,
          tanggal: initialValues.tanggal ? dayjs(initialValues.tanggal, 'DD/MM/YYYY') : undefined
        };

        form.setFieldsValue(formattedValues);
        setEditorData(initialValues.isi_surat || '');

        if (initialValues.gambar) {
          setFileList([
            {
              uid: '-1',
              name: 'Current File',
              status: 'done',
              url: initialValues.gambar,
              thumbUrl: initialValues.gambar
            }
          ]);
        } else {
          setFileList([]);
        }
      } else {
        setEditorData('');
        setFileList([]);
      }
    }
  }, [visible, initialValues, form]);

  const uploadProps: UploadProps = {
    name: "gambar",
    multiple: false,
    accept: ".pdf,.jpg,.png",
    maxCount: 1,
    fileList: fileList,
    onChange(info) {
      setFileList(info.fileList);
    },
    beforeUpload: (file) => {
      const isValidType = file.type === "application/pdf" || file.type.startsWith("image/");
      const isValidSize = file.size / 1024 / 1024 < 5;

      if (!isValidType) {
        message.error("Hanya mendukung file PDF dan gambar!");
        return Upload.LIST_IGNORE;
      }

      if (!isValidSize) {
        message.error("Ukuran file tidak boleh lebih dari 5MB!");
        return Upload.LIST_IGNORE;
      }

      return false;
    },
  };

  const handleSubmit = (values: any) => {
    const formData = new FormData();

    // Add all form values to FormData
    Object.entries(values).forEach(([key, value]: [string, any]) => {
      if (key === 'tanggal') {
        formData.append(key, value.format('YYYY-MM-DD'));
      } else if (value !== undefined && value !== null) {
        formData.append(key, value);
      }
    });

    formData.append('isi_surat', editorData);

    if (fileList.length > 0 && fileList[0].originFileObj) {
      formData.append('gambar', fileList[0].originFileObj);
    }

    if (isEdit) {
      formData.append('keep_existing_file', (!fileList.length || !fileList[0].originFileObj) ? 'true' : 'false');
    }

    onSubmit(formData);
  };

  return (
    <Modal
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <FileTextOutlined style={{ color: '#1890ff' }} />
          <span>{isEdit ? 'Edit Surat Keluar' : 'Input Surat Keluar Baru'}</span>
        </div>
      }
      open={visible}
      onCancel={() => {
        form.resetFields();
        setEditorData('');
        setFileList([]);
        onCancel();
      }}
      width={800}
      footer={[
        <Button key="back" onClick={onCancel}>
          Batal
        </Button>,
        <Button
          key="submit"
          type="primary"
          loading={submitting}
          onClick={() => form.submit()}
        >
          {isEdit ? 'Simpan Perubahan' : 'Simpan'}
        </Button>,
      ]}
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
      >
        <Form.Item
          name="tanggal"
          label="Tanggal Surat"
          rules={[{ required: true, message: 'Mohon pilih tanggal surat!' }]}
        >
          <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" />
        </Form.Item>

        <Form.Item
          name="tempat_surat"
          label="Tempat Surat"
          rules={[{ required: true, message: 'Mohon isi tempat surat!' }]}
        >
          <Input placeholder="Masukkan tempat surat" />
        </Form.Item>

        <Form.Item
          name="lampiran"
          label="Lampiran"
          rules={[{ required: true, message: 'Mohon isi lampiran surat!' }]}
        >
          <Input placeholder="Masukkan lampiran surat" />
        </Form.Item>

        <Form.Item
          label="Isi Surat"
          required
        >
          <CKEditorComponent value={editorData} onChange={setEditorData} />
        </Form.Item>

        <Form.Item
          name="penerima"
          label="Penerima"
          rules={[{ required: true, message: 'Mohon isi penerima surat!' }]}
        >
          <Input placeholder="Masukkan penerima surat" />
        </Form.Item>

        <Form.Item
          name="pengirim"
          label="Pengirim"
          rules={[{ required: true, message: 'Mohon isi pengirim surat!' }]}
        >
          <Input placeholder="Masukkan pengirim surat" />
        </Form.Item>

        <Form.Item
          name="jabatan_pengirim"
          label="Jabatan Pengirim"
          rules={[{ required: true, message: 'Mohon isi jabatan pengirim surat!' }]}
        >
          <Input placeholder="Masukkan jabatan pengirim surat" />
        </Form.Item>

        <Form.Item
          name="gambar"
          label="Gambar"
        >
          <Dragger {...uploadProps}>
            <p className="ant-upload-drag-icon">
              <InboxOutlined />
            </p>
            <p className="ant-upload-text">
              {fileList.length > 0 && fileList[0].url
                ? 'File saat ini: ' + fileList[0].name
                : 'Klik atau seret file ke area ini untuk mengunggah'}
            </p>
            <p className="ant-upload-hint">
              Mendukung file PDF atau gambar. Maksimal ukuran file 5MB.
            </p>
          </Dragger>
        </Form.Item>

        <Form.Item
          name="keterangan_gambar"
          label="Keterangan Gambar"
          rules={[{ required: true, message: 'Mohon isi keterangan gambar!' }]}
        >
          <Input placeholder="Masukkan keterangan gambar" />
        </Form.Item>

        <Form.Item
          name="sifat_surat"
          label="Sifat Surat"
          rules={[{ required: true, message: 'Mohon isi sifat surat!' }]}
        >
          <Select placeholder="Pilih keterangan">
            <Select.Option value="penting">penting</Select.Option>
            <Select.Option value="biasa saja">biasa saja</Select.Option>
            <Select.Option value="rahasia">rahasia</Select.Option>
          </Select>
        </Form.Item>

        <Form.Item
          name="keterangan"
          label="Keterangan"
          rules={[{ required: true, message: 'Mohon pilih keterangan!' }]}
        >
          <Select placeholder="Pilih keterangan">
            <Select.Option value="H">H</Select.Option>
            <Select.Option value="SA">SA</Select.Option>
            <Select.Option value="SS">SS</Select.Option>
            <Select.Option value="P">P</Select.Option>
          </Select>
        </Form.Item>
      </Form>
    </Modal>
  );
};

const SuratKeluar: React.FC = () => {
  const { isAuthenticated, token } = useAuth();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [currentRecord, setCurrentRecord] = useState<DataType | null>(null);
  const [searchText, setSearchText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [filteredInfo, setFilteredInfo] = useState<Record<string, any>>({});
  const [sortedInfo, setSortedInfo] = useState<{ columnKey?: string; order?: string }>({});
  const BASE_URL = import.meta.env.VITE_BASE_URL || 'https://api-efiling.vercel.app/';
  const navigate = useNavigate();

  const {
    data,
    loading,
    error,
    fetchSuratById,
    updateSurat,
    deleteSurat,
    refreshData
  } = useSuratCache(BASE_URL);

  const refreshDataCallback = useCallback(() => {
    refreshData();
  }, [refreshData]);

  useEffect(() => {
    if (!isAuthenticated) {
      window.location.href = '/';
    }
  }, [isAuthenticated]);

  useEffect(() => {
    // Use the return value from eventBus.on() as the unsubscribe function
    const unsubscribeSuratKeluar = eventBus.on(DATA_EVENTS.SURAT_KELUAR_UPDATED, refreshDataCallback);
    const unsubscribeAnyData = eventBus.on(DATA_EVENTS.ANY_DATA_UPDATED, refreshDataCallback);

    return () => {
      unsubscribeSuratKeluar();
      unsubscribeAnyData();
    };
  }, [refreshDataCallback]);

  const handleEdit = async (record: SuratKeluar) => {
    if (!record.id) {
      message.error("ID surat tidak valid!");
      return;
    }

    try {
      const currentSurat = await fetchSuratById(record.id);
      if (currentSurat) {
        setCurrentRecord(currentSurat as DataType);
        setIsEditModalVisible(true);
      }
    } catch (err) {
      const error = err as Error;
      message.error('Gagal mengambil data surat: ' + (error.message || 'Unknown error'));
    }
  };


  const getMonths = () => {
    const months: { [key: string]: string } = {
      '01': 'Januari',
      '02': 'Februari',
      '03': 'Maret',
      '04': 'April',
      '05': 'Mei',
      '06': 'Juni',
      '07': 'Juli',
      '08': 'Agustus',
      '09': 'September',
      '10': 'Oktober',
      '11': 'November',
      '12': 'Desember'
    };

    const uniqueMonths = new Set<string>();

    data.forEach((item: DataType) => {
      const dateParts = item.tanggal.split('/');
      if (dateParts.length > 1) {
        const monthKey = dateParts[1]; // month is in the second position (DD/MM/YYYY)
        if (months[monthKey]) {
          uniqueMonths.add(`${monthKey}:${months[monthKey]}`);
        }
      }
    });

    return Array.from(uniqueMonths).map(monthEntry => {
      const [monthKey, monthName] = monthEntry.split(':');
      return {
        text: monthName,
        value: monthKey
      };
    }).sort((a, b) => parseInt(a.value) - parseInt(b.value));
  };

  const handleDelete = async (id: string) => {
    Modal.confirm({
      title: 'Konfirmasi Penghapusan',
      content: 'Apakah Anda yakin ingin menghapus surat ini?',
      okText: 'Ya, Hapus',
      okType: 'danger',
      cancelText: 'Batal',
      onOk: async () => {
        try {
          await deleteSurat(id);
          message.success('Surat berhasil dihapus!');
          invalidateSpecificCache(CACHE_KEYS.SURAT_KELUAR);
          invalidateSpecificCache(CACHE_KEYS.DASHBOARD_STATS);
          invalidateSpecificCache(CACHE_KEYS.RECENT_DOCS);
          eventBus.emit(DATA_EVENTS.SURAT_KELUAR_UPDATED);
          eventBus.emit(DATA_EVENTS.ANY_DATA_UPDATED);
        } catch (err) {
          const error = err as Error;
          console.error('Error deleting surat:', error);
          message.error(error.message || 'Gagal menghapus surat!');
        }
      },
    });
  };

  const handleMultipleDelete = async () => {
    if (selectedRowKeys.length === 0) {
      message.warning('Silakan pilih surat yang ingin dihapus terlebih dahulu');
      return;
    }

    Modal.confirm({
      title: 'Konfirmasi Penghapusan',
      content: `Apakah Anda yakin ingin menghapus ${selectedRowKeys.length} surat terpilih?`,
      okText: 'Ya, Hapus',
      okType: 'danger',
      cancelText: 'Batal',
      onOk: async () => {
        try {
          // Create an array of promises for deleting each selected surat
          const deletePromises = selectedRowKeys.map(id => deleteSurat(id as string));

          // Wait for all delete operations to complete
          await Promise.all(deletePromises);

          message.success(`${selectedRowKeys.length} surat berhasil dihapus!`);
          setSelectedRowKeys([]);

          // Invalidate caches and emit events
          invalidateSpecificCache(CACHE_KEYS.SURAT_MASUK);
          invalidateSpecificCache(CACHE_KEYS.DASHBOARD_STATS);
          invalidateSpecificCache(CACHE_KEYS.RECENT_DOCS);
          eventBus.emit(DATA_EVENTS.SURAT_MASUK_UPDATED);
          eventBus.emit(DATA_EVENTS.ANY_DATA_UPDATED);
        } catch (err) {
          const error = err as Error;
          console.error('Error deleting multiple surats:', error);
          message.error(error.message || 'Gagal menghapus beberapa surat!');
        }
      },
    });
  };

  const handleSubmit = async (formData: FormData) => {
    setSubmitting(true);
    try {
      await axios.post(`${BASE_URL}api/surat-keluar`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${token}`
        },
      });

      message.success('Surat keluar berhasil ditambahkan!');

      setIsModalVisible(false);
      invalidateSpecificCache(CACHE_KEYS.SURAT_KELUAR);
      invalidateSpecificCache(CACHE_KEYS.DASHBOARD_STATS);
      invalidateSpecificCache(CACHE_KEYS.RECENT_DOCS);
      eventBus.emit(DATA_EVENTS.SURAT_KELUAR_UPDATED);
      eventBus.emit(DATA_EVENTS.ANY_DATA_UPDATED);
    } catch (err) {
      const error = err as any;
      message.error(
        'Gagal menambahkan surat keluar: ' +
        (error.response?.data?.message || error.message)
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdate = async (formData: FormData) => {
    if (!currentRecord?.id) return;

    setSubmitting(true);
    try {
      await updateSurat(currentRecord.id, formData);
      message.success('Surat keluar berhasil diperbarui!');
      invalidateSpecificCache(CACHE_KEYS.SURAT_MASUK);
      invalidateSpecificCache(CACHE_KEYS.DASHBOARD_STATS);
      invalidateSpecificCache(CACHE_KEYS.RECENT_DOCS);
      eventBus.emit(DATA_EVENTS.SURAT_MASUK_UPDATED);
      eventBus.emit(DATA_EVENTS.ANY_DATA_UPDATED);
      setIsEditModalVisible(false);
    } catch (err) {
      const error = err as Error;
      message.error(
        'Gagal memperbarui surat keluar: ' + (error.message || 'Unknown error')
      );
    } finally {
      setSubmitting(false);
    }
  };

  // const handleDeleteByMonth = (monthNumber: string) => {
  //   const monthName = {
  //     '01': 'Januari',
  //     '02': 'Februari',
  //     '03': 'Maret',
  //     '04': 'April',
  //     '05': 'Mei',
  //     '06': 'Juni',
  //     '07': 'Juli',
  //     '08': 'Agustus',
  //     '09': 'September',
  //     '10': 'Oktober',
  //     '11': 'November',
  //     '12': 'Desember'
  //   }[monthNumber] || monthNumber;

  //   const itemsToDelete = data.filter((item) => {
  //     const dateParts = item.tanggal.split('/');
  //     return dateParts.length > 1 && dateParts[1] === monthNumber;
  //   });

  //   if (itemsToDelete.length === 0) {
  //     message.warning(`Tidak ada surat pada bulan ${monthName}`);
  //     return;
  //   }

  //   Modal.confirm({
  //     title: 'Konfirmasi Penghapusan',
  //     content: `Apakah Anda yakin ingin menghapus ${itemsToDelete.length} surat pada bulan ${monthName}?`,
  //     okText: 'Ya, Hapus',
  //     okType: 'danger',
  //     cancelText: 'Batal',
  //     onOk: async () => {
  //       try {
  //         const deletePromises = itemsToDelete.map(item => deleteSurat(item.id));
  //         await Promise.all(deletePromises);

  //         message.success(`${itemsToDelete.length} surat pada bulan ${monthName} berhasil dihapus!`);
  //         setSelectedRowKeys([]);

  //         invalidateSpecificCache(CACHE_KEYS.SURAT_MASUK);
  //         invalidateSpecificCache(CACHE_KEYS.DASHBOARD_STATS);
  //         invalidateSpecificCache(CACHE_KEYS.RECENT_DOCS);
  //         eventBus.emit(DATA_EVENTS.SURAT_MASUK_UPDATED);
  //         eventBus.emit(DATA_EVENTS.ANY_DATA_UPDATED);
  //       } catch (err) {
  //         const error = err as Error;
  //         console.error('Error deleting surats by month:', error);
  //         message.error(error.message || 'Gagal menghapus surat!');
  //       }
  //     },
  //   });
  // };


  const handleTableChange = (
    pagination: TablePaginationConfig,
    filters: Record<string, FilterValue | null>,
    sorter: SorterResult<SuratKeluar> | SorterResult<SuratKeluar>[],
  ) => {
    setCurrentPage(pagination.current || 1);
    setPageSize(pagination.pageSize || 10);
    setFilteredInfo(filters);

    const sortedInfo = Array.isArray(sorter) ? sorter[0] : sorter;

    setSortedInfo({
      columnKey: sortedInfo.columnKey ? String(sortedInfo.columnKey) : undefined,
      order: sortedInfo.order ?? undefined,
    });
  };



  // Get unique values for filter options
  const getUniqueFilterOptions = (dataIndex: keyof DataType) => {
    const uniqueValues = new Set();
    data.forEach((item: DataType) => {
      if (item[dataIndex]) {
        uniqueValues.add(item[dataIndex].toString());
      }
    });
    return Array.from(uniqueValues).map(value => ({
      text: value as string,
      value: value as string
    }));
  };

  const handleSelectAllData = () => {
    setSelectedRowKeys(data.map(item => item.id));
  };

  const handleClearSelection = () => {
    setSelectedRowKeys([]);
  };

  const handleInvertCurrentPage = () => {
    const currentPageData = data.slice((currentPage - 1) * pageSize, currentPage * pageSize);
    const currentPageIds = currentPageData.map(item => item.id);

    const newSelectedRowKeys = [...selectedRowKeys];

    currentPageIds.forEach(id => {
      const index = newSelectedRowKeys.indexOf(id);
      if (index >= 0) {
        newSelectedRowKeys.splice(index, 1);
      } else {
        newSelectedRowKeys.push(id);
      }
    });

    setSelectedRowKeys(newSelectedRowKeys);
  };

  const batchOperationsMenu = (
    <Menu>
      <Menu.Item key="selectAll" onClick={handleSelectAllData}>
        Pilih Semua Data
      </Menu.Item>
      <Menu.Item key="clearAll" onClick={handleClearSelection}>
        Hapus Semua Pilihan
      </Menu.Item>
      <Menu.Item key="invertCurrent" onClick={handleInvertCurrentPage}>
        Balik Pilihan Halaman Ini
      </Menu.Item>
      <Menu.Divider />
      <Menu.Item key="deleteSelected" onClick={handleMultipleDelete}>
        Hapus Data Terpilih ({selectedRowKeys.length})
      </Menu.Item>
    </Menu>
  );

  // Fungsi helper untuk type checking
  const isSearchableValue = (value: unknown): value is string => {
    return typeof value === 'string' || typeof value === 'number';
  };

  // Apply multiple filters: search text and column filters
  const getFilteredData = () => {
    let filteredResult = [...data];

    // Apply search text filtering
    if (searchText) {
      filteredResult = filteredResult.filter((item: DataType) => {
        return Object.values(item).some((val) => {
          if (isSearchableValue(val)) {
            return val.toString().toLowerCase().includes(searchText.toLowerCase());
          }
          return false;
        });
      });
    }

    Object.keys(filteredInfo).forEach(key => {
      const filterValues = filteredInfo[key];
      if (filterValues && filterValues.length > 0) {
        filteredResult = filteredResult.filter((item: DataType) => {
          const itemValue = item[key as keyof DataType] ?? '';
          if (key === 'tanggal' && filterValues.length > 0) {
            const dateParts = itemValue.toString().split('/');
            if (dateParts.length > 1) {
              return filterValues.includes(dateParts[1]);
            }
            return false;
          }
          return filterValues.includes(itemValue?.toString());
        });
      }
    });

    return filteredResult;
  };

  const filteredData = getFilteredData();

  // Sort data if necessary
  const getSortedData = () => {
    const { columnKey, order } = sortedInfo;

    if (columnKey && order) {
      return [...filteredData].sort((a, b) => {
        const aValue = a[columnKey as keyof DataType];
        const bValue = b[columnKey as keyof DataType];

        if (typeof aValue === 'string' && typeof bValue === 'string') {
          const comparison = aValue.localeCompare(bValue);
          return order === 'ascend' ? comparison : -comparison;
        }

        return 0;
      });
    }

    return filteredData;
  };

  const sortedAndFilteredData = getSortedData();

  if (loading) {
    return <LoadingSkeleton />;
  }

  if (error) {
    return (
      <div>
        <Alert
          message="Error"
          description={error}
          type="error"
          showIcon
        />
        <Button onClick={refreshData}>Coba lagi</Button>
      </div>
    );
  }

  const rowSelection = {
    selectedRowKeys,
    onChange: (selectedKeys: React.Key[]) => setSelectedRowKeys(selectedKeys),
    columnTitle: (
      <Dropdown overlay={batchOperationsMenu} trigger={['click']}>
        <Button size="small" style={{ margin: 0, padding: '0 4px' }} onClick={e => e.stopPropagation()}>
          <DownOutlined />
        </Button>
      </Dropdown>
    ),
    columnWidth: 60,
  };


  const columns: ColumnsType<Partial<DataType>> = [
    {
      title: "Nomor Surat",
      dataIndex: "surat_nomor",
      key: "surat_nomor",
      align: "center",  // ✅ Perbaikan tipe align
      filteredValue: filteredInfo.surat_nomor as Key[] | null,
      filters: [
        { text: "Surat A", value: "A" },
        { text: "Surat B", value: "B" }
      ],
      filterIcon: (filtered: boolean) => (
        <span style={{ color: filtered ? "#1890ff" : undefined }}>🔍</span>
      ),
      sorter: (a, b) => (a.surat_nomor ?? "").localeCompare(b.surat_nomor ?? ""),
      sortOrder:
        sortedInfo.columnKey === "surat_nomor"
          ? (sortedInfo.order as SortOrder)
          : null,  // ✅ Perbaikan tipe sortOrder
    },
    {
      title: "Tanggal Surat",
      dataIndex: "tanggal",
      key: "tanggal",
      align: "center",
      filteredValue: filteredInfo.tanggal as Key[] | null,
      filters: getMonths().map((month) => ({
        text: month.text,
        value: month.value,
      })),
      filterIcon: (filtered: boolean) => (
        <FilterOutlined style={{ color: filtered ? "#1890ff" : undefined }} />
      ),
      sorter: (a: SuratKeluar, b: SuratKeluar) => {
        const dateA = dayjs(a.tanggal, "DD/MM/YYYY");
        const dateB = dayjs(b.tanggal, "DD/MM/YYYY");
        return dateA.valueOf() - dateB.valueOf();
      },
      sortOrder:
        sortedInfo.columnKey === "tanggal"
          ? (sortedInfo.order as SortOrder | undefined)
          : undefined,

    },
    {
      title: "Pengirim",
      dataIndex: "pengirim",
      key: "pengirim",
      align: "center",
      filteredValue: filteredInfo.pengirim as Key[] | null,
      filters: getUniqueFilterOptions("pengirim"),
      filterIcon: (filtered: boolean) => (
        <FilterOutlined style={{ color: filtered ? "#1890ff" : undefined }} />
      ),
      sorter: (a, b) => (a.pengirim ?? "").localeCompare(b.pengirim ?? ""),
      sortOrder:
        sortedInfo.columnKey === "pengirim"
          ? (sortedInfo.order as SortOrder | undefined)
          : undefined,

    },
    {
      title: "Penerima",
      dataIndex: "penerima",
      key: "penerima",
      align: "center",
      filteredValue: filteredInfo.penerima as Key[] | null,
      filters: getUniqueFilterOptions("penerima"),
      filterIcon: (filtered: boolean) => (
        <FilterOutlined style={{ color: filtered ? "#1890ff" : undefined }} />
      ),
      sorter: (a, b) => (a.penerima ?? "").localeCompare(b.penerima ?? ""),
      sortOrder:
        sortedInfo.columnKey === "penerima"
          ? (sortedInfo.order as SortOrder | undefined)
          : undefined,

    },
    {
      title: "Aksi",
      key: "aksi",
      align: "center",
      render: (_: unknown, record: SuratKeluar) => (
        <Space>
          <Tooltip title="Lihat Detail">
            <Button
              type="primary"
              icon={<EyeOutlined />}
              onClick={() => navigate(`/dashboard/surat-keluar/${record.id}`)}
            />
          </Tooltip>
          <Tooltip title="Edit">
            <Button icon={<EditOutlined />} onClick={() => handleEdit(record)} />
          </Tooltip>

          <Tooltip title="Hapus">
            <Button
              type="primary"
              danger
              icon={<DeleteOutlined />}
              onClick={() => handleDelete(record.id ?? '')}
            />
          </Tooltip>
        </Space>
      ),
    },
  ];




  return (
    <Content style={{ margin: '16px' }}>
      <Card className="shadow-sm">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <div>
            <Title level={2} style={{ margin: 0 }}>
              <FileTextOutlined style={{ marginRight: 8, color: '#1890ff' }} />
              Surat Keluar
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
                {sortedAndFilteredData.length}
              </span>
            </Title>
            <Text type="secondary">Kelola semua surat keluar Anda di sini</Text>
          </div>
          <Space>
            {selectedRowKeys.length > 0 && (
              <Button
                type="primary"
                danger
                icon={<DeleteOutlined />}
                onClick={handleMultipleDelete}
              >
                Hapus ({selectedRowKeys.length})
              </Button>
            )}
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => setIsModalVisible(true)}
              size="large"
            >
              Tambah Surat
            </Button>
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
          <Space>
            <Tooltip title="Urutkan Naik">
              <Button
                icon={<SortAscendingOutlined />}
                onClick={() => {
                  const newSortedInfo = { ...sortedInfo };
                  newSortedInfo.order = 'ascend';
                  setSortedInfo(newSortedInfo);
                }}
                type={sortedInfo.order === 'ascend' ? 'primary' : 'default'}
              />
            </Tooltip>
            <Tooltip title="Urutkan Turun">
              <Button
                icon={<SortDescendingOutlined />}
                onClick={() => {
                  const newSortedInfo = { ...sortedInfo };
                  newSortedInfo.order = 'descend';
                  setSortedInfo(newSortedInfo);
                }}
                type={sortedInfo.order === 'descend' ? 'primary' : 'default'}
              />
            </Tooltip>
            <Button
              onClick={() => {
                setFilteredInfo({});
                setSortedInfo({});
                setSearchText('');
              }}
            >
              Reset Filter
            </Button>
          </Space>
        </div>

        <Table
          columns={columns}
          dataSource={sortedAndFilteredData}
          rowKey="id"
          loading={loading}
          rowSelection={rowSelection}
          pagination={{
            current: currentPage,
            pageSize: pageSize,
            onChange: (page, size) => {
              setCurrentPage(page);
              setPageSize(size);
            },
            showTotal: (total, range) => `${range[0]}-${range[1]} dari ${total} surat`,
            showSizeChanger: true,
            showQuickJumper: true,
          }}
          onChange={handleTableChange}
          scroll={{ x: 'max-content' }}
        />
      </Card>

      {/* Create Form Modal */}
      <SuratForm
        visible={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        onSubmit={handleSubmit}
        submitting={submitting}
      />

      {/* Edit Form Modal */}
      <SuratForm
        visible={isEditModalVisible}
        onCancel={() => {
          setIsEditModalVisible(false);
          setCurrentRecord(null);
        }}
        onSubmit={handleUpdate}
        submitting={submitting}
        initialValues={currentRecord}
        isEdit={true}
      />
    </Content>
  );
}

export default SuratKeluar;
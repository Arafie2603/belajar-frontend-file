import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Breadcrumb, Layout, theme, Spin, Table, Button, Modal, message } from 'antd';
import type { TableProps } from 'antd';

interface DataType {
  key: string;
  nomorSurat: string;
  tanggalSurat: string;
  perihal: string;
  tujuanSurat: string;
}

const { Content } = Layout;

const SuratKeluar: React.FC = () => {
  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();

  const [data, setData] = useState<DataType[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const BASE_URL = import.meta.env.VITE_BASE_URL;
        const response = await axios.get(
          `${BASE_URL}api/surat-keluar`
        );

        if (response.status === 200 && response.data.data.paginatedData) {
          const rawData = response.data.data.paginatedData;

          // Format data sesuai kebutuhan tabel
          const formattedData: DataType[] = rawData.map((item: any) => ({
            key: item.no_surat_keluar, // Pastikan setiap baris memiliki key unik
            nomorSurat: item.no_surat_keluar,
            tanggalSurat: new Date(item.tanggal).toLocaleDateString('id-ID'),
            perihal: item.perihal,
            tujuanSurat: item.tujuan,
            scanSurat: item.scan_surat,
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
      title: 'Detail Surat Keluar',
      content: (
        <div>
          <p><strong>Nomor Surat:</strong> {record.nomorSurat}</p>
          <p><strong>Tanggal:</strong> {record.tanggalSurat}</p>
          <p><strong>Perihal:</strong> {record.perihal}</p>
          <p><strong>Tujuan:</strong> {record.tujuanSurat}</p>
          <p>
            <strong>Dokumen:</strong>{' '}
            <a href={record.nomorSurat} target="_blank" rel="noopener noreferrer">
              Lihat Dokumen
            </a>
          </p>
        </div>
      ),
      onOk() { },
    });
  };

  // Fungsi untuk Menghapus Surat
  const handleDelete = (nomorSurat: string) => {
    Modal.confirm({
      title: 'Apakah Anda yakin ingin menghapus surat ini?',
      content: 'Tindakan ini tidak dapat dibatalkan.',
      okText: 'Ya, Hapus',
      okType: 'danger',
      cancelText: 'Batal',
      onOk: async () => {
        try {
          await axios.delete(
            `https://belajar-backend-2ya9omyb5-arafie2603s-projects.vercel.app/api/surat-keluar/${nomorSurat}`
          );

          message.success('Surat berhasil dihapus!');
          setData((prevData) => prevData.filter((item) => item.key !== nomorSurat));
        } catch (error) {
          message.error('Gagal menghapus surat!');
        }
      },
    });
  };

  const columns: TableProps<DataType>['columns'] = [
    {
      title: 'Nomor Surat',
      dataIndex: 'nomorSurat',
      key: 'nomorSurat',
    },
    {
      title: 'Tanggal Surat',
      dataIndex: 'tanggalSurat',
      key: 'tanggalSurat',
    },
    {
      title: 'Perihal',
      dataIndex: 'perihal',
      key: 'perihal',
    },
    {
      title: 'Tujuan Surat',
      key: 'tujuanSurat',
      dataIndex: 'tujuanSurat',
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
        items={[{ title: 'Surat Keluar' }]}
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

export default SuratKeluar;

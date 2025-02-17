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
  organisasi: string;
}

const { Content } = Layout;

const SuratMasuk: React.FC = () => {
  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();

  const [data, setData] = useState<DataType[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get(
          'https://belajar-backend-2ya9omyb5-arafie2603s-projects.vercel.app/api/surat-masuk'
        );

        if (response.status === 200 && response.data.data.paginatedData) {
          const rawData = response.data.data.paginatedData;

          // Format data sesuai kebutuhan tabel
          const formattedData: DataType[] = rawData.map((item: any) => ({
            key: item.no_surat_masuk, // Pastikan setiap baris memiliki key unik
            organisasi: item.organisasi,
            nomorSurat: item.no_surat_masuk,
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
      title: 'Detail Surat Masuk',
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
            `https://belajar-backend-2ya9omyb5-arafie2603s-projects.vercel.app/api/surat-masuk/${nomorSurat}`
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
      align: 'center',
    },
    {
      title: 'Organisasi',
      dataIndex: 'organisasi',
      key: 'organisasi',
      align: 'center',
    },
    {
      title: 'Tanggal Surat',
      dataIndex: 'tanggalSurat',
      key: 'tanggalSurat',
      align: 'center',
    },
    {
      title: 'Perihal',
      dataIndex: 'perihal',
      key: 'perihal',
      align: 'center',
    },
    {
      title: 'Tujuan Surat',
      key: 'tujuanSurat',
      dataIndex: 'tujuanSurat',
      align: 'center',
    },
    {
      title: 'Kelola',
      key: 'kelola',
      align: 'center',
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
        items={[{ title: 'Surat Masuk' }]}
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
          <Table<DataType> columns={columns} dataSource={data} pagination={{ pageSize: 5 }}/>
        )}
      </div>
    </Content>
  );
};

export default SuratMasuk;

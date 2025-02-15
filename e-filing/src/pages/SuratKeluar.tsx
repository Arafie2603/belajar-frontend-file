import React from 'react';
import { Breadcrumb, Layout, theme, Space, Table, Tag } from 'antd';
import type { TableProps } from 'antd';

interface DataType {
  key: string;
  nomorSurat: string;
  tanggalSurat: string;
  perihal: string;
  tujuanSurat: string;
  tags: string[];
}

const { Content } = Layout;

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
    render: (_, { tags }, record) => (
      <>
        {tags.map((tag) => {
          let color = tag.length > 5 ? 'geekblue' : 'green';
          if (tag === 'loser') {
            color = 'volcano';
          }
          return (
            <Tag color={color} key={tag}>
              {tag.toUpperCase()}
            </Tag>
          );
        })}
      </>

    ),
  },
];

const data: DataType[] = [
  {
    key: '1',
    nomorSurat: 'H/UBL/LAB/010/12/01/24',
    tanggalSurat: "31/01/2024",
    perihal: 'Pemberitahuan Ketersediaan Laboratorium ICT',
    tujuanSurat: 'Lab ICT',
    tags: ['nice', 'developer'],
  },
  {
    key: '2',
    nomorSurat: 'H/UBL/LAB/010/12/01/24',
    tanggalSurat: "31/01/2024",
    perihal: 'Pemberitahuan Ketersediaan Laboratorium ICT',
    tujuanSurat: 'Lab ICT',
    tags: ['nice', 'developer'],
  },
  {
    key: '3',
    nomorSurat: 'H/UBL/LAB/010/12/01/24',
    tanggalSurat: "31/01/2024",
    perihal: 'Pemberitahuan Ketersediaan Laboratorium ICT',
    tujuanSurat: 'Lab ICT',
    tags: ['nice', 'developer'],
  },
];

const SuratKeluar: React.FC = () => {
  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();

  return (
    <Content style={{ margin: '0 16px' }}>
      <Breadcrumb items={[{ title: 'Surat Keluar' }]} style={{ margin: '16px 0', fontSize: '30px', fontWeight: 'bold' }}>
      </Breadcrumb>
      <div
        style={{
          padding: 24,
          minHeight: 360,
          background: colorBgContainer,
          borderRadius: borderRadiusLG,
        }}
      >
        <Table<DataType> columns={columns} dataSource={data} />;
      </div>
    </Content>
  );
};

export default SuratKeluar;
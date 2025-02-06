import React from 'react';
// import 'index.css';
import { Breadcrumb, Layout, theme } from 'antd';

const { Content } = Layout;

const SuratMasuk: React.FC = () => {
  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();

  return (
    <Content style={{ margin: '0 16px' }}>
      <Breadcrumb items={[{ title: 'Contoh' }]} style={{ margin: '16px 0' }}>
        <Breadcrumb.Item>User</Breadcrumb.Item>
        <Breadcrumb.Item>Charish</Breadcrumb.Item>
      </Breadcrumb>
      <div
        style={{
          padding: 24,
          minHeight: 360,
          background: colorBgContainer,
          borderRadius: borderRadiusLG,
        }}
      >
        Charish Testing.
      </div>
    </Content>
  );
};

export default SuratMasuk;
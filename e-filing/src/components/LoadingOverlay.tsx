import React from 'react';
import { Spin } from 'antd';
import { LoadingOutlined } from '@ant-design/icons';

export interface LoadingOverlayProps {
  isLoading: boolean;
  message?: string;
}

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({ isLoading, message = 'Authenticating...' }) => {
  if (!isLoading) return null;

  const antIcon = <LoadingOutlined style={{ fontSize: 40 }} spin />;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.8)',
        zIndex: 9999,
      }}
    >
      <Spin indicator={antIcon} />
      <div style={{ marginTop: 16, color: '#1890ff', fontWeight: 500 }}>
        {message}
      </div>
    </div>
  );
};

export default LoadingOverlay;
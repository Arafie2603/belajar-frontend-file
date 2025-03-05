import React, { useEffect, useState } from 'react';
import { Layout, Card, Typography, Skeleton, Space, Row, Col } from 'antd';
import {
    DollarOutlined,
    FileTextOutlined,
    MailOutlined,
    SendOutlined,
    DashboardOutlined,
    FileOutlined
} from '@ant-design/icons';
import { useLocation } from 'react-router-dom';

const { Content } = Layout;
const { Title, Text } = Typography;

interface RouteConfig {
    path: string;
    icon: React.ReactNode;
    title: string;
    description: string;
    rowCount: number;
}

const LoadingSkeleton: React.FC = () => {
    const location = useLocation();
    const [config, setConfig] = useState<RouteConfig>({
        path: '',
        icon: <FileOutlined />,
        title: 'Loading',
        description: 'Loading content...',
        rowCount: 5
    });

    useEffect(() => {
        // Extract the correct route path from the full pathname
        // For paths like /dashboard/notulen, this will extract 'notulen'
        const pathSegments = location.pathname.split('/').filter(Boolean);
        let currentPath = pathSegments[0] || 'dashboard';

        // If first segment is dashboard and there's a second segment, use that instead
        if (currentPath === 'dashboard' && pathSegments.length > 1) {
            currentPath = pathSegments[1];
        }

        // Configure based on route
        const routeConfigs: Record<string, RouteConfig> = {
            dashboard: {
                path: 'dashboard',
                icon: <DashboardOutlined style={{ marginRight: 8, color: '#1890ff' }} />,
                title: 'Dashboard',
                description: 'Memuat ringkasan data...',
                rowCount: 4
            },
            'surat-keluar': {
                path: 'surat-keluar',
                icon: <SendOutlined style={{ marginRight: 8, color: '#1890ff' }} />,
                title: 'Surat Keluar',
                description: 'Memuat data surat keluar...',
                rowCount: 6
            },
            'surat-masuk': {
                path: 'surat-masuk',
                icon: <MailOutlined style={{ marginRight: 8, color: '#1890ff' }} />,
                title: 'Surat Masuk',
                description: 'Memuat data surat masuk...',
                rowCount: 6
            },
            faktur: {
                path: 'faktur',
                icon: <DollarOutlined style={{ marginRight: 8, color: '#1890ff' }} />,
                title: 'Faktur',
                description: 'Kelola semua faktur pembayaran Anda di sini',
                rowCount: 5
            },

            notulen: {
                path: 'notulen',
                icon: <FileTextOutlined style={{ marginRight: 8, color: '#1890ff' }} />,
                title: 'Notulen',
                description: 'Memuat data notulen rapat...',
                rowCount: 3
            }
        };

        // Set configuration based on current route
        setConfig(routeConfigs[currentPath] || {
            path: currentPath,
            icon: <FileOutlined style={{ marginRight: 8, color: '#1890ff' }} />,
            title: currentPath.charAt(0).toUpperCase() + currentPath.slice(1),
            description: 'Memuat konten...',
            rowCount: 5
        });

        // For debugging
        console.log("Current path:", currentPath);
    }, [location]);

    return (
        // <Title level={4} style={{ margin: 0 }}>
        //                 <FileTextOutlined style={{ marginRight: 8, color: '#1890ff' }} />
        //                 Notulen
        //                 <Badge
        //                     count={notulenData.length}
        //                     showZero
        //                     style={{ backgroundColor: '#1890ff', fontSize: '14px', left: '5px' }}
        //                 />
        //             </Title>
        <Content style={{ margin: '16px' }}>
            <Card className="shadow-sm">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                    <div>
                        <Title level={4} style={{ margin: 0 }}>
                            {config.icon}
                            {config.title}
                            <Skeleton.Button active size="small" style={{
                                width: '50px',
                                marginLeft: '12px',
                                borderRadius: '12px',
                                verticalAlign: 'middle'
                            }} />
                        </Title>
                        <Text type="secondary">{config.description}</Text>
                    </div>
                    <Skeleton.Button active size="large" style={{ width: '150px' }} />
                </div>

                <div style={{ marginBottom: 16 }}>
                    <Skeleton.Input active style={{ width: 300 }} />
                </div>

                {/* Table skeleton */}
                <Skeleton active paragraph={{ rows: 1 }} title={false} style={{ marginBottom: '16px' }} />

                <Row gutter={[16, 16]}>
                    {Array.from({ length: config.rowCount }).map((_, index) => (
                        <Col span={24} key={index}>
                            <Card bodyStyle={{ padding: '12px' }}>
                                <Skeleton active paragraph={{ rows: 1 }} />
                                <div style={{ display: 'flex', justifyContent: 'center', marginTop: '8px' }}>
                                    <Space>
                                        <Skeleton.Button active size="default" shape="circle" />
                                        <Skeleton.Button active size="default" shape="circle" />
                                        <Skeleton.Button active size="default" shape="circle" />
                                    </Space>
                                </div>
                            </Card>
                        </Col>
                    ))}
                </Row>
            </Card>
        </Content>
    );
};

export default LoadingSkeleton;
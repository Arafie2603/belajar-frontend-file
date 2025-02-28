import React from 'react';
import { Layout, Card, Typography, Skeleton, Space, Row, Col } from 'antd';
import { DollarOutlined } from '@ant-design/icons';

const { Content } = Layout;
const { Title, Text } = Typography;

const FakturSkeleton: React.FC = () => {
    return (
        <Content style={{ margin: '16px' }}>
            <Card className="shadow-sm">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                    <div>
                        <Title level={2} style={{ margin: 0 }}>
                            <DollarOutlined style={{ marginRight: 8, color: '#1890ff' }} />
                            Faktur
                            <Skeleton.Button active size="small" style={{
                                width: '50px',
                                marginLeft: '12px',
                                borderRadius: '12px',
                                verticalAlign: 'middle'
                            }} />
                        </Title>
                        <Text type="secondary">Kelola semua faktur pembayaran Anda di sini</Text>
                    </div>
                    <Skeleton.Button active size="large" style={{ width: '150px' }} />
                </div>

                <div style={{ marginBottom: 16 }}>
                    <Skeleton.Input active style={{ width: 300 }} />
                </div>

                {/* Table skeleton */}
                <Skeleton active paragraph={{ rows: 1 }} title={false} style={{ marginBottom: '16px' }} />

                <Row gutter={[16, 16]}>
                    {Array.from({ length: 5 }).map((_, index) => (
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

export default FakturSkeleton;
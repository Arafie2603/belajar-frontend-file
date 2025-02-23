/* eslint-disable @typescript-eslint/no-unused-vars */
// components/SuratMasuk/InputForm.tsx
import React from 'react';
import { Modal, Form, Input, DatePicker, Space, Button, Upload, message } from 'antd';
import { InboxOutlined, FileTextOutlined } from '@ant-design/icons';
import type { UploadProps } from 'antd';
import type { SuratFormValues } from '../types/surat';

const { Dragger } = Upload;

interface InputFormProps {
    visible: boolean;
    onCancel: () => void;
    onSubmit: (values: SuratFormValues) => Promise<void>;
    loading?: boolean;
}

export const InputForm: React.FC<InputFormProps> = ({
    visible,
    onCancel,
    onSubmit,
    loading
}) => {
    const [form] = Form.useForm();

    const uploadProps: UploadProps = {
        name: 'file',
        multiple: false,
        action: `${import.meta.env.VITE_BASE_URL}api/surat-masuk/upload`,
        onChange(info) {
            if (info.file.status === 'done') {
                message.success(`${info.file.name} file uploaded successfully`);
            } else if (info.file.status === 'error') {
                message.error(`${info.file.name} file upload failed.`);
            }
        },
    };

    return (
        <Modal
            title={
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <FileTextOutlined style={{ color: '#1890ff' }} />
                    <span>Input Surat Masuk Baru</span>
                </div>
            }
            open={visible}
            onCancel={onCancel}
            width={800}
            footer={null}
        >
            <Form
                form={form}
                layout="vertical"
                onFinish={async (values) => {
                    try {
                        await onSubmit(values as SuratFormValues);
                        form.resetFields();
                    } catch (err) {
                        // Error handled in parent
                    }
                }}
            >
                <Form.Item
                    name="nomorSurat"
                    label="Nomor Surat"
                    rules={[{ required: true, message: 'Mohon masukkan nomor surat!' }]}
                >
                    <Input prefix={<FileTextOutlined />} placeholder="Masukkan nomor surat" />
                </Form.Item>

                <Form.Item
                    name="tanggalSurat"
                    label="Tanggal Surat"
                    rules={[{ required: true, message: 'Mohon pilih tanggal surat!' }]}
                >
                    <DatePicker style={{ width: '100%' }} />
                </Form.Item>

                <Form.Item
                    name="perihal"
                    label="Perihal"
                    rules={[{ required: true, message: 'Mohon masukkan perihal surat!' }]}
                >
                    <Input.TextArea rows={3} placeholder="Masukkan perihal surat" />
                </Form.Item>

                <Form.Item
                    name="organisasi"
                    label="Organisasi"
                    rules={[{ required: true, message: 'Mohon masukkan nama organisasi!' }]}
                >
                    <Input placeholder="Masukkan nama organisasi" />
                </Form.Item>

                <Form.Item
                    name="tujuanSurat"
                    label="Tujuan Surat"
                    rules={[{ required: true, message: 'Mohon masukkan tujuan surat!' }]}
                >
                    <Input placeholder="Masukkan tujuan surat" />
                </Form.Item>

                <Form.Item
                    name="pengirim"
                    label="Pengirim"
                    rules={[{ required: true, message: 'Mohon masukkan nama pengirim!' }]}
                >
                    <Input placeholder="Masukkan nama pengirim" />
                </Form.Item>

                <Form.Item
                    name="penerima"
                    label="Penerima"
                    rules={[{ required: true, message: 'Mohon masukkan nama penerima!' }]}
                >
                    <Input placeholder="Masukkan nama penerima" />
                </Form.Item>

                <Form.Item name="scanSurat" label="Scan Surat">
                    <Dragger {...uploadProps}>
                        <p className="ant-upload-drag-icon">
                            <InboxOutlined />
                        </p>
                        <p className="ant-upload-text">Klik atau seret file ke area ini untuk mengunggah</p>
                        <p className="ant-upload-hint">
                            Mendukung file PDF atau gambar. Maksimal ukuran file 5MB.
                        </p>
                    </Dragger>
                </Form.Item>

                <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
                    <Space>
                        <Button onClick={onCancel}>Batal</Button>
                        <Button type="primary" htmlType="submit" loading={loading}>
                            Simpan
                        </Button>
                    </Space>
                </Form.Item>
            </Form>
        </Modal>
    );
};
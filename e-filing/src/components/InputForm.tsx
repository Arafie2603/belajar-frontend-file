/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState } from 'react';
import { Modal, Form, Input, DatePicker, Space, Button, Upload, message } from 'antd';
import { InboxOutlined, FileTextOutlined } from '@ant-design/icons';
import type { UploadProps } from 'antd';
import type { RcFile, UploadFile } from 'antd/es/upload/interface';
import type { Dayjs } from 'dayjs';
import Dragger from 'antd/es/upload/Dragger';

// First, let's properly define our form values type
export interface SuratFormValues {
    tanggal: Dayjs;
    expired_data: Dayjs;
    perihal: string;
    organisasi: string;
    tujuan: string;
    pengirim: string;
    penerima: string;
    sifat_surat: string;
    diteruskan_kepada: string;
    kategori: string;
    tanggal_penyelesaian: string;
    isi_disposisi: string;
    alamat: string; // Menambahkan field alamat
    scan_surat?: File;
}

export interface SuratMasuk {
    no_surat_masuk: string;
    tanggal: string;
    perihal: string;
    organisasi: string;
    tujuan: string;
    pengirim: string;
    penerima: string;
    sifat_surat: string;
    diteruskan_kepada: string;
    kategori: string;
    tanggal_penyelesaian: string;
    isi_disposisi: string;
    alamat: string;
    scan_surat?: string;
}

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
    const [fileList, setFileList] = useState<UploadFile[]>([]);

    const beforeUpload = (file: RcFile) => {
        const isJpgOrPngOrPdf = file.type === 'image/jpeg' ||
            file.type === 'image/png' ||
            file.type === 'application/pdf';
        if (!isJpgOrPngOrPdf) {
            message.error('Anda hanya dapat mengunggah file JPG/PNG/PDF!');
            return Upload.LIST_IGNORE;
        }

        const isLt5M = file.size / 1024 / 1024 < 5;
        if (!isLt5M) {
            message.error('File harus lebih kecil dari 5MB!');
            return Upload.LIST_IGNORE;
        }

        return false;
    };

    const uploadProps: UploadProps = {
        name: 'scan_surat',
        multiple: false,
        fileList,
        beforeUpload,
        onChange(info) {
            setFileList(info.fileList.slice(-1));
        },
        onRemove: () => {
            setFileList([]);
            return true;
        }
    };

    const handleSubmit = async (values: any) => {
        try {
            // Create the values object that matches SuratFormValues
            const submissionValues: SuratFormValues = {
                ...values,
                scan_surat: fileList[0]?.originFileObj
            };

            await onSubmit(submissionValues);
            setFileList([]);
            form.resetFields();
        } catch (err) {
            message.error('Gagal mengunggah data: ' + (err instanceof Error ? err.message : 'Unknown error'));
        }
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
            onCancel={() => {
                setFileList([]);
                form.resetFields();
                onCancel();
            }}
            width={800}
            footer={null}
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
                    <DatePicker style={{ width: '100%' }} />
                </Form.Item>

                <Form.Item
                    name="alamat"
                    label="Alamat"
                    rules={[{ required: true, message: 'Mohon masukkan alamat!' }]}
                >
                    <Input.TextArea rows={2} placeholder="Masukkan alamat" />
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
                    name="tujuan"
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

                <Form.Item
                    name="sifat_surat"
                    label="Sifat Surat"
                    rules={[{ required: true, message: 'Mohon masukkan sifat surat!' }]}
                >
                    <Input placeholder="Masukkan sifat surat" />
                </Form.Item>

                <Form.Item
                    name="expired_data"
                    label="Expired Data"
                    rules={[{ required: true, message: 'Mohon pilih tanggal expired data!' }]}
                >
                    <DatePicker style={{ width: '100%' }} />
                </Form.Item>

                <Form.Item
                    name="diteruskan_kepada"
                    label="Diteruskan Kepada"
                    rules={[{ required: true, message: 'Mohon masukkan field Diteruskan Kepada!' }]}
                >
                    <Input placeholder="Mohon masukkan field Diteruskan Kepada!" />
                </Form.Item>

                <Form.Item
                    name="kategori"
                    label="Kategori"
                    rules={[{ required: true, message: 'Mohon masukkan kategori surat!' }]}
                >
                    <Input placeholder="Mohon masukkan kategori surat!" />
                </Form.Item>

                <Form.Item
                    name="tanggal_penyelesaian"
                    label="Tanggal Penyelesaian"
                    rules={[{ required: true, message: 'Mohon masukkan tanggal penyelesaian surat!' }]}
                >
                    <Input placeholder="Mohon masukkan tanggal penyelesaian surat!" />
                </Form.Item>

                <Form.Item
                    name="isi_disposisi"
                    label="Disposisi"
                    rules={[{ required: true, message: 'Mohon masukkan disposisi surat!' }]}
                >
                    <Input placeholder="Mohon masukkan disposisi surat!" />
                </Form.Item>

                <Form.Item name="scan_surat" label="Scan Surat">
                    <Dragger {...uploadProps}>
                        <p className="ant-upload-drag-icon">
                            <InboxOutlined />
                        </p>
                        <p className="ant-upload-text">Klik atau seret file ke area ini untuk mengunggah</p>
                        <p className="ant-upload-hint">
                            Mendukung file PDF atau gambar (JPG/PNG). Maksimal ukuran file 5MB.
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
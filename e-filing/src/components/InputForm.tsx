/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from 'react';
import { Modal, Form, Input, DatePicker, Space, Button, Upload, message } from 'antd';
import { InboxOutlined, FileTextOutlined, EditOutlined } from '@ant-design/icons';
import type { UploadProps } from 'antd';
import type { RcFile, UploadFile } from 'antd/es/upload/interface';
import type { Dayjs } from 'dayjs';
import Dragger from 'antd/es/upload/Dragger';
import dayjs from 'dayjs';
import { SuratMasuk } from '../types/surat';

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
    tanggal_penyelesaian: Dayjs;
    isi_disposisi: string;
    alamat: string; // Menambahkan field alamat
    scan_surat?: File;
}

interface InputFormProps {
    visible: boolean;
    onCancel: () => void;
    onSubmit: (values: SuratFormValues) => Promise<void>;
    loading?: boolean;
    isEdit?: boolean;
    initialData?: SuratMasuk | null;
    title?: string;
}

export const InputForm: React.FC<InputFormProps> = ({
    visible,
    onCancel,
    onSubmit,
    loading,
    isEdit = false,
    initialData = null,
    title = 'Input Surat Masuk Baru'
}) => {
    const [form] = Form.useForm();
    const [fileList, setFileList] = useState<UploadFile[]>([]);
    const [fileChanged, setFileChanged] = useState(false);

    // Initialize form with data when editing
    useEffect(() => {
        if (visible && isEdit && initialData) {
            console.log('Initializing form with data:', initialData);
            
            form.setFieldsValue({
                ...initialData,
                tanggal: initialData.tanggal ? dayjs(initialData.tanggal) : undefined,
                expired_data: initialData.expired_data ? dayjs(initialData.expired_data) : undefined,
                tanggal_penyelesaian: initialData.tanggal_penyelesaian ? dayjs(initialData.tanggal_penyelesaian) : undefined,
            });
            
            // If there's a scan_surat URL, create a file list entry for display
            if (initialData.scan_surat) {
                const fileType = initialData.scan_surat.toLowerCase().endsWith('.pdf') ? 'application/pdf' : 'image/jpeg';
                const fileName = initialData.scan_surat.split('/').pop() || 'dokumen';
                
                setFileList([{
                    uid: '-1',
                    name: fileName,
                    status: 'done',
                    url: initialData.scan_surat,
                    type: fileType
                }]);
                
                setFileChanged(false);
            }
        } else if (visible && !isEdit) {
            // Reset form when not editing
            form.resetFields();
            setFileList([]);
            setFileChanged(false);
        }
    }, [visible, isEdit, initialData, form]);

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

        setFileChanged(true);
        return false;
    };

    const uploadProps: UploadProps = {
        name: 'scan_surat',
        multiple: false,
        fileList,
        beforeUpload,
        onChange(info) {
            setFileList(info.fileList.slice(-1));
            if (info.fileList.length > 0) {
                setFileChanged(true);
            }
        },
        onRemove: () => {
            setFileList([]);
            setFileChanged(true);
            return true;
        }
    };

    const handleSubmit = async (values: any) => {
        try {
            // Create the values object that matches SuratFormValues
            const submissionValues: SuratFormValues = {
                ...values,
                // Only include the file if it was changed during editing
                scan_surat: fileChanged ? fileList[0]?.originFileObj : undefined
            };

            await onSubmit(submissionValues);
            setFileList([]);
            setFileChanged(false);
            form.resetFields();
        } catch (err) {
            message.error('Gagal mengunggah data: ' + (err instanceof Error ? err.message : 'Unknown error'));
        }
    };

    return (
        <Modal
            title={
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {isEdit ? <EditOutlined style={{ color: '#1890ff' }} /> : <FileTextOutlined style={{ color: '#1890ff' }} />}
                    <span>{title}</span>
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
                    name="tanggal_penyelesaian"
                    label="Tanggal Penyelesaian"
                    rules={[{ required: true, message: 'Mohon masukkan tanggal penyelesaian surat!' }]}
                >
                    <DatePicker style={{ width: '100%' }} />
                </Form.Item>

                <Form.Item
                    name="isi_disposisi"
                    label="Disposisi"
                    rules={[{ required: true, message: 'Mohon masukkan disposisi surat!' }]}
                >
                    <Input placeholder="Mohon masukkan disposisi surat!" />
                </Form.Item>

                <Form.Item 
                    name="scan_surat" 
                    label="Scan Surat"
                    extra={isEdit && !fileChanged && initialData?.scan_surat ? "File yang ada akan digunakan kecuali jika Anda mengunggah file baru" : ""}
                >
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
                            {isEdit ? 'Perbarui' : 'Simpan'}
                        </Button>
                    </Space>
                </Form.Item>
            </Form>
        </Modal>
    );
};
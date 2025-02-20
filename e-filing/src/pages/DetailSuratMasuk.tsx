import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom"; // 🔹 Ambil no_surat_masuk dari URL
import { Card, Typography, Descriptions, Modal, Image, Spin, Alert } from "antd";

const { Title, Link } = Typography;

const DetailSuratMasuk: React.FC = () => {
    const { no_surat_masuk } = useParams<{ no_surat_masuk: string }>(); // 🔹 Ambil nomor surat dari URL
    const [surat, setSurat] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const API_URL = `https://belajar-backend-2ya9omyb5-arafie2603s-projects.vercel.app/api/surat-masuk/${no_surat_masuk}`;

    useEffect(() => {
        fetch(API_URL)
            .then((res) => res.json())
            .then((data) => {
                setSurat(data.data); // 🔹 Simpan data ke state
                setIsLoading(false);
            })
            .catch((err) => {
                console.error("Error fetching data:", err);
                setIsLoading(false);
            });
    }, [API_URL, no_surat_masuk]);

    if (isLoading) {
        return (
            <div style={{ textAlign: "center", marginTop: 50 }}>
                <Spin size="large" />
                <p>Memuat data surat...</p>
            </div>
        );
    }

    if (!surat) {
        return (
            <div style={{ textAlign: "center", marginTop: 50 }}>
                <Alert message="Gagal mengambil data surat." type="error" />
            </div>
        );
    }

    return (
        <div style={{ display: "flex", justifyContent: "center", marginTop: 50 }}>
            <Card
                style={{
                    width: "60%",
                    boxShadow: "0px 4px 10px rgba(0, 0, 0, 0.1)",
                    borderRadius: "10px",
                }}
            >
                <Title level={3} style={{ textAlign: "center", marginBottom: 20 }}>
                    📄 Detail Surat Masuk
                </Title>

                <Descriptions bordered column={1} size="middle">
                    <Descriptions.Item label={<b>Nomor Surat</b>}>
                        {surat.no_surat_masuk}
                    </Descriptions.Item>
                    <Descriptions.Item label={<b>Tanggal</b>}>
                        {new Date(surat.tanggal).toLocaleDateString("id-ID")}
                    </Descriptions.Item>
                    <Descriptions.Item label={<b>Perihal</b>}>
                        {surat.perihal}
                    </Descriptions.Item>
                    <Descriptions.Item label={<b>Tujuan</b>}>
                        {surat.tujuan}
                    </Descriptions.Item>
                    <Descriptions.Item label={<b>Pengirim</b>}>
                        {surat.pengirim}
                    </Descriptions.Item>
                    <Descriptions.Item label={<b>Penerima</b>}>
                        {surat.penerima}
                    </Descriptions.Item>
                    <Descriptions.Item label={<b>Dokumen</b>}>
                        {surat.scan_surat ? (
                            <Link onClick={() => setIsModalOpen(true)}>📂 Lihat Dokumen</Link>
                        ) : (
                            <span style={{ color: "red" }}>Tidak ada dokumen</span>
                        )}
                    </Descriptions.Item>
                </Descriptions>
            </Card>

            {/* Modal untuk menampilkan gambar */}
            <Modal
                title="Dokumen Surat"
                open={isModalOpen}
                onCancel={() => setIsModalOpen(false)}
                footer={null}
            >
                {surat.scan_surat ? (
                    <Image width="100%" src={surat.scan_surat} alt="Scan Surat" />
                ) : (
                    <Alert message="Tidak ada dokumen" type="error" />
                )}
            </Modal>
        </div>
    );
};

export default DetailSuratMasuk;

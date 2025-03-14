import axios from 'axios';
import dayjs from 'dayjs';
import 'dayjs/locale/id';
dayjs.locale('id');
import { Participant } from '../pages/NotulenPage';

export interface NotulenDetail {
    id: string;
    judul: string;
    tanggal_rapat: string;
    lokasi: string;
    pemimpin_rapat: string;
    peserta: string;
    parsedPeserta?: Array<{
        id?: string;
        name: string;
        type: string;
        role?: string;
        email?: string;
        no_telp?: string;
    }>;
    agenda: string;
    dokumen_lampiran: string;
    status: string;
    updated_by: string;
    created_by: string;
    user_id: string;
}

export const sendAutomaticNotification = async (validParticipants: Participant[], data: NotulenDetail) => {
    if (!validParticipants || validParticipants.length === 0) {
        console.warn('Tidak ada peserta dengan nomor telepon valid.');
        return;
    }

    try {
        // Format meeting date
        const meetingDate = dayjs(data?.tanggal_rapat);
        const now = dayjs();
        const isMeetingPassed = now.isAfter(meetingDate);

        // Prepare messages array with improved phone formatting
        const messages = validParticipants.map(participant => {
            let phoneNumber = participant.no_telp?.trim() ?? '';
            console.log(`Processing ${participant.name} with original phone: ${phoneNumber}`);

            // Format phone number properly
            if (!phoneNumber.startsWith('+')) {
                if (phoneNumber.startsWith('0')) {
                    phoneNumber = '+62' + phoneNumber.substring(1);
                } else if (phoneNumber.startsWith('62')) {
                    phoneNumber = '+' + phoneNumber;
                } else {
                    phoneNumber = '+62' + phoneNumber;
                }
            }

            console.log(`Formatted phone number: ${phoneNumber}`);

            // Tentukan konteks waktu
            let timeContext;
            if (isMeetingPassed) {
                timeContext = `pada tanggal ${meetingDate.format('D MMMM YYYY')}`;
            } else {
                const daysUntil = meetingDate.diff(now, 'day');
                const hoursUntil = meetingDate.diff(now, 'hour');

                if (daysUntil === 0) {
                    if (hoursUntil < 1) {
                        timeContext = `dalam waktu kurang dari 1 jam pada ${meetingDate.format('HH:mm')}`;
                    } else {
                        timeContext = `hari ini pada ${meetingDate.format('HH:mm')} (${hoursUntil} jam lagi)`;
                    }
                } else if (daysUntil === 1) {
                    timeContext = `besok pada ${meetingDate.format('HH:mm')}`;
                } else {
                    timeContext = `dalam ${daysUntil} hari pada ${meetingDate.format('D MMMM YYYY, HH:mm')}`;
                }
            }

            return {
                phone: phoneNumber,
                message: `Hallo *${participant.name}*,\n\n` +
                    `Mimin izin ${isMeetingPassed ? "menginformasikan bahwa" : "mengingatkan untuk acara"} ` +
                    `*${data?.judul}* ${isMeetingPassed ? "telah dilaksanakan" : "akan dilaksanakan"} ${timeContext}. ` +
                    (isMeetingPassed ? "Terima kasih atas partisipasi Anda." : "Pastikan Anda mempersiapkan diri dengan baik ya! 🙌") + "\n\n" +
                    `🏷️ Judul: ${data?.judul}\n` +
                    `📆 Tanggal: ${meetingDate.format("dddd, D MMMM YYYY")}\n` +
                    `🕒 Waktu: ${meetingDate.format("HH:mm")} WIB\n` +
                    `📍 Lokasi: ${data?.lokasi}\n` +
                    `👨‍💼 Pemimpin Rapat: ${data?.pemimpin_rapat}\n\n` +
                    (isMeetingPassed ? "Semoga informasi ini bermanfaat." : "Jangan lupa hadir tepat waktu ya! 😊") + "\n\n" +
                    "Salam hangat dari mimin, dan semangat selalu untuk labkomers! 💪"
            };
        });

        console.log('Sending messages automatically to:', messages.map(m => m.phone));

        // Send batch messages
        const response = await axios.post(
            'http://localhost:4001/sessions/a0b531adf5b71043/send-batch',
            { messages },
            {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': import.meta.env.VITE_AUTH_HEADER
                }
            }
        );

        if (response.data.success) {
            console.log(`Berhasil mengirim notifikasi otomatis kepada ${messages.length} peserta`);
        } else {
            console.error('Gagal mengirim pesan otomatis:', response.data.message || 'Terjadi kesalahan');
        }
    } catch (error) {
        console.error('Error sending messages automatically:', error);
    }
};

import { supabase, isSupabaseConfigured } from '../supabaseClient';

// ==========================================
// 1. DATA TYPES & INTERFACES
// ==========================================

export interface Profile {
  id: string;
  name: string;
  age: number;
  gender?: string;
  points: number;
  xp: number;
  level: number;
  streak: number;
  last_active_date: string;
  role: 'user' | 'admin';
  avatar_url?: string;
  created_at: string;
  leaderboard_score?: number;
  reward_bonus?: number;
}

export interface Category {
  id: string;
  nama: string;
  slug: string;
  deskripsi: string;
}

export interface Material {
  id: string;
  kategori_id: string;
  judul: string;
  slug: string;
  deskripsi: string;
  konten: string;
  video_url?: string;
  pdf_url?: string;
  pdf_file_name?: string;
  pdf_file_size?: number;
  pdf_uploaded_by?: string;
  pdf_uploaded_at?: string;
  infographic_url?: string;
  thumbnail_url?: string;
  xp_reward: number;
}

export interface Quiz {
  id: string;
  materi_id?: string;
  judul: string;
  deskripsi: string;
  xp_reward: number;
  points_reward: number;
}

export interface QuizQuestion {
  id: string;
  quiz_id: string;
  pertanyaan: string;
  opsi_a: string;
  opsi_b: string;
  opsi_c: string;
  opsi_d: string;
  jawaban_benar: 'A' | 'B' | 'C' | 'D';
}

export interface Game {
  id: string;
  nama: string;
  tipe: 'benar_salah' | 'memory' | 'drag_drop' | 'tebak_gambar' | 'puzzle';
  deskripsi: string;
  xp_reward: number;
  points_reward: number;
}

export interface GameQuestion {
  id: string;
  game_id: string;
  data: any; // specific data per game type
  levels?: Array<{ level: number; data: any }>;
}

function getGameQuestionData(questionEntry: GameQuestion | undefined, level = 1): any {
  if (!questionEntry) return null;

  if (questionEntry.levels?.length) {
    const matchedLevel = questionEntry.levels.find(entry => entry.level === level);
    if (matchedLevel) return matchedLevel.data;
    return questionEntry.data ?? questionEntry.levels[0].data;
  }

  return questionEntry.data;
}

export interface GameProgress {
  id: string;
  user_id: string;
  game_id: string;
  current_level: number;
  completed_levels: number;
  max_level: number;
  completed: boolean;
  updated_at: string;
}

const STORAGE_BUCKET = import.meta.env.VITE_SUPABASE_STORAGE_BUCKET || 'materi-assets';

async function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error('Failed to read file as data URL'));
      }
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function normalizeVideoUrl(url: string): string {
  const trimmed = url.trim();
  if (!trimmed) return '';

  try {
    const parsed = new URL(trimmed);
    const host = parsed.hostname.toLowerCase();

    if (host.includes('youtube.com')) {
      const videoId = parsed.searchParams.get('v');
      if (videoId) return `https://www.youtube.com/embed/${videoId}`;
      if (parsed.pathname.includes('/embed/')) return trimmed;
    }

    if (host.includes('youtu.be')) {
      const id = parsed.pathname.slice(1);
      if (id) return `https://www.youtube.com/embed/${id}`;
    }

    if (host.includes('vimeo.com')) {
      const id = parsed.pathname.split('/').filter(Boolean).pop();
      if (id) return `https://player.vimeo.com/video/${id}`;
    }

    return trimmed;
  } catch {
    return trimmed;
  }
}

export interface DailyMission {
  id: string;
  deskripsi: string;
  tipe: 'baca_materi' | 'kerjakan_quiz' | 'main_game' | 'login';
  target_count: number;
  points_reward: number;
}

export interface MissionProgress {
  id: string;
  user_id: string;
  misi_id: string;
  current_count: number;
  completed: boolean;
  tanggal: string;
}

export interface Badge {
  id: string;
  nama: string;
  deskripsi: string;
  icon: string;
  syarat_tipe: 'materi_count' | 'quiz_count' | 'game_count' | 'quiz_perfect_score';
  syarat_value: number;
}

export interface UserBadge {
  id: string;
  user_id: string;
  badge_id: string;
  unlocked_at: string;
}

export interface Consultation {
  id: string;
  user_id: string;
  pertanyaan: string;
  jawaban?: string;
  status: 'pending' | 'answered';
  ditanyakan_at: string;
  dijawab_at?: string;
  admin_id?: string;
  user_name?: string; // helper
}

export interface HealthService {
  id: string;
  nama: string;
  tipe: 'puskesmas' | 'rumah_sakit' | 'hotline';
  alamat?: string;
  telepon?: string;
  jam_layanan?: string;
  koordinat_lokasi?: string;
}

export interface ActivityLog {
  id: string;
  user_id: string;
  tipe_aktivitas: string;
  detail: string;
  created_at: string;
}

export interface Comment {
  id: string;
  materi_id: string;
  user_id: string;
  user_name: string;
  user_avatar?: string;
  teks: string;
  created_at: string;
}

// ==========================================
// 2. MOCK DATABASE SETUP (LOCAL STORAGE)
// ==========================================

const MOCK_CATEGORIES: Category[] = [
  { id: 'cat-1', nama: 'Apa itu HIV?', slug: 'apa-itu-hiv', deskripsi: 'Pahami dasar-dasar virus HIV, cara kerja, dan perkembangannya.' },
  { id: 'cat-2', nama: 'Apa itu AIDS?', slug: 'apa-itu-aids', deskripsi: 'Pelajari fase lanjut dari infeksi HIV dan bagaimana menjaga kesehatan tubuh.' },
  { id: 'cat-3', nama: 'Cara Penularan', slug: 'cara-penularan', deskripsi: 'Mitos vs Fakta seputar bagaimana HIV ditularkan antar manusia.' },
  { id: 'cat-4', nama: 'Cara Pencegahan', slug: 'cara-pencegahan', deskripsi: 'Langkah pencegahan HIV seperti metode ABCDE dan penanganan medis.' },
  { id: 'cat-5', nama: 'Stigma & Diskriminasi', slug: 'stigma-diskriminasi', deskripsi: 'Mari hapus diskriminasi terhadap Orang dengan HIV/AIDS (ODHIV).' },
  { id: 'cat-6', nama: 'Tes HIV', slug: 'tes-hiv', deskripsi: 'Mengenal metode pemeriksaan VCT, kerahasiaan, dan pentingnya tes sejak dini.' },
  { id: 'cat-7', nama: 'Pengobatan (ART)', slug: 'pengobatan-art', deskripsi: 'Mengenal Terapi Antiretroviral untuk menghambat virus dan menjaga imun tubuh.' }
];

const MOCK_MATERIALS: Material[] = [
  {
    id: 'mat-1',
    kategori_id: 'cat-1',
    judul: 'Pengenalan Dasar HIV',
    slug: 'pengenalan-dasar-hiv',
    deskripsi: 'HIV (Human Immunodeficiency Virus) adalah virus yang menyerang sel kekebalan tubuh, khususnya sel CD4.',
    konten: `### Apa itu HIV?

**HIV** adalah singkatan dari **Human Immunodeficiency Virus**. Virus ini menyerang sistem kekebalan tubuh manusia, khususnya sel-sel darah putih yang disebut sel **CD4** atau sel T helper. Sel-sel inilah yang bertugas melindungi tubuh dari berbagai macam infeksi bakteri, virus, atau penyakit lainnya.

Jika kekebalan tubuh diserang, kemampuan pertahanan tubuh akan menurun secara perlahan. Akibatnya, penderita menjadi sangat rentan terkena penyakit-penyakit lain (infeksi oportunistik) yang bagi orang sehat biasanya tidak berbahaya.

#### Hal Penting yang Wajib Kamu Tahu:
1. **HIV bukan berarti langsung AIDS**. Seseorang dapat hidup dengan HIV selama bertahun-tahun tanpa menunjukkan gejala penyakit.
2. **Tidak ada obat penawar** untuk membunuh virus sepenuhnya, tetapi ada obat **Antiretroviral (ART)** yang sangat efektif menekan jumlah virus hingga tidak terdeteksi.
3. **Mendeteksi dini** lewat tes HIV adalah cara terbaik untuk melindungi dirimu dan orang lain.
`,
    video_url: 'https://www.youtube.com/embed/FDVNdn0CoKI',
    pdf_url: '#',
    infographic_url: 'https://images.unsplash.com/photo-1579684389782-64d84b5e901a?auto=format&fit=crop&q=80&w=800',
    thumbnail_url: 'https://images.unsplash.com/photo-1584036561566-baf8f5f1b144?auto=format&fit=crop&q=80&w=400',
    xp_reward: 50
  },
  {
    id: 'mat-2',
    kategori_id: 'cat-3',
    judul: 'Mitos vs Fakta Cara Penularan HIV',
    slug: 'mitos-vs-fakta-penularan',
    deskripsi: 'Pelajari bagaimana HIV benar-benar menular dan hilangkan mitos keliru yang sering beredar.',
    konten: `### Bagaimana HIV Menular?

HIV ditularkan melalui pertukaran berbagai cairan tubuh dari orang yang terinfeksi, seperti **darah, ASI, air mani (semen), dan cairan vagina**. HIV **TIDAK** dapat menular melalui kontak sehari-hari seperti mencium, berpelukan, berjabat tangan, atau berbagi barang pribadi, makanan, atau air.

#### Fakta Penularan HIV:
- **Hubungan Seksual Tanpa Pelindung:** Melalui seks vaginal atau anal dengan seseorang yang terinfeksi tanpa menggunakan kondom.
- **Jarum Suntik Bergantian:** Menggunakan jarum suntik atau alat tato/tindik yang tidak steril bekas pakai orang lain.
- **Ibu ke Bayi:** Selama kehamilan, proses melahirkan, atau menyusui (namun ini bisa dicegah dengan terapi ART yang tepat pada ibu).
- **Transfusi Darah:** Melalui produk darah yang terkontaminasi (sekarang sangat jarang karena adanya skrining ketat).

#### Mitos Keliru (TIDAK MENULARKAN HIV):
- Gigitan nyamuk atau serangga lainnya.
- Bersalaman, berpelukan, atau berciuman pipi.
- Menggunakan toilet umum secara bersamaan.
- Berbagi kolam renang atau alat makan.
- Terkena keringat atau air mata ODHIV.
`,
    video_url: 'https://www.youtube.com/embed/UrMmv3Z5XvM',
    pdf_url: '#',
    infographic_url: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&q=80&w=800',
    thumbnail_url: 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&q=80&w=400',
    xp_reward: 50
  },
  {
    id: 'mat-3',
    kategori_id: 'cat-4',
    judul: 'Konsep Pencegahan ABCDE',
    slug: 'konsep-pencegahan-abcde',
    deskripsi: 'Memahami metode ABCDE yang efektif untuk melindungi diri dan sesama dari infeksi HIV.',
    konten: `### Lindungi Dirimu: Konsep ABCDE

Dalam dunia kesehatan, pencegahan penularan HIV dirumuskan dalam konsep **ABCDE** yang mudah diingat dan sangat efektif untuk remaja maupun dewasa.

#### A - Abstinence (Absen Seks)
Bagi remaja yang belum menikah, langkah paling aman dan utama adalah tidak melakukan hubungan seksual sebelum waktunya.

#### B - Be Faithful (Setia pada Pasangan)
Bagi yang sudah aktif secara seksual, setialah pada satu pasangan yang sah dan pastikan pasangan tersebut tidak terinfeksi HIV. Hubungan monogami menurunkan risiko secara drastis.

#### C - Condom (Gunakan Kondom)
Gunakan kondom secara konsisten dan benar dalam setiap hubungan seksual yang berisiko untuk menghalangi cairan tubuh saling berpindah.

#### D - Don't Use Drugs (Hindari Narkoba)
Hindari penyalahgunaan narkotika, psikotropika, dan zat adiktif lainnya, terutama jenis suntik. Pemakaian jarum secara bergantian sangat berisiko menularkan HIV langsung ke aliran darah.

#### E - Education (Edukasi Diri)
Cari informasi yang benar mengenai HIV/AIDS secara aktif, seperti yang kamu lakukan di platform **PENDEKAREMAJA** ini! Sebarkan ilmu yang benar kepada teman-teman terdekatmu untuk menghentikan rumor negatif.
`,
    video_url: 'https://www.youtube.com/embed/5g13E14x8OQ',
    pdf_url: '#',
    infographic_url: 'https://images.unsplash.com/photo-1518152006812-edab29b069da?auto=format&fit=crop&q=80&w=800',
    thumbnail_url: 'https://images.unsplash.com/photo-1505751172876-fa1923c5c528?auto=format&fit=crop&q=80&w=400',
    xp_reward: 50
  }
];

const MOCK_QUIZZES: Quiz[] = [
  { id: 'quiz-1', materi_id: 'mat-1', judul: 'Kuis Dasar HIV', deskripsi: 'Uji pengetahuan dasarmu tentang pengertian, efek, dan penargetan virus HIV pada kekebalan tubuh.', xp_reward: 100, points_reward: 50 },
  { id: 'quiz-2', materi_id: 'mat-2', judul: 'Kuis Penularan & Mitos', deskripsi: 'Apakah kamu sudah bisa membedakan mana fakta penularan dan mana mitos keliru? Ayo buktikan!', xp_reward: 120, points_reward: 60 }
];

const MOCK_QUESTIONS: QuizQuestion[] = [
  // Quiz 1 Questions
  {
    id: 'q-1-1',
    quiz_id: 'quiz-1',
    pertanyaan: 'Apakah kepanjangan dari singkatan HIV?',
    opsi_a: 'Human Immunodeficiency Virus',
    opsi_b: 'Human Immune-deficiency Variant',
    opsi_c: 'Helper Immunoglobulin Virus',
    opsi_d: 'Healthy Immunity Virus',
    jawaban_benar: 'A'
  },
  {
    id: 'q-1-2',
    quiz_id: 'quiz-1',
    pertanyaan: 'Sel kekebalan tubuh mana yang diserang secara spesifik oleh virus HIV?',
    opsi_a: 'Sel Darah Merah (Eritrosit)',
    opsi_b: 'Keping Darah (Trombosit)',
    opsi_c: 'Sel CD4 (T Helper)',
    opsi_d: 'Sel Saraf (Neuron)',
    jawaban_benar: 'C'
  },
  {
    id: 'q-1-3',
    quiz_id: 'quiz-1',
    pertanyaan: 'Apakah seseorang yang terinfeksi HIV akan langsung terdiagnosa AIDS pada keesokan harinya?',
    opsi_a: 'Ya, virus bekerja dalam 24 jam.',
    opsi_b: 'Tidak, AIDS merupakan fase lanjut yang membutuhkan waktu bertahun-tahun untuk berkembang.',
    opsi_c: 'Tergantung jenis makanan yang dimakan penderita.',
    opsi_d: 'Ya, jika penderita memiliki umur di bawah 15 tahun.',
    jawaban_benar: 'B'
  },
  {
    id: 'q-1-4',
    quiz_id: 'quiz-1',
    pertanyaan: 'Obat apa yang diberikan untuk mengendalikan virus HIV pada tubuh penderita?',
    opsi_a: 'Antibiotik Penicillin',
    opsi_b: 'Antiretroviral (ART)',
    opsi_c: 'Paracetamol',
    opsi_d: 'Vaksin Influenza',
    jawaban_benar: 'B'
  },
  {
    id: 'q-1-5',
    quiz_id: 'quiz-1',
    pertanyaan: 'Langkah awal terbaik untuk mengetahui apakah seseorang terinfeksi HIV atau tidak adalah...',
    opsi_a: 'Melihat perubahan fisik di wajah',
    opsi_b: 'Melakukan Tes HIV (seperti VCT)',
    opsi_c: 'Mengecek suhu tubuh setiap hari',
    opsi_d: 'Membaca ramalan kesehatan online',
    jawaban_benar: 'B'
  },

  // Quiz 2 Questions
  {
    id: 'q-2-1',
    quiz_id: 'quiz-2',
    pertanyaan: 'Manakah cairan tubuh berikut yang TIDAK dapat menularkan HIV?',
    opsi_a: 'Darah',
    opsi_b: 'Air Susu Ibu (ASI)',
    opsi_c: 'Cairan Vagina / Air Mani',
    opsi_d: 'Keringat & Air Mata',
    jawaban_benar: 'D'
  },
  {
    id: 'q-2-2',
    quiz_id: 'quiz-2',
    pertanyaan: 'Hubungan bersalaman, berpelukan, atau berbicara dengan ODHIV dapat menularkan virus.',
    opsi_a: 'Benar, virus berpindah lewat udara.',
    opsi_b: 'Salah, aktivitas tersebut tidak melibatkan pertukaran cairan tubuh yang mengandung virus.',
    opsi_c: 'Benar, jika penderita sedang berkeringat deras.',
    opsi_d: 'Benar, jika dilakukan lebih dari 15 menit.',
    jawaban_benar: 'B'
  },
  {
    id: 'q-2-3',
    quiz_id: 'quiz-2',
    pertanyaan: 'Bagaimana penularan HIV melalui jarum suntik bisa terjadi?',
    opsi_a: 'Bila jarum suntik digunakan secara steril oleh dokter.',
    opsi_b: 'Bila jarum suntik dipakai bergantian oleh beberapa orang, misalnya dalam penyalahgunaan narkoba.',
    opsi_c: 'Bila jarum suntik terbuat dari bahan besi berkualitas rendah.',
    opsi_d: 'Bila jarum suntik disentuh di bagian plastiknya.',
    jawaban_benar: 'B'
  },
  {
    id: 'q-2-4',
    quiz_id: 'quiz-2',
    pertanyaan: 'Apakah gigitan nyamuk dapat menularkan virus HIV dari ODHIV ke orang sehat?',
    opsi_a: 'Ya, nyamuk menghisap darah penderita lalu menyuntikkannya kembali.',
    opsi_b: 'Tidak, virus HIV langsung mati di dalam tubuh nyamuk dan nyamuk tidak menyuntikkan darah orang sebelumnya.',
    opsi_c: 'Ya, jika nyamuk berjenis Aedes aegypti.',
    opsi_d: 'Ya, jika digigit di malam hari.',
    jawaban_benar: 'B'
  },
  {
    id: 'q-2-5',
    quiz_id: 'quiz-2',
    pertanyaan: 'Mengapa pemakaian jarum tindik atau tato secara bergantian berisiko menularkan HIV?',
    opsi_a: 'Karena jarum tersebut menyentuh lapisan kulit luar.',
    opsi_b: 'Karena alat tersebut bisa terkontaminasi partikel darah dari orang yang terinfeksi sebelumnya.',
    opsi_c: 'Karena tinta tato mengandung zat asam tinggi yang disukai virus.',
    opsi_d: 'Karena rasa sakit saat proses melukai sel pertahanan kulit.',
    jawaban_benar: 'B'
  }
];

const MOCK_GAMES: Game[] = [
  { id: 'game-1', nama: 'Benar atau Salah', tipe: 'benar_salah', deskripsi: 'Geser atau tekan tombol untuk menilai kebenaran pernyataan seputar kesehatan seksual dan HIV.', xp_reward: 80, points_reward: 40 },
  { id: 'game-2', nama: 'Memory Card', tipe: 'memory', deskripsi: 'Buka kartu dan cari pasangan kata medis yang berkaitan (contoh: ART dengan Pengobatan).', xp_reward: 90, points_reward: 45 },
  { id: 'game-3', nama: 'Drag and Drop', tipe: 'drag_drop', deskripsi: 'Tarik kata kunci kesehatan ke kolom kategori yang tepat (Pencegahan, Penularan, atau Aman).', xp_reward: 100, points_reward: 50 },
  { id: 'game-4', nama: 'Tebak Gambar', tipe: 'tebak_gambar', deskripsi: 'Amati gambar medis/kesehatan yang ditampilkan, dan jawab nama benda tersebut dengan cepat.', xp_reward: 80, points_reward: 40 },
  { id: 'game-5', nama: 'Puzzle Edukasi', tipe: 'puzzle', deskripsi: 'Susun kepingan gambar maskot kesehatan PENDEKAREMAJA untuk menampilkan pesan kesehatan rahasia.', xp_reward: 120, points_reward: 60 }
];

const MOCK_GAME_QUESTIONS: GameQuestion[] = [
  {
    id: 'gq-1',
    game_id: 'game-1',
    data: [
      { id: 'bs-1', statement: 'HIV dapat menular melalui berbagi sendok makan dengan penderita.', answer: false, explanation: 'Salah! HIV tidak menular melalui air liur atau peralatan makan bersama.' },
      { id: 'bs-2', statement: 'Menggunakan kondom dapat mencegah penularan HIV saat berhubungan seksual.', answer: true, explanation: 'Benar! Kondom bertindak sebagai penghalang fisik masuknya cairan tubuh.' },
      { id: 'bs-3', statement: 'ODHIV (Orang dengan HIV) yang rutin minum obat ART memiliki kualitas hidup yang sama baiknya dengan orang sehat.', answer: true, explanation: 'Benar! Terapi antiretroviral menjaga kekebalan tubuh penderita tetap stabil.' },
      { id: 'bs-4', statement: 'AIDS adalah nama virus sedangkan HIV adalah penyakitnya.', answer: false, explanation: 'Salah! Terbalik. HIV adalah nama virusnya, sedangkan AIDS adalah kumpulan gejala penyakit (fase lanjut).' },
      { id: 'bs-5', statement: 'Saling berpelukan di sekolah aman dari penularan HIV.', answer: true, explanation: 'Benar! Kontak fisik kulit yang sehat tidak menyebarkan virus HIV.' }
    ],
    levels: [
      { level: 1, data: [
        { id: 'bs-l1-1', statement: 'HIV dapat menular melalui berbagi sendok makan dengan penderita.', answer: false, explanation: 'Salah! HIV tidak menular lewat alat makan bersama atau air liur.' },
        { id: 'bs-l1-2', statement: 'Kondom membantu mengurangi risiko penularan HIV saat berhubungan seksual.', answer: true, explanation: 'Benar! Kondom memberi penghalang fisik yang efektif.' },
        { id: 'bs-l1-3', statement: 'ODHIV yang rutin minum ART bisa tetap sehat dan produktif.', answer: true, explanation: 'Benar! Pengobatan antiretroviral membantu menjaga kekebalan tubuh.' },
        { id: 'bs-l1-4', statement: 'AIDS adalah nama virus HIV.', answer: false, explanation: 'Salah! HIV adalah virus, sedangkan AIDS adalah kondisi lanjut akibat infeksi.' }
      ] },
      { level: 2, data: [
        { id: 'bs-l2-1', statement: 'Tes HIV sebaiknya dilakukan sejak dini bila ada risiko paparan.', answer: true, explanation: 'Benar! Deteksi dini membantu penanganan lebih cepat.' },
        { id: 'bs-l2-2', statement: 'Diskriminasi terhadap ODHIV dapat memperburuk kesehatan mental mereka.', answer: true, explanation: 'Benar! Dukungan sosial penting untuk kesejahteraan ODHIV.' },
        { id: 'bs-l2-3', statement: 'Berbagi jarum suntik dapat menularkan HIV.', answer: true, explanation: 'Benar! Darah yang tercemar bisa membawa virus.' },
        { id: 'bs-l2-4', statement: 'HIV bisa menular lewat berjabat tangan.', answer: false, explanation: 'Salah! HIV tidak menular lewat sentuhan kulit biasa.' }
      ] },
      { level: 3, data: [
        { id: 'bs-l3-1', statement: 'Ibu hamil yang terinfeksi HIV bisa menularkan virus ke bayi tanpa pengobatan.', answer: true, explanation: 'Benar! Pencegahan sejak kehamilan sangat penting.' },
        { id: 'bs-l3-2', statement: 'HIV bisa dicegah dengan edukasi dan pengobatan yang tepat.', answer: true, explanation: 'Benar! Edukasi dan ART membantu menekan penularan.' },
        { id: 'bs-l3-3', statement: 'HIV bisa menular lewat udara.', answer: false, explanation: 'Salah! HIV tidak menyebar lewat udara atau percikan.' },
        { id: 'bs-l3-4', statement: 'Mencuci tangan dengan sabun dapat mencegah penularan HIV.', answer: true, explanation: 'Benar! Kebersihan yang baik membantu mencegah penyakit lain, namun HIV utamanya menular lewat cairan tubuh.' }
      ] }
    ]
  },
  {
    id: 'gq-2',
    game_id: 'game-2',
    data: {
      pairs: [
        { text: 'HIV', match: 'Virus' },
        { text: 'ART', match: 'Pengobatan' },
        { text: 'Kondom', match: 'Pencegahan' },
        { text: 'VCT', match: 'Konsultasi & Tes' }
      ]
    },
    levels: [
      { level: 1, data: { pairs: [
        { text: 'HIV', match: 'Virus' },
        { text: 'ART', match: 'Pengobatan' },
        { text: 'Kondom', match: 'Pencegahan' },
        { text: 'VCT', match: 'Konsultasi & Tes' }
      ] } },
      { level: 2, data: { pairs: [
        { text: 'CD4', match: 'Sel kekebalan' },
        { text: 'PrEP', match: 'Pencegahan sebelum paparan' },
        { text: 'Stigma', match: 'Diskriminasi' },
        { text: 'Tes HIV', match: 'Deteksi dini' }
      ] } },
      { level: 3, data: { pairs: [
        { text: 'Viral Load', match: 'Jumlah virus' },
        { text: 'TBC', match: 'Penyakit oportunistik' },
        { text: 'ODHIV', match: 'Orang dengan HIV' },
        { text: 'Konseling', match: 'Pendampingan' }
      ] } }
    ]
  },
  {
    id: 'gq-3',
    game_id: 'game-3',
    data: {
      items: [
        { text: 'Jarum Steril', correctCategory: 'Pencegahan' },
        { text: 'Berpelukan', correctCategory: 'Aman' },
        { text: 'Berjabat tangan', correctCategory: 'Aman' },
        { text: 'Jarum Suntik Bergantian', correctCategory: 'Penularan' },
        { text: 'Transfusi Darah Tercemar', correctCategory: 'Penularan' },
        { text: 'Setia Pada Pasangan', correctCategory: 'Pencegahan' }
      ],
      categories: ['Pencegahan', 'Penularan', 'Aman']
    },
    levels: [
      { level: 1, data: { items: [
        { text: 'Jarum Steril', correctCategory: 'Pencegahan' },
        { text: 'Berpelukan', correctCategory: 'Aman' },
        { text: 'Berjabat tangan', correctCategory: 'Aman' },
        { text: 'Jarum Suntik Bergantian', correctCategory: 'Penularan' },
        { text: 'Transfusi Darah Tercemar', correctCategory: 'Penularan' },
        { text: 'Setia Pada Pasangan', correctCategory: 'Pencegahan' }
      ], categories: ['Pencegahan', 'Penularan', 'Aman'] } },
      { level: 2, data: { items: [
        { text: 'Pakai Kondom', correctCategory: 'Pencegahan' },
        { text: 'Berbagi Alat Tato', correctCategory: 'Penularan' },
        { text: 'Ciuman Pipi', correctCategory: 'Aman' },
        { text: 'Tes HIV Rutin', correctCategory: 'Pencegahan' },
        { text: 'Seks Bebas Risiko', correctCategory: 'Penularan' },
        { text: 'Dukungan Emosional', correctCategory: 'Aman' }
      ], categories: ['Pencegahan', 'Penularan', 'Aman'] } },
      { level: 3, data: { items: [
        { text: 'Minum ART Teratur', correctCategory: 'Pencegahan' },
        { text: 'Air Susu Ibu', correctCategory: 'Penularan' },
        { text: 'Mengunjungi Puskesmas', correctCategory: 'Aman' },
        { text: 'Menjaga Privasi Tes', correctCategory: 'Aman' },
        { text: 'Berbagi Jarum Tindik', correctCategory: 'Penularan' },
        { text: 'Pemeriksaan VCT', correctCategory: 'Pencegahan' }
      ], categories: ['Pencegahan', 'Penularan', 'Aman'] } }
    ]
  },
  {
    id: 'gq-4',
    game_id: 'game-4',
    data: [
      {
        id: 'tg-1',
        imageUrl: 'https://images.unsplash.com/photo-1579684389782-64d84b5e901a?auto=format&fit=crop&q=80&w=400',
        question: 'Apakah nama simbol pita merah yang sering melambangkan kepedulian HIV/AIDS ini?',
        options: ['Pita Merah (Red Ribbon)', 'Pita Kuning', 'Pita Kesehatan', 'Pita Persaudaraan'],
        answer: 'Pita Merah (Red Ribbon)'
      },
      {
        id: 'tg-2',
        imageUrl: 'https://images.unsplash.com/photo-1584036561566-baf8f5f1b144?auto=format&fit=crop&q=80&w=400',
        question: 'Metode tes laboratorium terpercaya ini dilakukan untuk mendeteksi antibodi HIV dalam tubuh. Apa namanya?',
        options: ['Tes Golongan Darah', 'Tes VCT / Antibodi HIV', 'Tes Urin Lengkap', 'Rontgen Dada'],
        answer: 'Tes VCT / Antibodi HIV'
      }
    ],
    levels: [
      { level: 1, data: [
        { id: 'tg-l1-1', imageUrl: 'https://images.unsplash.com/photo-1579684389782-64d84b5e901a?auto=format&fit=crop&q=80&w=400', question: 'Apa nama simbol pita merah yang sering dipakai sebagai simbol dukungan HIV/AIDS?', options: ['Pita Merah (Red Ribbon)', 'Pita Kuning', 'Pita Kesehatan', 'Pita Persaudaraan'], answer: 'Pita Merah (Red Ribbon)' },
        { id: 'tg-l1-2', imageUrl: 'https://images.unsplash.com/photo-1584036561566-baf8f5f1b144?auto=format&fit=crop&q=80&w=400', question: 'Tes yang paling tepat untuk mendeteksi HIV adalah...', options: ['Tes VCT / Antibodi HIV', 'Tes Urin', 'Tes Mata', 'Tes Gula Darah'], answer: 'Tes VCT / Antibodi HIV' }
      ] },
      { level: 2, data: [
        { id: 'tg-l2-1', imageUrl: 'https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&q=80&w=400', question: 'Apa yang biasanya dilakukan saat seseorang ingin mengetahui status HIV-nya?', options: ['Konsultasi dan Tes HIV', 'Membuang obat', 'Minum vitamin', 'Tidur lebih lama'], answer: 'Konsultasi dan Tes HIV' },
        { id: 'tg-l2-2', imageUrl: 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&q=80&w=400', question: 'Apa peran ART pada pengobatan HIV?', options: ['Menghambat perkembangan virus', 'Membuat virus lebih cepat', 'Menghilangkan semua gejala', 'Menulari orang lain'], answer: 'Menghambat perkembangan virus' }
      ] },
      { level: 3, data: [
        { id: 'tg-l3-1', imageUrl: 'https://images.unsplash.com/photo-1584515933487-779824d29309?auto=format&fit=crop&q=80&w=400', question: 'Apa yang dimaksud dengan ODHIV?', options: ['Orang Dengan HIV', 'Organisasi Dokter HIV', 'Obat Diperlukan HIV', 'Orang Di Rumah Sakit'], answer: 'Orang Dengan HIV' },
        { id: 'tg-l3-2', imageUrl: 'https://images.unsplash.com/photo-1527613426441-4da17471b66d?auto=format&fit=crop&q=80&w=400', question: 'Apa manfaat tes HIV dini?', options: ['Penanganan cepat', 'Membuat HIV lebih parah', 'Menghilangkan kebutuhan ART', 'Mengurangi kebersihan'], answer: 'Penanganan cepat' }
      ] }
    ]
  },
  {
    id: 'gq-5',
    game_id: 'game-5',
    data: {
      imageUrl: 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&q=80&w=400',
      fact: 'Ingat! HIV membutuhkan waktu 5-10 tahun untuk berkembang menjadi AIDS jika tanpa pengobatan. Pengobatan dini menggunakan ART membantu ODHIV hidup sehat dan normal.'
    },
    levels: [
      { level: 1, data: { imageUrl: 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&q=80&w=400', fact: 'Pencegahan dini dan edukasi membantu menahan penularan HIV.' } },
      { level: 2, data: { imageUrl: 'https://images.unsplash.com/photo-1584036561566-baf8f5f1b144?auto=format&fit=crop&q=80&w=400', fact: 'ART membantu menjaga sistem imun tetap kuat dan mengurangi risiko komplikasi.' } },
      { level: 3, data: { imageUrl: 'https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&q=80&w=400', fact: 'Dukungan sosial dan tes rutin membantu ODHIV menjalani hidup lebih sehat.' } }
    ]
  }
];

const MOCK_MISSIONS: DailyMission[] = [
  { id: 'misi-1', deskripsi: 'Baca 1 materi edukasi hari ini', tipe: 'baca_materi', target_count: 1, points_reward: 10 },
  { id: 'misi-2', deskripsi: 'Kerjakan 5 soal quiz pelajaran', tipe: 'kerjakan_quiz', target_count: 5, points_reward: 15 },
  { id: 'misi-3', deskripsi: 'Mainkan 1 game edukasi interaktif', tipe: 'main_game', target_count: 1, points_reward: 15 },
  { id: 'misi-4', deskripsi: 'Login ke dashboard PENDEKAREMAJA', tipe: 'login', target_count: 1, points_reward: 5 }
];

const MOCK_BADGES: Badge[] = [
  { id: 'badge-1', nama: 'Pemula Cerdas', deskripsi: 'Selesaikan membaca minimal 2 materi pembelajaran.', icon: 'stars', syarat_tipe: 'materi_count', syarat_value: 2 },
  { id: 'badge-2', nama: 'Penjelajah HIV', deskripsi: 'Selesaikan membaca semua materi edukasi di aplikasi.', icon: 'verified_user', syarat_tipe: 'materi_count', syarat_value: 3 },
  { id: 'badge-3', nama: 'Quiz Master', deskripsi: 'Kerjakan kuis dengan skor 100% sempurna.', icon: 'workspace_premium', syarat_tipe: 'quiz_perfect_score', syarat_value: 1 },
  { id: 'badge-4', nama: 'Ksatria Game', deskripsi: 'Mainkan minimal 3 jenis game edukasi yang seru.', icon: 'sports_esports', syarat_tipe: 'game_count', syarat_value: 3 }
];

const MOCK_HEALTH_SERVICES: HealthService[] = [
  { id: 'serv-1', nama: 'Puskesmas Kecamatan Tebet', tipe: 'puskesmas', alamat: 'Jl. Tebet Timur Dalam No.2, Jakarta Selatan', telepon: '(021) 8295627', jam_layanan: 'Senin - Jumat: 08:00 - 15:00 (Melayani Konseling VCT Gratis)', koordinat_lokasi: '-6.2295,106.8485' },
  { id: 'serv-2', nama: 'Puskesmas Kecamatan Menteng', tipe: 'puskesmas', alamat: 'Jl. Pegangsaan Barat No.14, Menteng, Jakarta Pusat', telepon: '(021) 3192323', jam_layanan: 'Setiap Hari: 24 Jam (Layanan VCT jam kerja)', koordinat_lokasi: '-6.2023,106.8329' },
  { id: 'serv-3', nama: 'Layanan Hotline Kemenkes RI', tipe: 'hotline', alamat: 'Kementerian Kesehatan Republik Indonesia', telepon: '1500-567', jam_layanan: 'Layanan Darurat Konseling 24 Jam Bebas Pulsa', koordinat_lokasi: '' },
  { id: 'serv-4', nama: 'KPA (Komisi Penanggulangan AIDS) Nasional', tipe: 'hotline', alamat: 'Jakarta', telepon: '(021) 3906323', jam_layanan: 'Jam kerja 09:00 - 17:00', koordinat_lokasi: '' }
];

const MOCK_CONSULTATIONS: Consultation[] = [
  { id: 'c-1', user_id: 'user-id-1', user_name: 'Andi', pertanyaan: 'Apakah tes HIV di puskesmas sifatnya rahasia? Saya takut diketahui orang tua.', jawaban: 'Halo Andi. Seluruh tes HIV di Puskesmas (layanan VCT) dijamin kerahasiaannya oleh hukum dan kode etik kedokteran. Hasil pemeriksaan hanya akan diberitahukan kepadamu langsung secara privat. Jadi kamu tidak perlu takut ya. Lindungi dirimu sejak dini!', status: 'answered', ditanyakan_at: '2026-07-08T10:00:00Z', dijawab_at: '2026-07-08T12:00:00Z', admin_id: 'admin-1' },
  { id: 'c-2', user_id: 'user-id-1', user_name: 'Andi', pertanyaan: 'Berapa hari setelah berisiko saya baru bisa melakukan tes HIV agar hasilnya akurat?', status: 'pending', ditanyakan_at: '2026-07-09T08:00:00Z' }
];

// Helper to init mock DB
export function initMockDb() {
  if (!localStorage.getItem('pendekar_initialized')) {
    // Basic tables
    localStorage.setItem('pendekar_categories', JSON.stringify(MOCK_CATEGORIES));
    localStorage.setItem('pendekar_materials', JSON.stringify(MOCK_MATERIALS));
    localStorage.setItem('pendekar_quizzes', JSON.stringify(MOCK_QUIZZES));
    localStorage.setItem('pendekar_questions', JSON.stringify(MOCK_QUESTIONS));
    localStorage.setItem('pendekar_games', JSON.stringify(MOCK_GAMES));
    localStorage.setItem('pendekar_game_questions', JSON.stringify(MOCK_GAME_QUESTIONS));
    localStorage.setItem('pendekar_missions', JSON.stringify(MOCK_MISSIONS));
    localStorage.setItem('pendekar_badges', JSON.stringify(MOCK_BADGES));
    localStorage.setItem('pendekar_health_services', JSON.stringify(MOCK_HEALTH_SERVICES));
    localStorage.setItem('pendekar_consultations', JSON.stringify(MOCK_CONSULTATIONS));

    // User data seeds
    const defaultProfile: Profile = {
      id: 'user-id-1',
      name: 'Andi',
      age: 16,
      gender: 'Laki-laki',
      points: 1250,
      xp: 650,
      level: 4,
      streak: 7,
      last_active_date: new Date().toISOString().split('T')[0],
      role: 'user',
      avatar_url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=150',
      created_at: new Date().toISOString()
    };
    localStorage.setItem('pendekar_current_user', JSON.stringify(defaultProfile));
    
    // Seed and link users
    const defaultUsers = [
      defaultProfile,
      { id: 'user-id-2', name: 'Dinda Putri', age: 17, gender: 'Perempuan', points: 1850, xp: 950, level: 5, streak: 12, last_active_date: '2026-07-09', role: 'user', avatar_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=150', created_at: '2026-07-01' },
      { id: 'user-id-3', name: 'Bima Pratama', age: 16, gender: 'Laki-laki', points: 1620, xp: 820, level: 4, streak: 5, last_active_date: '2026-07-08', role: 'user', avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=150', created_at: '2026-07-02' },
      { id: 'user-id-4', name: 'Siti Aisyah', age: 15, gender: 'Perempuan', points: 1450, xp: 750, level: 3, streak: 8, last_active_date: '2026-07-09', role: 'user', avatar_url: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&q=80&w=150', created_at: '2026-07-03' },
      { id: 'admin-id-1', name: 'Falah (Admin)', age: 24, gender: 'Laki-laki', points: 0, xp: 0, level: 99, streak: 0, last_active_date: '2026-07-09', role: 'admin', avatar_url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=150', created_at: '2026-07-01' }
    ];
    localStorage.setItem('pendekar_users', JSON.stringify(defaultUsers));

    // Seeds for progress records
    localStorage.setItem('pendekar_progress_materi', JSON.stringify([
      { id: 'pm-1', user_id: 'user-id-1', materi_id: 'mat-1', completed: true, completed_at: new Date().toISOString() }
    ]));
    localStorage.setItem('pendekar_hasil_quiz', JSON.stringify([
      { id: 'hq-1', user_id: 'user-id-1', quiz_id: 'quiz-1', skor: 80, xp_earned: 80, points_earned: 40, completed_at: new Date().toISOString() }
    ]));
    localStorage.setItem('pendekar_hasil_game', JSON.stringify([
      { id: 'hg-1', user_id: 'user-id-1', game_id: 'game-1', skor: 100, xp_earned: 80, points_earned: 40, completed_at: new Date().toISOString() }
    ]));

    // Mission status seeds
    const today = new Date().toISOString().split('T')[0];
    localStorage.setItem('pendekar_progress_misi', JSON.stringify([
      { id: 'mprog-1', user_id: 'user-id-1', misi_id: 'misi-1', current_count: 1, completed: true, tanggal: today },
      { id: 'mprog-2', user_id: 'user-id-1', misi_id: 'misi-2', current_count: 3, completed: false, tanggal: today },
      { id: 'mprog-3', user_id: 'user-id-1', misi_id: 'misi-3', current_count: 0, completed: false, tanggal: today },
      { id: 'mprog-4', user_id: 'user-id-1', misi_id: 'misi-4', current_count: 1, completed: true, tanggal: today }
    ]));

    // Unlocked badges seeds
    localStorage.setItem('pendekar_user_badges', JSON.stringify([
      { id: 'ub-1', user_id: 'user-id-1', badge_id: 'badge-1', unlocked_at: new Date().toISOString() }
    ]));

    // Audit logs
    localStorage.setItem('pendekar_activities', JSON.stringify([
      { id: 'act-1', user_id: 'user-id-1', tipe_aktivitas: 'Membaca Materi', detail: 'Menyelesaikan materi Pengenalan Dasar HIV', created_at: new Date().toISOString() }
    ]));

    localStorage.setItem('pendekar_initialized', 'true');
  }
}

initMockDb();

// Generic helper to get localStorage items
const getLocal = (key: string) => JSON.parse(localStorage.getItem(key) || '[]');
const setLocal = (key: string, data: any) => localStorage.setItem(key, JSON.stringify(data));

const notifyProfileChanged = () => {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('pendekar-profile-updated'));
  }
};

const getLeaderboardScore = (profile: Profile, activityCount = 0): number => {
  const points = Number(profile.points) || 0;
  const xp = Number(profile.xp) || 0;
  const streak = Number(profile.streak) || 0;
  const level = Number(profile.level) || 0;
  return points * 1000 + xp * 2 + streak * 150 + level * 300 + activityCount * 25;
};

const getLeaderboardReward = (rank: number): number => {
  if (rank === 1) return 100;
  if (rank === 2) return 70;
  if (rank === 3) return 50;
  if (rank <= 10) return 20;
  return 0;
};

// ==========================================
// 3. API SERVICE IMPLEMENTATION
// ==========================================

export const api = {
  // ----------------------------------------
  // AUTHENTICATION
  // ----------------------------------------
  // STREAK HELPER — dipanggil saat login & getCurrentProfile
  // ----------------------------------------
  async updateStreak(userId: string): Promise<number> {
    const today = new Date().toISOString().split('T')[0];

    if (isSupabaseConfigured) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('streak, last_active_date')
        .eq('id', userId)
        .single();

      if (!profile) return 1;

      const lastActive = profile.last_active_date;
      if (lastActive === today) return profile.streak; // sudah login hari ini

      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];

      const newStreak = lastActive === yesterdayStr ? profile.streak + 1 : 1;

      await supabase
        .from('profiles')
        .update({ streak: newStreak, last_active_date: today })
        .eq('id', userId);

      return newStreak;
    } else {
      const users = getLocal('pendekar_users') as Profile[];
      const idx = users.findIndex(u => u.id === userId);
      if (idx === -1) return 1;

      const lastActive = users[idx].last_active_date;
      if (lastActive === today) return users[idx].streak;

      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];

      const newStreak = lastActive === yesterdayStr ? users[idx].streak + 1 : 1;
      users[idx] = { ...users[idx], streak: newStreak, last_active_date: today };
      setLocal('pendekar_users', users);

      const cur = localStorage.getItem('pendekar_current_user');
      if (cur && JSON.parse(cur).id === userId) {
        setLocal('pendekar_current_user', users[idx]);
        notifyProfileChanged();
      }
      return newStreak;
    }
  },

  // ----------------------------------------
  async login(email: string, password?: string): Promise<Profile> {
    if (!password || password.trim() === '') {
      throw new Error('Kata sandi wajib diisi untuk login.');
    }

    if (isSupabaseConfigured) {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;

      const userId = data?.user?.id;
      if (!userId) throw new Error('Login gagal. Pastikan email dan kata sandi benar.');

      const { data: profile, error: profileErr } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (profileErr) throw profileErr;
      if (!profile) {
        const name = email.split('@')[0];
        const newProfile = {
          id: userId,
          name,
          age: 16,
          gender: 'Laki-laki',
          points: 0,
          xp: 0,
          level: 1,
          streak: 1,
          role: 'user',
          last_active_date: new Date().toISOString().split('T')[0],
          avatar_url: '',
          created_at: new Date().toISOString()
        };

        const { data: insertedProfile, error: creationError } = await supabase
          .from('profiles')
          .insert(newProfile)
          .select('*')
          .single();
        if (creationError) throw creationError;
        return insertedProfile as Profile;
      }

      // Update streak saat login
      await this.updateStreak(userId);
      await this.trackMissionProgressForUser(userId, 'login', 1);

      // Ambil ulang profil setelah streak diupdate
      const { data: updatedProfile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      return (updatedProfile || profile) as Profile;
    } else {
      // Mock login: match email with a profile name or email
      const users = getLocal('pendekar_users') as Profile[];
      // Simulate finding a user. Admin can log in using email "admin@pendekar.com" or standard user "andi@pendekar.com"
      let user: Profile | undefined;
      if (email.toLowerCase().includes('admin')) {
        user = users.find(u => u.role === 'admin');
      } else {
        user = users.find(u => u.name.toLowerCase() === email.split('@')[0].toLowerCase()) || users.find(u => u.role === 'user');
      }

      if (!user) throw new Error('User tidak ditemukan.');

      // Update streak mock mode
      await this.updateStreak(user.id);

      // Ambil user terbaru setelah streak update
      const updatedUsers = getLocal('pendekar_users') as Profile[];
      const updatedUser = updatedUsers.find(u => u.id === user!.id) || user;
      setLocal('pendekar_current_user', updatedUser);
      notifyProfileChanged();
      
      // Track Daily Mission: Login
      await this.trackMissionProgress('login', 1);
      
      return updatedUser;
    }
  },

  async register(name: string, email: string, password?: string, age?: number, gender?: string): Promise<{ profile: Profile; needsConfirmation: boolean }> {
    if (!password || password.trim() === '') {
      throw new Error('Kata sandi wajib diisi untuk pendaftaran.');
    }

    if (isSupabaseConfigured) {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/login`,
          data: {
            name,
            age,
            gender,
            role: 'user'
          }
        }
      });
      if (error) {
        const message = String(error.message || error);
        if (error.status === 429 || /rate limit/i.test(message)) {
          throw new Error('Batas pengiriman email verifikasi terlampaui. Tunggu beberapa menit lalu coba lagi.');
        }
        throw error;
      }
      if (!data.user) throw new Error('Pendaftaran gagal.');

      const needsConfirmation = !data.session;
      const tempProfile: Profile = {
        id: data.user.id,
        name,
        age: age || 16,
        gender: gender || 'Laki-laki',
        points: 0,
        xp: 0,
        level: 1,
        streak: 1,
        role: 'user',
        last_active_date: new Date().toISOString().split('T')[0],
        avatar_url: '',
        created_at: new Date().toISOString()
      };

      if (!needsConfirmation) {
        const { data: profileRow, error: profileErr } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', data.user.id)
          .maybeSingle();

        if (profileErr) throw profileErr;
        if (profileRow) {
          return { profile: profileRow as Profile, needsConfirmation: false };
        }

        const { data: insertedProfile, error: insertErr } = await supabase
          .from('profiles')
          .insert(tempProfile)
          .select('*')
          .single();
        if (insertErr) throw insertErr;
        return { profile: insertedProfile as Profile, needsConfirmation: false };
      }

      return { profile: tempProfile, needsConfirmation: true };
    } else {
      const users = getLocal('pendekar_users') as Profile[];
      const exists = users.find(u => u.name.toLowerCase() === name.toLowerCase());
      if (exists) throw new Error('Nama pengguna sudah terdaftar.');

      const newProfile: Profile = {
        id: 'user-id-' + (users.length + 1),
        name,
        age: age || 16,
        gender: gender || 'Laki-laki',
        points: 100, // starting bonus
        xp: 0,
        level: 1,
        streak: 1,
        last_active_date: new Date().toISOString().split('T')[0],
        role: 'user',
        avatar_url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=150',
        created_at: new Date().toISOString()
      };

      users.push(newProfile);
      setLocal('pendekar_users', users);
      setLocal('pendekar_current_user', newProfile);
      notifyProfileChanged();

      // Track Login Mission for new user
      await this.trackMissionProgressForUser(newProfile.id, 'login', 1);
      return { profile: newProfile, needsConfirmation: false };
    }
  },

  async logout(): Promise<void> {
    if (isSupabaseConfigured) {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    } else {
      localStorage.removeItem('pendekar_current_user');
      notifyProfileChanged();
    }
  },

  async getCurrentProfile(): Promise<Profile | null> {
    if (isSupabaseConfigured) {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data, error } = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle();
      if (error) return null;
      if (!data) {
        const defaultProfile: Profile = {
          id: user.id,
          name: user.email?.split('@')[0] || 'Pengguna',
          age: 16,
          gender: 'Laki-laki',
          points: 0,
          xp: 0,
          level: 1,
          streak: 1,
          role: 'user',
          last_active_date: new Date().toISOString().split('T')[0],
          avatar_url: '',
          created_at: new Date().toISOString()
        };

        const { data: inserted, error: insertErr } = await supabase
          .from('profiles')
          .insert(defaultProfile)
          .select('*')
          .single();
        if (insertErr) return null;
        return inserted as Profile;
      }

      return {
        ...data,
        role: (data as any).role || 'user'
      } as Profile;
    } else {
      const profile = localStorage.getItem('pendekar_current_user');
      return profile ? JSON.parse(profile) : null;
    }
  },

  async updateProfile(name: string, age: number, gender: string, avatarUrl?: string): Promise<Profile> {
    const cur = await this.getCurrentProfile();
    if (!cur) throw new Error('Unauthorized');

    if (isSupabaseConfigured) {
      const { data, error } = await supabase
        .from('profiles')
        .update({ name, age, gender, avatar_url: avatarUrl })
        .eq('id', cur.id)
        .select()
        .single();
      if (error) throw error;
      return data;
    } else {
      const users = getLocal('pendekar_users') as Profile[];
      const index = users.findIndex(u => u.id === cur.id);
      if (index === -1) throw new Error('User not found');

      const updated = { ...users[index], name, age, gender, avatar_url: avatarUrl };
      users[index] = updated;
      
      setLocal('pendekar_users', users);
      setLocal('pendekar_current_user', updated);
      notifyProfileChanged();
      return updated;
    }
  },

  // ----------------------------------------
  // MATERIALS (MATERI)
  // ----------------------------------------
  async getCategories(): Promise<Category[]> {
    if (isSupabaseConfigured) {
      const { data, error } = await supabase.from('kategori_materi').select('*');
      if (error) throw error;
      return data;
    } else {
      return getLocal('pendekar_categories');
    }
  },

  async getMaterials(): Promise<Material[]> {
    if (isSupabaseConfigured) {
      const { data, error } = await supabase.from('materi').select('*');
      if (error) throw error;
      return data;
    } else {
      return getLocal('pendekar_materials');
    }
  },

  async getMaterialBySlug(slug: string): Promise<Material | null> {
    if (isSupabaseConfigured) {
      const { data, error } = await supabase.from('materi').select('*').eq('slug', slug).single();
      if (error) return null;
      return data;
    } else {
      const mats = getLocal('pendekar_materials') as Material[];
      return mats.find(m => m.slug === slug) || null;
    }
  },

  async isMaterialCompleted(materialId: string): Promise<boolean> {
    const cur = await this.getCurrentProfile();
    if (!cur) return false;

    if (isSupabaseConfigured) {
      const { data, error } = await supabase
        .from('progress_materi')
        .select('completed')
        .eq('user_id', cur.id)
        .eq('materi_id', materialId)
        .maybeSingle();
      if (error) return false;
      return data?.completed || false;
    } else {
      const prog = getLocal('pendekar_progress_materi');
      return prog.some((p: any) => p.user_id === cur.id && p.materi_id === materialId && p.completed);
    }
  },

  async markMaterialAsCompleted(materialId: string): Promise<{ xpGained: number; pointGained: number; leveledUp: boolean }> {
    const cur = await this.getCurrentProfile();
    if (!cur) throw new Error('Unauthorized');

    const materials = await this.getMaterials();
    const material = materials.find(m => m.id === materialId);
    if (!material) throw new Error('Material not found');

    const alreadyCompleted = await this.isMaterialCompleted(materialId);
    if (alreadyCompleted) return { xpGained: 0, pointGained: 0, leveledUp: false };

    const xpGained = material.xp_reward;
    const pointGained = 10; // extra points for completing a lesson

    let leveledUp = false;
    const nextXp = cur.xp + xpGained;
    const nextPoints = cur.points + pointGained;
    let nextLevel = cur.level;
    
    // Level up calculation: 1000 XP per level
    const calculatedLevel = Math.floor(nextXp / 1000) + 1;
    if (calculatedLevel > cur.level) {
      nextLevel = calculatedLevel;
      leveledUp = true;
    }

    if (isSupabaseConfigured) {
      await supabase.from('progress_materi').upsert({
        user_id: cur.id,
        materi_id: materialId,
        completed: true,
        completed_at: new Date().toISOString()
      });

      await supabase.from('profiles').update({
        xp: nextXp,
        points: nextPoints,
        level: nextLevel
      }).eq('id', cur.id);

      await supabase.from('aktivitas').insert({
        user_id: cur.id,
        tipe_aktivitas: 'Membaca Materi',
        detail: `Menyelesaikan materi: ${material.judul}`
      });
    } else {
      // local Storage progress
      const prog = getLocal('pendekar_progress_materi');
      prog.push({
        id: 'pm-' + Date.now(),
        user_id: cur.id,
        materi_id: materialId,
        completed: true,
        completed_at: new Date().toISOString()
      });
      setLocal('pendekar_progress_materi', prog);

      // local Storage profile update
      const users = getLocal('pendekar_users') as Profile[];
      const idx = users.findIndex(u => u.id === cur.id);
      if (idx !== -1) {
        users[idx] = { ...users[idx], xp: nextXp, points: nextPoints, level: nextLevel };
        setLocal('pendekar_users', users);
        setLocal('pendekar_current_user', users[idx]);
      }

      // local Storage activities
      const acts = getLocal('pendekar_activities');
      acts.push({
        id: 'act-' + Date.now(),
        user_id: cur.id,
        tipe_aktivitas: 'Membaca Materi',
        detail: `Menyelesaikan materi: ${material.judul}`,
        created_at: new Date().toISOString()
      });
      setLocal('pendekar_activities', acts);
    }

    notifyProfileChanged();

    // Track Daily Mission progress
    await this.trackMissionProgress('baca_materi', 1);

    // Evaluate badges
    await this.checkAndUnlockBadges(cur.id);

    return { xpGained, pointGained, leveledUp };
  },

  // ----------------------------------------
  // QUIZZES
  // ----------------------------------------
  async getQuizzes(): Promise<Quiz[]> {
    if (isSupabaseConfigured) {
      const { data, error } = await supabase.from('quiz').select('*');
      if (error) throw error;
      return data;
    } else {
      return getLocal('pendekar_quizzes');
    }
  },

  async getQuizQuestions(quizId: string): Promise<QuizQuestion[]> {
    if (isSupabaseConfigured) {
      const { data, error } = await supabase.from('quiz_soal').select('*').eq('quiz_id', quizId);
      if (error) throw error;
      return data;
    } else {
      const qns = getLocal('pendekar_questions') as QuizQuestion[];
      return qns.filter(q => q.quiz_id === quizId);
    }
  },

  async submitQuizResult(quizId: string, score: number): Promise<{ xpEarned: number; pointsEarned: number; leveledUp: boolean }> {
    const cur = await this.getCurrentProfile();
    if (!cur) throw new Error('Unauthorized');

    const quizzes = await this.getQuizzes();
    const quiz = quizzes.find(q => q.id === quizId);
    if (!quiz) throw new Error('Quiz not found');

    const alreadyCompleted = isSupabaseConfigured
      ? (await supabase.from('hasil_quiz').select('id').eq('user_id', cur.id).eq('quiz_id', quizId).maybeSingle()).data
      : (getLocal('pendekar_hasil_quiz') as any[]).some((r: any) => r.user_id === cur.id && r.quiz_id === quizId);

    if (alreadyCompleted) {
      return { xpEarned: 0, pointsEarned: 0, leveledUp: false };
    }

    // Calculate dynamic rewards based on score (e.g. perfect score gets full reward, partial score gets partial)
    const factor = score / 100;
    const xpEarned = Math.round(quiz.xp_reward * factor);
    const pointsEarned = Math.round(quiz.points_reward * factor);

    let leveledUp = false;
    const nextXp = cur.xp + xpEarned;
    const nextPoints = cur.points + pointsEarned;
    let nextLevel = cur.level;

    const calculatedLevel = Math.floor(nextXp / 1000) + 1;
    if (calculatedLevel > cur.level) {
      nextLevel = calculatedLevel;
      leveledUp = true;
    }

    if (isSupabaseConfigured) {
      await supabase.from('hasil_quiz').insert({
        user_id: cur.id,
        quiz_id: quizId,
        skor: score,
        xp_earned: xpEarned,
        points_earned: pointsEarned,
        completed_at: new Date().toISOString()
      });

      await supabase.from('profiles').update({
        xp: nextXp,
        points: nextPoints,
        level: nextLevel
      }).eq('id', cur.id);

      await supabase.from('aktivitas').insert({
        user_id: cur.id,
        tipe_aktivitas: 'Mengerjakan Kuis',
        detail: `Menyelesaikan kuis "${quiz.judul}" dengan skor ${score}%`
      });
    } else {
      const results = getLocal('pendekar_hasil_quiz');
      results.push({
        id: 'hq-' + Date.now(),
        user_id: cur.id,
        quiz_id: quizId,
        skor: score,
        xp_earned: xpEarned,
        points_earned: pointsEarned,
        completed_at: new Date().toISOString()
      });
      setLocal('pendekar_hasil_quiz', results);

      const users = getLocal('pendekar_users') as Profile[];
      const idx = users.findIndex(u => u.id === cur.id);
      if (idx !== -1) {
        users[idx] = { ...users[idx], xp: nextXp, points: nextPoints, level: nextLevel };
        setLocal('pendekar_users', users);
        setLocal('pendekar_current_user', users[idx]);
      }

      const acts = getLocal('pendekar_activities');
      acts.push({
        id: 'act-' + Date.now(),
        user_id: cur.id,
        tipe_aktivitas: 'Mengerjakan Kuis',
        detail: `Menyelesaikan kuis "${quiz.judul}" dengan skor ${score}%`,
        created_at: new Date().toISOString()
      });
      setLocal('pendekar_activities', acts);
    }

    // Track Daily Mission
    // A single quiz contains multiple questions. We increment by the total number of questions answered (assumed 5)
    await this.trackMissionProgress('kerjakan_quiz', 5);

    // Evaluate badges
    await this.checkAndUnlockBadges(cur.id);

    return { xpEarned, pointsEarned, leveledUp };
  },

  async getQuizResults(): Promise<any[]> {
    const cur = await this.getCurrentProfile();
    if (!cur) return [];

    if (isSupabaseConfigured) {
      const { data, error } = await supabase
        .from('hasil_quiz')
        .select('*, quiz(judul)')
        .eq('user_id', cur.id);
      if (error) return [];
      return data;
    } else {
      const results = getLocal('pendekar_hasil_quiz');
      const quizzes = getLocal('pendekar_quizzes') as Quiz[];
      return results
        .filter((r: any) => r.user_id === cur.id)
        .map((r: any) => {
          const quiz = quizzes.find(q => q.id === r.quiz_id);
          return { ...r, quiz: { judul: quiz ? quiz.judul : 'Kuis Keseharan' } };
        });
    }
  },

  // ----------------------------------------
  // GAMES
  // ----------------------------------------
  async getGames(): Promise<Game[]> {
    if (isSupabaseConfigured) {
      const { data, error } = await supabase.from('game').select('*');
      if (error) throw error;
      return data;
    } else {
      return getLocal('pendekar_games');
    }
  },

  async getGameQuestions(gameId: string, level: number = 1): Promise<any> {
    if (isSupabaseConfigured) {
      const { data, error } = await supabase.from('game_soal').select('*').eq('game_id', gameId).maybeSingle();
      if (error || !data) return null;
      const questionEntry = data as GameQuestion;
      return getGameQuestionData(questionEntry, level);
    } else {
      const questions = getLocal('pendekar_game_questions') as GameQuestion[];
      const found = questions.find(q => q.game_id === gameId);
      const fallback = (MOCK_GAME_QUESTIONS.find(q => q.game_id === gameId) || null) as GameQuestion | null;

      if (!found && fallback) {
        const updatedQuestions = [...questions, fallback];
        setLocal('pendekar_game_questions', updatedQuestions);
        return getGameQuestionData(fallback, level);
      }

      if (found && !found.levels?.length && fallback?.levels?.length) {
        const updatedQuestions = questions.map(q => q.game_id === gameId ? fallback : q);
        setLocal('pendekar_game_questions', updatedQuestions);
        return getGameQuestionData(fallback, level);
      }

      return found ? getGameQuestionData(found, level) : null;
    }
  },

  async getGameProgress(gameId: string): Promise<GameProgress> {
    const cur = await this.getCurrentProfile();
    if (!cur) {
      return {
        id: `gp-${gameId}`,
        user_id: '',
        game_id: gameId,
        current_level: 1,
        completed_levels: 0,
        max_level: 3,
        completed: false,
        updated_at: new Date().toISOString()
      };
    }

    if (isSupabaseConfigured) {
      const { data, error } = await supabase
        .from('game_progress')
        .select('*')
        .eq('user_id', cur.id)
        .eq('game_id', gameId)
        .maybeSingle();

      if (error || !data) {
        // Return default — will be created on first submitGameResult
        return {
          id: `gp-${gameId}`,
          user_id: cur.id,
          game_id: gameId,
          current_level: 1,
          completed_levels: 0,
          max_level: 3,
          completed: false,
          updated_at: new Date().toISOString()
        };
      }
      return data as GameProgress;
    }

    const progress = getLocal('pendekar_game_progress') as GameProgress[];
    const existing = progress.find(p => p.user_id === cur.id && p.game_id === gameId);

    if (existing) return existing;

    const record: GameProgress = {
      id: 'gp-' + Date.now(),
      user_id: cur.id,
      game_id: gameId,
      current_level: 1,
      completed_levels: 0,
      max_level: 3,
      completed: false,
      updated_at: new Date().toISOString()
    };

    progress.push(record);
    setLocal('pendekar_game_progress', progress);
    return record;
  },

  async submitGameResult(gameId: string, score: number, level?: number): Promise<{ xpEarned: number; pointsEarned: number; leveledUp: boolean; nextLevel: number; completed: boolean; message: string }> {
    const cur = await this.getCurrentProfile();
    if (!cur) throw new Error('Unauthorized');

    const games = await this.getGames();
    const game = games.find(g => g.id === gameId);
    if (!game) throw new Error('Game not found');

    const progress = await this.getGameProgress(gameId);
    const targetLevel = level || progress.current_level;
    const alreadyCompleted = progress.completed_levels >= targetLevel;

    if (alreadyCompleted) {
      return {
        xpEarned: 0,
        pointsEarned: 0,
        leveledUp: false,
        nextLevel: progress.current_level,
        completed: progress.completed,
        message: 'Level ini sudah selesai. Kamu bisa mengulang untuk latihan.'
      };
    }

    const levelMultiplier = 1 + (targetLevel - 1) * 0.15;
    const xpEarned = Math.round(game.xp_reward * levelMultiplier);
    const pointsEarned = Math.round(game.points_reward * levelMultiplier);

    let leveledUp = false;
    const nextXp = cur.xp + xpEarned;
    const nextPoints = cur.points + pointsEarned;
    let nextLevel = cur.level;

    const calculatedLevel = Math.floor(nextXp / 1000) + 1;
    if (calculatedLevel > cur.level) {
      nextLevel = calculatedLevel;
      leveledUp = true;
    }

    if (isSupabaseConfigured) {
      await supabase.from('hasil_game').insert({
        user_id: cur.id,
        game_id: gameId,
        skor: score,
        level: targetLevel,
        xp_earned: xpEarned,
        points_earned: pointsEarned,
        completed_at: new Date().toISOString()
      });

      await supabase.from('profiles').update({
        xp: nextXp,
        points: nextPoints,
        level: nextLevel
      }).eq('id', cur.id);

      await supabase.from('aktivitas').insert({
        user_id: cur.id,
        tipe_aktivitas: 'Bermain Game',
        detail: `Menyelesaikan game "${game.nama}" level ${targetLevel} dengan skor ${score}`
      });

      // Update game_progress in Supabase
      const nextCompletedLevels = Math.max(progress.completed_levels, targetLevel);
      const nextCurrentLevel = nextCompletedLevels >= progress.max_level ? progress.max_level : nextCompletedLevels + 1;
      const completed = nextCompletedLevels >= progress.max_level;

      await supabase.from('game_progress').upsert({
        user_id: cur.id,
        game_id: gameId,
        current_level: nextCurrentLevel,
        completed_levels: nextCompletedLevels,
        max_level: progress.max_level,
        completed,
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id,game_id' });
    } else {
      const results = getLocal('pendekar_hasil_game');
      results.push({
        id: 'hg-' + Date.now(),
        user_id: cur.id,
        game_id: gameId,
        skor: score,
        level: targetLevel,
        xp_earned: xpEarned,
        points_earned: pointsEarned,
        completed_at: new Date().toISOString()
      });
      setLocal('pendekar_hasil_game', results);

      const users = getLocal('pendekar_users') as Profile[];
      const idx = users.findIndex(u => u.id === cur.id);
      if (idx !== -1) {
        users[idx] = { ...users[idx], xp: nextXp, points: nextPoints, level: nextLevel };
        setLocal('pendekar_users', users);
        setLocal('pendekar_current_user', users[idx]);
      }

      const acts = getLocal('pendekar_activities');
      acts.push({
        id: 'act-' + Date.now(),
        user_id: cur.id,
        tipe_aktivitas: 'Bermain Game',
        detail: `Menyelesaikan game "${game.nama}" level ${targetLevel} dengan skor ${score}`,
        created_at: new Date().toISOString()
      });
      setLocal('pendekar_activities', acts);

      const progressEntries = getLocal('pendekar_game_progress') as GameProgress[];
      const pIdx = progressEntries.findIndex(p => p.user_id === cur.id && p.game_id === gameId);
      const nextCompletedLevels = Math.max(progress.completed_levels, targetLevel);
      const nextCurrentLevel = nextCompletedLevels >= progress.max_level ? progress.max_level : nextCompletedLevels + 1;
      const completed = nextCompletedLevels >= progress.max_level;

      if (pIdx !== -1) {
        progressEntries[pIdx] = {
          ...progressEntries[pIdx],
          current_level: nextCurrentLevel,
          completed_levels: nextCompletedLevels,
          completed,
          updated_at: new Date().toISOString()
        };
      } else {
        progressEntries.push({
          id: 'gp-' + Date.now(),
          user_id: cur.id,
          game_id: gameId,
          current_level: nextCurrentLevel,
          completed_levels: nextCompletedLevels,
          max_level: progress.max_level,
          completed,
          updated_at: new Date().toISOString()
        });
      }
      setLocal('pendekar_game_progress', progressEntries);
    }

    notifyProfileChanged();

    // Track Daily Mission
    await this.trackMissionProgress('main_game', 1);

    // Evaluate badges
    await this.checkAndUnlockBadges(cur.id);

    const finalNextCompletedLevels = Math.max(progress.completed_levels, targetLevel);
    const isAllCompleted = finalNextCompletedLevels >= progress.max_level;

    return {
      xpEarned,
      pointsEarned,
      leveledUp,
      nextLevel: targetLevel + 1,
      completed: isAllCompleted,
      message: isAllCompleted ? 'Semua level game selesai! Keren!' : `Level ${targetLevel} selesai. Level berikutnya sudah terbuka.`
    };
  },

  async getGameResults(): Promise<any[]> {
    const cur = await this.getCurrentProfile();
    if (!cur) return [];

    if (isSupabaseConfigured) {
      const { data, error } = await supabase
        .from('hasil_game')
        .select('*, game(nama, tipe)')
        .eq('user_id', cur.id);
      if (error) return [];
      return data;
    } else {
      const results = getLocal('pendekar_hasil_game');
      const games = getLocal('pendekar_games') as Game[];
      return results
        .filter((r: any) => r.user_id === cur.id)
        .map((r: any) => {
          const game = games.find(g => g.id === r.game_id);
          return { ...r, game: { nama: game ? game.nama : 'Game Edukasi', tipe: game ? game.tipe : 'benar_salah' } };
        });
    }
  },

  // ----------------------------------------
  // DAILY MISSIONS (MISI HARIAN)
  // ----------------------------------------
  async getDailyMissions(): Promise<DailyMission[]> {
    if (isSupabaseConfigured) {
      const { data, error } = await supabase.from('misi_harian').select('*');
      if (error) throw error;
      return data;
    } else {
      return getLocal('pendekar_missions');
    }
  },

  async getMissionProgress(): Promise<any[]> {
    const cur = await this.getCurrentProfile();
    if (!cur) return [];

    const today = new Date().toISOString().split('T')[0];

    if (isSupabaseConfigured) {
      const { data, error } = await supabase
        .from('progress_misi')
        .select('*, misi_harian(*)')
        .eq('user_id', cur.id)
        .eq('tanggal', today);
      if (error) return [];
      return data;
    } else {
      const prog = getLocal('pendekar_progress_misi') as MissionProgress[];
      const missions = getLocal('pendekar_missions') as DailyMission[];
      
      const filtered = prog.filter(p => p.user_id === cur.id && p.tanggal === today);
      
      // If today progress doesn't exist, create it
      if (filtered.length === 0 && missions.length > 0) {
        const seededProg = missions.map(m => ({
          id: 'mprog-' + Math.random().toString(36).substr(2, 9),
          user_id: cur.id,
          misi_id: m.id,
          current_count: 0,
          completed: false,
          tanggal: today
        }));
        const allProg = [...prog, ...seededProg];
        setLocal('pendekar_progress_misi', allProg);
        return seededProg.map(sp => ({
          ...sp,
          misi_harian: missions.find(m => m.id === sp.misi_id)
        }));
      }

      return filtered.map(fp => ({
        ...fp,
        misi_harian: missions.find(m => m.id === fp.misi_id)
      }));
    }
  },

  async trackMissionProgress(tipe: 'baca_materi' | 'kerjakan_quiz' | 'main_game' | 'login', count: number): Promise<void> {
    const cur = await this.getCurrentProfile();
    if (!cur) return;
    await this.trackMissionProgressForUser(cur.id, tipe, count);
  },

  async trackMissionProgressForUser(userId: string, tipe: 'baca_materi' | 'kerjakan_quiz' | 'main_game' | 'login', count: number): Promise<void> {
    const today = new Date().toISOString().split('T')[0];
    
    if (isSupabaseConfigured) {
      // Find the mission of this type
      const { data: missions } = await supabase.from('misi_harian').select('id, target_count, points_reward').eq('tipe', tipe);
      if (!missions || missions.length === 0) return;

      for (const m of missions) {
        const { data: prog } = await supabase
          .from('progress_misi')
          .select('*')
          .eq('user_id', userId)
          .eq('misi_id', m.id)
          .eq('tanggal', today)
          .maybeSingle();

        if (prog) {
          if (prog.completed) continue;
          
          const nextCount = Math.min(prog.current_count + count, m.target_count);
          const completed = nextCount >= m.target_count;
          
          await supabase.from('progress_misi').update({
            current_count: nextCount,
            completed
          }).eq('id', prog.id);

          if (completed) {
            // Claim points
            const { data: profile } = await supabase.from('profiles').select('points').eq('id', userId).single();
            if (profile) {
              await supabase.from('profiles').update({ points: profile.points + m.points_reward }).eq('id', userId);
            }
          }
        } else {
          const completed = count >= m.target_count;
          await supabase.from('progress_misi').insert({
            user_id: userId,
            misi_id: m.id,
            current_count: Math.min(count, m.target_count),
            completed,
            tanggal: today
          });

          if (completed) {
            const { data: profile } = await supabase.from('profiles').select('points').eq('id', userId).single();
            if (profile) {
              await supabase.from('profiles').update({ points: profile.points + m.points_reward }).eq('id', userId);
            }
          }
        }
      }
    } else {
      const missions = getLocal('pendekar_missions') as DailyMission[];
      const mission = missions.find(m => m.tipe === tipe);
      if (!mission) return;

      const prog = getLocal('pendekar_progress_misi') as MissionProgress[];
      let idx = prog.findIndex(p => p.user_id === userId && p.misi_id === mission.id && p.tanggal === today);

      let isNewlyCompleted = false;
      let pointsAwarded = 0;

      if (idx !== -1) {
        if (prog[idx].completed) return;
        const nextCount = Math.min(prog[idx].current_count + count, mission.target_count);
        const completed = nextCount >= mission.target_count;
        
        prog[idx] = { ...prog[idx], current_count: nextCount, completed };
        if (completed) {
          isNewlyCompleted = true;
          pointsAwarded = mission.points_reward;
        }
      } else {
        const completed = count >= mission.target_count;
        const newProg: MissionProgress = {
          id: 'mprog-' + Date.now() + Math.floor(Math.random()*100),
          user_id: userId,
          misi_id: mission.id,
          current_count: Math.min(count, mission.target_count),
          completed,
          tanggal: today
        };
        prog.push(newProg);
        if (completed) {
          isNewlyCompleted = true;
          pointsAwarded = mission.points_reward;
        }
      }

      setLocal('pendekar_progress_misi', prog);

      if (isNewlyCompleted) {
        const users = getLocal('pendekar_users') as Profile[];
        const uIdx = users.findIndex(u => u.id === userId);
        if (uIdx !== -1) {
          users[uIdx].points += pointsAwarded;
          setLocal('pendekar_users', users);
          
          const cur = localStorage.getItem('pendekar_current_user');
          if (cur) {
            const curObj = JSON.parse(cur);
            if (curObj.id === userId) {
              setLocal('pendekar_current_user', users[uIdx]);
              notifyProfileChanged();
            }
          }
        }
      }
    }
  },

  // ----------------------------------------
  // BADGES
  // ----------------------------------------
  async getBadges(): Promise<Badge[]> {
    if (isSupabaseConfigured) {
      const { data, error } = await supabase.from('badge').select('*');
      if (error) throw error;
      return data;
    } else {
      return getLocal('pendekar_badges');
    }
  },

  async getNotifications(limit: number = 5): Promise<any[]> {
    const cur = await this.getCurrentProfile();
    if (!cur) return [];

    if (isSupabaseConfigured) {
      // Combine: recent activity logs + completed missions today
      const today = new Date().toISOString().split('T')[0];

      const [{ data: acts }, { data: missionProg }] = await Promise.all([
        supabase.from('aktivitas')
          .select('*')
          .eq('user_id', cur.id)
          .order('created_at', { ascending: false })
          .limit(3),
        supabase.from('progress_misi')
          .select('*, misi_harian(deskripsi)')
          .eq('user_id', cur.id)
          .eq('tanggal', today)
          .eq('completed', true)
      ]);

      const actNotifs = (acts || []).map((a: any) => ({
        id: a.id,
        title: a.tipe_aktivitas,
        message: a.detail,
        type: 'activity',
        created_at: a.created_at
      }));

      const missionNotifs = (missionProg || []).map((p: any) => ({
        id: `mission-${p.id}`,
        title: 'Misi harian selesai',
        message: p.misi_harian ? `Kamu menyelesaikan "${p.misi_harian.deskripsi}".` : 'Misi harian selesai.',
        type: 'mission',
        created_at: new Date().toISOString()
      }));

      return [...missionNotifs, ...actNotifs]
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, limit);
    } else {
      const activities = getLocal('pendekar_activities') as ActivityLog[];
      const progress = getLocal('pendekar_progress_misi') as MissionProgress[];
      const missions = getLocal('pendekar_missions') as DailyMission[];
      const today = new Date().toISOString().split('T')[0];

      const activityNotifications = activities
        .filter(item => item.user_id === cur.id)
        .slice(-3)
        .map(item => ({
          id: item.id,
          title: 'Aktivitas terbaru',
          message: item.detail,
          type: 'activity',
          created_at: item.created_at
        }));

      const missionNotifications = progress
        .filter(item => item.user_id === cur.id && item.tanggal === today && item.completed)
        .map(item => {
          const mission = missions.find(m => m.id === item.misi_id);
          return {
            id: `mission-${item.id}`,
            title: 'Misi harian selesai',
            message: mission ? `Kamu menyelesaikan "${mission.deskripsi}".` : 'Misi harian selesai.',
            type: 'mission',
            created_at: new Date().toISOString()
          };
        });

      const reminderNotifications = [] as any[];
      const hasTodayMaterial = activities.some(item => item.user_id === cur.id && item.detail.toLowerCase().includes('materi'));
      if (!hasTodayMaterial) {
        reminderNotifications.push({
          id: 'reminder-daily-material',
          title: 'Yuk lanjut belajar',
          message: 'Ayo selesaikan materimu hari ini dan jaga streakmu tetap hidup.',
          type: 'reminder',
          created_at: new Date().toISOString()
        });
      }

      return [...reminderNotifications, ...missionNotifications, ...activityNotifications]
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, limit);
    }
  },

  async getUserBadges(): Promise<any[]> {
    const cur = await this.getCurrentProfile();
    if (!cur) return [];

    if (isSupabaseConfigured) {
      const { data, error } = await supabase
        .from('user_badge')
        .select('*, badge(*)')
        .eq('user_id', cur.id);
      if (error) return [];
      return data;
    } else {
      const uBadges = getLocal('pendekar_user_badges') as UserBadge[];
      const badges = getLocal('pendekar_badges') as Badge[];
      return uBadges
        .filter(ub => ub.user_id === cur.id)
        .map(ub => ({
          ...ub,
          badge: badges.find(b => b.id === ub.badge_id)
        }));
    }
  },

  async checkAndUnlockBadges(userId: string): Promise<string[]> {
    const unlockedList: string[] = [];

    // Get statistics
    let materiCount = 0;
    let quizCount = 0;
    let gameCount = 0;
    let maxQuizScore = 0;

    if (isSupabaseConfigured) {
      const { count: m } = await supabase.from('progress_materi').select('*', { count: 'exact', head: true }).eq('user_id', userId).eq('completed', true);
      const { data: q } = await supabase.from('hasil_quiz').select('skor').eq('user_id', userId);
      const { count: g } = await supabase.from('hasil_game').select('*', { count: 'exact', head: true }).eq('user_id', userId);

      materiCount = m || 0;
      quizCount = q?.length || 0;
      gameCount = g || 0;
      maxQuizScore = q && q.length > 0 ? Math.max(...q.map(r => r.skor)) : 0;
    } else {
      materiCount = (getLocal('pendekar_progress_materi') as any[]).filter(p => p.user_id === userId && p.completed).length;
      const qResults = (getLocal('pendekar_hasil_quiz') as any[]).filter(p => p.user_id === userId);
      quizCount = qResults.length;
      maxQuizScore = qResults.length > 0 ? Math.max(...qResults.map(r => r.skor)) : 0;
      gameCount = (getLocal('pendekar_hasil_game') as any[]).filter(p => p.user_id === userId).length;
    }

    const badges = await this.getBadges();
    const userBadges = await this.getUserBadges();
    const ownedBadgeIds = new Set(userBadges.map(ub => ub.badge_id));

    for (const b of badges) {
      if (ownedBadgeIds.has(b.id)) continue;

      let meetsRequirement = false;
      if (b.syarat_tipe === 'materi_count' && materiCount >= b.syarat_value) meetsRequirement = true;
      if (b.syarat_tipe === 'quiz_count' && quizCount >= b.syarat_value) meetsRequirement = true;
      if (b.syarat_tipe === 'game_count' && gameCount >= b.syarat_value) meetsRequirement = true;
      if (b.syarat_tipe === 'quiz_perfect_score' && maxQuizScore >= 100) meetsRequirement = true;

      if (meetsRequirement) {
        if (isSupabaseConfigured) {
          await supabase.from('user_badge').insert({ user_id: userId, badge_id: b.id });
        } else {
          const uBadges = getLocal('pendekar_user_badges');
          uBadges.push({
            id: 'ub-' + Date.now() + Math.floor(Math.random()*100),
            user_id: userId,
            badge_id: b.id,
            unlocked_at: new Date().toISOString()
          });
          setLocal('pendekar_user_badges', uBadges);
        }
        unlockedList.push(b.nama);
      }
    }

    return unlockedList;
  },

  // ----------------------------------------
  // LEADERBOARD
  // ----------------------------------------
  async getLeaderboard(): Promise<Profile[]> {
    if (isSupabaseConfigured) {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('points', { ascending: false })
        .limit(20);
      if (error) throw error;
      return data.map((item: any, index: number) => ({
        ...item,
        leaderboard_score: getLeaderboardScore(item as Profile, 0),
        reward_bonus: getLeaderboardReward(index + 1)
      }));
    } else {
      const users = getLocal('pendekar_users') as Profile[];
      const activities = getLocal('pendekar_activities') as ActivityLog[];
      const today = new Date().toISOString().split('T')[0];
      const rewardRecords = getLocal('pendekar_leaderboard_rewards') as any[];

      const rankedUsers = [...users]
        .filter(user => user.role !== 'admin')
        .map(user => ({
          ...user,
          activity_count: activities.filter(activity => activity.user_id === user.id).length,
          leaderboard_score: getLeaderboardScore(user, activities.filter(activity => activity.user_id === user.id).length)
        }))
        .sort((a, b) => {
          if (b.leaderboard_score !== a.leaderboard_score) return (b.leaderboard_score || 0) - (a.leaderboard_score || 0);
          if (b.points !== a.points) return b.points - a.points;
          if (b.xp !== a.xp) return b.xp - a.xp;
          if (b.streak !== a.streak) return b.streak - a.streak;
          if (b.level !== a.level) return b.level - a.level;
          return (a.created_at || '').localeCompare(b.created_at || '') || a.name.localeCompare(b.name);
        })
        .slice(0, 20)
        .map((user, index) => {
          const rewardBonus = getLeaderboardReward(index + 1);
          if (rewardBonus > 0 && !rewardRecords.some(record => record.user_id === user.id && record.date === today)) {
            const updatedUsers = getLocal('pendekar_users') as Profile[];
            const userIndex = updatedUsers.findIndex(item => item.id === user.id);
            if (userIndex !== -1) {
              updatedUsers[userIndex] = { ...updatedUsers[userIndex], points: updatedUsers[userIndex].points + rewardBonus };
              setLocal('pendekar_users', updatedUsers);
              if (localStorage.getItem('pendekar_current_user') && JSON.parse(localStorage.getItem('pendekar_current_user') || '{}').id === user.id) {
                setLocal('pendekar_current_user', updatedUsers[userIndex]);
              }
              rewardRecords.push({ id: 'lbr-' + Date.now() + '-' + user.id, user_id: user.id, date: today, points_awarded: rewardBonus, rank: index + 1 });
              setLocal('pendekar_leaderboard_rewards', rewardRecords);
              notifyProfileChanged();
            }
          }

          return {
            ...user,
            reward_bonus: rewardBonus,
            points: user.points + (rewardBonus > 0 && rewardRecords.some(record => record.user_id === user.id && record.date === today) ? 0 : 0)
          } as Profile;
        });

      return rankedUsers;
    }
  },

  // ----------------------------------------
  // CONSULTATION (KONSULTASI)
  // ----------------------------------------
  async getConsultations(): Promise<Consultation[]> {
    const cur = await this.getCurrentProfile();
    if (!cur) return [];

    if (isSupabaseConfigured) {
      let query = supabase.from('konsultasi').select('*');
      if (cur.role !== 'admin') {
        query = query.eq('user_id', cur.id);
      }
      const { data, error } = await query.order('ditanyakan_at', { ascending: false });
      if (error) return [];
      
      // Populate user names if admin
      if (cur.role === 'admin') {
        const { data: users } = await supabase.from('profiles').select('id, name');
        const userMap = new Map(users?.map(u => [u.id, u.name]));
        return data.map(d => ({ ...d, user_name: userMap.get(d.user_id) || 'Remaja' }));
      }
      return data;
    } else {
      const all = getLocal('pendekar_consultations') as Consultation[];
      const users = getLocal('pendekar_users') as Profile[];
      const userMap = new Map(users.map(u => [u.id, u.name]));

      const list = cur.role === 'admin' ? all : all.filter(c => c.user_id === cur.id);
      return list.map(c => ({
        ...c,
        user_name: userMap.get(c.user_id) || 'Remaja'
      })).sort((a, b) => new Date(b.ditanyakan_at).getTime() - new Date(a.ditanyakan_at).getTime());
    }
  },

  async askQuestion(pertanyaan: string): Promise<Consultation> {
    const cur = await this.getCurrentProfile();
    if (!cur) throw new Error('Unauthorized');

    if (isSupabaseConfigured) {
      const { data, error } = await supabase
        .from('konsultasi')
        .insert({
          user_id: cur.id,
          pertanyaan,
          status: 'pending'
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    } else {
      const all = getLocal('pendekar_consultations');
      const newConsultation: Consultation = {
        id: 'c-' + Date.now(),
        user_id: cur.id,
        pertanyaan,
        status: 'pending',
        ditanyakan_at: new Date().toISOString()
      };
      all.push(newConsultation);
      setLocal('pendekar_consultations', all);
      return newConsultation;
    }
  },

  async answerQuestion(consultationId: string, jawaban: string): Promise<Consultation> {
    const cur = await this.getCurrentProfile();
    if (!cur || cur.role !== 'admin') throw new Error('Unauthorized');

    if (isSupabaseConfigured) {
      const { data, error } = await supabase
        .from('konsultasi')
        .update({
          jawaban,
          status: 'answered',
          dijawab_at: new Date().toISOString(),
          admin_id: cur.id
        })
        .eq('id', consultationId)
        .select()
        .single();
      if (error) throw error;
      return data;
    } else {
      const all = getLocal('pendekar_consultations') as Consultation[];
      const idx = all.findIndex(c => c.id === consultationId);
      if (idx === -1) throw new Error('Consultation item not found');

      all[idx] = {
        ...all[idx],
        jawaban,
        status: 'answered',
        dijawab_at: new Date().toISOString(),
        admin_id: cur.id
      };
      setLocal('pendekar_consultations', all);
      return all[idx];
    }
  },

  // ----------------------------------------
  // HEALTH SERVICES (INFORMASI LAYANAN)
  // ----------------------------------------
  async getHealthServices(): Promise<HealthService[]> {
    if (isSupabaseConfigured) {
      const { data, error } = await supabase.from('informasi_layanan').select('*');
      if (error) throw error;
      return data;
    } else {
      return getLocal('pendekar_health_services');
    }
  },

  // ----------------------------------------
  // ADMIN DASHBOARD & CRUD
  // ----------------------------------------
  async getAdminStats(): Promise<any> {
    const users = await this.getAllUsers();
    const materials = await this.getMaterials();
    const quizzes = await this.getQuizzes();
    const games = await this.getGames();
    const consultations = await this.getConsultations();

    const normalUsers = users.filter(u => u.role !== 'admin');
    
    // Average quiz score
    let avgQuizScore = 80; // default/seed
    if (isSupabaseConfigured) {
      const { data } = await supabase.from('hasil_quiz').select('skor');
      if (data && data.length > 0) {
        avgQuizScore = Math.round(data.reduce((acc, cur) => acc + cur.skor, 0) / data.length);
      }
    } else {
      const scores = getLocal('pendekar_hasil_quiz') as any[];
      if (scores.length > 0) {
        avgQuizScore = Math.round(scores.reduce((acc, cur) => acc + cur.skor, 0) / scores.length);
      }
    }

    return {
      userCount: normalUsers.length,
      materialCount: materials.length,
      quizCount: quizzes.length,
      gameCount: games.length,
      pendingConsultations: consultations.filter(c => c.status === 'pending').length,
      averageQuizScore: avgQuizScore,
      popularMaterial: materials[0]?.judul || 'Pengenalan Dasar HIV',
      popularGame: games[0]?.nama || 'Benar atau Salah'
    };
  },

  async getRecentActivityLogs(limit: number = 5): Promise<any[]> {
    if (isSupabaseConfigured) {
      const { data, error } = await supabase
        .from('aktivitas')
        .select('*, profiles(name)')
        .order('created_at', { ascending: false })
        .limit(limit);
      if (error) return [];
      return (data || []).map((log: any) => ({
        ...log,
        userName: log.profiles?.name || 'Remaja'
      }));
    } else {
      const logs = getLocal('pendekar_activities') as ActivityLog[];
      const users = getLocal('pendekar_users') as Profile[];
      const userMap = new Map(users.map(u => [u.id, u.name]));
      return [...logs]
        .reverse()
        .slice(0, limit)
        .map(l => ({ ...l, userName: userMap.get(l.user_id) || 'Remaja' }));
    }
  },

  async getAllUsers(): Promise<Profile[]> {
    if (isSupabaseConfigured) {
      const { data, error } = await supabase.from('profiles').select('*');
      if (error) throw error;
      return data;
    } else {
      return getLocal('pendekar_users');
    }
  },

  async updateUserRole(userId: string, role: 'user' | 'admin'): Promise<void> {
    if (isSupabaseConfigured) {
      const { error } = await supabase.from('profiles').update({ role }).eq('id', userId);
      if (error) throw error;
    } else {
      const users = getLocal('pendekar_users') as Profile[];
      const idx = users.findIndex(u => u.id === userId);
      if (idx !== -1) {
        users[idx].role = role;
        setLocal('pendekar_users', users);
      }
    }
  },

  async deleteUser(userId: string): Promise<void> {
    if (isSupabaseConfigured) {
      const { error } = await supabase.from('profiles').delete().eq('id', userId);
      if (error) throw error;
    } else {
      const users = getLocal('pendekar_users') as Profile[];
      const filtered = users.filter(u => u.id !== userId);
      setLocal('pendekar_users', filtered);
    }
  },

  // CRUD Material
  async uploadMaterialAsset(file: File, folder: string): Promise<string> {
    if (isSupabaseConfigured) {
      const safeName = file.name.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9._-]/g, '');
      const filePath = `${folder}/${Date.now()}_${safeName}`;

      const { error } = await supabase.storage.from(STORAGE_BUCKET).upload(filePath, file, {
        cacheControl: '3600',
        upsert: true,
      });

      // If bucket doesn't exist or upload fails, fall back to data URL
      if (error) {
        console.warn('Storage upload failed, using data URL fallback:', error.message);
        return fileToDataUrl(file);
      }

      const { data: publicData } = supabase.storage
        .from(STORAGE_BUCKET)
        .getPublicUrl(filePath);

      return publicData.publicUrl;
    }

    return fileToDataUrl(file);
  },

  async uploadPdf(file: File): Promise<{ url: string; fileName: string; fileSize: number }> {
    const PDF_BUCKET = 'materi-pdf';
    const MAX_SIZE = 20 * 1024 * 1024; // 20MB

    if (file.type !== 'application/pdf') {
      throw new Error('Hanya file PDF yang diizinkan.');
    }
    if (file.size > MAX_SIZE) {
      throw new Error('Ukuran file melebihi batas 20 MB.');
    }

    const safeName = file.name.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9._-]/g, '');
    const filePath = `pdf/${Date.now()}_${safeName}`;

    if (isSupabaseConfigured) {
      const { error } = await supabase.storage.from(PDF_BUCKET).upload(filePath, file, {
        cacheControl: '3600',
        upsert: true,
      });
      if (error) throw new Error(`Upload gagal: ${error.message}`);

      const { data } = supabase.storage.from(PDF_BUCKET).getPublicUrl(filePath);
      return { url: data.publicUrl, fileName: file.name, fileSize: file.size };
    }

    // Fallback untuk mode offline: simpan sebagai data URL di localStorage
    const dataUrl = await fileToDataUrl(file);
    return { url: dataUrl, fileName: file.name, fileSize: file.size };
  },

  async deletePdf(pdfUrl: string): Promise<void> {
    if (!isSupabaseConfigured || !pdfUrl) return;
    try {
      // Extract file path from URL
      const url = new URL(pdfUrl);
      const pathParts = url.pathname.split('/materi-pdf/');
      if (pathParts.length > 1) {
        await supabase.storage.from('materi-pdf').remove([pathParts[1]]);
      }
    } catch {
      // Ignore delete errors — file may already be gone
    }
  },

  async createMaterial(material: Omit<Material, 'id'>): Promise<Material> {
    // Remove undefined fields — Supabase rejects them, use null or omit entirely
    const cleanPayload = Object.fromEntries(
      Object.entries(material).filter(([, v]) => v !== undefined)
    );

    if (isSupabaseConfigured) {
      const { data, error } = await supabase.from('materi').insert(cleanPayload).select().single();
      if (error) throw error;
      return data;
    } else {
      const mats = getLocal('pendekar_materials');
      const newMat = { ...cleanPayload, id: 'mat-' + Date.now() };
      mats.push(newMat);
      setLocal('pendekar_materials', mats);
      return newMat as Material;
    }
  },

  async updateMaterial(id: string, material: Partial<Material>): Promise<Material> {
    // Remove undefined fields
    const cleanPayload = Object.fromEntries(
      Object.entries(material).filter(([, v]) => v !== undefined)
    );

    if (isSupabaseConfigured) {
      const { data, error } = await supabase.from('materi').update(cleanPayload).eq('id', id).select().single();
      if (error) throw error;
      return data;
    } else {
      const mats = getLocal('pendekar_materials') as Material[];
      const idx = mats.findIndex(m => m.id === id);
      if (idx === -1) throw new Error('Material not found');

      const updated = { ...mats[idx], ...cleanPayload };
      mats[idx] = updated;
      setLocal('pendekar_materials', mats);
      return updated;
    }
  },

  async deleteMaterial(id: string): Promise<void> {
    if (isSupabaseConfigured) {
      const { error } = await supabase.from('materi').delete().eq('id', id);
      if (error) throw error;
    } else {
      const mats = getLocal('pendekar_materials') as Material[];
      const filtered = mats.filter(m => m.id !== id);
      setLocal('pendekar_materials', filtered);
    }
  },

  // CRUD Quiz
  async createQuiz(quiz: Omit<Quiz, 'id'>, questions: Omit<QuizQuestion, 'id' | 'quiz_id'>[]): Promise<Quiz> {
    if (isSupabaseConfigured) {
      const { data, error } = await supabase.from('quiz').insert(quiz).select().single();
      if (error) throw error;

      const qnsToInsert = questions.map(q => ({ ...q, quiz_id: data.id }));
      const { error: qErr } = await supabase.from('quiz_soal').insert(qnsToInsert);
      if (qErr) throw qErr;
      
      return data;
    } else {
      const quizzes = getLocal('pendekar_quizzes');
      const qns = getLocal('pendekar_questions');
      
      const newQuiz = { ...quiz, id: 'quiz-' + Date.now() };
      quizzes.push(newQuiz);
      setLocal('pendekar_quizzes', quizzes);

      questions.forEach((q, i) => {
        qns.push({
          ...q,
          id: `q-${Date.now()}-${i}`,
          quiz_id: newQuiz.id
        });
      });
      setLocal('pendekar_questions', qns);

      return newQuiz;
    }
  },

  async deleteQuiz(id: string): Promise<void> {
    if (isSupabaseConfigured) {
      const { error } = await supabase.from('quiz').delete().eq('id', id);
      if (error) throw error;
    } else {
      const quizzes = getLocal('pendekar_quizzes') as Quiz[];
      const filteredQ = quizzes.filter(q => q.id !== id);
      setLocal('pendekar_quizzes', filteredQ);

      const qns = getLocal('pendekar_questions') as QuizQuestion[];
      const filteredQns = qns.filter(q => q.quiz_id !== id);
      setLocal('pendekar_questions', filteredQns);
    }
  },

  // CRUD Health Service
  async createHealthService(service: Omit<HealthService, 'id'>): Promise<HealthService> {
    if (isSupabaseConfigured) {
      const { data, error } = await supabase.from('informasi_layanan').insert(service).select().single();
      if (error) throw error;
      return data;
    } else {
      const services = getLocal('pendekar_health_services');
      const newServ = { ...service, id: 'serv-' + Date.now() };
      services.push(newServ);
      setLocal('pendekar_health_services', services);
      return newServ;
    }
  },

  async updateHealthService(id: string, service: Partial<HealthService>): Promise<HealthService> {
    if (isSupabaseConfigured) {
      const { data, error } = await supabase.from('informasi_layanan').update(service).eq('id', id).select().single();
      if (error) throw error;
      return data;
    } else {
      const services = getLocal('pendekar_health_services') as HealthService[];
      const idx = services.findIndex(s => s.id === id);
      if (idx === -1) throw new Error('Service not found');

      const updated = { ...services[idx], ...service };
      services[idx] = updated;
      setLocal('pendekar_health_services', services);
      return updated;
    }
  },

  async deleteHealthService(id: string): Promise<void> {
    if (isSupabaseConfigured) {
      const { error } = await supabase.from('informasi_layanan').delete().eq('id', id);
      if (error) throw error;
    } else {
      const services = getLocal('pendekar_health_services') as HealthService[];
      const filtered = services.filter(s => s.id !== id);
      setLocal('pendekar_health_services', filtered);
    }
  },

  // ----------------------------------------
  // KOMENTAR MATERI
  // ----------------------------------------
  async getComments(materiId: string): Promise<Comment[]> {
    if (isSupabaseConfigured) {
      const { data, error } = await supabase
        .from('komentar_materi')
        .select('*, profiles(name, avatar_url)')
        .eq('materi_id', materiId)
        .order('created_at', { ascending: true });
      if (error) return [];
      return (data || []).map((d: any) => ({
        id: d.id,
        materi_id: d.materi_id,
        user_id: d.user_id,
        user_name: d.profiles?.name || 'Remaja',
        user_avatar: d.profiles?.avatar_url || '',
        teks: d.teks,
        created_at: d.created_at,
      }));
    } else {
      const comments = getLocal('pendekar_komentar') as Comment[];
      const users = getLocal('pendekar_users') as Profile[];
      return comments
        .filter(c => c.materi_id === materiId)
        .map(c => ({
          ...c,
          user_name: users.find(u => u.id === c.user_id)?.name || c.user_name || 'Remaja',
          user_avatar: users.find(u => u.id === c.user_id)?.avatar_url || '',
        }));
    }
  },

  async addComment(materiId: string, teks: string): Promise<Comment> {
    const cur = await this.getCurrentProfile();
    if (!cur) throw new Error('Unauthorized');
    if (!teks.trim()) throw new Error('Komentar tidak boleh kosong.');

    if (isSupabaseConfigured) {
      const { data, error } = await supabase
        .from('komentar_materi')
        .insert({ materi_id: materiId, user_id: cur.id, teks: teks.trim() })
        .select('*, profiles(name, avatar_url)')
        .single();
      if (error) throw error;
      return {
        id: data.id,
        materi_id: data.materi_id,
        user_id: data.user_id,
        user_name: (data as any).profiles?.name || cur.name,
        user_avatar: (data as any).profiles?.avatar_url || cur.avatar_url || '',
        teks: data.teks,
        created_at: data.created_at,
      };
    } else {
      const newComment: Comment = {
        id: 'cmt-' + Date.now(),
        materi_id: materiId,
        user_id: cur.id,
        user_name: cur.name,
        user_avatar: cur.avatar_url || '',
        teks: teks.trim(),
        created_at: new Date().toISOString(),
      };
      const comments = getLocal('pendekar_komentar');
      comments.push(newComment);
      setLocal('pendekar_komentar', comments);
      return newComment;
    }
  },

  async deleteComment(commentId: string): Promise<void> {
    const cur = await this.getCurrentProfile();
    if (!cur) throw new Error('Unauthorized');

    if (isSupabaseConfigured) {
      // Hapus langsung — RLS policy akan memfilter berdasarkan user_id atau is_admin()
      const { error } = await supabase
        .from('komentar_materi')
        .delete()
        .eq('id', commentId);
      if (error) throw error;
    } else {
      const comments = getLocal('pendekar_komentar') as Comment[];
      const filtered = comments.filter(c => !(c.id === commentId && (c.user_id === cur.id || cur.role === 'admin')));
      setLocal('pendekar_komentar', filtered);
    }
  }
};

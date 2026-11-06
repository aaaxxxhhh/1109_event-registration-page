import express from 'express';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json());

// Persistent database path
const DATA_DIR = path.join(__dirname, 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

interface ApplicantRecord {
  id: string;
  name: string;
  org?: string;
  phone: string;
  email: string;
  gender: '남성' | '여성' | '선택 안 함';
  consent: boolean;
  consentAt: string;
  submittedAt: string;
  status: '접수' | '확인' | '당첨' | '취소';
  memo: string;
  drawnAt?: string;
}

interface EventConfigRecord {
  title: string;
  subtitle: string;
  description: string;
  eventDate: string;
  location: string;
  maxCapacity: number;
  isOpen: boolean;
  organizer: string;
  contactEmail: string;
}

interface DatabaseSchema {
  adminPasswordHash: string; // SHA-256 of salt + password
  config: EventConfigRecord;
  applicants: ApplicantRecord[];
}

const SALT = 'evt-manager-2026';
function hashPassword(pw: string): string {
  return crypto.createHash('sha256').update(SALT + ':' + pw).digest('hex');
}

// Default initial database content
const DEFAULT_CONFIG: EventConfigRecord = {
  title: '2026 AI 테크 & 글로벌 이노베이션 컨퍼런스',
  subtitle: '디지털 전환 시대를 선도하는 기술 트렌드와 네트워킹의 장',
  description: 'AI, 클라우드, 데이터 기술의 최신 혁신 사례를 공유하고 업계 실무자 및 리더들과 교류하는 네트워킹 이벤트입니다.',
  eventDate: '2026년 11월 20일 (금) 14:00 ~ 18:00',
  location: '서울 코엑스 그랜드볼룸 & 온라인 동시 진행',
  maxCapacity: 200,
  isOpen: true,
  organizer: '테크이노베이션 포럼 사무국',
  contactEmail: 'contact@techevent2026.org',
};

const SAMPLE_APPLICANTS: ApplicantRecord[] = [
  {
    id: 'app-01',
    name: '김도현',
    org: '네이버 클라우드 플랫폼',
    phone: '01012345678',
    email: 'dohyun.kim@navercorp.com',
    gender: '남성',
    consent: true,
    consentAt: new Date(Date.now() - 86400000 * 3).toISOString(),
    submittedAt: new Date(Date.now() - 86400000 * 3).toISOString(),
    status: '당첨',
    memo: 'VIP 세션 초대장 사전 발송 완료',
    drawnAt: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: 'app-02',
    name: '이지은',
    org: '토스 인프라팀',
    phone: '01023456789',
    email: 'jieun.lee@toss.im',
    gender: '여성',
    consent: true,
    consentAt: new Date(Date.now() - 86400000 * 2.5).toISOString(),
    submittedAt: new Date(Date.now() - 86400000 * 2.5).toISOString(),
    status: '당첨',
    memo: '패널 토론 질문 사전 접수',
    drawnAt: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: 'app-03',
    name: '박민우',
    org: '당근마켓 ML팀',
    phone: '01034567890',
    email: 'minwoo.park@daangn.com',
    gender: '남성',
    consent: true,
    consentAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    submittedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    status: '확인',
    memo: '현장 등록 희망',
  },
  {
    id: 'app-04',
    name: '최수연',
    org: '우아한형제들 프로덕트팀',
    phone: '01045678901',
    email: 'suyeon.c@woowahan.com',
    gender: '여성',
    consent: true,
    consentAt: new Date(Date.now() - 86400000 * 1.8).toISOString(),
    submittedAt: new Date(Date.now() - 86400000 * 1.8).toISOString(),
    status: '확인',
    memo: '',
  },
  {
    id: 'app-05',
    name: '정현우',
    org: '카카오 엔터프라이즈',
    phone: '01056789012',
    email: 'hyunwoo.jung@kakaoenterprise.com',
    gender: '남성',
    consent: true,
    consentAt: new Date(Date.now() - 86400000 * 1.2).toISOString(),
    submittedAt: new Date(Date.now() - 86400000 * 1.2).toISOString(),
    status: '접수',
    memo: '동행인 1인 문의',
  },
  {
    id: 'app-06',
    name: '강서윤',
    org: '라인플러스 글로벌개발',
    phone: '01067890123',
    email: 'seoyun.kang@linecorp.com',
    gender: '여성',
    consent: true,
    consentAt: new Date(Date.now() - 86400000 * 0.9).toISOString(),
    submittedAt: new Date(Date.now() - 86400000 * 0.9).toISOString(),
    status: '접수',
    memo: '',
  },
  {
    id: 'app-07',
    name: '윤재호',
    org: '서울대학교 컴퓨터공학부',
    phone: '01078901234',
    email: 'jaeho.yoon@snu.ac.kr',
    gender: '남성',
    consent: true,
    consentAt: new Date(Date.now() - 86400000 * 0.5).toISOString(),
    submittedAt: new Date(Date.now() - 86400000 * 0.5).toISOString(),
    status: '접수',
    memo: '학생 참가 할인 문의',
  },
  {
    id: 'app-08',
    name: '한예린',
    org: '스타트업 얼라이언스',
    phone: '01089012345',
    email: 'yerin.han@startupall.kr',
    gender: '여성',
    consent: true,
    consentAt: new Date(Date.now() - 86400000 * 0.2).toISOString(),
    submittedAt: new Date(Date.now() - 86400000 * 0.2).toISOString(),
    status: '취소',
    memo: '일정 중복으로 참가 취소 요청',
  },
];

function initDB(): DatabaseSchema {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  if (fs.existsSync(DB_FILE)) {
    try {
      const content = fs.readFileSync(DB_FILE, 'utf-8');
      return JSON.parse(content) as DatabaseSchema;
    } catch (e) {
      console.error('Failed to read db file, recreating...', e);
    }
  }

  const initialData: DatabaseSchema = {
    adminPasswordHash: hashPassword('admin1234'),
    config: DEFAULT_CONFIG,
    applicants: SAMPLE_APPLICANTS,
  };

  fs.writeFileSync(DB_FILE, JSON.stringify(initialData, null, 2), 'utf-8');
  return initialData;
}

let db = initDB();

function saveDB() {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to save DB:', err);
  }
}

// Simple in-memory session tokens for admin
const validTokens = new Set<string>();

function checkAdminAuth(req: express.Request): boolean {
  const authHeader = req.headers.authorization;
  if (!authHeader) return false;
  const token = authHeader.replace(/^Bearer\s+/, '');
  return validTokens.has(token);
}

// API Routes

// 1. Get Event Configuration
app.get('/api/config', (req, res) => {
  res.json({
    ...db.config,
    applicantCount: db.applicants.length,
    isOpen: db.config.isOpen && db.applicants.length < db.config.maxCapacity,
  });
});

// 2. Update Event Configuration (Admin only)
app.post('/api/config', (req, res) => {
  if (!checkAdminAuth(req)) {
    return res.status(401).json({ error: '관리자 인증이 필요합니다.' });
  }
  const { title, subtitle, description, eventDate, location, maxCapacity, isOpen, organizer, contactEmail } = req.body;
  if (title) db.config.title = title;
  if (subtitle !== undefined) db.config.subtitle = subtitle;
  if (description !== undefined) db.config.description = description;
  if (eventDate !== undefined) db.config.eventDate = eventDate;
  if (location !== undefined) db.config.location = location;
  if (maxCapacity !== undefined) db.config.maxCapacity = Math.max(1, parseInt(maxCapacity, 10) || 100);
  if (isOpen !== undefined) db.config.isOpen = Boolean(isOpen);
  if (organizer !== undefined) db.config.organizer = organizer;
  if (contactEmail !== undefined) db.config.contactEmail = contactEmail;

  saveDB();
  res.json({ success: true, config: db.config });
});

// 3. Admin Login
app.post('/api/auth/login', (req, res) => {
  const { password } = req.body;
  if (!password) {
    return res.status(400).json({ error: '비밀번호를 입력해 주세요.' });
  }

  const hash = hashPassword(password);
  if (hash === db.adminPasswordHash) {
    const token = crypto.randomBytes(24).toString('hex');
    validTokens.add(token);
    return res.json({ success: true, token });
  }

  return res.status(401).json({ error: '비밀번호가 일치하지 않습니다.' });
});

// 4. Admin Change Password
app.post('/api/auth/change-password', (req, res) => {
  if (!checkAdminAuth(req)) {
    return res.status(401).json({ error: '관리자 인증이 필요합니다.' });
  }
  const { newPassword } = req.body;
  if (!newPassword || newPassword.length < 4) {
    return res.status(400).json({ error: '새 비밀번호는 최소 4자 이상이어야 합니다.' });
  }
  db.adminPasswordHash = hashPassword(newPassword);
  saveDB();
  res.json({ success: true, message: '비밀번호가 변경되었습니다.' });
});

// 5. Submit Event Registration (Public)
app.post('/api/applicants', (req, res) => {
  const { name, org, phone, email, gender, consent } = req.body;

  // Validation
  if (!name || !name.trim()) {
    return res.status(400).json({ error: '이름을 입력해 주세요.' });
  }
  const rawPhone = String(phone || '').replace(/\D/g, '');
  if (!rawPhone || rawPhone.length < 10) {
    return res.status(400).json({ error: '올바른 휴대폰 번호를 입력해 주세요.' });
  }
  if (!email || !email.includes('@')) {
    return res.status(400).json({ error: '올바른 이메일 주소를 입력해 주세요.' });
  }
  if (!gender) {
    return res.status(400).json({ error: '성별을 선택해 주세요.' });
  }
  if (!consent) {
    return res.status(400).json({ error: '개인정보 수집 및 이용에 동의해야 신청이 가능합니다.' });
  }

  const now = new Date().toISOString();
  const cleanName = name.trim();
  const cleanOrg = org ? org.trim() : '';
  const cleanEmail = email.trim();

  // Deduplication check: check if phone already registered
  const existingIdx = db.applicants.findIndex(a => a.phone === rawPhone);
  let record: ApplicantRecord;

  if (existingIdx >= 0) {
    const prev = db.applicants[existingIdx];
    record = {
      ...prev,
      name: cleanName,
      org: cleanOrg,
      email: cleanEmail,
      gender,
      consent: true,
      consentAt: now,
      submittedAt: now,
    };
    db.applicants[existingIdx] = record;
  } else {
    record = {
      id: 'app-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      name: cleanName,
      org: cleanOrg,
      phone: rawPhone,
      email: cleanEmail,
      gender,
      consent: true,
      consentAt: now,
      submittedAt: now,
      status: '접수',
      memo: '',
    };
    db.applicants.push(record);
  }

  saveDB();
  res.status(201).json({ success: true, applicant: record, isUpdate: existingIdx >= 0 });
});

// 6. Get Applicants List (Admin only)
app.get('/api/applicants', (req, res) => {
  if (!checkAdminAuth(req)) {
    return res.status(401).json({ error: '관리자 인증이 필요합니다.' });
  }

  const { status, q } = req.query;
  let list = [...db.applicants];

  if (status && typeof status === 'string') {
    list = list.filter(a => a.status === status);
  }

  if (q && typeof q === 'string') {
    const query = q.trim().toLowerCase();
    list = list.filter(a =>
      a.name.toLowerCase().includes(query) ||
      (a.org && a.org.toLowerCase().includes(query)) ||
      a.phone.includes(query) ||
      a.email.toLowerCase().includes(query)
    );
  }

  // Sort by submittedAt descending
  list.sort((a, b) => b.submittedAt.localeCompare(a.submittedAt));

  // Compute stats
  const stats = {
    total: db.applicants.length,
    received: db.applicants.filter(a => a.status === '접수').length,
    confirmed: db.applicants.filter(a => a.status === '확인').length,
    won: db.applicants.filter(a => a.status === '당첨').length,
    cancelled: db.applicants.filter(a => a.status === '취소').length,
  };

  res.json({ applicants: list, stats });
});

// 7. Update Single Applicant (Status, Memo) (Admin only)
app.patch('/api/applicants/:id', (req, res) => {
  if (!checkAdminAuth(req)) {
    return res.status(401).json({ error: '관리자 인증이 필요합니다.' });
  }

  const { id } = req.params;
  const { status, memo, name, org, phone, email, gender } = req.body;
  const item = db.applicants.find(a => a.id === id);

  if (!item) {
    return res.status(404).json({ error: '신청자를 찾을 수 없습니다.' });
  }

  if (status) item.status = status;
  if (memo !== undefined) item.memo = memo;
  if (name) item.name = name.trim();
  if (org !== undefined) item.org = org.trim();
  if (phone) item.phone = String(phone).replace(/\D/g, '');
  if (email) item.email = email.trim();
  if (gender) item.gender = gender;

  saveDB();
  res.json({ success: true, applicant: item });
});

// 8. Delete Single Applicant (Admin only)
app.delete('/api/applicants/:id', (req, res) => {
  if (!checkAdminAuth(req)) {
    return res.status(401).json({ error: '관리자 인증이 필요합니다.' });
  }

  const { id } = req.params;
  const initialLen = db.applicants.length;
  db.applicants = db.applicants.filter(a => a.id !== id);

  if (db.applicants.length === initialLen) {
    return res.status(404).json({ error: '신청자를 찾을 수 없습니다.' });
  }

  saveDB();
  res.json({ success: true, remaining: db.applicants.length });
});

// 9. Lucky Draw (Random Winner Selection) (Admin only)
app.post('/api/admin/draw', (req, res) => {
  if (!checkAdminAuth(req)) {
    return res.status(401).json({ error: '관리자 인증이 필요합니다.' });
  }

  const { count, targetStatuses } = req.body;
  const drawCount = Math.max(1, parseInt(count, 10) || 1);
  const allowedStatuses = Array.isArray(targetStatuses) && targetStatuses.length > 0 ? targetStatuses : ['접수', '확인'];

  const eligible = db.applicants.filter(a => allowedStatuses.includes(a.status));
  if (eligible.length === 0) {
    return res.status(400).json({ error: '추첨 대상 상태의 신청자가 없습니다.' });
  }

  // Shuffle and pick winners
  const shuffled = [...eligible].sort(() => 0.5 - Math.random());
  const winners = shuffled.slice(0, Math.min(drawCount, eligible.length));
  const winnerIds = new Set(winners.map(w => w.id));

  const now = new Date().toISOString();
  db.applicants = db.applicants.map(a => {
    if (winnerIds.has(a.id)) {
      return {
        ...a,
        status: '당첨',
        drawnAt: now,
      };
    }
    return a;
  });

  saveDB();
  res.json({
    success: true,
    winnerCount: winners.length,
    winners: db.applicants.filter(a => winnerIds.has(a.id)),
  });
});

// 10. Batch Operations (Admin only)
app.post('/api/admin/batch', (req, res) => {
  if (!checkAdminAuth(req)) {
    return res.status(401).json({ error: '관리자 인증이 필요합니다.' });
  }

  const { action, ids, newStatus } = req.body;
  if (!Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({ error: '대상 항목을 선택해 주세요.' });
  }

  const idSet = new Set(ids);

  if (action === 'delete') {
    db.applicants = db.applicants.filter(a => !idSet.has(a.id));
  } else if (action === 'status' && newStatus) {
    db.applicants = db.applicants.map(a => {
      if (idSet.has(a.id)) {
        return { ...a, status: newStatus };
      }
      return a;
    });
  }

  saveDB();
  res.json({ success: true, count: ids.length });
});

// 11. Seed Sample Data (Admin only)
app.post('/api/admin/seed', (req, res) => {
  if (!checkAdminAuth(req)) {
    return res.status(401).json({ error: '관리자 인증이 필요합니다.' });
  }

  db.applicants = SAMPLE_APPLICANTS.map(a => ({
    ...a,
    id: 'app-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
    submittedAt: new Date(Date.now() - Math.floor(Math.random() * 86400000 * 5)).toISOString(),
  }));

  saveDB();
  res.json({ success: true, count: db.applicants.length });
});

// 12. Reset All Data (Admin only)
app.post('/api/admin/reset', (req, res) => {
  if (!checkAdminAuth(req)) {
    return res.status(401).json({ error: '관리자 인증이 필요합니다.' });
  }

  db.applicants = [];
  saveDB();
  res.json({ success: true });
});

// Vite middleware for development or static serving for production
async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Event Registration Server running on http://localhost:${PORT}`);
  });
}

startServer();

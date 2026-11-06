import {
  collection,
  doc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  where,
  writeBatch,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { Applicant, ApplicantStatus, EventConfig } from '../types';

const APPLICANTS_COL = 'applicants';
const CONFIG_COL = 'config';
const CONFIG_DOC_ID = 'event_main';

const DEFAULT_CONFIG: EventConfig = {
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

export const INITIAL_SEED_APPLICANTS: Applicant[] = [
  {
    id: 'app-fb-01',
    name: '김도현',
    org: '네이버 클라우드 플랫폼',
    phone: '01012345678',
    email: 'dohyun.kim@navercorp.com',
    gender: '남성',
    consent: true,
    consentAt: new Date(Date.now() - 86400000 * 3).toISOString(),
    submittedAt: new Date(Date.now() - 86400000 * 3).toISOString(),
    status: '당첨',
    memo: 'VIP 세션 초대장 발송 완료',
    drawnAt: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: 'app-fb-02',
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
    id: 'app-fb-03',
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
    id: 'app-fb-04',
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
    id: 'app-fb-05',
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
    id: 'app-fb-06',
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
    id: 'app-fb-07',
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
    id: 'app-fb-08',
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

let hasCheckedInitialSeed = false;

/**
 * Real-time listener for applicants in Firestore
 */
export function subscribeApplicants(
  onUpdate: (applicants: Applicant[]) => void,
  onError?: (err: Error) => void
): () => void {
  const colRef = collection(db, APPLICANTS_COL);

  const unsubscribe = onSnapshot(
    colRef,
    async snapshot => {
      // If collection is empty on first load, seed initial applicants
      if (snapshot.empty && !hasCheckedInitialSeed) {
        hasCheckedInitialSeed = true;
        try {
          await seedInitialApplicants();
          return;
        } catch (e) {
          console.error('Initial seed error:', e);
        }
      }
      hasCheckedInitialSeed = true;

      const items: Applicant[] = [];
      snapshot.forEach(docSnap => {
        const data = docSnap.data() as Applicant;
        items.push({
          ...data,
          id: docSnap.id,
        });
      });

      // Sort by submittedAt descending
      items.sort((a, b) => (b.submittedAt || '').localeCompare(a.submittedAt || ''));
      onUpdate(items);
    },
    error => {
      handleFirestoreError(error, OperationType.LIST, APPLICANTS_COL);
      if (onError) onError(error);
    }
  );

  return unsubscribe;
}

/**
 * Seed initial sample applicants to Firestore
 */
export async function seedInitialApplicants(): Promise<void> {
  const batch = writeBatch(db);
  for (const item of INITIAL_SEED_APPLICANTS) {
    const docRef = doc(db, APPLICANTS_COL, item.id);
    batch.set(docRef, item);
  }
  await batch.commit();
}

/**
 * Add or update an applicant (deduplicating by phone) in Firestore
 */
export async function saveApplicantToFirestore(applicantData: {
  name: string;
  org?: string;
  phone: string;
  email: string;
  gender: '남성' | '여성' | '선택 안 함';
  consent: boolean;
}): Promise<Applicant> {
  const rawPhone = applicantData.phone.replace(/\D/g, '');
  const now = new Date().toISOString();

  try {
    // Check for existing record by phone
    const q = query(collection(db, APPLICANTS_COL), where('phone', '==', rawPhone));
    const querySnap = await getDocs(q);

    let docId: string;
    let finalRecord: Applicant;

    if (!querySnap.empty) {
      // Update existing
      const existingDoc = querySnap.docs[0];
      docId = existingDoc.id;
      const prev = existingDoc.data() as Applicant;

      finalRecord = {
        ...prev,
        name: applicantData.name.trim(),
        org: (applicantData.org || '').trim(),
        email: applicantData.email.trim(),
        gender: applicantData.gender,
        consent: true,
        consentAt: now,
        submittedAt: now,
      };
      await updateDoc(doc(db, APPLICANTS_COL, docId), finalRecord as any);
    } else {
      // Create new
      docId = 'app-fb-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
      finalRecord = {
        id: docId,
        name: applicantData.name.trim(),
        org: (applicantData.org || '').trim(),
        phone: rawPhone,
        email: applicantData.email.trim(),
        gender: applicantData.gender,
        consent: true,
        consentAt: now,
        submittedAt: now,
        status: '접수',
        memo: '',
      };
      await setDoc(doc(db, APPLICANTS_COL, docId), finalRecord);
    }

    return finalRecord;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, APPLICANTS_COL);
    throw error;
  }
}

/**
 * Update an existing applicant's status, memo, or fields in Firestore
 */
export async function updateApplicantInFirestore(
  id: string,
  updates: Partial<Applicant>
): Promise<void> {
  const docRef = doc(db, APPLICANTS_COL, id);
  try {
    await updateDoc(docRef, updates as any);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `${APPLICANTS_COL}/${id}`);
    throw error;
  }
}

/**
 * Delete an applicant from Firestore
 */
export async function deleteApplicantFromFirestore(id: string): Promise<void> {
  const docRef = doc(db, APPLICANTS_COL, id);
  try {
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `${APPLICANTS_COL}/${id}`);
    throw error;
  }
}

/**
 * Batch update status for multiple applicants in Firestore
 */
export async function batchUpdateApplicantsInFirestore(
  ids: string[],
  newStatus: ApplicantStatus
): Promise<void> {
  const batch = writeBatch(db);
  ids.forEach(id => {
    const docRef = doc(db, APPLICANTS_COL, id);
    batch.update(docRef, { status: newStatus });
  });

  try {
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, APPLICANTS_COL);
    throw error;
  }
}

/**
 * Batch delete multiple applicants in Firestore
 */
export async function batchDeleteApplicantsInFirestore(ids: string[]): Promise<void> {
  const batch = writeBatch(db);
  ids.forEach(id => {
    const docRef = doc(db, APPLICANTS_COL, id);
    batch.delete(docRef);
  });

  try {
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, APPLICANTS_COL);
    throw error;
  }
}

/**
 * Execute lucky draw in Firestore
 */
export async function drawWinnersInFirestore(
  applicants: Applicant[],
  count: number,
  targetStatuses: string[]
): Promise<Applicant[]> {
  const eligible = applicants.filter(a => targetStatuses.includes(a.status));
  if (eligible.length === 0) {
    throw new Error('추첨 대상 후보자가 없습니다.');
  }

  const shuffled = [...eligible].sort(() => 0.5 - Math.random());
  const selectedWinners = shuffled.slice(0, Math.min(count, eligible.length));
  const now = new Date().toISOString();

  const batch = writeBatch(db);
  selectedWinners.forEach(w => {
    const docRef = doc(db, APPLICANTS_COL, w.id);
    batch.update(docRef, {
      status: '당첨',
      drawnAt: now,
    });
  });

  await batch.commit();
  return selectedWinners.map(w => ({ ...w, status: '당첨', drawnAt: now }));
}

/**
 * Reset all applicants in Firestore
 */
export async function resetAllApplicantsInFirestore(applicants: Applicant[]): Promise<void> {
  const batch = writeBatch(db);
  applicants.forEach(a => {
    const docRef = doc(db, APPLICANTS_COL, a.id);
    batch.delete(docRef);
  });
  await batch.commit();
}

/**
 * Real-time listener for Event Config in Firestore
 */
export function subscribeEventConfig(
  onUpdate: (config: EventConfig) => void
): () => void {
  const docRef = doc(db, CONFIG_COL, CONFIG_DOC_ID);

  return onSnapshot(
    docRef,
    async docSnap => {
      if (docSnap.exists()) {
        onUpdate(docSnap.data() as EventConfig);
      } else {
        // Initialize default config in Firestore
        await setDoc(docRef, DEFAULT_CONFIG);
        onUpdate(DEFAULT_CONFIG);
      }
    },
    error => {
      handleFirestoreError(error, OperationType.GET, `${CONFIG_COL}/${CONFIG_DOC_ID}`);
    }
  );
}

/**
 * Save updated Event Config to Firestore
 */
export async function saveEventConfigToFirestore(newConfig: EventConfig): Promise<void> {
  const docRef = doc(db, CONFIG_COL, CONFIG_DOC_ID);
  try {
    await setDoc(docRef, newConfig, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `${CONFIG_COL}/${CONFIG_DOC_ID}`);
    throw error;
  }
}

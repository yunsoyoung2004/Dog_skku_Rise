
// Firebase 데이터 관리 서비스
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  getDoc,
  doc,
  setDoc,
  query,
  where,
  writeBatch,
  Timestamp,
  orderBy,
  limit,
  onSnapshot
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { auth, db, storage } from './firebase';

// ============= USERS SERVICE =============

/**
 * 사용자 프로필 저장
 */
export const saveUserProfile = async (userId, userData) => {
  try {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      ...userData,
      updatedAt: Timestamp.now()
    });
    return { success: true, message: '프로필이 저장되었습니다' };
  } catch (error) {
    console.error('프로필 저장 오류:', error);
    throw error;
  }
};

/**
 * 사용자 프로필 조회
 */
export const getUserProfile = async (userId) => {
  try {
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);
    if (userSnap.exists()) {
      return userSnap.data();
    }
    return null;
  } catch (error) {
    console.error('프로필 조회 오류:', error);
    throw error;
  }
};

// ============= DOGS SERVICE =============

/**
 * 강아지 정보 추가
 */
export const addDog = async (userId, dogData) => {
  try {
    const dogsRef = collection(db, `users/${userId}/dogs`);
    const docRef = await addDoc(dogsRef, {
      ...dogData,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    });
    return { success: true, dogId: docRef.id };
  } catch (error) {
    console.error('강아지 추가 오류:', error);
    throw error;
  }
};

/**
 * 강아지 정보 수정
 */
export const updateDog = async (userId, dogId, dogData) => {
  try {
    const dogRef = doc(db, `users/${userId}/dogs`, dogId);
    await updateDoc(dogRef, {
      ...dogData,
      updatedAt: Timestamp.now()
    });
    return { success: true, message: '강아지 정보가 수정되었습니다' };
  } catch (error) {
    console.error('강아지 수정 오류:', error);
    throw error;
  }
};

/**
 * 강아지 정보 삭제
 */
export const deleteDog = async (userId, dogId) => {
  try {
    const dogRef = doc(db, `users/${userId}/dogs`, dogId);
    await deleteDoc(dogRef);
    return { success: true, message: '강아지가 삭제되었습니다' };
  } catch (error) {
    console.error('강아지 삭제 오류:', error);
    throw error;
  }
};

/**
 * 사용자의 모든 강아지 조회
 */
export const getUserDogs = async (userId) => {
  try {
    const dogsRef = collection(db, `users/${userId}/dogs`);
    const dogsSnap = await getDocs(dogsRef);
    const dogs = [];
    dogsSnap.forEach((doc) => {
      dogs.push({ ...doc.data(), id: doc.id });
    });
    return dogs;
  } catch (error) {
    console.error('강아지 조회 오류:', error);
    throw error;
  }
};

/**
 * 단일 강아지 조회 (강아지 수정 페이지용)
 */
export const getDog = async (userId, dogId) => {
  try {
    if (!userId || !dogId) return null;
    const dogRef = doc(db, `users/${userId}/dogs`, dogId);
    const snap = await getDoc(dogRef);
    if (!snap.exists()) return null;
    return { id: snap.id, ...snap.data() };
  } catch (error) {
    console.error('단일 강아지 조회 오류:', error);
    throw error;
  }
};

// ============= GROOMING HISTORY SERVICE =============

/**
 * 강아지 미용 내역 추가
 * metrics: { matting, coatQuality, shedding, environmentAdaptation, skinSensitivity }
 */
export const addGroomingHistory = async (userId, historyData) => {
  try {
    const colRef = collection(db, `users/${userId}/groomingHistory`);
    const now = Timestamp.now();
    const docRef = await addDoc(colRef, {
      dogName: historyData.dogName || '',
      date: historyData.date || '',
      designerName: historyData.designerName || '',
      title: historyData.title || '',
      metrics: {
        matting: Number(historyData.metrics?.matting ?? 0),
        coatQuality: Number(historyData.metrics?.coatQuality ?? 0),
        shedding: Number(historyData.metrics?.shedding ?? 0),
        environmentAdaptation: Number(historyData.metrics?.environmentAdaptation ?? 0),
        skinSensitivity: Number(historyData.metrics?.skinSensitivity ?? 0),
      },
      comment: historyData.comment || '',
      createdAt: now,
      updatedAt: now,
    });
    return { success: true, id: docRef.id };
  } catch (error) {
    console.error('미용 내역 추가 오류:', error);
    throw error;
  }
};

/**
 * 최근 미용 내역 1건 조회 (없으면 null)
 */
export const getLatestGroomingHistory = async (userId) => {
  try {
    const colRef = collection(db, `users/${userId}/groomingHistory`);
    const qSnap = await getDocs(query(colRef, orderBy('createdAt', 'desc'), limit(1)));

    if (qSnap.empty) {
      return null;
    }

    const docSnap = qSnap.docs[0];
    const data = docSnap.data();
    let dateLabel = data.date;
    if (!dateLabel) {
      const ts = data.createdAt;
      if (ts && ts.toDate) {
        dateLabel = ts.toDate().toLocaleDateString('ko-KR');
      }
    }

    return {
      id: docSnap.id,
      dogName: data.dogName || '',
      date: dateLabel || '',
      designerName: data.designerName || '',
      title: data.title || '',
      metrics: {
        matting: Number(data.metrics?.matting ?? 0),
        environmentAdaptation: Number(data.metrics?.environmentAdaptation ?? 0),
        shedding: Number(data.metrics?.shedding ?? 0),
        coatQuality: Number(data.metrics?.coatQuality ?? 0),
        skinSensitivity: Number(data.metrics?.skinSensitivity ?? 0),
      },
      comment: data.comment || '',
    };
  } catch (error) {
    console.error('최근 미용 내역 조회 오류:', error);
    throw error;
  }
};

/**
 * 현재 보여지는 미용 내역 삭제
 */
export const deleteGroomingHistory = async (userId, historyId) => {
  try {
    const refDoc = doc(db, `users/${userId}/groomingHistory`, historyId);
    await deleteDoc(refDoc);
    return { success: true };
  } catch (error) {
    console.error('미용 내역 삭제 오류:', error);
    throw error;
  }
};

/**
 * 미용 통계: 총 미용 횟수(=내역 개수)
 */
export const getGroomingStats = async (userId) => {
  try {
    const colRef = collection(db, `users/${userId}/groomingHistory`);
    const snap = await getDocs(colRef);
    const count = snap.size;
    return {
      totalGroomings: count,
    };
  } catch (error) {
    console.error('미용 통계 조회 오류:', error);
    throw error;
  }
};

// ============= BOOKINGS SERVICE =============

/**
 * 예약 생성
 */
export const createBooking = async (userId, bookingData) => {
  try {
    const bookingsRef = collection(db, 'bookings');
    const bookingId = `BK${Date.now()}`;
    
    const docRef = await addDoc(bookingsRef, {
      bookingId,
      userId,
      ...bookingData,
      status: 'pending',
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    });
    
    return { success: true, bookingId, docId: docRef.id };
  } catch (error) {
    console.error('예약 생성 오류:', error);
    throw error;
  }
};

/**
 * 사용자의 예약 조회
 */
export const getUserBookings = async (userId) => {
  try {
    const bookingsRef = collection(db, 'bookings');
    const q = query(bookingsRef, where('userId', '==', userId));
    const bookingsSnap = await getDocs(q);
    const bookings = [];
    bookingsSnap.forEach((doc) => {
      bookings.push({ ...doc.data(), docId: doc.id });
    });
    return bookings.sort((a, b) => b.createdAt - a.createdAt);
  } catch (error) {
    console.error('예약 조회 오류:', error);
    throw error;
  }
};

/**
 * 예약 취소
 */
export const cancelBooking = async (bookingDocId) => {
  try {
    const bookingRef = doc(db, 'bookings', bookingDocId);
    await updateDoc(bookingRef, {
      status: 'cancelled',
      cancelledAt: Timestamp.now()
    });
    return { success: true };
  } catch (error) {
    console.error('예약 취소 오류:', error);
    throw error;
  }
};

// ============= QUOTES SERVICE =============

/**
 * 견적 요청 생성 (사용자 → 디자이너)
 * - quoteRequests 컬렉션에 저장
 */
export const createQuoteRequest = async (userId, designerId, payload) => {
  try {
    console.log('\n🔧 [services.js] createQuoteRequest 호출:', { 
      userId, 
      designerId,
      dogId: payload.dogId,
      dogName: payload.dogName,
      hasQuoteData: !!payload.quoteData,
      roomId: payload.roomId || null
    });
    
    const quotesRef = collection(db, 'quoteRequests');
    const documentData = {
      userId,
      designerId,
      designerName: payload.designerName || '',
      dogId: payload.dogId || '',
      dogName: payload.dogName || '',
      breed: payload.breed || '',
      weight: payload.weight ?? null,
      // 채팅에서 온 견적 요청인 경우, 연결된 채팅방 ID 저장
      roomId: payload.roomId || '',
      // 견적 폼에서 넘어온 세부 옵션들
      ...(payload.quoteData || {}),
      status: 'pending',
      createdAt: Timestamp.now()
    };
    
    console.log('💾 [Firestore] addDoc 호출 - quoteRequests 컬렉션에 저장 시작');
    const docRef = await addDoc(quotesRef, documentData);
    
    console.log('✅ [Firestore] 저장 완료:', {
      docId: docRef.id,
      path: `quoteRequests/${docRef.id}`,
      documentData
    });
    
    return { 
      success: true, 
      quoteId: docRef.id,
      message: '견적 요청이 생성되었습니다.'
    };
  } catch (error) {
    console.error('❌ [services.js] createQuoteRequest 오류:', error);
    throw error;
  }
};

/**
 * 디자이너가 견적서 전송/수정 (디자이너 → 사용자)
 * - quotes 컬렉션에 저장
 * - 동일한 요청(quoteRequest)에 대해 한 번 더 보내면 update 로 동작 (수정하기)
 */
export const sendDesignerQuote = async (designerId, requestId, quoteRequest, payload) => {
  try {
    console.log('🎯 sendDesignerQuote 호출:', { 
      designerId, 
      requestId, 
      userId: quoteRequest?.userId,
      amount: payload.amount 
    });
    const quotesRef = collection(db, 'quotes');

    // 같은 요청 + 같은 디자이너의 견적이 이미 있는지 확인 (수정 모드 지원)
    const existingQ = query(
      quotesRef,
      where('designerId', '==', designerId),
      where('requestId', '==', requestId)
    );
    const existingSnap = await getDocs(existingQ);
    console.log('  📋 기존 견적 확인:', existingSnap.size, '개');

    const baseData = {
      userId: quoteRequest?.userId,
      designerId,
      requestId,
      dogId: quoteRequest?.dogId || '',
      dogName: quoteRequest?.dogName || '',
      breed: quoteRequest?.breed || '',
      // 관련 채팅방과 연결 (있다면)
      chatRoomId: quoteRequest?.roomId || '',
      // 사용자가 견적 폼에서 입력했던 원본 요청 정보 (요약용)
      knowledge: quoteRequest?.knowledge || '',
      groomingStyle: quoteRequest?.groomingStyle || '',
      additionalGrooming: Array.isArray(quoteRequest?.additionalGrooming)
        ? quoteRequest.additionalGrooming
        : [],
      additionalOptions: Array.isArray(quoteRequest?.additionalOptions)
        ? quoteRequest.additionalOptions
        : [],
      dogTags: Array.isArray(quoteRequest?.dogTags) ? quoteRequest.dogTags : [],
      preferredDate: quoteRequest?.preferredDate || '',
      preferredTime: quoteRequest?.preferredTime || '',
      requestNotes: quoteRequest?.notes || '',
      // 견적 상세 정보 (디자이너가 입력한 내용)
      price: Number(payload.amount || 0),
      message: payload.message || '',
      // 서비스 태그: 폼에서 들어온 옵션들을 합쳐서 저장
      services: [
        ...(quoteRequest?.groomingStyle ? [quoteRequest.groomingStyle] : []),
        ...(Array.isArray(quoteRequest?.additionalOptions) ? quoteRequest.additionalOptions : []),
        ...(Array.isArray(quoteRequest?.dogTags) ? quoteRequest.dogTags : []),
      ],
      // 디자이너 표시용 정보 (있으면)
      designerName: quoteRequest?.designerName || '',
      designerImage: quoteRequest?.designerImage || '',
      // 사용자 페이지에서 날짜 표시용 숫자 타임스탬프
      timestamp: Date.now(),
      status: 'sent',
    };
    console.log('  💾 저장할 데이터:', { userId: baseData.userId, designerId: baseData.designerId, dogName: baseData.dogName });

    let quoteId;

    if (!existingSnap.empty) {
      // 이미 견적이 있으면 수정 모드: 금액/메시지/서비스만 업데이트
      const docSnap = existingSnap.docs[0];
      const quoteRef = doc(db, 'quotes', docSnap.id);
      console.log('  🔄 [UPDATE] 기존 견적 수정:', { quoteId: docSnap.id, newPrice: baseData.price });
      await updateDoc(quoteRef, {
        price: baseData.price,
        message: baseData.message,
        services: baseData.services,
        timestamp: baseData.timestamp,
        status: baseData.status,
        updatedAt: Timestamp.now(),
      });
      quoteId = docSnap.id;
      console.log('  ✅ [UPDATE] 수정 완료:', docSnap.id);
    } else {
      // 최초 전송: 새 문서 생성
      console.log('  ➕ [INSERT] 새 견적 생성:', { price: baseData.price });
      const docRef = await addDoc(quotesRef, {
        ...baseData,
        createdAt: Timestamp.now(),
      });
      quoteId = docRef.id;
      console.log('  ✅ [INSERT] 생성 완료:', { docId: docRef.id, path: `quotes/${docRef.id}` });
    }

    // 관련 quoteRequest 상태도 갱신 (디자이너가 답변 보냄)
    try {
      console.log('  🔗 [UPDATE] quoteRequest 상태 갱신:', { requestId, newStatus: 'responded' });
      const requestRef = doc(db, 'quoteRequests', requestId);
      await updateDoc(requestRef, {
        status: 'responded',
        lastQuotedAt: Timestamp.now(),
        lastQuoteId: quoteId,
      });
      console.log('  ✅ [UPDATE] quoteRequest 갱신 완료');
    } catch (e) {
      console.warn('quoteRequest 상태 업데이트 실패 (무시 가능):', e);
    }

    console.log('✅ [services.js] sendDesignerQuote 완료\n');
    return { success: true, quoteId };
  } catch (error) {
    console.error('견적 전송/수정 오류:', error);
    throw error;
  }
};

/**
 * 사용자가 받은 최종 견적 조회 (디자이너 → 사용자)
 * - quotes 컬렉션 기준
 */
export const getUserQuotes = async (userId) => {
  try {
    console.log('🔍 [getUserQuotes] 조회 시작:', { userId });
    const quotesRef = collection(db, 'quotes');
    const q = query(quotesRef, where('userId', '==', userId));
    const quotesSnap = await getDocs(q);
    const quotes = [];
    quotesSnap.forEach((doc) => {
      const data = doc.data();
      console.log('  📄 Document found:', { 
        docId: doc.id,
        userId: data.userId,
        designerId: data.designerId,
        dogName: data.dogName,
        price: data.price
      });
      quotes.push({ ...data, id: doc.id });
    });
    // 최신순 정렬 (timestamp 숫자 기반)
    const sorted = quotes.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
    console.log('✅ [getUserQuotes] 조회 완료:', { totalCount: sorted.length });
    return sorted;
  } catch (error) {
    console.error('견적 조회 오류:', error);
    throw error;
  }
};

/**
 * 디자이너가 받은 견적 요청 조회
 * - designerId로 quoteRequests 컬렉션 조회
 * - 최신순 정렬
 */
export const getDesignerQuoteRequests = async (designerId) => {
  try {
    console.log('🔎 [getDesignerQuoteRequests] 시작:', { designerId });
    const requestsRef = collection(db, 'quoteRequests');
    const q = query(requestsRef, where('designerId', '==', designerId));
    const requestsSnap = await getDocs(q);
    console.log('📚 [getDesignerQuoteRequests] 조회 완료:', {
      totalDocuments: requestsSnap.size,
      documents: requestsSnap.docs.map(doc => ({
        id: doc.id,
        userId: doc.data().userId,
        dogName: doc.data().dogName,
        status: doc.data().status
      }))
    });
    const requests = [];
    requestsSnap.forEach((doc) => {
      requests.push({ ...doc.data(), id: doc.id });
    });
    // 최신순 정렬
    const sorted = requests.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
    console.log('✅ [getDesignerQuoteRequests] 정렬 완료:', { finalCount: sorted.length });
    return sorted;
  } catch (error) {
    console.error('❌ [getDesignerQuoteRequests] 견적 요청 조회 오류:', error);
    throw error;
  }
};

/**
 * 채팅에서 사용자가 최신 견적을 "확정"할 때 사용
 * - userId + designerId 조합으로 가장 최근 quotes 1개를 찾아 status를 confirmed로 변경
 * - 관련 quoteRequest가 있으면 그쪽 status도 confirmed로 갱신
 */
export const confirmLatestQuote = async (userId, designerId) => {
  try {
    console.log('\n🔧 [services.js] confirmLatestQuote 호출:', { userId, designerId });
    
    const quotesRef = collection(db, 'quotes');
    const q = query(
      quotesRef,
      where('userId', '==', userId),
      where('designerId', '==', designerId),
      orderBy('timestamp', 'desc'),
      limit(1)
    );

    console.log('🔍 [Firestore] quotes 컬렉션 조회 중...');
    const snap = await getDocs(q);
    console.log('📊 [Firestore] 조회 결과:', snap.size, '개');
    
    if (snap.empty) {
      console.log('⚠️  [ERROR] 확정할 견적 없음');
      return { success: false, reason: 'NO_QUOTE' };
    }

    const docSnap = snap.docs[0];
    const data = docSnap.data();
    console.log('✅ [Firestore] 최신 견적 발견:', {
      quoteId: docSnap.id,
      currentStatus: data.status,
      price: data.price,
      timestamp: data.timestamp
    });
    
    const quoteRef = doc(db, 'quotes', docSnap.id);
    console.log('🔄 [Firestore] quotes status 업데이트: confirmed');
    await updateDoc(quoteRef, {
      status: 'confirmed',
      confirmedAt: Timestamp.now(),
    });
    console.log('✅ [Firestore] quotes 상태 업데이트 완료');

    // 연결된 quoteRequest 상태도 가능하면 함께 갱신
    if (data.requestId) {
      try {
        console.log('🔗 [Firestore] quoteRequest 상태 갱신:', { requestId: data.requestId });
        const requestRef = doc(db, 'quoteRequests', data.requestId);
        await updateDoc(requestRef, {
          status: 'confirmed',
          confirmedAt: Timestamp.now(),
        });
        console.log('✅ [Firestore] quoteRequest 상태 업데이트 완료');
      } catch (e) {
        console.warn('quoteRequest 확정 상태 업데이트 실패(무시 가능):', e);
      }
    }

    console.log('✅ [services.js] confirmLatestQuote 완료\n');
    return { success: true, quoteId: docSnap.id, quote: { id: docSnap.id, ...data } };
  } catch (error) {
    console.error('❌ [services.js] 견적 확정 오류:', error);
    throw error;
  }
};

/**
 * 사용자가 보낸 견적 요청 내역 조회 (user → designer)
 * - quoteRequests 컬렉션 기준
 */
export const getUserQuoteRequests = async (userId) => {
  try {
    const reqRef = collection(db, 'quoteRequests');
    const q = query(reqRef, where('userId', '==', userId));
    const snap = await getDocs(q);
    const list = [];
    snap.forEach((docSnap) => {
      list.push({ id: docSnap.id, ...docSnap.data() });
    });
    // 최신순 정렬
    return list.sort((a, b) => {
      const at = a.createdAt?.toMillis ? a.createdAt.toMillis() : a.createdAt || 0;
      const bt = b.createdAt?.toMillis ? b.createdAt.toMillis() : b.createdAt || 0;
      return bt - at;
    });
  } catch (error) {
    console.error('보낸 견적 요청 조회 오류:', error);
    throw error;
  }
};

/**
 * 사용자가 보낸 견적 요청 개수 (카운트)
 * - quoteRequests 컬렉션 기준
 */
export const getUserQuoteRequestsCount = async (userId) => {
  try {
    const reqRef = collection(db, 'quoteRequests');
    const q = query(reqRef, where('userId', '==', userId));
    const snap = await getDocs(q);
    return snap.size || 0;
  } catch (error) {
    console.error('보낸 견적 요청 개수 조회 오류:', error);
    return 0;
  }
};

// ============= SEARCH HISTORY SERVICE =============

/**
 * 최근 검색어 저장 (users/{userId}/searchHistory)
 */
export const addRecentSearch = async (userId, keyword) => {
  try {
    const historyRef = collection(db, `users/${userId}/searchHistory`);
    await addDoc(historyRef, {
      keyword,
      createdAt: Timestamp.now(),
    });
    return { success: true };
  } catch (error) {
    console.error('최근 검색어 저장 오류:', error);
    throw error;
  }
};

/**
 * 최근 검색어 조회 (최신순, 기본 5개)
 */
export const getRecentSearches = async (userId, limitCount = 5) => {
  try {
    const historyRef = collection(db, `users/${userId}/searchHistory`);
    const q = query(historyRef, orderBy('createdAt', 'desc'), limit(limitCount));
    const snap = await getDocs(q);
    const items = [];
    snap.forEach((docSnap) => {
      const data = docSnap.data();
      if (data.keyword) {
        items.push(data.keyword);
      }
    });
    // 중복 제거 유지 (최근 순서)
    const seen = new Set();
    const unique = [];
    for (const k of items) {
      if (!seen.has(k)) {
        seen.add(k);
        unique.push(k);
      }
    }
    return unique;
  } catch (error) {
    console.error('최근 검색어 조회 오류:', error);
    throw error;
  }
};

// ============= REVIEWS SERVICE =============

/**
 * 리뷰 작성
 */
export const createReview = async (userId, reviewData) => {
  try {
    const reviewsRef = collection(db, 'reviews');
    const docRef = await addDoc(reviewsRef, {
      userId,
      ...reviewData,
      createdAt: Timestamp.now()
    });
    return { success: true, reviewId: docRef.id };
  } catch (error) {
    console.error('리뷰 작성 오류:', error);
    throw error;
  }
};

/**
 * 디자이너의 리뷰 조회
 */
export const getDesignerReviews = async (designerId) => {
  try {
    const reviewsRef = collection(db, 'reviews');
    const q = query(reviewsRef, where('designerId', '==', designerId));
    const reviewsSnap = await getDocs(q);
    const reviews = [];
    reviewsSnap.forEach((doc) => {
      reviews.push({ ...doc.data(), id: doc.id });
    });
    return reviews;
  } catch (error) {
    console.error('디자이너 리뷰 조회 오류:', error);
    throw error;
  }
};

// ============= MESSAGES SERVICE =============

/**
 * 채팅 메시지 전송 (단순화 버전)
 * - Firestore에 메시지 저장만 수행
 */
export const sendMessage = async (chatRoomId, messageData) => {
  try {
    console.log('\n📤 [sendMessage] 호출:', {
      chatRoomId: chatRoomId.substring(0, 10) + '...',
      senderType: messageData.senderType,
      textLen: messageData.text?.length || 0
    });
    
    const messagesRef = collection(db, `chatRooms/${chatRoomId}/messages`);
    const docRef = await addDoc(messagesRef, {
      ...messageData,
      timestamp: Timestamp.now()
    });
    console.log('✅ [sendMessage] 저장 완료:', docRef.id);

    try {
      const roomRef = doc(db, 'chatRooms', chatRoomId);
      await updateDoc(roomRef, {
        lastMessage: messageData.text || '',
        lastMessageTime: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });
    } catch (e) {
      console.warn('⚠️  채팅방 업데이트 실패:', e.message);
    }

    return { success: true, messageId: docRef.id };
  } catch (error) {
    console.error('❌ [sendMessage] 오류:', error.message);
    throw error;
  }
};

/**
 * 채팅 메시지 조회
 */
export const getChatMessages = async (chatRoomId) => {
  try {
    const messagesRef = collection(db, `chatRooms/${chatRoomId}/messages`);
    const q = query(messagesRef);
    const messagesSnap = await getDocs(q);
    const messages = [];
    messagesSnap.forEach((doc) => {
      messages.push({ ...doc.data(), id: doc.id });
    });
    return messages.sort((a, b) => a.timestamp - b.timestamp);
  } catch (error) {
    console.error('메시지 조회 오류:', error);
    throw error;
  }
};

/**
 * 채팅방 생성 또는 조회 (사용자 ↔ 디자이너 1:1)
 */
export const createOrGetChatRoom = async (userId, designerId, meta = {}) => {
  try {
    const roomsRef = collection(db, 'chatRooms');

    // 동일한 사용자-디자이너 조합의 채팅방이 이미 있으면 재사용
    const q = query(
      roomsRef,
      where('userId', '==', userId),
      where('designerId', '==', designerId)
    );
    const snap = await getDocs(q);

    if (!snap.empty) {
      const existing = snap.docs[0];
      return { id: existing.id, ...existing.data() };
    }

    const now = Timestamp.now();
    const docRef = await addDoc(roomsRef, {
      userId,
      designerId,
      designerName: meta.designerName || '',
      designerAvatar: meta.designerAvatar || '',
      status: 'pending',
      lastMessage: '',
      lastMessageTime: '',
      createdAt: now,
      updatedAt: now,
    });

    return {
      id: docRef.id,
      userId,
      designerId,
      designerName: meta.designerName || '',
      designerAvatar: meta.designerAvatar || '',
      status: 'pending',
      lastMessage: '',
      lastMessageTime: '',
      createdAt: now,
      updatedAt: now,
    };
  } catch (error) {
    console.error('채팅방 생성/조회 오류:', error);
    throw error;
  }
};

// ============= NOTIFICATIONS SERVICE =============

/**
 * 알림 생성
 */
export const createNotification = async (userId, notificationData) => {
  try {
    const notificationsRef = collection(db, `users/${userId}/notifications`);
    const now = Timestamp.now();
    
    const docRef = await addDoc(notificationsRef, {
      ...notificationData,
      createdAt: now,
      isRead: false,
    });

    // 사용자의 unreadNotificationCount 증가
    // Firestore 규칙상, users/{userId} 문서는 해당 사용자 본인만 수정 가능
    // (채팅 상대/디자이너가 대신 수정하려고 하면 권한 오류가 발생함)
    // 따라서 현재 로그인한 사용자가 userId와 동일한 경우에만 카운트를 갱신하고,
    // 그 외에는 카운트 갱신을 건너뛰어 알림 생성 자체는 항상 성공하게 둔다.
    const currentUser = auth.currentUser;
    if (currentUser && currentUser.uid === userId) {
      try {
        const userRef = doc(db, 'users', userId);
        const userSnap = await getDoc(userRef);
        const currentCount = userSnap.data()?.unreadNotificationCount || 0;

        await updateDoc(userRef, {
          unreadNotificationCount: currentCount + 1,
        });
      } catch (countError) {
        console.warn('unreadNotificationCount 갱신 실패(알림 항목 생성은 완료됨):', countError);
      }
    }

    return { id: docRef.id, ...notificationData };
  } catch (error) {
    console.error('알림 생성 오류:', error);
    throw error;
  }
};

/**
 * 지난 예약 중 리뷰가 없는 건에 대해
 * "어떠셨나요? 리뷰를 남겨주세요" 알림 생성
 */
export const notifyPendingReviews = async (userId) => {
  try {
    const bookingsRef = collection(db, 'bookings');
    const q = query(bookingsRef, where('userId', '==', userId));
    const snap = await getDocs(q);

    const now = new Date();
    const toDate = (tsOrDate) => {
      if (!tsOrDate) return null;
      return tsOrDate.toDate ? tsOrDate.toDate() : new Date(tsOrDate);
    };

    const targets = [];

    snap.forEach((docSnap) => {
      const data = docSnap.data();
      const d = toDate(data.bookingDate);
      if (!d) return;

      const isPast = d < now;
      const isCancelled = data.status === 'cancelled';
      const hasReview = data.hasReview === true;
      const notified = data.reviewNotificationSent === true;

      if (isPast && !isCancelled && !hasReview && !notified) {
        targets.push({ id: docSnap.id, ...data, bookingDate: d });
      }
    });

    for (const booking of targets) {
      try {
        await createNotification(userId, {
          title: '어떠셨나요? 리뷰를 남겨주세요',
          message: `${booking.designerName || '디자이너'}와의 미용이 완료되었습니다. 후기를 남겨주세요.`,
          type: 'review',
          bookingId: booking.bookingId || booking.id,
          designerId: booking.designerId || '',
          designerName: booking.designerName || '',
        });

        const bookingRef = doc(db, 'bookings', booking.id);
        await updateDoc(bookingRef, {
          reviewNotificationSent: true,
        });
      } catch (innerErr) {
        console.warn('리뷰 알림 생성/표시 실패(무시 가능):', innerErr);
      }
    }
  } catch (error) {
    console.error('리뷰 알림 체크 오류:', error);
  }
};

/**
 * 알림 조회 (사용자)
 */
export const getUserNotifications = async (userId) => {
  try {
    const notificationsRef = collection(db, `users/${userId}/notifications`);
    const q = query(notificationsRef, orderBy('createdAt', 'desc'), limit(50));
    const snap = await getDocs(q);
    
    const notifications = [];
    snap.forEach((doc) => {
      notifications.push({ id: doc.id, ...doc.data() });
    });
    
    return notifications;
  } catch (error) {
    console.error('알림 조회 오류:', error);
    throw error;
  }
};

/**
 * 알림 읽음 처리
 */
export const markNotificationAsRead = async (userId, notificationId) => {
  try {
    const notifRef = doc(db, `users/${userId}/notifications`, notificationId);
    await updateDoc(notifRef, { isRead: true });
    
    // 사용자의 unreadNotificationCount 감소
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);
    const currentCount = userSnap.data()?.unreadNotificationCount || 0;
    
    if (currentCount > 0) {
      await updateDoc(userRef, {
        unreadNotificationCount: currentCount - 1,
      });
    }
  } catch (error) {
    console.error('알림 읽음 처리 오류:', error);
    throw error;
  }
};

/**
 * 알림 삭제
 */
export const deleteNotification = async (userId, notificationId) => {
  try {
    const notifRef = doc(db, `users/${userId}/notifications`, notificationId);
    await deleteDoc(notifRef);
  } catch (error) {
    console.error('알림 삭제 오류:', error);
    throw error;
  }
};

// ============= FAVORITES SERVICE =============

/**
 * 즐겨찾기 추가
 * - 디자이너 기본 정보도 함께 저장해서 마이페이지/즐겨찾기 화면에서 바로 표시
 */
export const addFavorite = async (userId, designerId, designerMeta = {}) => {
  try {
    const favoritesRef = collection(db, `users/${userId}/favorites`);
    const docRef = await addDoc(favoritesRef, {
      designerId,
      name: designerMeta.name || '',
      image: designerMeta.image || '',
      rating: designerMeta.rating ?? 0,
      reviews: designerMeta.reviews ?? 0,
      priceMin: designerMeta.priceMin ?? 0,
      priceMax: designerMeta.priceMax ?? 0,
      specialty: designerMeta.specialty || '',
      createdAt: Timestamp.now()
    });
    return { success: true };
  } catch (error) {
    console.error('즐겨찾기 추가 오류:', error);
    throw error;
  }
};

/**
 * 즐겨찾기 제거
 */
export const removeFavorite = async (userId, designerId) => {
  try {
    const favoritesRef = collection(db, `users/${userId}/favorites`);
    const q = query(favoritesRef, where('designerId', '==', designerId));
    const snap = await getDocs(q);

    const batchDeletes = [];
    snap.forEach((docSnap) => {
      batchDeletes.push(docSnap.id);
    });

    // 개수가 많지 않으므로 순차 삭제
    for (const id of batchDeletes) {
      const favoriteRef = doc(db, `users/${userId}/favorites`, id);
      await deleteDoc(favoriteRef);
    }
    return { success: true };
  } catch (error) {
    console.error('즐겨찾기 제거 오류:', error);
    throw error;
  }
};

/**
 * 사용자의 즐겨찾기 조회
 */
export const getUserFavorites = async (userId) => {
  try {
    const favoritesRef = collection(db, `users/${userId}/favorites`);
    const favoritesSnap = await getDocs(favoritesRef);
    const favorites = [];
    favoritesSnap.forEach((doc) => {
      favorites.push({ ...doc.data(), id: doc.id });
    });
    return favorites;
  } catch (error) {
    console.error('즐겨찾기 조회 오류:', error);
    throw error;
  }
};

// ============= DESIGNERS SERVICE =============

/**
 * 모든 디자이너 조회
 */
export const getAllDesigners = async () => {
  try {
    const designersRef = collection(db, 'designers');
    const designersSnap = await getDocs(designersRef);
    const designers = [];
    designersSnap.forEach((doc) => {
      designers.push({ ...doc.data(), id: doc.id });
    });
    return designers;
  } catch (error) {
    console.error('디자이너 조회 오류:', error);
    throw error;
  }
};

/**
 * 디자이너 공개 프로필 동기화
 * - 디자이너가 마이페이지/포트폴리오에서 정보를 등록하면,
 *   사용자용 검색/리스트에서 볼 수 있도록 designers 컬렉션에 반영
 */
export const upsertDesignerPublicProfile = async (designerId, data) => {
  try {
    const designerRef = doc(db, 'designers', designerId);
    const payload = {
      name: data.name || '',
      location: data.location || '',
      image: data.photoURL || '',
      bio: data.bio || '',
      portfolioIntro: data.portfolioIntro || '',
      announcements: data.announcements || '',
      paymentInfo: data.paymentInfo || '',
      supportInfo: data.supportInfo || '',
      // 기본값: 아직 없으면 0으로 시작
      rating: data.rating ?? 0,
      reviews: data.reviews ?? 0,
      priceMin: data.priceMin ?? 0,
      priceMax: data.priceMax ?? 0,
      updatedAt: Timestamp.now(),
    };
    await setDoc(designerRef, payload, { merge: true });
    return { success: true };
  } catch (error) {
    console.error('디자이너 공개 프로필 동기화 오류:', error);
    throw error;
  }
};

/**
 * 디자이너 검색 (위치, 가격, 평점)
 */
export const searchDesigners = async (filters) => {
  try {
    let designersRef = collection(db, 'designers');
    const designersSnap = await getDocs(designersRef);
    
    let results = [];
    designersSnap.forEach((doc) => {
      const designer = { ...doc.data(), id: doc.id };
      let isMatch = true;
      
      if (filters.location && !designer.location?.includes(filters.location)) {
        isMatch = false;
      }
      if (filters.minPrice && designer.price < filters.minPrice) {
        isMatch = false;
      }
      if (filters.maxPrice && designer.price > filters.maxPrice) {
        isMatch = false;
      }
      if (filters.minRating && (!designer.rating || designer.rating < filters.minRating)) {
        isMatch = false;
      }
      
      if (isMatch) {
        results.push(designer);
      }
    });
    
    return results;
  } catch (error) {
    console.error('디자이너 검색 오류:', error);
    throw error;
  }
};

// ============= IMAGE UPLOAD SERVICE (추후 구현) =============

/**
 * 강아지 이미지 업로드
 * @param {string} userId - 사용자 ID
 * @param {string} dogId - 강아지 ID
 * @param {File} imageFile - 이미지 파일
 * @returns {Promise} - 업로드된 이미지 URL
 */
export const uploadDogImage = async (userId, dogId, imageFile) => {
  try {
    // 파일 타입 검증
    if (!imageFile.type.startsWith('image/')) {
      throw new Error('이미지 파일만 업로드 가능합니다');
    }

    // 파일 크기 검증 (5MB 제한)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (imageFile.size > maxSize) {
      throw new Error('파일 크기는 5MB 이하여야 합니다');
    }

    const timestamp = Date.now();
    const fileName = `${timestamp}_${imageFile.name}`;
    const storageRef = ref(storage, `users/${userId}/dogs/${dogId}/${fileName}`);
    
    // 이미지 업로드
    const snapshot = await uploadBytes(storageRef, imageFile);
    const downloadURL = await getDownloadURL(snapshot.ref);
    
    return { success: true, url: downloadURL, fileName };
  } catch (error) {
    console.error('강아지 이미지 업로드 오류:', error);
    throw error;
  }
};

/**
 * 후기 이미지 업로드
 * @param {string} userId - 사용자 ID
 * @param {string} reviewId - 후기 ID
 * @param {File} imageFile - 이미지 파일
 * @returns {Promise} - 업로드된 이미지 URL
 */
export const uploadReviewImage = async (userId, reviewId, imageFile) => {
  try {
    // 파일 타입 검증
    if (!imageFile.type.startsWith('image/')) {
      throw new Error('이미지 파일만 업로드 가능합니다');
    }

    // 파일 크기 검증 (5MB 제한)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (imageFile.size > maxSize) {
      throw new Error('파일 크기는 5MB 이하여야 합니다');
    }

    const timestamp = Date.now();
    const fileName = `${timestamp}_${imageFile.name}`;
    const storageRef = ref(storage, `users/${userId}/reviews/${reviewId}/${fileName}`);
    
    // 이미지 업로드
    const snapshot = await uploadBytes(storageRef, imageFile);
    const downloadURL = await getDownloadURL(snapshot.ref);
    
    return { success: true, url: downloadURL, fileName };
  } catch (error) {
    console.error('후기 이미지 업로드 오류:', error);
    throw error;
  }
};

/**
 * 디자이너 프로필 이미지 업로드 (선택 사항)
 * @param {string} designerId - 디자이너 사용자 ID
 * @param {File} imageFile - 업로드할 이미지 파일
 * @returns {Promise<{success: boolean, url: string, fileName: string}>}
 */
export const uploadDesignerProfileImage = async (designerId, imageFile) => {
  try {
    if (!imageFile.type.startsWith('image/')) {
      throw new Error('이미지 파일만 업로드 가능합니다');
    }

    const maxSize = 5 * 1024 * 1024;
    if (imageFile.size > maxSize) {
      throw new Error('파일 크기는 5MB 이하여야 합니다');
    }

    const timestamp = Date.now();
    const fileName = `${timestamp}_${imageFile.name}`;
    const storageRef = ref(storage, `designers/${designerId}/profile/${fileName}`);

    const snapshot = await uploadBytes(storageRef, imageFile);
    const downloadURL = await getDownloadURL(snapshot.ref);

    return { success: true, url: downloadURL, fileName };
  } catch (error) {
    console.error('디자이너 프로필 이미지 업로드 오류:', error);
    throw error;
  }
};

// 기본 export 객체 (모든 서비스 함수 포함)
export default {
  // Users
  saveUserProfile,
  getUserProfile,
  // Dogs
  addDog,
  updateDog,
  deleteDog,
  getUserDogs,
  getLatestGroomingHistory,
  // Bookings
  createBooking,
  getUserBookings,
  cancelBooking,
  // Quotes
  createQuoteRequest,
  getUserQuotes,
  confirmLatestQuote,
  addRecentSearch,
  getRecentSearches,
  // Reviews
  createReview,
  getDesignerReviews,
  // Messages
  sendMessage,
  getChatMessages,
  createOrGetChatRoom,
  // Notifications
  createNotification,
  getUserNotifications,
  markNotificationAsRead,
  deleteNotification,
  // Favorites
  addFavorite,
  removeFavorite,
  getUserFavorites,
  // Designers
  getAllDesigners,
  searchDesigners,
  // Image Upload
  uploadDogImage,
  uploadReviewImage,
  // Quotes
  getDesignerQuoteRequests
};

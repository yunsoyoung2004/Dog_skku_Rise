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

// ============= GROOMING HISTORY SERVICE (TEMP) =============

/**
 * 최근 미용 내역 (임시 하드코딩)
 * TODO: 추후 Firestore에서 실제 미용 리포트 데이터를 읽어오도록 변경
 */
export const getLatestGroomingHistory = async (userId) => {
  // userId는 나중에 Firestore 쿼리에 사용할 예정
  console.log('getLatestGroomingHistory (TEMP) for user:', userId);

  return {
    dogName: '뽀또',
    date: '2026. 02. 02.',
    designerName: '김민지 디자이너',
    title: '뽀또의 미용 상태 분석',
    metrics: {
      matting: 70.34, // 털 엉킴
      environmentAdaptation: 84.45, // 환경 적응도
      shedding: 30.7, // 털 빠짐
      coatQuality: 63.17, // 모질
      skinSensitivity: 97.84, // 피부 민감도
    },
    comment:
      '오늘 미용 전반적으로 아이 컨디션을 보면서 천천히 진행했어요. 처음엔 조금 긴장했지만 중간부터는 많이 편안해진 게 보여서 다행이었어요. 특히 얼굴 쪽은 예민해 보여서 가위 사용 위주로 부드럽게 정리했습니다. 털 상태는 전체적으로 양호했지만 귀 뒤쪽은 엉킴이 생기기 쉬운 편이에요. 집에서는 오늘 하루만큼은 과한 산책보다는 충분히 쉬게 해주세요. 다음 미용 때도 이 성향 참고해서 더 편안하게 진행해드릴게요 😊',
  };
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
    const quotesRef = collection(db, 'quoteRequests');
    const docRef = await addDoc(quotesRef, {
      userId,
      designerId,
      dogId: payload.dogId || '',
      dogName: payload.dogName || '',
      breed: payload.breed || '',
      weight: payload.weight ?? null,
      // 견적 폼에서 넘어온 세부 옵션들
      ...(payload.quoteData || {}),
      status: 'pending',
      createdAt: Timestamp.now()
    });
    return { success: true, quoteId: docRef.id };
  } catch (error) {
    console.error('견적 요청 오류:', error);
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
    const quotesRef = collection(db, 'quotes');

    // 같은 요청 + 같은 디자이너의 견적이 이미 있는지 확인 (수정 모드 지원)
    const existingQ = query(
      quotesRef,
      where('designerId', '==', designerId),
      where('requestId', '==', requestId)
    );
    const existingSnap = await getDocs(existingQ);

    const baseData = {
      userId: quoteRequest.userId,
      designerId,
      requestId,
      dogId: quoteRequest.dogId || '',
      dogName: quoteRequest.dogName || '',
      breed: quoteRequest.breed || '',
      // 견적 상세 정보
      price: Number(payload.amount || 0),
      message: payload.message || '',
      // 서비스 태그: 폼에서 들어온 옵션들을 합쳐서 저장
      services: [
        ...(quoteRequest.groomingStyle ? [quoteRequest.groomingStyle] : []),
        ...(Array.isArray(quoteRequest.additionalOptions) ? quoteRequest.additionalOptions : []),
        ...(Array.isArray(quoteRequest.dogTags) ? quoteRequest.dogTags : []),
      ],
      // 디자이너 표시용 정보 (있으면)
      designerName: quoteRequest.designerName || '',
      designerImage: quoteRequest.designerImage || '',
      // 사용자 페이지에서 날짜 표시용 숫자 타임스탬프
      timestamp: Date.now(),
      status: 'sent',
    };

    let quoteId;

    if (!existingSnap.empty) {
      // 이미 견적이 있으면 수정 모드: 금액/메시지/서비스만 업데이트
      const docSnap = existingSnap.docs[0];
      const quoteRef = doc(db, 'quotes', docSnap.id);
      await updateDoc(quoteRef, {
        price: baseData.price,
        message: baseData.message,
        services: baseData.services,
        timestamp: baseData.timestamp,
        status: baseData.status,
        updatedAt: Timestamp.now(),
      });
      quoteId = docSnap.id;
    } else {
      // 최초 전송: 새 문서 생성
      const docRef = await addDoc(quotesRef, {
        ...baseData,
        createdAt: Timestamp.now(),
      });
      quoteId = docRef.id;
    }

    // 관련 quoteRequest 상태도 갱신 (디자이너가 답변 보냄)
    try {
      const requestRef = doc(db, 'quoteRequests', requestId);
      await updateDoc(requestRef, {
        status: 'responded',
        lastQuotedAt: Timestamp.now(),
        lastQuoteId: quoteId,
      });
    } catch (e) {
      console.warn('quoteRequest 상태 업데이트 실패 (무시 가능):', e);
    }

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
    const quotesRef = collection(db, 'quotes');
    const q = query(quotesRef, where('userId', '==', userId));
    const quotesSnap = await getDocs(q);
    const quotes = [];
    quotesSnap.forEach((doc) => {
      quotes.push({ ...doc.data(), id: doc.id });
    });
    // 최신순 정렬 (timestamp 숫자 기반)
    return quotes.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
  } catch (error) {
    console.error('견적 조회 오류:', error);
    throw error;
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
 * 채팅 메시지 저장
 */
export const sendMessage = async (chatRoomId, messageData) => {
  try {
    const messagesRef = collection(db, `chatRooms/${chatRoomId}/messages`);
    const docRef = await addDoc(messagesRef, {
      ...messageData,
      timestamp: Timestamp.now()
    });
    return { success: true, messageId: docRef.id };
  } catch (error) {
    console.error('메시지 전송 오류:', error);
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

// ============= FAVORITES SERVICE =============

/**
 * 즐겨찾기 추가
 */
export const addFavorite = async (userId, designerId) => {
  try {
    const favoritesRef = collection(db, `users/${userId}/favorites`);
    const docRef = await addDoc(favoritesRef, {
      designerId,
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
export const removeFavorite = async (userId, favoriteId) => {
  try {
    const favoriteRef = doc(db, `users/${userId}/favorites`, favoriteId);
    await deleteDoc(favoriteRef);
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
  addRecentSearch,
  getRecentSearches,
  // Reviews
  createReview,
  getDesignerReviews,
  // Messages
  sendMessage,
  getChatMessages,
  createOrGetChatRoom,
  // Favorites
  addFavorite,
  removeFavorite,
  getUserFavorites,
  // Designers
  getAllDesigners,
  searchDesigners,
  // Image Upload
  uploadDogImage,
  uploadReviewImage
};

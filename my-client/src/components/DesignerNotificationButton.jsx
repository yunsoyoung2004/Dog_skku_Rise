import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthState } from 'react-firebase-hooks/auth';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { auth, db } from '../firebase';

export default function DesignerNotificationButton() {
  const navigate = useNavigate();
  const [user] = useAuthState(auth);
  const [unreadNotificationCount, setUnreadNotificationCount] = useState(0);

  useEffect(() => {
    if (!user) {
      setUnreadNotificationCount(0);
      return;
    }

    const notificationsRef = collection(db, `users/${user.uid}/notifications`);
    const q = query(notificationsRef, where('isRead', '==', false));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        setUnreadNotificationCount(snapshot.size || 0);
      },
      (error) => {
        console.warn('디자이너 알림 수 로드 실패:', error);
      }
    );

    return () => unsubscribe();
  }, [user]);

  if (!user) return null;

  return (
    <button
      type="button"
      className="designer-header-notification-btn"
      onClick={() => navigate('/notification')}
      aria-label="알림"
    >
      <svg
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-2-2-2-7" />
        <path d="M13.73 21a2 2 0 0 1-3.46 0" />
      </svg>
      {unreadNotificationCount > 0 && (
        <span className="designer-header-notification-badge">
          {unreadNotificationCount > 9 ? '9+' : unreadNotificationCount}
        </span>
      )}
    </button>
  );
}

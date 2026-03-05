const admin = require('firebase-admin');
const path = require('path');

// 서비스 계정 키 파일 경로 (my-server/firebase-service-account.json)
const serviceAccountPath = path.join(__dirname, 'firebase-service-account.json');

admin.initializeApp({
  credential: admin.credential.cert(require(serviceAccountPath)),
});

const db = admin.firestore();

module.exports = { admin, db };

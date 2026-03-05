const { admin } = require('./firebaseAdmin');

async function verifyFirebaseToken(req, res, next) {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

  if (!token) {
    return res.status(401).json({ success: false, message: '인증 토큰이 없습니다.' });
  }

  try {
    const decoded = await admin.auth().verifyIdToken(token);
    req.user = decoded; // uid, email 등
    next();
  } catch (err) {
    console.error('토큰 검증 실패:', err);
    return res.status(401).json({ success: false, message: '유효하지 않은 토큰입니다.' });
  }
}

module.exports = { verifyFirebaseToken };

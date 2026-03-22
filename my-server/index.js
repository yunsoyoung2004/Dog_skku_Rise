const express = require("express");
const { verifyFirebaseToken } = require("./authMiddleware");
const { db } = require("./firebaseAdmin");
const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS middleware
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  next();
});

// ============================================
// TEST DATA - In production, use a database
// ============================================
const users = [
  { userId: "test@example.com", password: "password123", nickname: "테스트유저", phone: "010-1234-5678" },
  { userId: "demo", password: "demo123", nickname: "데모계정", phone: "010-9999-8888" }
];

// ============================================
// ROUTES
// ============================================

// Health check
app.get("/", (req, res) => {
  res.json({ message: "멍빗어 백엔드 서버 작동 중 🚀" });
});

// ============================================
// SIGNUP API
// ============================================
app.post("/api/signup", (req, res) => {
  try {
    const { nickname, userId, password, passwordConfirm, phone } = req.body;

    // Validation - 필수 필드 확인
    if (!nickname || !userId || !password || !passwordConfirm || !phone) {
      return res.status(400).json({
        success: false,
        message: "모든 필드를 입력해주세요."
      });
    }

    // 비밀번호 일치 확인
    if (password !== passwordConfirm) {
      return res.status(400).json({
        success: false,
        message: "비밀번호가 일치하지 않습니다."
      });
    }

    // 비밀번호 길이 확인
    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "비밀번호는 최소 6자 이상이어야 합니다."
      });
    }

    // 중복 아이디 확인
    if (users.find(u => u.userId === userId)) {
      return res.status(400).json({
        success: false,
        message: "이미 사용 중인 아이디입니다."
      });
    }

    // 새 사용자 추가
    const newUser = {
      userId,
      password,
      nickname,
      phone,
      createdAt: new Date().toISOString()
    };

    users.push(newUser);

    res.status(201).json({
      success: true,
      message: "회원가입이 완료되었습니다.",
      user: {
        userId: newUser.userId,
        nickname: newUser.nickname
      }
    });
  } catch (error) {
    console.error("Signup error:", error);
    res.status(500).json({
      success: false,
      message: "회원가입 중 오류가 발생했습니다."
    });
  }
});

// ============================================
// LOGIN API
// ============================================
app.post("/api/login", (req, res) => {
  try {
    const { userId, password } = req.body;

    // Validation
    if (!userId || !password) {
      return res.status(400).json({
        success: false,
        message: "아이디와 비밀번호를 모두 입력해주세요."
      });
    }

    // User lookup
    const user = users.find(u => u.userId === userId);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "등록되지 않은 아이디입니다."
      });
    }

    // Password check
    if (user.password !== password) {
      return res.status(401).json({
        success: false,
        message: "비밀번호가 틀렸습니다."
      });
    }

    // Success - In production, generate JWT token
    const token = Buffer.from(`${userId}:${Date.now()}`).toString('base64');
    
    res.json({
      success: true,
      message: "로그인되었습니다.",
      token,
      user: {
        userId: user.userId,
        nickname: user.nickname
      }
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({
      success: false,
      message: "서버 오류가 발생했습니다."
    });
  }
});

// Logout API
app.post("/api/logout", (req, res) => {
  try {
    res.json({
      success: true,
      message: "로그아웃되었습니다."
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "로그아웃 중 오류가 발생했습니다."
    });
  }
});

// ============================================
// FIND ID BY PHONE (Firebase Firestore 기반)
// ============================================
app.post("/api/find-id-by-phone", async (req, res) => {
  try {
    const { phone } = req.body;

    if (!phone) {
      return res.status(400).json({
        success: false,
        message: "전화번호를 입력해주세요.",
      });
    }

    const snap = await db
      .collection("users")
      .where("phone", "==", phone)
      .limit(1)
      .get();

    if (snap.empty) {
      return res.status(404).json({
        success: false,
        message: "해당 전화번호로 가입된 계정을 찾을 수 없습니다.",
      });
    }

    const data = snap.docs[0].data();
    const email = data.email || null;

    if (!email) {
      return res.status(404).json({
        success: false,
        message: "해당 계정의 이메일 정보를 찾을 수 없습니다.",
      });
    }

    const masked = email.replace(/(.{2}).+(@.*)/, "$1***$2");

    return res.json({
      success: true,
      emailMasked: masked,
      email, // 프론트에서는 이 값을 직접 노출하지 않고, 메일 발송 등에만 사용
    });
  } catch (error) {
    console.error("find-id-by-phone error:", error);
    return res.status(500).json({
      success: false,
      message: "아이디를 찾는 중 서버 오류가 발생했습니다.",
    });
  }
});

// User info API
app.get("/api/user", (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: "토큰이 없습니다."
      });
    }

    // In production, verify JWT token
    const decoded = Buffer.from(token, 'base64').toString('utf-8');
    const userId = decoded.split(':')[0];
    const user = users.find(u => u.userId === userId);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "사용자를 찾을 수 없습니다."
      });
    }

    res.json({
      success: true,
      user: {
        userId: user.userId,
        nickname: user.nickname
      }
    });
  } catch (error) {
    console.error("User info error:", error);
    res.status(500).json({
      success: false,
      message: "사용자 정보 조회 중 오류가 발생했습니다."
    });
  }
});

// ============================================
// Firebase Auth 연동 테스트 API
// (프론트에서 Firebase 로그인 후 발급받은 idToken으로 호출)
// ============================================
app.get("/api/me", verifyFirebaseToken, (req, res) => {
  const { uid, email } = req.user;
  res.json({
    success: true,
    uid,
    email: email || null,
  });
});

// Error handling
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({
    success: false,
    message: "서버 오류가 발생했습니다."
  });
});

// Start server
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`서버 실행: http://localhost:${PORT}`);
  console.log(`\n테스트 계정:`);
  console.log(`  - ID: test@example.com / PW: password123`);
  console.log(`  - ID: demo / PW: demo123`);
  console.log(`\n회원가입 엔드포인트: POST /api/signup`);
  console.log(`로그인 엔드포인트: POST /api/login\n`);
});

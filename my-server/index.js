const express = require("express");
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

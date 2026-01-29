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
const testUsers = [
  { userId: "test@example.com", password: "password123", name: "Test User" },
  { userId: "demo", password: "demo123", name: "Demo User" }
];

// ============================================
// ROUTES
// ============================================

// Health check
app.get("/", (req, res) => {
  res.json({ message: "멍빗어 백엔드 서버 작동 중 🚀" });
});

// Login API
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
    const user = testUsers.find(u => u.userId === userId);

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
        name: user.name
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
    const user = testUsers.find(u => u.userId === userId);

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
        name: user.name
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
  console.log(`테스트 계정 - ID: test@example.com / PW: password123`);
  console.log(`테스트 계정 - ID: demo / PW: demo123`);
});

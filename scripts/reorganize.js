const fs = require('fs');
const path = require('path');

const ROOT_DIR = __dirname;
const FRONTEND_DIR = path.join(ROOT_DIR, 'frontend');
const WEB_DIR = path.join(ROOT_DIR, 'frontend-web');
const B2B_DIR = path.join(ROOT_DIR, 'frontend-b2b');
const SCRIPTS_DIR = path.join(ROOT_DIR, 'scripts');

console.log("🚀 Sistem reorganizasyonu başlıyor...");

// 1. Dizin Kopyalama Fonksiyonu (node_modules ve dist hariç)
function copyRecursiveSync(src, dest, exclude = []) {
  const exists = fs.existsSync(src);
  const stats = exists && fs.statSync(src);
  const isDirectory = exists && stats.isDirectory();
  
  if (exclude.includes(path.basename(src))) return;

  if (isDirectory) {
    if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
    fs.readdirSync(src).forEach((childItemName) => {
      copyRecursiveSync(path.join(src, childItemName), path.join(dest, childItemName), exclude);
    });
  } else {
    fs.copyFileSync(src, dest);
  }
}

// 2. Kopyalama İşlemleri
console.log("📦 frontend klasörü frontend-web ve frontend-b2b olarak ayrılıyor...");
copyRecursiveSync(FRONTEND_DIR, WEB_DIR, ['node_modules', 'dist']);
copyRecursiveSync(FRONTEND_DIR, B2B_DIR, ['node_modules', 'dist']);

// 3. Package.json port ve isim güncellemeleri
function updatePackageJson(dirPath, name, port) {
  const pkgPath = path.join(dirPath, 'package.json');
  if (fs.existsSync(pkgPath)) {
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
    pkg.name = name;
    pkg.scripts.dev = `vite --port ${port}`;
    fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2));
  }
}

updatePackageJson(WEB_DIR, 'ai-mulakat-web', 5173);
updatePackageJson(B2B_DIR, 'ai-mulakat-b2b', 5174);

// 4. App.jsx Güncellemeleri
const webAppJsx = `import React, { useState, useEffect } from "react";
import Login from "./pages/Login.jsx";
import ExamRoom from "./pages/ExamRoom.jsx";
import StudentHome from "./pages/StudentHome.jsx";
import PreExamCheck from "./pages/PreExamCheck.jsx";
import authService from "./services/auth.js";

export default function App() {
  const [page, setPage] = useState("login");
  const [pageParams, setPageParams] = useState({});
  const [user, setUser] = useState(null);

  useEffect(() => {
    if (authService.isAuthenticated()) {
      const savedUser = authService.getCurrentUser();
      if (savedUser) {
        setUser(savedUser);
        const role = savedUser.role;
        // Web arayüzünde sadece öğrenci sayfaları bulunur
        if (role === "admin" || role === "instructor") {
          console.warn("Eğitmenler B2B paneline gitmelidir.");
          authService.logout();
          setPage("login");
        } else {
          setPage("student-home");
        }
      }
    }
  }, []);

  const handleNavigate = (target, params = {}) => {
    setPageParams(params);
    setPage(target);
  };

  const handleLogout = () => {
    authService.logout();
    setUser(null);
    setPage("login");
  };

  switch (page) {
    case "login":
      return <Login onNavigate={handleNavigate} />;
    case "student-home":
      return <StudentHome onNavigate={handleNavigate} onLogout={handleLogout} />;
    case "exam-room":
      return <ExamRoom onNavigate={handleNavigate} />;
    case "pre-exam-check":
      return <PreExamCheck examTitle={pageParams.examTitle} onComplete={() => handleNavigate("exam-room", pageParams)} />;
    default:
      return <Login onNavigate={handleNavigate} />;
  }
}
`;

const b2bAppJsx = `import React, { useState, useEffect } from "react";
import Login from "./pages/Login.jsx";
import InstructorDashboard from "./pages/InstructorDashboard.jsx";
import AdminPanel from "./pages/AdminPanel.jsx";
import ReportDetail from "./pages/ReportDetail.jsx";
import authService from "./services/auth.js";

export default function App() {
  const [page, setPage] = useState("login");
  const [pageParams, setPageParams] = useState({});
  const [user, setUser] = useState(null);

  useEffect(() => {
    if (authService.isAuthenticated()) {
      const savedUser = authService.getCurrentUser();
      if (savedUser) {
        setUser(savedUser);
        const role = savedUser.role;
        if (role === "student") {
          console.warn("Öğrenciler Web arayüzüne gitmelidir.");
          authService.logout();
          setPage("login");
        } else if (role === "admin") {
          setPage("admin-dashboard");
        } else {
          setPage("instructor-dashboard");
        }
      }
    }
  }, []);

  const handleNavigate = (target, params = {}) => {
    setPageParams(params);
    setPage(target);
  };

  const handleLogout = () => {
    authService.logout();
    setUser(null);
    setPage("login");
  };

  switch (page) {
    case "login":
      return <Login onNavigate={handleNavigate} />;
    case "instructor-dashboard":
      return <InstructorDashboard onNavigate={handleNavigate} onLogout={handleLogout} />;
    case "admin-dashboard":
      return <AdminPanel onNavigate={handleNavigate} onLogout={handleLogout} />;
    case "report":
      return <ReportDetail onNavigate={handleNavigate} sessionId={pageParams.sessionId} />;
    default:
      return <Login onNavigate={handleNavigate} />;
  }
}
`;

fs.writeFileSync(path.join(WEB_DIR, 'src', 'App.jsx'), webAppJsx);
fs.writeFileSync(path.join(B2B_DIR, 'src', 'App.jsx'), b2bAppJsx);

console.log("🛠️ App.jsx dosyaları ayrıştırıldı.");

// 5. Gereksiz dosyaları silme
const webFilesToRemove = ['AdminPanel.jsx', 'InstructorDashboard.jsx', 'ReportDetail.jsx'];
const b2bFilesToRemove = ['ExamRoom.jsx', 'PreExamCheck.jsx', 'StudentHome.jsx'];

webFilesToRemove.forEach(file => {
  const p = path.join(WEB_DIR, 'src', 'pages', file);
  if (fs.existsSync(p)) fs.unlinkSync(p);
});

b2bFilesToRemove.forEach(file => {
  const p = path.join(B2B_DIR, 'src', 'pages', file);
  if (fs.existsSync(p)) fs.unlinkSync(p);
});

// 6. Scripts klasörünü oluştur ve .bat dosyalarını taşı
console.log("🧹 .bat dosyaları scripts klasörüne taşınıyor...");
if (!fs.existsSync(SCRIPTS_DIR)) fs.mkdirSync(SCRIPTS_DIR);

const files = fs.readdirSync(ROOT_DIR);
files.forEach(file => {
  if (file.endsWith('.bat')) {
    fs.renameSync(path.join(ROOT_DIR, file), path.join(SCRIPTS_DIR, file));
  }
});

// 7. Eski/Geçici klasörleri silme
console.log("🗑️ Eski frontend ve geçici klasörler siliniyor...");
const dirsToRemove = ['frontend', 'frontend_updates', 'Proctor-Teslim', 'frontend_yeni', 'panel'];

dirsToRemove.forEach(dir => {
  const p = path.join(ROOT_DIR, dir);
  if (fs.existsSync(p)) {
    fs.rmSync(p, { recursive: true, force: true });
  }
});

console.log("✅ İŞLEM TAMAMLANDI! Sistem ayrıştırıldı ve gereksiz dosyalar temizlendi.");
console.log("Lütfen 'TEST_KILAVUZU.md' dosyasını okuyarak testlere devam edin.");

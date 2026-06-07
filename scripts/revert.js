const fs = require('fs');
const path = require('path');

const ROOT_DIR = __dirname;
const FRONTEND_DIR = path.join(ROOT_DIR, 'frontend');
const WEB_DIR = path.join(ROOT_DIR, 'frontend-web');
const B2B_DIR = path.join(ROOT_DIR, 'frontend-b2b');
const SCRIPTS_DIR = path.join(ROOT_DIR, 'scripts');

function copyRecursiveSync(src, dest, exclude = []) {
  if (!fs.existsSync(src)) return;
  const stats = fs.statSync(src);
  const isDirectory = stats.isDirectory();
  
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

// 1. Restore frontend from frontend-web
console.log("Restoring frontend...");
copyRecursiveSync(WEB_DIR, FRONTEND_DIR);

// 2. Copy missing files from frontend-b2b
const b2bPages = path.join(B2B_DIR, 'src', 'pages');
if (fs.existsSync(b2bPages)) {
  fs.readdirSync(b2bPages).forEach(file => {
    if (!fs.existsSync(path.join(FRONTEND_DIR, 'src', 'pages', file))) {
      fs.copyFileSync(path.join(b2bPages, file), path.join(FRONTEND_DIR, 'src', 'pages', file));
    }
  });
}

const b2bDashboard = path.join(B2B_DIR, 'src', 'components', 'Dashboard');
if (fs.existsSync(b2bDashboard)) {
  if (!fs.existsSync(path.join(FRONTEND_DIR, 'src', 'components', 'Dashboard'))) {
    fs.mkdirSync(path.join(FRONTEND_DIR, 'src', 'components', 'Dashboard'), { recursive: true });
  }
  fs.readdirSync(b2bDashboard).forEach(file => {
    fs.copyFileSync(path.join(b2bDashboard, file), path.join(FRONTEND_DIR, 'src', 'components', 'Dashboard', file));
  });
}

// 3. Restore App.jsx
const unifiedAppJsx = `import React, { useState, useEffect } from "react";
import Login from "./pages/Login.jsx";
import InstructorDashboard from "./pages/InstructorDashboard.jsx";
import ExamRoom from "./pages/ExamRoom.jsx";
import ReportDetail from "./pages/ReportDetail.jsx";
import PreExamCheck from "./pages/PreExamCheck.jsx";
import StudentHome from "./pages/StudentHome.jsx";
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
        if (role === "admin" || role === "instructor") {
          setPage("instructor-dashboard");
        } else {
          setPage("student-home");
        }
      }
    }
  }, []);

  const handleNavigate = (target, params = {}) => {
    const currentUser = authService.getCurrentUser();
    if (currentUser) {
      setUser(currentUser);
      const role = currentUser.role;
      if (role === "student" && (target === "instructor-dashboard" || target === "admin-dashboard")) {
        console.warn("[Güvenlik] Öğrenci admin sayfasına erişemez!");
        target = "student-home";
      }
      if ((role === "admin" || role === "instructor") && (target === "exam-room" || target === "student-home")) {
        target = "instructor-dashboard";
      }
    }
    setPageParams(params);
    setPage(target);
  };

  const handleLogout = () => {
    authService.logout();
    setUser(null);
    setPage("login");
  };

  switch (page) {
    case "login": return <Login onNavigate={handleNavigate} />;
    case "instructor-dashboard":
    case "admin-dashboard": return <InstructorDashboard onNavigate={handleNavigate} onLogout={handleLogout} />;
    case "exam-room": return <ExamRoom onNavigate={handleNavigate} />;
    case "pre-exam-check": return <PreExamCheck examTitle={pageParams.examTitle || "Matematik Vize"} onComplete={() => handleNavigate("exam-room", pageParams)} />;
    case "report": return <ReportDetail onNavigate={handleNavigate} sessionId={pageParams.sessionId} />;
    case "student-home": return <StudentHome onNavigate={handleNavigate} onLogout={handleLogout} />;
    default: return <Login onNavigate={handleNavigate} />;
  }
}`;

fs.writeFileSync(path.join(FRONTEND_DIR, 'src', 'App.jsx'), unifiedAppJsx);

// 4. Restore package.json
const pkgPath = path.join(FRONTEND_DIR, 'package.json');
if (fs.existsSync(pkgPath)) {
  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
  pkg.name = "ai-mulakat-frontend";
  pkg.scripts.dev = "vite";
  fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2));
}

// 5. Restore scripts back to root
if (fs.existsSync(SCRIPTS_DIR)) {
  fs.readdirSync(SCRIPTS_DIR).forEach(file => {
    fs.renameSync(path.join(SCRIPTS_DIR, file), path.join(ROOT_DIR, file));
  });
  fs.rmSync(SCRIPTS_DIR, { recursive: true, force: true });
}

// 6. Delete frontend-web and frontend-b2b
if (fs.existsSync(WEB_DIR)) fs.rmSync(WEB_DIR, { recursive: true, force: true });
if (fs.existsSync(B2B_DIR)) fs.rmSync(B2B_DIR, { recursive: true, force: true });

console.log("Restoration complete!");

import React, { useState, useEffect } from "react";
import Login from "./pages/Login.jsx";
import InstructorDashboard from "./pages/InstructorDashboard.jsx";
import AdminPanel from "./pages/AdminPanel.jsx";
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
    case "instructor-dashboard": return <InstructorDashboard onNavigate={handleNavigate} onLogout={handleLogout} />;
    case "admin-dashboard": return <AdminPanel onNavigate={handleNavigate} onLogout={handleLogout} />;
    case "exam-room": return <ExamRoom onNavigate={handleNavigate} />;
    case "pre-exam-check": return <PreExamCheck examTitle={pageParams.examTitle || "Matematik Vize"} onComplete={() => handleNavigate("exam-room", pageParams)} />;
    case "report": return <ReportDetail onNavigate={handleNavigate} sessionId={pageParams.sessionId} />;
    case "student-home": return <StudentHome onNavigate={handleNavigate} onLogout={handleLogout} />;
    default: return <Login onNavigate={handleNavigate} />;
  }
}
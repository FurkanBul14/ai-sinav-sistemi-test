import React, { useEffect, useMemo, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import AlertFeed from "../components/Dashboard/AlertFeed";
import StudentGrid from "../components/Dashboard/StudentGrid";
import reportingService from "../services/reporting.js";
import authService from "../services/auth.js";
import examService from "../services/exam.js";
import "../styles/dashboard.css";
import "../styles/admin.css";
import "../styles/modal.css";

const getStoredInstructorProfile = (user) => {
  const storageKey = `instructorProfile_${user?.id || user?.email || "demo"}`;
  const savedProfile = localStorage.getItem(storageKey);

  if (savedProfile) {
    try {
      return JSON.parse(savedProfile);
    } catch (error) {
      console.warn("Eğitmen profil bilgisi okunamadı:", error.message);
    }
  }

  return {
    name: user?.name || "Eğitmen",
    email: user?.email || "egitmen@example.com",
    avatar: user?.avatar || "",
  };
};

export default function InstructorDashboard({ onNavigate, onLogout }) {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Sınav oluşturma modalı verileri
  const [showExamModal, setShowExamModal] = useState(false);
  const [examTitle, setExamTitle] = useState("");
  const [examDuration, setExamDuration] = useState(60);
  const [createdExamCode, setCreatedExamCode] = useState("");

  const currentUser = authService.getCurrentUser();
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profile, setProfile] = useState(() => getStoredInstructorProfile(currentUser));
  const [profileForm, setProfileForm] = useState(() => getStoredInstructorProfile(currentUser));

  useEffect(() => {
    const nextProfile = getStoredInstructorProfile(currentUser);
    setProfile(nextProfile);
    setProfileForm(nextProfile);
  }, [currentUser?.id, currentUser?.email]);

  const profileStorageKey = `instructorProfile_${currentUser?.id || currentUser?.email || "demo"}`;

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [profileMessage, setProfileMessage] = useState("");
  const [profileError, setProfileError] = useState("");

  const openProfileModal = () => {
    setProfileForm(profile);
    setIsEditingProfile(false);
    setProfileError("");
    setProfileMessage("");
    setCurrentPassword("");
    setNewPassword("");
    setShowProfileModal(true);
  };

  const closeProfileModal = () => {
    setShowProfileModal(false);
    setIsEditingProfile(false);
  };

  const handleProfileImageChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // SİBER GÜVENLİK KONTROLLERİ:
    // 1. Dosya Boyutu Kontrolü (Max 1MB)
    if (file.size > 1024 * 1024) {
      setProfileError("Hata: Dosya boyutu 1MB'dan küçük olmalıdır!");
      return;
    }

    // 2. MIME Tipi Kontrolü (Sadece güvenli resim tipleri)
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      setProfileError("Hata: Sadece JPG, PNG, WEBP veya GIF resimleri yükleyebilirsiniz!");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      // 3. Base64 İçerik Güvenliği Kontrolü (Malicious script inject önleme)
      const base64Str = reader.result;
      const signature = base64Str.split(',')[0];
      const expectedSignatures = [
        'data:image/jpeg;base64',
        'data:image/png;base64',
        'data:image/webp;base64',
        'data:image/gif;base64'
      ];
      
      const isValidSignature = expectedSignatures.some(sig => signature.startsWith(sig));
      if (!isValidSignature) {
        setProfileError("Hata: Geçersiz veya güvenli olmayan resim formatı!");
        return;
      }

      setProfileForm((current) => ({ ...current, avatar: base64Str }));
      setProfileError("");
    };
    reader.readAsDataURL(file);
  };

  const saveProfile = async () => {
    setProfileError("");
    setProfileMessage("");

    try {
      // 1. İsim Güncelleme (Backend API)
      if (profileForm.name?.trim() !== profile.name) {
        await authService.updateProfile({ name: profileForm.name?.trim() });
        // LocalStorage'daki kullanıcı bilgisini güncelle
        const user = authService.getCurrentUser();
        if (user) {
          user.name = profileForm.name?.trim();
          localStorage.setItem("user", JSON.stringify(user));
        }
      }

      // 2. Şifre Değiştirme (Eğer alanlar doldurulduysa)
      if (currentPassword || newPassword) {
        if (!currentPassword || !newPassword) {
          setProfileError("Şifre değiştirmek için hem mevcut hem de yeni şifreyi girmelisiniz.");
          return;
        }
        if (newPassword.length < 6) {
          setProfileError("Yeni şifre en az 6 karakter olmalıdır.");
          return;
        }
        await authService.changePassword({ currentPassword, newPassword });
        setCurrentPassword("");
        setNewPassword("");
      }

      const nextProfile = {
        name: profileForm.name?.trim() || "Eğitmen",
        email: profile.email || "egitmen@example.com",
        avatar: profileForm.avatar || "",
      };

      setProfile(nextProfile);
      localStorage.setItem(profileStorageKey, JSON.stringify(nextProfile));
      setProfileMessage("Profil başarıyla güncellendi.");
      setIsEditingProfile(false);
    } catch (err) {
      setProfileError(err.message || "Profil güncellenirken hata oluştu.");
    }
  };

  useEffect(() => {
    let isMounted = true;

    async function loadReports() {
      setLoading(true);
      const filters = currentUser?.role === "instructor" ? { instructorId: currentUser.id } : {};
      const data = await reportingService.getReports(filters);
      if (isMounted) {
        setReports(data);
        setLoading(false);
      }
    }

    loadReports();
    const interval = setInterval(loadReports, 10000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [currentUser?.id, currentUser?.role]);

  const stats = useMemo(() => {
    const activeSessions = reports.filter((report) => report.status === "active").length;
    const activeExams = new Set(reports.map((report) => report.examId || report.examTitle).filter(Boolean)).size;
    const criticalAlerts = reports.filter((report) => (report.riskScore || 0) >= 70).length;
    return { activeExams, activeSessions, criticalAlerts };
  }, [reports]);

  const handleCreateExam = async (e) => {
    e.preventDefault();
    try {
      // Rastgele 6 haneli kod
      const code = Math.random().toString(36).substring(2, 8).toUpperCase();
      await examService.createExam({
        title: examTitle,
        duration: Number(examDuration),
        instructorId: currentUser?.id || "instructor-1",
        accessCode: code,
        status: "published"
      });
      setCreatedExamCode(code);
    } catch (error) {
      alert("Sınav oluşturulamadı: " + (error.message || "Bilinmeyen hata"));
    }
  };

  return (
    <div className="dashboard-layout">
      <nav className="navbar">
        <div className="navbar-brand">
          <div className="navbar-logo">AI</div>
          <span className="navbar-logo-text">Dashboard</span>
        </div>
        <div className="navbar-links">
          <button className="navbar-link navbar-link--active">Dashboard</button>
          {currentUser?.role === "admin" && (
            <button className="navbar-link" onClick={() => onNavigate("admin-dashboard")}>Admin Panel</button>
          )}
          <button className="navbar-link" onClick={() => {setShowExamModal(true); setCreatedExamCode(""); setExamTitle("");}}>Sınav Oluştur</button>
          <button className="navbar-link" onClick={() => onNavigate("report")}>Raporlar</button>
        </div>
        <div className="navbar-actions">
          <button className="navbar-profile-btn" onClick={openProfileModal} type="button">
            <span className="navbar-profile-avatar">
              {profile.avatar ? <img src={profile.avatar} alt="Profil" /> : (profile.name || "E").charAt(0).toUpperCase()}
            </span>
            Profil
          </button>
          <button className="btn-logout" onClick={onLogout}>Çıkış</button>
        </div>
      </nav>

      <main className="dashboard-main">
        <AlertFeed stats={stats} />
        {loading ? (
          <div className="admin-table-wrapper" style={{ padding: "1.5rem" }}>Raporlar yükleniyor...</div>
        ) : (
          <StudentGrid sessions={reports} onNavigate={onNavigate} />
        )}

        {showExamModal && (
          <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.5)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 9999 }}>
            <div style={{ backgroundColor: "#1e1e2d", padding: "2rem", borderRadius: "10px", minWidth: "400px", color: "white", boxShadow: "0 10px 25px rgba(0,0,0,0.5)"}}>
              <h2 style={{marginTop: 0, marginBottom: "1.5rem"}}>Yeni Sınav Oluştur</h2>
              
              {createdExamCode ? (
                <div style={{ textAlign: "center" }}>
                  <div style={{ backgroundColor: "rgba(0, 200, 83, 0.1)", padding: "1.5rem", borderRadius: "8px", marginBottom: "1.5rem", border: "1px solid #00c853" }}>
                    <p style={{ margin: 0, color: "#00c853", fontWeight: "bold" }}>Sınav başarıyla oluşturuldu!</p>
                    <h3 style={{ margin: "10px 0 15px 0", fontSize: "2.5rem", letterSpacing: "3px", color: "white" }}>{createdExamCode}</h3>
                    
                    <div style={{ display: "inline-block", background: "#fff", border: "2px solid #00c853", borderRadius: 8, padding: 12, marginBottom: 15 }}>
                      <QRCodeSVG value={`${window.location.origin}/?examCode=${createdExamCode}`} size={140} fgColor="#00c853" />
                    </div>
                    
                    <p style={{ margin: 0, fontSize: "0.9rem", color: "#aaa" }}>Öğrenciler bu QR kodu telefonla okutarak doğrudan sınava katılabilirler.</p>
                  </div>
                  <button className="btn" style={{ width: "100%", padding:"0.8rem", backgroundColor: "#3f8cf4", color: "white", border: "none", borderRadius: "5px", cursor: "pointer"}} onClick={() => setShowExamModal(false)}>Kapat</button>
                </div>
              ) : (
                <form onSubmit={handleCreateExam}>
                  <div style={{ marginBottom: "1rem" }}>
                    <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.9rem", color: "#ccc" }}>Sınav Adı</label>
                    <input type="text" value={examTitle} onChange={(e) => setExamTitle(e.target.value)} required placeholder="Örn: İngilizce Vize Sınavı" style={{ width: "100%", padding: "0.8rem", borderRadius: "5px", border: "1px solid #333", backgroundColor: "#2b2b40", color: "white" }} />
                  </div>
                  <div style={{ marginBottom: "2rem" }}>
                    <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.9rem", color: "#ccc" }}>Sınav Süresi (Dakika)</label>
                    <input type="number" value={examDuration} onChange={(e) => setExamDuration(e.target.value)} required min="1" style={{ width: "100%", padding: "0.8rem", borderRadius: "5px", border: "1px solid #333", backgroundColor: "#2b2b40", color: "white" }} />
                  </div>
                  <div style={{ display: "flex", gap: "1rem" }}>
                    <button type="button" onClick={() => setShowExamModal(false)} style={{ flex: 1, padding:"0.8rem", backgroundColor: "transparent", color: "#ccc", border: "1px solid #555", borderRadius: "5px", cursor: "pointer" }}>İptal</button>
                    <button type="submit" style={{ flex: 1, padding:"0.8rem", backgroundColor: "#3f8cf4", color: "white", border: "none", borderRadius: "5px", cursor: "pointer", fontWeight: "bold" }}>Oluştur</button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}


        {showProfileModal && (
          <div className="profile-modal-overlay">
            <div className="profile-modal-box">
              <div className="profile-modal-header">
                <h2>Eğitmen Profili</h2>
                <button className="profile-modal-close" onClick={closeProfileModal} type="button">×</button>
              </div>

              {profileMessage && (
                <div style={{ background: "#d1fae5", color: "#065f46", padding: 10, borderRadius: 6, fontSize: 13, marginBottom: 12, textAlign: "center" }}>
                  {profileMessage}
                </div>
              )}
              {profileError && (
                <div style={{ background: "#fee2e2", color: "#991b1b", padding: 10, borderRadius: 6, fontSize: 13, marginBottom: 12, textAlign: "center" }}>
                  {profileError}
                </div>
              )}

              <div className="profile-avatar-large">
                {profileForm.avatar ? <img src={profileForm.avatar} alt="Profil" /> : (profileForm.name || "E").charAt(0).toUpperCase()}
              </div>

              {isEditingProfile && (
                <label className="profile-file-label">
                  Profil resmi seç
                  <input type="file" accept="image/*" onChange={handleProfileImageChange} />
                </label>
              )}

              <div className="profile-form">
                <label>
                  İsim
                  <input
                    value={profileForm.name}
                    onChange={(event) => setProfileForm((current) => ({ ...current, name: event.target.value }))}
                    disabled={!isEditingProfile}
                  />
                </label>
                <label>
                  Mail
                  <input
                    type="email"
                    value={profileForm.email}
                    onChange={(event) => setProfileForm((current) => ({ ...current, email: event.target.value }))}
                    disabled={true} // Mail adresi değiştirilemez (güvenlik ve tutarlılık için)
                  />
                </label>
                {isEditingProfile && (
                  <>
                    <label>
                      Mevcut Şifre
                      <input
                        type="password"
                        placeholder="Mevcut şifreniz"
                        value={currentPassword}
                        onChange={(event) => setCurrentPassword(event.target.value)}
                      />
                    </label>
                    <label>
                      Yeni Şifre
                      <input
                        type="password"
                        placeholder="Yeni şifreniz (En az 6 karakter)"
                        value={newPassword}
                        onChange={(event) => setNewPassword(event.target.value)}
                      />
                    </label>
                  </>
                )}
              </div>

              <div className="profile-modal-actions">
                {isEditingProfile ? (
                  <>
                    <button className="profile-secondary-btn" onClick={() => { setProfileForm(profile); setIsEditingProfile(false); setProfileError(""); setProfileMessage(""); setCurrentPassword(""); setNewPassword(""); }} type="button">Vazgeç</button>
                    <button className="profile-primary-btn" onClick={saveProfile} type="button">Kaydet</button>
                  </>
                ) : (
                  <button className="profile-primary-btn" onClick={() => { setIsEditingProfile(true); setProfileError(""); setProfileMessage(""); }} type="button">Düzenle</button>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

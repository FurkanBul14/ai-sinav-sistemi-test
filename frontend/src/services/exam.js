// Exam Service API — Frontend tarafı
// Sınav listeleme, başlatma, cevap gönderme, sonuç görüntüleme

import api from "./api.js";

const examService = {
  // ──────────────────────────────────────────────
  // Sınav Listesi
  // ──────────────────────────────────────────────
  async getExams() {
    return api.get("/api/exams");
  },

  async getExamById(examId) {
    return api.get(`/api/exams/${examId}`);
  },

  async getExamByCode(code) {
    return api.get(`/api/exams/code/${encodeURIComponent(code)}`);
  },

  // ──────────────────────────────────────────────
  // Sınav Oluşturma / Güncelleme / Silme
  // ──────────────────────────────────────────────
  async createExam(examData) {
    return api.post("/api/exams", examData);
  },

  async updateExam(examId, examData) {
    return api.put(`/api/exams/${examId}`, examData);
  },

  async deleteExam(examId) {
    return api.delete(`/api/exams/${examId}`);
  },

  // ──────────────────────────────────────────────
  // Sınav Oturumu
  // ──────────────────────────────────────────────
  async joinByCode(code, student = {}) {
    return api.post("/api/exams/join", {
      code,
      studentId: student.studentId || "student-1",
      studentName: student.studentName || "",
    });
  },

  async startSession(examId, student = {}) {
    return api.post(`/api/exams/${examId}/start`, {
      studentId: student.studentId || "student-1",
      studentName: student.studentName || "",
    });
  },

  async getSession(sessionId) {
    return api.get(`/api/sessions/${sessionId}`);
  },

  async submitAnswer(sessionId, questionId, answer) {
    return api.post(`/api/sessions/${sessionId}/answer`, {
      questionId,
      answer,
    });
  },

  async finishSession(examId, sessionId, data = {}) {
    return api.post(`/api/exams/${examId}/end`, {
      sessionId,
      answers: data.answers || {},
      riskScore: data.riskScore || 0,
      riskLevel: data.riskLevel || "LOW",
      eventCounts: data.eventCounts || {},
      proctoringSummary: data.proctoringSummary || {},
      status: data.status || "submitted",
    });
  },

  // ──────────────────────────────────────────────
  // Sonuçlar
  // ──────────────────────────────────────────────
  async getSessionResults(sessionId) {
    return api.get(`/api/sessions/${sessionId}/results`);
  },

  async getExamSessions(examId) {
    return api.get(`/api/exams/${examId}/sessions`);
  },

  // ──────────────────────────────────────────────
  // Öğrenci Sınav Geçmişi
  // Backend'de endpoint varsa gerçek kayıtları çeker.
  // Endpoint yoksa StudentHome.jsx catch içinde localStorage kayıtlarını gösterir.
  // ──────────────────────────────────────────────
  async getStudentExamHistory(studentId, page = 1, limit = 5) {
    return api.get(
      `/api/sessions/student/${encodeURIComponent(
        studentId
      )}/history?page=${page}&limit=${limit}`
    );
  },
};

export default examService;
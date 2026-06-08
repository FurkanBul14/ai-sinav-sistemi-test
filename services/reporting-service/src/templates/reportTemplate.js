'use strict';

/**
 * Reporting Service için ortak rapor şablonları.
 * Bu dosya reportBuilder tarafından oluşturulan rapor nesnesini
 * PDF ve JSON çıktıları için standart hale getirir.
 */

function normalizeDate(value) {
  if (!value) return null;

  try {
    return new Date(value).toISOString();
  } catch {
    return null;
  }
}

function buildJsonTemplate(report = {}) {
  return {
    sessionId: report.sessionId || null,
    examId: report.examId || null,
    examCode: report.examCode || '',
    examTitle: report.examTitle || '-',

    instructorId: report.instructorId || null,

    studentId: report.studentId || null,
    studentName: report.studentName || '-',

    status: report.status || 'unknown',
    startedAt: normalizeDate(report.startedAt),
    completedAt: normalizeDate(report.completedAt),
    durationSeconds: report.durationSeconds || 0,

    riskScore: report.riskScore || 0,
    riskLevel: report.riskLevel || 'LOW',
    riskLabel: report.riskLabel || 'Düşük Risk',
    violationCount: report.violationCount || 0,

    eventCounts: report.eventCounts || {},

    summary: {
      face: report.summary?.face || 0,
      multipleFace: report.summary?.multipleFace || 0,
      gaze: report.summary?.gaze || 0,
      gazeWarning: report.summary?.gazeWarning || 0,
      audio: report.summary?.audio || 0,
      objects: report.summary?.objects || 0,
      tab: report.summary?.tab || 0,
      fullscreen: report.summary?.fullscreen || 0,
      shortcuts: report.summary?.shortcuts || 0,
    },

    answers: report.answers || {},

    timeline: (report.timeline || []).map((event) => ({
      id: event.id || null,
      eventType: event.eventType || '',
      label: event.label || event.eventType || '',
      source: event.source || 'system',
      severity: event.severity || 'low',
      message: event.message || '',
      payload: event.payload || {},
      riskScore: event.riskScore || 0,
      riskLevel: event.riskLevel || 'LOW',
      timestamp: normalizeDate(event.timestamp),
    })),
  };
}

function buildPdfTemplate(report = {}) {
  return {
    header: {
      title: 'AI Destekli Sınav Gözetim Sistemi',
      subtitle: 'Öğrenci Gözetim ve Risk Değerlendirme Raporu',
    },

    sessionInfo: [
      ['Oturum ID', report.sessionId || '-'],
      ['Sınav Kodu', report.examCode || '-'],
      ['Sınav Adı', report.examTitle || '-'],
      ['Öğrenci Adı', report.studentName || '-'],
      ['Öğrenci ID', report.studentId || '-'],
      ['Başlangıç', report.startedAt || '-'],
      ['Bitiş', report.completedAt || '-'],
      ['Süre', report.durationSeconds || 0],
      ['Durum', report.status || '-'],
    ],

    riskInfo: {
      riskScore: report.riskScore || 0,
      riskLevel: report.riskLevel || 'LOW',
      riskLabel: report.riskLabel || 'Düşük Risk',
      violationCount: report.violationCount || 0,
    },

    summary: report.summary || {},
    answers: report.answers || {},
    timeline: report.timeline || [],
  };
}

module.exports = {
  buildJsonTemplate,
  buildPdfTemplate,
};

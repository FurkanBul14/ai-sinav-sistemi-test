import { describe, test, expect, vi, beforeEach } from 'vitest'

import examService from './exam.js'
import api from './api.js'

vi.mock('./api.js', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}))

describe('exam service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  test('getExams sınav listesini get ile çağırmalı', async () => {
    api.get.mockResolvedValue({ success: true, data: [] })

    const result = await examService.getExams()

    expect(api.get).toHaveBeenCalledWith('/api/exams')
    expect(result).toEqual({ success: true, data: [] })
  })

  test('getExamById examId ile sınav detayını çağırmalı', async () => {
    api.get.mockResolvedValue({ success: true, data: { id: 'exam-1' } })

    const result = await examService.getExamById('exam-1')

    expect(api.get).toHaveBeenCalledWith('/api/exams/exam-1')
    expect(result).toEqual({ success: true, data: { id: 'exam-1' } })
  })

  test('getExamByCode sınav kodunu encode ederek çağırmalı', async () => {
    api.get.mockResolvedValue({ success: true, data: { code: 'DEMO 01' } })

    const result = await examService.getExamByCode('DEMO 01')

    expect(api.get).toHaveBeenCalledWith('/api/exams/code/DEMO%2001')
    expect(result).toEqual({ success: true, data: { code: 'DEMO 01' } })
  })

  test('createExam sınav verisini post ile göndermeli', async () => {
    const examData = {
      title: 'Matematik Vize',
      duration: 60,
    }

    api.post.mockResolvedValue({ success: true, data: examData })

    const result = await examService.createExam(examData)

    expect(api.post).toHaveBeenCalledWith('/api/exams', examData)
    expect(result).toEqual({ success: true, data: examData })
  })

  test('updateExam examId ve veri ile put çağırmalı', async () => {
    const examData = {
      title: 'Güncel Sınav',
      duration: 90,
    }

    api.put.mockResolvedValue({ success: true, data: examData })

    const result = await examService.updateExam('exam-1', examData)

    expect(api.put).toHaveBeenCalledWith('/api/exams/exam-1', examData)
    expect(result).toEqual({ success: true, data: examData })
  })

  test('deleteExam examId ile delete çağırmalı', async () => {
    api.delete.mockResolvedValue({ success: true })

    const result = await examService.deleteExam('exam-1')

    expect(api.delete).toHaveBeenCalledWith('/api/exams/exam-1')
    expect(result).toEqual({ success: true })
  })

  test('joinByCode öğrenci bilgileriyle sınava katılmalı', async () => {
    api.post.mockResolvedValue({ success: true })

    const result = await examService.joinByCode('DEMO01', {
      studentId: 'student-1',
      studentName: 'Ali Yılmaz',
    })

    expect(api.post).toHaveBeenCalledWith('/api/exams/join', {
      code: 'DEMO01',
      studentId: 'student-1',
      studentName: 'Ali Yılmaz',
    })

    expect(result).toEqual({ success: true })
  })

  test('joinByCode öğrenci bilgisi yoksa default değerlerle çağırmalı', async () => {
    api.post.mockResolvedValue({ success: true })

    await examService.joinByCode('DEMO01')

    expect(api.post).toHaveBeenCalledWith('/api/exams/join', {
      code: 'DEMO01',
      studentId: 'student-1',
      studentName: '',
    })
  })

  test('startSession öğrenci bilgileriyle session başlatmalı', async () => {
    api.post.mockResolvedValue({ success: true, sessionId: 'session-1' })

    const result = await examService.startSession('exam-1', {
      studentId: 'student-1',
      studentName: 'Ali Yılmaz',
    })

    expect(api.post).toHaveBeenCalledWith('/api/exams/exam-1/start', {
      studentId: 'student-1',
      studentName: 'Ali Yılmaz',
    })

    expect(result).toEqual({ success: true, sessionId: 'session-1' })
  })

  test('startSession öğrenci bilgisi yoksa default değerlerle çağırmalı', async () => {
    api.post.mockResolvedValue({ success: true })

    await examService.startSession('exam-1')

    expect(api.post).toHaveBeenCalledWith('/api/exams/exam-1/start', {
      studentId: 'student-1',
      studentName: '',
    })
  })

  test('getSession sessionId ile oturum bilgisini getirmeli', async () => {
    api.get.mockResolvedValue({ success: true, data: { id: 'session-1' } })

    const result = await examService.getSession('session-1')

    expect(api.get).toHaveBeenCalledWith('/api/sessions/session-1')
    expect(result).toEqual({ success: true, data: { id: 'session-1' } })
  })

  test('submitAnswer sessionId, questionId ve answer ile cevap göndermeli', async () => {
    api.post.mockResolvedValue({ success: true })

    const result = await examService.submitAnswer(
      'session-1',
      'question-1',
      'A'
    )

    expect(api.post).toHaveBeenCalledWith('/api/sessions/session-1/answer', {
      questionId: 'question-1',
      answer: 'A',
    })

    expect(result).toEqual({ success: true })
  })

  test('finishSession verilen data ile sınavı bitirmeli', async () => {
    const finishData = {
      answers: {
        q1: 'A',
      },
      riskScore: 75,
      riskLevel: 'HIGH',
      eventCounts: {
        TAB_SWITCH: 2,
      },
      proctoringSummary: {
        tab: 2,
      },
      status: 'submitted',
    }

    api.post.mockResolvedValue({ success: true })

    const result = await examService.finishSession(
      'exam-1',
      'session-1',
      finishData
    )

    expect(api.post).toHaveBeenCalledWith('/api/exams/exam-1/end', {
      sessionId: 'session-1',
      answers: {
        q1: 'A',
      },
      riskScore: 75,
      riskLevel: 'HIGH',
      eventCounts: {
        TAB_SWITCH: 2,
      },
      proctoringSummary: {
        tab: 2,
      },
      status: 'submitted',
    })

    expect(result).toEqual({ success: true })
  })

  test('finishSession data verilmezse default değerlerle çağırmalı', async () => {
    api.post.mockResolvedValue({ success: true })

    await examService.finishSession('exam-1', 'session-1')

    expect(api.post).toHaveBeenCalledWith('/api/exams/exam-1/end', {
      sessionId: 'session-1',
      answers: {},
      riskScore: 0,
      riskLevel: 'LOW',
      eventCounts: {},
      proctoringSummary: {},
      status: 'submitted',
    })
  })

  test('getSessionResults sessionId ile sonuçları getirmeli', async () => {
    api.get.mockResolvedValue({ success: true, data: { score: 80 } })

    const result = await examService.getSessionResults('session-1')

    expect(api.get).toHaveBeenCalledWith('/api/sessions/session-1/results')
    expect(result).toEqual({ success: true, data: { score: 80 } })
  })

  test('getExamSessions examId ile sınav oturumlarını getirmeli', async () => {
    api.get.mockResolvedValue({ success: true, data: [] })

    const result = await examService.getExamSessions('exam-1')

    expect(api.get).toHaveBeenCalledWith('/api/exams/exam-1/sessions')
    expect(result).toEqual({ success: true, data: [] })
  })

  test('getStudentExamHistory studentId, page ve limit encode ederek çağırmalı', async () => {
    api.get.mockResolvedValue({ success: true, data: [] })

    const result = await examService.getStudentExamHistory(
      'student 1',
      2,
      10
    )

    expect(api.get).toHaveBeenCalledWith(
      '/api/sessions/student/student%201/history?page=2&limit=10'
    )

    expect(result).toEqual({ success: true, data: [] })
  })

  test('getStudentExamHistory page ve limit verilmezse default değerlerle çağırmalı', async () => {
    api.get.mockResolvedValue({ success: true, data: [] })

    await examService.getStudentExamHistory('student-1')

    expect(api.get).toHaveBeenCalledWith(
      '/api/sessions/student/student-1/history?page=1&limit=5'
    )
  })
})
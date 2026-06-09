import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest'

const mockSocket = {
  id: 'socket-1',
  on: vi.fn(),
  emit: vi.fn(),
  disconnect: vi.fn(),
}

vi.mock('socket.io-client', () => ({
  io: vi.fn(() => mockSocket),
}))

import { io } from 'socket.io-client'
import proctoringService from './proctoring.js'

describe('proctoring service', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    global.fetch = vi.fn()

    vi.spyOn(console, 'warn').mockImplementation(() => {})
    vi.spyOn(console, 'log').mockImplementation(() => {})

    proctoringService.disconnectSocket()
  })

  afterEach(() => {
    vi.restoreAllMocks()
    proctoringService.disconnectSocket()
  })

  test('startSession başarılı olursa response dönmeli', async () => {
    fetch.mockResolvedValue({
      ok: true,
      json: vi.fn(() => Promise.resolve({ success: true })),
    })

    const result = await proctoringService.startSession({
      sessionId: 'session-1',
    })

    expect(fetch).toHaveBeenCalledWith('/api/proctoring/sessions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId: 'session-1',
      }),
    })

    expect(result).toEqual({ success: true })
  })

  test('startSession hata alırsa null dönmeli', async () => {
    fetch.mockResolvedValue({
      ok: false,
      status: 500,
      json: vi.fn(),
    })

    const result = await proctoringService.startSession({
      sessionId: 'session-1',
    })

    expect(result).toBeNull()
    expect(console.warn).toHaveBeenCalled()
  })

  test('completeSession başarılı olursa response dönmeli', async () => {
    fetch.mockResolvedValue({
      ok: true,
      json: vi.fn(() => Promise.resolve({ completed: true })),
    })

    const result = await proctoringService.completeSession('session-1', {
      status: 'submitted',
    })

    expect(fetch).toHaveBeenCalledWith(
      '/api/proctoring/sessions/session-1/complete',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'submitted',
        }),
      }
    )

    expect(result).toEqual({ completed: true })
  })

  test('completeSession hata alırsa null dönmeli', async () => {
    fetch.mockResolvedValue({
      ok: false,
      status: 500,
      json: vi.fn(),
    })

    const result = await proctoringService.completeSession('session-1')

    expect(result).toBeNull()
    expect(console.warn).toHaveBeenCalled()
  })

  test('logEvent payload ile event kaydı göndermeli', async () => {
    fetch.mockResolvedValue({
      ok: true,
      json: vi.fn(() => Promise.resolve({ logged: true })),
    })

    const payload = {
      source: 'camera',
      message: 'Yüz algılanmadı',
      riskScore: 80,
      riskLevel: 'HIGH',
      examId: 'exam-1',
      examTitle: 'Matematik',
      examCode: 'DEMO01',
      instructorId: 'teacher-1',
      studentId: 'student-1',
      studentName: 'Ali',
    }

    const result = await proctoringService.logEvent(
      'session-1',
      'FACE_MISSING',
      payload
    )

    expect(fetch).toHaveBeenCalledWith('/api/proctoring/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId: 'session-1',
        eventType: 'FACE_MISSING',
        source: 'camera',
        message: 'Yüz algılanmadı',
        payload,
        riskScore: 80,
        riskLevel: 'HIGH',
        examId: 'exam-1',
        examTitle: 'Matematik',
        examCode: 'DEMO01',
        instructorId: 'teacher-1',
        studentId: 'student-1',
        studentName: 'Ali',
      }),
    })

    expect(result).toEqual({ logged: true })
  })

  test('logEvent payload yoksa default source ve message kullanmalı', async () => {
    fetch.mockResolvedValue({
      ok: true,
      json: vi.fn(() => Promise.resolve({ logged: true })),
    })

    await proctoringService.logEvent('session-1', 'TAB_SWITCH')

    expect(fetch).toHaveBeenCalledWith('/api/proctoring/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId: 'session-1',
        eventType: 'TAB_SWITCH',
        source: 'system',
        message: '',
        payload: {},
      }),
    })
  })

  test('logEvent hata alırsa null dönmeli', async () => {
    fetch.mockResolvedValue({
      ok: false,
      status: 500,
      json: vi.fn(),
    })

    const result = await proctoringService.logEvent('session-1', 'ERROR')

    expect(result).toBeNull()
    expect(console.warn).toHaveBeenCalled()
  })

  test('analyzeFrame başarılı olursa response dönmeli', async () => {
    fetch.mockResolvedValue({
      ok: true,
      json: vi.fn(() =>
        Promise.resolve({
          face: { face_detected: true },
          gaze: { looking_away: false },
        })
      ),
    })

    const result = await proctoringService.analyzeFrame('session-1', 'BASE64', {
      frame: 1,
    })

    expect(fetch).toHaveBeenCalledWith('/api/proctoring/analyze/frame', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId: 'session-1',
        imageBase64: 'BASE64',
        payload: {
          frame: 1,
        },
      }),
    })

    expect(result).toEqual({
      face: { face_detected: true },
      gaze: { looking_away: false },
    })
  })

  test('analyzeFrame hata alırsa null dönmeli', async () => {
    fetch.mockResolvedValue({
      ok: false,
      status: 500,
      json: vi.fn(),
    })

    const result = await proctoringService.analyzeFrame('session-1', 'BASE64')

    expect(result).toBeNull()
  })

  test('detectFace analyzeFrame response içindeki face bilgisini dönmeli', async () => {
    fetch.mockResolvedValue({
      ok: true,
      json: vi.fn(() =>
        Promise.resolve({
          face: { face_detected: true },
        })
      ),
    })

    const result = await proctoringService.detectFace('session-1', 'BASE64')

    expect(result).toEqual({ face_detected: true })
  })

  test('detectFace response içinde face yoksa null dönmeli', async () => {
    fetch.mockResolvedValue({
      ok: true,
      json: vi.fn(() => Promise.resolve({})),
    })

    const result = await proctoringService.detectFace('session-1', 'BASE64')

    expect(result).toBeNull()
  })

  test('trackGaze analyzeFrame response içindeki gaze bilgisini dönmeli', async () => {
    fetch.mockResolvedValue({
      ok: true,
      json: vi.fn(() =>
        Promise.resolve({
          gaze: { looking_away: false },
        })
      ),
    })

    const result = await proctoringService.trackGaze('session-1', 'BASE64')

    expect(result).toEqual({ looking_away: false })
  })

  test('trackGaze response içinde gaze yoksa null dönmeli', async () => {
    fetch.mockResolvedValue({
      ok: true,
      json: vi.fn(() => Promise.resolve({})),
    })

    const result = await proctoringService.trackGaze('session-1', 'BASE64')

    expect(result).toBeNull()
  })

  test('precheckFace sessionId verilirse body içine eklemeli', async () => {
    fetch.mockResolvedValue({
      ok: true,
      json: vi.fn(() =>
        Promise.resolve({
          face_detected: true,
        })
      ),
    })

    const result = await proctoringService.precheckFace(
      'BASE64',
      'precheck-1'
    )

    expect(fetch).toHaveBeenCalledWith('/api/proctoring/precheck/face', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId: 'precheck-1',
        imageBase64: 'BASE64',
      }),
    })

    expect(result).toEqual({ face_detected: true })
  })

  test('precheckFace hata alırsa null dönmeli', async () => {
    fetch.mockResolvedValue({
      ok: false,
      status: 500,
      json: vi.fn(),
    })

    const result = await proctoringService.precheckFace('BASE64', 'precheck-1')

    expect(result).toBeNull()
  })

  test('analyzeAudio başarılı olursa response dönmeli', async () => {
    fetch.mockResolvedValue({
      ok: true,
      json: vi.fn(() =>
        Promise.resolve({
          audio: { suspicious: false },
        })
      ),
    })

    const result = await proctoringService.analyzeAudio(
      'session-1',
      'AUDIO_BASE64',
      44100,
      { chunk: 1 }
    )

    expect(fetch).toHaveBeenCalledWith('/api/proctoring/analyze/audio', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId: 'session-1',
        audioBase64: 'AUDIO_BASE64',
        sampleRate: 44100,
        payload: {
          chunk: 1,
        },
      }),
    })

    expect(result).toEqual({
      audio: { suspicious: false },
    })
  })

  test('analyzeAudio default sampleRate ve payload ile çağırmalı', async () => {
    fetch.mockResolvedValue({
      ok: true,
      json: vi.fn(() => Promise.resolve({ success: true })),
    })

    await proctoringService.analyzeAudio('session-1', 'AUDIO_BASE64')

    expect(fetch).toHaveBeenCalledWith('/api/proctoring/analyze/audio', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId: 'session-1',
        audioBase64: 'AUDIO_BASE64',
        sampleRate: 16000,
        payload: {},
      }),
    })
  })

  test('analyzeAudio hata alırsa null dönmeli', async () => {
    fetch.mockResolvedValue({
      ok: false,
      status: 500,
      json: vi.fn(),
    })

    const result = await proctoringService.analyzeAudio(
      'session-1',
      'AUDIO_BASE64'
    )

    expect(result).toBeNull()
  })

  test('sendEvent eventType büyük harfe çevrilmeli ve risk dönmeli', async () => {
    fetch.mockResolvedValue({
      ok: true,
      json: vi.fn(() =>
        Promise.resolve({
          risk: {
            risk_score: 50,
            risk_level: 'MEDIUM',
          },
        })
      ),
    })

    const result = await proctoringService.sendEvent('session-1', 'tab_switch', {
      source: 'browser',
      message: 'Sekme değişti',
    })

    expect(fetch).toHaveBeenCalledWith('/api/proctoring/analyze/event', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId: 'session-1',
        eventType: 'TAB_SWITCH',
        source: 'browser',
        message: 'Sekme değişti',
        payload: {
          source: 'browser',
          message: 'Sekme değişti',
        },
      }),
    })

    expect(result).toEqual({
      risk_score: 50,
      risk_level: 'MEDIUM',
    })
  })

  test('sendEvent risk yoksa null dönmeli', async () => {
    fetch.mockResolvedValue({
      ok: true,
      json: vi.fn(() => Promise.resolve({})),
    })

    const result = await proctoringService.sendEvent('session-1', 'event')

    expect(result).toBeNull()
  })

  test('sendEvent hata alırsa null dönmeli', async () => {
    fetch.mockResolvedValue({
      ok: false,
      status: 500,
      json: vi.fn(),
    })

    const result = await proctoringService.sendEvent('session-1', 'event')

    expect(result).toBeNull()
  })

  test('getRiskScore data.risk varsa risk dönmeli', async () => {
    fetch.mockResolvedValue({
      ok: true,
      json: vi.fn(() =>
        Promise.resolve({
          risk: {
            risk_score: 70,
            risk_level: 'HIGH',
          },
        })
      ),
    })

    const result = await proctoringService.getRiskScore('session-1')

    expect(fetch).toHaveBeenCalledWith('/api/proctoring/risk/session-1')
    expect(result).toEqual({
      risk_score: 70,
      risk_level: 'HIGH',
    })
  })

  test('getRiskScore data.risk yoksa data dönmeli', async () => {
    fetch.mockResolvedValue({
      ok: true,
      json: vi.fn(() =>
        Promise.resolve({
          risk_score: 30,
          risk_level: 'LOW',
        })
      ),
    })

    const result = await proctoringService.getRiskScore('session-1')

    expect(result).toEqual({
      risk_score: 30,
      risk_level: 'LOW',
    })
  })

  test('getRiskScore hata alırsa default risk dönmeli', async () => {
    fetch.mockResolvedValue({
      ok: false,
      status: 500,
      json: vi.fn(),
    })

    const result = await proctoringService.getRiskScore('session-1')

    expect(result).toEqual({
      risk_score: 0,
      risk_level: 'LOW',
      reasons: [],
      event_counts: {},
    })
  })

  test('checkHealth servis online ise online true dönmeli', async () => {
    fetch.mockResolvedValue({
      ok: true,
      json: vi.fn(() =>
        Promise.resolve({
          status: 'ok',
        })
      ),
    })

    const result = await proctoringService.checkHealth()

    expect(fetch).toHaveBeenCalledWith('/api/proctoring/health')
    expect(result).toEqual([
      {
        name: 'proctoring',
        url: '/api/proctoring/health',
        status: 'ok',
        online: true,
      },
    ])
  })

  test('checkHealth servis hata verirse offline dönmeli', async () => {
    fetch.mockRejectedValue(new Error('Network error'))

    const result = await proctoringService.checkHealth()

    expect(result).toEqual([
      {
        name: 'proctoring',
        url: '/api/proctoring/health',
        status: 'offline',
        online: false,
      },
    ])
  })

  test('connectSocket socket oluşturmalı ve session varsa join-session emit etmeli', () => {
    const result = proctoringService.connectSocket('session-1')

    expect(io).toHaveBeenCalledWith('http://localhost:3004', {
      transports: ['websocket'],
      autoConnect: true,
    })

    expect(mockSocket.on).toHaveBeenCalledWith('connect', expect.any(Function))
    expect(mockSocket.on).toHaveBeenCalledWith('disconnect', expect.any(Function))
    expect(mockSocket.on).toHaveBeenCalledWith(
      'proctoring-error',
      expect.any(Function)
    )

    expect(mockSocket.emit).toHaveBeenCalledWith('join-session', 'session-1')
    expect(result).toBe(mockSocket)
  })

  test('connectSocket sessionId yoksa join-session emit etmemeli', () => {
    proctoringService.connectSocket()

    expect(mockSocket.emit).not.toHaveBeenCalledWith(
      'join-session',
      expect.anything()
    )
  })

  test('disconnectSocket aktif socket varsa disconnect etmeli', () => {
    proctoringService.connectSocket('session-1')

    proctoringService.disconnectSocket()

    expect(mockSocket.disconnect).toHaveBeenCalledTimes(1)
  })

  test('analyzeFrameSocket success response resolve etmeli', async () => {
    mockSocket.emit.mockImplementation((event, payload, callback) => {
      callback({
        success: true,
        frame: {
          ok: true,
        },
      })
    })

    const result = await proctoringService.analyzeFrameSocket(
      'session-1',
      'BASE64',
      { frame: 1 }
    )

    expect(mockSocket.emit).toHaveBeenCalledWith(
      'proctoring-frame',
      {
        sessionId: 'session-1',
        imageBase64: 'BASE64',
        payload: {
          frame: 1,
        },
      },
      expect.any(Function)
    )

    expect(result).toEqual({
      success: true,
      frame: {
        ok: true,
      },
    })
  })

  test('analyzeFrameSocket başarısız response reject etmeli', async () => {
    mockSocket.emit.mockImplementation((event, payload, callback) => {
      callback({
        success: false,
        message: 'Frame hatası',
      })
    })

    await expect(
      proctoringService.analyzeFrameSocket('session-1', 'BASE64')
    ).rejects.toThrow('Frame hatası')
  })

  test('sendEventSocket success response resolve etmeli', async () => {
    mockSocket.emit.mockImplementation((event, payload, callback) => {
      callback({
        success: true,
        risk: {
          risk_score: 20,
        },
      })
    })

    const result = await proctoringService.sendEventSocket(
      'session-1',
      'TAB_SWITCH',
      {
        source: 'browser',
        message: 'Sekme değişimi',
      }
    )

    expect(mockSocket.emit).toHaveBeenCalledWith(
      'proctoring-event',
      {
        sessionId: 'session-1',
        eventType: 'TAB_SWITCH',
        source: 'browser',
        message: 'Sekme değişimi',
        payload: {
          source: 'browser',
          message: 'Sekme değişimi',
        },
      },
      expect.any(Function)
    )

    expect(result).toEqual({
      success: true,
      risk: {
        risk_score: 20,
      },
    })
  })

  test('sendEventSocket payload yoksa default source ve message kullanmalı', async () => {
    mockSocket.emit.mockImplementation((event, payload, callback) => {
      callback({
        success: true,
      })
    })

    await proctoringService.sendEventSocket('session-1', 'TAB_SWITCH')

    expect(mockSocket.emit).toHaveBeenCalledWith(
      'proctoring-event',
      {
        sessionId: 'session-1',
        eventType: 'TAB_SWITCH',
        source: 'system',
        message: '',
        payload: {},
      },
      expect.any(Function)
    )
  })

  test('sendEventSocket başarısız response reject etmeli', async () => {
    mockSocket.emit.mockImplementation((event, payload, callback) => {
      callback({
        success: false,
        message: 'Event hatası',
      })
    })

    await expect(
      proctoringService.sendEventSocket('session-1', 'TAB_SWITCH')
    ).rejects.toThrow('Event hatası')
  })
})
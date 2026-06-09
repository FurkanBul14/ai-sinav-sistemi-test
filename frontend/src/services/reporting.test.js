import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest'

import reportingService from './reporting.js'

describe('reporting service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    global.fetch = vi.fn()

    vi.spyOn(console, 'warn').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  test('getReports filtre olmadan rapor listesini döndürmeli', async () => {
    fetch.mockResolvedValue({
      ok: true,
      json: vi.fn(() =>
        Promise.resolve({
          reports: [
            {
              sessionId: 's1',
              studentName: 'Ali',
            },
          ],
        })
      ),
    })

    const result = await reportingService.getReports()

    expect(fetch).toHaveBeenCalledWith('/api/reports')

    expect(result).toEqual([
      {
        sessionId: 's1',
        studentName: 'Ali',
      },
    ])
  })

  test('getReports filtreleri query string olarak göndermeli', async () => {
    fetch.mockResolvedValue({
      ok: true,
      json: vi.fn(() =>
        Promise.resolve({
          reports: [],
        })
      ),
    })

    await reportingService.getReports({
      riskLevel: 'HIGH',
      status: 'submitted',
    })

    expect(fetch).toHaveBeenCalledWith(
      '/api/reports?riskLevel=HIGH&status=submitted'
    )
  })

  test('getReports boş response gelirse boş array dönmeli', async () => {
    fetch.mockResolvedValue({
      ok: true,
      json: vi.fn(() =>
        Promise.resolve({})
      ),
    })

    const result = await reportingService.getReports()

    expect(result).toEqual([])
  })

  test('getReports hata alırsa fallback raporları dönmeli', async () => {
    fetch.mockResolvedValue({
      ok: false,
      status: 500,
      json: vi.fn(),
    })

    const result = await reportingService.getReports()

    expect(console.warn).toHaveBeenCalled()

    expect(result[0].sessionId).toBe('demo-session')
    expect(result[0].studentName).toBe('Demo Ogrenci')
  })

  test('getReports fetch exception alırsa fallback raporları dönmeli', async () => {
    fetch.mockRejectedValue(new Error('Network Error'))

    const result = await reportingService.getReports()

    expect(console.warn).toHaveBeenCalled()

    expect(result[0].sessionId).toBe('demo-session')
  })

  test('getReport sessionId verilmezse ilk fallback raporu dönmeli', async () => {
    const result = await reportingService.getReport()

    expect(result.sessionId).toBe('demo-session')
    expect(result.studentName).toBe('Demo Ogrenci')
  })

  test('getReport rapor detayını döndürmeli', async () => {
    fetch.mockResolvedValue({
      ok: true,
      json: vi.fn(() =>
        Promise.resolve({
          report: {
            sessionId: 's123',
            studentName: 'Ali',
            riskScore: 70,
          },
        })
      ),
    })

    const result = await reportingService.getReport('s123')

    expect(fetch).toHaveBeenCalledWith('/api/reports/s123')

    expect(result).toEqual({
      sessionId: 's123',
      studentName: 'Ali',
      riskScore: 70,
    })
  })

  test('getReport hata alırsa sessionId eşleşen fallback raporu dönmeli', async () => {
    fetch.mockResolvedValue({
      ok: false,
      status: 404,
      json: vi.fn(),
    })

    const result = await reportingService.getReport('demo-session')

    expect(console.warn).toHaveBeenCalled()

    expect(result.sessionId).toBe('demo-session')
  })

  test('getReport hata alırsa eşleşen fallback yoksa ilk fallback raporu dönmeli', async () => {
    fetch.mockResolvedValue({
      ok: false,
      status: 404,
      json: vi.fn(),
    })

    const result = await reportingService.getReport('olmayan-session')

    expect(console.warn).toHaveBeenCalled()

    expect(result.sessionId).toBe('demo-session')
    expect(result.studentName).toBe('Demo Ogrenci')
  })

  test('getReport fetch exception alırsa fallback raporu dönmeli', async () => {
    fetch.mockRejectedValue(new Error('Network Error'))

    const result = await reportingService.getReport('s123')

    expect(console.warn).toHaveBeenCalled()

    expect(result.sessionId).toBe('demo-session')
  })
})
import {
  buildViolationAlert,
  MAX_BROWSER_VIOLATIONS,
} from './alert'

describe('alert utility', () => {
  test('hiç ihlal yoksa boş mesaj dönmeli', () => {
    const result = buildViolationAlert({
      count: 0,
      isFullscreen: true,
      isTabVisible: true,
    })

    expect(result).toEqual({
      count: 0,
      terminating: false,
      messages: [],
    })
  })

  test('tam ekran ihlali mesajı dönmeli', () => {
    const result = buildViolationAlert({
      count: 1,
      isFullscreen: false,
      isTabVisible: true,
    })

    expect(result.count).toBe(1)
    expect(result.terminating).toBe(false)

    expect(result.messages).toContain(
      'Tam ekran modundan çıkıldı. Lütfen yeniden tam ekrana dönün.'
    )
  })

  test('sekme değişimi mesajı dönmeli', () => {
    const result = buildViolationAlert({
      count: 1,
      isFullscreen: true,
      isTabVisible: false,
    })

    expect(result.count).toBe(1)
    expect(result.terminating).toBe(false)

    expect(result.messages).toContain(
      'Sekme değişimi algılandı.'
    )
  })

  test('iki ihlal aynı anda mesajlara eklenmeli', () => {
    const result = buildViolationAlert({
      count: 2,
      isFullscreen: false,
      isTabVisible: false,
    })

    expect(result.messages).toHaveLength(2)

    expect(result.messages).toContain(
      'Tam ekran modundan çıkıldı. Lütfen yeniden tam ekrana dönün.'
    )

    expect(result.messages).toContain(
      'Sekme değişimi algılandı.'
    )
  })

  test('count maksimum limite sabitlenmeli', () => {
    const result = buildViolationAlert({
      count: 99,
      isFullscreen: true,
      isTabVisible: true,
    })

    expect(result.count).toBe(MAX_BROWSER_VIOLATIONS)
  })

  test('limit aşılırsa terminating true olmalı', () => {
    const result = buildViolationAlert({
      count: MAX_BROWSER_VIOLATIONS,
      isFullscreen: true,
      isTabVisible: true,
    })

    expect(result.terminating).toBe(true)
  })

  test('limit altındaysa terminating false olmalı', () => {
    const result = buildViolationAlert({
      count: MAX_BROWSER_VIOLATIONS - 1,
      isFullscreen: true,
      isTabVisible: true,
    })

    expect(result.terminating).toBe(false)
  })
})
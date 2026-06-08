import { render, screen, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi } from 'vitest'

import PreExamCheck from './PreExamCheck'
import proctoringService from '../services/proctoring'

vi.mock('../services/proctoring', () => ({
  default: {
    precheckFace: vi.fn(),
  },
}))

describe('PreExamCheck Page', () => {
  let mockStream
  let originalCreateElement
  let user

  beforeEach(() => {

    user = userEvent.setup()

    mockStream = {
      getTracks: vi.fn(() => [{ stop: vi.fn() }]),
      getVideoTracks: vi.fn(() => [{}]),
      getAudioTracks: vi.fn(() => [{}]),
    }

    Object.defineProperty(navigator, 'mediaDevices', {
      configurable: true,
      value: {
        getUserMedia: vi.fn(() => Promise.resolve(mockStream)),
      },
    })

    Object.defineProperty(navigator, 'onLine', {
      configurable: true,
      value: true,
    })

    Object.defineProperty(document, 'fullscreenElement', {
      configurable: true,
      value: {},
    })

    document.documentElement.requestFullscreen = vi.fn(() =>
      Promise.resolve()
    )

    HTMLMediaElement.prototype.play = vi.fn(() =>
      Promise.resolve()
    )

    Object.defineProperty(HTMLVideoElement.prototype, 'readyState', {
      configurable: true,
      get: () => 4,
    })

    Object.defineProperty(HTMLVideoElement.prototype, 'videoWidth', {
      configurable: true,
      get: () => 640,
    })

    Object.defineProperty(HTMLVideoElement.prototype, 'videoHeight', {
      configurable: true,
      get: () => 480,
    })

    originalCreateElement = document.createElement.bind(document)

    vi.spyOn(document, 'createElement')
      .mockImplementation((tag) => {
        if (tag === 'canvas') {
          return {
            width: 0,
            height: 0,
            getContext: vi.fn(() => ({
              drawImage: vi.fn(),
            })),
            toDataURL: vi.fn(() =>
              'data:image/jpeg;base64,MOCK_FRAME'
            ),
          }
        }

        return originalCreateElement(tag)
      })

    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  test('başlangıç ekranı render edilmeli', () => {
    render(
      <PreExamCheck
        examCode="DEMO01"
        onComplete={() => {}}
        onBack={() => {}}
      />
    )

    expect(screen.getByText('Sınav Öncesi Kontroller')).toBeInTheDocument()
    expect(screen.getByText('Kontrolleri Başlat')).toBeInTheDocument()
    expect(screen.getByText('Sınava Başla')).toBeInTheDocument()
  })

  test('exam code gösterilmeli', () => {
    render(
      <PreExamCheck
        examCode="DEMO01"
        onComplete={() => {}}
        onBack={() => {}}
      />
    )

    expect(screen.getByText('DEMO01')).toBeInTheDocument()
  })

  test('geri butonu onBack çağırmalı', async () => {
    const onBack = vi.fn()

    render(
      <PreExamCheck
        examCode="DEMO01"
        onComplete={() => {}}
        onBack={onBack}
      />
    )

    await user.click(screen.getByText('Koda Dön'))

    expect(onBack).toHaveBeenCalledTimes(1)
  })

  test('başlangıçta sınava başla butonu disabled olmalı', () => {
    render(
      <PreExamCheck
        examCode="DEMO01"
        onComplete={() => {}}
        onBack={() => {}}
      />
    )

    expect(screen.getByText('Sınava Başla')).toBeDisabled()
  })


  test('kamera ve mikrofon erişimi istenmeli', async () => {
    proctoringService.precheckFace.mockResolvedValue({
      canStart: true,
    })

    render(
      <PreExamCheck
        examCode="DEMO01"
        onComplete={() => {}}
        onBack={() => {}}
      />
    )

    await user.click(screen.getByText('Kontrolleri Başlat'))

    expect(navigator.mediaDevices.getUserMedia).toHaveBeenCalledWith({
      video: {
        width: 640,
        height: 480,
        facingMode: 'user',
      },
      audio: true,
    })
  })

  test('face check başarılı olursa sınava başla aktifleşmeli', async () => {
    proctoringService.precheckFace.mockResolvedValue({
      canStart: true,
    })

    render(
      <PreExamCheck
        examCode="DEMO01"
        onComplete={() => {}}
        onBack={() => {}}
      />
    )

    await user.click(screen.getByText('Kontrolleri Başlat'))

    await screen.findByText('Yüz onayı alındı. Sınava başlayabilirsiniz.')

    expect(proctoringService.precheckFace).toHaveBeenCalled()

    expect(screen.getByText('Sınava Başla')).not.toBeDisabled()

    expect(
      screen.getByText('Yüz onayı alındı. Sınava başlayabilirsiniz.')
    ).toBeInTheDocument()
  })

  test('face check başarısız olursa hata mesajı gösterilmeli', async () => {
    proctoringService.precheckFace.mockResolvedValue({
      canStart: false,
    })

    render(
      <PreExamCheck
        examCode="DEMO01"
        onComplete={() => {}}
        onBack={() => {}}
      />
    )

    await user.click(screen.getByText('Kontrolleri Başlat'))
    await screen.findByText('Yüz algılanmadı veya birden fazla yüz görüldü. Tekrar deneyin.')

    expect(
      screen.getByText('Yüz algılanmadı veya birden fazla yüz görüldü. Tekrar deneyin.')
    ).toBeInTheDocument()

    expect(screen.getByText('Sınava Başla')).toBeDisabled()
  })

  test('sınava başla butonu onComplete çağırmalı', async () => {
    proctoringService.precheckFace.mockResolvedValue({
      canStart: true,
    })

    const onComplete = vi.fn()

    render(
      <PreExamCheck
        examCode="DEMO01"
        onComplete={onComplete}
        onBack={() => {}}
      />
    )

    await user.click(screen.getByText('Kontrolleri Başlat'))

    await screen.findByText('Yüz onayı alındı. Sınava başlayabilirsiniz.')

    await user.click(screen.getByText('Sınava Başla'))

    expect(onComplete).toHaveBeenCalledTimes(1)
  })
})
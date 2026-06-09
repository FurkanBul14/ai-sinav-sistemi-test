import { render, screen, cleanup } from '@testing-library/react'
import { vi } from 'vitest'

import MicMonitor from './MicMonitor'
import proctoringService from '../../services/proctoring'

vi.mock('../../services/proctoring', () => ({
  default: {
    analyzeAudio: vi.fn(() => Promise.resolve()),
  },
}))

describe('MicMonitor Component', () => {

  let mockAnalyser
  let mockAudioContext
  let mockScriptNode
  let mockSource

  beforeEach(() => {

    mockAnalyser = {
      fftSize: 0,
      frequencyBinCount: 32,
      getByteFrequencyData: vi.fn(),
    }

    mockScriptNode = {
      connect: vi.fn(),
      disconnect: vi.fn(),
      onaudioprocess: null,
    }

    mockSource = {
      connect: vi.fn(),
    }

    mockAudioContext = {
      createAnalyser: vi.fn(() => mockAnalyser),
      createMediaStreamSource: vi.fn(() => mockSource),
      createScriptProcessor: vi.fn(() => mockScriptNode),
      close: vi.fn(),
      destination: {},
      sampleRate: 16000,
      state: 'running',
    }

    global.AudioContext = vi.fn(() => mockAudioContext)
    global.webkitAudioContext = vi.fn(() => mockAudioContext)

    global.FileReader = class {
      readAsDataURL() {
        this.result = 'data:audio;base64,MOCK_AUDIO'
        this.onloadend()
      }
    }

    global.Blob = vi.fn(() => ({}))

    vi.clearAllMocks()
  })

  afterEach(() => {
    cleanup()
  })

  test('proctoring başlamadıysa render etmemeli', () => {
    const { container } = render(
      <MicMonitor
        stream={{}}
        sessionId="session-1"
        isProctoringStarted={false}
      />
    )

    expect(container.firstChild).toBeNull()
  })

  test('proctoring başladıysa mic monitor görünmeli', () => {
    render(
      <MicMonitor
        stream={{}}
        sessionId="session-1"
        isProctoringStarted={true}
      />
    )

    expect(
      screen.getByText('Mic')
    ).toBeInTheDocument()
  })

  test('AudioContext oluşturulmalı', () => {
    render(
      <MicMonitor
        stream={{}}
        sessionId="session-1"
        isProctoringStarted={true}
      />
    )

    expect(global.AudioContext).toHaveBeenCalled()
  })

  test('Analyser oluşturulmalı', () => {
    render(
      <MicMonitor
        stream={{}}
        sessionId="session-1"
        isProctoringStarted={true}
      />
    )

    expect(
      mockAudioContext.createAnalyser
    ).toHaveBeenCalled()
  })

  test('Media stream source oluşturulmalı', () => {
    const stream = { id: 'mock-stream' }

    render(
      <MicMonitor
        stream={stream}
        sessionId="session-1"
        isProctoringStarted={true}
      />
    )

    expect(
      mockAudioContext.createMediaStreamSource
    ).toHaveBeenCalledWith(stream)
  })

  test('cleanup sırasında audio context kapatılmalı', () => {
    const { unmount } = render(
      <MicMonitor
        stream={{}}
        sessionId="session-1"
        isProctoringStarted={true}
      />
    )

    unmount()

    expect(mockAudioContext.close).toHaveBeenCalled()
  })

  test('script processor disconnect edilmeli', () => {
    const { unmount } = render(
      <MicMonitor
        stream={{}}
        sessionId="session-1"
        isProctoringStarted={true}
      />
    )

    unmount()

    expect(
      mockScriptNode.disconnect
    ).toHaveBeenCalled()
  })

  test('audio process sonrası analyzeAudio çağrılmalı', async () => {

    render(
      <MicMonitor
        stream={{}}
        sessionId="session-1"
        isProctoringStarted={true}
      />
    )

    const fakeInputData = new Float32Array(50000).fill(0.5)

    mockScriptNode.onaudioprocess({
      inputBuffer: {
        getChannelData: () => fakeInputData,
      },
    })

    await Promise.resolve()

    expect(
      proctoringService.analyzeAudio
    ).toHaveBeenCalled()
  })

})
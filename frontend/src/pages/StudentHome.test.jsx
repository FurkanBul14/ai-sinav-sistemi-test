import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi } from 'vitest'

import StudentHome from './StudentHome'
import authService from '../services/auth.js'
import examService from '../services/exam.js'

vi.mock('../services/auth.js', () => ({
  default: {
    getCurrentUser: vi.fn(),
  },
}))

vi.mock('../services/exam.js', () => ({
  default: {
    joinByCode: vi.fn(),
  },
}))

describe('StudentHome Page', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    authService.getCurrentUser.mockReturnValue({
      id: 'student-1',
      name: 'Ali Yılmaz',
      role: 'student',
    })
  })

  test('öğrenci ekranı render edilmeli', () => {
    render(
      <StudentHome
        onNavigate={() => {}}
        onLogout={() => {}}
      />
    )

    expect(screen.getByText('Öğrenci Ekranı')).toBeInTheDocument()
    expect(screen.getByText('Merhaba, Ali Yılmaz')).toBeInTheDocument()
    expect(screen.getByLabelText('Sınav Kodu')).toBeInTheDocument()
    expect(screen.getByText('Kontrole Geç')).toBeInTheDocument()
    expect(screen.getByText('Çıkış Yap')).toBeInTheDocument()
  })

  test('kullanıcı adı yoksa Öğrenci yazmalı', () => {
    authService.getCurrentUser.mockReturnValue(null)

    render(
      <StudentHome
        onNavigate={() => {}}
        onLogout={() => {}}
      />
    )

    expect(screen.getByText('Merhaba, Öğrenci')).toBeInTheDocument()
  })

  test('sınav kodu inputa yazılırken büyük harfe çevrilmeli', async () => {
    render(
      <StudentHome
        onNavigate={() => {}}
        onLogout={() => {}}
      />
    )

    const input = screen.getByLabelText('Sınav Kodu')

    await userEvent.type(input, 'abc123')

    expect(input).toHaveValue('ABC123')
  })

  test('boş sınav kodu ile submit edilirse hata mesajı göstermeli', async () => {
    render(
      <StudentHome
        onNavigate={() => {}}
        onLogout={() => {}}
      />
    )

    await userEvent.click(screen.getByText('Kontrole Geç'))

    expect(
      screen.getByText('Sınava devam etmek için sınav kodunu girin.')
    ).toBeInTheDocument()

    expect(examService.joinByCode).not.toHaveBeenCalled()
  })

  test('geçerli sınav kodu ile joinByCode çağrılmalı ve pre-exam-check sayfasına yönlenmeli', async () => {
    const mockNavigate = vi.fn()

    examService.joinByCode.mockResolvedValue({
      success: true,
    })

    render(
      <StudentHome
        onNavigate={mockNavigate}
        onLogout={() => {}}
      />
    )

    await userEvent.type(
      screen.getByLabelText('Sınav Kodu'),
      'demo01'
    )

    await userEvent.click(screen.getByText('Kontrole Geç'))

    expect(examService.joinByCode).toHaveBeenCalledWith(
      'DEMO01',
      {
        studentId: 'student-1',
        studentName: 'Ali Yılmaz',
      }
    )

    expect(mockNavigate).toHaveBeenCalledWith(
      'pre-exam-check',
      {
        examCode: 'DEMO01',
      }
    )
  })

  test('joinByCode hata verirse hata mesajı göstermeli', async () => {
    examService.joinByCode.mockRejectedValue(
      new Error('Sınav kodu geçersiz')
    )

    render(
      <StudentHome
        onNavigate={() => {}}
        onLogout={() => {}}
      />
    )

    await userEvent.type(
      screen.getByLabelText('Sınav Kodu'),
      'wrong'
    )

    await userEvent.click(screen.getByText('Kontrole Geç'))

    expect(
      await screen.findByText('Sınav kodu geçersiz')
    ).toBeInTheDocument()
  })

  test('yükleme sırasında buton metni değişmeli', async () => {
    examService.joinByCode.mockImplementation(
      () => new Promise(() => {})
    )

    render(
      <StudentHome
        onNavigate={() => {}}
        onLogout={() => {}}
      />
    )

    await userEvent.type(
      screen.getByLabelText('Sınav Kodu'),
      'DEMO01'
    )

    await userEvent.click(screen.getByText('Kontrole Geç'))

    expect(
      screen.getByText('Kontrol Ediliyor...')
    ).toBeInTheDocument()

    expect(
      screen.getByLabelText('Sınav Kodu')
    ).toBeDisabled()
  })

  test('çıkış butonuna basınca onLogout çalışmalı', async () => {
    const mockLogout = vi.fn()

    render(
      <StudentHome
        onNavigate={() => {}}
        onLogout={mockLogout}
      />
    )

    await userEvent.click(screen.getByText('Çıkış Yap'))

    expect(mockLogout).toHaveBeenCalledTimes(1)
  })
})
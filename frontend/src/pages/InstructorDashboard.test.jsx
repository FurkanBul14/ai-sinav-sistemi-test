import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi } from 'vitest'

import InstructorDashboard from './InstructorDashboard'

const reports = [
  {
    sessionId: 's1',
    studentName: 'Ali Yilmaz',
    examTitle: 'Matematik Vize',
    examId: 'exam-1',
    riskScore: 24,
    riskLevel: 'LOW',
    status: 'submitted',
  },
  {
    sessionId: 's2',
    studentName: 'Ayse Demir',
    examTitle: 'Fizik Final',
    examId: 'exam-2',
    riskScore: 78,
    riskLevel: 'HIGH',
    status: 'active',
  },
]

vi.mock('../services/reporting.js', () => ({
  default: {
    getReports: vi.fn(() => Promise.resolve(reports)),
  },
}))

vi.mock('../services/auth.js', () => ({
  default: {
    getCurrentUser: vi.fn(() => ({
      id: 'admin-1',
      name: 'Eğitmen',
      role: 'admin',
    })),
  },
}))

vi.mock('../services/exam.js', () => ({
  default: {
    createExam: vi.fn(),
  },
}))

describe('InstructorDashboard Page', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
  })

  test('navbar ve dashboard basligi render edilmeli', () => {
    render(<InstructorDashboard onNavigate={() => {}} onLogout={() => {}} />)

    expect(screen.getAllByText('Dashboard')).toHaveLength(2)
    expect(screen.getByText('Sınav Oluştur')).toBeInTheDocument()
    expect(screen.getByText('Raporlar')).toBeInTheDocument()
    expect(screen.getByText('Çıkış')).toBeInTheDocument()
  })

  test('AlertFeed istatistikleri render edilmeli', async () => {
    render(<InstructorDashboard onNavigate={() => {}} onLogout={() => {}} />)

    expect(screen.getByText('Bugünkü Aktif Sınavlar')).toBeInTheDocument()
    expect(screen.getByText('Aktif Oturumlar')).toBeInTheDocument()
    expect(screen.getByText('Kritik Alarm')).toBeInTheDocument()

    expect(await screen.findByText('2')).toBeInTheDocument()
    expect(screen.getAllByText('1')).toHaveLength(2)  })

  test('StudentGrid ogrenci bilgileri render edilmeli', async () => {
    render(<InstructorDashboard onNavigate={() => {}} onLogout={() => {}} />)

    expect(await screen.findByText('Ali Yilmaz')).toBeInTheDocument()
    expect(screen.getByText('Ayse Demir')).toBeInTheDocument()
    expect(screen.getByText('Matematik Vize')).toBeInTheDocument()
    expect(screen.getByText('Fizik Final')).toBeInTheDocument()
  })

  test('Raporlar butonuna tiklaninca onNavigate report ile calismali', async () => {
    const mockNavigate = vi.fn()

    render(<InstructorDashboard onNavigate={mockNavigate} onLogout={() => {}} />)

    await userEvent.click(screen.getByText('Raporlar'))

    expect(mockNavigate).toHaveBeenCalledTimes(1)
    expect(mockNavigate).toHaveBeenCalledWith('report')
  })

  test('StudentGrid icindeki Rapor butonuna tiklaninca session ile calismali', async () => {
    const mockNavigate = vi.fn()

    render(<InstructorDashboard onNavigate={mockNavigate} onLogout={() => {}} />)

    const reportButtons = await screen.findAllByText('Rapor')

    await userEvent.click(reportButtons[0])

    expect(mockNavigate).toHaveBeenCalledTimes(1)
    expect(mockNavigate).toHaveBeenCalledWith('report', { sessionId: 's1' })
  })

  test('Çıkış butonuna tiklaninca onLogout calismali', async () => {
    const mockLogout = vi.fn()

    render(<InstructorDashboard onNavigate={() => {}} onLogout={mockLogout} />)

    await userEvent.click(screen.getByText('Çıkış'))

    expect(mockLogout).toHaveBeenCalledTimes(1)
  })
})
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi } from 'vitest'

import AdminPanel from './index.jsx'

const statsResponse = {
  stats: {
    totalTenants: 3,
    activeTenants: 2,
    byPlan: {
      free: { count: 1, totalExams: 10 },
      pro: { count: 1, totalExams: 50 },
      enterprise: { count: 1, totalExams: 200 },
    },
  },
}

const tenantsResponse = {
  tenants: [
    {
      tenantId: 'tenant-1',
      name: 'Test Kurum',
      contactEmail: 'admin@test.com',
      plan: 'pro',
      apiKeyPrefix: 'ak_test',
      isActive: true,
      usage: {
        currentMonthExams: 25,
      },
      quota: {
        examLimit: 100,
      },
    },
  ],
}

describe('AdminPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    global.fetch = vi.fn((url, options = {}) => {
      if (url.includes('/api/admin/stats')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(statsResponse),
        })
      }

      if (url.includes('/api/admin/tenants?')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(tenantsResponse),
        })
      }

      if (url.endsWith('/api/admin/tenants')) {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              credentials: {
                apiKey: 'new-api-key',
                webhookSecret: 'new-webhook-secret',
              },
            }),
        })
      }

      if (url.includes('/regenerate-key')) {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              credentials: {
                apiKey: 'regenerated-api-key',
              },
            }),
        })
      }

      if (url.includes('/regenerate-webhook-secret')) {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              webhookSecret: 'regenerated-webhook-secret',
            }),
        })
      }

      if (url.includes('/api/webhooks/logs/')) {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              logs: [
                {
                  _id: 'log-1',
                  event: 'exam.completed',
                  url: 'https://example.com/webhook',
                  status: 'delivered',
                  responseStatus: 200,
                  durationMs: 120,
                  attempts: 1,
                  maxAttempts: 3,
                  createdAt: '2026-06-09T10:00:00.000Z',
                },
              ],
            }),
        })
      }

      if (url.includes('/api/webhooks/stats/')) {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              stats: {
                total: 10,
                delivered: 8,
                failed: 2,
                successRate: 80,
              },
            }),
        })
      }

      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({}),
      })
    })

    global.alert = vi.fn()
    global.confirm = vi.fn(() => true)
  })

  test('admin panel başlığı, sidebar ve tenant tabı render edilmeli', async () => {
    render(<AdminPanel onNavigate={() => {}} />)

    expect(screen.getByText('Admin Paneli')).toBeInTheDocument()
    expect(screen.getByText('B2B Yönetim')).toBeInTheDocument()
    expect(screen.getByText('Tenantlar')).toBeInTheDocument()
    expect(screen.getByText('API Key Yönet')).toBeInTheDocument()
    expect(screen.getByText('Webhook Logları')).toBeInTheDocument()
    expect(screen.getByText('Kullanım')).toBeInTheDocument()

    expect(await screen.findByText('Test Kurum')).toBeInTheDocument()
    expect(screen.getByText('admin@test.com')).toBeInTheDocument()
    expect(screen.getByText('tenant-1')).toBeInTheDocument()
  })

  test('istatistik barı render edilmeli', async () => {
    render(<AdminPanel onNavigate={() => {}} />)

    expect(await screen.findByText('Toplam Tenant')).toBeInTheDocument()
    expect(screen.getByText('Aktif')).toBeInTheDocument()
    expect(screen.getByText('Free')).toBeInTheDocument()
    expect(screen.getByText('Pro')).toBeInTheDocument()
    expect(screen.getByText('Enterprise')).toBeInTheDocument()
  })

  test('Panele Dön butonu onNavigate çağırmalı', async () => {
    const mockNavigate = vi.fn()

    render(<AdminPanel onNavigate={mockNavigate} />)

    await userEvent.click(screen.getByText('← Panele Dön'))

    expect(mockNavigate).toHaveBeenCalledWith('instructor-dashboard')
  })

  test('tenant arama inputu yazıldığında tenants endpointi search query ile çağrılmalı', async () => {
    render(<AdminPanel onNavigate={() => {}} />)

    const searchInput = await screen.findByPlaceholderText(
      '🔍 Kurum adı, e-posta veya tenant ID ile ara...'
    )

    await userEvent.type(searchInput, 'abc')

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/admin/tenants?search=abc'),
        expect.any(Object)
      )
    })
  })

  test('yeni tenant oluşturma modalı açılmalı ve form gönderilmeli', async () => {
    render(<AdminPanel onNavigate={() => {}} />)

    await userEvent.click(await screen.findByText('+ Yeni Tenant'))

    expect(screen.getByText('Yeni Tenant Oluştur')).toBeInTheDocument()

    await userEvent.type(
      screen.getByPlaceholderText('İstanbul Üniversitesi'),
      'Yeni Kurum'
    )

    await userEvent.type(
      screen.getByPlaceholderText('admin@univ.edu.tr'),
      'admin@yeni.com'
    )

    await userEvent.type(
      screen.getByPlaceholderText('https://...'),
      'https://webhook.test'
    )

    await userEvent.selectOptions(
      screen.getByDisplayValue('Free (100 sınav/ay)'),
      'pro'
    )

    await userEvent.click(screen.getByText('Oluştur'))

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/admin/tenants'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({
            name: 'Yeni Kurum',
            contactEmail: 'admin@yeni.com',
            plan: 'pro',
            webhookUrl: 'https://webhook.test',
          }),
        })
      )
    })

    expect(
      await screen.findByText('⚠️ API Key — Sadece Bir Kez Gösterilir!')
    ).toBeInTheDocument()

    expect(screen.getByText('new-api-key')).toBeInTheDocument()
    expect(screen.getByText('new-webhook-secret')).toBeInTheDocument()
  })

  test('tenant deaktive etme confirm sonrası DELETE çağırmalı', async () => {
    render(<AdminPanel onNavigate={() => {}} />)

    await userEvent.click(await screen.findByText('Deaktive Et'))

    expect(confirm).toHaveBeenCalled()

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/admin/tenants/tenant-1'),
        expect.objectContaining({
          method: 'DELETE',
        })
      )
    })
  })

  test('API Key Yönet tabında api key yenilenmeli', async () => {
    render(<AdminPanel onNavigate={() => {}} />)

    await userEvent.click(screen.getByText('API Key Yönet'))

    await userEvent.type(
      screen.getByPlaceholderText('tenant_xxxxxxxxxxxx'),
      'tenant-1'
    )

    await userEvent.click(screen.getByText('🔄 API Key Yenile'))

    expect(await screen.findByText('regenerated-api-key')).toBeInTheDocument()
  })

  test('API Key Yönet tabında webhook secret yenilenmeli', async () => {
    render(<AdminPanel onNavigate={() => {}} />)

    await userEvent.click(screen.getByText('API Key Yönet'))

    await userEvent.type(
      screen.getByPlaceholderText('tenant_xxxxxxxxxxxx'),
      'tenant-1'
    )

    await userEvent.click(screen.getByText('🔒 Webhook Secret Yenile'))

    expect(
      await screen.findByText('regenerated-webhook-secret')
    ).toBeInTheDocument()
  })

  test('tenant ID boşken key yenilemeye basılırsa alert göstermeli', async () => {
    render(<AdminPanel onNavigate={() => {}} />)

    await userEvent.click(screen.getByText('API Key Yönet'))
    await userEvent.click(screen.getByText('🔄 API Key Yenile'))

    expect(alert).toHaveBeenCalledWith('Tenant ID girin.')
  })

  test('Webhook Logları tabında loglar ve istatistikler render edilmeli', async () => {
    render(<AdminPanel onNavigate={() => {}} />)

    await userEvent.click(screen.getByText('Webhook Logları'))

    await userEvent.type(
      screen.getByPlaceholderText('Tenant ID girin...'),
      'tenant-1'
    )

    await userEvent.click(screen.getByText('Sorgula'))

    expect(await screen.findByText('exam.completed')).toBeInTheDocument()
    expect(screen.getByText('● delivered')).toBeInTheDocument()
    expect(screen.getByText('200')).toBeInTheDocument()
    expect(screen.getByText('120ms')).toBeInTheDocument()

    expect(screen.getByText('Toplam')).toBeInTheDocument()
    expect(screen.getByText('Teslim')).toBeInTheDocument()
    expect(screen.getAllByText('Başarısız').length).toBeGreaterThan(0)
    expect(screen.getByText('Başarı %')).toBeInTheDocument()
  })

test('Kullanım tabında kullanım metrikleri render edilmeli', async () => {
  render(<AdminPanel onNavigate={() => {}} />)

  await userEvent.click(screen.getByText('Kullanım'))

  expect(
    await screen.findByText(/Kullanım Metrikleri/)
  ).toBeInTheDocument()

  expect(screen.getAllByText('Toplam Tenant')).toHaveLength(2)

  expect(screen.getByText('Aktif Tenant')).toBeInTheDocument()

  expect(screen.getByText(/Free\s*Tenantlar/)).toBeInTheDocument()
  expect(screen.getByText(/Pro\s*Tenantlar/)).toBeInTheDocument()
  expect(screen.getByText(/Enterprise\s*Tenantlar/)).toBeInTheDocument()

  expect(screen.getByText(/10/)).toBeInTheDocument()
  expect(screen.getByText(/50/)).toBeInTheDocument()
  expect(screen.getByText(/200/)).toBeInTheDocument()
})
})
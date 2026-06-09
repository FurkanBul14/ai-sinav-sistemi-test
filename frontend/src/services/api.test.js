import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest'

import api from './api'

describe('api service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()

    global.fetch = vi.fn()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  test('getToken localStorage içindeki token değerini dönmeli', () => {
    localStorage.setItem('token', 'access-token')

    expect(api.getToken()).toBe('access-token')
  })

  test('getRefreshToken localStorage içindeki refreshToken değerini dönmeli', () => {
    localStorage.setItem('refreshToken', 'refresh-token')

    expect(api.getRefreshToken()).toBe('refresh-token')
  })

  test('auth header token varsa Authorization eklemeli', async () => {
    localStorage.setItem('token', 'access-token')

    fetch.mockResolvedValue({
      ok: true,
      status: 200,
      text: vi.fn(() => Promise.resolve('{"success":true}')),
    })

    await api.get('/api/test')

    expect(fetch).toHaveBeenCalledWith('/api/test', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer access-token',
      },
    })
  })

  test('post isteğinde body JSON olarak gönderilmeli', async () => {
    fetch.mockResolvedValue({
      ok: true,
      status: 200,
      text: vi.fn(() => Promise.resolve('{"success":true}')),
    })

    await api.post('/api/test', { name: 'Ali' })

    expect(fetch).toHaveBeenCalledWith('/api/test', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name: 'Ali' }),
    })
  })

  test('postPublic auth header göndermemeli', async () => {
    localStorage.setItem('token', 'access-token')

    fetch.mockResolvedValue({
      ok: true,
      status: 200,
      text: vi.fn(() => Promise.resolve('{"success":true}')),
    })

    await api.postPublic('/api/login', { email: 'a@test.com' })

    expect(fetch).toHaveBeenCalledWith('/api/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email: 'a@test.com' }),
    })
  })

  test('başarılı response JSON dönmeli', async () => {
    fetch.mockResolvedValue({
      ok: true,
      status: 200,
      text: vi.fn(() => Promise.resolve('{"message":"ok"}')),
    })

    const result = await api.get('/api/test')

    expect(result).toEqual({ message: 'ok' })
  })

  test('boş response gelirse boş object dönmeli', async () => {
    fetch.mockResolvedValue({
      ok: true,
      status: 204,
      text: vi.fn(() => Promise.resolve('')),
    })

    const result = await api.get('/api/test')

    expect(result).toEqual({})
  })

  test('geçersiz JSON response gelirse hata mesajı hazırlanmalı', async () => {
    fetch.mockResolvedValue({
      ok: false,
      status: 500,
      text: vi.fn(() => Promise.resolve('not-json')),
    })

    await expect(api.get('/api/test')).rejects.toMatchObject({
      message: 'Sunucu geçersiz yanıt döndü (HTTP 500)',
      status: 500,
    })
  })

  test('response ok false ise hata fırlatmalı', async () => {
    fetch.mockResolvedValue({
      ok: false,
      status: 400,
      text: vi.fn(() =>
        Promise.resolve(JSON.stringify({ message: 'Geçersiz istek' }))
      ),
    })

    await expect(api.get('/api/test')).rejects.toMatchObject({
      message: 'Geçersiz istek',
      status: 400,
      data: { message: 'Geçersiz istek' },
    })
  })

  test('network hatası olursa özel hata fırlatmalı', async () => {
    fetch.mockRejectedValue(new Error('Network failed'))

    await expect(api.get('/api/test')).rejects.toMatchObject({
      message:
        'Sunucuya bağlanılamıyor. Lütfen backend servisinin çalıştığından emin olun.',
      status: 0,
    })
  })

  test('401 gelirse refresh token ile yeni token alıp isteği tekrar denemeli', async () => {
    localStorage.setItem('token', 'old-token')
    localStorage.setItem('refreshToken', 'refresh-token')

    fetch
      .mockResolvedValueOnce({
        ok: false,
        status: 401,
        text: vi.fn(() => Promise.resolve('{"message":"Unauthorized"}')),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: vi.fn(() =>
          Promise.resolve({
            success: true,
            data: {
              token: 'new-token',
            },
          })
        ),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: vi.fn(() => Promise.resolve('{"success":true}')),
      })

    const result = await api.get('/api/protected')

    expect(result).toEqual({ success: true })
    expect(localStorage.getItem('token')).toBe('new-token')

    expect(fetch).toHaveBeenCalledTimes(3)

    expect(fetch.mock.calls[0][0]).toBe('/api/protected')
    expect(fetch.mock.calls[0][1].method).toBe('GET')

    expect(fetch).toHaveBeenNthCalledWith(2, '/api/auth/refresh-token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ token: 'refresh-token' }),
    })

    expect(fetch.mock.calls[2][0]).toBe('/api/protected')
    expect(fetch.mock.calls[2][1]).toEqual({
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer new-token',
      },
    })
  })

  test('refresh token başarısız olursa auth bilgileri temizlenmeli', async () => {
    localStorage.setItem('token', 'old-token')
    localStorage.setItem('refreshToken', 'refresh-token')
    localStorage.setItem('user', JSON.stringify({ id: 1 }))

    fetch
      .mockResolvedValueOnce({
        ok: false,
        status: 401,
        text: vi.fn(() => Promise.resolve('{"message":"Unauthorized"}')),
      })
      .mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: vi.fn(() => Promise.resolve({})),
      })

    await expect(api.get('/api/protected')).rejects.toMatchObject({
      message: 'Unauthorized',
      status: 401,
    })

    expect(localStorage.getItem('token')).toBeNull()
    expect(localStorage.getItem('refreshToken')).toBeNull()
    expect(localStorage.getItem('user')).toBeNull()
  })

  test('refreshAccessToken refreshToken yoksa false dönmeli', async () => {
    const result = await api.refreshAccessToken()

    expect(result).toBe(false)
    expect(fetch).not.toHaveBeenCalled()
  })

  test('refreshAccessToken response success değilse false dönmeli', async () => {
    localStorage.setItem('refreshToken', 'refresh-token')

    fetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: vi.fn(() =>
        Promise.resolve({
          success: false,
          data: {},
        })
      ),
    })

    const result = await api.refreshAccessToken()

    expect(result).toBe(false)
  })

  test('refreshAccessToken catch durumunda auth bilgilerini temizlemeli', async () => {
    localStorage.setItem('token', 'old-token')
    localStorage.setItem('refreshToken', 'refresh-token')
    localStorage.setItem('user', JSON.stringify({ id: 1 }))

    fetch.mockRejectedValue(new Error('Network error'))

    const result = await api.refreshAccessToken()

    expect(result).toBe(false)
    expect(localStorage.getItem('token')).toBeNull()
    expect(localStorage.getItem('refreshToken')).toBeNull()
    expect(localStorage.getItem('user')).toBeNull()
  })

  test('put kısayolu PUT request atmalı', async () => {
    fetch.mockResolvedValue({
      ok: true,
      status: 200,
      text: vi.fn(() => Promise.resolve('{"updated":true}')),
    })

    const result = await api.put('/api/item/1', { name: 'Yeni' })

    expect(result).toEqual({ updated: true })

    expect(fetch).toHaveBeenCalledWith('/api/item/1', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name: 'Yeni' }),
    })
  })

  test('delete kısayolu DELETE request atmalı', async () => {
    fetch.mockResolvedValue({
      ok: true,
      status: 200,
      text: vi.fn(() => Promise.resolve('{"deleted":true}')),
    })

    const result = await api.delete('/api/item/1')

    expect(result).toEqual({ deleted: true })

    expect(fetch).toHaveBeenCalledWith('/api/item/1', {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    })
  })

  test('clearAuth auth bilgilerini temizlemeli', () => {
    localStorage.setItem('token', 'access-token')
    localStorage.setItem('refreshToken', 'refresh-token')
    localStorage.setItem('user', JSON.stringify({ id: 1 }))

    api.clearAuth()

    expect(localStorage.getItem('token')).toBeNull()
    expect(localStorage.getItem('refreshToken')).toBeNull()
    expect(localStorage.getItem('user')).toBeNull()
  })
})
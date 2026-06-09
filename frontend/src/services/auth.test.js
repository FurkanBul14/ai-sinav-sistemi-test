import { describe, test, expect, vi, beforeEach } from 'vitest'

import authService from './auth.js'
import api from './api.js'

vi.mock('./api.js', () => ({
  default: {
    postPublic: vi.fn(),
    post: vi.fn(),
    get: vi.fn(),
    put: vi.fn(),
    clearAuth: vi.fn(),
  },
}))

describe('auth service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
  })

  test('register başarılı olursa token, refreshToken ve user localStorage içine kaydedilmeli', async () => {
    api.postPublic.mockResolvedValue({
      success: true,
      data: {
        token: 'access-token',
        refreshToken: 'refresh-token',
        user: {
          id: 'user-1',
          name: 'Ali',
          role: 'student',
        },
      },
    })

    const result = await authService.register({
      name: 'Ali',
      email: 'ali@test.com',
      password: '123456',
      role: 'student',
      instructorCode: '',
    })

    expect(api.postPublic).toHaveBeenCalledWith('/api/auth/register', {
      name: 'Ali',
      email: 'ali@test.com',
      password: '123456',
      role: 'student',
      instructorCode: '',
    })

    expect(result.success).toBe(true)
    expect(localStorage.getItem('token')).toBe('access-token')
    expect(localStorage.getItem('refreshToken')).toBe('refresh-token')
    expect(JSON.parse(localStorage.getItem('user'))).toEqual({
      id: 'user-1',
      name: 'Ali',
      role: 'student',
    })
  })

  test('register başarısız olursa localStorage içine veri yazmamalı', async () => {
    api.postPublic.mockResolvedValue({
      success: false,
      message: 'Kayıt başarısız',
    })

    const result = await authService.register({
      name: 'Ali',
      email: 'ali@test.com',
      password: '123456',
      role: 'student',
      instructorCode: '',
    })

    expect(result.success).toBe(false)
    expect(localStorage.getItem('token')).toBeNull()
    expect(localStorage.getItem('refreshToken')).toBeNull()
    expect(localStorage.getItem('user')).toBeNull()
  })

  test('login başarılı olursa token, refreshToken ve user localStorage içine kaydedilmeli', async () => {
    api.postPublic.mockResolvedValue({
      success: true,
      data: {
        token: 'login-token',
        refreshToken: 'login-refresh-token',
        user: {
          id: 'user-2',
          name: 'Ayşe',
          role: 'instructor',
        },
      },
    })

    const result = await authService.login({
      email: 'ayse@test.com',
      password: '123456',
    })

    expect(api.postPublic).toHaveBeenCalledWith('/api/auth/login', {
      email: 'ayse@test.com',
      password: '123456',
    })

    expect(result.success).toBe(true)
    expect(localStorage.getItem('token')).toBe('login-token')
    expect(localStorage.getItem('refreshToken')).toBe('login-refresh-token')
    expect(JSON.parse(localStorage.getItem('user'))).toEqual({
      id: 'user-2',
      name: 'Ayşe',
      role: 'instructor',
    })
  })

  test('login başarısız olursa localStorage içine veri yazmamalı', async () => {
    api.postPublic.mockResolvedValue({
      success: false,
      message: 'Giriş başarısız',
    })

    const result = await authService.login({
      email: 'wrong@test.com',
      password: 'wrong',
    })

    expect(result.success).toBe(false)
    expect(localStorage.getItem('token')).toBeNull()
    expect(localStorage.getItem('refreshToken')).toBeNull()
    expect(localStorage.getItem('user')).toBeNull()
  })

  test('getMe /api/auth/me endpointine get isteği atmalı', async () => {
    api.get.mockResolvedValue({
      success: true,
      data: {
        id: 'user-1',
      },
    })

    const result = await authService.getMe()

    expect(api.get).toHaveBeenCalledWith('/api/auth/me')
    expect(result.success).toBe(true)
  })

  test('changePassword doğru endpoint ve body ile put çağırmalı', async () => {
    api.put.mockResolvedValue({
      success: true,
    })

    const result = await authService.changePassword({
      currentPassword: 'old-pass',
      newPassword: 'new-pass',
    })

    expect(api.put).toHaveBeenCalledWith('/api/auth/change-password', {
      currentPassword: 'old-pass',
      newPassword: 'new-pass',
    })

    expect(result.success).toBe(true)
  })

  test('updateProfile doğru endpoint ve name ile put çağırmalı', async () => {
    api.put.mockResolvedValue({
      success: true,
    })

    const result = await authService.updateProfile({
      name: 'Yeni İsim',
    })

    expect(api.put).toHaveBeenCalledWith('/api/auth/update-profile', {
      name: 'Yeni İsim',
    })

    expect(result.success).toBe(true)
  })

  test('forgotPassword email ile public post çağırmalı', async () => {
    api.postPublic.mockResolvedValue({
      success: true,
    })

    const result = await authService.forgotPassword('test@mail.com')

    expect(api.postPublic).toHaveBeenCalledWith('/api/auth/forgot-password', {
      email: 'test@mail.com',
    })

    expect(result.success).toBe(true)
  })

  test('logout api.clearAuth çağırmalı', () => {
    authService.logout()

    expect(api.clearAuth).toHaveBeenCalledTimes(1)
  })

  test('getCurrentUser localStorage içindeki user bilgisini dönmeli', () => {
    localStorage.setItem(
      'user',
      JSON.stringify({
        id: 'user-1',
        name: 'Ali',
        role: 'student',
      })
    )

    expect(authService.getCurrentUser()).toEqual({
      id: 'user-1',
      name: 'Ali',
      role: 'student',
    })
  })

  test('getCurrentUser user yoksa null dönmeli', () => {
    expect(authService.getCurrentUser()).toBeNull()
  })

  test('isAuthenticated token varsa true dönmeli', () => {
    localStorage.setItem('token', 'access-token')

    expect(authService.isAuthenticated()).toBe(true)
  })

  test('isAuthenticated token yoksa false dönmeli', () => {
    expect(authService.isAuthenticated()).toBe(false)
  })

  test('getUserRole user varsa role dönmeli', () => {
    localStorage.setItem(
      'user',
      JSON.stringify({
        id: 'user-1',
        role: 'admin',
      })
    )

    expect(authService.getUserRole()).toBe('admin')
  })

  test('getUserRole user yoksa null dönmeli', () => {
    expect(authService.getUserRole()).toBeNull()
  })

  test('getAllUsers role verilirse role query parametresi ile çağırmalı', async () => {
    api.get.mockResolvedValue({
      success: true,
      data: [],
    })

    await authService.getAllUsers('student')

    expect(api.get).toHaveBeenCalledWith('/api/users?role=student')
  })

  test('getAllUsers role verilmezse tüm kullanıcıları çağırmalı', async () => {
    api.get.mockResolvedValue({
      success: true,
      data: [],
    })

    await authService.getAllUsers()

    expect(api.get).toHaveBeenCalledWith('/api/users')
  })

  test('generateInstructorCode doğru endpoint ile post çağırmalı', async () => {
    api.post.mockResolvedValue({
      success: true,
      code: 'ABC123',
    })

    const result = await authService.generateInstructorCode()

    expect(api.post).toHaveBeenCalledWith('/api/users/instructor-codes', {})
    expect(result).toEqual({
      success: true,
      code: 'ABC123',
    })
  })

  test('listInstructorCodes doğru endpoint ile get çağırmalı', async () => {
    api.get.mockResolvedValue({
      success: true,
      data: [],
    })

    const result = await authService.listInstructorCodes()

    expect(api.get).toHaveBeenCalledWith('/api/users/instructor-codes')
    expect(result).toEqual({
      success: true,
      data: [],
    })
  })
})
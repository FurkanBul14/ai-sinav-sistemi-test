
//API İstemci (Axios-free, native fetch wrapper)
//Auth Service ile haberleşmek için merkezi HTTP client

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';
const AUTH_BASE_URL = import.meta.env.VITE_AUTH_SERVICE_URL || API_BASE_URL;
const API_KEY = import.meta.env.VITE_API_KEY || 'pk_live_demo12345678901';

class ApiClient {
  constructor(baseURL) {
    this.baseURL = baseURL;
  }

  // token'ı localStorage'dan oku
  getToken() {
    return localStorage.getItem('token');
  }

  // refresh token'ı localStorage'dan oku
  getRefreshToken() {
    return localStorage.getItem('refreshToken');
  }

  // Header'ları oluştur
  _getHeaders(includeAuth = true) {
    const headers = { 'Content-Type': 'application/json', 'X-API-Key': API_KEY };
    if (includeAuth) {
      const token = this.getToken();
      if (token) headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
  }

  // genel HTTP request — 503 gelirse 3 kez 8sn arayla retry yapar (Render cold start)
  async request(method, path, body = null, includeAuth = true, _retryCount = 0) {
    const url = `${this.baseURL}${path}`;
    const options = {
      method,
      headers: this._getHeaders(includeAuth),
    };
    if (body) options.body = JSON.stringify(body);

    let response;
    try {
      response = await fetch(url, options);
    } catch (networkErr) {
      if (_retryCount < 3) {
        await new Promise(r => setTimeout(r, 8000));
        return this.request(method, path, body, includeAuth, _retryCount + 1);
      }
      const error = new Error('Sunucuya bağlanılamıyor. Lütfen backend servisinin çalıştığından emin olun.');
      error.status = 0;
      throw error;
    }

    // 503 = upstream uyuyor, bekle ve tekrar dene
    if (response.status === 503 && _retryCount < 3) {
      await new Promise(r => setTimeout(r, 8000));
      return this.request(method, path, body, includeAuth, _retryCount + 1);
    }

    // Yanıtı güvenli şekilde JSON olarak parse et
    let data;
    try {
      const text = await response.text();
      data = text ? JSON.parse(text) : {};
    } catch {
      data = { message: `Sunucu geçersiz yanıt döndü (HTTP ${response.status})` };
    }

    // token süresi dolduysa otomatik refresh dene
    if (response.status === 401 && includeAuth && this.getRefreshToken()) {
      const refreshed = await this.refreshAccessToken();
      if (refreshed) {
        // yeni token ile isteği tekrar dene
        options.headers = this._getHeaders(true);
        try {
          const retryResponse = await fetch(url, options);
          const retryText = await retryResponse.text();
          return retryText ? JSON.parse(retryText) : {};
        } catch {
          return {};
        }
      }
    }

    if (!response.ok) {
      const error = new Error(data.message || 'Bir hata oluştu');
      error.status = response.status;
      error.data = data;
      throw error;
    }

    return data;
  }

  // token yenileme
  async refreshAccessToken() {
    try {
      const refreshToken = this.getRefreshToken();
      if (!refreshToken) return false;

      const response = await fetch(`${this.baseURL}/api/auth/refresh-token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: refreshToken }),
      });

      if (!response.ok) {
        // refresh token da geçersiz, kullanıcıyı çıkış yaptır
        this.clearAuth();
        return false;
      }

      const data = await response.json();
      if (data.success && data.data.token) {
        localStorage.setItem('token', data.data.token);
        return true;
      }
      return false;
    } catch {
      this.clearAuth();
      return false;
    }
  }

  // auth verilerini temizle
  clearAuth() {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
  }

  // kısayollar
  get(path) { return this.request('GET', path); }
  post(path, body) { return this.request('POST', path, body); }
  put(path, body) { return this.request('PUT', path, body); }
  delete(path) { return this.request('DELETE', path); }

  // auth gerektirmeyen istekler
  postPublic(path, body) { return this.request('POST', path, body, false); }
}

const api = new ApiClient(API_BASE_URL);
export const authApi = new ApiClient(AUTH_BASE_URL);
export default api;
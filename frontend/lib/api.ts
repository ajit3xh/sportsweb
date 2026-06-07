const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

interface FetchOptions extends RequestInit {
  params?: Record<string, string>;
}

// Fetch and cache CSRF token from the backend cookie endpoint
async function ensureCsrfToken(): Promise<string> {
  // Try to get from existing cookie first
  if (typeof document !== 'undefined') {
    const match = document.cookie.match(/csrftoken=([^;]+)/);
    if (match) return match[1];
  }
  // No cookie — hit the CSRF endpoint to set it
  await fetch(`${API_BASE}/auth/csrf/`, { credentials: 'include' });
  if (typeof document !== 'undefined') {
    const match = document.cookie.match(/csrftoken=([^;]+)/);
    if (match) return match[1];
  }
  return '';
}

async function apiRequest<T = unknown>(
  endpoint: string,
  options: FetchOptions = {}
): Promise<T> {
  const { params, ...fetchOptions } = options;

  let url = `${API_BASE}${endpoint}`;
  if (params) {
    const searchParams = new URLSearchParams(params);
    url += `?${searchParams.toString()}`;
  }

  const isWriteMethod = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(
    (fetchOptions.method || 'GET').toUpperCase()
  );

  const csrfToken = isWriteMethod ? await ensureCsrfToken() : '';

  const headers: Record<string, string> = {
    ...fetchOptions.headers as Record<string, string>
  };

  // Only set default Content-Type if it's not a FormData payload
  if (!(fetchOptions.body instanceof FormData) && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  if (csrfToken) {
    headers['X-CSRFToken'] = csrfToken;
    if (fetchOptions.body instanceof FormData) {
      fetchOptions.body.append('csrfmiddlewaretoken', csrfToken);
    }
  }

  const response = await fetch(url, {
    credentials: 'include',
    cache: 'no-store',
    ...fetchOptions,
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'An error occurred' }));
    throw { status: response.status, ...error };
  }

  return response.json();
}

// ── Auth API ───────────────────────────────

export const authApi = {
  register: (data: FormData | object) =>
    apiRequest('/auth/register/', {
      method: 'POST',
      body: data instanceof FormData ? data : JSON.stringify(data),
    }),

  verifyRegistration: (data: { mobile_otp: string; aadhaar_otp: string }) =>
    apiRequest('/auth/verify-registration/', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  login: (data: { username: string; password: string }) =>
    apiRequest('/auth/login/', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  adminLogin: (data: { username: string; password: string }) =>
    apiRequest('/auth/admin-login/', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  logout: () =>
    apiRequest('/auth/logout/', { method: 'POST' }),

  checkAuth: () =>
    apiRequest('/auth/check/'),

  forgotPassword: (data: { email: string }) =>
    apiRequest('/auth/forgot-password/', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  verifyResetOtp: (data: { email_otp: string; mobile_otp: string }) =>
    apiRequest('/auth/verify-reset-otp/', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  resetPassword: (data: { new_password: string; confirm_password: string }) =>
    apiRequest('/auth/reset-password/', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  changePassword: (data: { old_password: string; new_password: string; confirm_password: string }) =>
    apiRequest('/auth/change-password/', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};

// ── User API ───────────────────────────────

export const userApi = {
  dashboard: () => apiRequest('/user/dashboard/'),
  profile: () => apiRequest('/user/profile/'),
  updateProfile: (data: object) =>
    apiRequest('/user/profile/', {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
};

// ── Facility API ───────────────────────────

export const facilityApi = {
  list: () => apiRequest('/facilities/'),
  detail: (id: number) => apiRequest(`/facilities/${id}/`),
  book: (id: number, data: { slot_id: number; booking_date: string }) =>
    apiRequest(`/facilities/${id}/book/`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};

// ── Booking API ────────────────────────────

export const bookingApi = {
  myBookings: () => apiRequest('/bookings/'),
  cancel: (id: number) =>
    apiRequest(`/bookings/${id}/cancel/`, { method: 'POST' }),
};

// ── Membership API ─────────────────────────

export const membershipApi = {
  tariff: () => apiRequest('/tariff/'),
  purchaseInfo: (tierId: number) => apiRequest(`/memberships/purchase/${tierId}/`),
  purchase: (tierId: number) =>
    apiRequest(`/memberships/purchase/${tierId}/`, { method: 'POST' }),
};

// ── Gallery API ────────────────────────────

export const galleryApi = {
  list: () => apiRequest('/gallery/'),
};

// ── Calendar API ───────────────────────────

export const calendarApi = {
  data: () => apiRequest('/calendar/'),
};

// ── Payment API ────────────────────────────

export const paymentApi = {
  info: (bookingId: number) => apiRequest(`/payments/process/${bookingId}/`),
  process: (bookingId: number) =>
    apiRequest(`/payments/process/${bookingId}/`, { method: 'POST' }),
};

// ── Admin API ──────────────────────────────

export const adminApi = {
  dashboard: () => apiRequest('/admin/dashboard/'),
  approveBooking: (id: number) =>
    apiRequest(`/admin/bookings/${id}/approve/`, { method: 'POST' }),
  rejectBooking: (id: number) =>
    apiRequest(`/admin/bookings/${id}/reject/`, { method: 'POST' }),
  plans: () => apiRequest('/admin/plans/'),
  updatePlan: (id: number, data: object) =>
    apiRequest(`/admin/plans/${id}/`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  users: () => apiRequest('/admin/users/'),
  toggleBan: (id: number, action: 'ban' | 'unban') =>
    apiRequest(`/admin/users/${id}/toggle-ban/`, {
      method: 'PUT',
      body: JSON.stringify({ action }),
    }),
  facilities: () => apiRequest('/admin/facilities/'),
  createFacility: (data: object) =>
    apiRequest('/admin/facilities/', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateFacility: (id: number, data: object) =>
    apiRequest(`/admin/facilities/${id}/`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  deleteFacility: (id: number) =>
    apiRequest(`/admin/facilities/${id}/`, { method: 'DELETE' }),
  gallery: () => apiRequest('/admin/gallery/'),
  uploadGalleryImage: (formData: FormData) =>
    apiRequest('/admin/gallery/', {
      method: 'POST',
      body: formData, // FormData doesn't need Content-Type header in fetch
    }),
  deleteGalleryImage: (id: number) =>
    apiRequest(`/admin/gallery/${id}/`, { method: 'DELETE' }),
  createUser: (data: object) =>
    apiRequest('/admin/users/', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  closures: () => apiRequest('/admin/closures/'),
  createClosure: (data: object) =>
    apiRequest('/admin/closures/', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  deleteClosure: (id: number) =>
    apiRequest(`/admin/closures/${id}/`, { method: 'DELETE' }),
  cancelBooking: (id: number) =>
    apiRequest(`/admin/bookings/${id}/cancel/`, { method: 'PUT' }),
  calendar: (year: number, month: number) => 
    apiRequest(`/admin/calendar/?year=${year}&month=${month}`),
  forceBooking: (data: object) =>
    apiRequest('/admin/bookings/force/', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};


// ── Public API ─────────────────────────────

export const publicApi = {
  homeData: () => apiRequest('/home/'),
};

export default apiRequest;

import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized access
      localStorage.removeItem('authToken');
      localStorage.removeItem('username');
      localStorage.removeItem('loginTime');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  login: async (username, password, rememberMe = false) => {
    const response = await api.post('/login', { 
      username, 
      password, 
      remember_me: rememberMe 
    });
    return response.data;
  },
  
  logout: async () => {
    try {
      await api.post('/logout');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('authToken');
      localStorage.removeItem('username');
      localStorage.removeItem('loginTime');
    }
  }
};

export const fileAPI = {
  upload: async (files) => {
    const formData = new FormData();
    files.forEach(file => {
      formData.append('files', file);
    });
    
    const response = await api.post('/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },
};

export const chatAPI = {
  sendMessage: async (question, knowledgeBase, conversationHistory, sessionName = 'Default') => {
    const response = await api.post('/chat', {
      question,
      knowledge_base: knowledgeBase,
      conversation_history: conversationHistory,
      session_name: sessionName
    });
    return response.data;
  },
};

export const sessionAPI = {
  getSessions: async () => {
    const response = await api.get('/sessions');
    return response.data;
  },
  
  createSession: async (sessionName) => {
    const response = await api.post('/sessions', {
      session_name: sessionName
    });
    return response.data;
  },
  
  deleteSession: async (sessionName) => {
    const response = await api.delete(`/sessions/${sessionName}`);
    return response.data;
  },
  
  clearSession: async (sessionName) => {
    const response = await api.post(`/sessions/${sessionName}/clear`);
    return response.data;
  }
};

export const healthAPI = {
  check: async () => {
    const response = await api.get('/health');
    return response.data;
  },
};

export default api;

import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    console.log('API Request:', config);
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log('Token added to request');
    } else {
      console.log('No token found in localStorage');
    }
    
    // Set Content-Type for non-file requests
    if (!config.headers['Content-Type'] && !(config.data instanceof FormData)) {
      config.headers['Content-Type'] = 'application/json';
    }
    
    return config;
  },
  (error) => {
    console.error('Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => {
    console.log('API Response:', response);
    return response;
  },
  (error) => {
    console.error('API Error:', error);
    console.error('Error Response:', error.response);
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
    try {
      console.log('Uploading files:', files);
      
      const formData = new FormData();
      files.forEach((file, index) => {
        console.log(`Adding file ${index}:`, file.name, file.size, file.type);
        formData.append('files', file);
      });
      
      console.log('FormData created, sending request...');
      
      const response = await api.post('/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          console.log('Upload progress:', percentCompleted + '%');
        },
      });
      
      console.log('Upload response:', response.data);
      return response.data;
    } catch (error) {
      console.error('File upload error:', error);
      console.error('Error response:', error.response?.data);
      throw error;
    }
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

export const chatHistoryAPI = {
  // Get all chat history for the user
  getAllChatHistory: async () => {
    const response = await api.get('/chat-history');
    return response.data;
  },
  
  // Get specific session history
  getSessionHistory: async (sessionId) => {
    const response = await api.get(`/chat-history/${sessionId}`);
    return response.data;
  },
  
  // Create new chat session
  createChatSession: async (sessionName) => {
    console.log('Creating chat session with name:', sessionName);
    const payload = { session_name: sessionName };
    console.log('Request payload:', payload);
    
    const response = await api.post('/chat-history', payload);
    console.log('Create session response:', response.data);
    return response.data;
  },
  
  // Update chat session name
  updateChatSession: async (sessionId, newName) => {
    const response = await api.put(`/chat-history/${sessionId}`, {
      session_name: newName
    });
    return response.data;
  },
  
  // Delete chat session
  deleteChatSession: async (sessionId) => {
    const response = await api.delete(`/chat-history/${sessionId}`);
    return response.data;
  },
  
  // Add message to session
  addMessage: async (sessionId, question, answer) => {
    const response = await api.post(`/chat-history/${sessionId}/messages`, {
      question,
      answer
    });
    return response.data;
  },
  
  // Delete specific message
  deleteMessage: async (sessionId, messageId) => {
    const response = await api.delete(`/chat-history/${sessionId}/messages/${messageId}`);
    return response.data;
  },
  
  // Search chat history
  searchChatHistory: async (query) => {
    const response = await api.get(`/chat-history/search?q=${encodeURIComponent(query)}`);
    return response.data;
  },
  
  // Export chat session
  exportSession: async (sessionId) => {
    const response = await api.get(`/chat-history/export/${sessionId}`);
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

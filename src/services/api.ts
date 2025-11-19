/**
 * API Service for Pocket LM Backend
 *
 * This module provides type-safe API calls using axios.
 * Base URL is configured via environment variable VITE_API_BASE_URL
 */

import axios, { AxiosError } from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';

/**
 * Axios instance with base configuration
 */
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // 30 seconds
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Standard API Response
 */
interface ApiResponse<T = null> {
  status: 'success' | 'error';
  message: string;
  data: T;
}

/**
 * Error handler for axios errors
 */
function handleApiError(error: unknown): never {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<{ detail?: string }>;
    const errorMessage = axiosError.response?.data?.detail || axiosError.message || 'An error occurred';
    throw new Error(errorMessage);
  }
  throw error;
}

// ==================== Health Check ====================

/**
 * Health Check
 * GET /
 */
export async function healthCheck(): Promise<{ status: string }> {
  try {
    const response = await apiClient.get('/');
    return response.data;
  } catch (error) {
    return handleApiError(error);
  }
}

// ==================== Knowledge Capture ====================

/**
 * Capture Types
 */
type CaptureType = 'url' | 'selection' | 'pdf';

/**
 * Capture Request Parameters
 */
interface CaptureParams {
  type: CaptureType;
  knowledge_base: string;
  url?: string;
  selection?: string;
  pdf?: File;
}

/**
 * Capture Knowledge
 * POST /capture
 *
 * Captures content from URL, text selection, or PDF file
 */
export async function captureKnowledge(params: CaptureParams): Promise<ApiResponse> {
  try {
    const formData = new FormData();

    formData.append('type', params.type);
    formData.append('knowledge_base', params.knowledge_base);

    if (params.url) {
      formData.append('url', params.url);
    }

    if (params.selection) {
      formData.append('selection', params.selection);
    }

    if (params.pdf) {
      formData.append('pdf', params.pdf);
    }

    const response = await apiClient.post('/capture', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data;
  } catch (error) {
    return handleApiError(error);
  }
}

// ==================== Collection Management ====================

/**
 * List Collections
 * GET /collection
 *
 * Retrieves all available knowledge base collections
 */
export async function listCollections(): Promise<ApiResponse<string[]>> {
  try {
    const response = await apiClient.get('/collection');
    return response.data;
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * Create Collection
 * POST /collection
 *
 * Creates a new empty knowledge base collection
 */
export async function createCollection(name: string): Promise<ApiResponse> {
  try {
    const response = await apiClient.post('/collection', { name });
    return response.data;
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * Delete Collection
 * DELETE /collection
 *
 * Deletes an existing collection and all its data
 */
export async function deleteCollection(name: string): Promise<ApiResponse> {
  try {
    const response = await apiClient.delete('/collection', {
      data: { name },
    });
    return response.data;
  } catch (error) {
    return handleApiError(error);
  }
}

// ==================== Chat ====================

/**
 * Chat Message
 */
interface ChatMessage {
  messageContent: string;
  type: 'human' | 'ai';
}

/**
 * Get Chat History
 * GET /chat/history
 *
 * Retrieves the chat history for the current session
 */
export async function getChatHistory(): Promise<ApiResponse<ChatMessage[]>> {
  try {
    const response = await apiClient.get('/chat/history');
    return response.data;
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * Send Chat Message
 * POST /chat/message
 *
 * Processes a user's chat message and returns the AI's response
 */
export async function sendChatMessage(
  userQuery: string,
  collectionName: string
): Promise<ApiResponse<{ messageContent: string }>> {
  try {
    const response = await apiClient.post('/chat/message', {
      userQuery,
      collectionName,
    });
    return response.data;
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * Clear Chat History
 * DELETE /chat/clear
 *
 * Clears the chat history for the current session
 */
export async function clearChatHistory(): Promise<ApiResponse> {
  try {
    const response = await apiClient.delete('/chat/clear');
    return response.data;
  } catch (error) {
    return handleApiError(error);
  }
}

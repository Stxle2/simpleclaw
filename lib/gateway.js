import { apiCall } from './config.js';

export async function getStatus() {
  return apiCall('/api/status');
}

export async function getVersion() {
  try {
    return apiCall('/api/version');
  } catch {
    return null;
  }
}

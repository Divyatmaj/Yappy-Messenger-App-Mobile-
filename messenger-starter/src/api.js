export const API_URL = 'https://messenger-yzgf.onrender.com/';

export async function fetchMessages() {
  const response = await fetch(API_URL + 'messages');
  if (!response.ok) {
    throw new Error(`Failed to load messages (${response.status})`);
  }
  const data = await response.json();
  return Array.isArray(data) ? data : [];
}

export async function postMessage(user, text) {
  const response = await fetch(API_URL + 'messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user, text }),
  });
  if (!response.ok) {
    throw new Error(`Failed to send message (${response.status})`);
  }
}

export function messageKey(item, index) {
  return String(item.id ?? item._id ?? index);
}

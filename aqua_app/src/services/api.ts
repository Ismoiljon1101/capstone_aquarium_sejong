/**
 * API Service
 * Handles data fetching from the aqua_server
 */

const BASE_URL = 'http://localhost:3000'; // Update with local IP for physical devices

export const fetchStatus = async () => {
  try {
    const response = await fetch(`${BASE_URL}/api/status`);
    if (!response.ok) throw new Error('Network response was not ok');
    return await response.json();
  } catch (error) {
    console.error('Fetch error:', error);
    return null;
  }
};

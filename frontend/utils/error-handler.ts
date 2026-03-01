import { AxiosError } from 'axios';

/**
 * Parses an error from an Axios response, specifically handling 'blob' response types.
 * If the response is a blob, it reads it as text and attempts to parse it as JSON.
 */
export async function parseAxiosError(err: any): Promise<string> {
  if (!err.response) {
    return err.message || 'An unexpected error occurred';
  }

  const data = err.response.data;

  // If the data is a Blob, we need to read it as text
  if (data instanceof Blob) {
    try {
      const text = await data.text();
      const json = JSON.parse(text);
      return json.detail || json.message || 'Server error occurred';
    } catch (e) {
      return 'Failed to process server response';
    }
  }

  // If it's already an object (e.g. if responseType wasn't blob)
  if (typeof data === 'object') {
    return data.detail || data.message || JSON.stringify(data);
  }

  return 'Server error occurred';
}

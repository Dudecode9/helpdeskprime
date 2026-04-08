const API_URL = import.meta.env.VITE_API_URL || "";

async function parseResponse(response) {
  const text = await response.text();
  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text);
  } catch {
    return { message: text };
  }
}

async function request(path, options = {}) {
  const { skipRefresh, ...fetchOptions } = options;
  const response = await fetch(`${API_URL}${path}`, {
    credentials: "include",
    ...fetchOptions,
    headers: {
      ...(fetchOptions.body ? { "Content-Type": "application/json" } : {}),
      ...(fetchOptions.headers || {}),
    },
    body:
      fetchOptions.body && typeof fetchOptions.body !== "string"
        ? JSON.stringify(fetchOptions.body)
        : fetchOptions.body,
  });

  return {
    response,
    data: await parseResponse(response),
  };
}

export async function apiFetch(path, options = {}) {
  const result = await request(path, options);

  if (result.response.status === 401 && !options.skipRefresh) {
    const refreshResult = await request("/api/auth/refresh", {
      method: "POST",
      skipRefresh: true,
    });

    if (refreshResult.response.ok) {
      const retryResult = await request(path, { ...options, skipRefresh: true });
      if (!retryResult.response.ok) {
        const error = new Error(retryResult.data?.message || "Request failed");
        error.status = retryResult.response.status;
        error.data = retryResult.data;
        throw error;
      }

      return retryResult.data;
    }
  }

  if (!result.response.ok) {
    const error = new Error(result.data?.message || "Request failed");
    error.status = result.response.status;
    error.data = result.data;
    throw error;
  }

  return result.data;
}

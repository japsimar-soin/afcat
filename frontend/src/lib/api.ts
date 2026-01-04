/**
 * API client utility for making requests to the FastAPI backend
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface RequestOptions extends RequestInit {
	params?: Record<string, string>;
}

async function request<T>(
	endpoint: string,
	options: RequestOptions = {}
): Promise<T> {
	const { params, ...fetchOptions } = options;

	// Build URL with query parameters
	let url = `${API_URL}${endpoint}`;
	if (params) {
		const searchParams = new URLSearchParams(params);
		url += `?${searchParams.toString()}`;
	}

	// Get auth token from Clerk
	const token = await getAuthToken();

	const headers: Record<string, string> = {
		"Content-Type": "application/json",
		...(fetchOptions.headers as Record<string, string>),
	};

	if (token) {
		headers["Authorization"] = `Bearer ${token}`;
	}

	const response = await fetch(url, {
		...fetchOptions,
		headers,
	});

	if (!response.ok) {
		const error = await response
			.json()
			.catch(() => ({ error: response.statusText }));
		throw new Error(error.error || `HTTP error! status: ${response.status}`);
	}

	return response.json();
}

async function getAuthToken(): Promise<string | null> {
	// In Next.js with Clerk, we typically get the token on the server side
	// For client-side calls, we need to handle this differently
	// This is a placeholder - you may need to adjust based on your Clerk setup

	if (typeof window === "undefined") {
		// Server-side: token should be passed from server components
		return null;
	}

	// Client-side: Clerk provides tokens via useAuth hook
	// For API routes, we might need to get the token from a server action
	// or use Clerk's getToken() method
	try {
		// This will need to be implemented based on your Clerk setup
		// Example: const { getToken } = useAuth(); return await getToken();
		return null;
	} catch (error) {
		return null;
	}
}

export const api = {
	get: <T>(endpoint: string, options?: RequestOptions) =>
		request<T>(endpoint, { ...options, method: "GET" }),

	post: <T>(endpoint: string, data?: unknown, options?: RequestOptions) =>
		request<T>(endpoint, {
			...options,
			method: "POST",
			body: data ? JSON.stringify(data) : undefined,
		}),

	patch: <T>(endpoint: string, data?: unknown, options?: RequestOptions) =>
		request<T>(endpoint, {
			...options,
			method: "PATCH",
			body: data ? JSON.stringify(data) : undefined,
		}),

	delete: <T>(endpoint: string, options?: RequestOptions) =>
		request<T>(endpoint, { ...options, method: "DELETE" }),
};

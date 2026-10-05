let csrf = ""

export function setCsrf(value) { csrf = value || "" }

export async function cmsRequest(path, body, timeout = 15000) {
  const endpoint = `/api/cms/${path}`
  const response = await fetch(endpoint, {
    method: body === undefined ? "GET" : "POST",
    credentials: "same-origin",
    headers: { "Content-Type": "application/json", "X-CSRF-Token": csrf },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    signal: AbortSignal.timeout(timeout),
  })
  let data
  try { data = await response.json() } catch {
    const message = response.status === 502 || response.status === 503 || response.status === 504
      ? "The frontend could not reach the PHP backend."
      : response.status === 404 || (response.ok && response.headers.get("content-type")?.includes("text/html"))
        ? "The API address returned a webpage instead of JSON. Check the server routing."
        : "The server returned an invalid response. Check the PHP error log."
    throw Object.assign(new Error(`${message} (${endpoint}, HTTP ${response.status})`), { status: response.status })
  }
  if (!response.ok) throw Object.assign(new Error(data.error || "The request could not be completed."), { status: response.status })
  return data
}

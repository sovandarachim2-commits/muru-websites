export function readSaved(key, fallback) {
  try {
    const value = JSON.parse(localStorage.getItem(key))
    if (Array.isArray(fallback)) {
      return Array.isArray(value) && value.every((item) =>
        item && typeof item.id === "string" && typeof item.title === "string" &&
        typeof item.slug === "string" && typeof item.category === "string" &&
        typeof item.type === "string" && typeof item.benefit === "string"
      ) ? value : fallback
    }
    return value && typeof value === "object" && !Array.isArray(value)
      ? { ...fallback, ...value } : fallback
  } catch {
    return fallback
  }
}

export function saveData(key, value) {
  localStorage.setItem(key, JSON.stringify(value))
}

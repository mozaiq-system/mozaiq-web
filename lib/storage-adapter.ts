interface StorageAdapter {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
  removeItem(key: string): void
}

let adapter: StorageAdapter = {
  getItem: (key: string) => {
    if (typeof window === "undefined") return null
    return localStorage.getItem(key)
  },
  setItem: (key: string, value: string) => {
    if (typeof window !== "undefined") {
      localStorage.setItem(key, value)
    }
  },
  removeItem: (key: string) => {
    if (typeof window !== "undefined") {
      localStorage.removeItem(key)
    }
  },
}

export function setStorageAdapter(newAdapter: StorageAdapter) {
  adapter = newAdapter
}

export function getStorageAdapter(): StorageAdapter {
  return adapter
}

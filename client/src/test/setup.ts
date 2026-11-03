import '@testing-library/jest-dom/vitest';

import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

// Node 26's native web-storage globals can shadow jsdom's storage with undefined.
// Supply the browser Storage contract only when the test environment lacks it.
if (!window.localStorage) {
  const values = new Map<string, string>();
  const storage: Storage = {
    get length() {
      return values.size;
    },
    clear: () => values.clear(),
    getItem: (key) => values.get(key) ?? null,
    key: (index) => [...values.keys()][index] ?? null,
    removeItem: (key) => {
      values.delete(key);
    },
    setItem: (key, value) => {
      values.set(String(key), String(value));
    },
  };
  Object.defineProperty(window, 'localStorage', { configurable: true, value: storage });
}

afterEach(() => {
  cleanup();
  window.localStorage.clear();
  document.documentElement.lang = 'en';
  document.documentElement.dir = 'ltr';
});

import "@testing-library/jest-dom";

// jsdom does not implement HTMLDialogElement.showModal() / close().
// Mock them so components using <dialog> don't throw in tests.
if (typeof HTMLDialogElement !== "undefined") {
  HTMLDialogElement.prototype.showModal = function () {
    this.setAttribute("open", "");
  };
  HTMLDialogElement.prototype.close = function () {
    this.removeAttribute("open");
  };
}

// Provide a proper localStorage implementation for tests (zustand persist needs it)
if (typeof globalThis.localStorage === "undefined" || !globalThis.localStorage?.setItem) {
  const storageMap = new Map<string, string>();
  const storageMock: Storage = {
    getItem: (key: string) => storageMap.get(key) ?? null,
    setItem: (key: string, value: string) => {
      storageMap.set(key, value);
    },
    removeItem: (key: string) => {
      storageMap.delete(key);
    },
    clear: () => {
      storageMap.clear();
    },
    get length() {
      return storageMap.size;
    },
    key: (index: number) => [...storageMap.keys()][index] ?? null,
  };
  Object.defineProperty(globalThis, "localStorage", { value: storageMock, writable: true });
  Object.defineProperty(window, "localStorage", { value: storageMock, writable: true });
}

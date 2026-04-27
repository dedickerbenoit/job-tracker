// Chrome storage utility
async function getFromStorage(key) {
  return new Promise((resolve) => {
    chrome.storage.local.get(key, (result) => {
      resolve(result[key]);
    });
  });
}

async function setInStorage(key, value) {
  return new Promise((resolve) => {
    chrome.storage.local.set({ [key]: value }, resolve);
  });
}

async function removeFromStorage(key) {
  return new Promise((resolve) => {
    chrome.storage.local.remove(key, resolve);
  });
}

// Session storage (in-memory only, cleared when browser closes)
async function getFromSession(key) {
  return new Promise((resolve) => {
    chrome.storage.session.get(key, (result) => {
      resolve(result[key]);
    });
  });
}

async function setInSession(key, value) {
  return new Promise((resolve) => {
    chrome.storage.session.set({ [key]: value }, resolve);
  });
}

async function removeFromSession(key) {
  return new Promise((resolve) => {
    chrome.storage.session.remove(key, resolve);
  });
}

export {
  getFromStorage,
  setInStorage,
  removeFromStorage,
  getFromSession,
  setInSession,
  removeFromSession,
};

export const logInfo = (message, ...args) => {
  console.log(`[${new Date().toISOString()}] INFO: ${message}`, ...args);
};

export const logError = (message, ...args) => {
  console.error(`[${new Date().toISOString()}] ERROR: ${message}`, ...args);
};
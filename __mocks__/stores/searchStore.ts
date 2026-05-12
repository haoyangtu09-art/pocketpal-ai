export const searchStore = {
  searchUrl: '',
  isConfigured: false,
  setSearchUrl: jest.fn(),
  setApiKey: jest.fn().mockResolvedValue(undefined),
  getApiKey: jest.fn().mockResolvedValue(''),
  clearApiKey: jest.fn().mockResolvedValue(undefined),
  clear: jest.fn().mockResolvedValue(undefined),
};

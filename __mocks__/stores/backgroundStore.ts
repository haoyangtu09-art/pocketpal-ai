export class BackgroundStore {
  images: any[] = [];
  globalOpacity = 0.5;
}

export const backgroundStore = {
  images: [],
  globalOpacity: 0.5,
  addImages: jest.fn(),
  removeImage: jest.fn(),
  updateImageTransform: jest.fn(),
  clearAll: jest.fn(),
  setGlobalOpacity: jest.fn(),
  get hasImages() {
    return false;
  },
};

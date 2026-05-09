// Mock for NativeImageResize TurboModule (Android-only)
export default {
  resizeImage: jest.fn((uri: string, destPath: string) =>
    Promise.resolve(destPath),
  ),
};

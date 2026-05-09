import {makePersistable} from 'mobx-persist-store';
import {makeAutoObservable, runInAction} from 'mobx';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as RNFS from '@dr.pogodin/react-native-fs';

export interface BackgroundImage {
  id: string;
  uri: string;
  x: number;
  y: number;
  scale: number;
  rotation: number;
  opacity: number;
}

function makeId(): string {
  return `bg_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export class BackgroundStore {
  images: BackgroundImage[] = [];
  globalOpacity = 0.5;

  constructor() {
    makeAutoObservable(this);
    makePersistable(this, {
      name: 'BackgroundStore',
      properties: ['images', 'globalOpacity'],
      storage: AsyncStorage,
    });
  }

  /**
   * Add images. Copies each URI to the app's local storage so they
   * survive across app restarts (content:// URIs are temporary).
   */
  async addImages(uris: string[]) {
    const bgDir = `${RNFS.DocumentDirectoryPath}/backgrounds`;
    try {
      const dirExists = await RNFS.exists(bgDir);
      if (!dirExists) {
        await RNFS.mkdir(bgDir);
      }
    } catch {
      // If mkdir fails (e.g. no permission), try to proceed anyway
    }

    const newImages: BackgroundImage[] = [];

    for (const uri of uris) {
      try {
        // Copy to local storage so the file survives app restarts
        const ext = uri.split('.').pop()?.split('?')[0] ?? 'jpg';
        const destPath = `${bgDir}/${makeId()}.${ext}`;
        await RNFS.copyFile(uri, destPath);

        newImages.push({
          id: makeId(),
          uri: `file://${destPath}`,
          x: 180,
          y: 320,
          scale: 1,
          rotation: 0,
          opacity: 1,
        });
      } catch {
        // If copy fails, skip this image — don't crash
      }
    }

    if (newImages.length > 0) {
      runInAction(() => {
        this.images.push(...newImages);
      });
    }
  }

  removeImage(id: string) {
    const img = this.images.find(i => i.id === id);
    if (img?.uri.startsWith('file://')) {
      const path = img.uri.replace('file://', '');
      RNFS.unlink(path).catch(() => {});
    }
    runInAction(() => {
      this.images = this.images.filter(i => i.id !== id);
    });
  }

  updateImageTransform(
    id: string,
    transform: Partial<
      Pick<BackgroundImage, 'x' | 'y' | 'scale' | 'rotation' | 'opacity'>
    >,
  ) {
    runInAction(() => {
      const img = this.images.find(i => i.id === id);
      if (img) {
        Object.assign(img, transform);
      }
    });
  }

  clearAll() {
    for (const img of this.images) {
      if (img.uri.startsWith('file://')) {
        RNFS.unlink(img.uri.replace('file://', '')).catch(() => {});
      }
    }
    runInAction(() => {
      this.images = [];
    });
  }

  setGlobalOpacity(value: number) {
    runInAction(() => {
      this.globalOpacity = Math.max(0, Math.min(1, value));
    });
  }

  get hasImages(): boolean {
    return this.images.length > 0;
  }
}

export const backgroundStore = new BackgroundStore();

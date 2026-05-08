import {makePersistable} from 'mobx-persist-store';
import {makeAutoObservable, runInAction} from 'mobx';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {v4 as uuidv4} from 'uuid';

export interface BackgroundImage {
  id: string;
  uri: string;
  x: number;
  y: number;
  scale: number;
  rotation: number;
  opacity: number;
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

  addImages(uris: string[]) {
    runInAction(() => {
      const screenW = 360; // will be centered on screen
      const screenH = 640;
      for (const uri of uris) {
        this.images.push({
          id: uuidv4(),
          uri,
          x: screenW / 2,
          y: screenH / 2,
          scale: 1,
          rotation: 0,
          opacity: 1,
        });
      }
    });
  }

  removeImage(id: string) {
    runInAction(() => {
      this.images = this.images.filter(img => img.id !== id);
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

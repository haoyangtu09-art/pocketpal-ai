import {makePersistable} from 'mobx-persist-store';
import {makeAutoObservable, runInAction} from 'mobx';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {Platform, NativeModules} from 'react-native';
import * as RNFS from '@dr.pogodin/react-native-fs';
import {saveCrashLog} from '../utils/crashLog';

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

const BG_DIR = `${RNFS.DocumentDirectoryPath}/backgrounds`;

function isContentUri(uri: string): boolean {
  return uri.startsWith('content://');
}

function isFileUri(uri: string): boolean {
  return uri.startsWith('file://');
}

async function ensureDir() {
  try {
    const exists = await RNFS.exists(BG_DIR);
    if (!exists) {
      await RNFS.mkdir(BG_DIR);
    }
  } catch {
    // ignore
  }
}

/**
 * Copy a file:// or content:// URI to local app storage.
 * On Android: uses native ImageResizeModule to decode at reduced resolution
 * (BitmapFactory.inSampleSize) and save as JPEG — never loads full bitmap into memory.
 * On iOS: uses RNFS.copyFile (native stream, no JS heap involvement).
 */
async function copyUriToLocal(uri: string): Promise<string | null> {
  try {
    await ensureDir();
    const destPath = `${BG_DIR}/${makeId()}.jpg`;

    if (Platform.OS === 'android') {
      const {ImageResizeModule} = NativeModules;
      if (ImageResizeModule?.resizeImage) {
        await ImageResizeModule.resizeImage(uri, destPath);
        return `file://${destPath}`;
      }
      // Fallback: stream copy (no resize, but no JS heap spike)
      const src = isFileUri(uri) ? uri.replace('file://', '') : uri;
      await RNFS.copyFile(src, destPath);
      return `file://${destPath}`;
    }

    // iOS: stream copy is sufficient; iOS image picker already downsamples
    const src = isFileUri(uri) ? uri.replace('file://', '') : uri;
    await RNFS.copyFile(src, destPath);
    return `file://${destPath}`;
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    console.warn('BackgroundStore: failed to copy image', message);
    saveCrashLog({
      message: `BackgroundStore.copyUriToLocal failed: ${message}`,
      context: `uri=${uri.slice(0, 80)}`,
    });
    return null;
  }
}

/**
 * Validate a single stored image entry. Returns null if invalid.
 */
async function validateImage(
  img: BackgroundImage,
): Promise<BackgroundImage | null> {
  // Safety: require all fields
  if (!img?.id || !img?.uri) {
    return null;
  }

  // Reject old content:// URIs (temporary, will crash on restart)
  if (isContentUri(img.uri)) {
    console.warn(
      'BackgroundStore: removing stale content:// URI',
      img.uri.slice(0, 60),
    );
    return null;
  }

  // If file:// URI, verify the file actually exists
  if (isFileUri(img.uri)) {
    const path = img.uri.replace('file://', '');
    try {
      const exists = await RNFS.exists(path);
      if (!exists) {
        console.warn('BackgroundStore: removing missing file', path.slice(-40));
        return null;
      }
    } catch {
      return null;
    }
  }

  // Sanitize numeric fields
  return {
    ...img,
    x: Number.isFinite(img.x) ? img.x : 180,
    y: Number.isFinite(img.y) ? img.y : 320,
    scale: Number.isFinite(img.scale) && img.scale > 0 ? img.scale : 1,
    rotation: Number.isFinite(img.rotation) ? img.rotation : 0,
    opacity: Number.isFinite(img.opacity) ? img.opacity : 1,
  };
}

export class BackgroundStore {
  images: BackgroundImage[] = [];
  globalOpacity = 0.5;
  private _hydrated = false;

  constructor() {
    makeAutoObservable(this);
    makePersistable(this, {
      name: 'BackgroundStore',
      properties: ['images', 'globalOpacity'],
      storage: AsyncStorage,
    }).then(async () => {
      // Validate and clean up stored images BEFORE marking ready
      await this._validateStoredImages();
      runInAction(() => {
        this._hydrated = true;
      });
    });
  }

  /**
   * Run after hydration: remove any invalid entries (stale content URIs,
   * missing files) to prevent crashes when BackgroundLayer renders them.
   */
  private async _validateStoredImages() {
    if (this.images.length === 0) {
      return;
    }

    const validated: BackgroundImage[] = [];
    for (const img of this.images) {
      const valid = await validateImage(img);
      if (valid) {
        validated.push(valid);
      }
    }

    if (validated.length !== this.images.length) {
      runInAction(() => {
        this.images = validated;
      });
    }
  }

  get isReady(): boolean {
    return this._hydrated;
  }

  /**
   * Add background images from URIs (file:// or content://).
   * Uses RNFS.copyFile — never reads image data into the JS heap.
   */
  async addImages(uris: string[]) {
    const newImages: BackgroundImage[] = [];

    for (const uri of uris) {
      let localUri: string | null = null;

      if (isFileUri(uri) || isContentUri(uri)) {
        localUri = await copyUriToLocal(uri);
      }

      if (localUri) {
        newImages.push({
          id: makeId(),
          uri: localUri,
          x: 180,
          y: 320,
          scale: 1,
          rotation: 0,
          opacity: 1,
        });
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
    if (img && isFileUri(img.uri)) {
      RNFS.unlink(img.uri.replace('file://', '')).catch(() => {});
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
      if (isFileUri(img.uri)) {
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

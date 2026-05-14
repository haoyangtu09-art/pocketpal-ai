import {makePersistable} from 'mobx-persist-store';
import {makeAutoObservable, runInAction} from 'mobx';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {Platform} from 'react-native';
import * as RNFS from '@dr.pogodin/react-native-fs';
import NativeImageResize from '../specs/NativeImageResize';

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

function isLocalFilePath(uri: string): boolean {
  return uri.startsWith('/');
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
 * Copy and resize any image URI into the app's private backgrounds directory.
 * Always runs through NativeImageResize on Android to cap the image at
 * MAX_DIM×MAX_DIM (1280px) — this is the ONLY entry point for stored images
 * and must never be bypassed, regardless of URI scheme (file://, content://, /).
 * On iOS, file:// URIs are returned as-is since the OS handles memory pressure.
 */
async function copyUriToLocal(uri: string): Promise<string | null> {
  try {
    // Normalise to a form the native module can open
    let srcUri = uri;
    if (isLocalFilePath(uri)) {
      srcUri = `file://${uri}`;
    }

    console.log('BackgroundStore: copyUriToLocal srcUri=', srcUri.slice(0, 80));

    if (Platform.OS === 'android') {
      if (!NativeImageResize) {
        console.warn('BackgroundStore: NativeImageResize module not available');
        return null;
      }
      await ensureDir();
      const destPath = `${BG_DIR}/${makeId()}.jpg`;
      console.log('BackgroundStore: resizing to', destPath.slice(-40));
      try {
        await NativeImageResize.resizeImage(srcUri, destPath);
        console.log('BackgroundStore: resize success');
        return `file://${destPath}`;
      } catch (e) {
        const message = e instanceof Error ? e.message : String(e);
        console.warn('BackgroundStore: native resize failed:', message);
        return null;
      }
    }

    // iOS: file:// URIs are fine to reference directly
    if (isFileUri(srcUri)) {
      return srcUri;
    }

    console.warn('BackgroundStore: unhandled URI scheme', srcUri.slice(0, 40));
    return null;
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    console.warn('BackgroundStore: failed to copy image', message);
    return null;
  }
}

/**
 * Validate a single stored image entry. Returns null if invalid.
 * On Android, also re-encodes large files through NativeImageResize so that
 * images stored before the resize-on-import fix are automatically migrated.
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

      // Migration: re-encode large files that were stored before the resize fix
      if (Platform.OS === 'android' && NativeImageResize) {
        const stat = await RNFS.stat(path);
        const sizeBytes =
          typeof stat.size === 'number' ? stat.size : parseInt(stat.size, 10);
        // Files larger than 2 MB are likely unresized originals — re-encode them
        if (sizeBytes > 2 * 1024 * 1024) {
          const inBgDir = path.startsWith(BG_DIR);
          const destPath = inBgDir ? path : `${BG_DIR}/${makeId()}.jpg`;
          try {
            await ensureDir();
            await NativeImageResize.resizeImage(img.uri, destPath);
            // If source was outside BG_DIR, delete the original after resize
            if (!inBgDir) {
              RNFS.unlink(path).catch(() => {});
            }
            return {
              ...img,
              uri: `file://${destPath}`,
              x: Number.isFinite(img.x) ? img.x : 0,
              y: Number.isFinite(img.y) ? img.y : 0,
              scale:
                Number.isFinite(img.scale) && img.scale > 0 ? img.scale : 1,
              rotation: Number.isFinite(img.rotation) ? img.rotation : 0,
              opacity: Number.isFinite(img.opacity) ? img.opacity : 1,
            };
          } catch {
            // If re-encode fails, remove the entry — it's safer than keeping it
            console.warn(
              'BackgroundStore: removing oversized image that could not be resized',
              path.slice(-40),
            );
            return null;
          }
        }
      }
    } catch {
      return null;
    }
  }

  // Sanitize numeric fields
  return {
    ...img,
    x: Number.isFinite(img.x) ? img.x : 0,
    y: Number.isFinite(img.y) ? img.y : 0,
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
   * Uses native file operations — never reads image data into the JS heap.
   */
  async addImages(uris: string[]): Promise<BackgroundImage[]> {
    const newImages: BackgroundImage[] = [];

    for (const uri of uris) {
      let localUri: string | null = null;

      if (isFileUri(uri) || isContentUri(uri) || isLocalFilePath(uri)) {
        localUri = await copyUriToLocal(uri);
      }

      if (localUri) {
        newImages.push({
          id: makeId(),
          uri: localUri,
          x: 0,
          y: 0,
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

    return newImages;
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

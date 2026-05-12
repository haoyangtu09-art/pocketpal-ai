import {makeAutoObservable, runInAction} from 'mobx';
import {makePersistable} from 'mobx-persist-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Keychain from 'react-native-keychain';

const KEYCHAIN_SERVICE = 'lumo-search-api-key';

export class SearchStore {
  /** Search engine base URL, e.g. https://api.tavily.com */
  searchUrl: string = '';

  /** Whether the user has configured a search engine */
  get isConfigured(): boolean {
    return this.searchUrl.trim().length > 0;
  }

  constructor() {
    makeAutoObservable(this);
    makePersistable(this, {
      name: 'SearchStore',
      properties: ['searchUrl'],
      storage: AsyncStorage,
    });
  }

  setSearchUrl(url: string) {
    runInAction(() => {
      this.searchUrl = url;
    });
  }

  async setApiKey(key: string): Promise<void> {
    try {
      await Keychain.setGenericPassword('searchApiKey', key, {
        service: KEYCHAIN_SERVICE,
      });
    } catch (error) {
      console.error('Failed to save search API key:', error);
    }
  }

  async getApiKey(): Promise<string> {
    try {
      const credentials = await Keychain.getGenericPassword({
        service: KEYCHAIN_SERVICE,
      });
      return credentials ? credentials.password : '';
    } catch (error) {
      console.error('Failed to load search API key:', error);
      return '';
    }
  }

  async clearApiKey(): Promise<void> {
    try {
      await Keychain.resetGenericPassword({service: KEYCHAIN_SERVICE});
    } catch {
      // ignore
    }
  }

  async clear(): Promise<void> {
    runInAction(() => {
      this.searchUrl = '';
    });
    await this.clearApiKey();
  }
}

export const searchStore = new SearchStore();

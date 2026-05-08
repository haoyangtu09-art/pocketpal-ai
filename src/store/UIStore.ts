import {makePersistable} from 'mobx-persist-store';
import {makeAutoObservable, runInAction} from 'mobx';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  l10n,
  supportedLanguages as localesSupportedLanguages,
  type AvailableLanguage,
} from '../locales';
import {ErrorState} from '../utils/errors';

export class UIStore {
  static readonly GROUP_KEYS = {
    READY_TO_USE: 'ready_to_use',
    AVAILABLE_TO_DOWNLOAD: 'available_to_download',
  } as const;

  pageStates = {
    modelsScreen: {
      filters: [] as string[],
      expandedGroups: {
        [UIStore.GROUP_KEYS.READY_TO_USE]: true,
      },
    },
  };

  // This is a flag to auto-navigate to the chat page after loading a model
  autoNavigatetoChat = true;

  colorScheme: 'light' | 'dark' = 'dark';

  // Current selected language (default to Chinese)
  _language: AvailableLanguage = 'zh';

  // List of supported languages (derived from locales registry)
  get supportedLanguages(): readonly AvailableLanguage[] {
    return localesSupportedLanguages;
  }

  displayMemUsage = false;

  // Default system prompt used when no Pal is active and model has no built-in prompt
  defaultSystemPrompt =
    'You are a warm, non-judgmental companion. Your role is to listen deeply and reflect back what you hear. Ask gentle, open-ended questions to help the user explore their thoughts and feelings. Never advise, judge, or rush. Hold space with curiosity and care.';

  iOSBackgroundDownloading = true;

  // Toggle Skia matte glass effect (off for low-end devices)
  useLiquidGlass = true;

  // Background image edit mode (not persisted — resets on app restart)
  isBackgroundEditMode = false;

  // Show the default background.png in chat
  showDefaultBackground = true;

  // Warning state for chat-related warnings (like multimodal warnings)
  chatWarning: ErrorState | null = null;

  showError(message: string) {
    // TODO: Implement error display logic (e.g., toast, alert, etc.)
    console.error(message);
  }

  setChatWarning(warning: ErrorState | null) {
    runInAction(() => {
      this.chatWarning = warning;
    });
  }

  clearChatWarning() {
    runInAction(() => {
      this.chatWarning = null;
    });
  }

  constructor() {
    makeAutoObservable(this);
    makePersistable(this, {
      name: 'UIStore',
      properties: [
        'pageStates',
        'colorScheme',
        'autoNavigatetoChat',
        'displayMemUsage',
        'defaultSystemPrompt',
        'useLiquidGlass',
        'showDefaultBackground',
        '_language',
      ],
      storage: AsyncStorage,
    });

    // backwards compatibility. Removed this from the ui settings screen.
    this.iOSBackgroundDownloading = true;
  }

  setValue<T extends keyof typeof this.pageStates>(
    page: T,
    key: keyof (typeof this.pageStates)[T],
    value: any,
  ) {
    runInAction(() => {
      if (this.pageStates[page]) {
        this.pageStates[page][key] = value;
      } else {
        console.error(`Page '${page}' does not exist in pageStates`);
      }
    });
  }

  setColorScheme(colorScheme: 'light' | 'dark') {
    runInAction(() => {
      this.colorScheme = colorScheme;
    });
  }

  setUseLiquidGlass(value: boolean) {
    runInAction(() => {
      this.useLiquidGlass = value;
    });
  }

  setBackgroundEditMode(value: boolean) {
    runInAction(() => {
      this.isBackgroundEditMode = value;
    });
  }

  setShowDefaultBackground(value: boolean) {
    runInAction(() => {
      this.showDefaultBackground = value;
    });
  }

  setLanguage(language: AvailableLanguage) {
    runInAction(() => {
      this._language = language;
    });
  }
  get language() {
    // If the language is not in l10n, return 'en'
    // This can happen when the app removes a language from l10n
    return this._language in l10n ? this._language : 'en';
  }

  get l10n() {
    return l10n[this.language];
  }

  setAutoNavigateToChat(value: boolean) {
    runInAction(() => {
      this.autoNavigatetoChat = value;
    });
  }

  setDisplayMemUsage(value: boolean) {
    runInAction(() => {
      this.displayMemUsage = value;
    });
  }

  setDefaultSystemPrompt(value: string) {
    runInAction(() => {
      this.defaultSystemPrompt = value;
    });
  }

  setiOSBackgroundDownloading(value: boolean) {
    runInAction(() => {
      this.iOSBackgroundDownloading = value;
    });
  }
}

export const uiStore = new UIStore();

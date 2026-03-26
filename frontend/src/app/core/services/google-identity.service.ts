import { Injectable } from '@angular/core';
import { GOOGLE_CLIENT_ID } from '../config/api.config';

export type GoogleButtonText = 'signin_with' | 'signup_with' | 'continue_with' | 'signin';

type GoogleCredentialResponse = {
  credential?: string;
};

type GoogleAccountsIdApi = {
  initialize(configuration: {
    client_id: string;
    callback: (response: GoogleCredentialResponse) => void;
  }): void;
  renderButton(
    parent: HTMLElement,
    options: {
      theme?: 'outline' | 'filled_blue' | 'filled_black';
      size?: 'large' | 'medium' | 'small';
      text?: GoogleButtonText;
      shape?: 'rectangular' | 'pill';
      width?: number;
      logo_alignment?: 'left' | 'center';
      locale?: string;
    },
  ): void;
};

declare global {
  interface Window {
    google?: {
      accounts?: {
        id?: GoogleAccountsIdApi;
      };
    };
  }
}

@Injectable({
  providedIn: 'root',
})
export class GoogleIdentityService {
  private scriptLoadingPromise: Promise<void> | null = null;

  isConfigured() {
    return GOOGLE_CLIENT_ID.length > 0;
  }

  async renderButton(
    container: HTMLElement,
    text: GoogleButtonText,
    onCredential: (credential: string) => void,
  ) {
    if (!this.isConfigured()) {
      return false;
    }

    await this.ensureClientLoaded();

    const googleAccountsIdApi = window.google?.accounts?.id;

    if (!googleAccountsIdApi) {
      return false;
    }

    googleAccountsIdApi.initialize({
      client_id: GOOGLE_CLIENT_ID,
      callback: (response) => {
        const credential = response.credential?.trim();

        if (credential) {
          onCredential(credential);
        }
      },
    });

    container.innerHTML = '';
    googleAccountsIdApi.renderButton(container, {
      theme: 'outline',
      size: 'large',
      text,
      shape: 'rectangular',
      width: Math.max(container.clientWidth, 280),
      logo_alignment: 'left',
      locale: 'fr',
    });

    return true;
  }

  private ensureClientLoaded() {
    if (typeof window === 'undefined') {
      return Promise.reject(new Error('Google Identity Services is only available in the browser'));
    }

    if (window.google?.accounts?.id) {
      return Promise.resolve();
    }

    if (this.scriptLoadingPromise) {
      return this.scriptLoadingPromise;
    }

    this.scriptLoadingPromise = new Promise<void>((resolve, reject) => {
      const existingScript = document.querySelector<HTMLScriptElement>(
        'script[src="https://accounts.google.com/gsi/client"]',
      );

      if (existingScript) {
        existingScript.addEventListener('load', () => resolve(), { once: true });
        existingScript.addEventListener(
          'error',
          () => reject(new Error('Failed to load Google Identity Services')),
          { once: true },
        );
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Failed to load Google Identity Services'));

      document.head.appendChild(script);
    });

    return this.scriptLoadingPromise;
  }
}

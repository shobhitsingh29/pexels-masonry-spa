declare global {
  interface Window {
    workbox: {
      addEventListener: (type: string, callback: (event: any) => void) => void;
      register: () => Promise<ServiceWorkerRegistration>;
      messageSkipWaiting: () => void;
    };
  }
}

export function registerServiceWorker() {
  if (typeof window === 'undefined') {
    return;
  }

  if (!('serviceWorker' in navigator)) {
    console.log('Service Worker not supported');
    return;
  }

  if (window.workbox === undefined) {
    console.log('Workbox not loaded');
    return;
  }

  const wb = window.workbox;

  // Add event listeners to handle PWA lifecycle
  wb.addEventListener('installed', (event: any) => {
    console.log('Service Worker installed:', event);
  });

  wb.addEventListener('controlling', (event: any) => {
    console.log('Service Worker controlling:', event);
  });

  wb.addEventListener('activated', (event: any) => {
    console.log('Service Worker activated:', event);
  });

  // Send skip waiting to the service worker
  wb.addEventListener('waiting', (event: any) => {
    console.log('Service Worker waiting:', event);
    wb.messageSkipWaiting();
  });

  // Register the service worker after event listeners are added
  wb.register().then((registration) => {
    console.log('Service Worker registered:', registration);
  }).catch((error) => {
    console.error('Service Worker registration failed:', error);
  });
} 
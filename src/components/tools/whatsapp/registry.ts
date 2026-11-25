import { lazy, type ComponentType, type LazyExoticComponent } from 'react';

export const WHATSAPP_COMPONENTS: Record<string, LazyExoticComponent<ComponentType>> = {
  whatsappChat: lazy(() => import('./WhatsAppChatPdf')),
};

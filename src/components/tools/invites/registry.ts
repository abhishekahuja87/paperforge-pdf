import { lazy, type ComponentType, type LazyExoticComponent } from 'react';

export const INVITES_COMPONENTS: Record<string, LazyExoticComponent<ComponentType>> = {
  invitationCardMaker: lazy(() => import('./InvitationCardMaker')),
};

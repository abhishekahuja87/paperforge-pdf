import { lazy, type ComponentType, type LazyExoticComponent } from 'react';

export const WORDDOCS_COMPONENTS: Record<string, LazyExoticComponent<ComponentType>> = {
  docResume: lazy(() => import('./ResumeDoc')),
  docCover: lazy(() => import('./CoverDoc')),
  docResignation: lazy(() => import('./ResignationDoc')),
  docLeave: lazy(() => import('./LeaveDoc')),
  docMinutes: lazy(() => import('./MinutesDoc')),
  docNotice: lazy(() => import('./NoticeDoc')),
};

import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { TOOLS } from '../../config/tools';
import { recordVisit } from '../../lib/myTools';

const BY_PATH = new Map(TOOLS.map((tool) => [tool.path, tool.id]));

/** Remembers the tools a visitor opens, in their own browser only, for the "Your tools" row on the home page. */
export const VisitTracker: React.FC = () => {
  const { pathname } = useLocation();
  useEffect(() => {
    const id = BY_PATH.get(pathname.replace(/\/+$/, '') || '/');
    if (id) recordVisit(id);
  }, [pathname]);
  return null;
};

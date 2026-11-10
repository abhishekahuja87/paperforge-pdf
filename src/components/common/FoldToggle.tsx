import React, { useContext } from 'react';
import { useTranslation } from 'react-i18next';
import { GuideRegistryContext } from './guideRegistry';

/** "Collapse all / Expand all" for the accordion, placed right above the list it controls. */
export const FoldToggle: React.FC = () => {
  const { t } = useTranslation();
  const { folds } = useContext(GuideRegistryContext);
  if (folds.total === 0) return null;
  return (
    <button
      type="button"
      onClick={folds.toggleAll}
      className="shrink-0 rounded-lg px-2 py-1 text-xs font-semibold text-orange-800 underline decoration-orange-300 underline-offset-2 hover:text-orange-900 focus-visible:outline-2 focus-visible:outline-orange-600 print:hidden"
    >
      {folds.allOpen ? t('collapseAll', { defaultValue: 'Collapse all' }) : t('expandAll', { defaultValue: 'Expand all' })}
    </button>
  );
};

export default FoldToggle;

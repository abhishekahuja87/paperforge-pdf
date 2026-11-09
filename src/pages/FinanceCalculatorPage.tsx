import React from 'react';
import { ToolGuide } from '../components/common/ToolGuide';
import { ToolLayout } from '../components/layout/ToolLayout';
import { EmiCalculator } from '../components/tools/finance/EmiCalculator';
import { FdCalculator } from '../components/tools/finance/FdCalculator';
import { GstCalculator } from '../components/tools/finance/GstCalculator';
import { HraCalculator } from '../components/tools/finance/HraCalculator';
import { IncomeTaxCalculator } from '../components/tools/finance/IncomeTaxCalculator';
import { PpfCalculator } from '../components/tools/finance/PpfCalculator';
import { SalaryCalculator } from '../components/tools/finance/SalaryCalculator';
import { SipCalculator } from '../components/tools/finance/SipCalculator';
import { ShareLinkBar } from '../components/common/ShareLinkBar';
import { ShareProvider } from '../lib/shareState';
import { usePageGuide } from '../lib/usePageGuide';
import { useTranslation } from 'react-i18next';

const CALCULATORS = {
  incomeTax: IncomeTaxCalculator,
  salary: SalaryCalculator,
  hra: HraCalculator,
  emi: EmiCalculator,
  sip: SipCalculator,
  fd: FdCalculator,
  ppf: PpfCalculator,
  gst: GstCalculator,
} as const;

export type FinanceCalculatorKind = keyof typeof CALCULATORS;
const GUIDE_IDS = {
  incomeTax: 'incomeTaxCalc', salary: 'salaryCalc', hra: 'hraCalc', emi: 'emiCalc',
  sip: 'sipCalc', fd: 'fdCalc', ppf: 'ppfCalc', gst: 'gstCalc',
} as const;

export const FinanceCalculatorPage: React.FC<{ kind: FinanceCalculatorKind }> = ({ kind }) => {
  const { i18n } = useTranslation();
  const guide = usePageGuide(GUIDE_IDS[kind]);
  const Calculator = CALCULATORS[kind];
  return (
    <ToolLayout title={guide.title} subtitle={guide.subtitle} contentLanguage={i18n.language} seoContent={<ToolGuide toolName={guide.title} faqs={guide.faqs} contentLanguage={guide.language} />}>
      <ShareProvider key={kind}>
        <Calculator />
        <ShareLinkBar />
      </ShareProvider>
    </ToolLayout>
  );
};

export default FinanceCalculatorPage;

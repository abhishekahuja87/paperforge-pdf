import React from 'react';
import { useTranslation } from 'react-i18next';
import { ToolGuide } from '../components/common/ToolGuide';
import { ToolLayout } from '../components/layout/ToolLayout';
import { CagrCalculator } from '../components/tools/finance/CagrCalculator';
import { RdCalculator } from '../components/tools/finance/RdCalculator';
import { SimpleCompoundInterestCalculator } from '../components/tools/finance/SimpleCompoundInterestCalculator';
import { GratuityCalculator } from '../components/tools/finance/GratuityCalculator';
import { InflationCalculator } from '../components/tools/finance/InflationCalculator';
import { LumpsumCalculator } from '../components/tools/finance/LumpsumCalculator';
import { BillSplitter } from '../components/tools/utilities/BillSplitter';
import { BmiCalculator } from '../components/tools/utilities/BmiCalculator';
import { AgeCalculator } from '../components/tools/utilities/AgeCalculator';
import { CaseConverter } from '../components/tools/utilities/CaseConverter';
import { DateDifferenceCalculator } from '../components/tools/utilities/DateDifferenceCalculator';
import { DiscountCalculator } from '../components/tools/utilities/DiscountCalculator';
import { NumberToWords } from '../components/tools/utilities/NumberToWords';
import { PasswordGenerator } from '../components/tools/utilities/PasswordGenerator';
import { PercentageCalculator } from '../components/tools/utilities/PercentageCalculator';
import { UnitConverter } from '../components/tools/utilities/UnitConverter';
import { WordCounter } from '../components/tools/utilities/WordCounter';
import { usePageGuide } from '../lib/usePageGuide';

const TOOLS = {
  simpleCompound: { Component: SimpleCompoundInterestCalculator, guide: 'simpleCompoundCalc' },
  rd: { Component: RdCalculator, guide: 'rdCalc' },
  cagr: { Component: CagrCalculator, guide: 'cagrCalc' },
  age: { Component: AgeCalculator, guide: 'ageCalc' },
  dateDifference: { Component: DateDifferenceCalculator, guide: 'dateDifferenceCalc' },
  percentage: { Component: PercentageCalculator, guide: 'percentageCalc' },
  discount: { Component: DiscountCalculator, guide: 'discountCalc' },
  unit: { Component: UnitConverter, guide: 'unitConverter' },
  wordCounter: { Component: WordCounter, guide: 'wordCounter' },
  caseConverter: { Component: CaseConverter, guide: 'caseConverter' },
  numberToWords: { Component: NumberToWords, guide: 'numberToWords' },
  gratuity: { Component: GratuityCalculator, guide: 'gratuityCalc' },
  lumpsum: { Component: LumpsumCalculator, guide: 'lumpsumCalc' },
  inflation: { Component: InflationCalculator, guide: 'inflationCalc' },
  bmi: { Component: BmiCalculator, guide: 'bmiCalc' },
  billSplitter: { Component: BillSplitter, guide: 'billSplitter' },
  password: { Component: PasswordGenerator, guide: 'passwordGenerator' },
} as const;

export type UtilityKind = keyof typeof TOOLS;

export const UtilityPage: React.FC<{ kind: UtilityKind }> = ({ kind }) => {
  const { i18n } = useTranslation();
  const { Component, guide: guideId } = TOOLS[kind];
  const guide = usePageGuide(guideId);
  return (
    <ToolLayout title={guide.title} subtitle={guide.subtitle} contentLanguage={i18n.language} seoContent={<ToolGuide toolName={guide.title} faqs={guide.faqs} contentLanguage={guide.language} />}>
      <Component />
    </ToolLayout>
  );
};

export default UtilityPage;

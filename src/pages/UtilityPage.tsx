import React, { Suspense, lazy } from 'react';
import { useTranslation } from 'react-i18next';
import { ToolGuide } from '../components/common/ToolGuide';
import { ToolLayout } from '../components/layout/ToolLayout';
import { ShareLinkBar } from '../components/common/ShareLinkBar';
import { ShareProvider } from '../lib/shareState';
import { usePageGuide } from '../lib/usePageGuide';

const CagrCalculator = lazy(() => import('../components/tools/finance/CagrCalculator').then((m) => ({ default: m.CagrCalculator })));
const RdCalculator = lazy(() => import('../components/tools/finance/RdCalculator').then((m) => ({ default: m.RdCalculator })));
const SimpleCompoundInterestCalculator = lazy(() => import('../components/tools/finance/SimpleCompoundInterestCalculator').then((m) => ({ default: m.SimpleCompoundInterestCalculator })));
const GratuityCalculator = lazy(() => import('../components/tools/finance/GratuityCalculator').then((m) => ({ default: m.GratuityCalculator })));
const InflationCalculator = lazy(() => import('../components/tools/finance/InflationCalculator').then((m) => ({ default: m.InflationCalculator })));
const LumpsumCalculator = lazy(() => import('../components/tools/finance/LumpsumCalculator').then((m) => ({ default: m.LumpsumCalculator })));
const BillSplitter = lazy(() => import('../components/tools/utilities/BillSplitter').then((m) => ({ default: m.BillSplitter })));
const BmiCalculator = lazy(() => import('../components/tools/utilities/BmiCalculator').then((m) => ({ default: m.BmiCalculator })));
const GstInvoiceGenerator = lazy(() => import('../components/tools/finance/GstInvoiceGenerator').then((m) => ({ default: m.GstInvoiceGenerator })));
const EpfCalculator = lazy(() => import('../components/tools/finance/EpfCalculator').then((m) => ({ default: m.EpfCalculator })));
const ColorConverter = lazy(() => import('../components/tools/utilities/ColorConverter').then((m) => ({ default: m.ColorConverter })));
const LoremIpsumGenerator = lazy(() => import('../components/tools/utilities/LoremIpsumGenerator').then((m) => ({ default: m.LoremIpsumGenerator })));
const TimeZoneConverter = lazy(() => import('../components/tools/utilities/TimeZoneConverter').then((m) => ({ default: m.TimeZoneConverter })));
const TimestampConverter = lazy(() => import('../components/tools/utilities/TimestampConverter').then((m) => ({ default: m.TimestampConverter })));
const UrlEncoderDecoder = lazy(() => import('../components/tools/utilities/UrlEncoderDecoder').then((m) => ({ default: m.UrlEncoderDecoder })));
const UuidGenerator = lazy(() => import('../components/tools/utilities/UuidGenerator').then((m) => ({ default: m.UuidGenerator })));
const AgeCalculator = lazy(() => import('../components/tools/utilities/AgeCalculator').then((m) => ({ default: m.AgeCalculator })));
const CaseConverter = lazy(() => import('../components/tools/utilities/CaseConverter').then((m) => ({ default: m.CaseConverter })));
const DateDifferenceCalculator = lazy(() => import('../components/tools/utilities/DateDifferenceCalculator').then((m) => ({ default: m.DateDifferenceCalculator })));
const DiscountCalculator = lazy(() => import('../components/tools/utilities/DiscountCalculator').then((m) => ({ default: m.DiscountCalculator })));
const NumberToWords = lazy(() => import('../components/tools/utilities/NumberToWords').then((m) => ({ default: m.NumberToWords })));
const PasswordGenerator = lazy(() => import('../components/tools/utilities/PasswordGenerator').then((m) => ({ default: m.PasswordGenerator })));
const PercentageCalculator = lazy(() => import('../components/tools/utilities/PercentageCalculator').then((m) => ({ default: m.PercentageCalculator })));
const UnitConverter = lazy(() => import('../components/tools/utilities/UnitConverter').then((m) => ({ default: m.UnitConverter })));
const WordCounter = lazy(() => import('../components/tools/utilities/WordCounter').then((m) => ({ default: m.WordCounter })));

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
  gstInvoice: { Component: GstInvoiceGenerator, guide: 'gstInvoiceGen' },
  epf: { Component: EpfCalculator, guide: 'epfCalc' },
  timeZone: { Component: TimeZoneConverter, guide: 'timeZoneConverter' },
  lorem: { Component: LoremIpsumGenerator, guide: 'loremIpsum' },
  color: { Component: ColorConverter, guide: 'colorConverter' },
  uuid: { Component: UuidGenerator, guide: 'uuidGenerator' },
  timestamp: { Component: TimestampConverter, guide: 'timestampConverter' },
  url: { Component: UrlEncoderDecoder, guide: 'urlEncoder' },
  password: { Component: PasswordGenerator, guide: 'passwordGenerator' },
} as const;

export type UtilityKind = keyof typeof TOOLS;

/**
 * Calculators whose inputs are plain numbers, dates and choices, so a pre-filled link makes sense. The Bill Splitter
 * shows its own bar, only in Equal split mode, because Group settle-up cannot be put in a link.
 */
const SHAREABLE = new Set<UtilityKind>(['simpleCompound', 'rd', 'cagr', 'age', 'dateDifference', 'percentage', 'discount', 'unit', 'numberToWords', 'gratuity', 'lumpsum', 'inflation', 'bmi', 'epf', 'timeZone']);

export const UtilityPage: React.FC<{ kind: UtilityKind }> = ({ kind }) => {
  const { i18n } = useTranslation();
  const { Component, guide: guideId } = TOOLS[kind];
  const guide = usePageGuide(guideId);
  return (
    <ToolLayout title={guide.title} subtitle={guide.subtitle} contentLanguage={i18n.language} seoContent={<ToolGuide toolName={guide.title} faqs={guide.faqs} contentLanguage={guide.language} />}>
      <ShareProvider key={kind}>
        <Suspense fallback={<div className="py-10 text-center text-sm text-slate-500" role="status">Loading…</div>}>
          <Component />
        </Suspense>
        {SHAREABLE.has(kind) && <ShareLinkBar />}
      </ShareProvider>
    </ToolLayout>
  );
};

export default UtilityPage;

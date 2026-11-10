/** Text of the Editorial Policy page. One source for the page and the pre-rendered HTML copy. */
export interface EditorialSection {
  heading: string;
  paragraphs: string[];
}

export const EDITORIAL = {
  title: 'How we build and check our tools',
  subtitle: 'Our editorial policy: where numbers come from, how tools are tested, how mistakes are fixed and how the site is paid for.',
  description:
    'How MyDailyUtils builds, checks and corrects its calculators, generators and file tools, where rules and figures come from, how privacy is handled and how the site earns money.',
  sections: [
    {
      heading: 'Why this site exists',
      paragraphs: [
        'MyDailyUtils is an independent site run from Bangalore, India. The aim is simple: take the ordinary utilities people look for every day, such as an EMI calculator, a PDF merger or a photo resizer for an exam form, and make each one a level better than the usual version. That can mean fewer steps, a clearer explanation of the result, or handling the cases other tools ignore.',
        'Every tool page carries more than the tool itself: how to use it, what the result means, the rules that apply and answers to common questions. If a page only offered a box and a button, we would not consider it finished.',
      ],
    },
    {
      heading: 'Where the rules and figures come from',
      paragraphs: [
        'Finance and tax tools use published rules: tax slabs, standard deduction and rebate limits from the Income Tax Department and the Union Budget, GST rates from the GST Council notifications, and the formulas banks and funds publish for EMI, SIP, FD, RD and PPF. The tax year each calculator covers is named on its page, and limits are shown next to the result so you can see when an input crosses one.',
        'Sports court and ground sizes come from the governing body for each sport (for example FIBA, BWF, FIVB, ITF, World Rugby, FIFA IFAB Laws of the Game, ICC and the national federations). Each version of a court lists its sources and the date its figures were last checked. Where a figure comes from a summary or an older edition, the notes say so.',
        'Photo and file size rules for online forms are examples of common requirements. Exam bodies change them often, so always read the current notification of the exam or service you are applying to.',
      ],
    },
    {
      heading: 'How a tool is tested',
      paragraphs: [
        'Calculators are checked against hand-worked examples and against the published formulas. Edge cases such as part-year periods, leap years, zero rates, very large amounts and cut-off dates are tried on purpose.',
        'File tools are tried on real PDFs and images of different sizes and on a phone as well as a desktop browser. Each change is added to a written test checklist that is run after it goes live. When something fails, the tool shows a plain error message rather than a blank result.',
      ],
    },
    {
      heading: 'Estimates, not advice',
      paragraphs: [
        'Tax, loan, investment and health results are estimates meant to help you understand a decision. They are not financial, tax, legal or medical advice. Your lender, employer, tax filing portal or doctor has the final say. Where a result depends on something we cannot know, we say so beside the result.',
      ],
    },
    {
      heading: 'Your files and numbers',
      paragraphs: [
        'File tools process your files in your browser. They are not uploaded to MyDailyUtils for processing, and calculators work on the numbers you type in the same way. The Privacy Policy explains what the site still loads over the network, such as pages, analytics and advertising.',
        'We do not build tools meant to forge or alter official documents. Tools that make documents, such as receipts or invoices, are for real transactions and carry reminders about the rules that apply.',
      ],
    },
    {
      heading: 'Keeping pages up to date',
      paragraphs: [
        'Rules change every year. Tax, GST and other figures are reviewed when the Union Budget or a notification changes them, and guides show the tax year they cover. New tools and large changes are documented as they are released.',
      ],
    },
    {
      heading: 'Corrections',
      paragraphs: [
        'If you find a wrong figure, a broken tool or an out-of-date rule, please tell us through the Contact page with the tool name and what you entered. We check every report, fix confirmed errors and update the page. Requests for new tools are welcome on the same page.',
      ],
    },
    {
      heading: 'How the site is paid for',
      paragraphs: [
        'The tools are free to use. The site is supported by advertising through Google AdSense, which covers hosting and development. Advertising never decides what a tool says or how it calculates, and we do not accept payment to favour any bank, lender, fund or product in a result.',
      ],
    },
  ] as EditorialSection[],
};

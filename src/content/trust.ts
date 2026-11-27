/** Text of the "Why trust MyDailyUtils" page. One source for the page and the pre-rendered HTML copy. */
export interface TrustSection {
  heading: string;
  paragraphs: string[];
}

export const TRUST = {
  title: 'Why trust MyDailyUtils',
  subtitle: 'Who runs the site, what stays on your device, what we do collect, and how you can check it yourself.',
  description:
    'Who runs MyDailyUtils, what happens to your files, what is collected, how the site is paid for and a quick test to see the tools work offline.',
  sections: [
    {
      heading: 'Who runs this site',
      paragraphs: [
        'MyDailyUtils is an independent website run from Bangalore, India. It has no sign-up, no account and no paid plan. The site is supported by advertising shown through Google AdSense, which pays for hosting and development.',
        'You can reach us through the contact page. Fixes and improvements are listed on the What\'s new page.',
      ],
    },
    {
      heading: 'Free means free',
      paragraphs: [
        'There is no paid plan, no trial and no sign-up. The PDF and photo tools set no daily limit and no limit on how many files or pages you use, and results carry no watermark. The only limit is your own device’s memory for very large files. The full list is on the free, no limits page.',
      ],
    },
    {
      heading: 'What stays on your device',
      paragraphs: [
        'The PDF, image, scanner, signature, sheet-maker, calculator and text tools do their work in your browser. The file you choose, the photo you take and the numbers you type are used on your device to make the result. They are not sent to MyDailyUtils for processing.',
        'The Digitize Documents tool downloads its text recognition engine and English language data from this site the first time you use it. The recognition itself still runs on your device.',
      ],
    },
    {
      heading: 'Check it yourself in two minutes',
      paragraphs: [
        'Open a file tool, such as Merge PDF or the Image Resizer, and let the page finish loading. Turn on airplane mode, or turn off Wi-Fi and mobile data. Choose a file and run the tool. If it still works, your file was not needed by any server to do the job. (Advertising will not load while you are offline, which is expected.)',
        'On a computer you can also open your browser\'s developer tools, choose the Network tab, run a tool and look for requests that carry your file. The guide How to check a tool keeps your files private shows each step.',
      ],
    },
    {
      heading: 'What we do collect',
      paragraphs: [
        'We use Google Tag Manager and Google Analytics to count visits and see which pages and tools are used, and Google AdSense to show advertising. These can use cookies and similar technologies. In the European Economic Area, the United Kingdom and Switzerland they stay off until you choose in Google\'s consent message.',
        'Some tools remember your choices, such as a logo or your name on a sheet, in your browser\'s local storage on your device, only when you ask them to. If you use the contact form, the message you send is received by us. The privacy policy lists everything in full.',
      ],
    },
    {
      heading: 'What the tools are and are not',
      paragraphs: [
        'Calculators give estimates to help you understand a decision. They are not financial, tax, legal or medical advice, and your lender, employer, filing portal or doctor has the final say.',
        'Signatures, stamps, ID cards, certificates and UPI stands made here are templates and pictures for your own use. They are not official or certified documents, and the person or office you give them to decides whether to accept them. Photo and file size presets are examples, because exam and form rules change; always follow the instructions on your own form.',
      ],
    },
    {
      heading: 'How the numbers and rules are checked',
      paragraphs: [
        'Rules and figures come from published sources, formulas are checked against worked examples, and every change is added to a written test list. The editorial policy explains this in detail, including how corrections are made.',
      ],
    },
    {
      heading: 'What the offline copy is',
      paragraphs: [
        'If you install the site on your phone, a small background script saves copies of this site\'s own pages and files in your browser so tools can open without a connection. It never saves the files you choose and never touches content from other sites such as advertising or analytics. Clearing your browser\'s site data removes it.',
      ],
    },
  ] as TrustSection[],
};

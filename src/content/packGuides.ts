import type { Guide } from './guides';

/**
 * Guides that go with the tool packs (students, freelancers, careers). They sit in their own file so
 * src/content/guides.ts stays small; GUIDES in that file includes them. Every claim about a MyDailyUtils
 * tool must match what the tool really does.
 */
export const PACK_GUIDES: Guide[] = [
  {
    slug: 'how-to-calculate-gpa-and-convert-cgpa-to-percentage',
    title: 'How to calculate GPA and CGPA, and convert CGPA to percentage',
    description: 'The credit-weighted method behind GPA and CGPA, why conversion formulas differ, and how to work out the GPA you need next semester.',
    tools: ['gpa-cgpa-calculator', 'final-grade-calculator', 'study-planner'],
    sections: [
      { heading: 'What GPA and CGPA mean', paragraphs: [
        'GPA, or SGPA in many Indian universities, is your average grade for one semester or term. CGPA is the cumulative average across all the semesters you have completed. Both are weighted by credits, so a four-credit course counts twice as much as a two-credit course.',
        'Your marksheet is the final authority. Use the calculators to check it, to plan ahead and to understand how a single grade moves your average.',
      ] },
      { heading: 'Calculating a semester GPA', paragraphs: [
        'Turn each grade into grade points using your institution\'s scale. On a 10-point scale an O is 10 and an A+ is 9, and on a 4.0 scale an A is 4.0. Multiply the points by the credits for each course, add the results and divide by the total credits.',
        'Example: three courses with 4, 3 and 2 credits and grade points of 9, 8 and 10 give (36 + 24 + 20) divided by 9, which is 80 divided by 9, or 8.89. In the GPA and CGPA Calculator, choose Semester GPA, pick the scale and enter each course with its credits and grade.',
      ] },
      { heading: 'Combining semesters into a CGPA', paragraphs: [
        'The usual method weights each semester\'s GPA by its credits. A semester of 24 credits with a GPA of 8.0 and a semester of 20 credits with a GPA of 9.0 give (192 + 180) divided by 44, which is 8.45. A simple average of 8.0 and 9.0 would give 8.5, so the weighting matters when the credits differ.',
        'Some universities calculate CGPA from all grade points of all courses, which gives the same answer when the semester GPAs are exact. If your university rounds each semester\'s GPA, your marksheet can differ by a hundredth or two.',
      ] },
      { heading: 'Converting CGPA to percentage', paragraphs: [
        'There is no single worldwide rule. For a 10-point CGPA, many boards and universities multiply by 9.5, so 8.2 becomes 77.9 percent. Others multiply by 10, which gives 82 percent. For a 4.0 scale, a straight proportion gives 3.2 out of 4 as 80 percent, but many institutions use tables instead.',
        'Use the formula asked for by the college, employer or form you are dealing with. If none is given, ask your university for its official conversion in writing. The calculator lets you pick the formula and shows both directions.',
      ] },
      { heading: 'Planning the next semester', paragraphs: [
        'To find the GPA you need to reach a target CGPA, treat your current CGPA and completed credits as one block. The needed GPA equals the target multiplied by the total credits after the next semester, minus your current points, divided by the credits of the next semester. If the answer is above the top of the scale, the target is out of reach in one semester and you will need to spread the improvement over two or more.',
        'For example, with a CGPA of 7.8 over 60 credits and 20 credits to come, a target of 8.0 needs a GPA of 8.6 next semester. The target mode does this arithmetic for you.',
      ] },
      { heading: 'Common mistakes', paragraphs: [
        'Do not average GPAs without weighting by credits, and do not mix scales: a 4.0 GPA cannot be added to a 10-point GPA. Check how your university handles repeated courses, pass or fail courses and grace marks, because these change what counts. Nothing you type into the calculators leaves your browser.',
      ] },
    ],
  },
  {
    slug: 'how-to-cite-sources-apa-mla-chicago-harvard',
    title: 'How to cite websites, books and articles in APA, MLA, Chicago and Harvard',
    description: 'What each citation style asks for, how the same source looks in four styles, and how to build a sorted reference list.',
    tools: ['citation-generator'],
    sections: [
      { heading: 'Why citations matter', paragraphs: [
        'A citation tells the reader where an idea or quotation came from, lets them check it and gives credit to the author. Missing or wrong citations can cost marks and, if the work looks copied, can lead to a plagiarism case. Whatever style you use, apply it consistently across the whole piece.',
      ] },
      { heading: 'The four styles in short', paragraphs: [
        'APA 7th edition is common in psychology, education and the social sciences, and puts the date right after the author. MLA 9th edition is common in the humanities and uses the author\'s full name and a list of container details. Chicago author-date is used in many history and social science courses. Harvard is widely used in the UK and Australia and puts the year in brackets after the author.',
        'Your teacher or journal decides which one to use. If the assignment does not say, ask, because the rules for punctuation, capitals and italics differ.',
      ] },
      { heading: 'The same source in four styles', paragraphs: [
        'Take a journal article by Ann Lee, Bo Chen and Cy Das, titled "Sleep and memory", published in Journal of Study, volume 12, issue 3, pages 45 to 60, in 2022. In APA it reads: Lee, A., Chen, B., & Das, C. (2022). Sleep and memory. Journal of Study, 12(3), 45–60. In MLA, with three authors, it becomes: Lee, Ann, et al. "Sleep and memory." Journal of Study, vol. 12, no. 3, 2022, pp. 45–60.',
        'Chicago writes: Lee, Ann, Bo Chen, and Cy Das. 2022. "Sleep and memory." Journal of Study 12 (3): 45–60. Harvard writes: Lee, A., Chen, B. and Das, C. (2022) \'Sleep and memory\', Journal of Study, 12(3), pp. 45–60. The details are the same, and the order, punctuation and names differ.',
      ] },
      { heading: 'Where to find the details', paragraphs: [
        'For a book, use the title page and the page behind it for the author, edition, publisher, city and year. For a journal article, use the first page of the article or the journal\'s website. For a web page, look for the author or organisation, the page title, the site name and a date, and note the date you read it. Do not copy details from a search result, which can be wrong.',
      ] },
      { heading: 'Building a reference list', paragraphs: [
        'List every source you cited, once each, in alphabetical order by the first author\'s surname. The Citation Generator can add each finished citation to a list that sorts itself A to Z, keeps the italics when you copy it and can be printed. Check the order yourself for sources without authors and for several works by one author, since styles have special rules for those.',
      ] },
      { heading: 'Check before you hand in', paragraphs: [
        'A generator saves time, but it cannot see your source. Check spelling of names, the year of the version you used and that links work. Read your assignment brief for special rules, such as the number of authors to list. What you type into the tool stays in your browser.',
      ] },
    ],
  },
  {
    slug: 'how-to-set-your-freelance-rate',
    title: 'How to set your freelance hourly rate, day rate and project price',
    description: 'A step-by-step way to work out what to charge so you reach the take-home income you want, with tax, costs and unbillable time included.',
    tools: ['freelance-rate-calculator', 'quotation-generator', 'margin-markup-calculator'],
    sections: [
      { heading: 'Why guessing a rate goes wrong', paragraphs: [
        'Many new freelancers take an employee\'s hourly pay and add a little. That misses what an employer normally covers: paid holidays, sick days, equipment, health cover, retirement saving and the time you spend finding work. The result is a rate that looks fine and leaves you short at the end of the year.',
      ] },
      { heading: 'Step 1: decide the income you want', paragraphs: [
        'Start with the take-home income you need per year after tax. Be realistic and include savings and the things you want to be able to afford. Then add the costs of running your business, such as software, a laptop, internet, insurance, an accountant and any workspace, and the benefits you now pay for yourself, like health cover and retirement contributions.',
      ] },
      { heading: 'Step 2: count the hours you can bill', paragraphs: [
        'A 52 week year is not 52 weeks of work. Subtract your weeks off for holidays, public holidays and sickness, then decide how many hours a week you work. Not all of those hours can be billed: finding clients, writing quotes, invoicing and learning take time. Many freelancers bill 50 to 70 percent of their working hours.',
        'With 6 weeks off, 40 hours a week and 60 percent billable, you have 46 weeks times 40 hours times 0.6, which is 1,104 billable hours a year.',
      ] },
      { heading: 'Step 3: add tax and a buffer', paragraphs: [
        'Divide your take-home target by one minus your tax rate to find the revenue needed before tax, then add costs and benefits. A buffer of 10 percent or so covers slow months, late payments and growth. With a take-home goal of 60,000, tax of 25 percent, costs of 6,000, benefits of 4,000 and a 10 percent buffer, the revenue needed is 99,000. Divided by 1,104 hours, that is about 89.70 per hour, or about 717 per day.',
        'Tax rules differ by country and by how you are registered, so use the tax rate an accountant gives you. The Freelance Rate Calculator shows each part of this build-up in a table.',
      ] },
      { heading: 'Pricing a project', paragraphs: [
        'For a fixed-price job, estimate the hours, add a cushion of 10 to 25 percent for revisions and extra requests, and multiply by your hourly rate. Look back at how long similar jobs took you, since most people underestimate. Then present the price clearly in a quotation with what is included, how many revisions are covered, a deposit and a validity date. The Quotation Generator makes a printable PDF for this.',
      ] },
      { heading: 'Check your rate against the market', paragraphs: [
        'The result is your floor, not your price. Compare it with what others in your field and country charge, and with the value your work brings to the client. If the floor is far above the market, look at your costs, your billable share and the kind of work you take. If you offer discounts, check what they do to your profit with the Margin and Markup Calculator.',
      ] },
    ],
  },
  {
    slug: 'margin-vs-markup-explained',
    title: 'Margin vs markup: what the difference is and how to price with each',
    description: 'Why a 50 percent markup is not a 50 percent margin, how to convert between them and what a discount really costs you.',
    tools: ['margin-markup-calculator', 'discount-calculator', 'percentage-calculator'],
    sections: [
      { heading: 'Two ways to describe the same profit', paragraphs: [
        'Margin is profit as a share of the selling price. Markup is profit as a share of the cost. If something costs 60 and sells for 100, the profit is 40. The margin is 40 divided by 100, which is 40 percent. The markup is 40 divided by 60, which is 66.7 percent.',
      ] },
      { heading: 'The mistake that costs money', paragraphs: [
        'Someone who adds 30 percent to cost and believes they earn a 30 percent margin is wrong. Cost 100 plus 30 percent gives a price of 130 and a profit of 30, which is a margin of 23 percent. To earn a true 30 percent margin you need a price of 100 divided by 0.7, which is 142.86, a markup of about 43 percent.',
        'The conversion is simple: markup equals margin divided by one minus margin, and margin equals markup divided by one plus markup.',
      ] },
      { heading: 'Pricing from a target', paragraphs: [
        'To reach a target margin, divide the cost by one minus the margin. For a cost of 60 and a margin of 40 percent, the price is 60 divided by 0.6, which is 100. To use a markup, multiply the cost by one plus the markup. The Margin and Markup Calculator does both and shows the equivalent in the other measure.',
      ] },
      { heading: 'What a discount really costs', paragraphs: [
        'A discount comes straight out of profit. With a 40 percent margin on a price of 100, a 10 percent discount cuts the price to 90 and the profit from 40 to 30, so you must sell a third more just to earn the same total profit. A 20 percent discount cuts the profit to 20, and you need to double your sales.',
        'Before offering a discount, work out how many extra sales you can realistically win. If the discount removes all your profit, it is a loss on every sale.',
      ] },
      { heading: 'Break-even', paragraphs: [
        'Break-even is the number of sales at which the profit from each sale has paid off your fixed costs. Divide the fixed costs by the profit per sale and round up. With 1,000 of fixed costs and a profit of 40 per sale, you need 25 sales. The calculator shows this as well.',
      ] },
      { heading: 'Which one to use', paragraphs: [
        'Margin is better for judging how healthy a business is, because it shows how much of each sale you keep. Markup is handy for setting prices from a cost. Use the one your client, accountant or marketplace asks for, and say which one you mean. Neither figure includes tax, fees or refunds unless you add them to the cost.',
      ] },
    ],
  },
  {
    slug: 'how-to-write-a-resume-that-works-for-recruiters-and-parsers',
    title: 'How to write a clear resume and save it as a PDF recruiters can read',
    description: 'What to put on a resume, how to word achievements, and how to check your PDF and file name before you apply.',
    tools: ['resume-builder', 'upload-file-checker', 'compress-pdf'],
    sections: [
      { heading: 'What a resume is for', paragraphs: [
        'A resume has one job: to get you an interview. A recruiter may spend under a minute on a first look, and many companies run resumes through software that reads the text. A clear, single-column layout with standard headings works well for both.',
      ] },
      { heading: 'What to include', paragraphs: [
        'Put your name, a professional email, a phone number and your city at the top. Add a two or three line summary of who you are and what you do well. List your jobs with the newest first, then education, skills and, if useful, projects and certifications. Photos, graphics, tables and icons can confuse parsing software, so the Resume Builder leaves them out.',
      ] },
      { heading: 'Writing strong bullet points', paragraphs: [
        'Under each job, write three to six bullets that say what you did and what came of it. Start each with an action verb, such as led, built, reduced or trained, and add a number where you honestly can. "Handled customer complaints" is weak. "Resolved about 40 customer complaints a week and raised the satisfaction score from 3.8 to 4.4" shows the result.',
        'Avoid weak openings like "responsible for" and "worked on", and avoid writing in the first person. If you are a fresher, give projects, internships and coursework the space that jobs would get.',
      ] },
      { heading: 'Layout and length', paragraphs: [
        'For under ten years of experience, one page is usually enough. If it runs to a second page, cut older roles, shorten bullets or keep only the strongest four to six per job. Use a plain font at a readable size and keep margins even. The page counter in the builder shows how many pages the printout will have.',
      ] },
      { heading: 'Saving and checking the PDF', paragraphs: [
        'Press Print or save as PDF and choose Save as PDF as the destination, with margins on Default and headers and footers off. Open the file and try to select a line of text: if you can, the PDF contains real text. Name it clearly, for example with your name and the word resume, and avoid spaces and special characters if the portal is strict.',
      ] },
      { heading: 'Before you upload', paragraphs: [
        'Check the application form for its file size limit, accepted types and page limit. The Upload File Checker looks at size, type, pages, passwords, searchable text and the file name, and points to the tool that fixes each problem, for example Compress PDF for a file that is too large. Always follow the employer\'s instructions, because their rules come first. Your resume stays in your browser unless you choose to keep a copy.',
      ] },
    ],
  },
  {
    slug: 'how-to-plan-your-study-time-before-exams',
    title: 'How to plan your study time before exams',
    description: 'A practical way to turn exam dates into a daily plan, with revision days kept free and a check on what grade you need.',
    tools: ['study-planner', 'final-grade-calculator', 'gpa-cgpa-calculator'],
    sections: [
      { heading: 'Start with the dates', paragraphs: [
        'List every exam with its date. Then count the days between today and each exam, and mark the days you cannot study, such as travel, family events or weekly commitments. This tells you how much time you really have before you decide how much to study.',
      ] },
      { heading: 'Estimate the hours each subject needs', paragraphs: [
        'For each subject, list the chapters or topics you still have to learn and estimate how long each will take, including practice questions or past papers. Be honest about weak areas, which need more time. Round up a little, since estimates are usually too low. The total for each subject is the number of hours to enter in the Study Planner.',
      ] },
      { heading: 'Fill the available days', paragraphs: [
        'Decide how many hours you can study on a normal day, and be realistic. Three focused hours a day for a month beats eight hours for two days. The planner goes through your study days in order and, for each half hour, gives the time to the subject with the most work left for the days remaining. That mixes subjects across the week and gives more time to the urgent ones.',
      ] },
      { heading: 'Keep days for revision', paragraphs: [
        'Finish new material a few days before each exam so that the last days are for revision, practice papers and rest. The planner has a setting for the number of days before each exam when new study should be finished. If the plan says a subject does not fit, you can add study days, raise the hours per day, start earlier or reduce the hours needed.',
      ] },
      { heading: 'Know which exams matter most', paragraphs: [
        'Use the Final Grade Calculator to see how much each exam can change your result. If you have already secured the grade you need in one course, you can give more time to another. The GPA and CGPA Calculator shows the effect of each course on your semester and cumulative average, weighted by credits.',
      ] },
      { heading: 'Stick to it, but adjust', paragraphs: [
        'A plan is a guide. If you fall behind, change the start date or the hours and generate a new plan instead of giving up. Add short breaks and sleep, because tired study is slow study. Copy or print the plan before you close the page, since it is not saved.',
      ] },
    ],
  },
  {
    slug: 'how-notice-period-and-last-working-day-work',
    title: 'How your notice period and last working day are worked out',
    description: 'How to count a notice period, what a buyout means, how leave changes your last day and how to line it up with a new joining date.',
    tools: ['notice-period-calculator', 'date-difference-calculator'],
    sections: [
      { heading: 'Start with your contract', paragraphs: [
        'Your offer or appointment letter states the notice period, usually in days or months, and the employee handbook explains how it is counted. HR\'s written answer is what counts. The calculator is for planning, and it helps you ask the right questions.',
      ] },
      { heading: 'How the last day is counted', paragraphs: [
        'With a notice of 60 days, you add 60 calendar days to the day you resign. Some companies count the resignation day as day 1, which makes the last day one day earlier. With a notice in months, you add whole months: a resignation on 9 November with two months of notice ends on 9 January. If the target month is shorter, the last day of that month is used.',
        'Some employers count only working days, Monday to Friday, which makes the notice longer in calendar time. The calculator lets you choose each of these options.',
      ] },
      { heading: 'Leave during notice', paragraphs: [
        'Many companies extend the notice by the number of leave days you take, so a week of leave moves your last day a week later. Others let you adjust leave against the notice, or do not allow leave at all during notice. Ask HR before you plan any time off.',
      ] },
      { heading: 'Buying out notice', paragraphs: [
        'A buyout means paying your employer for notice days you will not serve. A common estimate is monthly pay divided by 30, multiplied by the days bought out, but the pay used, such as gross, basic or fixed, and the rules differ by company. Some employers set a minimum period you must serve or do not allow buyouts. Treat the calculator\'s figure as an estimate and get the exact amount in writing.',
      ] },
      { heading: 'Lining up with a new job', paragraphs: [
        'Enter your new joining date to see the gap between jobs. A gap of zero means you start the day after your last working day. A negative result shows how many days of notice you would need to cut. You can then talk to your manager about a shorter notice or a buyout, or ask the new employer for a later start date. Put any agreement in writing.',
      ] },
      { heading: 'Last working day and relieving date', paragraphs: [
        'They are not always the same. The last working day is when you stop work. The relieving date on your relieving letter can be the same or a little later, for example after clearing dues or encashing leave. Ask HR which date will appear on your documents, because your next employer may check it.',
      ] },
    ],
  },
];

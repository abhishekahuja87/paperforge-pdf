import React from 'react';
import { ToolGuide } from '../components/common/ToolGuide';
import { DisplayStudio } from '../components/tools/DisplayStudio';
import { ToolLayout } from '../components/layout/ToolLayout';
import { siteConfig } from '../config/site';

export const DisplayStudioPage: React.FC = () => {
  const steps = [
    { title: 'Add files and choose slides', description: 'Load PDFs, DOCX Word documents, or browser-supported images. Each PDF or Word page becomes a separate slide; exclude pages you do not want.' },
    { title: 'Set timing and screen options', description: 'Choose a default interval, override timing per slide, add optional captions, and set fit mode, transitions, looping, shuffle, date, and local time.' },
    { title: 'Start presenting', description: 'Use the fullscreen button in the player, or press F11 in your browser. Move the pointer to bring back controls; press Escape to leave fullscreen.' },
  ];
  const faqs = [
    { question: `Are my files uploaded to ${siteConfig.name}?`, answer: 'No. Your files are rendered in this browser and kept in the current page. They are not uploaded; closing or refreshing the page clears the playlist.' },
    { question: 'Which files can I display?', answer: 'PDFs, .docx Word documents, and image formats that the current browser can decode. PDF and DOCX pages become separate slides. A browser-supported image becomes one still slide; animated images are not played as animation. Password-protected PDFs must be unlocked before use.' },
    { question: 'How do I remove a page from the show?', answer: 'Uncheck Include on a slide to keep it in your playlist but skip it during playback. Use the X button to remove that slide from the playlist entirely. The original file is never changed.' },
    { question: 'How does per-slide timing work?', answer: 'A blank duration uses the playlist default. Set an individual slide to a number of seconds to override it, or set it to 0 for manual advance. Manual-advance slides remain visible until you use Next or a keyboard shortcut.' },
    { question: 'How do I show this on a TV or classroom screen?', answer: 'Start the show, choose the fullscreen control in the player, and connect or cast your browser to the display using your device’s normal screen-sharing method. F11 toggles browser fullscreen on many computers; Escape exits fullscreen. TV browsers and remotes differ, so test the connection and controls before an event.' },
    { question: 'Will the screen stay awake all day?', answer: 'The tool can request the browser Screen Wake Lock API when available, but this is best-effort. The browser may release it when the tab is hidden, the device may not support it, and TV or operating-system power settings can override it. For long-running signage, adjust the display’s own sleep settings.' },
    { question: 'What time and date are shown?', answer: 'The optional overlay uses the device’s current local date and time, including its locale and timezone. It is not a synchronized clock or a scheduled advertisement system.' },
  ];

  return (
    <ToolLayout
      title="Display & Presentation"
      subtitle="Turn PDFs, Word documents, and images into a browser-based fullscreen slideshow for lessons, events, photo frames, and in-store displays."
      seoContent={<ToolGuide toolName="Display & Presentation" steps={steps} faqs={faqs} privacyNote="Files are rendered locally in browser memory and are not uploaded. The playlist is temporary and is cleared when you close or refresh this page." />}
    >
      <DisplayStudio />
    </ToolLayout>
  );
};

export default DisplayStudioPage;

import React from 'react';
import { FONT_STACKS, readableOn, tint } from '../../../lib/careers/resumeTemplates';
import { JD_SECTION_ORDER, fillText, metaLine, toBullets, type JdDetails, type JdSections, type JdTemplateSpec } from '../../../lib/hiring/jdTemplates';

/** The job description as a page. Print uses this same element, so the PDF matches the preview. */
export const JdPreview: React.FC<{ spec: JdTemplateSpec; accent: string; details: JdDetails; sections: JdSections }> = ({ spec, accent, details, sections }) => {
  const meta = metaLine(details);
  const band = spec.header === 'band';
  const bandInk = readableOn(accent);
  return (
    <div style={{ fontFamily: FONT_STACKS[spec.font], color: '#1a1a1a', fontSize: 14, lineHeight: 1.55, background: '#fff' }}>
      <div style={band ? { background: accent, color: bandInk, padding: '28px 36px' } : { padding: '32px 36px 0', borderLeft: spec.header === 'bar' ? `8px solid ${accent}` : undefined }}>
        <h2 style={{ margin: 0, fontSize: 28, lineHeight: 1.2, fontWeight: 700, color: band ? bandInk : '#111' }}>{details.title.trim() || 'Job title'}</h2>
        {details.company.trim() && <p style={{ margin: '4px 0 0', fontSize: 16, fontWeight: 600, color: band ? tint(bandInk, 0.9) : accent }}>{details.company.trim()}</p>}
        {meta.length > 0 && <p style={{ margin: '10px 0 0', fontSize: 13, color: band ? tint(bandInk, 0.85) : '#555' }}>{meta.join('  ·  ')}</p>}
        {!band && <div style={{ marginTop: 16, height: 3, width: 64, background: accent }} />}
      </div>
      <div style={{ padding: band ? '20px 36px 32px' : '8px 36px 32px', borderLeft: !band && spec.header === 'bar' ? `8px solid ${accent}` : undefined }}>
        {JD_SECTION_ORDER.map((section) => {
          const text = fillText(sections[section.key], details).trim();
          if (!text) return null;
          return (
            <section key={section.key} style={{ marginTop: 18, breakInside: 'avoid' }}>
              <h3 style={{ margin: '0 0 6px', fontSize: 15, fontWeight: 700, color: accent, textTransform: 'uppercase', letterSpacing: 0.4 }}>{section.label}</h3>
              {section.bullets ? (
                <ul style={{ margin: 0, paddingLeft: 20 }}>{toBullets(text).map((item, index) => <li key={index} style={{ margin: '2px 0' }}>{item}</li>)}</ul>
              ) : (
                <p style={{ margin: 0, whiteSpace: 'pre-line' }}>{text}</p>
              )}
            </section>
          );
        })}
        {details.contact.trim() && <p style={{ margin: '22px 0 0', fontWeight: 700 }}>Contact: <span style={{ fontWeight: 400 }}>{details.contact.trim()}</span></p>}
      </div>
    </div>
  );
};

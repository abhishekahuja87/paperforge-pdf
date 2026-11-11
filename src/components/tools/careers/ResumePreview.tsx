import React from 'react';
import { formatRange, splitLines, splitSkills, type ResumeData } from '../../../lib/careers/resume';
import { FONT_STACKS, getTemplate, readableOn, readableOnGradient, shade, tint, type ResumeTemplateSpec } from '../../../lib/careers/resumeTemplates';

export interface ResumeStyle { template: string; accent: string; size: 'compact' | 'normal' | 'large'; paper: 'a4' | 'letter' }

export const PAPER = {
  a4: { width: 794, height: 1123, label: 'A4' },
  letter: { width: 816, height: 1056, label: 'US Letter' },
} as const;

const FONT = { compact: 12, normal: 13, large: 14 } as const;
const INK = '#111111';
const MUTED = '#555555';

interface Look {
  spec: ResumeTemplateSpec;
  accent: string;
  /** Gradient end colour. */
  deep: string;
  /** Heading elements; plain boxes when the picture is only a thumbnail, so the page keeps one real h1. */
  h1: 'h1' | 'div';
  h2: 'h2' | 'div';
}

const Heading: React.FC<{ title: string; look: Look }> = ({ title, look }) => {
  const { spec, accent } = look;
  const base: React.CSSProperties = { margin: '0 0 6px', fontSize: '1.05em', fontWeight: 700, lineHeight: 1.25 };
  switch (spec.headings) {
    case 'accent-rule':
      return <look.h2 style={{ ...base, color: accent, letterSpacing: '0.06em', textTransform: 'uppercase', borderBottom: `2px solid ${accent}`, paddingBottom: 2 }}>{title}</look.h2>;
    case 'bar':
      return <look.h2 style={{ ...base, color: accent, letterSpacing: '0.06em', textTransform: 'uppercase', borderLeft: `4px solid ${accent}`, background: tint(accent, 0.09), padding: '3px 8px' }}>{title}</look.h2>;
    case 'small-caps':
      return <look.h2 style={{ ...base, color: accent, fontVariant: 'small-caps', letterSpacing: '0.1em', fontSize: '1.15em', borderBottom: '1px solid #cfcfcf', paddingBottom: 2 }}>{title}</look.h2>;
    case 'plain-caps':
      return <look.h2 style={{ ...base, color: '#333', fontSize: '0.95em', letterSpacing: '0.16em', textTransform: 'uppercase', borderBottom: '1px solid #dddddd', paddingBottom: 3 }}>{title}</look.h2>;
    case 'pill': {
      const text = readableOn(accent);
      return <look.h2 style={{ ...base, display: 'inline-block', background: accent, color: text, borderRadius: 999, padding: '2px 12px', fontSize: '0.9em', letterSpacing: '0.08em', textTransform: 'uppercase' }}>{title}</look.h2>;
    }
    case 'divider':
      return (
        <look.h2 style={{ ...base, display: 'flex', alignItems: 'center', gap: 10, color: accent, letterSpacing: '0.14em', textTransform: 'uppercase', fontSize: '0.95em' }}>
          <span aria-hidden="true" style={{ flex: 1, height: 1, background: tint(accent, 0.45) }} />
          {title}
          <span aria-hidden="true" style={{ flex: 1, height: 1, background: tint(accent, 0.45) }} />
        </look.h2>
      );
    default:
      return <look.h2 style={{ ...base, letterSpacing: '0.08em', textTransform: 'uppercase', borderBottom: '1px solid #444', paddingBottom: 2 }}>{title}</look.h2>;
  }
};

const Section: React.FC<{ title: string; look: Look; children: React.ReactNode }> = ({ title, look, children }) => (
  <section style={{ marginTop: 14 }}>
    <Heading title={title} look={look} />
    {children}
  </section>
);

const Bullets: React.FC<{ lines: string[]; color?: string }> = ({ lines, color }) => (
  lines.length === 0 ? null : (
    <ul style={{ margin: '3px 0 0 18px', padding: 0, listStyle: 'disc', color }}>
      {lines.map((line, index) => <li key={index} style={{ marginBottom: 2 }}>{line}</li>)}
    </ul>
  )
);

const Chips: React.FC<{ items: string[]; look: Look }> = ({ items, look }) => (
  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
    {items.map((item, index) => (
      <span key={`${item}-${index}`} style={{ background: tint(look.accent, 0.12), border: `1px solid ${tint(look.accent, 0.35)}`, borderRadius: 999, padding: '1px 9px', fontSize: '0.92em' }}>{item}</span>
    ))}
  </div>
);

/**
 * Resume layouts drawn from one data set. Real text (not images) and standard headings, so every template prints to a
 * searchable PDF. Single-column templates are the safest for applicant tracking systems; the side-column ones are designs
 * for people to read. Everything sits inside the page margins so the printed page matches the preview.
 */
export const ResumePreview: React.FC<{ resume: ResumeData; style: ResumeStyle; decorative?: boolean }> = ({ resume, style, decorative = false }) => {
  const spec = getTemplate(style.template);
  const accent = spec.colour ? style.accent : INK;
  const look: Look = { spec, accent, deep: shade(accent, -0.4), h1: decorative ? 'div' : 'h1', h2: decorative ? 'div' : 'h2' };
  const contact = [resume.email, resume.phone, resume.location, ...splitLines(resume.links)].filter(Boolean);
  const skills = splitSkills(resume.skills);
  const certs = splitLines(resume.certifications);
  const jobs = resume.experience.filter((item) => item.role.trim() || item.company.trim() || item.bullets.trim());
  const schools = resume.education.filter((item) => item.degree.trim() || item.school.trim());
  const projects = resume.projects.filter((item) => item.name.trim() || item.details.trim());
  const name = resume.name || 'Your Name';
  const hasSidebar = Boolean(spec.sidebar);

  const summary = resume.summary.trim() && <Section title="Summary" look={look}><p style={{ margin: 0 }}>{resume.summary.trim()}</p></Section>;

  const experience = jobs.length > 0 && (
    <Section title="Experience" look={look}>
      <div style={spec.timeline ? { borderLeft: `2px solid ${tint(accent, 0.4)}`, marginLeft: 4, paddingLeft: 14 } : undefined}>
        {jobs.map((item) => (
          <div key={item.id} style={{ marginBottom: 8, breakInside: 'avoid', position: 'relative' }}>
            {spec.timeline && <span aria-hidden="true" style={{ position: 'absolute', left: -21, top: 4, width: 10, height: 10, borderRadius: '50%', background: accent, border: '2px solid #fff' }} />}
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
              <strong>{[item.role, item.company].filter((part) => part.trim()).join(', ')}</strong>
              <span style={{ whiteSpace: 'nowrap', color: MUTED }}>{formatRange(item.start, item.end, item.current)}</span>
            </div>
            {item.location.trim() && <div style={{ fontStyle: 'italic', color: MUTED }}>{item.location}</div>}
            <Bullets lines={splitLines(item.bullets)} />
          </div>
        ))}
      </div>
    </Section>
  );

  const projectBlock = projects.length > 0 && (
    <Section title="Projects" look={look}>
      {projects.map((item) => (
        <div key={item.id} style={{ marginBottom: 8, breakInside: 'avoid' }}>
          <strong>{item.name}</strong>{item.link.trim() ? <span> ({item.link.trim()})</span> : null}
          <Bullets lines={splitLines(item.details)} />
        </div>
      ))}
    </Section>
  );

  const educationBlock = schools.length > 0 && (
    <Section title="Education" look={look}>
      {schools.map((item) => (
        <div key={item.id} style={{ marginBottom: 6, breakInside: 'avoid' }}>
          <div style={{ display: 'flex', justifyContent: hasSidebar ? 'flex-start' : 'space-between', flexDirection: hasSidebar ? 'column' : 'row', gap: hasSidebar ? 0 : 12 }}>
            <strong>{[item.degree, item.school].filter((part) => part.trim()).join(', ')}</strong>
            <span style={{ whiteSpace: hasSidebar ? 'normal' : 'nowrap', color: MUTED }}>{formatRange(item.start, item.end, false)}</span>
          </div>
          {item.location.trim() && <div style={{ fontStyle: 'italic', color: MUTED }}>{item.location}</div>}
          {item.details.trim() && <div>{item.details.trim()}</div>}
        </div>
      ))}
    </Section>
  );

  const skillsBlock = skills.length > 0 && (
    <Section title="Skills" look={look}>
      {spec.chips ? <Chips items={skills} look={look} /> : <p style={{ margin: 0 }}>{skills.join(', ')}</p>}
    </Section>
  );

  const certBlock = certs.length > 0 && <Section title="Certifications" look={look}><Bullets lines={certs} /></Section>;

  const wrapper: React.CSSProperties = {
    fontFamily: FONT_STACKS[spec.font], fontSize: FONT[style.size], lineHeight: 1.4, color: INK, background: '#fff', padding: '14mm 16mm', boxSizing: 'border-box',
  };

  // Side-column layouts: contact, skills, certifications and education go in the column; the story goes in the main area.
  if (hasSidebar) {
    const gradient = `linear-gradient(180deg, ${accent}, ${look.deep})`;
    const dark = spec.sidebar === 'gradient';
    const sideText = dark ? readableOnGradient(accent, look.deep) : INK;
    const sideHeading = dark ? sideText : accent;
    return (
      <div style={wrapper}>
        <div style={{ display: 'grid', gridTemplateColumns: '31% minmax(0, 1fr)', gap: 20, alignItems: 'stretch' }}>
          <aside style={{ background: dark ? gradient : tint(accent, 0.1), color: sideText, borderRadius: 10, padding: '16px 14px', fontSize: '0.95em' }}>
            <look.h2 style={{ margin: '0 0 6px', fontSize: '1.05em', letterSpacing: '0.08em', textTransform: 'uppercase', color: sideHeading, borderBottom: `1px solid ${dark ? 'rgba(255,255,255,0.4)' : tint(accent, 0.4)}`, paddingBottom: 2 }}>Contact</look.h2>
            {contact.length > 0 ? contact.map((line) => <p key={line} style={{ margin: '0 0 3px', overflowWrap: 'anywhere' }}>{line}</p>) : <p style={{ margin: 0 }}>—</p>}
            {skills.length > 0 && (
              <section style={{ marginTop: 14 }}>
                <look.h2 style={{ margin: '0 0 6px', fontSize: '1.05em', letterSpacing: '0.08em', textTransform: 'uppercase', color: sideHeading, borderBottom: `1px solid ${dark ? 'rgba(255,255,255,0.4)' : tint(accent, 0.4)}`, paddingBottom: 2 }}>Skills</look.h2>
                <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>{skills.map((item, index) => <li key={`${item}-${index}`} style={{ marginBottom: 2 }}>{item}</li>)}</ul>
              </section>
            )}
            {certs.length > 0 && (
              <section style={{ marginTop: 14 }}>
                <look.h2 style={{ margin: '0 0 6px', fontSize: '1.05em', letterSpacing: '0.08em', textTransform: 'uppercase', color: sideHeading, borderBottom: `1px solid ${dark ? 'rgba(255,255,255,0.4)' : tint(accent, 0.4)}`, paddingBottom: 2 }}>Certifications</look.h2>
                <Bullets lines={certs} color={sideText} />
              </section>
            )}
          </aside>
          <div>
            <header>
              <look.h1 style={{ fontSize: '2em', lineHeight: 1.15, fontWeight: 700, margin: 0, color: accent }}>{name}</look.h1>
              {resume.headline && <p style={{ margin: '2px 0 0', fontSize: '1.1em', color: MUTED }}>{resume.headline}</p>}
            </header>
            {summary}
            {experience}
            {projectBlock}
            {educationBlock}
          </div>
        </div>
      </div>
    );
  }

  // Single-column layouts: only the header differs between them.
  const bandColours = spec.header === 'gradient' ? `linear-gradient(90deg, ${accent}, ${look.deep})` : accent;
  const bandText = spec.header === 'gradient' ? readableOnGradient(accent, look.deep) : readableOn(accent);
  let header: React.ReactNode;
  if (spec.header === 'band' || spec.header === 'gradient') {
    header = (
      <header style={{ background: bandColours, color: bandText, borderRadius: 10, padding: '16px 20px' }}>
        <look.h1 style={{ fontSize: '2em', lineHeight: 1.15, fontWeight: 700, margin: 0 }}>{name}</look.h1>
        {resume.headline && <p style={{ margin: '2px 0 0', fontSize: '1.1em', opacity: 0.95 }}>{resume.headline}</p>}
        {contact.length > 0 && <p style={{ margin: '6px 0 0', fontSize: '0.95em' }}>{contact.join('  |  ')}</p>}
      </header>
    );
  } else if (spec.header === 'split') {
    header = (
      <header style={{ display: 'flex', justifyContent: 'space-between', gap: 20, alignItems: 'flex-end', borderTop: `6px solid ${accent}`, borderBottom: '1px solid #cfcfcf', paddingTop: 10, paddingBottom: 8 }}>
        <div>
          <look.h1 style={{ fontSize: '2em', lineHeight: 1.15, fontWeight: 700, margin: 0, color: accent }}>{name}</look.h1>
          {resume.headline && <p style={{ margin: '2px 0 0', fontSize: '1.1em', color: MUTED }}>{resume.headline}</p>}
        </div>
        <div style={{ textAlign: 'right', fontSize: '0.95em' }}>{contact.map((line) => <div key={line}>{line}</div>)}</div>
      </header>
    );
  } else {
    const centre = spec.header === 'center';
    header = (
      <header style={{ textAlign: centre ? 'center' : 'left' }}>
        <look.h1 style={{ fontSize: '2em', lineHeight: 1.15, fontWeight: 700, margin: 0, color: spec.colour ? accent : INK, letterSpacing: spec.font === 'mono' ? 0 : undefined }}>{name}</look.h1>
        {resume.headline && <p style={{ margin: '2px 0 0', fontSize: '1.1em' }}>{resume.headline}</p>}
        {contact.length > 0 && <p style={{ margin: '4px 0 0', color: spec.headings === 'plain-caps' ? MUTED : undefined }}>{contact.join('  |  ')}</p>}
      </header>
    );
  }

  return (
    <div style={wrapper}>
      {header}
      {summary}
      {experience}
      {projectBlock}
      {educationBlock}
      {skillsBlock}
      {certBlock}
    </div>
  );
};

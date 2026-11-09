import React from 'react';
import { formatRange, splitLines, splitSkills, type ResumeData } from '../../../lib/careers/resume';

export type ResumeTemplate = 'classic' | 'modern';
export interface ResumeStyle { template: ResumeTemplate; accent: string; size: 'compact' | 'normal' | 'large'; paper: 'a4' | 'letter' }

export const PAPER = {
  a4: { width: 794, height: 1123, label: 'A4' },
  letter: { width: 816, height: 1056, label: 'US Letter' },
} as const;

const FONT = { compact: 12, normal: 13, large: 14 } as const;

const Section: React.FC<{ title: string; style: ResumeStyle; children: React.ReactNode }> = ({ title, style, children }) => (
  <section style={{ marginTop: 14 }}>
    <h2
      style={style.template === 'modern'
        ? { color: style.accent, fontSize: '1.05em', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', borderBottom: `2px solid ${style.accent}`, paddingBottom: 2, marginBottom: 6 }
        : { fontSize: '1.05em', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', borderBottom: '1px solid #444', paddingBottom: 2, marginBottom: 6 }}
    >
      {title}
    </h2>
    {children}
  </section>
);

const Bullets: React.FC<{ lines: string[] }> = ({ lines }) => (
  lines.length === 0 ? null : (
    <ul style={{ margin: '3px 0 0 18px', padding: 0, listStyle: 'disc' }}>
      {lines.map((line, index) => <li key={index} style={{ marginBottom: 2 }}>{line}</li>)}
    </ul>
  )
);

/** Single-column, plain-text-friendly resume layout. Real text (not images), standard headings and no tables, so it prints to a searchable PDF. */
export const ResumePreview: React.FC<{ resume: ResumeData; style: ResumeStyle }> = ({ resume, style }) => {
  const contact = [resume.email, resume.phone, resume.location, ...splitLines(resume.links)].filter(Boolean);
  const skills = splitSkills(resume.skills);
  const certs = splitLines(resume.certifications);
  const jobs = resume.experience.filter((item) => item.role.trim() || item.company.trim() || item.bullets.trim());
  const schools = resume.education.filter((item) => item.degree.trim() || item.school.trim());
  const projects = resume.projects.filter((item) => item.name.trim() || item.details.trim());
  const font = style.template === 'classic' ? 'Georgia, "Times New Roman", serif' : 'Arial, Helvetica, sans-serif';

  return (
    <div style={{ fontFamily: font, fontSize: FONT[style.size], lineHeight: 1.4, color: '#111', background: '#fff', padding: '14mm 16mm', boxSizing: 'border-box' }}>
      <header style={{ textAlign: style.template === 'classic' ? 'center' : 'left' }}>
        <h1 style={{ fontSize: '2em', lineHeight: 1.15, fontWeight: 700, margin: 0, color: style.template === 'modern' ? style.accent : '#111' }}>{resume.name || 'Your Name'}</h1>
        {resume.headline && <p style={{ margin: '2px 0 0', fontSize: '1.1em' }}>{resume.headline}</p>}
        {contact.length > 0 && <p style={{ margin: '4px 0 0' }}>{contact.join('  |  ')}</p>}
      </header>

      {resume.summary.trim() && <Section title="Summary" style={style}><p style={{ margin: 0 }}>{resume.summary.trim()}</p></Section>}

      {jobs.length > 0 && (
        <Section title="Experience" style={style}>
          {jobs.map((item) => (
            <div key={item.id} style={{ marginBottom: 8, breakInside: 'avoid' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                <strong>{[item.role, item.company].filter((part) => part.trim()).join(', ')}</strong>
                <span style={{ whiteSpace: 'nowrap' }}>{formatRange(item.start, item.end, item.current)}</span>
              </div>
              {item.location.trim() && <div style={{ fontStyle: 'italic' }}>{item.location}</div>}
              <Bullets lines={splitLines(item.bullets)} />
            </div>
          ))}
        </Section>
      )}

      {projects.length > 0 && (
        <Section title="Projects" style={style}>
          {projects.map((item) => (
            <div key={item.id} style={{ marginBottom: 8, breakInside: 'avoid' }}>
              <strong>{item.name}</strong>{item.link.trim() ? <span> ({item.link.trim()})</span> : null}
              <Bullets lines={splitLines(item.details)} />
            </div>
          ))}
        </Section>
      )}

      {schools.length > 0 && (
        <Section title="Education" style={style}>
          {schools.map((item) => (
            <div key={item.id} style={{ marginBottom: 6, breakInside: 'avoid' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                <strong>{[item.degree, item.school].filter((part) => part.trim()).join(', ')}</strong>
                <span style={{ whiteSpace: 'nowrap' }}>{formatRange(item.start, item.end, false)}</span>
              </div>
              {item.location.trim() && <div style={{ fontStyle: 'italic' }}>{item.location}</div>}
              {item.details.trim() && <div>{item.details.trim()}</div>}
            </div>
          ))}
        </Section>
      )}

      {skills.length > 0 && <Section title="Skills" style={style}><p style={{ margin: 0 }}>{skills.join(', ')}</p></Section>}
      {certs.length > 0 && <Section title="Certifications" style={style}><Bullets lines={certs} /></Section>}
    </div>
  );
};

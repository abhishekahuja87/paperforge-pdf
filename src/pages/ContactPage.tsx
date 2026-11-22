import React, { useState } from 'react';
import { Send, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import { InfoPageLayout } from '../components/layout/InfoPageLayout';
import { Trans, useTranslation } from 'react-i18next';
import { siteConfig } from '../config/site';

export const ContactPage: React.FC = () => {
  const { t, i18n } = useTranslation();
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [errorKey, setErrorKey] = useState<'failed' | 'networkError' | null>(null);
  const [params] = useSearchParams();
  // Opened from a tool page: "Report a problem or suggest an idea" passes the tool's name and address.
  const aboutTool = (params.get('tool') ?? '').replace(/[\u0000-\u001f<>]/g, '').trim().slice(0, 80);
  const aboutPathRaw = params.get('path') ?? '';
  const aboutPath = /^\/[A-Za-z0-9\-_/]{0,80}$/.test(aboutPathRaw) ? aboutPathRaw : '';
  const [kind, setKind] = useState<'problem' | 'idea'>('problem');

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setStatus('loading');
    setErrorMessage('');
    setErrorKey(null);

    const form = e.currentTarget;
    const formData = new FormData(form);
    formData.append('access_key', 'e220cf89-97f3-4f17-9067-c171d9a92c22');
    formData.append('subject', aboutTool ? `${kind === 'problem' ? 'Problem' : 'Idea'} about ${aboutTool} - MyDailyUtils` : 'New Contact Message - MyDailyUtils');
    if (aboutTool) { formData.append('tool', aboutTool); formData.append('page', aboutPath); formData.append('kind', kind); }

    try {
      const response = await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        body: formData,
      });
      const data = await response.json();
      if (data.success) {
        setStatus('success');
        form.reset();
      } else {
        setStatus('error');
        if (typeof data.message === 'string' && data.message) {
          setErrorMessage(data.message);
        } else {
          setErrorKey('failed');
        }
      }
    } catch {
      setStatus('error');
      setErrorKey('networkError');
    }
  };

  return (
    <InfoPageLayout
        title={aboutTool ? t('contactPage.toolTitle', { defaultValue: 'Report a problem or suggest an idea' }) : t('contactPage.title')}
        subtitle={aboutTool ? t('contactPage.toolSubtitle', { defaultValue: 'About {{tool}}. Tell us what went wrong, or what would make it better.', tool: aboutTool }) : t('contactPage.subtitle')}
        noindex={Boolean(aboutTool)}
        description={t('contactPage.description')}
        contentLanguage={i18n.language}
      >
        {aboutTool ? (
          <section className="rounded-xl border border-orange-200 bg-orange-50 p-4">
            <h2 className="text-sm font-bold text-orange-900">{aboutTool}</h2>
            <p className="mt-1 text-xs leading-5 text-stone-700">
              {t('contactPage.toolHelp', { defaultValue: 'Say what happened and what you expected. Please do not paste private details. We only get what you type here, never your files.' })}
              {aboutPath && <> <Link to={aboutPath} className="font-semibold text-indigo-700 underline">{t('contactPage.backToTool', { defaultValue: 'Back to the tool' })}</Link></>}
            </p>
          </section>
        ) : (
          <section className="rounded-xl border border-orange-200 bg-orange-50 p-4">
            <h2 className="text-sm font-bold text-orange-900">{t('contactPage.requestTitle')}</h2>
            <p className="mt-1 text-xs leading-5 text-stone-700">{t('contactPage.requestDescription')}</p>
          </section>
        )}
        <p className="mb-6 rounded-xl border border-indigo-100 bg-indigo-50/70 px-4 py-3 text-xs leading-relaxed text-slate-600">
          <Trans i18nKey="contactPage.disclosure" components={{ privacy: <Link to="/privacy" className="font-semibold text-indigo-700 underline" /> }} />
        </p>
        <p className="text-xs leading-5 text-slate-600">
          {siteConfig.contactEmail && (
            <>
              <strong>{t('contactPage.emailLabel')}:</strong>{' '}
              <a href={`mailto:${siteConfig.contactEmail}`} className="font-semibold text-indigo-700 underline">{siteConfig.contactEmail}</a>
              {' · '}
            </>
          )}
          {t('contactPage.basedIn', { location: siteConfig.location })}
        </p>

        {status === 'success' ? (
          <div role="status" aria-live="polite" className="p-6 bg-emerald-50 border border-emerald-200 rounded-xl text-center space-y-2">
            <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
            <h2 className="text-base font-semibold text-emerald-900">{t('contactPage.sent')}</h2>
            <p className="text-xs text-emerald-700">
              {t('contactPage.thanks')}
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <input type="checkbox" name="botcheck" className="hidden" style={{ display: 'none' }} />

            {aboutTool && (
              <fieldset>
                <legend className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-700">{t('contactPage.kindLabel', { defaultValue: 'What is it about?' })}</legend>
                <div className="flex flex-wrap gap-2" role="radiogroup">
                  {([['problem', t('contactPage.kindProblem', { defaultValue: 'Something is not working' })], ['idea', t('contactPage.kindIdea', { defaultValue: 'I have an idea' })]] as const).map(([id, label]) => (
                    <label key={id} className={`flex min-h-10 cursor-pointer items-center rounded-full border px-4 text-sm font-semibold ${kind === id ? 'border-orange-500 bg-orange-50 text-orange-900' : 'border-slate-200 bg-white text-slate-700'}`}>
                      <input type="radio" name="kind-choice" className="sr-only" checked={kind === id} onChange={() => setKind(id)} />{label}
                    </label>
                  ))}
                </div>
              </fieldset>
            )}

            <div>
              <label htmlFor="contact-name" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                {t('contactPage.name')}
              </label>
              <input
                id="contact-name"
                type="text"
                name="name"
                required
                placeholder={t('contactPage.name')}
                className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label htmlFor="contact-email" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                {t('contactPage.email')}
              </label>
              <input
                id="contact-email"
                type="email"
                name="email"
                required
                placeholder="you@example.com"
                className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label htmlFor="contact-message" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                {t('contactPage.message')}
              </label>
              <textarea
                id="contact-message"
                name="message"
                rows={4}
                required
                placeholder={aboutTool ? (kind === 'problem' ? t('contactPage.placeholderProblem', { defaultValue: 'What did you do, what happened, and what did you expect?' }) : t('contactPage.placeholderIdea', { defaultValue: 'What would make this tool better for you?' })) : t('contactPage.placeholder')}
                className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {status === 'error' && (
              <div role="alert" className="flex items-center space-x-2 p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span lang={errorKey ? i18n.language : undefined}>{errorKey ? t(`contactPage.${errorKey}`) : errorMessage}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={status === 'loading'}
              className="w-full py-3 px-5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-semibold text-sm rounded-xl shadow-sm transition flex items-center justify-center space-x-2 cursor-pointer"
            >
              {status === 'loading' ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>{t('contactPage.sending')}</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>{t('contactPage.send')}</span>
                </>
              )}
            </button>
          </form>
        )}
    </InfoPageLayout>
  );
};

export default ContactPage;
import React, { useState } from 'react';
import { Mail, Send, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

export const ContactPage: React.FC = () => {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setStatus('loading');
    setErrorMessage('');

    const form = e.currentTarget;
    const formData = new FormData(form);
    formData.append('access_key', 'e22e5114-1e05-4c07-b371-331046757b32'); // standard relay token
    formData.append('subject', 'New Contact Message - MyDailyUtils');

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
        setErrorMessage(data.message || 'Submission failed. Please try again.');
      }
    } catch {
      setStatus('error');
      setErrorMessage('Network connection error. Please try again later.');
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-sm">
        <div className="flex items-center space-x-3 mb-6">
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
            <Mail className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Contact Us</h1>
            <p className="text-sm text-slate-500">
              Have questions, feedback, or need support? Send us a note.
            </p>
          </div>
        </div>

        {status === 'success' ? (
          <div className="p-6 bg-emerald-50 border border-emerald-200 rounded-xl text-center space-y-2">
            <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
            <h2 className="text-base font-semibold text-emerald-900">Message Sent</h2>
            <p className="text-xs text-emerald-700">
              Thank you for reaching out. We will review your message shortly.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <input type="checkbox" name="botcheck" className="hidden" style={{ display: 'none' }} />

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Your Name
              </label>
              <input
                type="text"
                name="name"
                required
                placeholder="Your Name"
                className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Your Email Address
              </label>
              <input
                type="email"
                name="email"
                required
                placeholder="you@example.com"
                className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Message
              </label>
              <textarea
                name="message"
                rows={4}
                required
                placeholder="How can we help?"
                className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {status === 'error' && (
              <div className="flex items-center space-x-2 p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
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
                  <span>Sending...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Send Message</span>
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default ContactPage;
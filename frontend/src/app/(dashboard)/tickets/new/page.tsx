'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import api from '@/lib/api';
import { CATEGORIES, PRIORITIES, Ticket, label } from '@/lib/ticket-types';

type Errors = Partial<Record<'title' | 'description' | 'category' | 'priority' | 'department' | 'urgency' | 'impact', string>>;

export default function NewTicketPage() {
  const router = useRouter();
  const [form, setForm] = useState({ title: '', description: '', category: 'hardware', priority: 'medium', urgency: 'medium', impact: 'medium', department: '' });
  const [errors, setErrors] = useState<Errors>({});
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm({ ...form, [k]: e.target.value });

  const validate = (): Errors => {
    const e: Errors = {};
    if (!form.title.trim()) e.title = 'Enter a short title.';
    else if (form.title.length > 150) e.title = 'Title must be 150 characters or fewer.';
    if (form.description.trim().length < 10) e.description = 'Describe the fault in at least 10 characters.';
    else if (form.description.length > 5000) e.description = 'Description must be 5000 characters or fewer.';
    return e;
  };

  const submit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    const v = validate();
    setErrors(v);
    setFormError('');
    if (Object.keys(v).length) return;

    setSubmitting(true);
    try {
      const payload = { ...form, department: form.department.trim() || undefined };
      const { data } = await api.post<{ data?: Ticket } & Partial<Ticket>>('/tickets', payload);
      const created = data.data ?? data;
      router.push(`/tickets/${created.id}`);
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.status === 422) {
        const server = err.response.data?.errors ?? {};
        const mapped: Errors = {};
        for (const k of Object.keys(server)) mapped[k as keyof Errors] = server[k][0];
        setErrors(mapped);
      } else {
        setFormError('Could not create the ticket. Try again in a moment.');
      }
      setSubmitting(false);
    }
  };

  const field = 'mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-green-700 focus:outline-none focus:ring-1 focus:ring-green-700';
  const err = (m?: string) => m && <p className="mt-1 text-sm text-red-600">{m}</p>;

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="text-2xl font-semibold text-gray-900">Report a fault</h1>
      <p className="mt-1 text-sm text-gray-500">The ICT team will pick this up and update you here.</p>

      <form onSubmit={submit} noValidate className="mt-6 space-y-5">
        {formError && <p role="alert" className="rounded-md bg-red-50 p-3 text-sm text-red-700">{formError}</p>}

        <div>
          <label htmlFor="title" className="text-sm font-medium text-gray-800">Title</label>
          <input id="title" value={form.title} onChange={set('title')} maxLength={150} className={field} placeholder="e.g. Finance printer jams on every print" />
          {err(errors.title)}
        </div>

        <div>
          <label htmlFor="description" className="text-sm font-medium text-gray-800">Description</label>
          <textarea id="description" rows={6} value={form.description} onChange={set('description')} className={field} placeholder="What happens, where, and since when?" />
          <div className="flex justify-between">
            {err(errors.description) ?? <span />}
            <span className="mt-1 text-xs text-gray-400">{form.description.length}/5000</span>
          </div>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label htmlFor="category" className="text-sm font-medium text-gray-800">Category</label>
            <select id="category" value={form.category} onChange={set('category')} className={field}>
              {CATEGORIES.map((c) => <option key={c} value={c}>{label(c)}</option>)}
            </select>
            {err(errors.category)}
          </div>
          <div>
            <label htmlFor="urgency" className="text-sm font-medium text-gray-800">Urgency</label>
            <select id="urgency" value={form.urgency} onChange={set('urgency')} className={field}>
              {['low', 'medium', 'high'].map((value) => <option key={value} value={value}>{label(value)}</option>)}
            </select>
            {err(errors.urgency)}
          </div>
          <div>
            <label htmlFor="impact" className="text-sm font-medium text-gray-800">Impact</label>
            <select id="impact" value={form.impact} onChange={set('impact')} className={field}>
              {['low', 'medium', 'high'].map((value) => <option key={value} value={value}>{label(value)}</option>)}
            </select>
            {err(errors.impact)}
          </div>
        </div>

        <div>
          <label htmlFor="department" className="text-sm font-medium text-gray-800">Department <span className="font-normal text-gray-400">(optional, defaults to yours)</span></label>
          <input id="department" value={form.department} onChange={set('department')} className={field} />
          {err(errors.department)}
        </div>

        <div className="flex gap-3">
          <button type="submit" disabled={submitting} className="rounded-md bg-green-800 px-5 py-2 text-sm font-medium text-white hover:bg-green-900 disabled:opacity-60">
            {submitting ? 'Submitting…' : 'Submit ticket'}
          </button>
          <button type="button" onClick={() => router.back()} className="rounded-md border border-gray-300 px-5 py-2 text-sm text-gray-700 hover:bg-gray-50">Cancel</button>
        </div>
      </form>
    </div>
  );
}

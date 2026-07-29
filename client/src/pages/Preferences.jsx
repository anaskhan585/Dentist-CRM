import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { get, patch } from '../lib/api.js';
import { useAuth } from '../lib/auth.jsx';
import { useSaveMutation } from '../lib/useSaveMutation.js';
import { useToast } from '../lib/toast.jsx';
import { ROLES } from '../lib/constants.js';
import { Avatar, Badge, Button, Card, CardHead, Field, Input, PageHead, Select, Switch, Textarea } from '../components/ui/index.jsx';
import { IconCheck, IconLock } from '../lib/icons.jsx';

const SECTIONS = [
  { key: 'clinic', label: 'Clinic details' },
  { key: 'scheduling', label: 'Scheduling' },
  { key: 'notifications', label: 'Notifications' },
  { key: 'billing', label: 'Billing' },
  { key: 'account', label: 'My account' },
];

export default function Preferences() {
  const { user, isAdmin } = useAuth();
  const toast = useToast();
  const [section, setSection] = useState('clinic');
  const [form, setForm] = useState(null);

  const { data: settings } = useQuery({ queryKey: ['settings'], queryFn: () => get('/settings') });

  useEffect(() => {
    if (settings) setForm(structuredClone(settings));
  }, [settings]);

  const save = useSaveMutation({
    mutationFn: (payload) => patch('/settings', payload),
    invalidate: ['settings'],
    successMessage: 'Preferences saved',
  });

  const password = useSaveMutation({
    mutationFn: (payload) => patch('/auth/password', payload),
    successMessage: 'Password changed',
  });

  if (!form) return null;

  const setField = (group, key) => (event) =>
    setForm((current) => ({ ...current, [group]: { ...current[group], [key]: event.target.value } }));

  const setNumber = (group, key) => (event) =>
    setForm((current) => ({ ...current, [group]: { ...current[group], [key]: Number(event.target.value) } }));

  const setToggle = (group, key) => (value) =>
    setForm((current) => ({ ...current, [group]: { ...current[group], [key]: value } }));

  const submit = (groups) => {
    if (!isAdmin) {
      toast.error('Only an administrator can change practice settings');
      return;
    }
    save.mutate(Object.fromEntries(groups.map((group) => [group, form[group]])));
  };

  return (
    <>
      <PageHead title="Preferences" sub="How this practice runs — scheduling, reminders, billing and your own account" />

      <div className="prefs">
        <nav className="prefs__nav" aria-label="Preference sections">
          {SECTIONS.map((item) => (
            <button key={item.key} aria-current={section === item.key} onClick={() => setSection(item.key)}>
              {item.label}
            </button>
          ))}
          {!isAdmin && (
            <p className="prefs__note">
              <IconLock /> Practice settings are read-only for your role.
            </p>
          )}
        </nav>

        <div className="prefs__panel">
          {section === 'clinic' && (
            <Card>
              <CardHead title="Clinic details" sub="Printed on invoices and used in patient messages" />
              <div className="card__body">
                <div className="form-grid">
                  <Field label="Practice name" className="span-2">
                    <Input value={form.clinic.name} onChange={setField('clinic', 'name')} disabled={!isAdmin} />
                  </Field>
                  <Field label="Tagline" className="span-2">
                    <Input value={form.clinic.tagline} onChange={setField('clinic', 'tagline')} disabled={!isAdmin} />
                  </Field>
                  <Field label="Phone">
                    <Input value={form.clinic.phone} onChange={setField('clinic', 'phone')} disabled={!isAdmin} />
                  </Field>
                  <Field label="Email">
                    <Input type="email" value={form.clinic.email} onChange={setField('clinic', 'email')} disabled={!isAdmin} />
                  </Field>
                  <Field label="Address" className="span-2">
                    <Textarea value={form.clinic.address} onChange={setField('clinic', 'address')} style={{ minHeight: 56 }} disabled={!isAdmin} />
                  </Field>
                  <Field label="Registration number">
                    <Input value={form.clinic.registrationNo} onChange={setField('clinic', 'registrationNo')} disabled={!isAdmin} />
                  </Field>
                  <Field label="Currency symbol">
                    <Input value={form.locale.currencySymbol} onChange={setField('locale', 'currencySymbol')} disabled={!isAdmin} />
                  </Field>
                </div>
              </div>
              <div className="card__foot" style={{ textAlign: 'right' }}>
                <Button variant="primary" icon={IconCheck} loading={save.isPending} onClick={() => submit(['clinic', 'locale'])} disabled={!isAdmin}>
                  Save changes
                </Button>
              </div>
            </Card>
          )}

          {section === 'scheduling' && (
            <Card>
              <CardHead title="Scheduling" sub="Controls the diary grid and how appointments are spaced" />
              <div className="card__body">
                <div className="form-grid">
                  <Field label="Day starts">
                    <Input type="time" value={form.scheduling.dayStart} onChange={setField('scheduling', 'dayStart')} disabled={!isAdmin} />
                  </Field>
                  <Field label="Day ends">
                    <Input type="time" value={form.scheduling.dayEnd} onChange={setField('scheduling', 'dayEnd')} disabled={!isAdmin} />
                  </Field>
                  <Field label="Slot length" hint="Minutes per booking slot">
                    <Select value={form.scheduling.slotMinutes} onChange={setNumber('scheduling', 'slotMinutes')} disabled={!isAdmin}>
                      {[10, 15, 20, 30].map((value) => (
                        <option key={value} value={value}>
                          {value} minutes
                        </option>
                      ))}
                    </Select>
                  </Field>
                  <Field label="Turnaround buffer" hint="Minutes between patients">
                    <Input type="number" min="0" max="60" value={form.scheduling.bufferMinutes} onChange={setNumber('scheduling', 'bufferMinutes')} disabled={!isAdmin} />
                  </Field>
                  <Field label="Chairs" hint="Comma separated — each becomes a column in the day view" className="span-2">
                    <Input
                      value={form.scheduling.chairs.join(', ')}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          scheduling: {
                            ...current.scheduling,
                            chairs: event.target.value.split(',').map((chair) => chair.trim()).filter(Boolean),
                          },
                        }))
                      }
                      disabled={!isAdmin}
                    />
                  </Field>
                </div>
              </div>
              <div className="card__foot" style={{ textAlign: 'right' }}>
                <Button variant="primary" icon={IconCheck} loading={save.isPending} onClick={() => submit(['scheduling'])} disabled={!isAdmin}>
                  Save changes
                </Button>
              </div>
            </Card>
          )}

          {section === 'notifications' && (
            <Card>
              <CardHead title="Notifications" sub="What the practice sends automatically" />
              <div className="card__body">
                <Switch
                  title="Appointment reminders"
                  description="Message patients before their visit"
                  checked={form.notifications.appointmentReminders}
                  onChange={setToggle('notifications', 'appointmentReminders')}
                />
                <Switch
                  title="Recall campaigns"
                  description="Nudge patients due for a six-month check-up"
                  checked={form.notifications.recallCampaigns}
                  onChange={setToggle('notifications', 'recallCampaigns')}
                />
                <Switch
                  title="Lab due alerts"
                  description="Flag lab cases as their due date approaches"
                  checked={form.notifications.labDueAlerts}
                  onChange={setToggle('notifications', 'labDueAlerts')}
                />
                <Switch
                  title="Low stock alerts"
                  description="Warn when consumables run low"
                  checked={form.notifications.lowStockAlerts}
                  onChange={setToggle('notifications', 'lowStockAlerts')}
                />

                <div className="form-grid" style={{ marginTop: 'var(--sp-5)' }}>
                  <Field label="Preferred channel">
                    <Select value={form.notifications.channel} onChange={setField('notifications', 'channel')} disabled={!isAdmin}>
                      <option value="whatsapp">WhatsApp</option>
                      <option value="sms">SMS</option>
                      <option value="email">Email</option>
                    </Select>
                  </Field>
                  <Field label="Reminder lead time" hint="Hours before the appointment">
                    <Input type="number" min="1" max="168" value={form.notifications.reminderLeadHours} onChange={setNumber('notifications', 'reminderLeadHours')} disabled={!isAdmin} />
                  </Field>
                </div>
              </div>
              <div className="card__foot" style={{ textAlign: 'right' }}>
                <Button variant="primary" icon={IconCheck} loading={save.isPending} onClick={() => submit(['notifications'])} disabled={!isAdmin}>
                  Save changes
                </Button>
              </div>
            </Card>
          )}

          {section === 'billing' && (
            <Card>
              <CardHead title="Billing" sub="Invoice numbering, tax and payment terms" />
              <div className="card__body">
                <div className="form-grid">
                  <Field label="Invoice prefix" hint="e.g. INV-2025-0001">
                    <Input value={form.billing.invoicePrefix} onChange={setField('billing', 'invoicePrefix')} disabled={!isAdmin} />
                  </Field>
                  <Field label="Tax rate" hint="Percent applied to invoice totals">
                    <Input type="number" min="0" max="100" step="0.5" value={form.billing.taxRate} onChange={setNumber('billing', 'taxRate')} disabled={!isAdmin} />
                  </Field>
                  <Field label="Payment terms" hint="Days until an invoice is due">
                    <Input type="number" min="0" max="180" value={form.billing.paymentTermsDays} onChange={setNumber('billing', 'paymentTermsDays')} disabled={!isAdmin} />
                  </Field>
                  <Field label="Invoice footer" className="span-2">
                    <Textarea value={form.billing.footerNote} onChange={setField('billing', 'footerNote')} style={{ minHeight: 56 }} disabled={!isAdmin} />
                  </Field>
                </div>
              </div>
              <div className="card__foot" style={{ textAlign: 'right' }}>
                <Button variant="primary" icon={IconCheck} loading={save.isPending} onClick={() => submit(['billing'])} disabled={!isAdmin}>
                  Save changes
                </Button>
              </div>
            </Card>
          )}

          {section === 'account' && (
            <Card>
              <CardHead title="My account" sub="Your profile and sign-in" />
              <div className="card__body">
                <div className="account-head">
                  <Avatar name={user?.name} colour={user?.colour} initials={user?.avatarInitials} size="xl" />
                  <div>
                    <strong style={{ display: 'block', fontSize: 'var(--text-lg)' }}>{user?.name}</strong>
                    <p className="muted">{user?.email}</p>
                    <Badge tone={ROLES[user?.role]?.tone}>{ROLES[user?.role]?.label}</Badge>
                  </div>
                </div>

                <form
                  className="form-grid"
                  style={{ marginTop: 'var(--sp-6)' }}
                  onSubmit={(event) => {
                    event.preventDefault();
                    const { currentPassword, newPassword, confirmPassword } = event.target.elements;
                    if (newPassword.value !== confirmPassword.value) {
                      toast.error('The new passwords do not match');
                      return;
                    }
                    password.mutate(
                      { currentPassword: currentPassword.value, newPassword: newPassword.value },
                      { onSuccess: () => event.target.reset() }
                    );
                  }}
                >
                  <Field label="Current password" className="span-2" error={password.fieldErrors.currentPassword}>
                    <Input name="currentPassword" type="password" autoComplete="current-password" required />
                  </Field>
                  <Field label="New password" hint="At least 8 characters" error={password.fieldErrors.newPassword}>
                    <Input name="newPassword" type="password" autoComplete="new-password" minLength={8} required />
                  </Field>
                  <Field label="Confirm new password">
                    <Input name="confirmPassword" type="password" autoComplete="new-password" minLength={8} required />
                  </Field>
                  <div className="span-2" style={{ textAlign: 'right' }}>
                    <Button variant="primary" type="submit" loading={password.isPending}>
                      Change password
                    </Button>
                  </div>
                </form>
              </div>
            </Card>
          )}
        </div>
      </div>
    </>
  );
}

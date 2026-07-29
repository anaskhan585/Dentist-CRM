import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getList, patch, post } from '../lib/api.js';
import { fromNow, fullName, titleCase } from '../lib/format.js';
import { useAuth } from '../lib/auth.jsx';
import { useSaveMutation } from '../lib/useSaveMutation.js';
import { DentistSelect, PatientPicker } from '../components/forms/pickers.jsx';
import { Avatar, Badge, Button, Card, EmptyState, Field, Modal, PageHead, Select, Skeleton, Textarea } from '../components/ui/index.jsx';
import { IconInbox, IconPlus, IconSearch, IconSend, IconStar } from '../lib/icons.jsx';

const CHANNELS = {
  internal: { label: 'Internal', tone: 'pine' },
  whatsapp: { label: 'WhatsApp', tone: 'moss' },
  sms: { label: 'SMS', tone: 'sky' },
  email: { label: 'Email', tone: 'plum' },
};

const CATEGORY_TONE = {
  urgent: 'rose',
  billing: 'gold',
  lab: 'clay',
  'appointment-reminder': 'sky',
  recall: 'plum',
  general: 'neutral',
};

function ComposeModal({ open, onClose }) {
  const [form, setForm] = useState({ channel: 'internal', recipientUser: '', patient: '', subject: '', body: '', category: 'general' });

  const send = useSaveMutation({
    mutationFn: (payload) => post('/messages', payload),
    invalidate: ['messages', 'dashboard'],
    successMessage: 'Message sent',
    onSuccess: () => {
      setForm({ channel: 'internal', recipientUser: '', patient: '', subject: '', body: '', category: 'general' });
      onClose();
    },
  });

  const isInternal = form.channel === 'internal';

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="New message"
      sub={isInternal ? 'Goes to a colleague’s inbox' : 'Sends to the patient on their preferred channel'}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" icon={IconSend} form="message-form" type="submit" loading={send.isPending}>
            Send
          </Button>
        </>
      }
    >
      <form
        id="message-form"
        onSubmit={(event) => {
          event.preventDefault();
          send.mutate({
            channel: form.channel,
            recipientUser: isInternal ? form.recipientUser : '',
            patient: isInternal ? '' : form.patient,
            subject: form.subject,
            body: form.body,
            category: form.category,
          });
        }}
      >
        <div className="form-grid">
          <Field label="Channel">
            <Select value={form.channel} onChange={(event) => setForm((c) => ({ ...c, channel: event.target.value }))}>
              {Object.entries(CHANNELS).map(([key, meta]) => (
                <option key={key} value={key}>
                  {meta.label}
                </option>
              ))}
            </Select>
          </Field>

          <Field label="Category">
            <Select value={form.category} onChange={(event) => setForm((c) => ({ ...c, category: event.target.value }))}>
              <option value="general">General</option>
              <option value="appointment-reminder">Appointment reminder</option>
              <option value="recall">Recall</option>
              <option value="billing">Billing</option>
              <option value="lab">Lab</option>
              <option value="urgent">Urgent</option>
            </Select>
          </Field>

          <Field label={isInternal ? 'To colleague' : 'To patient'} className="span-2" required>
            {isInternal ? (
              <DentistSelect value={form.recipientUser} onChange={(value) => setForm((c) => ({ ...c, recipientUser: value }))} />
            ) : (
              <PatientPicker value={form.patient} onChange={(value) => setForm((c) => ({ ...c, patient: value }))} />
            )}
          </Field>

          <Field label="Subject" className="span-2">
            <input
              className="input"
              value={form.subject}
              onChange={(event) => setForm((c) => ({ ...c, subject: event.target.value }))}
              placeholder="Optional"
            />
          </Field>

          <Field label="Message" required className="span-2" error={send.fieldErrors.body}>
            <Textarea
              value={form.body}
              onChange={(event) => setForm((c) => ({ ...c, body: event.target.value }))}
              style={{ minHeight: 120 }}
              required
            />
          </Field>
        </div>
      </form>
    </Modal>
  );
}

export default function Messages() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState('all');
  const [channel, setChannel] = useState('');
  const [selected, setSelected] = useState(null);
  const [composing, setComposing] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['messages', { filter, channel }],
    queryFn: () =>
      getList('/messages', {
        params: {
          channel: channel || undefined,
          unread: filter === 'unread' ? 'true' : undefined,
          starred: filter === 'starred' ? 'true' : undefined,
          limit: 50,
        },
      }),
  });

  const markRead = useSaveMutation({
    mutationFn: (id) => patch(`/messages/${id}/read`, { isRead: true }),
    invalidate: ['messages', 'dashboard'],
  });

  const toggleStar = useSaveMutation({
    mutationFn: (id) => patch(`/messages/${id}/star`),
    invalidate: ['messages'],
  });

  const messages = data?.data ?? [];
  const active = selected ? messages.find((message) => message._id === selected) : messages[0];

  const open = (message) => {
    setSelected(message._id);
    if (!message.isRead) markRead.mutate(message._id);
  };

  return (
    <>
      <PageHead title="Messages" sub={data?.meta?.unread ? `${data.meta.unread} unread` : 'Patient and team conversations'}>
        <Button icon={IconPlus} variant="primary" onClick={() => setComposing(true)}>
          New message
        </Button>
      </PageHead>

      <Card flush className="inbox">
        <div className="inbox__list">
          <div className="inbox__filters">
            <div className="segmented">
              {['all', 'unread', 'starred'].map((key) => (
                <button key={key} aria-pressed={filter === key} onClick={() => setFilter(key)}>
                  {titleCase(key)}
                </button>
              ))}
            </div>
            <Select value={channel} onChange={(event) => setChannel(event.target.value)} style={{ height: 32, minHeight: 32 }}>
              <option value="">All channels</option>
              {Object.entries(CHANNELS).map(([key, meta]) => (
                <option key={key} value={key}>
                  {meta.label}
                </option>
              ))}
            </Select>
          </div>

          <ul className="inbox__rows">
            {isLoading &&
              Array.from({ length: 6 }, (_, index) => (
                <li key={index} style={{ padding: 'var(--sp-4)' }}>
                  <Skeleton height={13} width="70%" />
                  <Skeleton height={11} width="90%" style={{ marginTop: 8 }} />
                </li>
              ))}

            {!isLoading &&
              messages.map((message) => {
                const who = message.patient ? fullName(message.patient) : (message.sender?.name ?? 'System');
                return (
                  <li key={message._id}>
                    <button
                      className="inbox__row"
                      data-unread={!message.isRead}
                      data-active={active?._id === message._id}
                      onClick={() => open(message)}
                    >
                      <Avatar name={who} colour={message.patient ? undefined : message.sender?.colour} size="sm" />
                      <span className="inbox__row-body">
                        <span className="inbox__row-top">
                          <strong className="truncate">{who}</strong>
                          <time className="muted">{fromNow(message.sentAt)}</time>
                        </span>
                        <span className="inbox__row-sub truncate">{message.subject || message.body}</span>
                      </span>
                      {!message.isRead && <span className="inbox__unread-dot" aria-label="Unread" />}
                    </button>
                  </li>
                );
              })}

            {!isLoading && !messages.length && (
              <li>
                <EmptyState icon={IconInbox} title="Inbox is clear" text="Nothing matches this filter." />
              </li>
            )}
          </ul>
        </div>

        <div className="inbox__reader">
          {active ? (
            <>
              <header className="inbox__reader-head">
                <div>
                  <h2>{active.subject || 'No subject'}</h2>
                  <p className="muted">
                    {active.patient ? (
                      <>
                        <Link to={`/patients/${active.patient._id}`}>{fullName(active.patient)}</Link> · {active.patient.phone}
                      </>
                    ) : (
                      <>
                        {active.sender?.name} → {active.recipientUser?.name ?? 'the team'}
                      </>
                    )}
                  </p>
                </div>
                <div className="inbox__reader-actions">
                  <button
                    className="icon-btn"
                    aria-label="Star message"
                    data-on={active.isStarred}
                    onClick={() => toggleStar.mutate(active._id)}
                    style={{ color: active.isStarred ? 'var(--gold)' : undefined }}
                  >
                    <IconStar />
                  </button>
                </div>
              </header>

              <div className="inbox__badges">
                <Badge tone={CHANNELS[active.channel]?.tone}>{CHANNELS[active.channel]?.label}</Badge>
                <Badge tone={CATEGORY_TONE[active.category]}>{titleCase(active.category)}</Badge>
                <Badge tone="neutral">{titleCase(active.direction)}</Badge>
                <span className="muted">{fromNow(active.sentAt)}</span>
              </div>

              <div className="inbox__message">{active.body}</div>

              <form
                className="inbox__reply"
                onSubmit={(event) => {
                  event.preventDefault();
                  const body = event.target.elements.reply.value.trim();
                  if (!body) return;
                  post('/messages', {
                    channel: active.channel,
                    body,
                    patient: active.patient?._id ?? '',
                    recipientUser: active.patient ? '' : (active.sender?._id ?? ''),
                    thread: active.thread,
                    category: active.category,
                  }).then(() => {
                    event.target.reset();
                    queryClient.invalidateQueries({ queryKey: ['messages'] });
                  });
                }}
              >
                <Textarea name="reply" placeholder={`Reply as ${user?.name}…`} style={{ minHeight: 74 }} />
                <Button variant="primary" icon={IconSend} type="submit">
                  Send reply
                </Button>
              </form>
            </>
          ) : (
            <EmptyState icon={IconSearch} title="Nothing selected" text="Choose a conversation on the left to read it." />
          )}
        </div>
      </Card>

      <ComposeModal open={composing} onClose={() => setComposing(false)} />
    </>
  );
}

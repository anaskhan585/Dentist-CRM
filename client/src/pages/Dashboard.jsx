import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { get } from '../lib/api.js';
import { dayjs, fullName, money, number, percent, time } from '../lib/format.js';
import { APPOINTMENT_STATUS } from '../lib/constants.js';
import { useAuth } from '../lib/auth.jsx';
import { useSettings } from '../components/forms/pickers.jsx';
import { AreaChart, ColumnChart, Sparkline } from '../components/charts/index.jsx';
import { Avatar, Badge, Button, Card, CardHead, EmptyState, PageHead, Segmented, Skeleton } from '../components/ui/index.jsx';
import AppointmentForm from '../components/forms/AppointmentForm.jsx';
import {
  IconArrowDown,
  IconArrowRight,
  IconArrowUp,
  IconBilling,
  IconCalendar,
  IconLab,
  IconPatients,
  IconPlus,
} from '../lib/icons.jsx';

function greeting() {
  const hour = dayjs().hour();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

function StatCard({ label, value, trend, icon: Icon, tone = 'pine', spark, footnote }) {
  const up = trend > 0;
  const flat = trend === 0 || trend === undefined;

  return (
    <article className="stat">
      <header className="stat__head">
        <span className="stat__icon" data-tone={tone}>
          <Icon />
        </span>
        <span className="stat__label">{label}</span>
      </header>

      <p className="stat__value display numeric">{value}</p>

      <footer className="stat__foot">
        {!flat && (
          <span className="stat__trend" data-up={up}>
            {up ? <IconArrowUp /> : <IconArrowDown />}
            {percent(trend)}
          </span>
        )}
        <span className="stat__note">{footnote}</span>
        {spark && <Sparkline data={spark} />}
      </footer>
    </article>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [range, setRange] = useState(14);
  const [booking, setBooking] = useState(false);
  const { data: settings } = useSettings();
  const symbol = settings?.locale?.currencySymbol ?? 'Rs';

  const { data: overview, isLoading } = useQuery({
    queryKey: ['dashboard', 'overview'],
    queryFn: () => get('/dashboard/overview'),
  });

  const { data: activity = [] } = useQuery({
    queryKey: ['dashboard', 'activity', range],
    queryFn: () => get('/dashboard/activity', { params: { days: range } }),
  });

  const stats = overview?.stats;
  const series = activity.map((point) => ({ ...point, label: dayjs(point.date).format('D MMM') }));

  return (
    <>
      <PageHead title={`${greeting()}, ${user?.name?.replace(/^Dr\.?\s+/i, '').split(' ')[0] ?? 'there'}`} sub={dayjs().format('dddd, D MMMM YYYY')}>
        <Button icon={IconPlus} variant="primary" onClick={() => setBooking(true)}>
          Book appointment
        </Button>
      </PageHead>

      <div className="stat-grid">
        {isLoading ? (
          Array.from({ length: 4 }, (_, index) => (
            <article className="stat" key={index}>
              <Skeleton height={14} width="45%" />
              <Skeleton height={30} width="60%" style={{ marginTop: 18 }} />
              <Skeleton height={12} width="35%" style={{ marginTop: 16 }} />
            </article>
          ))
        ) : (
          <>
            <StatCard
              label="Active patients"
              value={number(stats?.totalPatients?.value)}
              trend={stats?.totalPatients?.trend}
              icon={IconPatients}
              footnote="since last month"
            />
            <StatCard
              label="Appointments today"
              value={number(stats?.todayAppointments?.value)}
              trend={stats?.todayAppointments?.trend}
              icon={IconCalendar}
              tone="sky"
              footnote="vs yesterday"
              spark={series.slice(-7).map((point) => ({ value: point.appointments }))}
            />
            <StatCard
              label="Collected this month"
              value={money(stats?.monthRevenue?.value, { symbol, short: true })}
              trend={stats?.monthRevenue?.trend}
              icon={IconBilling}
              tone="gold"
              footnote="vs last month"
              spark={series.slice(-7).map((point) => ({ value: point.revenue }))}
            />
            <StatCard
              label="Outstanding"
              value={money(stats?.outstanding?.value, { symbol, short: true })}
              icon={IconBilling}
              tone="clay"
              footnote="across unpaid invoices"
            />
          </>
        )}
      </div>

      <div className="dash-grid">
        <Card className="dash-grid__chart">
          <CardHead title="Collections" sub={`Daily payments received over the last ${range} days`}>
            <Segmented
              value={range}
              onChange={setRange}
              options={[
                { value: 7, label: '7d' },
                { value: 14, label: '14d' },
                { value: 30, label: '30d' },
              ]}
            />
          </CardHead>
          <div className="card__body">
            <AreaChart
              data={series}
              yKey="revenue"
              label="Collections"
              format={(value, axis) => money(value, { symbol, short: axis || value >= 10000 })}
            />
          </div>
        </Card>

        <Card className="dash-grid__side">
          <CardHead title="Chair activity" sub="Appointments per day" />
          <div className="card__body">
            <ColumnChart data={series} yKey="appointments" label="Appointments per day" height={190} />
          </div>
        </Card>

        <Card className="dash-grid__list" flush>
          {/* `upcoming` is capped at 8 rows — the count comes from the day's real total. */}
          <CardHead title="Today's list" sub={`${stats?.todayAppointments?.value ?? 0} appointments booked`}>
            <Link to="/appointments" className="btn btn--ghost btn--sm">
              Open diary <IconArrowRight />
            </Link>
          </CardHead>

          {overview?.upcoming?.length ? (
            <ul className="agenda">
              {overview.upcoming.map((appointment) => {
                const status = APPOINTMENT_STATUS[appointment.status];
                return (
                  <li key={appointment._id}>
                    <button className="agenda__row" onClick={() => navigate('/appointments')}>
                      <span className="agenda__time numeric">
                        <strong>{time(appointment.startAt)}</strong>
                        <span>{appointment.durationMinutes}m</span>
                      </span>
                      <span className="agenda__rule" style={{ background: appointment.dentist?.colour ?? 'var(--brand)' }} />
                      <span className="agenda__body">
                        <strong>{fullName(appointment.patient)}</strong>
                        <span>
                          {appointment.treatment} · {appointment.dentist?.name}
                        </span>
                      </span>
                      <Badge tone={status?.tone}>{status?.label}</Badge>
                    </button>
                  </li>
                );
              })}
            </ul>
          ) : (
            <EmptyState
              icon={IconCalendar}
              title="Nothing booked today"
              text="The diary is clear. A good day to catch up on recalls."
            />
          )}
        </Card>

        <div className="dash-grid__stack">
          <Card flush>
            <CardHead title="Needs attention" />
            <ul className="attention">
              <li>
                <Link to="/lab-tracking">
                  <span className="attention__icon" data-tone="clay">
                    <IconLab />
                  </span>
                  <span className="attention__body">
                    <strong>{stats?.overdueLabCases ?? 0} lab cases overdue</strong>
                    <span>{stats?.activeLabCases ?? 0} cases in progress</span>
                  </span>
                  <IconArrowRight />
                </Link>
              </li>
              <li>
                <Link to="/messages">
                  <span className="attention__icon" data-tone="sky">
                    <IconPatients />
                  </span>
                  <span className="attention__body">
                    <strong>{stats?.unreadMessages ?? 0} unread messages</strong>
                    <span>Patients and the team waiting on a reply</span>
                  </span>
                  <IconArrowRight />
                </Link>
              </li>
              <li>
                <Link to="/reports">
                  <span className="attention__icon" data-tone="gold">
                    <IconBilling />
                  </span>
                  <span className="attention__body">
                    <strong>{money(stats?.outstanding?.value, { symbol, short: true })} outstanding</strong>
                    <span>Chase unpaid balances</span>
                  </span>
                  <IconArrowRight />
                </Link>
              </li>
            </ul>
          </Card>

          <Card flush>
            <CardHead title="Newly registered" />
            {overview?.recentPatients?.length ? (
              <ul className="recent">
                {overview.recentPatients.map((patient) => (
                  <li key={patient._id}>
                    <Link to={`/patients/${patient._id}`}>
                      <Avatar name={fullName(patient)} size="sm" />
                      <span className="recent__body">
                        <strong>{fullName(patient)}</strong>
                        <span>{patient.fileNo}</span>
                      </span>
                      <span className="recent__when">{dayjs(patient.createdAt).format('D MMM')}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState icon={IconPatients} title="No patients yet" text="Register your first patient to get started." />
            )}
          </Card>
        </div>
      </div>

      <AppointmentForm open={booking} onClose={() => setBooking(false)} />
    </>
  );
}

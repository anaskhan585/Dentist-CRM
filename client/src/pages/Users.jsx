import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { del, get } from '../lib/api.js';
import { date, titleCase } from '../lib/format.js';
import { ROLES } from '../lib/constants.js';
import { useAuth } from '../lib/auth.jsx';
import { useSaveMutation } from '../lib/useSaveMutation.js';
import UserForm from '../components/forms/UserForm.jsx';
import { Avatar, Badge, Button, Card, Dropdown, EmptyState, PageHead, Skeleton } from '../components/ui/index.jsx';
import { IconEdit, IconMail, IconMore, IconPhone, IconPlus, IconTrash, IconUsers } from '../lib/icons.jsx';

const DAY_LETTERS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

export default function Users() {
  const { isAdmin, user: me } = useAuth();
  const [editing, setEditing] = useState(null);
  const [creating, setCreating] = useState(false);
  const [showInactive, setShowInactive] = useState(false);

  const { data: users = [], isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: () => get('/users'),
  });

  const deactivate = useSaveMutation({
    mutationFn: (id) => del(`/users/${id}`),
    invalidate: ['users'],
    successMessage: 'Team member deactivated',
  });

  const visible = users.filter((user) => showInactive || user.isActive);

  return (
    <>
      <PageHead title="Users" sub={`${users.filter((user) => user.isActive).length} active team members`}>
        <Button size="sm" variant="ghost" onClick={() => setShowInactive((value) => !value)}>
          {showInactive ? 'Hide inactive' : 'Show inactive'}
        </Button>
        {isAdmin && (
          <Button icon={IconPlus} variant="primary" onClick={() => setCreating(true)}>
            Add team member
          </Button>
        )}
      </PageHead>

      {isLoading ? (
        <div className="team-grid">
          {Array.from({ length: 6 }, (_, index) => (
            <Card key={index}>
              <div className="card__body">
                <Skeleton height={46} width={46} radius="50%" />
                <Skeleton height={16} width="60%" style={{ marginTop: 16 }} />
                <Skeleton height={12} width="40%" style={{ marginTop: 8 }} />
              </div>
            </Card>
          ))}
        </div>
      ) : visible.length ? (
        <div className="team-grid">
          {visible.map((user) => (
            <article className="teamcard" key={user._id} data-inactive={!user.isActive}>
              <span className="teamcard__stripe" style={{ background: user.colour }} />

              <header className="teamcard__head">
                <Avatar name={user.name} colour={user.colour} initials={user.avatarInitials} size="lg" />
                <div className="teamcard__id">
                  <strong>{user.name}</strong>
                  <span>{user.specialty || ROLES[user.role]?.label}</span>
                </div>

                {isAdmin && (
                  <Dropdown
                    trigger={({ toggle }) => (
                      <button className="icon-btn" onClick={toggle} aria-label={`Actions for ${user.name}`}>
                        <IconMore />
                      </button>
                    )}
                  >
                    <button className="menu__item" onClick={() => setEditing(user)}>
                      <IconEdit /> Edit details
                    </button>
                    {user._id !== me?._id && user.isActive && (
                      <>
                        <div className="menu__sep" />
                        <button className="menu__item" data-tone="danger" onClick={() => deactivate.mutate(user._id)}>
                          <IconTrash /> Deactivate
                        </button>
                      </>
                    )}
                  </Dropdown>
                )}
              </header>

              <div className="teamcard__badges">
                <Badge tone={ROLES[user.role]?.tone}>{ROLES[user.role]?.label}</Badge>
                {!user.isActive && <Badge tone="neutral">Inactive</Badge>}
              </div>

              <ul className="teamcard__contact">
                <li>
                  <IconMail />
                  <span className="truncate">{user.email}</span>
                </li>
                {user.phone && (
                  <li>
                    <IconPhone />
                    <span>{user.phone}</span>
                  </li>
                )}
              </ul>

              <div className="teamcard__schedule">
                <span className="eyebrow">Works</span>
                <div className="teamcard__days">
                  {DAY_LETTERS.map((letter, index) => (
                    <span key={index} data-on={user.workingDays?.includes(index)} title={`Day ${index}`}>
                      {letter}
                    </span>
                  ))}
                </div>
                <span className="teamcard__hours numeric">
                  {user.workingHours?.start}–{user.workingHours?.end}
                </span>
              </div>

              {user.lastLoginAt && <p className="teamcard__seen muted">Last signed in {date(user.lastLoginAt, 'D MMM YYYY')}</p>}
            </article>
          ))}
        </div>
      ) : (
        <EmptyState icon={IconUsers} title="No team members" text="Add the clinicians and front-desk staff who use this system." />
      )}

      <UserForm open={creating} onClose={() => setCreating(false)} />
      <UserForm open={Boolean(editing)} onClose={() => setEditing(null)} user={editing} />
    </>
  );
}

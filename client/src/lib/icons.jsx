/**
 * Hand-tuned line icons — 24×24, 1.6 stroke, round caps.
 *
 * Kept local rather than pulling an icon package: it keeps the bundle small and
 * lets the tooth/lab glyphs match the rest of the set instead of looking bolted on.
 */

const base = {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.6,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  width: '1em',
  height: '1em',
};

const make = (paths) =>
  function Icon(props) {
    return (
      <svg {...base} {...props}>
        {paths}
      </svg>
    );
  };

/* --- Navigation ----------------------------------------------------------- */

export const IconDashboard = make(
  <>
    <rect x="3" y="3" width="7.5" height="8.5" rx="2" />
    <rect x="13.5" y="3" width="7.5" height="5.5" rx="2" />
    <rect x="3" y="14.5" width="7.5" height="6.5" rx="2" />
    <rect x="13.5" y="11.5" width="7.5" height="9.5" rx="2" />
  </>
);

export const IconCalendar = make(
  <>
    <rect x="3" y="5" width="18" height="16" rx="2.5" />
    <path d="M3 10h18M8 3v4M16 3v4" />
    <circle cx="8.5" cy="14.5" r="1" fill="currentColor" stroke="none" />
    <circle cx="12" cy="14.5" r="1" fill="currentColor" stroke="none" />
  </>
);

export const IconPatients = make(
  <>
    <circle cx="9" cy="8" r="3.6" />
    <path d="M2.6 20.4c.6-3.6 3.3-5.6 6.4-5.6s5.8 2 6.4 5.6" />
    <path d="M17 4.6a3.4 3.4 0 0 1 0 6.6M18.6 14.9c2 .7 3.3 2.6 3.7 5.1" />
  </>
);

export const IconRecords = make(
  <>
    <path d="M8 4h8a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z" />
    <path d="M9.5 4a1.5 1.5 0 0 1 1.5-1.5h2A1.5 1.5 0 0 1 14.5 4" />
    <path d="M9.4 13.2h1.5l.8-1.9 1.3 3.4.9-1.5h1.7" />
  </>
);

export const IconLab = make(
  <>
    <path d="M9.5 3v6.2L4.8 17.4A2.6 2.6 0 0 0 7 21.4h10a2.6 2.6 0 0 0 2.2-4L14.5 9.2V3" />
    <path d="M8 3h8M6.8 14.6h10.4" />
    <circle cx="11" cy="17.4" r="1" fill="currentColor" stroke="none" />
    <circle cx="14" cy="18.4" r=".7" fill="currentColor" stroke="none" />
  </>
);

export const IconUsers = make(
  <>
    <circle cx="12" cy="7.5" r="3.8" />
    <path d="M4.5 21c.4-4.2 3.6-6.6 7.5-6.6s7.1 2.4 7.5 6.6" />
  </>
);

export const IconMessages = make(
  <>
    <path d="M21 11.6c0 4.1-4 7.4-9 7.4a10.6 10.6 0 0 1-2.8-.4L4 21l1.2-3.6A7 7 0 0 1 3 11.6c0-4.1 4-7.4 9-7.4s9 3.3 9 7.4Z" />
    <path d="M9 11.5h.01M12 11.5h.01M15 11.5h.01" strokeWidth="2.2" />
  </>
);

export const IconPreferences = make(
  <>
    <path d="M4 7h9M17.5 7H20M4 17h3.5M12 17h8" />
    <circle cx="15.2" cy="7" r="2.3" />
    <circle cx="9.7" cy="17" r="2.3" />
  </>
);

export const IconReports = make(
  <>
    <path d="M3.5 20.5h17" />
    <path d="M6.5 20.5v-6M11 20.5V6.5M15.5 20.5v-9M20 20.5v-4" />
  </>
);

export const IconBilling = make(
  <>
    <path d="M5 3.5 6.8 5l1.8-1.5L10.4 5l1.8-1.5L14 5l1.8-1.5L17.6 5l1.4-1.2v16.7L17.6 19l-1.8 1.5L14 19l-1.8 1.5L10.4 19l-1.8 1.5L6.8 19 5 20.5Z" />
    <path d="M8.6 9.5h6.8M8.6 13.5h4.4" />
  </>
);

/* --- Actions -------------------------------------------------------------- */

export const IconSearch = make(
  <>
    <circle cx="10.5" cy="10.5" r="6.5" />
    <path d="m15.4 15.4 4.1 4.1" />
  </>
);

export const IconBell = make(
  <>
    <path d="M18 8.6a6 6 0 1 0-12 0c0 5-2 6.4-2 6.4h16s-2-1.4-2-6.4Z" />
    <path d="M13.7 19a2 2 0 0 1-3.4 0" />
  </>
);

export const IconPlus = make(<path d="M12 5v14M5 12h14" />);
export const IconMinus = make(<path d="M5 12h14" />);
export const IconChevronLeft = make(<path d="m14.5 5-7 7 7 7" />);
export const IconChevronRight = make(<path d="m9.5 5 7 7-7 7" />);
export const IconChevronDown = make(<path d="m5 9 7 7 7-7" />);
export const IconClose = make(<path d="M6 6l12 12M18 6 6 18" />);
export const IconCheck = make(<path d="m4.5 12.5 5 5 10-11" />);

export const IconLogout = make(
  <>
    <path d="M9.5 21H6a2.5 2.5 0 0 1-2.5-2.5v-13A2.5 2.5 0 0 1 6 3h3.5" />
    <path d="M16 16.5 20.5 12 16 7.5M20 12H9" />
  </>
);

export const IconSettings = make(
  <>
    <circle cx="12" cy="12" r="3.2" />
    <path d="M19.4 14.4a1.6 1.6 0 0 0 .3 1.8l.1.1a1.9 1.9 0 1 1-2.7 2.7l-.1-.1a1.6 1.6 0 0 0-1.8-.3 1.6 1.6 0 0 0-1 1.5v.3a1.9 1.9 0 1 1-3.8 0v-.2a1.6 1.6 0 0 0-1-1.5 1.6 1.6 0 0 0-1.8.3l-.1.1a1.9 1.9 0 1 1-2.7-2.7l.1-.1a1.6 1.6 0 0 0 .3-1.8 1.6 1.6 0 0 0-1.5-1H3.4a1.9 1.9 0 1 1 0-3.8h.2a1.6 1.6 0 0 0 1.5-1 1.6 1.6 0 0 0-.3-1.8l-.1-.1a1.9 1.9 0 1 1 2.7-2.7l.1.1a1.6 1.6 0 0 0 1.8.3h.1a1.6 1.6 0 0 0 1-1.5V3.4a1.9 1.9 0 1 1 3.8 0v.2a1.6 1.6 0 0 0 1 1.5 1.6 1.6 0 0 0 1.8-.3l.1-.1a1.9 1.9 0 1 1 2.7 2.7l-.1.1a1.6 1.6 0 0 0-.3 1.8v.1a1.6 1.6 0 0 0 1.5 1h.3a1.9 1.9 0 1 1 0 3.8h-.2a1.6 1.6 0 0 0-1.5 1Z" />
  </>
);

export const IconEdit = make(
  <>
    <path d="M4 20.2h4.2L19 9.4a2.1 2.1 0 0 0 0-3l-1.4-1.4a2.1 2.1 0 0 0-3 0L3.8 15.8Z" />
    <path d="m13.8 6.2 4 4" />
  </>
);

export const IconTrash = make(
  <>
    <path d="M4 6.5h16M9.5 6.5V4.8A1.3 1.3 0 0 1 10.8 3.5h2.4a1.3 1.3 0 0 1 1.3 1.3v1.7" />
    <path d="M18.2 6.5 17.4 19a2 2 0 0 1-2 1.9H8.6a2 2 0 0 1-2-1.9L5.8 6.5" />
    <path d="M10.3 10.5v6M13.7 10.5v6" />
  </>
);

export const IconMore = make(
  <>
    <circle cx="12" cy="5.5" r="1.6" fill="currentColor" stroke="none" />
    <circle cx="12" cy="12" r="1.6" fill="currentColor" stroke="none" />
    <circle cx="12" cy="18.5" r="1.6" fill="currentColor" stroke="none" />
  </>
);

export const IconMenu = make(<path d="M4 7h16M4 12h16M4 17h16" />);
export const IconFilter = make(<path d="M3.5 5.5h17l-6.6 7.6v5.9l-3.8 2v-7.9Z" />);

export const IconPhone = make(
  <path d="M21 16.9v2.6a1.8 1.8 0 0 1-2 1.8 17.6 17.6 0 0 1-7.7-2.7 17.3 17.3 0 0 1-5.3-5.3A17.6 17.6 0 0 1 3.3 5.5 1.8 1.8 0 0 1 5.1 3.5h2.6a1.8 1.8 0 0 1 1.8 1.6c.1.9.3 1.7.6 2.5a1.8 1.8 0 0 1-.4 1.9l-1.1 1.1a14.4 14.4 0 0 0 5.4 5.4l1.1-1.1a1.8 1.8 0 0 1 1.9-.4c.8.3 1.6.5 2.5.6a1.8 1.8 0 0 1 1.5 1.8Z" />
);

export const IconMail = make(
  <>
    <rect x="3" y="5" width="18" height="14" rx="2.5" />
    <path d="m3.8 7 7.2 5.3a1.7 1.7 0 0 0 2 0L20.2 7" />
  </>
);

export const IconClock = make(
  <>
    <circle cx="12" cy="12" r="8.8" />
    <path d="M12 7v5.3l3.2 2" />
  </>
);

export const IconArrowUp = make(<path d="M12 19V5M6 11l6-6 6 6" />);
export const IconArrowDown = make(<path d="M12 5v14M6 13l6 6 6-6" />);
export const IconArrowRight = make(<path d="M4 12h15M13 6l6 6-6 6" />);

export const IconStar = make(
  <path d="m12 3.8 2.6 5.3 5.9.9-4.3 4.1 1 5.8-5.2-2.7-5.2 2.7 1-5.8L3.5 10l5.9-.9Z" />
);

export const IconAlert = make(
  <>
    <path d="M10.3 3.9 2.4 17.4A1.9 1.9 0 0 0 4 20.3h16a1.9 1.9 0 0 0 1.6-2.9L13.7 3.9a1.9 1.9 0 0 0-3.4 0Z" />
    <path d="M12 9.3v4.2M12 17.3h.01" strokeWidth="2" />
  </>
);

export const IconInfo = make(
  <>
    <circle cx="12" cy="12" r="8.8" />
    <path d="M12 11v5M12 8h.01" strokeWidth="2" />
  </>
);

export const IconDownload = make(
  <>
    <path d="M12 3.5v11M7.5 10.5 12 15l4.5-4.5" />
    <path d="M4 17.5v1.6a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-1.6" />
  </>
);

export const IconSend = make(
  <>
    <path d="M20.5 3.5 10.8 13.2" />
    <path d="M20.5 3.5 14.3 21a.6.6 0 0 1-1.1 0l-2.4-6.6-6.6-2.4a.6.6 0 0 1 0-1.1Z" />
  </>
);

export const IconInbox = make(
  <>
    <path d="M3.2 13.5h4.3l1.4 2.6h6.2l1.4-2.6h4.3" />
    <path d="M5.7 4.5h12.6l2.5 9v4.6a2 2 0 0 1-2 2H5.2a2 2 0 0 1-2-2v-4.6Z" />
  </>
);

export const IconTooth = make(
  <path d="M12 3.6c-1.9 0-2.9.8-4.7.8-2.1 0-4 1.7-4 4.8 0 3.6 1.1 6.2 2 8.6.8 2.1 1.4 5 3.1 5 1.5 0 1.7-1.9 1.9-3.6.2-1.5.6-2.7 1.7-2.7s1.5 1.2 1.7 2.7c.2 1.7.4 3.6 1.9 3.6 1.7 0 2.3-2.9 3.1-5 .9-2.4 2-5 2-8.6 0-3.1-1.9-4.8-4-4.8-1.8 0-2.8-.8-4.7-.8Z" />
);

export const IconStethoscope = make(
  <>
    <path d="M5 3.5v5a4.2 4.2 0 0 0 8.4 0v-5" />
    <path d="M3.4 3.5h3M12 3.5h3" />
    <path d="M9.2 12.7v2.4a5 5 0 0 0 10 0v-1.6" />
    <circle cx="19.2" cy="11.4" r="2.1" />
  </>
);

export const IconSparkle = make(
  <path d="M12 3.5 13.6 9 19 10.6 13.6 12.2 12 17.7 10.4 12.2 5 10.6 10.4 9Z" />
);

export const IconGrid = make(
  <>
    <rect x="3.5" y="3.5" width="7" height="7" rx="1.8" />
    <rect x="13.5" y="3.5" width="7" height="7" rx="1.8" />
    <rect x="3.5" y="13.5" width="7" height="7" rx="1.8" />
    <rect x="13.5" y="13.5" width="7" height="7" rx="1.8" />
  </>
);

export const IconList = make(<path d="M8 6.5h12M8 12h12M8 17.5h12M4 6.5h.01M4 12h.01M4 17.5h.01" />);

export const IconEye = make(
  <>
    <path d="M2.5 12S6 5.8 12 5.8 21.5 12 21.5 12 18 18.2 12 18.2 2.5 12 2.5 12Z" />
    <circle cx="12" cy="12" r="2.9" />
  </>
);

export const IconLock = make(
  <>
    <rect x="4.5" y="10" width="15" height="11" rx="2.5" />
    <path d="M8 10V7.2a4 4 0 0 1 8 0V10" />
  </>
);

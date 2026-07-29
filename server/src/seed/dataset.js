/**
 * Deterministic demo dataset for the clinic.
 *
 * References between collections are index-based (`patientIndex`, `dentistIndex`)
 * so the same data can be loaded into Mongo or replayed by a mock API without
 * needing real ObjectIds up front.
 */

const DAY = 24 * 60 * 60 * 1000;

/** Small seeded PRNG so every seed run produces the same clinic. */
function makeRandom(seed = 20240117) {
  let state = seed;
  return () => {
    state = (state * 1664525 + 1013904223) % 4294967296;
    return state / 4294967296;
  };
}

const random = makeRandom();
const pick = (list) => list[Math.floor(random() * list.length)];
const pickSome = (list, count) => {
  const pool = [...list];
  const out = [];
  for (let i = 0; i < count && pool.length; i += 1) {
    out.push(pool.splice(Math.floor(random() * pool.length), 1)[0]);
  }
  return out;
};
const intBetween = (min, max) => Math.floor(random() * (max - min + 1)) + min;

/** Midnight today, so seeded data always lands around "now". */
function today() {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  return date;
}

function at(dayOffset, hour, minute = 0) {
  const date = new Date(today().getTime() + dayOffset * DAY);
  date.setHours(hour, minute, 0, 0);
  return date;
}

export const users = [
  {
    name: 'Dr. Ayesha Siddiqui',
    email: 'ayesha@vanguarddental.pk',
    password: 'Vanguard@2024',
    role: 'admin',
    specialty: 'Prosthodontics',
    phone: '+92 300 2214455',
    colour: '#0C5148',
    workingHours: { start: '09:00', end: '18:00' },
  },
  {
    name: 'Dr. Bilal Rehman',
    email: 'bilal@vanguarddental.pk',
    password: 'Vanguard@2024',
    role: 'dentist',
    specialty: 'Endodontics',
    phone: '+92 321 4478812',
    colour: '#8C5A2B',
    workingHours: { start: '10:00', end: '19:00' },
  },
  {
    name: 'Dr. Hina Qureshi',
    email: 'hina@vanguarddental.pk',
    password: 'Vanguard@2024',
    role: 'dentist',
    specialty: 'Orthodontics',
    phone: '+92 333 9081234',
    colour: '#3D6E9E',
    workingDays: [1, 2, 4, 5, 6],
    workingHours: { start: '11:00', end: '19:00' },
  },
  {
    name: 'Dr. Omar Farooq',
    email: 'omar@vanguarddental.pk',
    password: 'Vanguard@2024',
    role: 'dentist',
    specialty: 'Oral Surgery',
    phone: '+92 302 7788901',
    colour: '#6B4C8A',
    workingDays: [1, 3, 5],
    workingHours: { start: '09:00', end: '15:00' },
  },
  {
    name: 'Sana Mirza',
    email: 'sana@vanguarddental.pk',
    password: 'Vanguard@2024',
    role: 'hygienist',
    specialty: 'Periodontal Therapy',
    phone: '+92 345 6612390',
    colour: '#2F7D5E',
  },
  {
    name: 'Fatima Noor',
    email: 'fatima@vanguarddental.pk',
    password: 'Vanguard@2024',
    role: 'receptionist',
    phone: '+92 311 5540921',
    colour: '#B8862F',
  },
];

const firstNames = [
  'Zara', 'Hamza', 'Aliya', 'Usman', 'Mehreen', 'Danish', 'Kiran', 'Salman',
  'Nida', 'Faisal', 'Rabia', 'Tariq', 'Sadia', 'Imran', 'Anum', 'Junaid',
  'Maryam', 'Adnan', 'Hira', 'Kashif', 'Sobia', 'Waleed', 'Amna', 'Rizwan',
  'Iqra', 'Shahid', 'Noor', 'Asad', 'Laiba', 'Fahad', 'Sumaira', 'Bilal',
  'Rida', 'Naveed', 'Areeba', 'Owais', 'Sana', 'Zeeshan', 'Mahnoor', 'Arif',
];

const lastNames = [
  'Khan', 'Ahmed', 'Malik', 'Sheikh', 'Baig', 'Chaudhry', 'Raza', 'Iqbal',
  'Hussain', 'Javed', 'Abbasi', 'Rashid', 'Latif', 'Yousaf', 'Zaidi', 'Butt',
  'Aslam', 'Nawaz', 'Saeed', 'Hashmi',
];

const areas = ['DHA Phase VI', 'Clifton Block 5', 'Gulshan-e-Iqbal', 'Bahadurabad', 'PECHS Block 2', 'North Nazimabad'];
const allergyPool = ['Penicillin', 'Latex', 'Local anaesthetic (Articaine)', 'Ibuprofen', 'Sulfa drugs'];
const conditionPool = ['Type 2 Diabetes', 'Hypertension', 'Asthma', 'Hypothyroidism', 'Acid reflux'];
const tagPool = ['recall-due', 'ortho', 'implant-case', 'nervous', 'vip', 'insurance', 'paediatric'];
const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'];
const toothStatuses = ['caries', 'filled', 'crown', 'root-canal', 'implant', 'missing', 'watch'];
const allTeeth = [
  ...Array.from({ length: 8 }, (_, i) => 11 + i),
  ...Array.from({ length: 8 }, (_, i) => 21 + i),
  ...Array.from({ length: 8 }, (_, i) => 31 + i),
  ...Array.from({ length: 8 }, (_, i) => 41 + i),
];

export const patients = Array.from({ length: 64 }, (_, index) => {
  const firstName = firstNames[index % firstNames.length];
  const lastName = pick(lastNames);
  const createdOffset = -intBetween(3, 500);
  const hasAllergy = random() < 0.35;
  const hasCondition = random() < 0.3;

  return {
    fileNo: `P-2024-${String(index + 1).padStart(4, '0')}`,
    firstName,
    lastName,
    email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@example.com`,
    phone: `+92 3${intBetween(0, 4)}${intBetween(0, 9)} ${intBetween(1000000, 9999999)}`,
    dateOfBirth: new Date(
      today().getTime() - intBetween(7, 68) * 365.25 * DAY - intBetween(0, 364) * DAY
    ),
    gender: random() < 0.52 ? 'female' : 'male',
    address: { line1: `House ${intBetween(1, 400)}, Street ${intBetween(1, 30)}`, city: 'Karachi', state: 'Sindh', postalCode: `75${intBetween(100, 999)}` },
    bloodGroup: pick(bloodGroups),
    allergies: hasAllergy ? pickSome(allergyPool, intBetween(1, 2)) : [],
    medicalConditions: hasCondition ? pickSome(conditionPool, 1) : [],
    medications: hasCondition ? ['Metformin 500mg'] : [],
    emergencyContact: {
      name: `${pick(firstNames)} ${lastName}`,
      relation: pick(['Spouse', 'Parent', 'Sibling', 'Child']),
      phone: `+92 3${intBetween(0, 4)}${intBetween(0, 9)} ${intBetween(1000000, 9999999)}`,
    },
    insurance:
      random() < 0.4
        ? { provider: pick(['State Life', 'Jubilee Health', 'EFU Health', 'Adamjee Insurance']), policyNo: `PK-${intBetween(100000, 999999)}`, validTill: new Date(today().getTime() + intBetween(30, 500) * DAY) }
        : undefined,
    dentistIndex: intBetween(0, 3),
    tags: random() < 0.5 ? pickSome(tagPool, intBetween(1, 2)) : [],
    status: random() < 0.92 ? 'active' : 'inactive',
    notes: random() < 0.25 ? pick([
      'Prefers early-morning slots before work.',
      'Gags easily — take radiographs slowly.',
      'Anxious patient, responds well to a topical anaesthetic first.',
      'Travels frequently; confirm by WhatsApp before booking.',
    ]) : '',
    toothChart: Array.from({ length: intBetween(0, 6) }, () => ({
      tooth: pick(allTeeth),
      status: pick(toothStatuses),
      surfaces: pickSome(['M', 'O', 'D', 'B', 'L'], intBetween(1, 2)),
      note: '',
    })),
    createdAtOffsetDays: createdOffset,
    lastVisitOffsetDays: random() < 0.8 ? -intBetween(1, 180) : null,
    addressArea: pick(areas),
  };
});

const treatments = [
  { name: 'Consultation', minutes: 20, price: 2000 },
  { name: 'Scaling & Polishing', minutes: 45, price: 6500 },
  { name: 'Composite Filling', minutes: 40, price: 5500 },
  { name: 'Root Canal', minutes: 90, price: 22000 },
  { name: 'Crown Fitting', minutes: 60, price: 35000 },
  { name: 'Extraction', minutes: 30, price: 4500 },
  { name: 'Implant', minutes: 120, price: 145000 },
  { name: 'Orthodontic Adjustment', minutes: 30, price: 7500 },
  { name: 'Teeth Whitening', minutes: 60, price: 18000 },
  { name: 'Denture Fitting', minutes: 50, price: 48000 },
  { name: 'Follow-up', minutes: 15, price: 0 },
];

const chairs = ['Chair 1', 'Chair 2', 'Chair 3', 'Surgery'];

/** Builds a believable book: dense today, thinning out either side. */
function buildAppointments() {
  const list = [];

  for (let dayOffset = -45; dayOffset <= 21; dayOffset += 1) {
    const weekday = new Date(today().getTime() + dayOffset * DAY).getDay();
    if (weekday === 0) continue; // clinic closed on Sundays

    const isToday = dayOffset === 0;
    const count = isToday ? 11 : dayOffset > 0 ? intBetween(3, 7) : intBetween(5, 9);

    let slotMinutes = 9 * 60;
    for (let i = 0; i < count; i += 1) {
      const treatment = pick(treatments);
      const dentistIndex = intBetween(0, 3);
      const startHour = Math.floor(slotMinutes / 60);
      const startMinute = slotMinutes % 60;
      if (startHour >= 19) break;

      let status;
      if (dayOffset < 0) status = random() < 0.86 ? 'completed' : pick(['cancelled', 'no-show']);
      else if (isToday) status = i < 3 ? 'completed' : i === 3 ? 'in-progress' : pick(['confirmed', 'confirmed', 'scheduled']);
      else status = random() < 0.6 ? 'confirmed' : 'scheduled';

      list.push({
        patientIndex: intBetween(0, patients.length - 1),
        dentistIndex,
        treatment: treatment.name,
        chair: chairs[dentistIndex % chairs.length],
        startAt: at(dayOffset, startHour, startMinute),
        durationMinutes: treatment.minutes,
        status,
        notes: random() < 0.2 ? 'Patient requested a follow-up call the day before.' : '',
        price: treatment.price,
      });

      slotMinutes += treatment.minutes + intBetween(5, 40);
    }
  }

  return list;
}

export const appointments = buildAppointments();

const labs = [
  { name: 'Precision Dental Lab', contact: 'Mr. Kamran', phone: '+92 321 8845567' },
  { name: 'Smile Craft Ceramics', contact: 'Ms. Nadia', phone: '+92 300 4412298' },
  { name: 'OrthoWorks Karachi', contact: 'Mr. Shahzad', phone: '+92 345 9987123' },
];

const workTypes = ['Crown', 'Bridge', 'Veneer', 'Denture', 'Night Guard', 'Aligner', 'Inlay/Onlay', 'Post & Core'];
const stages = ['impression-taken', 'sent-to-lab', 'in-fabrication', 'trial-fitting', 'received', 'delivered'];
const shades = ['A1', 'A2', 'A3', 'A3.5', 'B1', 'B2', 'C1'];

export const labCases = Array.from({ length: 22 }, (_, index) => {
  const stage = index < 18 ? stages[index % 5] : 'delivered';
  const dueOffset = ['received', 'delivered'].includes(stage) ? -intBetween(1, 20) : intBetween(-4, 18);

  return {
    caseNo: `LAB-2024-${String(index + 1).padStart(3, '0')}`,
    patientIndex: intBetween(0, patients.length - 1),
    dentistIndex: intBetween(0, 3),
    lab: pick(labs),
    workType: pick(workTypes),
    shade: pick(shades),
    teeth: pickSome(allTeeth, intBetween(1, 3)),
    stage,
    dueAt: new Date(today().getTime() + dueOffset * DAY),
    sentAtOffset: stage === 'impression-taken' ? null : -intBetween(2, 14),
    cost: intBetween(6, 40) * 1000,
    priority: random() < 0.25 ? 'urgent' : 'standard',
    notes: random() < 0.3 ? 'Match the adjacent central incisor — patient is particular about shade.' : '',
  };
});

const recordTitles = [
  { title: 'Routine examination & scaling', type: 'clinical-note' },
  { title: 'Root canal — session 1', type: 'treatment-plan' },
  { title: 'Post-extraction review', type: 'clinical-note' },
  { title: 'Periapical radiograph', type: 'x-ray' },
  { title: 'Antibiotic course prescribed', type: 'prescription' },
  { title: 'Orthodontic progress check', type: 'clinical-note' },
  { title: 'Referral — oral surgery', type: 'referral' },
];

export const healthRecords = Array.from({ length: 70 }, () => {
  const template = pick(recordTitles);
  return {
    patientIndex: intBetween(0, patients.length - 1),
    authorIndex: intBetween(0, 4),
    recordType: template.type,
    title: template.title,
    chiefComplaint: pick([
      'Sensitivity to cold on the upper right side',
      'Dull ache when chewing, worse at night',
      'Bleeding gums while brushing',
      'Routine six-month check-up',
      'Chipped front tooth after a fall',
    ]),
    findings: pick([
      'Deep occlusal caries with no periapical radiolucency.',
      'Generalised marginal gingivitis, moderate calculus deposits.',
      'Tooth tender to percussion; pulp test non-responsive.',
      'Restoration intact, no secondary caries detected.',
    ]),
    diagnosis: pick([
      'Irreversible pulpitis',
      'Chronic gingivitis',
      'Dentine caries',
      'Periapical abscess',
      'Healthy dentition',
    ]),
    treatmentDone: pick([
      'Full-mouth scaling and polishing completed.',
      'Composite restoration placed, occlusion checked.',
      'Access cavity prepared, canals located and irrigated.',
      'Extraction under local anaesthesia, haemostasis achieved.',
    ]),
    plan: pick([
      'Review in two weeks; reinforce oral hygiene instructions.',
      'Complete obturation at the next visit.',
      'Recall in six months for routine examination.',
      'Impression for crown at the following appointment.',
    ]),
    teeth: pickSome(allTeeth, intBetween(1, 3)),
    prescriptions:
      random() < 0.35
        ? [
            { drug: pick(['Amoxicillin 500mg', 'Metronidazole 400mg', 'Ibuprofen 400mg']), dosage: '1 tablet', frequency: 'Three times a day', duration: '5 days' },
          ]
        : [],
    recordedAtOffsetDays: -intBetween(0, 200),
  };
});

export const invoices = Array.from({ length: 90 }, (_, index) => {
  const itemCount = intBetween(1, 3);
  const items = Array.from({ length: itemCount }, () => {
    const treatment = pick(treatments.filter((t) => t.price > 0));
    return {
      description: treatment.name,
      tooth: random() < 0.5 ? pick(allTeeth) : undefined,
      quantity: 1,
      unitPrice: treatment.price,
      discount: random() < 0.2 ? Math.round(treatment.price * 0.1) : 0,
    };
  });

  const total = items.reduce((sum, item) => sum + item.unitPrice * item.quantity - item.discount, 0);
  const roll = random();
  let status = 'paid';
  let amountPaid = total;
  if (roll > 0.72 && roll <= 0.88) {
    status = 'partial';
    amountPaid = Math.round(total * 0.5);
  } else if (roll > 0.88) {
    status = 'unpaid';
    amountPaid = 0;
  }

  return {
    invoiceNo: `INV-2024-${String(index + 1).padStart(4, '0')}`,
    patientIndex: intBetween(0, patients.length - 1),
    dentistIndex: intBetween(0, 3),
    items,
    taxRate: 0,
    amountPaid,
    status,
    paymentMethod: status === 'unpaid' ? undefined : pick(['cash', 'card', 'bank-transfer', 'insurance']),
    issuedAtOffsetDays: -intBetween(0, 165),
  };
});

export const messages = [
  {
    channel: 'whatsapp',
    direction: 'inbound',
    patientIndex: 3,
    body: 'Assalam o alaikum, can I move my Thursday appointment to Friday morning please?',
    category: 'appointment-reminder',
    isRead: false,
    sentAtHoursAgo: 1,
  },
  {
    channel: 'internal',
    direction: 'outbound',
    senderIndex: 5,
    recipientIndex: 0,
    subject: 'Chair 2 compressor',
    body: 'The compressor on Chair 2 is making a rattling noise again. Shall I call the technician for tomorrow morning before the list starts?',
    category: 'urgent',
    isRead: false,
    sentAtHoursAgo: 2,
  },
  {
    channel: 'whatsapp',
    direction: 'inbound',
    patientIndex: 11,
    body: 'The pain has settled completely after the antibiotics. Thank you doctor.',
    category: 'general',
    isRead: false,
    sentAtHoursAgo: 4,
  },
  {
    channel: 'internal',
    direction: 'outbound',
    senderIndex: 1,
    recipientIndex: 4,
    subject: 'Perio charting for Mr. Rizwan',
    body: 'Could you complete the six-point pocket charting before I see him on Wednesday? His last set was over a year old.',
    category: 'general',
    isRead: true,
    sentAtHoursAgo: 22,
  },
  {
    channel: 'sms',
    direction: 'outbound',
    patientIndex: 7,
    body: 'Reminder: your appointment at Vanguard Dental Studio is tomorrow at 11:30 AM. Reply C to confirm.',
    category: 'appointment-reminder',
    isRead: true,
    sentAtHoursAgo: 26,
  },
  {
    channel: 'internal',
    direction: 'outbound',
    senderIndex: 0,
    recipientIndex: 5,
    subject: 'Lab pickup',
    body: 'Precision Dental are collecting at 5pm — please have the three impression boxes ready at reception.',
    category: 'lab',
    isRead: true,
    sentAtHoursAgo: 30,
  },
  {
    channel: 'email',
    direction: 'outbound',
    patientIndex: 21,
    subject: 'Outstanding balance — INV-2024-0043',
    body: 'A gentle reminder that Rs 11,000 remains outstanding on your last treatment. You can settle at reception or by bank transfer.',
    category: 'billing',
    isRead: true,
    sentAtHoursAgo: 50,
  },
  {
    channel: 'whatsapp',
    direction: 'inbound',
    patientIndex: 30,
    body: 'Is Dr. Hina available on Saturday for my braces adjustment?',
    category: 'general',
    isRead: false,
    sentAtHoursAgo: 6,
  },
];

export const settings = {
  key: 'clinic',
  clinic: {
    name: 'Vanguard Dental Studio',
    tagline: 'Precision dentistry, unhurried care',
    phone: '+92 300 1234567',
    email: 'front-desk@vanguarddental.pk',
    address: '24-C Khayaban-e-Shahbaz, DHA Phase VI, Karachi',
    registrationNo: 'PMDC-DEN-44821',
  },
  locale: { currency: 'PKR', currencySymbol: 'Rs', timezone: 'Asia/Karachi', dateFormat: 'DD MMM YYYY', weekStartsOn: 1 },
  scheduling: { slotMinutes: 15, dayStart: '09:00', dayEnd: '19:00', chairs, bufferMinutes: 5 },
  notifications: {
    appointmentReminders: true,
    reminderLeadHours: 24,
    recallCampaigns: true,
    labDueAlerts: true,
    lowStockAlerts: false,
    channel: 'whatsapp',
  },
  billing: { taxRate: 0, invoicePrefix: 'INV', paymentTermsDays: 7, footerNote: 'Thank you for trusting us with your smile.' },
};

export const DEMO_CREDENTIALS = { email: users[0].email, password: users[0].password };

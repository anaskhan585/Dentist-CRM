export const APPOINTMENT_STATUS = {
  scheduled: { label: 'Scheduled', tone: 'neutral' },
  confirmed: { label: 'Confirmed', tone: 'pine' },
  'in-progress': { label: 'In chair', tone: 'gold' },
  completed: { label: 'Completed', tone: 'moss' },
  cancelled: { label: 'Cancelled', tone: 'rose' },
  'no-show': { label: 'No show', tone: 'clay' },
};

export const LAB_STAGES = [
  { key: 'impression-taken', label: 'Impression taken', hint: 'Waiting to go out' },
  { key: 'sent-to-lab', label: 'Sent to lab', hint: 'With the courier' },
  { key: 'in-fabrication', label: 'In fabrication', hint: 'Being made' },
  { key: 'trial-fitting', label: 'Trial fitting', hint: 'Try-in booked' },
  { key: 'received', label: 'Received', hint: 'Back in the practice' },
  { key: 'delivered', label: 'Delivered', hint: 'Fitted and closed' },
];

export const INVOICE_STATUS = {
  draft: { label: 'Draft', tone: 'neutral' },
  unpaid: { label: 'Unpaid', tone: 'rose' },
  partial: { label: 'Part paid', tone: 'gold' },
  paid: { label: 'Paid', tone: 'moss' },
  void: { label: 'Void', tone: 'neutral' },
};

export const RECORD_TYPES = {
  'clinical-note': { label: 'Clinical note', tone: 'pine' },
  diagnosis: { label: 'Diagnosis', tone: 'clay' },
  prescription: { label: 'Prescription', tone: 'plum' },
  'x-ray': { label: 'Radiograph', tone: 'sky' },
  'treatment-plan': { label: 'Treatment plan', tone: 'gold' },
  referral: { label: 'Referral', tone: 'neutral' },
};

export const TOOTH_STATUS = {
  healthy: { label: 'Healthy', colour: '#ffffff', ink: '#4c5a56' },
  caries: { label: 'Caries', colour: '#b5652f', ink: '#ffffff' },
  filled: { label: 'Filled', colour: '#3b6e96', ink: '#ffffff' },
  crown: { label: 'Crown', colour: '#a07a25', ink: '#ffffff' },
  'root-canal': { label: 'Root canal', colour: '#6b4c8a', ink: '#ffffff' },
  implant: { label: 'Implant', colour: '#14544a', ink: '#ffffff' },
  missing: { label: 'Missing', colour: '#d3cec2', ink: '#4c5a56' },
  watch: { label: 'Watch', colour: '#f0d68a', ink: '#4c5a56' },
};

export const ROLES = {
  admin: { label: 'Administrator', tone: 'pine' },
  dentist: { label: 'Dentist', tone: 'sky' },
  hygienist: { label: 'Hygienist', tone: 'moss' },
  receptionist: { label: 'Front desk', tone: 'gold' },
};

export const TREATMENTS = [
  'Consultation',
  'Scaling & Polishing',
  'Composite Filling',
  'Root Canal',
  'Crown Fitting',
  'Extraction',
  'Implant',
  'Orthodontic Adjustment',
  'Teeth Whitening',
  'Denture Fitting',
  'Follow-up',
];

export const WORK_TYPES = ['Crown', 'Bridge', 'Veneer', 'Denture', 'Night Guard', 'Aligner', 'Inlay/Onlay', 'Post & Core'];

/* FDI notation, laid out as the dentist sees the mouth. */
export const UPPER_RIGHT = [18, 17, 16, 15, 14, 13, 12, 11];
export const UPPER_LEFT = [21, 22, 23, 24, 25, 26, 27, 28];
export const LOWER_RIGHT = [48, 47, 46, 45, 44, 43, 42, 41];
export const LOWER_LEFT = [31, 32, 33, 34, 35, 36, 37, 38];

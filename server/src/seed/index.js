/**
 * Loads the demo clinic into MongoDB.
 *
 *   npm run seed             # wipes and reloads
 *   npm run seed -- --keep   # only seeds when the database is empty
 */
import { connectDatabase, disconnectDatabase } from '../config/db.js';
import { User } from '../models/User.js';
import { Patient } from '../models/Patient.js';
import { Appointment } from '../models/Appointment.js';
import { HealthRecord } from '../models/HealthRecord.js';
import { LabCase } from '../models/LabCase.js';
import { Invoice } from '../models/Invoice.js';
import { Message } from '../models/Message.js';
import { Settings } from '../models/Settings.js';
import * as data from './dataset.js';

const DAY = 24 * 60 * 60 * 1000;
const keepExisting = process.argv.includes('--keep');

async function run() {
  await connectDatabase();

  if (keepExisting && (await User.countDocuments())) {
    console.log('[seed] database already populated, skipping (--keep)');
    return;
  }

  console.log('[seed] clearing collections');
  await Promise.all([
    User.deleteMany({}),
    Patient.deleteMany({}),
    Appointment.deleteMany({}),
    HealthRecord.deleteMany({}),
    LabCase.deleteMany({}),
    Invoice.deleteMany({}),
    Message.deleteMany({}),
    Settings.deleteMany({}),
  ]);

  // create() runs the pre-save hooks, so passwords get hashed properly.
  const createdUsers = await User.create(data.users);
  console.log(`[seed] ${createdUsers.length} team members`);

  const now = Date.now();
  const createdPatients = await Patient.create(
    data.patients.map((patient) => ({
      ...patient,
      primaryDentist: createdUsers[patient.dentistIndex]._id,
      lastVisitAt: patient.lastVisitOffsetDays ? new Date(now + patient.lastVisitOffsetDays * DAY) : undefined,
      createdAt: new Date(now + patient.createdAtOffsetDays * DAY),
    }))
  );
  console.log(`[seed] ${createdPatients.length} patients`);

  const createdAppointments = await Appointment.create(
    data.appointments.map((appointment) => ({
      ...appointment,
      patient: createdPatients[appointment.patientIndex]._id,
      dentist: createdUsers[appointment.dentistIndex]._id,
      createdBy: createdUsers[data.FRONT_DESK_INDEX]._id,
    }))
  );
  console.log(`[seed] ${createdAppointments.length} appointments`);

  await HealthRecord.create(
    data.healthRecords.map((record) => ({
      ...record,
      patient: createdPatients[record.patientIndex]._id,
      author: createdUsers[record.authorIndex]._id,
      recordedAt: new Date(now + record.recordedAtOffsetDays * DAY),
    }))
  );
  console.log(`[seed] ${data.healthRecords.length} health records`);

  await LabCase.create(
    data.labCases.map((labCase) => ({
      ...labCase,
      patient: createdPatients[labCase.patientIndex]._id,
      dentist: createdUsers[labCase.dentistIndex]._id,
      sentAt: labCase.sentAtOffset ? new Date(now + labCase.sentAtOffset * DAY) : undefined,
      history: [{ stage: labCase.stage, at: new Date(now - 3 * DAY), by: createdUsers[labCase.dentistIndex]._id }],
    }))
  );
  console.log(`[seed] ${data.labCases.length} lab cases`);

  const createdInvoices = await Invoice.create(
    data.invoices.map((invoice) => ({
      ...invoice,
      patient: createdPatients[invoice.patientIndex]._id,
      dentist: createdUsers[invoice.dentistIndex]._id,
      issuedAt: new Date(now + invoice.issuedAtOffsetDays * DAY),
      paidAt: invoice.status === 'paid' ? new Date(now + invoice.issuedAtOffsetDays * DAY) : undefined,
    }))
  );
  console.log(`[seed] ${createdInvoices.length} invoices`);

  // Roll outstanding balances back onto the patient records.
  const balances = new Map();
  for (const invoice of createdInvoices) {
    if (!['unpaid', 'partial'].includes(invoice.status)) continue;
    const key = invoice.patient.toString();
    balances.set(key, (balances.get(key) ?? 0) + invoice.balance);
  }
  await Promise.all(
    [...balances.entries()].map(([id, balance]) =>
      Patient.findByIdAndUpdate(id, { balance: Math.round(balance * 100) / 100 })
    )
  );

  await Message.create(
    data.messages.map((message) => ({
      ...message,
      sender: message.senderIndex !== undefined ? createdUsers[message.senderIndex]._id : undefined,
      recipientUser: message.recipientIndex !== undefined ? createdUsers[message.recipientIndex]._id : undefined,
      patient: message.patientIndex !== undefined ? createdPatients[message.patientIndex]._id : undefined,
      thread:
        message.patientIndex !== undefined
          ? `patient:${createdPatients[message.patientIndex]._id}`
          : `user:${message.senderIndex}:${message.recipientIndex}`,
      sentAt: new Date(now - message.sentAtHoursAgo * 3600000),
    }))
  );
  console.log(`[seed] ${data.messages.length} messages`);

  await Settings.create(data.settings);

  console.log('\n[seed] done — sign in with:');
  console.log(`       ${data.DEMO_CREDENTIALS.email} / ${data.DEMO_CREDENTIALS.password}\n`);
}

run()
  .catch((error) => {
    console.error('[seed] failed:', error);
    process.exitCode = 1;
  })
  .finally(() => disconnectDatabase());

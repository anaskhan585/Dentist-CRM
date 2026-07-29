import { Appointment } from '../models/Appointment.js';
import { Patient } from '../models/Patient.js';
import { Invoice } from '../models/Invoice.js';
import { LabCase } from '../models/LabCase.js';
import { Message } from '../models/Message.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { dayRange } from '../utils/query.js';

function startOfDay(offsetDays = 0) {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() + offsetDays);
  return date;
}

/** Percentage change, guarding the divide-by-zero case sensibly. */
function trend(current, previous) {
  if (!previous) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / previous) * 1000) / 10;
}

async function revenueBetween(from, to) {
  const [result] = await Invoice.aggregate([
    { $match: { status: { $in: ['paid', 'partial'] }, issuedAt: { $gte: from, $lt: to } } },
    { $group: { _id: null, total: { $sum: '$amountPaid' } } },
  ]);
  return result?.total ?? 0;
}

export const getOverview = asyncHandler(async (_req, res) => {
  const { start: todayStart, end: todayEnd } = dayRange();
  const yesterdayStart = startOfDay(-1);
  const monthStart = new Date(todayStart.getFullYear(), todayStart.getMonth(), 1);
  const lastMonthStart = new Date(todayStart.getFullYear(), todayStart.getMonth() - 1, 1);

  const [
    totalPatients,
    patientsLastMonth,
    todayAppointments,
    yesterdayAppointments,
    monthRevenue,
    lastMonthRevenue,
    outstanding,
    activeLabCases,
    overdueLabCases,
    unreadMessages,
    statusBreakdown,
    upcoming,
    recentPatients,
  ] = await Promise.all([
    Patient.countDocuments({ status: 'active' }),
    Patient.countDocuments({ status: 'active', createdAt: { $lt: monthStart } }),
    Appointment.countDocuments({ startAt: { $gte: todayStart, $lt: todayEnd } }),
    Appointment.countDocuments({ startAt: { $gte: yesterdayStart, $lt: todayStart } }),
    revenueBetween(monthStart, todayEnd),
    revenueBetween(lastMonthStart, monthStart),
    Invoice.aggregate([
      { $match: { status: { $in: ['unpaid', 'partial'] } } },
      { $unwind: { path: '$items', preserveNullAndEmptyArrays: true } },
      {
        $group: {
          _id: '$_id',
          taxRate: { $first: '$taxRate' },
          amountPaid: { $first: '$amountPaid' },
          subtotal: {
            $sum: {
              $subtract: [{ $multiply: ['$items.quantity', '$items.unitPrice'] }, { $ifNull: ['$items.discount', 0] }],
            },
          },
        },
      },
      {
        $group: {
          _id: null,
          total: {
            $sum: {
              $subtract: [
                { $multiply: ['$subtotal', { $add: [1, { $divide: ['$taxRate', 100] }] }] },
                '$amountPaid',
              ],
            },
          },
        },
      },
    ]),
    LabCase.countDocuments({ stage: { $nin: ['delivered'] } }),
    LabCase.countDocuments({ stage: { $nin: ['received', 'delivered'] }, dueAt: { $lt: new Date() } }),
    Message.countDocuments({ isRead: false }),
    Appointment.aggregate([
      { $match: { startAt: { $gte: todayStart, $lt: todayEnd } } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]),
    Appointment.find({ startAt: { $gte: todayStart, $lt: todayEnd } })
      .populate('patient', 'firstName lastName phone fileNo')
      .populate('dentist', 'name colour avatarInitials')
      .sort('startAt')
      .limit(8)
      .lean({ virtuals: true }),
    Patient.find({ status: 'active' }).sort('-createdAt').limit(5).select('firstName lastName fileNo createdAt phone').lean({ virtuals: true }),
  ]);

  res.json({
    success: true,
    data: {
      stats: {
        totalPatients: { value: totalPatients, trend: trend(totalPatients, patientsLastMonth) },
        todayAppointments: { value: todayAppointments, trend: trend(todayAppointments, yesterdayAppointments) },
        monthRevenue: { value: Math.round(monthRevenue), trend: trend(monthRevenue, lastMonthRevenue) },
        outstanding: { value: Math.round(outstanding[0]?.total ?? 0), trend: 0 },
        activeLabCases,
        overdueLabCases,
        unreadMessages,
      },
      statusBreakdown: Object.fromEntries(statusBreakdown.map((entry) => [entry._id, entry.count])),
      upcoming,
      recentPatients,
    },
  });
});

/** Daily revenue + appointment counts for the dashboard charts. */
export const getActivity = asyncHandler(async (req, res) => {
  const days = Math.min(90, Math.max(7, Number(req.query.days) || 14));
  const from = startOfDay(-(days - 1));
  const to = startOfDay(1);

  const [revenue, appointments] = await Promise.all([
    Invoice.aggregate([
      { $match: { issuedAt: { $gte: from, $lt: to }, status: { $in: ['paid', 'partial'] } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$issuedAt' } },
          value: { $sum: '$amountPaid' },
        },
      },
    ]),
    Appointment.aggregate([
      { $match: { startAt: { $gte: from, $lt: to } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$startAt' } },
          value: { $sum: 1 },
          completed: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } },
        },
      },
    ]),
  ]);

  const revenueByDay = Object.fromEntries(revenue.map((entry) => [entry._id, entry.value]));
  const apptByDay = Object.fromEntries(appointments.map((entry) => [entry._id, entry]));

  const series = Array.from({ length: days }, (_, index) => {
    const date = startOfDay(-(days - 1) + index);
    const key = date.toISOString().slice(0, 10);
    return {
      date: key,
      revenue: Math.round(revenueByDay[key] ?? 0),
      appointments: apptByDay[key]?.value ?? 0,
      completed: apptByDay[key]?.completed ?? 0,
    };
  });

  res.json({ success: true, data: series });
});

export const getReports = asyncHandler(async (req, res) => {
  const from = req.query.from ? new Date(req.query.from) : new Date(new Date().getFullYear(), new Date().getMonth() - 5, 1);
  const to = req.query.to ? new Date(req.query.to) : startOfDay(1);

  const [monthlyRevenue, treatmentMix, dentistLoad, statusMix, newPatients, paymentMix] = await Promise.all([
    Invoice.aggregate([
      { $match: { issuedAt: { $gte: from, $lt: to }, status: { $ne: 'void' } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m', date: '$issuedAt' } },
          collected: { $sum: '$amountPaid' },
          invoices: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]),
    Appointment.aggregate([
      { $match: { startAt: { $gte: from, $lt: to } } },
      { $group: { _id: '$treatment', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 8 },
    ]),
    Appointment.aggregate([
      { $match: { startAt: { $gte: from, $lt: to } } },
      { $group: { _id: '$dentist', appointments: { $sum: 1 }, minutes: { $sum: '$durationMinutes' } } },
      { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'dentist' } },
      { $unwind: '$dentist' },
      {
        $project: {
          name: '$dentist.name',
          colour: '$dentist.colour',
          initials: '$dentist.avatarInitials',
          appointments: 1,
          hours: { $round: [{ $divide: ['$minutes', 60] }, 1] },
        },
      },
      { $sort: { appointments: -1 } },
    ]),
    Appointment.aggregate([
      { $match: { startAt: { $gte: from, $lt: to } } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]),
    Patient.aggregate([
      { $match: { createdAt: { $gte: from, $lt: to } } },
      { $group: { _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]),
    Invoice.aggregate([
      { $match: { issuedAt: { $gte: from, $lt: to }, status: { $in: ['paid', 'partial'] } } },
      { $group: { _id: '$paymentMethod', total: { $sum: '$amountPaid' } } },
      { $sort: { total: -1 } },
    ]),
  ]);

  res.json({
    success: true,
    data: { range: { from, to }, monthlyRevenue, treatmentMix, dentistLoad, statusMix, newPatients, paymentMix },
  });
});

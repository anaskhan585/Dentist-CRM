import { Router } from 'express';
import authRoutes from './auth.routes.js';
import patientRoutes from './patient.routes.js';
import appointmentRoutes from './appointment.routes.js';
import healthRecordRoutes from './healthRecord.routes.js';
import labCaseRoutes from './labCase.routes.js';
import userRoutes from './user.routes.js';
import messageRoutes from './message.routes.js';
import invoiceRoutes from './invoice.routes.js';
import settingsRoutes from './settings.routes.js';
import dashboardRoutes from './dashboard.routes.js';

const router = Router();

router.get('/health', (_req, res) => res.json({ success: true, uptime: process.uptime() }));
router.use('/auth', authRoutes);
router.use('/patients', patientRoutes);
router.use('/appointments', appointmentRoutes);
router.use('/health-records', healthRecordRoutes);
router.use('/lab-cases', labCaseRoutes);
router.use('/users', userRoutes);
router.use('/messages', messageRoutes);
router.use('/invoices', invoiceRoutes);
router.use('/settings', settingsRoutes);
router.use('/dashboard', dashboardRoutes);

export default router;

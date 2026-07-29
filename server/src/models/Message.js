import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema(
  {
    channel: {
      type: String,
      enum: ['internal', 'sms', 'whatsapp', 'email'],
      default: 'internal',
    },
    direction: { type: String, enum: ['inbound', 'outbound'], default: 'outbound' },
    subject: { type: String, trim: true },
    body: { type: String, required: true, trim: true },
    // Either a colleague (internal) or a patient (sms/whatsapp/email).
    sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    recipientUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    patient: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient' },
    thread: { type: String, index: true },
    category: {
      type: String,
      enum: ['general', 'appointment-reminder', 'recall', 'billing', 'lab', 'urgent'],
      default: 'general',
    },
    isRead: { type: Boolean, default: false },
    isStarred: { type: Boolean, default: false },
    sentAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

messageSchema.index({ sentAt: -1 });
messageSchema.index({ isRead: 1, sentAt: -1 });

export const Message = mongoose.model('Message', messageSchema);

import mongoose from 'mongoose';

const lineItemSchema = new mongoose.Schema(
  {
    description: { type: String, required: true, trim: true },
    tooth: Number,
    quantity: { type: Number, default: 1, min: 1 },
    unitPrice: { type: Number, required: true, min: 0 },
    discount: { type: Number, default: 0, min: 0 },
  },
  { _id: false }
);

lineItemSchema.virtual('total').get(function total() {
  return this.quantity * this.unitPrice - this.discount;
});

const invoiceSchema = new mongoose.Schema(
  {
    invoiceNo: { type: String, required: true, unique: true, trim: true },
    patient: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true },
    dentist: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    appointment: { type: mongoose.Schema.Types.ObjectId, ref: 'Appointment' },
    items: { type: [lineItemSchema], default: [] },
    taxRate: { type: Number, default: 0 },
    amountPaid: { type: Number, default: 0 },
    status: { type: String, enum: ['draft', 'unpaid', 'partial', 'paid', 'void'], default: 'unpaid' },
    paymentMethod: { type: String, enum: ['cash', 'card', 'bank-transfer', 'insurance', 'other'] },
    issuedAt: { type: Date, default: Date.now },
    dueAt: { type: Date },
    paidAt: { type: Date },
    notes: { type: String, trim: true },
  },
  { timestamps: true }
);

invoiceSchema.virtual('subtotal').get(function subtotal() {
  return this.items.reduce((sum, item) => sum + item.quantity * item.unitPrice - item.discount, 0);
});

invoiceSchema.virtual('total').get(function total() {
  return Math.round(this.subtotal * (1 + this.taxRate / 100) * 100) / 100;
});

invoiceSchema.virtual('balance').get(function balance() {
  return Math.round((this.total - this.amountPaid) * 100) / 100;
});

invoiceSchema.index({ status: 1, issuedAt: -1 });
invoiceSchema.index({ patient: 1, issuedAt: -1 });

invoiceSchema.set('toJSON', { virtuals: true });
invoiceSchema.set('toObject', { virtuals: true });

export const Invoice = mongoose.model('Invoice', invoiceSchema);

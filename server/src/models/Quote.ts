import mongoose from 'mongoose'

const QuoteSchema = new mongoose.Schema(
  {
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    fullName: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    eventDate: { type: String, required: true },
    eventEndDate: { type: String, default: '' },
    cityOrArea: { type: String, default: '' },
    trailerType: { type: String, required: true },
    message: { type: String, default: '' },
    wantsAnotherDate: { type: Boolean, default: false },
    paidDownpayment: { type: Boolean, default: false },
    paidFully: { type: Boolean, default: false },
    answered: { type: Boolean, default: false },
    answeredAt: { type: Date, default: null },
  },
  { timestamps: true },
)

export const Quote = mongoose.model('Quote', QuoteSchema)

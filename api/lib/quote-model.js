import mongoose from 'mongoose'

const QuoteSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true },
    email: { type: String, default: '' },
    eventDate: { type: String, required: true },
    cityOrArea: { type: String, required: true },
    trailerType: { type: String, required: true },
    message: { type: String, default: '' },
  },
  { timestamps: true },
)

export const Quote = mongoose.models.Quote || mongoose.model('Quote', QuoteSchema)

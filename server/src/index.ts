import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import mongoose from 'mongoose'
import quoteRoutes from './routes/quote'

dotenv.config()

const app = express()
const port = process.env.PORT ? Number(process.env.PORT) : 8080

app.use(cors())
app.use(express.json())

app.get('/api/health', (_req, res) => {
  res.json({ ok: true })
})

app.use('/api/quote', quoteRoutes)

const start = async () => {
  const uri = process.env.MONGODB_URI
  if (uri) {
    try {
      await mongoose.connect(uri)
      console.log('MongoDB connected')
    } catch (error) {
      console.error('MongoDB connection failed, continuing without DB', error)
    }
  } else {
    console.warn('MONGODB_URI is not set, continuing without DB')
  }

  app.listen(port, () => {
    console.log(`Server listening on ${port}`)
  })
}

start().catch((error) => {
  console.error('Server failed to start', error)
  process.exit(1)
})

import mongoose from 'mongoose'

let cached = globalThis.__mongooseCache

if (!cached) {
  cached = globalThis.__mongooseCache = { conn: null, promise: null }
}

export async function connectToDatabase() {
  const uri = process.env.MONGODB_URI
  if (!uri) {
    throw new Error('MONGODB_URI is not set')
  }

  if (cached.conn) {
    return cached.conn
  }

  if (!cached.promise) {
    cached.promise = mongoose
      .connect(uri, { serverSelectionTimeoutMS: 3000 })
      .then((connection) => connection)
  }

  cached.conn = await cached.promise
  return cached.conn
}

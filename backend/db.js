// Example MongoDB helper using Mongoose for future use.
// Install mongoose and set MONGODB_URI / MONGODB_DB_NAME before requiring this module.
const mongoose = require('mongoose');

let cachedConn = null;

async function connect() {
  if (cachedConn) {
    return cachedConn;
  }

  if (!process.env.MONGODB_URI) {
    throw new Error('Missing MONGODB_URI environment variable');
  }

  const connection = await mongoose.connect(process.env.MONGODB_URI, {
    dbName: process.env.MONGODB_DB_NAME
  });

  cachedConn = connection;
  return connection;
}

module.exports = {
  connect,
  mongoose
};

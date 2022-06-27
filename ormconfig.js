const dotenv = require('dotenv');
dotenv.config();

module.exports = {
  type: 'mysql',
  host: process.env.DB_HOST,
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  migrations: ['dist/src/config/migration/*.js'],
  cli: {
    migrationsDir: 'src/config/migration',
  },
};

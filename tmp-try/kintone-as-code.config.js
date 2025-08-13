import dotenv from 'dotenv';
dotenv.config();

export default {
  default: 'production',
  environments: {
    production: {
      auth: {
        baseUrl: process.env.KINTONE_BASE_URL,
        username: process.env.KINTONE_USERNAME,
        password: process.env.KINTONE_PASSWORD,
        // or use API token
        // apiToken: process.env.KINTONE_API_TOKEN,
      }
    },
    development: {
      auth: {
        baseUrl: process.env.KINTONE_DEV_BASE_URL || process.env.KINTONE_BASE_URL,
        username: process.env.KINTONE_DEV_USERNAME || process.env.KINTONE_USERNAME,
        password: process.env.KINTONE_DEV_PASSWORD || process.env.KINTONE_PASSWORD,
        // or use API token
        // apiToken: process.env.KINTONE_DEV_API_TOKEN,
      }
    }
  }
};
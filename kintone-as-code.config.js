export default {
  default: 'development',
  environments: {
    production: {
      auth: {
        baseUrl: process.env.KINTONE_BASE_URL,
        username: process.env.KINTONE_USERNAME,
        password: process.env.KINTONE_PASSWORD,
      },
    },
    development: {
      auth: {
        baseUrl: process.env.KINTONE_DEV_BASE_URL,
        username: process.env.KINTONE_DEV_USERNAME,
        password: process.env.KINTONE_DEV_PASSWORD,
      },
    },
  },
};

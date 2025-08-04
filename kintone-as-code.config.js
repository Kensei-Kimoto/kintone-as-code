export default {
  default: 'development',
  environments: {
    production: {
      auth: {
        baseUrl: process.env.KINTONE_BASEURL,
        username: process.env.KINTONE_USERNAME,
        password: process.env.KINTONE_PASSWORD,
        // or use API token
        // apiToken: process.env.KINTONE_API_TOKEN,
      },
    },
    development: {
      auth: {
        baseUrl: process.env.KINTONE_DEV_BASEURL,
        username: process.env.KINTONE_DEV_USERNAME,
        password: process.env.KINTONE_DEV_PASSWORD,
      },
    },
  },
};

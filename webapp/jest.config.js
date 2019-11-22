const preact = require('preact');
const HarmonyConf = require('./harmony-webapp.conf');

module.exports = {
  globals: {
    __h: preact.h,
    API_BASE_URL: HarmonyConf.API_BASE_URL
  },
  setupFilesAfterEnv: [
    "<rootDir>/test/setupTests.js"
  ],
  moduleNameMapper: {
    "\\.(sa|sc|c)ss$": "identity-obj-proxy",
    "\\.(ttf|otf|eot|svg|woff(2)?|png|jpg|mp4)$": "<rootDir>/test/__mocks__/fileMock.js"
  }
};

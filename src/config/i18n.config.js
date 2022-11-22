const i18n = require('i18n');
const path = require('path');
const i18nConfigFn = () => {
  i18n.configure({
    locales: ['en', 'vi'],
    defaultLocale: 'en',
    header: 'accept-language',
    queryParameter: 'lang',
    defaultLocale: 'en',
    directory: path.resolve(__dirname + '../../../locales'),
    directoryPermissions: 755,
    autoReload: true,
    updateFiles: true,
    api: {
      __: 't',
      __n: 'tn',
    },
  });
};

module.exports = i18nConfigFn;

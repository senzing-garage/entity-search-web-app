module.exports = {
  directives: {
    'default-src': [`'self'`],
    'connect-src': [`'self'`],
    'script-src':  [`'self'`, `'unsafe-eval'`],
    'style-src':   [`'self'`, `'unsafe-inline'`, 'https://fonts.googleapis.com'],
    'font-src':    [`'self'`, `https://fonts.gstatic.com`, `https://fonts.googleapis.com`]
  },
  reportOnly: false
}

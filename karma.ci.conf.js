// Karma configuration file, see link for more information
// https://karma-runner.github.io/1.0/config/configuration-file.html

module.exports = function (config) {
  config.set({
    basePath: '',
    frameworks: ['jasmine', '@angular-devkit/build-angular'],
    browserNoActivityTimeout: 120000,
    browserDisconnectTimeout: 60000,
    browserDisconnectTolerance: 3,
    plugins: [
      require('karma-jasmine'),
      require('karma-brief-reporter'),
      require('karma-chrome-launcher'),
      require('karma-jasmine-html-reporter'),
      require('karma-coverage-istanbul-reporter'),
      require('@angular-devkit/build-angular/plugins/karma'),
      require('karma-junit-reporter')
    ],
    client: {
      clearContext: false
    },
    coverageIstanbulReporter: {
      dir: require('path').join(__dirname, './coverage/example'),
      reports: ['html', 'lcovonly', 'text-summary'],
      fixWebpackSourcePaths: true
    },
    angularCli: {
      environment: 'dev'
    },
    reporters: ['progress', 'kjhtml', 'junit'],
    port: 9876,
    colors: true,
    autoWatch: false,
    logLevel: config.LOG_DISABLE,
    reporters: config.angularCli && config.angularCli.codeCoverage
              ? ['brief', 'coverage-istanbul', 'junit']
              : ['brief'],
    junitReporter: {
      outputDir: 'coverage/unit-test',
      outputFile: 'test-results.xml',
      useBrowserName: false
    },
    browsers: ['ChromeHeadless'],
    customLaunchers: {
      'ChromeHeadless': {
        base: 'Chrome',
        flags: [
          '--headless',
          '--disable-gpu',
          '--no-sandbox',
          '--disable-web-security',
          '--remote-debugging-port=9222'
        ]
      }
    },
    singleRun: true,
    restartOnFileChange: true
  });
};

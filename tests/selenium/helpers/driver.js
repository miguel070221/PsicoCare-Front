const { Builder, Capabilities } = require('selenium-webdriver');
const config = require('../config');

let driver = null;

async function createDriver() {
  if (driver) {
    return driver;
  }

  const capabilities = Capabilities.chrome();
  
  if (config.headless) {
    capabilities.set('goog:chromeOptions', {
      args: ['--headless', '--no-sandbox', '--disable-dev-shm-usage'],
    });
  }

  driver = await new Builder()
    .forBrowser(config.browser)
    .withCapabilities(capabilities)
    .build();

  // Configurar timeout
  await driver.manage().setTimeouts({
    implicit: config.timeout,
    pageLoad: config.timeout * 2,
    script: config.timeout * 2,
  });

  return driver;
}

async function quitDriver() {
  if (driver) {
    await driver.quit();
    driver = null;
  }
}

async function getDriver() {
  if (!driver) {
    return await createDriver();
  }
  return driver;
}

module.exports = {
  createDriver,
  quitDriver,
  getDriver,
};


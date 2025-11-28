const { until, By } = require('selenium-webdriver');
const { getDriver } = require('./driver');
const config = require('../config');

async function waitForElement(selector, timeout = config.timeout) {
  const driver = await getDriver();
  return await driver.wait(
    until.elementLocated(By.css(selector)),
    timeout,
    `Elemento não encontrado: ${selector}`
  );
}

async function waitForElementVisible(selector, timeout = config.timeout) {
  const driver = await getDriver();
  const element = await waitForElement(selector, timeout);
  return await driver.wait(
    until.elementIsVisible(element),
    timeout,
    `Elemento não visível: ${selector}`
  );
}

async function waitForElementClickable(selector, timeout = config.timeout) {
  const driver = await getDriver();
  const element = await waitForElement(selector, timeout);
  return await driver.wait(
    until.elementIsEnabled(element),
    timeout,
    `Elemento não clicável: ${selector}`
  );
}

async function waitForText(selector, text, timeout = config.timeout) {
  const driver = await getDriver();
  return await driver.wait(
    async () => {
      try {
        const element = await driver.findElement(By.css(selector));
        const elementText = await element.getText();
        return elementText.includes(text);
      } catch {
        return false;
      }
    },
    timeout,
    `Texto "${text}" não encontrado em ${selector}`
  );
}

module.exports = {
  waitForElement,
  waitForElementVisible,
  waitForElementClickable,
  waitForText,
};


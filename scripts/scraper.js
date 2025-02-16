// scraper.js
const { Builder, By, until } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');
const fs = require('fs').promises;

async function scrapeP(url) {
    let driver;

    try {
        const options = new chrome.Options();
        
        driver = await new Builder()
            .forBrowser('chrome')
            .setChromeOptions(options)
            .build();
        
        console.log(`accessing:${url}`);
        await driver.get(url);
        
        await driver.wait(until.elementLocated(By.css('p')), 10000);

        const paragraphs = await driver.findElements(By.css('p'));
        
        const texts = await Promise.all(
            paragraphs.map(p => p.getText())
        );
        
        const content = texts.filter(text => text.trim()).join('\n\n');
        
        await fs.writeFile('paragraphs.txt', content, 'utf8');
        console.log('saved to paragraphs.txt');
        
        return content;

    } catch (error) {
        console.error('error:', error);
        throw error;
    } finally {
        if (driver) {
            await driver.quit();
            console.log('session closed');
        }
    }
}

async function main() {
    const url = 'https://sm-wp2-dufgdjbuh8h3fqhs.australiaeast-01.azurewebsites.net/cyber-security-management-best-practices-for-australian-organisations/'; // 替换为你要爬取的网址
    try {
        const content = await scrapeP(url);
        console.log('content:\n', content);
    } catch (error) {
        console.error('error:', error);
    }
}

main();
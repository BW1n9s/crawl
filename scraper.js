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
        
        console.log(`访问网页：${url}`);
        await driver.get(url);
        
        // 等待至少一个 p 标签加载完成
        await driver.wait(until.elementLocated(By.css('p')), 10000);
        
        // 获取所有 p 标签
        const paragraphs = await driver.findElements(By.css('p'));
        
        // 提取所有 p 标签的文本
        const texts = await Promise.all(
            paragraphs.map(p => p.getText())
        );
        
        // 过滤空文本并合并
        const content = texts.filter(text => text.trim()).join('\n\n');
        
        // 保存到文件
        await fs.writeFile('paragraphs.txt', content, 'utf8');
        console.log('内容已保存到 paragraphs.txt');
        
        return content;

    } catch (error) {
        console.error('爬取出错:', error);
        throw error;
    } finally {
        if (driver) {
            await driver.quit();
            console.log('浏览器已关闭');
        }
    }
}

// 运行爬虫
async function main() {
    const url = 'https://sm-wp2-dufgdjbuh8h3fqhs.australiaeast-01.azurewebsites.net/cyber-security-management-best-practices-for-australian-organisations/'; // 替换为你要爬取的网址
    try {
        const content = await scrapeP(url);
        console.log('爬取的段落内容:\n', content);
    } catch (error) {
        console.error('运行失败:', error);
    }
}

main();
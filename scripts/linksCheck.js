const { Builder, By } = require('selenium-webdriver');
const { expect } = require('chai');
const fs = require('fs').promises;
const path = require('path');


let driver;

class LinkChecker {
    constructor(baseUrl) {
        this.baseUrl = baseUrl;
        this.visitedUrls = new Set();
        this.urlQueue = [];
        this.externalLinks = new Set();
        this.blogPosts = new Set(); // 使用Set避免重复
    }

    shouldSkipUrl(url) {
        if (!url) return true;
        
        const skipPatterns = [
            '/?pageid=',
            '#elementor-action',
            'popup%',
            '%3D',
            '%2F',
            '%3A',
            '%3F',
            '#'
        ];

        return skipPatterns.some(pattern => url.includes(pattern));
    }

    async checkBlogPage(url) {
        if (this.visitedUrls.has(url)) return;
        this.visitedUrls.add(url);
        
        console.log('\nChecking blog page:', url);
        await driver.get(url);
        await driver.sleep(1000);

        try {
            // 更新博文链接选择器
            const postElements = await driver.findElements(
                By.css('div[data-elementor-type="loop-item"] a.elementor-element')
            );

            for (const post of postElements) {
                try {
                    const href = await post.getAttribute('href');
                    const title = await post.getText();

                    if (href && !this.blogPosts.has(href)) {
                        this.blogPosts.add(href);
                        console.log(`✓ Found blog post: "${title}"`);
                    }
                } catch (error) {
                    console.error('Error processing blog post:', error.message);
                }
            }

            // 检查分页
            const nextPageLink = await driver.findElements(
                By.css('nav.elementor-pagination a.page-numbers.next')
            );

            if (nextPageLink.length > 0) {
                const nextUrl = await nextPageLink[0].getAttribute('href');
                // 只有当这个URL没有被访问过时才添加到队列
                if (!this.visitedUrls.has(nextUrl)) {
                    this.urlQueue.push(nextUrl);
                    console.log('Found next page:', nextUrl);
                }
            }

            // 获取所有页码链接
            const allPageLinks = await driver.findElements(
                By.css('nav.elementor-pagination a.page-numbers:not(.next):not(.prev)')
            );
            
            for (const pageLink of allPageLinks) {
                const pageUrl = await pageLink.getAttribute('href');
                if (!this.visitedUrls.has(pageUrl)) {
                    this.urlQueue.push(pageUrl);
                    console.log('Added page to queue:', pageUrl);
                }
            }

        } catch (error) {
            console.error('Error processing blog page:', error.message);
        }
    }

    async checkRegularPage(url) {
        if (this.shouldSkipUrl(url) || this.visitedUrls.has(url)) return;
        this.visitedUrls.add(url);

        console.log(`\nChecking regular page: ${url}`);
        await driver.get(url);
        await driver.sleep(1000);

        const links = await driver.findElements(By.css('a'));
        for (const link of links) {
            try {
                const href = await link.getAttribute('href');
                if (!href || href.startsWith('#')) continue;
                if (this.shouldSkipUrl(href)) continue;

                const linkText = await link.getText();
                
                if (href.startsWith('http') && !href.startsWith(this.baseUrl)) {
                    // 为外部链接创建唯一标识
                    const linkIdentifier = JSON.stringify({
                        url: href,
                        text: linkText
                    });
                    
                    if (!this.externalLinks.has(linkIdentifier)) {
                        this.externalLinks.add(linkIdentifier);
                        const location = await link.getRect();
                        const pageTitle = await driver.getTitle();
                        // 存储完整信息
                        this.externalLinks.add(JSON.stringify({
                            text: linkText,
                            url: href,
                            sourceUrl: url,
                            pageTitle: pageTitle,
                            location: {
                                x: location.x,
                                y: location.y
                            }
                        }));
                    }
                } else if (href.startsWith(this.baseUrl)) {
                    const normalizedUrl = href.endsWith('/') ? href.slice(0, -1) : href;
                    if (!this.visitedUrls.has(normalizedUrl) && !this.shouldSkipUrl(normalizedUrl)) {
                        this.urlQueue.push(normalizedUrl);
                    }
                }
            } catch (error) {
                console.error('Error processing link:', error.message);
            }
        }
    }

    async processNextUrl() {
        if (this.urlQueue.length === 0) return false;
        
        const url = this.urlQueue.shift();
        if (this.shouldSkipUrl(url)) return this.urlQueue.length > 0;

        if (url.includes('/blog') || url.includes('/blogs/')) {
            await this.checkBlogPage(url);
        } else if (!url.includes('/author/') && !url.includes('/tag/')) {
            await this.checkRegularPage(url);
        }
        return this.urlQueue.length > 0;
    }

    async generateReport() {
        const externalLinksArray = Array.from(this.externalLinks).map(link => JSON.parse(link));
        const blogPostsArray = Array.from(this.blogPosts);

        console.log('\n=== Link Verification Report ===');
        console.log(`Total pages visited: ${this.visitedUrls.size}`);
        console.log(`Total external links found: ${externalLinksArray.length}`);
        console.log(`Total blog posts found: ${blogPostsArray.length}`);

        const report = {
            timestamp: new Date().toISOString(),
            summary: {
                totalPagesVisited: this.visitedUrls.size,
                totalExternalLinks: externalLinksArray.length,
                totalBlogPosts: blogPostsArray.length
            },
            blogPosts: blogPostsArray.map(url => ({
                url,
                title: url.split('/').pop().replace(/-/g, ' ') // 从 URL 提取标题
            })),
            externalLinks: externalLinksArray
        };

        // 创建报告文件名
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const reportFileName = `link-verification-report-${timestamp}.json`;
        const reportPath = path.join(process.cwd(), reportFileName);

        try {
            await fs.writeFile(
                reportPath,
                JSON.stringify(report, null, 2),
                'utf8'
            );

            console.log(`\nReport has been saved to: ${reportPath}`);

            // 生成简要的文本报告
            const summaryReport = [
                '=== Link Verification Summary ===',
                `Time: ${new Date().toLocaleString()}`,
                `Total Pages Visited: ${this.visitedUrls.size}`,
                `Total External Links: ${externalLinksArray.length}`,
                `Total Blog Posts: ${blogPostsArray.length}`,
                '\nBlog Posts:',
                ...blogPostsArray.map(url => `- ${url}`),
                '\nExternal Links:',
                ...externalLinksArray.map(link => 
                    `- ${link.text || 'No Text'} -> ${link.url}`
                ),
            ].join('\n');

            const summaryFileName = `link-verification-summary-${timestamp}.txt`;
            const summaryPath = path.join(process.cwd(), summaryFileName);
            
            await fs.writeFile(summaryPath, summaryReport, 'utf8');
            
            console.log(`Summary report has been saved to: ${summaryPath}`);

        } catch (error) {
            console.error('Error saving report:', error);
            console.log('\nReport Data (file save failed):');
            console.log(JSON.stringify(report, null, 2));
        }
    }
}

async function runLinkCheck() {
    try {
        driver = await new Builder().forBrowser('chrome').build();
        await driver.manage().window().maximize();

        const checker = new LinkChecker('https://sm-wp2-dufgdjbuh8h3fqhs.australiaeast-01.azurewebsites.net');
        checker.urlQueue.push(checker.baseUrl);

        while (await checker.processNextUrl()) {
            // 继续处理队列中的URL
        }

        await checker.generateReport();
        console.log('\n=== Link verification completed successfully! ===');

    } catch (error) {
        console.error('Test failed:', error);
        throw error;
    } finally {
        if (driver) {
            await driver.quit();
        }
    }
}

if (require.main === module) {
    runLinkCheck().catch(console.error);
}

module.exports = {
    runLinkCheck
};
const { Builder, By } = require('selenium-webdriver');
const fs = require('fs').promises;
const path = require('path');

let driver;

class LinkChecker {
    constructor(baseUrl) {
        this.baseUrl = baseUrl;
        this.visitedUrls = new Set();
        this.urlQueue = [];
        this.externalLinks = new Set();
        this.blogPosts = new Map(); // Map to store URL and title
        this.socialLinks = new Set(); // Store social media links
    }

    shouldSkipUrl(url) {
        if (!url) return true;
        
        const skipPatterns = [
            '/?pageid=', '#elementor-action', 'popup%', '%3D',
            '%2F', '%3A', '%3F', '#'
        ];

        return skipPatterns.some(pattern => url.includes(pattern));
    }

    isSocialLink(url) {
        const socialPatterns = [
            'facebook.com', 'twitter.com', 'linkedin.com',
            'instagram.com', 'youtube.com'
        ];
        return socialPatterns.some(pattern => url.includes(pattern));
    }

    async checkBlogPage(url) {
        if (this.visitedUrls.has(url)) return;
        this.visitedUrls.add(url);
        
        console.log('\nChecking blog page:', url);
        await driver.get(url);
        await driver.sleep(1000);

        try {
            const postElements = await driver.findElements(
                By.css('div[data-elementor-type="loop-item"] a.elementor-element')
            );

            for (const post of postElements) {
                try {
                    const href = await post.getAttribute('href');
                    if (!href) continue;
                    const textContent = await post.getText();



                    if (!this.blogPosts.has(href)) {
                        this.blogPosts.set(href, textContent);
                        console.log(`✓ Found blog post: "${textContent}"`);
                    }
                } catch (error) {
                    console.error('Error processing blog post:', error.message);
                }
            }

            // check if there is a next page
            const nextPageLink = await driver.findElements(
                By.css('nav.elementor-pagination a.page-numbers.next')
            );

            if (nextPageLink.length > 0) {
                const nextUrl = await nextPageLink[0].getAttribute('href');
                // adding to queue if not visited
                if (!this.visitedUrls.has(nextUrl)) {
                    this.urlQueue.push(nextUrl);
                    console.log('Found next page:', nextUrl);
                }
            }

            // aquiring all page links
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

                if (href.startsWith('http') && !href.startsWith(this.baseUrl)) {
                    if (this.isSocialLink(href)) {
                        this.socialLinks.add(href);
                        continue;
                    }
                    const linkText = await link.getText();
                    const linkIdentifier = JSON.stringify({ url: href, text: linkText });
                    if (!this.externalLinks.has(linkIdentifier)) {
                        this.externalLinks.add(linkIdentifier);
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

    async generateReport() {
        const externalLinksArray = Array.from(this.externalLinks)
            .map(link => JSON.parse(link))
            .filter(link => !this.isSocialLink(link.url));
        const blogPostsArray = Array.from(this.blogPosts);

        console.log('\n=== Link Verification Report ===');
        console.log(`Total pages visited: ${this.visitedUrls.size}`);
        console.log(`Total external links found: ${externalLinksArray.length}`);
        console.log(`Total blog posts found: ${this.blogPosts.size}`);
        console.log(`Total social links found: ${this.socialLinks.size}`);

        const report = {
            timestamp: new Date().toISOString(),
            summary: {
                totalPagesVisited: this.visitedUrls.size,
                totalExternalLinks: externalLinksArray.length,
                totalBlogPosts: this.blogPosts.size,
                totalSocialLinks: this.socialLinks.size
            },
            blogPosts: Array.from(this.blogPosts, ([url, title]) => ({ url, title })),
            externalLinks: externalLinksArray,
            socialLinks: Array.from(this.socialLinks)
        };

        const summaryReport = [
            '=== Link Verification Summary ===',
            `Time: ${new Date().toLocaleString()}`,
            `Total Pages Visited: ${this.visitedUrls.size}`,
            `Total External Links: ${externalLinksArray.length}`,
            `Total Blog Posts: ${blogPostsArray.length}`,
            '\nBlog Posts:',
            ...blogPostsArray.map(url => `- ${url}`),
            '\nBlog Posts Content:',
            ...blogPostsArray.map((textContent) => `- ${textContent}`),
            '\nExternal Links:',
            ...externalLinksArray.map(link => 
                `- ${link.text || 'No Text'} -> ${link.url}`
            ),
        ].join('\n');

        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const reportFileName = `link-verification-report-${timestamp}.json`;
        const reportPath = path.join(process.cwd(), reportFileName);
        const summaryFileName = `link-verification-summary-${timestamp}.txt`;
        const summaryPath = path.join(process.cwd(), summaryFileName);

        try {
            await fs.writeFile(reportPath, JSON.stringify(report, null, 2), 'utf8');
            console.log(`\nReport has been saved to: ${reportPath}`);
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

        // const checker = new LinkChecker('https://sm-wp2-dufgdjbuh8h3fqhs.australiaeast-01.azurewebsites.net');
        const checker = new LinkChecker('https://www.securemation.com');
        checker.urlQueue.push(checker.baseUrl);

        while (checker.urlQueue.length > 0) {
            const url = checker.urlQueue.shift();
            if (url.includes('/blog') || url.includes('/blogs/')) {
                await checker.checkBlogPage(url);
            } else {
                await checker.checkRegularPage(url);
            }
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

module.exports = { runLinkCheck };

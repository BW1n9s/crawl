const { Builder, By, until, Actions } = require('selenium-webdriver');
const { expect } = require('chai');

async function testNavigation() {
    let driver;

    try {
        driver = await new Builder().forBrowser('chrome').build();
        await driver.manage().window().maximize();
        await driver.get('https://sm-wp2-dufgdjbuh8h3fqhs.australiaeast-01.azurewebsites.net/'); 

        const mainNavItems = {
            'Home': '/',
            'About': '/about',
            'Services': '/services',
            'Blogs': '/blogs',
            'Clients': '/clients',
            'Privacy Policy': '/privacy-policy',
            'Contact Us': '/contact'
        };

        for (const [item, expectedUrl] of Object.entries(mainNavItems)) {
            const navElement = await driver.findElement(By.xpath(`/html/body/div[1]/header[1]/header/div[2]/div/nav[1]/ul/li/a[text()='${item}']`));
            const href = await navElement.getAttribute('href');
            expect(href).to.include(expectedUrl);
            console.log(`✓ Verified main nav item: ${item}`);
        }

        const aboutDropdown = await driver.findElement(By.xpath("/html/body/div[1]/header[1]/header/div[2]/div/nav[1]/ul/li/a[text()='About']"));
        const actions = driver.actions({bridge: true});
        await actions.move({origin: aboutDropdown}).perform();
        await driver.sleep(500); 

        const aboutSubmenuItems = [
            'Sustainability Commitment',
            'Equal Opportunity Employer'
        ];

        for (const item of aboutSubmenuItems) {
            const submenuElement = await driver.findElement(
                By.xpath(`//nav//a[text()='${item}']`)
            );
            expect(await submenuElement.isDisplayed()).to.be.true;
            console.log(`✓ Verified About submenu item: ${item}`);
        }

        const servicesDropdown = await driver.findElement(By.xpath("//nav//a[text()='Services']"));
        await actions.move({origin: servicesDropdown}).perform();
        await driver.sleep(500);

        const servicesSubmenuItems = [
            'Penetration Testing',
            'Zero Trust Assessment',
            'Solution Architecture',
            'Enterprise Architecture',
            'Virtual CISO',
            'Security Strategy',
            'Security Awareness And Training',
            'ISMS Design & Implementation',
            'Vulnerability Management',
            'Secure By Design',
            'Compliance Audits And Assessments',
            'Threat And Risk Assessment',
            'Security Operations Center'
        ];

        for (const item of servicesSubmenuItems) {
            const submenuElement = await driver.findElement(
                By.xpath(`//nav//a[text()='${item}']`)
            );
            expect(await submenuElement.isDisplayed()).to.be.true;
            const href = await submenuElement.getAttribute('href');
            const expectedUrl = '/services/' + item.toLowerCase().replace(/ /g, '-');
            expect(href).to.include(expectedUrl);
            console.log(`✓ Verified Services submenu item: ${item}`);
        }

        console.log('All navigation tests passed successfully!');

    } catch (error) {
        console.error('Test failed:', error);
        throw error;
    } finally {
        if (driver) {
            await driver.quit();
        }
    }
}


testNavigation().catch(console.error);
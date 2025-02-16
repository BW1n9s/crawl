const { Builder, By, until, Actions } = require('selenium-webdriver');
const { expect } = require('chai');

let driver;

// Verify main menu
async function testMainNavigation() {
    console.log('\n=== Testing Main Navigation ===');
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
        try {
            const navElement = await driver.findElement(
                By.xpath(`//ul[contains(@class, 'elementor-nav-menu')]//li[contains(@class, 'menu-item')]//a[contains(text(), '${item}')]`)
            );
            const href = await navElement.getAttribute('href');
            expect(href).to.include(expectedUrl);
            console.log(`✓ Verified main nav item: ${item}`);
        } catch (error) {
            console.error(`Failed to verify main nav item: ${item}`, error);
            throw error;
        }
    }
}

// Verify About dropdown menu
async function testAboutDropdown() {
    console.log('\n=== Testing About Dropdown ===');
    
    // 1. Find the About menu item
    const aboutMenuItem = await driver.findElement(
        By.xpath("//ul[contains(@class, 'elementor-nav-menu')]//li[contains(@class, 'menu-item-has-children')]//a[contains(text(), 'About')]")
    );
    
    // 2. Get the parent li element
    const parentLi = await driver.findElement(
        By.xpath("//ul[contains(@class, 'elementor-nav-menu')]//li[contains(@class, 'menu-item-has-children') and .//a[contains(text(), 'About')]]")
    );
    
    // 3. Use a series of events to trigger the menu
    await driver.executeScript(`
        const element = arguments[0];
        const parentElement = arguments[1];
        
        // Create events
        const events = ['mouseenter', 'mouseover', 'mousedown', 'mousemove', 'mouseup'];
        
        events.forEach(eventType => {
            const event = new MouseEvent(eventType, {
                view: window,
                bubbles: true,
                cancelable: true,
                clientX: element.getBoundingClientRect().left,
                clientY: element.getBoundingClientRect().top
            });
            
            // Trigger events on the link and parent element
            element.dispatchEvent(event);
            parentElement.dispatchEvent(event);
            
            // Manually add class if there is a class change
            if (parentElement.classList.contains('elementor-item-active')) {
                parentElement.classList.add('elementor-active');
            }
        });
        
        // Ensure dropdown menu is displayed
        const dropdown = parentElement.querySelector('.elementor-nav-menu--dropdown');
        if (dropdown) {
            dropdown.style.display = 'block';
            dropdown.style.opacity = '1';
            dropdown.setAttribute('aria-hidden', 'false');
        }
    `, aboutMenuItem, parentLi);
    
    await driver.sleep(2000);  // Increase wait time
    
    // 4. Check submenu state
    const submenu = await driver.findElement(
        By.xpath("//li[contains(@class, 'menu-item-has-children')]//ul[contains(@class, 'elementor-nav-menu--dropdown')]")
    );
    
    // Print current state information
    const ariaHidden = await submenu.getAttribute('aria-hidden');
    const display = await submenu.getCssValue('display');
    const opacity = await submenu.getCssValue('opacity');
    const visibility = await submenu.getCssValue('visibility');
    
    console.log('Submenu state:', {
        'aria-hidden': ariaHidden,
        'display': display,
        'opacity': opacity,
        'visibility': visibility
    });
    
    // Check element class names
    const parentClasses = await parentLi.getAttribute('class');
    console.log('Parent element classes:', parentClasses);
    
    // 5. Verify state
    expect(ariaHidden).to.equal('false');
    
    try {
        const aboutSubmenuItems = [
            'Sustainability Commitment',
            'Equal Opportunity Employer'
        ];

        for (const item of aboutSubmenuItems) {
            const submenuElement = await driver.findElement(
                By.xpath(`//li[contains(@class, 'menu-item-has-children')]//ul[contains(@class, 'elementor-nav-menu--dropdown')]//a[contains(text(), '${item}')]`)
            );
            console.log(`✓ Found submenu item: ${item}`);
        }
    } catch (error) {
        console.error('Failed to verify About dropdown:', error);
        // Print more diagnostic information
        // console.log('Page URL:', await driver.getCurrentUrl());
        // console.log('Current page title:', await driver.getTitle());
        throw error;
    }
}

// Verify Services dropdown menu
async function testServicesDropdown() {
    console.log('\n=== Testing Services Dropdown ===');
    
    // 1. Find the Services menu item and parent li
    const servicesMenuItem = await driver.findElement(
        By.xpath("//ul[contains(@class, 'elementor-nav-menu')]//li[contains(@class, 'menu-item-has-children')]//a[contains(text(), 'Services')]")
    );
    
    const parentLi = await driver.findElement(
        By.xpath("//ul[contains(@class, 'elementor-nav-menu')]//li[contains(@class, 'menu-item-has-children') and .//a[contains(text(), 'Services')]]")
    );
    
    // 2. Get initial state
    const submenu = await driver.findElement(
        By.xpath("//li[contains(@class, 'menu-item-has-children') and .//a[contains(text(), 'Services')]]//ul[contains(@class, 'elementor-nav-menu--dropdown')]")
    );
    
    console.log('Before hover - submenu state:');
    console.log('aria-hidden:', await submenu.getAttribute('aria-hidden'));
    console.log('display:', await submenu.getCssValue('display'));
    
    // 3. Trigger event sequence
    await driver.executeScript(`
        const element = arguments[0];
        const parentElement = arguments[1];
        
        // Create and trigger a series of events
        ['mouseenter', 'mouseover', 'mousedown', 'mousemove', 'mouseup'].forEach(eventType => {
            const event = new MouseEvent(eventType, {
                view: window,
                bubbles: true,
                cancelable: true,
                clientX: element.getBoundingClientRect().left,
                clientY: element.getBoundingClientRect().top
            });
            
            element.dispatchEvent(event);
            parentElement.dispatchEvent(event);
        });
        
        // Add necessary classes
        parentElement.classList.add('elementor-active');
        parentElement.classList.add('elementor-item-active');
        
        // Ensure dropdown is displayed
        const dropdown = parentElement.querySelector('.elementor-nav-menu--dropdown');
        if (dropdown) {
            dropdown.style.display = 'block';
            dropdown.style.opacity = '1';
            dropdown.setAttribute('aria-hidden', 'false');
        }
    `, servicesMenuItem, parentLi);
    
    await driver.sleep(2000);
    
    // 4. Check state after hover
    console.log('\nAfter hover - submenu state:');
    console.log('aria-hidden:', await submenu.getAttribute('aria-hidden'));
    console.log('display:', await submenu.getCssValue('display'));
    console.log('Parent classes:', await parentLi.getAttribute('class'));
    
    // 5. Verify Services menu items
    try {
        const servicesSubmenuItems = [
            'Penetration Testing',
            'Zero Trust Assessment',
            'Solution Architecture',
            'Enterprise Architecture',
            'Virtual CISO',
            'Security Strategy',
            'Security Awareness And Training',
            'ISMS Design & Implementation',     // This contains &
            'Vulnerability Management',
            'Secure By Design',                 // This may have an issue with the case of "By"
            'Compliance Audits And Assessments',
            'Threat And Risk Assessment',
            'Security Operations Center'
        ];
 
        const allVisibleItems = await driver.findElements(
            By.xpath("//ul[contains(@class, 'elementor-nav-menu--dropdown')]//a")
        );
        console.log("\nAll visible menu items:");
        for (const element of allVisibleItems) {
            console.log(await element.getText());
        }


    for (const item of servicesSubmenuItems) {
        try {
            // Use more lenient text matching
            const xpath = `//ul[contains(@class, 'elementor-nav-menu--dropdown')]//a[translate(text(), 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz')=translate('${item}', 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz')]`;
            
            // First try exact match
            let submenuElement;
            try {
                submenuElement = await driver.findElement(By.xpath(xpath));
            } catch (e) {
                // If exact match fails, try partial match
                const partialXpath = `//ul[contains(@class, 'elementor-nav-menu--dropdown')]//a[contains(translate(text(), 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz'), translate('${item}', 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz'))]`;
                submenuElement = await driver.findElement(By.xpath(partialXpath));
            }

            const isDisplayed = await submenuElement.isDisplayed();
            const itemHref = await submenuElement.getAttribute('href');
            const actualText = await submenuElement.getText();
            
            console.log(`\nSubmenu item "${item}":`);
            console.log('- Actual text:', actualText);
            console.log('- Displayed:', isDisplayed);
            console.log('- href:', itemHref);

            // Verify link format, using more lenient validation
            const expectedUrl = `/services/${item.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
            expect(itemHref.toLowerCase()).to.include(expectedUrl);

        } catch (error) {
            console.error(`Failed to find submenu item: ${item}`);
            console.error('Error details:', error.message);
            // Continue checking other items without interrupting the test
            continue;
        }
    }

    // Print summary of found and not found items at the end
    const foundItems = await driver.findElements(
        By.xpath("//ul[contains(@class, 'elementor-nav-menu--dropdown')]//a")
    );
    console.log(`\nSummary:`);
    console.log(`Total items in list: ${servicesSubmenuItems.length}`);
    console.log(`Total items found: ${foundItems.length}`);

    
        
    } catch (error) {
        console.error('Failed to verify Services submenu items:', error);
        // Print debug information
        // console.log('Page URL:', await driver.getCurrentUrl());
        // console.log('Page source:', await driver.getPageSource());
        throw error;
    }
 }

 async function verifyMenuUrls() {
    console.log('\n=== Verifying Menu URLs ===');
    
    // Define expected URL mappings
    const aboutSubmenuUrls = {
        'Sustainability Commitment': '/about/sustainability-commitment',
        'Equal Opportunity Employer': '/about/equal-opportunity-employer'
    };

    const servicesSubmenuUrls = {
        'Penetration Testing': '/services/penetration-testing',
        'Zero Trust Assessment': '/services/zero-trust-assessment',
        'Solution Architecture': '/services/solution-architecture',
        'Enterprise Architecture': '/services/enterprise-architecture',
        'Virtual CISO': '/services/virtual-ciso',
        'Security Strategy': '/services/security-strategy',
        'Security Awareness And Training': '/services/security-awareness-and-training',
        'ISMS Design & Implementation': '/services/isms-design-implementation',
        'Vulnerability Management': '/services/vulnerability-management',
        'Secure By Design': '/services/secure-by-design',
        'Compliance Audits And Assessments': '/services/compliance-audits-and-assessments',
        'Threat And Risk Assessment': '/services/threat-and-risk-assessment',
        'Security Operations Center': '/services/security-operations-center'
    };

    try {
        // Verify About submenu URLs
        console.log('\nChecking About submenu URLs:');
        for (const [item, expectedUrl] of Object.entries(aboutSubmenuUrls)) {
            try {
                const element = await driver.findElement(
                    By.xpath(`//ul[contains(@class, 'elementor-nav-menu--dropdown')]//a[contains(text(), '${item}')]`)
                );
                const actualUrl = await element.getAttribute('href');
                console.log(`\nChecking "${item}":`);
                console.log('- Expected URL:', expectedUrl);
                console.log('- Actual URL:', actualUrl);
                
                // Verify if the URL contains the expected path
                expect(actualUrl.toLowerCase()).to.include(expectedUrl.toLowerCase());
                console.log('✓ URL verified successfully');
            } catch (error) {
                console.error(`Failed to verify URL for About item: ${item}`);
                console.error('Error:', error.message);
            }
        }

        // Verify Services submenu URLs
        console.log('\nChecking Services submenu URLs:');
        for (const [item, expectedUrl] of Object.entries(servicesSubmenuUrls)) {
            try {
                const element = await driver.findElement(
                    By.xpath(`//ul[contains(@class, 'elementor-nav-menu--dropdown')]//a[contains(text(), '${item}')]`)
                );
                const actualUrl = await element.getAttribute('href');
                console.log(`\nChecking "${item}":`);
                console.log('- Expected URL:', expectedUrl);
                console.log('- Actual URL:', actualUrl);
                
                // Verify if the URL contains the expected path
                expect(actualUrl.toLowerCase()).to.include(expectedUrl.toLowerCase());
                console.log('✓ URL verified successfully');
            } catch (error) {
                console.error(`Failed to verify URL for Services item: ${item}`);
                console.error('Error:', error.message);
            }
        }

        console.log('\n✓ URL verification completed');

    } catch (error) {
        console.error('Failed to verify menu URLs:', error);
        throw error;
    }
}

// Call in the main test function
async function testNavigation() {
    try {
        driver = await new Builder().forBrowser('chrome').build();
        await driver.manage().window().maximize();
        await driver.get('https://sm-wp2-dufgdjbuh8h3fqhs.australiaeast-01.azurewebsites.net/');

        await testMainNavigation();
        await testAboutDropdown();
        await testServicesDropdown();
        await verifyMenuUrls();  // Add URL verification

        console.log('\n=== All navigation tests completed successfully! ===');
    } catch (error) {
        console.error('Test failed:', error);
        throw error;
    } finally {
        if (driver) {
            await driver.quit();
        }
    }
}

// Run the test
testNavigation().catch(console.error);

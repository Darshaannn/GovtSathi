const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

async function runLivePhase2() {
  const extensionPath = path.resolve(__dirname);
  console.log('Launching browser with extension at:', extensionPath);

  const context = await chromium.launchPersistentContext('', {
    headless: false,
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    args: [
      `--disable-extensions-except=${extensionPath}`,
      `--load-extension=${extensionPath}`,
      '--no-sandbox',
      '--disable-setuid-sandbox'
    ]
  });

  const page = await context.newPage();
  
  // Track console errors
  const consoleErrors = [];
  page.on('console', msg => {
    const text = msg.text();
    if (msg.type() === 'error') {
      consoleErrors.push(text);
    }
    if (text.startsWith('[GovGuide]')) {
      console.log('EXT LOG:', text);
    }
  });

  const stepsReport = [];

  try {
    console.log('\n--- Step 1: Navigating to https://sarathi.parivahan.gov.in ---');
    await page.goto('https://sarathi.parivahan.gov.in', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(3000);

    // Verify Screen 1 State Selection
    const s1State = await page.evaluate(() => {
      const host = document.getElementById('govguide-root-host');
      const hostsCount = document.querySelectorAll('#govguide-root-host').length;
      const shadow = host ? host.shadowRoot : null;
      const bubble = shadow ? shadow.querySelector('.govguide-bubble-body')?.textContent : null;
      const ring = shadow ? shadow.querySelector('.govguide-target-ring') : null;
      return {
        url: window.location.href,
        title: document.title,
        hostsCount,
        hasBubble: !!bubble,
        bubbleText: bubble,
        ringVisible: ring ? window.getComputedStyle(ring).display !== 'none' : false
      };
    });
    console.log('Screen 1 Status:', s1State);
    await page.screenshot({ path: path.join(__dirname, 'captures', 'parivahan', 'phase2-01-state-selection.png') });
    stepsReport.push({ screen: '01-state-selection', status: s1State });

    // Select Delhi in #stfNameId
    console.log('\n--- Interacting: Selecting Delhi (DL) in #stfNameId ---');
    await page.selectOption('select#stfNameId', 'DL');
    await page.waitForTimeout(4000);

    // Verify Screen 2 (Modal) or Screen 3 (Dashboard)
    const s2State = await page.evaluate(() => {
      const host = document.getElementById('govguide-root-host');
      const hostsCount = document.querySelectorAll('#govguide-root-host').length;
      const shadow = host ? host.shadowRoot : null;
      const bubble = shadow ? shadow.querySelector('.govguide-bubble-body')?.textContent : null;
      const modal = document.querySelector('#contactless_statepopup');
      const modalVisible = modal ? (window.getComputedStyle(modal).display !== 'none' && modal.classList.contains('in')) : false;
      return {
        url: window.location.href,
        title: document.title,
        hostsCount,
        modalVisible,
        bubbleText: bubble
      };
    });
    console.log('Screen 2 Status (Modal):', s2State);
    await page.screenshot({ path: path.join(__dirname, 'captures', 'parivahan', 'phase2-02-modal.png') });
    stepsReport.push({ screen: '02-contactless-modal', status: s2State });

    // If modal is visible, dismiss it via its close button
    const closeBtn = await page.$('#contactless_statepopup button.close');
    if (closeBtn && await closeBtn.isVisible()) {
      console.log('Clicking modal close button...');
      await closeBtn.click();
      await page.waitForTimeout(2000);
    }

    // Verify Screen 3 Dashboard
    const s3State = await page.evaluate(() => {
      const host = document.getElementById('govguide-root-host');
      const hostsCount = document.querySelectorAll('#govguide-root-host').length;
      const shadow = host ? host.shadowRoot : null;
      const bubble = shadow ? shadow.querySelector('.govguide-bubble-body')?.textContent : null;
      const ring = shadow ? shadow.querySelector('.govguide-target-ring') : null;
      return {
        url: window.location.href,
        title: document.title,
        hostsCount,
        hasBubble: !!bubble,
        bubbleText: bubble,
        ringVisible: ring ? window.getComputedStyle(ring).display !== 'none' : false
      };
    });
    console.log('Screen 3 Status (Dashboard):', s3State);
    await page.screenshot({ path: path.join(__dirname, 'captures', 'parivahan', 'phase2-03-dashboard.png') });
    stepsReport.push({ screen: '03-dashboard', status: s3State });

    // Click Apply for Learner Licence
    console.log('\n--- Interacting: Clicking Apply for Learner Licence (.icon-list a[href="newLLDet.do"]) ---');
    await page.click('.icon-list a[href="newLLDet.do"]');
    await page.waitForTimeout(4000);

    // Verify Screen 4 Instructions
    const s4State = await page.evaluate(() => {
      const host = document.getElementById('govguide-root-host');
      const hostsCount = document.querySelectorAll('#govguide-root-host').length;
      const shadow = host ? host.shadowRoot : null;
      const bubble = shadow ? shadow.querySelector('.govguide-bubble-body')?.textContent : null;
      const ring = shadow ? shadow.querySelector('.govguide-target-ring') : null;
      return {
        url: window.location.href,
        title: document.title,
        hostsCount,
        hasBubble: !!bubble,
        bubbleText: bubble,
        ringVisible: ring ? window.getComputedStyle(ring).display !== 'none' : false
      };
    });
    console.log('Screen 4 Status (Instructions):', s4State);
    await page.screenshot({ path: path.join(__dirname, 'captures', 'parivahan', 'phase2-04-instructions.png') });
    stepsReport.push({ screen: '04-instructions', status: s4State });

    // Click Continue
    console.log('\n--- Interacting: Clicking Continue button ---');
    await page.click('input[value="Continue"]');
    await page.waitForTimeout(4000);

    // Verify Screen 5 Applicant Category
    const s5State = await page.evaluate(() => {
      const host = document.getElementById('govguide-root-host');
      const hostsCount = document.querySelectorAll('#govguide-root-host').length;
      const shadow = host ? host.shadowRoot : null;
      const bubble = shadow ? shadow.querySelector('.govguide-bubble-body')?.textContent : null;
      const ring = shadow ? shadow.querySelector('.govguide-target-ring') : null;
      return {
        url: window.location.href,
        title: document.title,
        hostsCount,
        hasBubble: !!bubble,
        bubbleText: bubble,
        ringVisible: ring ? window.getComputedStyle(ring).display !== 'none' : false
      };
    });
    console.log('Screen 5 Status (Applicant Category):', s5State);
    await page.screenshot({ path: path.join(__dirname, 'captures', 'parivahan', 'phase2-05-applicant-category.png') });
    stepsReport.push({ screen: '05-applicant-category', status: s5State });

  } catch (err) {
    console.error('Phase 2 Execution encountered an error:', err);
    stepsReport.push({ error: err.message });
  } finally {
    await context.close();
  }

  // Write TEST-PHASE-2.md
  let reportMd = `# TEST PHASE 2 (Live Read-Only Run) Results\n\n`;
  reportMd += `**Date**: ${new Date().toISOString()}\n`;
  reportMd += `**Domain Tested**: \`https://sarathi.parivahan.gov.in\`\n\n`;
  reportMd += `## Screen By Screen Results\n\n`;

  for (const s of stepsReport) {
    reportMd += `### ${s.screen || 'Error'}\n`;
    reportMd += `\`\`\`json\n${JSON.stringify(s.status || s.error, null, 2)}\n\`\`\`\n\n`;
  }

  reportMd += `## Console Errors\n`;
  if (consoleErrors.length === 0) {
    reportMd += `Zero console errors detected from extension.\n`;
  } else {
    reportMd += `Errors logged:\n\`\`\`\n${consoleErrors.join('\n')}\n\`\`\`\n`;
  }

  fs.writeFileSync(path.join(__dirname, 'TEST-PHASE-2.md'), reportMd);
  console.log('TEST-PHASE-2.md generated successfully.');
}

runLivePhase2();


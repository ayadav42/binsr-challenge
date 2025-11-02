import * as fs from 'fs';
import * as path from 'path';
import { chromium } from 'playwright';
import { PDFDocument } from 'pdf-lib';
import { generateHTML, InspectionData } from './generate_other_pages';
import { generateFirstPageHTML } from './generate_first_page';

// Simple HTML escaper for header/footer strings
function esc(s: string) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

async function generatePdfReport(sharedBrowserInstance?: any) {
  try {
    const startTime = Date.now();
    const shouldCloseBrowser = !sharedBrowserInstance; // Close browser only if we created it

    // Read JSON once
    const jsonPath = path.join(__dirname, '../src/inspection.json');
    const jsonData = fs.readFileSync(jsonPath, 'utf-8');
    const data: InspectionData = JSON.parse(jsonData);

    const outputDir = path.join(__dirname, '../output');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    console.log('⚡ Parallel Processing Started...\n');
    console.log('🚀 Launching browser + generating HTML in parallel...\n');

    const pipelineStartTime = Date.now();

    // Prepare paths
    const firstPageHTMLPath = path.join(outputDir, 'first_page.html');
    const sectionsHTMLPath = path.join(outputDir, 'sections.html');
    const firstPagePDFPath = path.join(outputDir, 'first_page.pdf');
    const sectionsPDFPath = path.join(outputDir, 'sections.pdf');

    // Prepare templates
    const firstPageFooterTemplate = `
      <style>
        .pdf-footer { font-family: 'Times New Roman', Times, serif; font-size: 12px; width: 100%;
                      display: flex; justify-content: space-between; align-items: center; padding: 0 10mm; }
      </style>
      <div class="pdf-footer">
        <div>REI 7-6 (8/9/2021)</div>
        <div>Promulgated by the Texas Real Estate Commission • (512) 936-3000 • www.trec.texas.gov</div>
      </div>`;

    const addr = data.inspection.address.fullAddress;
    const scheduleData = data.inspection.schedule as any;
    const date = new Date(scheduleData.startTime || scheduleData.date);
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    const yyyy = date.getFullYear();
    const dateStr = `${mm}/${dd}/${yyyy}`;

    const headerTemplate = `
      <style>
        .pdf-header { font-family: 'Times New Roman', Times, serif; font-size: 13px; width: 100%; padding: 4px 12mm 0 12mm; }
        .pdf-header .legend { display: flex; gap: 45px; font-weight: 700; margin-top: 3px; margin-left: 3px; padding: 1px 7.5px; }
        .pdf-header .box { margin-top: 2px; border: 2px solid #000; display: flex; justify-content: flex-start; gap: 12.5px; padding: 1px 8.5px; font-weight: 700; width: 100%; }
      </style>
      <div class="pdf-header">
        <div style="margin-left: 3px;">Report: ${esc(addr)} - ${esc(
      dateStr
    )}</div>
        <div class="legend">
          <span>I=Inspected</span><span>NI=Not Inspected</span><span>NP=Not Present</span><span>D=Deficient</span>
        </div>
        <div class="box"><span>I</span><span>NI</span><span>NP</span><span>D</span></div>
      </div>`;

    const footerTemplate = `
      <style>
        .pdf-footer { 
          font-family: 'Times New Roman', Times, serif; 
          width: 100%;
          padding: 0 10mm;
        }
        .pdf-footer .page-number {
          font-size: 14px;
          text-align: center;
          margin-bottom: 4px;
        }
        .pdf-footer .bottom-line {
          font-size: 12px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
      </style>
      <div class="pdf-footer">
        <div class="page-number">Page <span class="pageNumber"></span> of <span class="totalPages"></span></div>
        <div class="bottom-line">
          <div>REI 7-6 (8/9/2021)</div>
          <div>Promulgated by the Texas Real Estate Commission • (512) 936-3000 • www.trec.texas.gov</div>
        </div>
      </div>`;

    // Run browser launch (if needed) + two HTML generations in parallel
    const [browserInstance, firstPageHTML, sectionsHTML] = await Promise.all([
      // Launch browser only if not provided (I/O bound - takes ~200-500ms)
      sharedBrowserInstance
        ? (async () => {
            console.log('🌐 Reusing existing browser...');
            return sharedBrowserInstance;
          })()
        : (async () => {
            const launchStart = Date.now();
            console.log('🌐 Launching browser...');
            const b = await chromium.launch({
              headless: true,
              args: [
                '--disable-dev-shm-usage',
                '--disable-setuid-sandbox',
                '--disable-gpu',
                '--disable-web-security',
                '--disable-features=IsolateOrigins,site-per-process',
                '--disable-blink-features=AutomationControlled',
                '--no-first-run',
                '--no-default-browser-check',
                '--disable-backgrounding-occluded-windows',
                '--disable-renderer-backgrounding',
              ],
            });
            console.log(
              `   ✅ Browser launched (${Date.now() - launchStart}ms)`
            );
            return b;
          })(),

      // Generate first page HTML (CPU bound)
      (async () => {
        const genStart = Date.now();
        console.log('📄 Generating first page HTML...');
        const html = generateFirstPageHTML(data as any);
        console.log(
          `   ✅ First page HTML generated (${Date.now() - genStart}ms)`
        );
        return html;
      })(),

      // Generate sections HTML (CPU bound)
      (async () => {
        const genStart = Date.now();
        console.log('📄 Generating sections HTML...');
        const html = generateHTML(data);
        console.log(
          `   ✅ Sections HTML generated (${Date.now() - genStart}ms)`
        );
        return html;
      })(),
    ]);

    // Write both HTML files in parallel
    console.log('\n💾 Saving HTML files...');
    await Promise.all([
      fs.promises.writeFile(firstPageHTMLPath, firstPageHTML, 'utf-8'),
      fs.promises.writeFile(sectionsHTMLPath, sectionsHTML, 'utf-8'),
    ]);
    console.log('   ✅ HTML files saved');

    // Now run both PDF generation chains in parallel (browser is already ready!)
    console.log('\n🖨️  Generating PDFs in parallel...');
    const pdfStart = Date.now();

    const [firstPagePDFBytes, sectionsPDFBytes] = await Promise.all([
      // CHAIN 1: First Page (Browser → PDF)
      (async () => {
        const chainStart = Date.now();

        // Open browser page
        const page = await browserInstance.newPage();

        // Use domcontentloaded for faster initial load
        await page.goto(`file://${firstPageHTMLPath}`, {
          waitUntil: 'domcontentloaded',
          timeout: 30000,
        });

        // Wait for all images to load in parallel with timeout
        await page.evaluate(`
          Promise.all(
            Array.from(document.images).map((img) => {
              if (img.complete) return Promise.resolve();
              
              return Promise.race([
                new Promise((resolve) => {
                  img.onload = () => resolve();
                  img.onerror = () => resolve(); // Resolve even on error to not block
                }),
                // 5 second timeout per image
                new Promise((resolve) => setTimeout(resolve, 5000))
              ]);
            })
          )
        `);

        console.log(
          `   ✅ First page loaded in browser (${Date.now() - chainStart}ms)`
        );

        // Generate PDF
        await page.pdf({
          path: firstPagePDFPath,
          format: 'Letter',
          printBackground: true,
          displayHeaderFooter: true,
          headerTemplate: '<div></div>',
          footerTemplate: firstPageFooterTemplate,
          margin: { top: '10mm', bottom: '15mm', left: '10mm', right: '10mm' },
          preferCSSPageSize: false,
        });
        await page.close();
        console.log(
          `   ✅ First page PDF created (${Date.now() - chainStart}ms)`
        );

        // Read PDF bytes for merging
        return fs.promises.readFile(firstPagePDFPath);
      })(),

      // CHAIN 2: Sections (Browser → PDF)
      (async () => {
        const chainStart = Date.now();

        // Open browser page
        const page = await browserInstance.newPage();

        // Use domcontentloaded for faster initial load
        await page.goto(`file://${sectionsHTMLPath}`, {
          waitUntil: 'domcontentloaded',
          timeout: 30000,
        });

        // Wait for all images to load in parallel with timeout
        await page.evaluate(`
          Promise.all(
            Array.from(document.images).map((img) => {
              if (img.complete) return Promise.resolve();
              
              return Promise.race([
                new Promise((resolve) => {
                  img.onload = () => resolve();
                  img.onerror = () => resolve(); // Resolve even on error to not block
                }),
                // 5 second timeout per image
                new Promise((resolve) => setTimeout(resolve, 5000))
              ]);
            })
          )
        `);

        console.log(
          `   ✅ Sections loaded in browser (${Date.now() - chainStart}ms)`
        );

        // Generate PDF
        await page.pdf({
          path: sectionsPDFPath,
          format: 'Letter',
          printBackground: true,
          displayHeaderFooter: true,
          headerTemplate,
          footerTemplate,
          margin: { top: '25mm', bottom: '15mm', left: '10mm', right: '10mm' },
          preferCSSPageSize: false,
        });
        await page.close();
        console.log(
          `   ✅ Sections PDF created (${Date.now() - chainStart}ms)`
        );

        // Read PDF bytes for merging
        return fs.promises.readFile(sectionsPDFPath);
      })(),
    ]);

    console.log(`   ✅ PDF generation completed in ${Date.now() - pdfStart}ms`);

    if (shouldCloseBrowser) {
      await browserInstance.close();
      console.log('   🔒 Browser closed');
    }
    console.log(
      `\n⚡ Total pipeline completed in ${Date.now() - pipelineStartTime}ms`
    );

    // STEP 3: Merge PDFs
    console.log('\n📑 Step 3: Merging PDFs...');
    const mergeStartTime = Date.now();

    const mergedPdf = await PDFDocument.create();

    // Load and copy first page
    const firstPdf = await PDFDocument.load(firstPagePDFBytes);
    const firstPages = await mergedPdf.copyPages(
      firstPdf,
      firstPdf.getPageIndices()
    );
    firstPages.forEach((page) => mergedPdf.addPage(page));

    // Load and copy sections
    const sectionsPdf = await PDFDocument.load(sectionsPDFBytes);
    const sectionsPages = await mergedPdf.copyPages(
      sectionsPdf,
      sectionsPdf.getPageIndices()
    );
    sectionsPages.forEach((page) => mergedPdf.addPage(page));

    // Save merged PDF
    const mergedPdfBytes = await mergedPdf.save();
    const finalPDFPath = path.join(outputDir, 'combined_report.pdf');
    await fs.promises.writeFile(finalPDFPath, mergedPdfBytes);

    console.log(
      `   ✅ PDF merge completed in ${Date.now() - mergeStartTime}ms`
    );

    const totalTime = Date.now() - startTime;
    console.log(`\n✅ Combined PDF generated successfully: ${finalPDFPath}`);
    console.log(
      `⚡ Total time: ${totalTime}ms (${(totalTime / 1000).toFixed(2)}s)`
    );
    console.log('\n📊 Report Summary:');
    console.log(`   Final PDF: ${finalPDFPath}`);
    console.log(`   - Page 1: TREC Property Inspection Report Form`);
    console.log(
      `   - Pages 2+: ${
        data.inspection.sections?.length || 0
      } inspection sections`
    );
  } catch (error) {
    console.error('❌ Error generating report:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  (async () => {
    console.log('🔄 Running report generation twice with shared browser...\n');

    // Launch browser once
    console.log('🌐 Launching shared browser...');
    const sharedBrowser = await chromium.launch({
      headless: true,
      args: [
        '--disable-dev-shm-usage',
        '--disable-setuid-sandbox',
        '--disable-gpu',
        '--disable-web-security',
        '--disable-features=IsolateOrigins,site-per-process',
        '--disable-blink-features=AutomationControlled',
        '--no-first-run',
        '--no-default-browser-check',
        '--disable-backgrounding-occluded-windows',
        '--disable-renderer-backgrounding',
      ],
    });
    console.log('   ✅ Shared browser launched\n');

    console.log('='.repeat(80));
    console.log('FIRST RUN');
    console.log('='.repeat(80) + '\n');

    await generatePdfReport(sharedBrowser);

    console.log('\n' + '='.repeat(80));
    console.log('SECOND RUN');
    console.log('='.repeat(80) + '\n');

    await generatePdfReport(sharedBrowser);

    // Close shared browser
    await sharedBrowser.close();
    console.log('\n🔒 Shared browser closed');

    console.log('\n' + '='.repeat(80));
    console.log('✅ Both runs completed!');
    console.log('='.repeat(80));
  })();
}

export { generatePdfReport };

//IMPORTS:
const puppeteer = require("puppeteer");




const baseURL = process.env.TEST_URL || 'https://composer.sckan.dev.metacell.us/'



//TESTS:

jest.setTimeout(60000 * 2);
let page;
let browser;
describe('End to End Tests', () => {

    beforeAll(async () => {

        browser = await puppeteer.launch({
            args: [
                "--no-sandbox",
            ],
            headless: false,
            defaultViewport: {
                width: 1600,
                height: 1000,
            },
        });


        page = await browser.newPage();
        await console.log(
            "Checking page",
            baseURL
        );
        await console.log('Starting tests ...')

        // page.on("pageerror", err => {
        //     console.log('ERROR')
        //     throw new Error(`Page error: ${err.toString()}`);
        // });

        await page.goto(baseURL, {waitUntil: 'domcontentloaded'})
    });

    afterAll(() => {

        browser.close()
    })

    it('HomePage', async () => {

        await console.log(page.url())
        const pageTitle = await page.title();
        console.log(pageTitle);
        console.log(page)
        // await page.waitForSelector('#root', { timeout: 60000 })
        // await page.waitForSelector('.MuiDrawer-docked', { timeout: 60000 })
        await page.waitForSelector('.mat-form-field-infix', { timeout: 60000 })

        // await page.waitForSelector('input[formcontrolname="username"]', { timeout: 60000 })
    })
})
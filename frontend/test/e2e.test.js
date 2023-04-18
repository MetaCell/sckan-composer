//IMPORTS:
const puppeteer = require("puppeteer");




const baseURL = process.env.TEST_URL || 'https://composer.sckan.dev.metacell.us/'



//TESTS:
let page;
let browser;
jest.setTimeout(60000 * 2);

describe('End to End Tests', () => {

    beforeAll(async () => {

        browser = await puppeteer.launch({
            args: [
                "--no-sandbox",
                `--window-size=1600,1000`,
                "--ignore-certificate-errors"
            ],
            headless: !process.env.PUPPETEER_DISPLAY,
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

        await page.goto(baseURL);
    });

    afterAll(() => {

        browser.close()
    })

    it('HomePage', async () => {

        await console.log(page.url())
        await page.waitForSelector('#username')
    })
})
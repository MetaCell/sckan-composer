//IMPORTS:
const selectors = require('./selectors');
const puppeteer = require("puppeteer");

// INFO
const USERNAME = process.env.TEST_USERNAME 
const PASSWORD = process.env.TEST_PASSWORD 
const baseURL = 'https://composer.sckan.dev.metacell.us/'



//FUNCTIONS AND CONSTANTS

function getTimestamp() {
    const now = new Date();
    const day = now.getDate();
    const month = now.toLocaleString('default', { month: 'short' });
    const year = now.getFullYear();
    const hours = now.getHours();
    // const minutes = now.getMinutes();
    // const seconds = now.getSeconds();
    const formattedDate = `${day}${month}${year}_${hours}h`;
    return formattedDate
}

const maxPmidNumber = 99999999;
const randomPmid = Math.floor(Math.random() * maxPmidNumber) + 1;

const maxPmcidNumber = 999999999;
const randomPmcid = Math.floor(Math.random() * maxPmcidNumber) + 1;

const prefix = "10.";
const maxDoiLength = 16;
const characters = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";

let doi = prefix;
while (doi.length < maxDoiLength) {
    const randomIndex = Math.floor(Math.random() * characters.length);
    doi += characters[randomIndex];
}

const currentTime = getTimestamp()

const article_title = `Automated Testing Article - ${currentTime}`
const sentence = `QA - ${currentTime} - Sentence generated by Automated Testing`
const knowledge_statement_1 = `Testing_KS - ${currentTime}`
const provenances_1 = 'https://doi.org/google.com'
const species_1 = 'homo sapiens'
const apinatomy_model_name_1 = 'PTcell'
const additional_info_1 = 'Additional Information for KS 1'
const tags = 'Important'
const note = 'Statement List - Distillation - Note'
const path_builder_origin_ = 'abducens motor nuclei'
const path_builder_axon = 'AXON'
const path_builder_via = '10n'
const path_builder_destination = 'adrenal cortex'
const path_builder_axon_terminal = 'AXON-T'



//TESTS:

jest.setTimeout(60000 * 2);
let page;
let browser;


describe('End to End Tests', () => {

    beforeAll(async () => {

        browser = await puppeteer.launch({
            args: [
                '--no-sandbox', '--disable-setuid-sandbox', '--bail',
            ],
            headless: 'new',
            // headless: false,
            defaultViewport: {
                width: 1600,
                height: 1000,
            },
            // slowMo: 30
        });


        page = await browser.newPage();
        await console.log(
            "Checking page",
            baseURL
        );
        await console.log('Starting tests ...')

        await page.goto(baseURL, { waitUntil: 'domcontentloaded' })
        const pageTitle = await page.title();
        console.log(pageTitle);
        expect(pageTitle).toBe('SCKAN Composer')
    });

    afterAll(async () => {

        await browser.close()
    })

    describe('Login Flow', () => {

        // (shouldSkipLoginTest ? it.skip : it)('HomePage', async () => {
        it('Home Page', async () => {
            console.log('Homepage')
            await page.waitForSelector(selectors.LOGIN_PAGE, { timeout: 60000 })
            await page.waitForSelector(selectors.COOKIE_MODAL, { timeout: 60000 })
            await page.waitForSelector(selectors.ACCEPT_COOKIES, { timeout: 60000 })
            await page.click(selectors.ACCEPT_COOKIES)
            await page.waitForSelector(selectors.ACCEPT_COOKIES, { hidden: true });
            console.log('Cookies accepted')

        });

        // (shouldSkipLoginTest ? it.skip : it)('Login', async () => {
        it('Login', async () => {
            console.log('Logging in ...');
            console.log('Testing user: ' + USERNAME)
    
            await page.waitForSelector(selectors.USERNAME, { hidden: false});
            await page.waitForTimeout(1000)
            await page.type(selectors.USERNAME, USERNAME);
            await page.type(selectors.PASSWORD, PASSWORD);
            await page.waitForSelector(selectors.SIGN_IN_BUTTON, { hidden: false });
            await page.click(selectors.SIGN_IN_BUTTON);
            await page.waitForSelector(selectors.SEARCH_ICON, { hidden: false });
            await page.waitForSelector('.MuiDataGrid-row.MuiDataGrid-row--dynamicHeight')
    
            console.log('Logged In');
        });
    })

    describe('Statements List', () => {

        it('Search for the Knowledge Statement in the Statements List page', async () => {
            console.log('Searching for the created Knowledge Statement ...')
            await page.waitForTimeout(3000)
            await page.waitForSelector('li.MuiButtonBase-root.MuiMenuItem-root.MuiMenuItem-gutters.MuiMenuItem-root.MuiMenuItem-gutters')
            const sidebar_buttons = await page.$$('ul.MuiList-root.MuiList-padding > li')
            await sidebar_buttons[1].click()
            await page.waitForSelector(selectors.SEARCH_ICON)
            await page.waitForSelector(selectors.SEARCH_FOR_KS, {hidden:false})
            await page.click(selectors.SEARCH_FOR_KS)
            await page.waitForTimeout(3000)
            await page.type(selectors.SEARCH_FOR_KS, `${knowledge_statement_1}`)
            await page.waitForTimeout(100)
            await page.waitForSelector('.MuiDataGrid-row.MuiDataGrid-row--dynamicHeight')
            await page.waitForTimeout(6000)
            const searched_records_count = await page.$$eval('.MuiDataGrid-row.MuiDataGrid-row--dynamicHeight', elements => elements.length);
            expect(searched_records_count).not.toBeNull()

            await page.waitForSelector('div[role="row"]')
            await page.click(selectors.TABLE_ROW)

            await page.waitForSelector(selectors.SENTENCE_PAGE)
            const sentence_status = await page.$$eval('span.MuiChip-label.MuiChip-labelSmall', status => {
                return status.map(status => status.innerText.toLowerCase())
            })
            expect(sentence_status).toContain("compose now")

            console.log('Statement found')
        })

        it('Add tags', async () => {
            console.log('Adding Tags ...')
            // Tags
            await page.waitForSelector(selectors.TAGS_FIELD, {hidden:false})
            await page.click(selectors.TAGS_FIELD)
            await page.keyboard.press('ArrowDown');
            await page.keyboard.press('Enter')
            await page.waitForSelector(selectors.PROGRESS_LOADER, { timeout: 5000, hidden: false });
            await page.waitForSelector(selectors.PROGRESS_LOADER, { hidden: true });
            await page.waitForTimeout(3000)


            console.log('Tags added')
        })

        it.skip('Add notes', async () => {
            console.log('Adding Notes ...')
           
            // Notes
            await page.click(selectors.NOTES_FIELD)
            await page.type(selectors.NOTES_FIELD, note)
            await page.waitForTimeout(3000)
            await page.click(selectors.SEND_BUTTON)
            await page.waitForTimeout(3000)

            const history = await page.$$eval('h6.MuiTypography-root.MuiTypography-subtitle2', history => {
                return history.map(history => history.innerText)
            })
            expect(history[0]).toContain(note)

            console.log('Notes added')
        })


        it('Add Alert', async () => {
            console.log('Adding Alert ...')
            await page.waitForSelector('.panel1bh-header')
            const headers = await page.$$('.panel1bh-header');
            await headers[1].click();
            await page.waitForTimeout(3000)

            await page.waitForSelector('div[role="combobox"]')
            const comboboxes = await page.$$('div[role="combobox"]');
            await comboboxes[comboboxes.length - 1].click();
            await page.waitForTimeout(3000)

            await page.waitForSelector('li > button')
            await page.click('li > button')
            await page.waitForTimeout(3000)
            await page.waitForSelector('button > svg[data-testid="DeleteOutlinedIcon"]', {hidden:false})

            const statement_details_fields = await page.$$('div.MuiInputBase-root.MuiOutlinedInput-root.MuiInputBase-colorPrimary.MuiInputBase-formControl')
            await statement_details_fields[12].click()
            await statement_details_fields[12].type('Alert Example')
            await page.waitForSelector(selectors.BIOTECH_ICON_SELECTOR, {hidden:false})
            await page.click(selectors.BIOTECH_ICON_SELECTOR)
            await page.waitForTimeout(3000)
            const AlertTextContent = await page.evaluate(el => el.textContent, statement_details_fields[12]);
            expect(AlertTextContent).not.toBe('');

            console.log('Alert added')
        })
        
    })

})
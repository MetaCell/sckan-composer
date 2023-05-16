//IMPORTS:
import * as selectors from './selectors'
const puppeteer = require("puppeteer");

// INFO
const USERNAME = 'simao@metacell.us'
const PASSWORD = 'Pokemon9897!'
const baseURL = process.env.TEST_URL || 'https://composer.sckan.dev.metacell.us/'


//FUNCTIONS AND CONSTANTS

function getTimestamp() {
    const now = new Date();
    const day = now.getDate();
    const month = now.toLocaleString('default', { month: 'short' });
    const year = now.getFullYear();
    const hours = now.getHours();
    const minutes = now.getMinutes();
    const seconds = now.getSeconds();
    const formattedDate = `${day}${month}${year}_${hours}h${minutes}m${seconds}s`;
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
const knowledge_statement_1 = `QA_KS_1 - ${currentTime}`
const provenances_1 = 'https://doi.org/google.com'
const species_1 = 'human'
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

        await page.goto(baseURL, { waitUntil: 'domcontentloaded' })
    });

    afterAll(async () => {

        await browser.close()
    })

    it('HomePage', async () => {

        const pageTitle = await page.title();
        console.log(pageTitle);
        expect(pageTitle).toBe('SCKAN Composer')
        await page.waitForSelector(selectors.LOGIN_PAGE, { timeout: 60000 })
    })

    it('Login', async () => {

        console.log('Logging in ...')

        await page.waitForSelector(selectors.USERNAME, { timeout: 60000 })
        await page.type(selectors.USERNAME, USERNAME)
        await page.type(selectors.PASSWORD, PASSWORD)
        await page.click(selectors.SIGN_IN_BUTTON)
        await page.waitForSelector(selectors.SEARCH_ICON)

        console.log('Logged In')

    })

    it('Add Record', async () => {
        console.log('Adding record ...')

        await page.click(selectors.ADD_RECORD)
        await page.waitForSelector(selectors.ARTICLE_LABEL)
        await page.click(selectors.ARTICLE_FIELD)
        await page.type(selectors.ARTICLE_FIELD, `${article_title}`)
        await page.waitForTimeout(3000)
        await page.click(selectors.PMID_FIELD)
        await page.type(selectors.PMID_FIELD, `${randomPmid}`)
        await page.waitForTimeout(3000)
        await page.click(selectors.PMCID_FIELD)
        await page.type(selectors.PMCID_FIELD, `${randomPmcid}`)
        await page.waitForTimeout(3000)
        await page.click(selectors.DOI_FIELD)
        await page.type(selectors.DOI_FIELD, `${doi}`)
        await page.waitForTimeout(3000)
        await page.click(selectors.SENTENCE_FIELD)
        await page.type(selectors.SENTENCE_FIELD, `${sentence}`)
        await page.waitForTimeout(3000)

        await page.waitForSelector(selectors.CREATE_SENTENCE)
        await page.click(selectors.CREATE_SENTENCE)

        await page.waitForSelector(selectors.SENTENCE_DETAILS_TITLE)

        const sentence_status = await page.$$eval('span.MuiChip-label.MuiChip-labelSmall', status => {
            return status.map(status => status.innerText)
        })
        expect(sentence_status).toContain("Open")

        console.log('Record successfully added')

    })


    it('Create 1st Knowledge Statement', async () => {
        console.log('Creating Knowledge Statement ...')

        await page.waitForTimeout(3000)
        await page.waitForSelector(selectors.ADD_KNOWLEDGE_STATEMENT)
        await page.click(selectors.ADD_KNOWLEDGE_STATEMENT)
        await page.waitForSelector(selectors.SPECIES_FIELD, { timeout: 6000 })
        
        // Knowledge Statement
        await page.click(selectors.KS_FIELD)
        await page.type(selectors.KS_FIELD, knowledge_statement_1)
        await page.waitForTimeout(3000)
        
        //Provenance
        await page.click(selectors.PROVENANCE_FIELD)
        await page.type(selectors.PROVENANCE_FIELD, provenances_1)
        await page.keyboard.press('Enter')
        await page.waitForTimeout(3000)
        
        //Species
        await page.click(selectors.SPECIES_FIELD)
        await page.type(selectors.SPECIES_FIELD, species_1)
        await page.keyboard.press('ArrowDown');
        await page.keyboard.press('Enter')
        await page.waitForTimeout(3000)
        
        //Phenotype
        const dropdown_buttons = await page.$$('div.MuiSelect-select.MuiSelect-standard.MuiInputBase-input.MuiOutlinedInput-input')
        await dropdown_buttons[0].click()

        await page.evaluate(() => {
            [...document.querySelectorAll('li.MuiButtonBase-root.MuiMenuItem-root.MuiMenuItem-gutters.MuiMenuItem-root.MuiMenuItem-gutters')].find(element => element.innerText === 'Parasympathetic Pre-ganglionic').click();
        });
        await page.click(selectors.SPECIES_FIELD)
        await page.waitForTimeout(selectors.PROGRESS_LOADER, { timeout: 5000, hidden: false });
        await page.waitForTimeout(selectors.PROGRESS_LOADER, { hidden: true });
        await page.waitForTimeout(4000)
        
        //Laterality
        await page.waitForSelector(selectors.RIGHT_ROOT_LATERALITY)
        await page.click(selectors.RIGHT_ROOT_LATERALITY)
        await page.waitForTimeout(selectors.PROGRESS_LOADER, { timeout: 5000, hidden: false });
        await page.waitForTimeout(selectors.PROGRESS_LOADER, { hidden: true });
        await page.waitForTimeout(3000)
       
        //Projection
        await page.waitForSelector(selectors.IPSI_PROJECTION)
        await page.click(selectors.IPSI_PROJECTION)
        await page.waitForTimeout(selectors.PROGRESS_LOADER, { timeout: 5000, hidden: false });
        await page.waitForTimeout(selectors.PROGRESS_LOADER, { hidden: true });
        await page.waitForTimeout(3000)
        
        // Circuit Type
        await page.waitForSelector(selectors.SENSORY_CIRCUIT_TYPE)
        await page.click(selectors.SENSORY_CIRCUIT_TYPE)
        await page.waitForTimeout(selectors.PROGRESS_LOADER, { timeout: 5000, hidden: false });
        await page.waitForTimeout(selectors.PROGRESS_LOADER, { hidden: true });
        await page.waitForTimeout(3000)
        
        // Sex
        await dropdown_buttons[1].click()
        await page.evaluate(() => {
            [...document.querySelectorAll('li.MuiButtonBase-root.MuiMenuItem-root.MuiMenuItem-gutters.MuiMenuItem-root.MuiMenuItem-gutters')].find(element => element.innerText === 'Male').click();
        });
        await page.waitForTimeout(selectors.PROGRESS_LOADER, { timeout: 5000, hidden: false });
        await page.waitForTimeout(selectors.PROGRESS_LOADER, { hidden: true });
        await page.waitForTimeout(3000)

        // Apinatomy Model Name
        await page.click(selectors.APINATOMY_MODEL)
        await page.type(selectors.APINATOMY_MODEL, apinatomy_model_name_1)
        await page.waitForTimeout(3000)

        // Additional Information
        await page.click(selectors.ADDITIONAL_INFORMATION)
        await page.type(selectors.ADDITIONAL_INFORMATION, additional_info_1)
        await page.waitForTimeout(3000)

        console.log('Knowledge Statement created')
    })


    it('Change status -> To Be Reviewed', async () => {
        console.log('Changing Status ...')


        await page.click(selectors.STATUS_BUTTON)
        await page.waitForTimeout(1000)
        const sentence_status = await page.$$eval('span.MuiChip-label.MuiChip-labelSmall', status => {
            return status.map(status => status.innerText)
        })
        expect(sentence_status).toContain("To Be Reviewed")

        console.log('Status Changed')

    })


    it('Search for created Record', async () => {
        console.log('Searching for created Record ...')

        await page.waitForTimeout(3000)
        await page.waitForSelector('li.MuiButtonBase-root.MuiMenuItem-root.MuiMenuItem-gutters.Mui-selected.MuiMenuItem-root.MuiMenuItem-gutters.Mui-selected')
        const sidebar_buttons = await page.$$('ul.MuiList-root.MuiList-padding > li')
        await sidebar_buttons[0].click()
        await page.waitForSelector(selectors.SEARCH_ICON)
        await page.waitForSelector(selectors.SEARCH_BAR)
        await page.click(selectors.SEARCH_BAR)
        await page.waitForTimeout(3000)
        await page.type(selectors.SEARCH_BAR, `${article_title}`)
        await page.waitForSelector('.MuiDataGrid-row.MuiDataGrid-row--dynamicHeight')
        await page.waitForTimeout(6000)
        const searched_records_count = await page.$$eval('.MuiDataGrid-row.MuiDataGrid-row--dynamicHeight', elements => elements.length);
        expect(searched_records_count).toBe(1)

        await page.waitForSelector(selectors.TABLE_ROW)
        await page.click(selectors.TABLE_ROW)

        await page.waitForSelector(selectors.SENTENCE_PAGE)

        console.log('Record found')
    })

    it('Set status as Compose Now', async () => {
        console.log('Changing Status ...')
        await page.click(selectors.STATUS_BUTTON)
        await page.waitForTimeout(1000)
        const sentence_status = await page.$$eval('span.MuiChip-label.MuiChip-labelSmall', status => {
            return status.map(status => status.innerText)
        })
        expect(sentence_status).toContain("Compose Now")
        console.log('Status Changed')
    })

    it('Search for the Knowledge Statement in the Statements List page', async () => {
        console.log('Searching for the created Knowledge Statement ...')
        await page.waitForTimeout(3000)
        await page.waitForSelector('li.MuiButtonBase-root.MuiMenuItem-root.MuiMenuItem-gutters.MuiMenuItem-root.MuiMenuItem-gutters')
        const sidebar_buttons = await page.$$('ul.MuiList-root.MuiList-padding > li')
        await sidebar_buttons[1].click()
        await page.waitForSelector(selectors.SEARCH_ICON)
        await page.waitForSelector('div:has(> input[placeholder="Search for Knowledge Statements"]')
        await page.click('div:has(> input[placeholder="Search for Knowledge Statements"]')
        await page.waitForTimeout(3000)
        await page.type('div:has(> input[placeholder="Search for Knowledge Statements"]', `${knowledge_statement_1}`)
        await page.waitForSelector('.MuiDataGrid-row.MuiDataGrid-row--dynamicHeight')
        await page.waitForTimeout(6000)
        const searched_records_count = await page.$$eval('.MuiDataGrid-row.MuiDataGrid-row--dynamicHeight', elements => elements.length);
        expect(searched_records_count).toBe(1)

        await page.waitForSelector(selectors.TABLE_ROW)
        await page.click(selectors.TABLE_ROW)

        await page.waitForSelector(selectors.SENTENCE_PAGE)
        console.log('Statement found')
    })

    it('Distillation - add tags and notes', async () => {
        console.log('Adding Tags and Notes ...')
        // Tags
        await page.click(selectors.TAGS_FIELD)
        await page.type(selectors.TAGS_FIELD, tags)
        await page.keyboard.press('ArrowDown');
        await page.keyboard.press('Enter')
        await page.waitForTimeout(3000)

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

        console.log('Tags and Notes added')
    })

    it('Set status as Connection Missing', async () => {
        console.log('Changing Status ...')
        await page.click(selectors.STATUS_BUTTON)
        await page.waitForTimeout(1000)
        const sentence_status = await page.$$eval('span.MuiChip-label.MuiChip-labelSmall', status => {
            return status.map(status => status.innerText)
        })
        expect(sentence_status).toContain("Connection Missing")
        console.log('Status Changed')
    })

    it('Set status as Curate', async () => {
        console.log('Changing Status ...')
        await page.click(selectors.STATUS_BUTTON)
        await page.waitForTimeout(1000)
        const sentence_status = await page.$$eval('span.MuiChip-label.MuiChip-labelSmall', status => {
            return status.map(status => status.innerText)
        })
        expect(sentence_status).toContain("Curated")
        console.log('Status Changed')
    })

    it('Fill Proofing', async () => {

        console.log('Filling Proofing section ...')
        await page.click('button[role="tab"][aria-selected="false"]')
        await page.waitForTimeout(3000)
        
        //Origin
        await page.waitForSelector(selectors.ORIGIN_FIELD)
        await page.click(selectors.ORIGIN_FIELD)
        await page.type(selectors.ORIGIN_FIELD, path_builder_origin_)
        await page.waitForTimeout(3000)
        await page.keyboard.press('ArrowDown');
        await page.keyboard.press('Enter')
        await page.waitForTimeout(selectors.PROGRESS_LOADER, { timeout: 5000, hidden: false });
        await page.waitForTimeout(selectors.PROGRESS_LOADER, { hidden: true });
        await page.waitForTimeout(5000)

        //Vias
        await page.click(selectors.ADD_VIA)
        await page.waitForSelector(selectors.NOT_SPECIFIED_BUTTON);
        await page.waitForTimeout(3000)

        const not_specified_buttons = await page.$$('div.MuiInputBase-root.MuiOutlinedInput-root.MuiInputBase-colorPrimary.MuiInputBase-formControl:has(> div.MuiSelect-select.MuiSelect-standard.MuiInputBase-input.MuiOutlinedInput-input');
        await not_specified_buttons[0].click()
        await page.waitForSelector(`li[data-value= "${path_builder_axon}"]`)
        await page.click(`li[data-value= "${path_builder_axon}"]`)
        await page.waitForTimeout(selectors.PROGRESS_LOADER, { timeout: 5000, hidden: false });
        await page.waitForTimeout(selectors.PROGRESS_LOADER, { hidden: true });
        await page.waitForTimeout(3000)

        await page.waitForSelector(selectors.VIA_FIELD)
        await page.click(selectors.VIA_FIELD)
        await page.type(selectors.VIA_FIELD, path_builder_via)
        await page.waitForTimeout(3000)
        await page.keyboard.press('ArrowDown');
        await page.keyboard.press('Enter')
        await page.waitForTimeout(selectors.PROGRESS_LOADER, { timeout: 5000, hidden: false });
        await page.waitForTimeout(selectors.PROGRESS_LOADER, { hidden: true });
        await page.waitForTimeout(3000)

        //Destination
        await not_specified_buttons[1].click()
        await not_specified_buttons[1].type(path_builder_axon_terminal)
        await page.click(`li[data-value= "${path_builder_axon_terminal}"]`)
        await page.waitForTimeout(selectors.PROGRESS_LOADER, { timeout: 5000, hidden: false });
        await page.waitForTimeout(selectors.PROGRESS_LOADER, { hidden: true });
        await page.waitForTimeout(3000)

        await page.waitForSelector(selectors.DESTINATION_FIELD)
        await page.click(selectors.DESTINATION_FIELD)
        await page.type(selectors.DESTINATION_FIELD, path_builder_destination)
        await page.waitForTimeout(3000)
        await page.keyboard.press('ArrowDown');
        await page.keyboard.press('Enter')
        await page.waitForTimeout(selectors.PROGRESS_LOADER, { timeout: 5000, hidden: false });
        await page.waitForTimeout(selectors.PROGRESS_LOADER, { hidden: true });
        await page.waitForTimeout(3000)

        console.log('Proofing Section filled')

    })

    it('Check Values and Statement Preview', async () => {
        console.log('Checking Values and Statement Preview ...')
        
        //Check Statement Preview 
        await page.waitForSelector(selectors.STATEMENT_PREVIEW)
        await page.waitForSelector(selectors.STATEMENT_PREVIEW_TITLE)
        const journey = await page.$$eval('h5.MuiTypography-root.MuiTypography-h5 + p.MuiTypography-root.MuiTypography-body1', journey => {
            return journey.map(journey => journey.innerText)
        })
        expect(journey).toContain(`${path_builder_origin_} to ${path_builder_destination} via ${path_builder_via}`)

        //Check values
        await page.waitForSelector(`input[value= "${path_builder_origin_}"]`)
        await page.waitForSelector(`input[value= "${path_builder_via}"]`)
        await page.waitForSelector(`input[value= "${path_builder_axon}"]`)
        await page.waitForSelector(`input[value= "${path_builder_axon_terminal}"]`)
        await page.waitForSelector(`input[value= "${path_builder_destination}"]`)

        console.log('Values and Statement Preview correct')
    })

    it('Set status as To be Reviewed', async () => {
        console.log('Changing Status ...')
        
        await page.waitForSelector(selectors.STATUS_BUTTON)
        await page.click(selectors.STATUS_BUTTON)
        await page.waitForTimeout(1000)
        const sentence_status = await page.$$eval('span.MuiChip-label.MuiChip-labelSmall', status => {
            return status.map(status => status.innerText)
        })
        expect(sentence_status).toContain("To Be Reviewed")
        console.log('Status Changed')
    })

    it('Set status as NPO Approved', async () => {
        console.log('Changing Status ...')
        
        await page.waitForSelector(selectors.STATUS_BUTTON)
        await page.click(selectors.STATUS_DROPDOWN)
        await page.waitForSelector('li.MuiButtonBase-root.MuiMenuItem-root.MuiMenuItem-gutters.MuiMenuItem-root.MuiMenuItem-gutters')
        await page.evaluate(() => {
            [...document.querySelectorAll('li.MuiButtonBase-root.MuiMenuItem-root.MuiMenuItem-gutters.MuiMenuItem-root.MuiMenuItem-gutters')].find(element => element.innerText === 'NPO approved').click();
        });

        await page.click(selectors.STATUS_BUTTON)
        await page.waitForTimeout(1000)
        const sentence_status = await page.$$eval('span.MuiChip-label.MuiChip-labelSmall', status => {
            return status.map(status => status.innerText)
        })
        expect(sentence_status).toContain("Npo Approved")
        console.log('Status Changed')
    })


    it('Logout', async () => {
        console.log('Logging out ...')
        
        await page.waitForSelector(selectors.LOGOUT)
        await page.click(selectors.LOGOUT)
        await page.waitForSelector(selectors.LOGIN_PAGE, { timeout: 60000 })
        expect(page.url()).toContain('orcid.org/signin')
        console.log('User logged out')
    })





})
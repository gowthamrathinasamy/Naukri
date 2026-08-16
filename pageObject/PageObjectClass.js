class PageObjectClass {
    constructor(page) {
        this.page = page;
    }

    async goto(url) {
        await this.page.goto(url);
    }

    async login(email, password) {
        await this.page.locator('text=Login').click();

        await this.page
            .locator('input[placeholder="Enter your active Email ID / Username"]')
            .fill(email);

        await this.page
            .locator('input[placeholder="Enter your password"]')
            .fill(password);

        await this.page.locator('button[type="submit"]').click();
    }

    async updateResume(resumePath) {
        await this.page.locator('text=Update Resume').click();

        const [fileChooser] = await Promise.all([
            this.page.waitForEvent('filechooser'),
            this.page.locator('input[value="Update resume"]').click(),
        ]);

        await fileChooser.setFiles(resumePath);
    }

    async autoApply() {

        const recommendedJobsUrl =
            'https://www.naukri.com/mnjuser/recommendedjobs';

        const tabSelector =
            '.tab-list-item';

        const checkboxSelector =
            'div.saveJobContainer.tuple-check-box i.naukicon-ot-checkbox';

        const applyButtonSelector =
            '.multi-apply-button.typ-16Bold';

        const chatBotMsgContainer =
            this.page.locator('.chatbot_MessageContainer');

        const chatBotCloseButton =
            this.page.locator(
                '.chatbot_Nav .crossIcon.chatBot.chatBot-ic-cross'
            );

        const batchSize = 5;

        let screenshotNumber = 1;


        // =====================================================
        // OPEN RECOMMENDED JOBS
        // =====================================================

        await this.page.goto(recommendedJobsUrl, {
            waitUntil: 'domcontentloaded',
            timeout: 30000
        });

        await this.page
            .locator(tabSelector)
            .first()
            .waitFor({
                state: 'visible',
                timeout: 15000
            });


        // =====================================================
        // FIND TABS
        // =====================================================

        const tabCount =
            await this.page
                .locator(tabSelector)
                .count();

        console.log(`Found ${tabCount} tabs.`);


        // =====================================================
        // PROCESS EACH TAB
        // =====================================================

        for (
            let tabIndex = 0;
            tabIndex < tabCount;
            tabIndex++
        ) {

            console.log(
                `\n========== TAB ${tabIndex + 1} STARTED ==========`
            );


            // -------------------------------------------------
            // Reload only when moving to a NEW tab
            // -------------------------------------------------

            if (tabIndex > 0) {

                await this.page.goto(
                    recommendedJobsUrl,
                    {
                        waitUntil: 'domcontentloaded',
                        timeout: 30000
                    }
                );

                await this.page
                    .locator(tabSelector)
                    .first()
                    .waitFor({
                        state: 'visible',
                        timeout: 15000
                    });
            }


            // -------------------------------------------------
            // OPEN TAB
            // -------------------------------------------------

            const tabs =
                this.page.locator(tabSelector);

            await tabs
                .nth(tabIndex)
                .click();

            console.log(
                `Opened Tab ${tabIndex + 1}.`
            );


            // -------------------------------------------------
            // WAIT FOR JOBS TO LOAD
            // -------------------------------------------------

            const checkboxes =
                this.page.locator(checkboxSelector);

            try {

                await checkboxes
                    .first()
                    .waitFor({
                        state: 'visible',
                        timeout: 10000
                    });

            } catch {

                console.log(
                    `Tab ${tabIndex + 1}: No checkbox found.`
                );
            }


            await this.page.waitForTimeout(1000);


            // =================================================
            // PROCESS CURRENT TAB
            // =================================================

            let previousJobCount = -1;

            while (true) {

                const currentCheckboxes =
                    this.page.locator(checkboxSelector);

                const jobCount =
                    await currentCheckboxes.count();

                console.log(
                    `Tab ${tabIndex + 1}: ${jobCount} jobs remaining.`
                );


                // -------------------------------------------------
                // NO JOBS
                // -------------------------------------------------

                if (jobCount === 0) {

                    console.log(
                        `Tab ${tabIndex + 1}: No more jobs.`
                    );

                    break;
                }


                // -------------------------------------------------
                // SAFETY CHECK
                //
                // If the count doesn't change after applying,
                // don't keep applying the same jobs forever.
                // -------------------------------------------------

                if (
                    previousJobCount === jobCount
                ) {

                    console.log(
                        `Tab ${tabIndex + 1}: Job count did not change.`
                    );

                    console.log(
                        'Stopping this tab to prevent duplicate applications.'
                    );

                    break;
                }


                previousJobCount = jobCount;


                // -------------------------------------------------
                // SELECT MAXIMUM 5
                // -------------------------------------------------

                const currentBatch =
                    Math.min(
                        batchSize,
                        jobCount
                    );

                console.log(
                    `Selecting ${currentBatch} jobs...`
                );


                for (
                    let i = 0;
                    i < currentBatch;
                    i++
                ) {

                    await currentCheckboxes
                        .nth(i)
                        .click();
                }


                console.log(
                    `Selected ${currentBatch} jobs.`
                );


                // -------------------------------------------------
                // CLICK APPLY
                // -------------------------------------------------

                const applyButton =
                    this.page.locator(
                        applyButtonSelector
                    );

                await applyButton.waitFor({
                    state: 'visible',
                    timeout: 10000
                });

                await applyButton.click();

                console.log(
                    `Applied button clicked for ${currentBatch} jobs.`
                );


                // =================================================
                // CHATBOT
                // =================================================

                try {

                    await chatBotMsgContainer.waitFor({
                        state: 'visible',
                        timeout: 5000
                    });

                    console.log(
                        'Chatbot message detected.'
                    );


                    const chatbotMessage =
                        await chatBotMsgContainer.innerText();

                    console.log(
                        `Chatbot message:\n${chatbotMessage}`
                    );


                    if (
                        await chatBotCloseButton.isVisible()
                    ) {

                        await chatBotCloseButton.click();

                        console.log(
                            'Chatbot closed.'
                        );
                    }

                } catch {

                    console.log(
                        'Chatbot message did not appear.'
                    );
                }


                // =================================================
                // SCREENSHOT
                // =================================================

                const screenshotPath =
                    `screenshots/auto-apply-tab-${tabIndex + 1}-batch-${screenshotNumber}.png`;

                await this.page.screenshot({
                    path: screenshotPath,
                    fullPage: true
                });

                console.log(
                    `Screenshot saved: ${screenshotPath}`
                );

                screenshotNumber++;


                // -------------------------------------------------
                // DO NOT RELOAD HERE
                // -------------------------------------------------

                console.log(
                    'Staying on current page after Apply.'
                );


                /*
                 * Give Naukri a moment to update its UI.
                 *
                 * Then the while loop checks the current DOM
                 * again.
                 */

                await this.page.waitForTimeout(1000);
            }


            console.log(
                `========== TAB ${tabIndex + 1} COMPLETED ==========\n`
            );
        }


        console.log(
            'All recommended job tabs have been processed.'
        );
    }
}

module.exports = PageObjectClass;
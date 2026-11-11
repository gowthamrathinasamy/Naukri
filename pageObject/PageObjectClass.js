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
            'label.saveJobContainer.tuple-check-box';

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
        const attemptedJobKeys = new Set();
        const applyButton =
            this.page.locator(applyButtonSelector);

        const getSelectedJobCount = async () => {
            const buttonText = await applyButton.innerText();
            const match = buttonText.match(/apply\s+(\d+)\s+jobs?/i);
            return match ? Number(match[1]) : 0;
        };

        const clearSelectedJobs = async (jobCards) => {
            const jobCount = await jobCards.count();

            for (let i = 0; i < jobCount; i++) {
                const checkbox = jobCards.nth(i).getByRole('checkbox');

                if (
                    await checkbox.count() > 0 &&
                    await checkbox.isChecked()
                ) {
                    await jobCards.nth(i).click();

                    if (await checkbox.isChecked()) {
                        throw new Error(
                            `Could not clear selected job ${i + 1}; its selection control remained checked after clicking the job label.`
                        );
                    }
                }
            }

            const remainingSelectionCount =
                await getSelectedJobCount();

            if (remainingSelectionCount !== 0) {
                throw new Error(
                    `Could not clear previous selection; Apply button still shows ${remainingSelectionCount} selected jobs.`
                );
            }
        };

        const openRecommendedJobs = async () => {
            const tabs = this.page.locator(tabSelector);
            const onRecommendedJobs =
                this.page.url().startsWith(recommendedJobsUrl);

            if (
                onRecommendedJobs &&
                await tabs.count() > 0 &&
                await tabs.first().isVisible()
            ) {
                return;
            }

            await this.page.goto(recommendedJobsUrl, {
                waitUntil: 'commit',
                timeout: 30000
            });

            await tabs.first().waitFor({
                state: 'visible',
                timeout: 15000
            });
        };

        const openRecommendedTab = async (tabIndex) => {
            await openRecommendedJobs();

            const tab = this.page
                .locator(tabSelector)
                .nth(tabIndex);

            await tab.waitFor({
                state: 'visible',
                timeout: 10000
            });
            await tab.click();

            try {
                await this.page
                    .locator(checkboxSelector)
                    .first()
                    .waitFor({
                        state: 'visible',
                        timeout: 10000
                    });
            } catch (error) {
                if (error.name !== 'TimeoutError') {
                    throw error;
                }

                console.log(
                    `Tab ${tabIndex + 1}: No job checkboxes became visible after opening the tab.`
                );
            }
        };

        // =====================================================
        // OPEN RECOMMENDED JOBS
        // =====================================================

        await openRecommendedJobs();


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
            // OPEN TAB
            // -------------------------------------------------

            await openRecommendedTab(tabIndex);

            console.log(
                `Opened Tab ${tabIndex + 1}.`
            );


            // =================================================
            // PROCESS CURRENT TAB
            // =================================================

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
                    if (!this.page.url().startsWith(recommendedJobsUrl)) {
                        console.log(
                            `Tab ${tabIndex + 1}: Apply left the recommendations page. Returning to the same tab to continue.`
                        );

                        await openRecommendedTab(tabIndex);

                        continue;
                    }

                    console.log(
                        `Tab ${tabIndex + 1}: No more jobs.`
                    );

                    break;
                }

                if (await getSelectedJobCount() > 0) {
                    console.log(
                        `Tab ${tabIndex + 1}: Clearing selections left from the previous batch.`
                    );
                    await clearSelectedJobs(currentCheckboxes);
                }


                // -------------------------------------------------
                // FIND THE NEXT BATCH OF UNPROCESSED JOBS
                // -------------------------------------------------

                const jobsToApply = [];

                for (let i = 0; i < jobCount; i++) {
                    const checkbox = currentCheckboxes.nth(i);
                    const jobKey = await checkbox.evaluate(
                        (element, { currentTabIndex, jobIndex, checkboxSelector }) => {
                            let node = element;

                            for (let depth = 0; node && depth < 12; depth++) {
                                const jobId =
                                    node.getAttribute('data-job-id') ||
                                    node.getAttribute('data-jobid');

                                if (jobId) {
                                    return `id:${jobId}`;
                                }

                                const jobLink = node.matches?.(
                                    'a[href*="/job-listings/"]'
                                )
                                    ? node
                                    : node.querySelector(
                                        'a[href*="/job-listings/"]'
                                    );

                                if (jobLink) {
                                    return `url:${jobLink.href.split(/[?#]/)[0]}`;
                                }

                                const text = node.innerText
                                    ?.replace(/\s+/g, ' ')
                                    .trim();

                                const checkboxCount =
                                    node.querySelectorAll(checkboxSelector).length;

                                if (
                                    checkboxCount === 1 &&
                                    text &&
                                    text.length > 30 &&
                                    text.length < 2000
                                ) {
                                    return `text:${text}`;
                                }

                                node = node.parentElement;
                            }

                            return `tab:${currentTabIndex}:index:${jobIndex}`;
                        },
                        {
                            currentTabIndex: tabIndex,
                            jobIndex: i,
                            checkboxSelector
                        }
                    );

                    if (!attemptedJobKeys.has(jobKey)) {
                        jobsToApply.push({ checkbox, jobKey });
                    }

                }

                if (jobsToApply.length === 0) {
                    console.log(
                        `Tab ${tabIndex + 1}: All ${jobCount} jobs have already been processed.`
                    );

                    break;
                }

                const currentBatch = jobsToApply.slice(0, batchSize);

                console.log(
                    `Tab ${tabIndex + 1}: ${jobsToApply.length} unprocessed jobs found; applying the next ${currentBatch.length}.`
                );


                for (let i = 0; i < currentBatch.length; i++) {
                    const selectedCount = await getSelectedJobCount();

                    if (selectedCount >= batchSize) {
                        throw new Error(
                            `Selection limit reached (${selectedCount}); refusing to select another job.`
                        );
                    }

                    const job = currentBatch[i];
                    await job.checkbox.click();

                    const selectedCountAfterClick =
                        await getSelectedJobCount();

                    if (selectedCountAfterClick > batchSize) {
                        throw new Error(
                            `Naukri reports ${selectedCountAfterClick} selected jobs; the maximum is ${batchSize}.`
                        );
                    }
                }


                console.log(
                    `Selected ${currentBatch.length} jobs.`
                );


                // -------------------------------------------------
                // CLICK APPLY
                // -------------------------------------------------

                await applyButton.waitFor({
                    state: 'visible',
                    timeout: 10000
                });

                const applyButtonText = await applyButton.innerText();
                const selectedJobCount = await getSelectedJobCount();

                if (
                    selectedJobCount !== currentBatch.length
                ) {
                    throw new Error(
                        `Expected ${currentBatch.length} selected jobs, but the Apply button shows "${applyButtonText.trim()}".`
                    );
                }

                await applyButton.click();

                for (const job of currentBatch) {
                    attemptedJobKeys.add(job.jobKey);
                }

                console.log(
                    `Applied button clicked for ${currentBatch.length} jobs.`
                );

                await this.page.waitForTimeout(1000);

                const pageText = await this.page.locator('body').innerText();
                const requestErrorMessage =
                    /there was some error processing your request/i;

                if (requestErrorMessage.test(pageText)) {
                    console.log(
                        `Tab ${tabIndex + 1}: Naukri reported an application error for this batch. Marking these jobs as attempted and continuing with the next batch.`
                    );
                }

                if (
                    /mandatory questions|application questions?|screening questions?|please answer|required question/i
                        .test(pageText)
                ) {
                    console.log(
                        'Question prompt detected. Leaving questions unanswered and continuing to the next batch.'
                    );
                }


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

                if (!this.page.url().startsWith(recommendedJobsUrl)) {
                    console.log(
                        `Tab ${tabIndex + 1}: Apply navigated away. Returning to this tab before continuing.`
                    );
                    await openRecommendedTab(tabIndex);
                    continue;
                }

                if (this.page.url().startsWith(recommendedJobsUrl)) {
                    await clearSelectedJobs(
                        this.page.locator(checkboxSelector)
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


                // Keep the current recommendations page alive between batches.
                // Reloading here can be interrupted by Naukri's Apply navigation.
                await this.page.waitForTimeout(1000);
            }


            console.log(
                `========== TAB ${tabIndex + 1} COMPLETED ==========\n`
            );

            if (tabIndex + 1 < tabCount) {
                console.log(
                    `Tab ${tabIndex + 1} is finished. Next: tab ${tabIndex + 2} of ${tabCount}.`
                );
            }
        }


        console.log(
            'All recommended job tabs have been processed.'
        );
    }
}

module.exports = PageObjectClass;
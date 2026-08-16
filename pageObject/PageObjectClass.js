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
}

module.exports = PageObjectClass;
import { test, expect } from '@playwright/test';

test.describe('Dashboard Critical Paths', () => {
    const testEmail = `e2e-${Math.random().toString(36).substring(7)}@test.com`;
    const testPassword = 'Password123!';

    test.beforeEach(async ({ page }) => {
        page.on('console', msg => console.log('BROWSER LOG:', msg.text()));

        await page.goto('/auth/register');

        await page.getByPlaceholder('ООО Ромашка').fill('E2E Corp');
        await page.getByPlaceholder('г. Москва, ул. Примерная, д. 1').fill('E2E Address');
        await page.getByPlaceholder('79991234567').fill('79001112233');
        await page.getByPlaceholder('info@restaurant.com').fill(testEmail);

        const passwordInputs = page.getByPlaceholder('••••••••');
        await passwordInputs.nth(0).fill(testPassword);
        await passwordInputs.nth(1).fill(testPassword);

        await page.click('h2:has-text("Регистрация")');

        const submitBtn = page.getByRole('button', { name: 'Зарегистрироваться' });
        await expect(submitBtn).toBeEnabled({ timeout: 10000 });
        await submitBtn.click();

        await Promise.race([
            page.waitForURL(/.*dashboard/, { timeout: 30000 }).catch(() => { }),
            page.waitForSelector('text=Успех, text=Успешно', { timeout: 30000 }).catch(() => { })
        ]);

        const continueBtn = page.locator('button:has-text("Продолжить"), button:has-text("Перейти")').first();
        if (await continueBtn.isVisible()) {
            await continueBtn.click();
        }

        await expect(page).toHaveURL(/.*dashboard/, { timeout: 30000 });
    });

    test('should create a new calculation and navigate to details view', async ({ page }) => {
        const newCalcBtn = page.locator('button:has-text("Новый расчет"), button:has-text("Создать первый расчет")').first();
        await newCalcBtn.click();

        await page.selectOption('select', { index: 1 });
        await page.getByPlaceholder('90').fill('200');
        await page.getByPlaceholder('55').fill('10');
        await page.getByPlaceholder('100').fill('50');

        await page.click('button:has-text("Продолжить настройку")');

        await page.click('button:has-text("Добавить зону")');
        await page.locator('button:has-text("Кухня"), button:has-text("Склад")').first().click();
        await page.getByPlaceholder('50').fill('100');
        await page.click('button:has-text("Зафиксировать зону")');

        await page.click('button:has-text("Сформировать расчет")');
        await expect(page.locator('text=Спецификация сформирована')).toBeInViewport();

        // Final button click
        const sendBtn = page.getByRole('button', { name: /ОТПРАВИТЬ ЭКСПЕРТУ/i });
        await sendBtn.click();

        // Wait for details view to appear
        await expect(page.getByText('Детали проекта')).toBeVisible({ timeout: 30000 });

        // Verify Audit Trail
        await page.click('button:has-text("Лента событий")');
        await expect(page.getByText(/Система|Создан/)).toBeVisible();
    });

    test('should manage audit trail tabs and interaction types', async ({ page }) => {
        const newCalcBtn = page.locator('button:has-text("Новый расчет"), button:has-text("Создать первый расчет")').first();
        await newCalcBtn.click();

        await page.selectOption('select', { index: 1 });
        await page.getByPlaceholder('90').fill('100');
        await page.click('button:has-text("Продолжить настройку")');

        await page.click('button:has-text("Добавить зону")');
        await page.locator('button:has-text("Кухня"), button:has-text("Склад")').first().click();
        await page.getByPlaceholder('50').fill('50');
        await page.click('button:has-text("Зафиксировать зону")');

        await page.click('button:has-text("Сформировать расчет")');
        await page.getByRole('button', { name: /ОТПРАВИТЬ ЭКСПЕРТУ/i }).click();

        // Verify title
        await expect(page.getByText('Детали проекта')).toBeVisible({ timeout: 30000 });

        const eventsTab = page.locator('button:has-text("Лента событий")');
        const chatTab = page.locator('button:has-text("Обсуждение")');

        await expect(eventsTab).toBeVisible();
        await expect(chatTab).toBeVisible();

        await eventsTab.click();
        await expect(page.getByText(/Система|Создан/)).toBeVisible();

        await chatTab.click();
        await expect(page.locator('input[placeholder*="Напишите"], textarea[placeholder*="Напишите"]')).toBeVisible();
    });
});

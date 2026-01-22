import { test, expect } from '@playwright/test';

/**
 * Security E2E Tests
 * Purpose: Validate critical security controls before production deployment
 */

test.describe('Authentication Security', () => {
    test('should redirect unauthenticated users from protected routes', async ({ page }) => {
        // Try to access dashboard directly
        await page.goto('/dashboard');

        // Should redirect to login
        await expect(page).toHaveURL(/.*auth\/login/);

        // Login form should be present
        await expect(page.locator('input[type="email"]')).toBeVisible();
        await expect(page.locator('button[type="submit"]')).toBeVisible();
    });

    test('should redirect unauthenticated users from manager dashboard', async ({ page }) => {
        await page.goto('/dashboard/manager');
        await expect(page).toHaveURL(/.*auth\/login/);
    });

    test('should redirect unauthenticated users from admin dashboard', async ({ page }) => {
        await page.goto('/dashboard/admin');
        await expect(page).toHaveURL(/.*auth\/login/);
    });

    test('should prevent access to client pages for unauthenticated users', async ({ page }) => {
        await page.goto('/dashboard/client');
        await expect(page).toHaveURL(/.*auth\/login/);
    });

    test('should show error on invalid login credentials', async ({ page }) => {
        await page.goto('/auth/login');

        // Fill invalid credentials
        await page.fill('input[type="email"]', 'invalid@test.com');
        await page.fill('input[type="password"]', 'wrongpassword123');
        await page.click('button[type="submit"]');

        // Should show error message (not reveal if user exists)
        await expect(page.locator('text=/ошибка|invalid|неверн/i')).toBeVisible({ timeout: 5000 });

        // Should stay on login page
        await expect(page).toHaveURL(/.*auth\/login/);
    });
});

test.describe('Partner Embed Calculator Security', () => {
    test('should reject embed without partner ID', async ({ page }) => {
        await page.goto('/partner/calculator');

        // Should show access denied
        await expect(page.locator('text=/доступ|запрещ|MISSING_PARTNER_ID/i')).toBeVisible({
            timeout: 5000,
        });
    });

    test('should reject embed with invalid partner ID', async ({ page }) => {
        await page.goto('/partner/calculator?partner=invalid-uuid');

        // Should show error (validation or not found)
        await expect(page.locator('text=/доступ|ошибка|invalid|not found/i')).toBeVisible({
            timeout: 5000,
        });
    });

    test('should reject embed with malformed UUID', async ({ page }) => {
        await page.goto('/partner/calculator?partner=not-a-uuid');

        // Should handle gracefully
        await expect(page.locator('text=/доступ|ошибка|error/i')).toBeVisible({ timeout: 5000 });
    });
});

test.describe('Security Headers', () => {
    test('should have security headers on main pages', async ({ request }) => {
        const response = await request.get('/');

        // Check critical security headers
        expect(response.headers()['x-content-type-options']).toBe('nosniff');
        expect(response.headers()['x-xss-protection']).toBe('1; mode=block');
        expect(response.headers()['referrer-policy']).toBe('strict-origin-when-cross-origin');
    });

    test('should have X-Frame-Options DENY on non-embed pages', async ({ request }) => {
        const response = await request.get('/auth/login');

        // Main app should not be embeddable
        const xfo = response.headers()['x-frame-options'];
        const csp = response.headers()['content-security-policy'];

        // Either X-Frame-Options or CSP frame-ancestors should block
        const isProtected = xfo === 'DENY' || (csp && csp.includes('frame-ancestors'));
        expect(isProtected).toBeTruthy();
    });
});

test.describe('API Security', () => {
    test('should reject API calls without authentication', async ({ request }) => {
        // Try to access protected endpoint without auth
        const response = await request.post('/api/send-invite', {
            data: {
                email: 'test@test.com',
                role: 'manager',
                inviteLink: 'https://example.com',
            },
        });

        // Should be unauthorized
        expect(response.status()).toBe(401);
    });

    test('should reject feedback API without required fields', async ({ request }) => {
        const response = await request.post('/api/send-feedback', {
            data: {
                // Missing required 'name' and 'email'
                message: 'Test message',
            },
        });

        // Should be bad request
        expect(response.status()).toBe(400);
    });

    test('should filter honeypot submissions silently', async ({ request }) => {
        const response = await request.post('/api/send-feedback', {
            data: {
                name: 'Bot User',
                email: 'bot@test.com',
                message: 'Spam message',
                _honey: 'filled-by-bot', // Honeypot field
            },
        });

        // Should return 200 but silently ignore (fool the bot)
        expect(response.status()).toBe(200);
        const body = await response.json();
        expect(body.id).toBe('bot-filtered');
    });
});

test.describe('Error Handling', () => {
    test('should show 404 page for unknown routes', async ({ page }) => {
        await page.goto('/this-page-does-not-exist');

        // Should show 404 content
        await expect(page.locator('text=/404|не найден|not found/i')).toBeVisible();
    });

    test('should not leak stack traces in production errors', async ({ page }) => {
        // Navigate to a page that might trigger an error
        await page.goto('/');

        // Ensure no stack traces are visible
        const pageContent = await page.content();
        expect(pageContent).not.toContain('at Object.');
        expect(pageContent).not.toContain('node_modules');
        expect(pageContent).not.toContain('.tsx:');
    });
});

test.describe('Input Validation', () => {
    test('login form should validate email format', async ({ page }) => {
        await page.goto('/auth/login');

        // Enter invalid email
        await page.fill('input[type="email"]', 'not-an-email');
        await page.fill('input[type="password"]', 'password123');
        await page.click('button[type="submit"]');

        // Form should show validation error or browser validation should trigger
        // The form should not submit successfully
        await expect(page).toHaveURL(/.*auth\/login/);
    });

    test('registration form should enforce password requirements', async ({ page }) => {
        await page.goto('/auth/register');

        // Wait for form to load
        await expect(page.locator('input[type="email"]')).toBeVisible();

        // Try weak password (less than 8 chars, only letters)
        const passwordInput = page.locator('input[type="password"]').first();
        if (await passwordInput.isVisible()) {
            await passwordInput.fill('weak');

            // Submit button or validation message
            // Password should be rejected by frontend validation
            // Either warning exists or password field has validation state
            await expect(
                page.locator('text=/слишком коротк|too short|минимум|символ/i')
            ).toBeVisible();
        }
    });
});

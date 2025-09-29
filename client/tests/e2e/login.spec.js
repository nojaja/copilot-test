import { test, expect } from '@playwright/test';

// ログインE2Eテスト
// demo@example.com / password123 でログインし、CORSや認証の挙動を確認

test('ログイン画面から正常にログインできること', async ({ page }) => {
  await page.goto('http://localhost:8080/login');

  // フォーム入力
  await page.fill('input[type="email"]', 'demo@example.com');
  await page.fill('input[type="password"]', 'password123');

  // 送信（指定のxpathでクリック）
  await page.click('xpath=//*[@id="app"]/main/div/div/div/div/div/div/form/button');

  // ログイン後の画面遷移・ユーザー名表示などで判定
  await expect(page.locator('text=Demo User')).toBeVisible();
});

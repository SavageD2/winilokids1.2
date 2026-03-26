import { expect, test } from '@playwright/test';

test('parent can log in and submit a reservation request', async ({ page }) => {
  await page.goto('/inscription');

  const loginForm = page.locator('form.auth-card').nth(1);
  await loginForm.getByLabel('Email').fill('camille.martin@example.com');
  await loginForm.getByLabel('Mot de passe').fill('DemoParent123!');
  await loginForm.getByRole('button', { name: 'Me connecter' }).click();

  await expect(page.getByText('Session active')).toBeVisible();

  await page.goto('/reservation');
  await expect(page.getByRole('heading', { name: 'Finalise la reservation de ton enfant depuis ton compte parent.' })).toBeVisible();

  await page.getByLabel("Prenom de l enfant").fill('Maya');
  await page.getByLabel("Age de l enfant").fill('6');
  await page.getByLabel('Atelier').selectOption({ index: 1 });
  await page.getByLabel('Message complementaire').fill('Maya aime les groupes calmes et les activites creatives.');
  await page.getByRole('button', { name: 'Confirmer la reservation' }).click();

  await expect(page.getByText('Demande enregistree pour l atelier')).toBeVisible();

  await page.goto('/inscription');
  await expect(page.getByText('Maya')).toBeVisible();
});

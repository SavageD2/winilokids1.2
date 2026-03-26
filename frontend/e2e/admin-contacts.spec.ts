import { expect, test } from '@playwright/test';

test('admin can log in and update a contact follow-up', async ({ page }) => {
  await page.goto('/admin/login');

  await page.getByLabel('Email').fill('admin@winilo-kids.fr');
  await page.getByLabel('Mot de passe').fill('ChangeMe123!');
  await page.getByRole('button', { name: 'Se connecter' }).click();

  await expect(page).toHaveURL(/\/admin\/dashboard$/);

  await page.goto('/admin/contacts');
  await expect(page.getByRole('heading', { name: 'Messages de contact' })).toBeVisible();

  await page.getByLabel('Recherche').fill('Sophie Leroy');
  await page.waitForTimeout(350);

  const contactCard = page.locator('.contact-card').first();
  await expect(contactCard).toContainText('Sophie Leroy');

  await contactCard.locator('.status-field select').selectOption('IN_PROGRESS');
  await expect(page.getByText('Statut du message mis a jour.')).toBeVisible();

  await contactCard.locator('.notes-field textarea').fill('Reponse en cours de preparation.');
  await contactCard.getByRole('button', { name: 'Enregistrer la note' }).click();

  await expect(page.getByText('Note interne enregistree.')).toBeVisible();
});

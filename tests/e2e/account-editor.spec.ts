import { expect, test, type Page } from '@playwright/test';
import type { EditorCommand, EditorState } from '../../packages/contracts/src/editorial';
import type { SampleActivityInput, SampleLearning, SampleReceipt } from '../../packages/contracts/src/sample-learning';
import { mkdirSync } from 'node:fs';
// Fail closed: protocol tests must never send real provider email or use live data.
test.beforeEach(async ({ page }) => { await page.route('https://*.supabase.co/**', route => route.abort('blockedbyclient')); });
test('email sign-in is accessible and never sends mail just by opening the page', async ({ page }) => {
  let sent = false;
  await page.route('**/auth/v1/otp**', async route => { sent = true; await route.fulfill({ status: 200, json: {} }); });
  await page.goto('/study/#/account');
  await expect(page.getByRole('heading', { name: 'Sign in to Law Prep' })).toBeVisible();
  await expect(page.getByLabel('Email address')).toBeVisible(); expect(sent).toBe(false);
  await page.getByLabel('Email address').fill('student@example.invalid');
  await page.getByRole('button', { name: 'Send sign-in code' }).click();
  await expect(page.getByLabel('Sign-in code')).toBeVisible();
  await expect(page.getByRole('button', { name: /Resend code/ })).toBeDisabled(); expect(sent).toBe(true);
  await page.route('**/auth/v1/verify', route => route.fulfill({ status: 403, json: { msg: 'Expired fixture code' } }));
  await page.getByLabel('Sign-in code').fill('123456');
  await page.getByRole('button', { name: 'Verify code' }).click();
  await expect(page.getByRole('alert')).toContainText('could not be verified');
});
test('guessing the editor route while signed out does not reveal private content', async ({ page }) => {
  await page.goto('/study/#/editor');
  await expect(page.getByRole('heading', { name: 'Sign in to publish' })).toBeVisible();
  await expect(page.getByLabel('Correct answer')).toHaveCount(0);
});

const ownerId = '10000000-0000-4000-8000-000000000001';
const versionId = '20000000-0000-4000-8000-000000000001';
const contentId = '30000000-0000-4000-8000-000000000001';
const sourceId = '40000000-0000-4000-8000-000000000001';
function session(id = ownerId, sequence = 1) {
  const payload = Buffer.from(JSON.stringify({ sub: id, session_id: `session-${id}`, exp: Math.floor(Date.now() / 1000) + 3600, sequence })).toString('base64url');
  return { access_token: `e30.${payload}.fixture`, refresh_token: `fixture-refresh-${id}`, token_type: 'bearer', expires_in: 3600, expires_at: Math.floor(Date.now() / 1000) + 3600, user: { id, email: 'owner@example.invalid', aud: 'authenticated', role: 'authenticated', app_metadata: {}, user_metadata: {}, created_at: '2026-10-28T00:00:00Z' } };
}
async function seedAccount(page: Page, role = 'publisher') {
  const value = session();
  await page.addInitScript(value => localStorage.setItem('lawprep.auth', JSON.stringify(value)), value);
  await page.route('**/api/v1/auth/me', route => route.fulfill({ json: { data: { userId: ownerId, email: 'owner@example.invalid', role } } }));
  await page.route('**/api/v1/profile', route => route.fulfill({ json: { data: { userId: ownerId, displayName: 'Owner', timezone: 'UTC', revision: 1 } } }));
}
test('CLAT beginner can leave the date undecided and skip the diagnostic', async ({ page }) => {
  await seedAccount(page, 'learner');
  let saved = { userId: ownerId, cycleId: null as string | null, targetDate: null as string | null,
    dailyMinutes: 30, familiarity: 'new', diagnosticChoice: 'later', revision: 0 };
  await page.route('**/api/v1/catalog?examId=clat-ug', route => route.fulfill({ json: { data: {
    examId: 'clat-ug', cycles: [{ id: 'clat-cycle', examId: 'clat-ug', label: 'CLAT fixture' }], topics: [], items: []
  } } }));
  await page.route('**/api/v1/study-preferences', async route => {
    if (route.request().method() === 'PUT') {
      const input = route.request().postDataJSON();
      saved = { userId: ownerId, cycleId: input.cycleId, targetDate: input.targetDate, dailyMinutes: input.dailyMinutes,
        familiarity: input.familiarity, diagnosticChoice: input.diagnosticChoice, revision: saved.revision + 1 };
    }
    await route.fulfill({ json: { data: saved } });
  });
  await page.goto('/study/#/routes');
  await page.getByRole('link', { name: 'Read the CLAT guide' }).click();
  await expect(page.getByRole('link', { name: 'Official CLAT 2027 syllabus' })).toBeVisible();
  await page.getByRole('link', { name: 'Set up CLAT study' }).click();
  await page.getByLabel('Preparation cycle').selectOption('clat-cycle');
  await page.getByLabel('Minutes per day').fill('25');
  await page.getByLabel('Skip for now').check();
  await page.getByRole('button', { name: 'Save study preferences' }).click();
  await expect(page.getByRole('status').filter({ hasText: 'Study preferences saved' })).toBeVisible();
  expect(saved).toMatchObject({ cycleId: 'clat-cycle', targetDate: null, dailyMinutes: 25, diagnosticChoice: 'skip' });
  await page.reload();
  await expect(page.getByLabel('Minutes per day')).toHaveValue('25');
  await expect(page.getByLabel('Target date')).toHaveValue('');
  await expect(page.getByLabel('Skip for now')).toBeChecked();
  await page.route('**/api/v1/diagnostic', async route => {
    if (route.request().method() === 'POST') {
      expect(route.request().postDataJSON()).toEqual({ answers: [
        { questionId: 'starter-reading', optionId: 'a' }, { questionId: 'starter-logic', optionId: 'b' }
      ] });
      await route.fulfill({ json: { data: { feedback: [
        { questionId: 'starter-reading', correct: true, explanation: 'The passage supports the choice.' },
        { questionId: 'starter-logic', correct: true, explanation: 'The stated rule applies.' }
      ] } } });
      return;
    }
    await route.fulfill({ json: { data: { questions: [
      { id: 'starter-reading', prompt: 'Read the first fixture.', options: [{ id: 'a', text: 'Reading choice A' }, { id: 'b', text: 'Reading choice B' }] },
      { id: 'starter-logic', prompt: 'Read the second fixture.', options: [{ id: 'a', text: 'Logic choice A' }, { id: 'b', text: 'Logic choice B' }] }
    ] } } });
  });
  await page.getByLabel('Try it after saving').check();
  await page.getByRole('button', { name: 'Save study preferences' }).click();
  await page.getByRole('link', { name: 'Start the short diagnostic' }).click();
  await page.getByLabel('Reading choice A').check();
  await page.getByLabel('Logic choice B').check();
  await page.getByRole('button', { name: 'Check my answers' }).click();
  await expect(page.getByText('The stated rule applies.', { exact: false })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Continue to the sample lesson' })).toHaveAttribute('href', '#/learn/clat-sample');
});
test('a student continues from setup and resumes a completed sample with feedback', async ({ page }) => {
  await seedAccount(page, 'learner');
  await page.route('**/api/v1/catalog?examId=clat-ug', route => route.fulfill({ json: { data: {
    examId: 'clat-ug', cycles: [], topics: [], items: []
  } } }));
  await page.route('**/api/v1/study-preferences', route => route.fulfill({ json: { data: {
    userId: ownerId, cycleId: null, targetDate: null, dailyMinutes: 25, familiarity: 'new', diagnosticChoice: 'skip', revision: 1
  } } }));
  const state: SampleLearning = {
    userId: ownerId, readingCompleted: false, feedback: [],
    lesson: { id: 'clat-reading-v1', title: 'Sample reading lesson', objective: 'Find the main point',
      explanation: 'Read the whole passage.', example: { passage: 'Example passage.', reasoning: 'Example reasoning.' },
      questions: [1, 2].map(number => ({ id: 'q' + number, prompt: 'Practice fixture ' + number,
        options: [{ id: 'a', text: 'First choice ' + number }, { id: 'b', text: 'Second choice ' + number }] })) }
  };
  const receipts = new Map<string, { input: SampleActivityInput; receipt: SampleReceipt }>();
  let lostResponse = false;
  await page.route('**/api/v1/sample-learning', async route => {
    if (route.request().method() === 'GET') {
      await route.fulfill({ json: { data: state } });
      return;
    }
    const input = route.request().postDataJSON() as SampleActivityInput;
    const prior = receipts.get(input.mutationId);
    if (prior) {
      expect(input).toEqual(prior.input);
      await route.fulfill({ json: { data: prior.receipt } });
      return;
    }
    const identity = { userId: ownerId, unitId: input.unitId, mutationId: input.mutationId };
    let receipt: SampleReceipt;
    if (input.kind === 'read') {
      state.readingCompleted = true;
      receipt = { ...identity, kind: 'read' };
    } else {
      const feedback = { questionId: input.questionId, selectedOptionId: input.optionId, correct: input.optionId === 'a',
        explanation: 'Explanation for ' + input.questionId, repeated: state.feedback.some(item => item.questionId === input.questionId) };
      state.feedback = [...state.feedback.filter(item => item.questionId !== input.questionId), feedback];
      receipt = { ...identity, kind: 'answer', feedback };
    }
    receipts.set(input.mutationId, { input, receipt });
    if (input.kind === 'answer' && !lostResponse) {
      lostResponse = true;
      await route.fulfill({ status: 503, json: { error: { code: 'UNAVAILABLE', message: 'Uncertain fixture response' } } });
      return;
    }
    await route.fulfill({ json: { data: receipt } });
  });
  await page.goto('/study/#/setup/clat');
  await page.getByRole('link', { name: 'Continue to the sample lesson' }).click();
  await expect(page.getByRole('heading', { name: 'Worked example' })).toBeVisible();
  await page.getByRole('button', { name: 'Mark reading complete' }).click();
  await expect(page.getByRole('button', { name: 'Reading complete', exact: true })).toBeDisabled();
  const first = page.locator('form').filter({ hasText: 'Practice fixture 1' });
  const second = page.locator('form').filter({ hasText: 'Practice fixture 2' });
  await first.getByLabel('First choice 1').check();
  await first.getByRole('button', { name: 'Check answer' }).click();
  await expect(page.getByRole('alert')).toContainText('could not be confirmed');
  await page.getByRole('button', { name: 'Retry saving activity' }).click();
  await expect(first.getByText('First attempt')).toBeVisible();
  expect(receipts.size).toBe(2);
  await second.getByLabel('Second choice 2').check();
  await second.getByRole('button', { name: 'Check answer' }).click();
  await expect(second.getByText('Review this answer.')).toBeVisible();
  await first.getByRole('button', { name: 'Try this question again' }).click();
  await expect(first.getByText('Repeat attempt')).toBeVisible();
  expect(receipts.size).toBe(4);
  await page.reload();
  await expect(page.getByRole('button', { name: 'Reading complete', exact: true })).toBeDisabled();
  await expect(first.getByText('Repeat attempt')).toBeVisible();
  await expect(second.getByText('Explanation for q2', { exact: false })).toBeVisible();
  await expect(page.getByText('Find a short passage and write its main point', { exact: false })).toBeVisible();
});
function editorialFixture(): EditorState {
  return {
    cycles: [{ id: 'clat-cycle', examId: 'clat-ug', label: 'CLAT fixture' }, { id: 'blet-cycle', examId: 'blet-patna-llb', label: 'BLET fixture' }],
    topics: [{ id: 'reading', cycleId: 'clat-cycle', title: 'CLAT reading' , prerequisiteIds: [] }, { id: 'reading', cycleId: 'blet-cycle', title: 'BLET reading', prerequisiteIds: [] }],
    sources: [{ id: sourceId, title: 'Synthetic source', publisher: 'Fixture', url: 'https://example.org/source', checkedAt: '2026-10-28T00:00:00Z', rights: 'permitted', reviewNote: 'Fixture rights checked' }],
    versions: [{ id: versionId, contentId, versionNumber: 1, cycleId: 'clat-cycle', title: 'Six-option fixture', kind: 'question', reviewed: false, state: 'draft' }],
    selected: { id: versionId, contentId, versionNumber: 1, draft: { contentId, cycleId: 'clat-cycle', topicId: 'reading', kind: 'question', title: 'Six-option fixture', summary: 'Fixture summary', body: 'Synthetic question text', visibility: 'public', sourceIds: [sourceId], question: { options: ['A','B','C','D','E','F'].map(id => ({ id, text: `Answer ${id}` })), correctOptionId: 'F', explanation: 'Fixture explanation' } }, review: null, events: [] }
  };
}
async function fixtureEditor(page: Page) {
  const commands: EditorCommand[] = []; const state = editorialFixture();
  await seedAccount(page);
  await page.route('**/api/v1/admin/editor**', async route => {
    if (route.request().method() === 'POST') {
      const command = route.request().postDataJSON() as EditorCommand; commands.push(command);
      await route.fulfill({ json: { data: { op: command.op, id: command.op === 'draft' ? versionId : sourceId } } });
    } else await route.fulfill({ json: { data: { ...state, selected: new URL(route.request().url()).searchParams.has('versionId') ? state.selected : null } } });
  });
  await page.goto('/study/?editor-fixture=1#/editor'); await expect(page.getByRole('heading', { name: 'Content publishing' })).toBeVisible();
  return commands;
}
test('new draft and same version selection can be clicked repeatedly', async ({ page }) => {
  await fixtureEditor(page);
  await page.getByRole('button', { name: 'New draft', exact: true }).click();
  await expect(page.getByLabel('Title', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: /Six-option fixture/ }).click();
  await expect(page.getByRole('heading', { name: 'Six-option fixture' })).toBeVisible();
  await page.getByRole('button', { name: /Six-option fixture/ }).click();
  await expect(page.getByRole('heading', { name: 'Six-option fixture' })).toBeVisible();
});
test('revised question preserves every option and key; topic choices match the cycle', async ({ page }) => {
  const commands = await fixtureEditor(page);
  await page.getByRole('button', { name: /Six-option fixture/ }).click();
  await page.getByRole('button', { name: 'Create a revised draft' }).click();
  await expect(page.getByLabel('Option F', { exact: true })).toHaveValue('Answer F');
  await expect(page.getByLabel('Correct answer', { exact: true })).toHaveValue('F');
  await expect(page.getByLabel('Topic', { exact: true }).getByRole('option', { name: /BLET reading/ })).toHaveCount(0);
  await page.getByRole('button', { name: 'Save private draft' }).click();
  await expect.poll(() => commands.length).toBe(1);
  expect(commands[0]).toMatchObject({ op: 'draft', draft: { question: { correctOptionId: 'F', options: expect.arrayContaining([{ id: 'E', text: 'Answer E' }, { id: 'F', text: 'Answer F' }]) } } });
});
test('token refresh preserves an unsaved profile and editorial draft', async ({ page }) => {
  await fixtureEditor(page);
  await page.getByRole('button', { name: /Six-option fixture/ }).click();
  await page.getByRole('button', { name: 'Create a revised draft' }).click();
  await page.getByLabel('Teaching text or question').fill('Unsaved revised body');
  const refreshed = page.waitForResponse('**/api/v1/auth/me');
  await page.evaluate(value => { const channel = new BroadcastChannel('lawprep.auth'); channel.postMessage({ event: 'TOKEN_REFRESHED', session: value }); channel.close(); }, session(ownerId,2));
  await refreshed;
  await expect(page.getByLabel('Teaching text or question')).toHaveValue('Unsaved revised body');
  await page.getByRole('link', { name: 'Your account', exact: true }).click();
  await page.getByLabel('Display name').fill('Unsaved name');
  const rechecked = page.waitForResponse('**/api/v1/auth/me');
  await page.evaluate(value => { const channel = new BroadcastChannel('lawprep.auth'); channel.postMessage({ event: 'SIGNED_IN', session: value }); channel.close(); }, session(ownerId,3));
  await rechecked;
  await expect(page.getByLabel('Display name')).toHaveValue('Unsaved name');
});
test('delayed logout prevents a new sign-in until cleanup is finished', async ({ page }) => {
  await seedAccount(page);
  let release: (() => void) | undefined;
  const gate = new Promise<void>(resolve => { release = resolve; });
  await page.route('**/auth/v1/logout**', async route => { await gate; await route.fulfill({ status: 204 }); });
  await page.goto('/study/#/account');
  await page.getByRole('button', { name: 'Sign out', exact: true }).click();
  await expect(page.getByRole('status')).toContainText('Signing out');
  await expect(page.getByRole('button', { name: 'Send sign-in code' })).toHaveCount(0);
  release?.();
  await expect(page.getByRole('button', { name: 'Send sign-in code' })).toBeVisible();
  expect(await page.evaluate(() => localStorage.getItem('lawprep.auth'))).toBeNull();
});
test('adding a source preserves an unsaved revised draft', async ({ page }) => {
  const commands = await fixtureEditor(page);
  await page.getByRole('button', { name: /Six-option fixture/ }).click();
  await page.getByRole('button', { name: 'Create a revised draft' }).click();
  await page.getByLabel('Teaching text or question').fill('Unsaved body while adding a reference');
  await page.getByText('Add a source reference', { exact: true }).click();
  await page.getByLabel('Source title').fill('Another synthetic source');
  await page.getByLabel('Publisher', { exact: true }).fill('Fixture');
  await page.getByLabel('Source URL').fill('https://example.org/another');
  await page.getByLabel('Date checked').fill('2026-10-28');
  await page.getByRole('button', { name: 'Save source reference' }).click();
  await expect.poll(() => commands.length).toBe(1);
  await expect(page.getByRole('status')).toContainText('Saved');
  await expect(page.getByLabel('Teaching text or question')).toHaveValue('Unsaved body while adding a reference');
});
test('structured import stays private for preview and renders text safely', async ({ page }) => {
  const commands = await fixtureEditor(page); const input = { ...editorialFixture().selected!.draft };
  delete input.contentId; input.body = '<img src=x onerror="window.injectionRan=true">';
  await page.getByLabel('Import draft JSON').setInputFiles({ name: 'synthetic-draft.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(input)) });
  await expect(page.getByRole('heading', { name: 'Imported draft preview' })).toBeVisible();
  await expect(page.getByLabel('Teaching text or question')).toHaveValue(input.body);
  expect(commands).toHaveLength(0);
  expect(await page.evaluate(() => 'injectionRan' in window)).toBe(false);
});
test('public catalogue distinguishes unpublished content from service failure', async ({ page }) => {
  await page.route('**/api/v1/catalog**', route => route.fulfill({ json: { data: { examId: 'clat-ug', cycles: [], topics: [], items: [] } } }));
  await page.goto('/study/#/routes');
  await expect(page.getByText('No reviewed material has been published for this route yet.')).toBeVisible();
  await page.route('**/api/v1/catalog**', route => route.fulfill({ status: 503, json: { error: { code: 'UNAVAILABLE', message: 'Synthetic outage' } } }));
  await page.getByRole('radio', { name: /BLET/ }).check();
  await expect(page.getByRole('alert')).toContainText('catalogue could not be loaded');
  await expect(page.getByText('No reviewed material has been published for this route yet.')).toHaveCount(0);
});
test('owner reviews and requests publication actions through the typed UI (protocol fixture)', async ({ page }) => {
  const commands = await fixtureEditor(page);
  await page.getByRole('button', { name: /Six-option fixture/ }).click();
  for (const label of ['Source and exam mapping checked','Source rights permit this use','Answer or teaching claims checked','Explanation checked']) await page.getByLabel(label).check();
  await page.getByLabel('Review note', { exact: true }).fill('Reviewed fixture sources and answer F.');
  await page.getByRole('button', { name: 'Record review' }).click();
  await expect.poll(() => commands.length).toBe(1); expect(commands[0]).toMatchObject({ op: 'review', versionId, sourceVerified: true, rightsVerified: true, answerVerified: true, explanationVerified: true });
  await page.getByLabel('Publication note').fill('Publish synthetic reviewed fixture.');
  await page.getByRole('button', { name: 'Confirm publication action' }).click();
  await expect.poll(() => commands.length).toBe(2); expect(commands[1]).toMatchObject({ op: 'publish', versionId });
  await page.getByLabel('Action', { exact: true }).selectOption('withdraw');
  await page.getByLabel('Publication note').fill('Withdraw synthetic fixture.');
  await page.getByRole('button', { name: 'Confirm publication action' }).click();
  await expect.poll(() => commands.length).toBe(3); expect(commands[2]).toMatchObject({ op: 'withdraw', versionId });
});
test('account and owner workspace reflow on desktop and phone', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  mkdirSync('output/auth-publication', { recursive: true });
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto('/study/#/account'); await expect(page.getByLabel('Email address')).toBeVisible();
  await page.screenshot({ path: 'output/auth-publication/account-desktop.png', fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: 'output/auth-publication/account-phone.png', fullPage: true });
  await fixtureEditor(page); await page.getByRole('button', { name: /Six-option fixture/ }).click();
  await page.getByRole('button', { name: 'Create a revised draft' }).click();
  await expect(page.getByLabel('Option F', { exact: true })).toBeVisible();
  await page.getByRole('heading', { name: 'Content publishing' }).click();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: 'output/auth-publication/editor-phone.png', fullPage: true });
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.screenshot({ path: 'output/auth-publication/editor-desktop.png', fullPage: true });
});
test('logout failure clears the old account and a delayed profile cannot appear for B', async ({ page }) => {
  await seedAccount(page);
  const userB = '10000000-0000-4000-8000-000000000002';
  let releaseA: (() => void) | undefined; let waitingA = false;
  const gate = new Promise<void>(resolve => { releaseA = resolve; });
  await page.route('**/api/v1/auth/me', route => {
    const isB = route.request().headers().authorization === `Bearer ${session(userB).access_token}`;
    return route.fulfill({ json: { data: { userId: isB ? userB : ownerId, email: isB ? 'b@example.invalid' : 'owner@example.invalid', role: 'learner' } } });
  });
  await page.route('**/api/v1/profile', async route => {
    const token = route.request().headers().authorization?.split('.')[1];
    const isB = token && JSON.parse(Buffer.from(token,'base64url').toString()).sub === userB;
    if (!isB) { waitingA = true; await gate; }
    await route.fulfill({ json: { data: { userId: isB ? userB : ownerId, displayName: isB ? 'B saved name' : 'A private name', timezone: 'UTC', revision: 1 } } }).catch(() => {});
  });
  await page.route('**/auth/v1/logout**', route => route.fulfill({ status: 503, json: { message: 'Fixture connection failure' } }));
  await page.goto('/study/#/account'); await expect.poll(() => waitingA).toBe(true);
  await page.getByRole('button', { name: 'Sign out', exact: true }).click();
  await expect(page.getByRole('status')).toContainText('could not confirm session revocation');
  expect(await page.evaluate(() => localStorage.getItem('lawprep.auth'))).toBeNull();
  await page.route('**/auth/v1/otp**', route => route.fulfill({ json: {} }));
  await page.route('**/auth/v1/verify', route => route.fulfill({ json: session(userB) }));
  await page.getByLabel('Email address').fill('b@example.invalid');
  await page.getByRole('button', { name: 'Send sign-in code' }).click();
  await page.getByLabel('Sign-in code').fill('123456'); await page.getByRole('button', { name: 'Verify code' }).click();
  await expect(page.getByLabel('Display name')).toHaveValue('B saved name');
  releaseA?.();
  await expect(page.getByLabel('Display name')).toHaveValue('B saved name');
  await expect(page.getByText('A private name')).toHaveCount(0);
});

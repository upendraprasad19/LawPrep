import { expect,test } from '@playwright/test';
import type { ImportLibrary } from '../../packages/contracts/src/imports';
const hash='a'.repeat(64);
const record={kind:'curriculum' as const,sourceKey:'BANK.curriculum',sourceIndex:0,originalId:'L1',status:'draft' as const,payload:{title:'Imported lesson',html:'<img data-import-payload src=x onerror=alert(1)>'},issues:['unmapped-topic']};
test.beforeEach(async({page})=>{await page.route('https://*.supabase.co/**',route=>route.abort('blockedbyclient'));});
test('signed-out users cannot read the imported library',async({page})=>{
  await page.goto('/study/#/imports');
  await expect(page.getByRole('heading',{name:'Sign in to review imports'})).toBeVisible();
  await expect(page.getByRole('button',{name:'Imported lesson'})).toHaveCount(0);
});
test('owner can page, filter and inspect raw markup as inert private text',async({page})=>{
  const id='10000000-0000-4000-8000-000000000001';
  const payload=Buffer.from(JSON.stringify({sub:id,session_id:'fixture-session',exp:Math.floor(Date.now()/1000)+3600})).toString('base64url');
  await page.addInitScript(value=>localStorage.setItem('lawprep.auth',JSON.stringify(value)),{access_token:`e30.${payload}.fixture`,refresh_token:'fixture-refresh',token_type:'bearer',expires_in:3600,expires_at:Math.floor(Date.now()/1000)+3600,user:{id,email:'owner@example.invalid',aud:'authenticated',role:'authenticated',app_metadata:{},user_metadata:{},created_at:'2026-10-30T00:00:00Z'}});
  await page.route('**/api/v1/auth/me',route=>route.fulfill({json:{data:{userId:id,email:'owner@example.invalid',role:'publisher'}}}));
  const requests:string[]=[];
  await page.route('**/api/v1/admin/imports**',async route=>{
    const url=new URL(route.request().url());requests.push(url.search);
    const offset=Number(url.searchParams.get('offset')??0);
    const batch={sourceHash:hash,fileHash:'b'.repeat(64),recordsHash:'c'.repeat(64),sourcePath:'LexCommand.html',counts:{question:20,lesson:0,curriculum:1,deck:0,blueprint:0},recordCount:21,rights:'unknown' as const,errors:['BLUEPRINTS unsupported executable'],missingExplanations:1};
    const data:ImportLibrary={batches:[batch],batch,records:[{ordinal:offset,kind:'curriculum',sourceKey:record.sourceKey,sourceIndex:record.sourceIndex,originalId:record.originalId,title:'Imported lesson',exam:'CLAT, BLET',issues:record.issues}],total:21,offset,limit:20,selected:url.searchParams.has('ordinal')?{ordinal:Number(url.searchParams.get('ordinal')),recordHash:'d'.repeat(64),record}:null};
    await route.fulfill({json:{data}});
  });
  await page.goto('/study/#/imports');
  await expect(page.getByRole('heading',{name:'Imported library'})).toBeVisible();
  await page.getByRole('button',{name:'Next page',exact:true}).click();
  await expect.poll(()=>requests.some(value=>value.includes('offset=20'))).toBe(true);
  await page.getByLabel('Content type',{exact:true}).selectOption('curriculum');
  await expect.poll(()=>requests.at(-1)).toContain('kind=curriculum');
  await page.getByRole('button',{name:'Imported lesson',exact:true}).click();
  await expect(page.getByText('Original payload',{exact:true})).toBeVisible();
  await expect(page.locator('pre')).toContainText('onerror=alert(1)');
  await expect(page.locator('img[data-import-payload]')).toHaveCount(0);
  await expect(page.getByText('Rights unknown',{exact:true})).toBeVisible();
  await page.getByLabel('Search imported titles').fill('legal');
  await page.getByRole('button',{name:'Search',exact:true}).click();
  await expect.poll(()=>requests.at(-1)).toContain('q=legal');
  await expect(page.locator('pre')).toHaveCount(0);
});

import { createHash } from 'node:crypto';
import { isDeepStrictEqual } from 'node:util';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { z } from 'zod';
import { extractLegacy, object } from './extract-lexcommand.ts';
import { ImportBatchSchema } from '../packages/contracts/src/content.ts';

const digest = (value: string) => createHash('sha256').update(value, 'utf8').digest('hex');
export function prepareLegacyIntake(source: string, batchText: string) {
  const raw: unknown = JSON.parse(batchText), extracted = extractLegacy(source);
  const batch = ImportBatchSchema.parse(raw);
  // AST literal objects intentionally have null prototypes; compare JSON data, not prototypes.
  if (!isDeepStrictEqual(raw, JSON.parse(JSON.stringify(extracted)))) throw new Error('Import must match the current unchanged source extraction exactly.');
  if (batch.records.length < 1 || batch.records.length > 20_000 || Buffer.byteLength(batchText) > 16_777_216) throw new Error('Import size limit exceeded.');
  const seen = new Set<string>();
  const counts = { question:0, lesson:0, curriculum:0, deck:0, blueprint:0 };
  const records = batch.records.map((record, ordinal) => {
    const key = JSON.stringify([record.sourceKey, record.sourceIndex]);
    if (seen.has(key)) throw new Error('Duplicate original record identity.'); seen.add(key);
    const json = JSON.stringify(record);
    if (Buffer.byteLength(json) > 65_536 || /\\u0000/i.test(json)) throw new Error('Unsupported record size or null character.');
    counts[record.kind]++;
    const payload = object(record.payload);
    const title = String(payload.title ?? payload.q ?? record.originalId ?? `${record.kind} ${record.sourceIndex + 1}`).slice(0,200);
    const exam = typeof payload.exam === 'string' ? payload.exam.slice(0,200) : 'unassigned';
    return { ordinal, kind:record.kind, sourceKey:record.sourceKey, sourceIndex:record.sourceIndex, originalId:record.originalId, title, exam, json, sha256:digest(json) };
  });
  if (!isDeepStrictEqual(counts, batch.counts)) throw new Error('Extracted record counts do not match.');
  const manifest = { sourceHash:batch.sourceHash, fileHash:digest(batchText), recordsHash:digest(records.map(record => record.sha256).join('')), sourcePath:'LexCommand.html', formatVersion:1, counts, recordCount:records.length, errors:batch.errors, rights:'unknown', status:'loading' };
  return { manifest, records };
}
export type LegacyIntake = ReturnType<typeof prepareLegacyIntake>;
// Explicit E-string quoting handles both apostrophes and backslashes; no payload is SQL.
const literal = (value: string) => `E'${value.replace(/\\/g,'\\\\').replace(/'/g,"''")}'`;
export function intakeSql(plan: LegacyIntake, ownerEmail: string, chunkSize = 40) {
  z.email().parse(ownerEmail);
  if (!Number.isInteger(chunkSize) || chunkSize<1 || chunkSize>100) throw new Error('Invalid chunk size.');
  const m = plan.manifest, hash = literal(m.sourceHash);
  const ownerCheck = `select count(*),min(u.id::text)::uuid into matches,owner_id from auth.users u join lawprep_private.publisher_roles p on p.user_id=u.id where lower(u.email)=lower(${literal(ownerEmail)}) and u.email_confirmed_at is not null and not u.is_anonymous and exists(select 1 from auth.sessions s where s.user_id=u.id and (s.not_after is null or s.not_after>statement_timestamp())); if matches<>1 then raise exception 'One live verified approved publisher required.'; end if;`;
  const wrap = (body: string) => {
    const block=`declare matches integer; owner_id uuid; begin ${ownerCheck} perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('lawprep:intake:'||${hash},0)); ${body} end;`;
    // Dollar delimiters are parsed before inner literals. Choose one absent from ALL data.
    let delimiter='$lawprep_intake$';
    while(block.includes(delimiter)) delimiter=`${delimiter.slice(0,-1)}_$`;
    return `begin; set local standard_conforming_strings=on; do ${delimiter} ${block} ${delimiter}; commit;`;
  };
  const setup = wrap(`insert into lawprep_private.import_batches(source_hash,file_hash,records_hash,source_path,format_version,counts,record_count,errors,imported_by) values(${hash},${literal(m.fileHash)},${literal(m.recordsHash)},${literal(m.sourcePath)},1,${literal(JSON.stringify(m.counts))}::jsonb,${m.recordCount},${literal(JSON.stringify(m.errors))}::jsonb,owner_id) on conflict(source_hash) do nothing;
    if not exists(select 1 from lawprep_private.import_batches where source_hash=${hash} and file_hash=${literal(m.fileHash)} and records_hash=${literal(m.recordsHash)} and source_path=${literal(m.sourcePath)} and format_version=1 and counts=${literal(JSON.stringify(m.counts))}::jsonb and record_count=${m.recordCount} and errors=${literal(JSON.stringify(m.errors))}::jsonb and rights='unknown' and imported_by=owner_id) then raise exception 'Existing batch differs; no overwrite.'; end if;`);
  const chunks: string[] = [];
  for(let start=0;start<plan.records.length;start+=chunkSize) {
    const rows = plan.records.slice(start,start+chunkSize);
    const values = rows.map(r=>`(${r.ordinal},${literal(r.kind)},${literal(r.sourceKey)},${r.sourceIndex},${r.originalId===null?'null':literal(r.originalId)},${literal(r.title)},${literal(r.exam)},${literal(r.json)},${literal(r.sha256)})`).join(',\n');
    chunks.push(wrap(`perform 1 from lawprep_private.import_batches where source_hash=${hash} for update;
      if not found then raise exception 'Missing intake batch.'; end if;
      if exists(select 1 from (values ${values}) as incoming(ordinal,kind,source_key,source_index,original_id,title,exam,record_json,record_hash) join lawprep_private.import_records stored on stored.source_hash=${hash} and stored.source_key=incoming.source_key and stored.source_index=incoming.source_index where (stored.ordinal,stored.kind,stored.original_id,stored.title,stored.exam,stored.record_json,stored.record_hash) is distinct from (incoming.ordinal,incoming.kind,incoming.original_id,incoming.title,incoming.exam,incoming.record_json,incoming.record_hash)) then raise exception 'Existing record differs; no overwrite.'; end if;
      insert into lawprep_private.import_records(source_hash,ordinal,kind,source_key,source_index,original_id,title,exam,record_json,record_hash)
        select ${hash},incoming.* from (values ${values}) as incoming(ordinal,kind,source_key,source_index,original_id,title,exam,record_json,record_hash)
        where not exists(select 1 from lawprep_private.import_records stored where stored.source_hash=${hash} and stored.source_key=incoming.source_key and stored.source_index=incoming.source_index);`));
  }
  const seal = wrap(`update lawprep_private.import_batches set status='complete' where source_hash=${hash} and status='loading';
    if not exists(select 1 from lawprep_private.import_batches where source_hash=${hash} and status='complete') then raise exception 'Batch did not complete.'; end if;
    if (select count(*) from lawprep_private.import_records where source_hash=${hash})<>${m.recordCount} then raise exception 'Completed count mismatch.'; end if;`);
  return { setup, chunks, seal };
}
if(process.argv[1] && resolve(process.argv[1])===fileURLToPath(import.meta.url)) {
  const ownerEmail = process.env.LAWPREP_IMPORT_OWNER_EMAIL;
  if(!ownerEmail) throw new Error('Set LAWPREP_IMPORT_OWNER_EMAIL to the approved verified owner; this prepares files only.');
  const plan = prepareLegacyIntake(await readFile('LexCommand.html','utf8'),await readFile('content/imports/legacy-draft.json','utf8'));
  const statements = intakeSql(plan,ownerEmail);
  const directory='.superpowers/sdd/2026-10-23-law-prep-platform-implementation/legacy-intake'; await mkdir(directory,{recursive:true});
  await writeFile(`${directory}/manifest.json`,JSON.stringify(plan.manifest,null,2));
  await writeFile(`${directory}/setup.sql`,statements.setup);
  for(const [index,sql] of statements.chunks.entries()) await writeFile(`${directory}/chunk-${String(index).padStart(3,'0')}.sql`,sql);
  await writeFile(`${directory}/seal.sql`,statements.seal);
  console.log(JSON.stringify({directory,counts:plan.manifest.counts,records:plan.records.length,chunks:statements.chunks.length,status:'prepared-only'}));
}

import { z } from 'zod';
import { ImportRecordSchema } from './content';
import { envelope } from './editorial';
const hash=z.string().regex(/^[a-f0-9]{64}$/);
export const ImportKindSchema=z.enum(['question','lesson','curriculum','deck','blueprint']);
export const ImportQuerySchema=z.strictObject({
  batch:hash.optional(),kind:ImportKindSchema.optional(),q:z.string().trim().max(100).default(''),
  offset:z.coerce.number().int().min(0).max(20000).default(0),limit:z.coerce.number().int().min(1).max(50).default(20),
  ordinal:z.coerce.number().int().min(0).max(19999).optional()
}).superRefine((value,ctx)=>{
  if(value.ordinal!==undefined && !value.batch) ctx.addIssue({code:'custom',message:'Record detail requires its batch identity.',path:['batch']});
});
const CountsSchema=z.strictObject({question:z.number().int().nonnegative(),lesson:z.number().int().nonnegative(),curriculum:z.number().int().nonnegative(),deck:z.number().int().nonnegative(),blueprint:z.number().int().nonnegative()});
const BatchSchema=z.strictObject({sourceHash:hash,fileHash:hash,recordsHash:hash,sourcePath:z.string().min(1).max(512),counts:CountsSchema,recordCount:z.number().int().min(1).max(20000),rights:z.literal('unknown'),errors:z.array(z.string()),missingExplanations:z.number().int().nonnegative()});
export const ImportLibrarySchema=z.strictObject({
  batches:z.array(BatchSchema).max(100),batch:BatchSchema.nullable(),
  records:z.array(z.strictObject({ordinal:z.number().int().nonnegative(),kind:ImportKindSchema,sourceKey:z.string(),sourceIndex:z.number().int().nonnegative(),originalId:z.string().nullable(),title:z.string().min(1).max(200),exam:z.string().max(200),issues:z.array(z.string())})).max(50),
  total:z.number().int().nonnegative(),offset:z.number().int().nonnegative(),limit:z.number().int().min(1).max(50),
  selected:z.strictObject({ordinal:z.number().int().nonnegative(),recordHash:hash,record:ImportRecordSchema}).nullable()
});
export const ImportLibraryResultSchema=envelope(ImportLibrarySchema);
export type ImportQuery=z.infer<typeof ImportQuerySchema>;
export type ImportLibrary=z.infer<typeof ImportLibrarySchema>;

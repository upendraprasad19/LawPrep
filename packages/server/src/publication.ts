import 'server-only';
import { EditorStateSchema, EditorResultSchema, type EditorCommand, type EditorState, type EditorResult } from '@lawprep/contracts';
import { dbForActor, requirePublisher, type VerifiedActor } from './auth';
import { databaseError, ServiceError } from './errors';
export async function getEditorState(actor: VerifiedActor, versionId?: string): Promise<EditorState> {
  requirePublisher(actor);
  const result = await dbForActor(actor).rpc('lawprep_editor_state', versionId ? { p_version_id: versionId } : {});
  if (result.error) databaseError(result.error);
  const parsed = EditorStateSchema.safeParse(result.data);
  if (!parsed.success) throw new ServiceError('UNAVAILABLE', 'The publishing workspace could not be loaded.', 503);
  return parsed.data;
}
export async function executeEditorialCommand(actor: VerifiedActor, command: EditorCommand): Promise<EditorResult> {
  requirePublisher(actor);
  const result = await dbForActor(actor).rpc('lawprep_editor_command', { p_command: command });
  if (result.error) databaseError(result.error);
  const parsed = EditorResultSchema.safeParse(result.data);
  if (!parsed.success) throw new ServiceError('UNAVAILABLE', 'The change could not be confirmed. Refresh before retrying.', 503);
  return parsed.data;
}

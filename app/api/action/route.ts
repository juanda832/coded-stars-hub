import { withHubStore } from '@/lib/review-session'
import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@/lib/auth';
import { snapshot, saveRecord, requestParticipation, withdrawParticipation, selectParticipant, saveCriteria, markRead, WorkflowError, submitReport, reviewReport, changeMeeting, changeMeetingStatus, askMeetingQuestion, replyMeetingQuestion, updateHostMessage, markAllRead, updateOwnProfile, savePublication } from '@/lib/store';
import { directoryUsers, assertAccountAccess } from '@/lib/user-directory';
import { participationOptions } from '@/lib/types';
import { saveBetaContribution, reviewBetaContribution } from '@/lib/beta-review';
import {hasAssignedRole} from '@/lib/account-roles';
export const runtime = 'nodejs';
export async function POST(req: NextRequest) {
    let user;
    try { user = await currentUser(); } catch { return NextResponse.json({error:'No pudimos comprobar tu acceso. Intenta de nuevo.',},{status:503,headers:{'Cache-Control':'no-store'}}); }
    if (!user)
        return NextResponse.json({ error: 'Inicia sesión' }, { status: 401 });
    let body: Record<string, unknown>;
    try {
        body = await req.json();
    }
    catch {
        return NextResponse.json({ error: 'Solicitud inválida' }, { status: 400 });
    }
    if (!body || typeof body !== 'object')
        return NextResponse.json({ error: 'Solicitud inválida' }, { status: 400 });
    const fail = (message: string, status = 400) => { throw new WorkflowError(message, status); };
    try {
        return await withHubStore(user,async () => {
            await assertAccountAccess(user);
            const store = await snapshot(), meeting = store.meetings.find(m => m.id === body.meetingId);
            const admin = () => { if (user.role !== 'admin')
                fail('Solo administración puede tomar esta decisión', 403); };
            const star = () => { if (user.role !== 'star')
                fail('Sin permiso', 403); };
            switch (body.action) {
                case 'beta_contribution':
                    if(user.reviewer)fail('Vuelve a administración para compartir un aporte.',403);
                    await saveBetaContribution(user,body);
                    break;
                case 'beta_review':
                    await reviewBetaContribution(user,body);
                    break;
                case 'profile_update':
                    await updateOwnProfile(user, body);
                    break;
                case 'publication_save':
                    await savePublication(user, body);
                    break;
                case 'report':
                    await submitReport(String(body.meetingId), user, body);
                    break;
                case 'review_report':
                    if (typeof body.note !== 'string')
                        fail('Agrega una nota de seguimiento.');
                    await reviewReport(String(body.meetingId), user, String(body.note));
                    break;
                case 'register':
                case 'request':
                    star();
                    await requestParticipation(String(body.meetingId), user.id);
                    break;
                case 'cancel':
                    star();
                    await withdrawParticipation(String(body.meetingId), user.id);
                    break;
                case 'confirm':
                case 'select':
                    admin();
                    if (!(await directoryUsers()).some(u => u.id === body.userId && hasAssignedRole(u,'star')))
                        fail('Candidato no encontrado', 404);
                    await selectParticipant(String(body.meetingId), String(body.userId));
                    break;
                case 'criteria':
                    admin();
                    if (!meeting)
                        fail('Reunión no encontrada', 404);
                    if (typeof body.text !== 'string' || body.text.length > 2000)
                        fail('Usa hasta 2000 caracteres para tus criterios');
                    await saveCriteria(String(body.meetingId), String(body.text).trim());
                    break;
                case 'notifications_read_all':
                    await markAllRead(user.id);
                    break;
                case 'notification_read':
                    if (!await markRead(user.id, String(body.notificationId)))
                        fail('Aviso no encontrado', 404);
                    break;
                case 'feedback': {
                    star();
                    if (!meeting || meeting.status !== 'completed' || !store.registrations.some(r => r.meetingId === meeting.id && r.userId === user.id && r.status === 'confirmed'))
                        fail('Los comentarios están disponibles para el Coded Star confirmado después de la reunión');
                    const rating = Number(body.rating), comment = String(body.comment || '').trim().slice(0, 500);
                    if (!Number.isInteger(rating) || rating < 1 || rating > 5)
                        fail('Elige una valoración de 1 a 5');
                    if (store.feedback.some(f => f.meetingId === body.meetingId && f.userId === user.id))
                        fail('Ya compartiste tu experiencia', 409);
                    await saveRecord('feedback', `${body.meetingId}:${user.id}`, { meetingId: body.meetingId, userId: user.id, rating, comment });
                    break;
                }
                case 'status':
                    await changeMeetingStatus(String(body.meetingId), user, body.status);
                    break;
                case 'create':
                case 'meeting_edit':
                    await changeMeeting(user, body);
                    break;
                case 'ask':
                    await askMeetingQuestion(String(body.meetingId), user, body.text);
                    break;
                case 'reply':
                    await replyMeetingQuestion(String(body.questionId), user, body.reply);
                    break;
                case 'meeting_update':
                    await updateHostMessage(String(body.meetingId), user, body.hostNote, body.joinUrl);
                    break;
                case 'participation':
                    star();
                    if (!participationOptions.some(option => option === body.answer))
                        fail('Elige una opción');
                    await saveRecord('participation', user.id, { userId: user.id, answer: body.answer });
                    break;
                default: fail('Acción no reconocida');
            }
            return NextResponse.json({ ok: true });
        });
    }
    catch (error) {
        if (error instanceof WorkflowError)
            return NextResponse.json({ error: error.message }, { status: error.status });
        console.error('Hub action failed', error instanceof Error ? error.name : 'unknown');
        return NextResponse.json({ error: 'No pudimos guardar el cambio. Actualiza la página e intenta de nuevo.' }, { status: 500 });
    }
}

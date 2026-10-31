import { query, queryOne, execute, withDatabase, currentDatabaseScope } from './database';
import {exampleWorkspace,teamWorkspaceEnabled} from './workspace-mode';
import {hasAssignedRole} from './account-roles';
import { randomUUID } from 'node:crypto';
import type { Meeting, Registration, Feedback, MeetingQuestion, ParticipationAnswer, HubNotification, MeetingReport, ReportReview } from './types';
import { seedMeetings, profiles } from './seed';
import { directoryUsers } from './user-directory';
import type { SelfProfile, StarProfile, Publication } from './types';
import { normalizeReport, reportAvailable, reportConflicts, needsReview } from './reports';
import type { User } from './types';
import { meetingDraft, secureMeetingLink } from './meeting-draft';
export { users } from './user-directory';
import { WorkflowError } from './workflow-error';
export { WorkflowError } from './workflow-error';
export async function withStore<T>(fn: () => Promise<T>,scope?:string): Promise<T> {
    return withDatabase(async () => {
        const marker=await queryOne("SELECT value FROM metadata WHERE key='seed-v3'"),examples=exampleWorkspace(currentDatabaseScope());
        if(!examples&&marker?.value==='1')throw new WorkflowError('Este espacio contiene ejemplos. Selecciona una base vacía antes de continuar.',503);
        if (!marker&&examples) {
            for (const meeting of seedMeetings())
                await saveRecord('meetings', meeting.id, meeting);
            const time = new Date().toISOString();
            for (const [meetingId, userId, status] of [['m1', 'star-1', 'pending'], ['m1', 'star-2', 'pending'], ['m1', 'star-3', 'pending'], ['m2', 'star-1', 'pending'], ['m2', 'star-3', 'pending'], ['m3', 'star-2', 'pending'], ['m3', 'star-4', 'pending'], ['m5', 'star-1', 'confirmed']])
                await execute('INSERT INTO applications(id,meeting_id,user_id,status,requested_at,updated_at) VALUES(?,?,?,?,?,?)', randomUUID(), meetingId, userId, status, time, time);
            await execute('INSERT INTO selection_criteria(meeting_id,text) VALUES(?,?)', 'm1', 'Revisar experiencia en Orlando, idioma de la reunión y disponibilidad. Criterios ilustrativos; la decisión es del administrador.');
            await execute("INSERT INTO metadata(key,value) VALUES('seed-v3','1')");
        }
        if(!marker&&!examples)await execute("INSERT INTO metadata(key,value) VALUES('seed-v3',?)",teamWorkspaceEnabled()?'team-empty-v1':'beta-empty-v1');
        return fn();
    },scope);
}
export async function transaction<T>(fn: () => Promise<T>): Promise<T> { return withStore(fn); }
export async function records<T>(collection: string): Promise<T[]> { return (await query('SELECT json FROM records WHERE collection=? ORDER BY rowid', collection)).map(row => JSON.parse(String(row.json)) as T); }
export async function starProfiles(): Promise<StarProfile[]> {
    const changes = await records<SelfProfile & {
        userId: string;
    }>('star_profiles');
    const directory = await directoryUsers(true);
    return directory.filter(user => hasAssignedRole(user,'star')).map(user => {
        const seed = profiles.find(profile => profile.userId === user.id);
        return { userId:user.id, name:user.name, initials:user.initials, languages:[], programs:[], availability:'', experience:'', history:[], internalNotes:'', ...seed, ...changes.find(change => change.userId === user.id) };
    });
}
export async function updateOwnProfile(user: User, body: Record<string, unknown>) {
    return transaction(async () => {
        if (user.role !== 'star')
            throw new WorkflowError('Solo puedes actualizar tu propio perfil de Star.', 403);
        const list = (value: unknown, allowed: string[], name: string) => {
            if (!Array.isArray(value) || value.length < 1 || value.length > allowed.length || value.some(v => typeof v !== 'string' || !allowed.includes(v)) || new Set(value).size !== value.length)
                throw new WorkflowError(`Elige al menos una opción válida para ${name}.`);
            return value as string[];
        };
        const languages = list(body.languages, ['Español', 'English', 'Português'], 'tus idiomas'), programs = list(body.programs, ['Orlando', 'Tokyo', 'London'], 'tus programas');
        const availability = typeof body.availability === 'string' ? body.availability.trim() : '', experience = typeof body.experience === 'string' ? body.experience.trim() : '';
        if (availability.length < 5 || availability.length > 200)
            throw new WorkflowError('Describe tu disponibilidad en entre 5 y 200 caracteres.');
        if (experience.length > 400)
            throw new WorkflowError('Usa hasta 400 caracteres para tu experiencia.');
        await saveRecord('star_profiles', user.id, { userId: user.id, languages, programs, availability, experience });
    });
}
export async function visiblePublications(user: User): Promise<Publication[]> { return (await records<Publication>('publications')).filter(p => user.role === 'admin' || p.status === 'published' && (p.audience === 'all' || p.audience === user.role)).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)); }
export async function savePublication(user: User, body: Record<string, unknown>) {
    return transaction(async () => {
        if (user.role !== 'admin')
            throw new WorkflowError('Solo administración puede publicar contenido.', 403);
        const previous = body.publicationId ? (await records<Publication>('publications')).find(p => p.id === body.publicationId) : undefined;
        if (body.publicationId && !previous)
            throw new WorkflowError('Publicación no encontrada.', 404);
        if (previous && body.version !== previous.version)
            throw new WorkflowError('Otra persona actualizó esta publicación. Cierra el editor y vuelve a abrirla para ver sus cambios.', 409);
        const title = typeof body.title === 'string' ? body.title.trim() : '', content = typeof body.body === 'string' ? body.body.trim() : '';
        if (title.length < 4 || title.length > 100)
            throw new WorkflowError('El título debe tener entre 4 y 100 caracteres.');
        if (content.length < 10 || content.length > 1500)
            throw new WorkflowError('Escribe entre 10 y 1500 caracteres para la publicación.');
        if (!['all', 'star', 'host'].includes(String(body.audience)) || !['draft', 'published', 'archived'].includes(String(body.status)))
            throw new WorkflowError('Revisa el público y el estado de la publicación.');
        const time = new Date().toISOString();
        const post: Publication = { id: previous?.id || randomUUID(), title, body: content, audience: body.audience as Publication['audience'], status: body.status as Publication['status'], authorId: previous?.authorId || user.id, authorName: previous?.authorName || user.name, updatedByName: user.name, createdAt: previous?.createdAt || time, updatedAt: time, version: (previous?.version || 0) + 1 };
        await saveRecord('publications', post.id, post);
        if (post.status === 'published' && (!previous || previous.status !== 'published' || previous.title !== post.title || previous.body !== post.body || previous.audience !== post.audience)) {
            for (const recipient of (await directoryUsers()).filter(u => u.id !== user.id && (u.role === 'admin' || post.audience === 'all' || post.audience === u.role)))
                await notify(recipient.id, 'post:' + post.id, 'Nueva publicación para ti', 'El equipo compartió una novedad. Puedes leerla en Publicaciones.');
        }
        return post;
    });
}
export async function saveRecord(collection: string, id: string, value: unknown) { await execute('INSERT INTO records(collection,id,json) VALUES(?,?,?) ON CONFLICT(collection,id) DO UPDATE SET json=excluded.json', collection, id, JSON.stringify(value)); }
export async function registrations(): Promise<Registration[]> { return await query('SELECT id,meeting_id AS "meetingId",user_id AS "userId",status,requested_at AS "requestedAt",updated_at AS "updatedAt" FROM applications ORDER BY requested_at,id') as unknown as Registration[]; }
export async function snapshot() { return { meetings: await records<Meeting>('meetings'), registrations: await registrations(), feedback: await records<Feedback>('feedback'), questions: await records<MeetingQuestion>('questions'), participation: await records<ParticipationAnswer>('participation'), reports: await records<MeetingReport>('reports'), reportReviews: await records<ReportReview>('report_reviews') }; }
async function notifyAdmins(meetingId: string, title: string, body: string) { for (const user of (await directoryUsers()).filter(u => u.role === 'admin'))
    await notify(user.id, meetingId, title, body); }
async function notify(userId: string, meetingId: string, title: string, body: string) { if (!userId)
    return; await execute('INSERT INTO notifications(id,user_id,meeting_id,title,body,created_at,read_at) VALUES(?,?,?,?,?,?,NULL)', randomUUID(), userId, meetingId, title, body, new Date().toISOString()); }
export async function notifications(userId: string): Promise<HubNotification[]> { return await query('SELECT id,user_id AS "userId",meeting_id AS "meetingId",title,body,created_at AS "createdAt",read_at AS "readAt" FROM notifications WHERE user_id=? ORDER BY created_at DESC,rowid DESC', userId) as unknown as HubNotification[]; }
export async function markRead(userId: string, id: string) { return (await execute('UPDATE notifications SET read_at=? WHERE id=? AND user_id=?', new Date().toISOString(), id, userId)).changes > 0; }
export async function markAllRead(userId: string) { return (await execute('UPDATE notifications SET read_at=? WHERE user_id=? AND read_at IS NULL', new Date().toISOString(), userId)).changes; }
export async function criteria(): Promise<Record<string, string>> { return Object.fromEntries((await query('SELECT meeting_id,text FROM selection_criteria')).map(row => [String(row.meeting_id), String(row.text)])); }
export async function saveCriteria(meetingId: string, text: string) { await execute('INSERT INTO selection_criteria(meeting_id,text) VALUES(?,?) ON CONFLICT(meeting_id) DO UPDATE SET text=excluded.text', meetingId, text); }
async function eligibleMeeting(meetingId: string, futureOnly = false) { const m = (await records<Meeting>('meetings')).find(m => m.id === meetingId); if (!m || !['scheduled', 'live'].includes(m.status) || Date.parse(m.startsAt) + (m.duration ?? Infinity) * 60000 <= Date.now() || (futureOnly && (m.status !== 'scheduled' || Date.parse(m.startsAt) <= Date.now())))
    throw new WorkflowError('Esta reunión ya no recibe cambios de solicitudes.'); return m; }
export async function requestParticipation(meetingId: string, userId: string) {
    return transaction(async () => {
        const m = await eligibleMeeting(meetingId, true), all = (await registrations()).filter(r => r.meetingId === meetingId), own = all.find(r => r.userId === userId);
        if (all.some(r => r.status === 'confirmed'))
            throw new WorkflowError('Esta reunión ya tiene un Star confirmado.', 409);
        if (own && own.status !== 'withdrawn')
            throw new WorkflowError('Ya tienes una solicitud para esta reunión.', 409);
        const time = new Date().toISOString();
        if (own)
            await execute("UPDATE applications SET status='pending',requested_at=?,updated_at=? WHERE id=?", time, time, own.id);
        else
            await execute("INSERT INTO applications VALUES(?,?,?,'pending',?,?)", randomUUID(), meetingId, userId, time, time);
        await notify(userId, meetingId, 'Solicitud recibida', `Recibimos tu solicitud para ${m.title}. El equipo la revisará y confirmará a un único Star.`);
        await notifyAdmins(meetingId, 'Nueva solicitud por revisar', `Un Star solicitó participar en ${m.title}. Revisa su perfil y disponibilidad.`);
    });
}
export async function selectParticipant(meetingId: string, userId: string) {
    return transaction(async () => {
        const m = await eligibleMeeting(meetingId), all = (await registrations()).filter(r => r.meetingId === meetingId);
        if (all.some(r => r.status === 'confirmed'))
            throw new WorkflowError('Ya hay un Star confirmado. Debe cancelarse esa asignación antes de elegir a otro.', 409);
        const candidate = all.find(r => r.userId === userId && r.status === 'pending');
        if (!candidate)
            throw new WorkflowError('La candidatura ya no está pendiente. Actualiza la lista.', 409);
        const time = new Date().toISOString();
        await execute("UPDATE applications SET status='confirmed',updated_at=? WHERE id=? AND status='pending'", time, candidate.id);
        await execute("UPDATE applications SET status='not_selected',updated_at=? WHERE meeting_id=? AND id<>? AND status='pending'", time, meetingId, candidate.id);
        await notify(userId, meetingId, '¡Tu participación está confirmada!', `El equipo te eligió para ${m.title}. Revisa las indicaciones y añade la reunión a tu calendario.`);
        for (const other of all.filter(r => r.status === 'pending' && r.id !== candidate.id))
            await notify(other.userId, meetingId, 'Tu solicitud tiene una actualización', `El equipo asignó ${m.title} a otro Star. Gracias por ofrecer tu tiempo. Tu solicitud queda disponible para revisión si el lugar se libera.`);
        await notify(m.hostId, meetingId, 'Star asignado a tu reunión', `Coordinación confirmó a un Star para ${m.title}. Revisa su perfil y reserva un momento para su testimonio.`);
    });
}
export async function withdrawParticipation(meetingId: string, userId: string) {
    return transaction(async () => {
        const m = await eligibleMeeting(meetingId), own = (await registrations()).find(r => r.meetingId === meetingId && r.userId === userId && r.status !== 'withdrawn');
        if (!own)
            throw new WorkflowError('No hay una solicitud activa para retirar.', 404);
        const time = new Date().toISOString();
        await execute("UPDATE applications SET status='withdrawn',updated_at=? WHERE id=?", time, own.id);
        await notify(userId, meetingId, own.status === 'confirmed' ? 'Participación cancelada' : 'Solicitud retirada', `Retiraste tu participación en ${m.title}.`);
        if (own.status === 'confirmed') {
            const waiting = (await registrations()).filter(r => r.meetingId === meetingId && r.status === 'not_selected');
            await execute("UPDATE applications SET status='pending',updated_at=? WHERE meeting_id=? AND status='not_selected'", time, meetingId);
            for (const r of waiting)
                await notify(r.userId, meetingId, 'Tu solicitud vuelve a revisión', `Se liberó el lugar de ${m.title}. Coordinación puede volver a revisar tu solicitud; todavía no estás confirmado.`);
            await notifyAdmins(meetingId, 'Hace falta reasignar un Star', `La persona confirmada para ${m.title} canceló. Revisa las solicitudes y elige manualmente un reemplazo.`);
            await notify(m.hostId, meetingId, 'Participación cancelada', `El Star de ${m.title} canceló. Coordinación debe asignar un reemplazo.`);
        }
    });
}
export async function submitReport(meetingId: string, user: User, body: Record<string, unknown>) {
    return transaction(async () => {
        const state = await snapshot(), meeting = state.meetings.find(m => m.id === meetingId);
        if (user.role === 'admin')
            throw new WorkflowError('Administración revisa los resultados; no responde por el Star ni por el anfitrión.', 403);
        if (!meeting)
            throw new WorkflowError('Reunión no encontrada.', 404);
        const assigned = state.registrations.find(r => r.meetingId === meetingId && r.status === 'confirmed');
        if ((user.role === 'star' && assigned?.userId !== user.id) || (user.role === 'host' && meeting.hostId !== user.id))
            throw new WorkflowError('No puedes registrar el resultado de esta reunión.', 403);
        if (!reportAvailable(meeting))
            throw new WorkflowError('Podrás contar cómo fue cuando termine la reunión.');
        if (state.reports.some(r => r.meetingId === meetingId && r.userId === user.id))
            throw new WorkflowError('Ya registraste tu resultado para esta reunión.', 409);
        let answers: ReturnType<typeof normalizeReport>;
        try {
            answers = normalizeReport(body, user.role, !!assigned);
        }
        catch (error) {
            throw new WorkflowError(error instanceof Error ? error.message : 'Revisa tus respuestas.');
        }
        const report: MeetingReport = { ...answers, id: randomUUID(), meetingId, userId: user.id, role: user.role, createdAt: new Date().toISOString() };
        await saveRecord('reports', `${meetingId}:${user.id}`, report);
        const reports = [...state.reports.filter(r => r.meetingId === meetingId), report];
        const conflicts = reportConflicts(reports);
        await notifyAdmins(meetingId, conflicts.length ? 'Resultados por contrastar' : needsReview(reports) ? 'Un encuentro necesita seguimiento' : 'Nuevo resultado de una JDP', `${meeting.title}: ${user.role === 'star' ? 'el Star' : 'el anfitrión'} registró lo ocurrido.${conflicts.length ? ' Hay respuestas diferentes que coordinación puede revisar.' : ''}`);
        return report;
    });
}
export async function reviewReport(meetingId: string, user: User, note: string) {
    return transaction(async () => {
        if (user.role !== 'admin')
            throw new WorkflowError('Solo administración puede registrar el seguimiento.', 403);
        if (!(await records<MeetingReport>('reports')).some(r => r.meetingId === meetingId))
            throw new WorkflowError('Todavía no hay resultados para revisar.');
        const trimmed = note.trim();
        if (trimmed.length < 5 || trimmed.length > 1000)
            throw new WorkflowError('Agrega una nota de seguimiento de entre 5 y 1000 caracteres.');
        const review: ReportReview = { meetingId, note: trimmed, reviewedBy: user.id, reviewedAt: new Date().toISOString(), reportIds: (await records<MeetingReport>('reports')).filter(r => r.meetingId === meetingId).map(r => r.id) };
        await saveRecord('report_reviews', meetingId, review);
    });
}
async function managedMeeting(meetingId: string, user: User) {
    const meeting = (await records<Meeting>('meetings')).find(m => m.id === meetingId);
    if (!meeting)
        throw new WorkflowError('Reunión no encontrada.', 404);
    if (user.role !== 'admin' && !(user.role === 'host' && meeting.hostId === user.id))
        throw new WorkflowError('Sin permiso.', 403);
    return meeting;
}
async function notifyApplicants(meeting: Meeting, title: string, body: string) {
    const recipients = new Set((await registrations()).filter(r => r.meetingId === meeting.id && r.status !== 'withdrawn').map(r => r.userId));
    for (const id of recipients)
        await notify(id, meeting.id, title, body);
}
export async function changeMeeting(user: User, body: Record<string, unknown>) {
    return transaction(async () => {
        if (user.role !== 'admin')
            throw new WorkflowError('Solo administración puede crear o reprogramar reuniones.', 403);
        const previous = body.action === 'meeting_edit' ? await managedMeeting(String(body.meetingId), user) : undefined;
        if (previous && previous.status !== 'scheduled')
            throw new WorkflowError('Solo puedes editar reuniones programadas.');
        let fields: ReturnType<typeof meetingDraft>;
        try {
            fields = meetingDraft(body, previous);
        }
        catch (error) {
            throw new WorkflowError((error as Error).message);
        }
        const hostId = body.hostId === undefined ? (previous?.hostId || '') : body.hostId;
        const host = (await directoryUsers()).find(u => u.id === hostId && u.role === 'host');
        if (hostId && !host)
            throw new WorkflowError('Elige un anfitrión válido.');
        const meeting: Meeting = { id: previous?.id || randomUUID(), capacity: 1, status: 'scheduled', color: 'purple', ...previous, ...fields, host: host?.name || '', hostId: host?.id || '', calendarRevision:(previous?.calendarRevision||0)+1, updatedAt:new Date().toISOString() };
        await saveRecord('meetings', meeting.id, meeting);
        if (previous) {
            const changed = ['schoolName', 'title', 'description', 'startsAt', 'duration', 'language', 'program', 'hostNote', 'joinUrl', 'hostId'].some(key => previous[key as keyof Meeting] !== meeting[key as keyof Meeting]);
            if (changed) {
                const body = `${meeting.title}: revisa la fecha, el idioma y las indicaciones actualizadas en el Hub.`;
                await notifyApplicants(meeting, 'Cambios en una reunión', body);
                await notify(meeting.hostId, meeting.id, 'Reunión actualizada', body);
                if (previous.hostId !== meeting.hostId)
                    await notify(previous.hostId, meeting.id, 'Cambio de anfitrión', `${meeting.title}: coordinación asignó esta reunión a otro anfitrión.`);
            }
        }
        else
            await notify(meeting.hostId, meeting.id, 'Tienes una nueva JDP', `${meeting.title}: revisa la agenda y prepara las indicaciones para el Star.`);
        return meeting;
    });
}
export async function changeMeetingStatus(meetingId: string, user: User, status: unknown) {
    return transaction(async () => {
        const meeting = await managedMeeting(meetingId, user);
        if (!['scheduled', 'live', 'completed', 'cancelled'].includes(String(status)))
            throw new WorkflowError('Estado inválido.');
        if (meeting.status === status)
            return;
        await saveRecord('meetings', meetingId, { ...meeting, status, calendarRevision:(meeting.calendarRevision||0)+1, updatedAt:new Date().toISOString() });
        const label = status === 'cancelled' ? 'Reunión cancelada' : status === 'completed' ? 'La reunión finalizó' : status === 'live' ? 'La reunión está en vivo' : 'Reunión programada';
        await notifyApplicants(meeting, label, `${meeting.title}: consulta el estado y los próximos pasos en el Hub.`);
        if (user.id !== meeting.hostId)
            await notify(meeting.hostId, meetingId, label, `${meeting.title}: coordinación actualizó el estado.`);
    });
}
export async function askMeetingQuestion(meetingId: string, user: User, text: unknown) {
    return transaction(async () => {
        if (user.role !== 'star')
            throw new WorkflowError('Sin permiso.', 403);
        const meeting = await eligibleMeeting(meetingId);
        const question = typeof text === 'string' ? text.trim() : '';
        if (question.length < 5 || question.length > 500)
            throw new WorkflowError('Escribe una pregunta de entre 5 y 500 caracteres.');
        if ((await records<MeetingQuestion>('questions')).filter(q => q.userId === user.id && q.meetingId === meetingId && !q.reply).length >= 3)
            throw new WorkflowError('Ya tienes tres preguntas pendientes para este encuentro.');
        const id = randomUUID();
        await saveRecord('questions', id, { id, meetingId, userId: user.id, text: question, createdAt: new Date().toISOString() });
        await notify(meeting.hostId, meetingId, 'Un Star tiene una pregunta', `${meeting.title}: hay una pregunta pendiente en Mensajes.`);
        await notifyAdmins(meetingId, 'Nueva pregunta para el anfitrión', `${meeting.title}: el anfitrión tiene una pregunta por responder.`);
    });
}
export async function replyMeetingQuestion(questionId: string, user: User, text: unknown) {
    return transaction(async () => {
        const question = (await records<MeetingQuestion>('questions')).find(q => q.id === questionId);
        if (!question)
            throw new WorkflowError('Pregunta no encontrada.', 404);
        const meeting = await managedMeeting(question.meetingId, user);
        const reply = typeof text === 'string' ? text.trim() : '';
        if (reply.length < 2 || reply.length > 500)
            throw new WorkflowError('Escribe una respuesta de entre 2 y 500 caracteres.');
        if (question.reply === reply)
            return;
        if (question.reply)
            throw new WorkflowError('Otra persona ya respondió esta pregunta. Actualizamos la conversación para que puedas leer su respuesta. Tu borrador no se envió.', 409);
        await saveRecord('questions', question.id, { ...question, reply, replyAuthor: user.name, repliedAt: new Date().toISOString() });
        await notify(question.userId, meeting.id, 'Ya respondieron tu pregunta', `${user.name} respondió tu pregunta sobre ${meeting.title}. Puedes leerla en Mensajes.`);
    });
}
export async function updateHostMessage(meetingId: string, user: User, note: unknown, link: unknown) {
    return transaction(async () => {
        const meeting = await managedMeeting(meetingId, user);
        if (typeof note !== 'string' || note.trim().length > 400)
            throw new WorkflowError('El aviso puede tener hasta 400 caracteres.');
        let joinUrl: string;
        try {
            joinUrl = secureMeetingLink(link);
        }
        catch (error) {
            throw new WorkflowError((error as Error).message);
        }
        const hostNote = note.trim();
        const noteChanged = hostNote !== (meeting.hostNote || ''), linkChanged = joinUrl !== (meeting.joinUrl || '');
        if (!noteChanged && !linkChanged)
            return;
        await saveRecord('meetings', meetingId, { ...meeting, hostNote, joinUrl });
        for (const app of (await registrations()).filter(r => r.meetingId === meetingId && r.status !== 'withdrawn')) {
            if (noteChanged || app.status === 'confirmed')
                await notify(app.userId, meetingId, 'Nuevas indicaciones de tu JDP', `${meeting.title}: el equipo actualizó ${noteChanged ? 'las indicaciones' : 'el enlace de acceso'}. Revisa los detalles en el Hub.`);
        }
    });
}

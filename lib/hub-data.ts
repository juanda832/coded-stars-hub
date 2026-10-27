import type { HubData, User } from './types';
import { snapshot, notifications, criteria, starProfiles, visiblePublications } from './store';
import { directoryUsers, managedAccounts, accountView, assertAccountAccess } from './user-directory';
import { accountPolicy } from './accounts-store';
import { betaContributions } from './beta-review';
import {teamWorkspaceEnabled} from './workspace-mode';
import { participationOptions } from './types';
import { reportAvailable, reportConflicts, reportSummary } from './reports';
import { spanishCandidate, spanishCopy, spanishMeeting } from './spanish-copy';
// Shared visibility boundary for the app and its local assistant.
export async function hubDataFor(user: User): Promise<HubData> {
    await assertAccountAccess(user);
    const users = await directoryUsers(), profiles = await starProfiles(), ownProfile = profiles.find(p => p.userId === user.id);
    const store = await snapshot(), visible = user.role === 'host' ? store.meetings.filter(m => m.hostId === user.id) : store.meetings;
    const canSee = (item: {
        meetingId: string;
        userId: string;
    }) => user.role === 'star' ? item.userId === user.id : visible.some(m => m.id === item.meetingId);
    const registrations = store.registrations.filter(r => canSee(r) && (user.role !== 'host' || r.status === 'confirmed'));
    const meetings = visible.map(m => spanishMeeting({ ...m, joinUrl: user.role !== 'star' || registrations.some(r => r.meetingId === m.id && r.status === 'confirmed') ? m.joinUrl : undefined }));
    const candidateProfiles = user.role === 'admin' ? profiles.map(profile => {
        const reported = store.meetings.filter(m => reportAvailable(m) && store.registrations.some(r => r.meetingId === m.id && r.userId === profile.userId && r.status === 'confirmed') && store.reports.some(r => r.meetingId === m.id));
        const history = reported.map(m => { const reports = store.reports.filter(r => r.meetingId === m.id), own = reports.find(r => r.userId === profile.userId), host = reports.find(r => r.role === 'host'), source = own || host; return { meetingId: m.id, title: m.title, date: m.startsAt.slice(0, 10), outcome: reportConflicts(reports).length ? 'Versiones diferentes: coordinación debe contrastarlas' : source ? reportSummary(source) + (own ? ' · Según el Star' : ' · Según el anfitrión') : 'Sin información' }; });
        return { ...profile, history: [...history, ...profile.history.filter(h => !reported.some(m => m.id === h.meetingId))].sort((a, b) => b.date.localeCompare(a.date)) };
    }) : [];
    const candidates = candidateProfiles.map(spanishCandidate);
    const assignedIds = registrations.filter(r => r.status === 'confirmed').map(r => r.userId);
    return {
        user, workspace:user.reviewer?'review':teamWorkspaceEnabled()?'team':'beta', betaContributions:await betaContributions(user), ...(user.role==='admin'?{accounts:(await managedAccounts()).map(accountView),accountPolicy:accountPolicy()}:{}), profile: user.role === 'star' && ownProfile ? { languages: ownProfile.languages, programs: ownProfile.programs, availability: ownProfile.availability, experience: spanishCopy(ownProfile.experience) } : undefined, hosts: user.role === 'admin' ? users.filter(u => u.role === 'host').map(({ id, name }) => ({ id, name })) : [], team: user.role === 'admin' ? users : [], publications: await visiblePublications(user), meetings, registrations, feedback: store.feedback.filter(canSee), reports: store.reports.filter(r => user.role === 'admin' || r.userId === user.id), reportReviews: user.role === 'admin' ? store.reportReviews : [], questions: store.questions.filter(canSee),
        registrationCounts: Object.fromEntries(visible.map(m => [m.id, store.registrations.filter(r => r.meetingId === m.id && r.status !== 'withdrawn').length])),
        confirmedCounts: Object.fromEntries(visible.map(m => [m.id, store.registrations.filter(r => r.meetingId === m.id && r.status === 'confirmed').length])),
        candidates, assignedStars: user.role === 'star' ? [] : profiles.filter(p => assignedIds.includes(p.userId)).map(({ userId, name, initials, languages, programs }) => ({ userId, name, initials, languages, programs })),
        criteria: user.role === 'admin' ? await criteria() : {}, notifications: (await notifications(user.id)).map(item => /^m[1-5]$/.test(item.meetingId) ? { ...item, title: spanishCopy(item.title), body: spanishCopy(item.body) } : item),
        participationAnswer: store.participation.find(p => p.userId === user.id)?.answer,
        participationSummary: user.role === 'admin' ? participationOptions.map(answer => ({ answer, count: store.participation.filter(p => p.answer === answer).length })) : [],
        stats: { meetings: visible.length, registrations: registrations.filter(r => r.status !== 'withdrawn').length, confirmed: registrations.filter(r => r.status === 'confirmed').length, feedback: store.reports.filter(r => user.role === 'admin' || r.userId === user.id).length },
    };
}

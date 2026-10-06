/**
 * Unit test for utils/senderIdentity.js — pure JID parsing functions.
 *
 * Does NOT connect to real WhatsApp.
 * Tests: isPhoneJid, isLidJid, normalizePhoneFromJid, resolveSenderIdentity
 *
 * Run: node test-sender-identity.js
 */

import {
    isPhoneJid,
    isLidJid,
    normalizePhoneFromJid,
    resolveSenderIdentity,
} from './utils/senderIdentity.js';

let passed = 0;
let failed = 0;

function assert(label, actual, expected) {
    const ok = JSON.stringify(actual) === JSON.stringify(expected);
    if (ok) {
        console.log(`  ✅ ${label}`);
        passed++;
    } else {
        console.error(`  ❌ ${label}`);
        console.error(`       expected: ${JSON.stringify(expected)}`);
        console.error(`       actual:   ${JSON.stringify(actual)}`);
        failed++;
    }
}

// ─── isPhoneJid ──────────────────────────────────────────
console.log('\n─── isPhoneJid ───────────────────────────────────────');
assert('valid phone JID',          isPhoneJid('923001234567@s.whatsapp.net'), true);
assert('LID is NOT a phone JID',   isPhoneJid('86634523582505@lid'),          false);
assert('broadcast not phone JID',  isPhoneJid('status@broadcast'),            false);
assert('group not phone JID',      isPhoneJid('12345@g.us'),                   false);
assert('null → false',             isPhoneJid(null),                           false);
assert('undefined → false',        isPhoneJid(undefined),                      false);
assert('empty string → false',     isPhoneJid(''),                             false);

// ─── isLidJid ────────────────────────────────────────────
console.log('\n─── isLidJid ─────────────────────────────────────────');
assert('LID JID',                  isLidJid('86634523582505@lid'),          true);
assert('phone JID is NOT LID',     isLidJid('923001234567@s.whatsapp.net'), false);
assert('null → false',             isLidJid(null),                          false);
assert('undefined → false',        isLidJid(undefined),                     false);
assert('empty string → false',     isLidJid(''),                            false);

// ─── normalizePhoneFromJid ───────────────────────────────
console.log('\n─── normalizePhoneFromJid ────────────────────────────');
assert('standard phone JID',       normalizePhoneFromJid('923001234567@s.whatsapp.net'),       '923001234567');
assert('phone with device suffix', normalizePhoneFromJid('923001234567:12@s.whatsapp.net'),    '923001234567');
assert('LID → empty string',       normalizePhoneFromJid('86634523582505@lid'),                '');
assert('status broadcast → ""',    normalizePhoneFromJid('status@broadcast'),                  '');
assert('group JID → ""',           normalizePhoneFromJid('12345@g.us'),                         '');
assert('null → ""',                normalizePhoneFromJid(null),                                 '');
assert('undefined → ""',           normalizePhoneFromJid(undefined),                            '');
assert('empty string → ""',        normalizePhoneFromJid(''),                                   '');

// ─── resolveSenderIdentity ───────────────────────────────
console.log('\n─── resolveSenderIdentity ────────────────────────────');

// Helper to build a minimal fake msg
function fakeMsg(keyFields) {
    return { key: { ...keyFields } };
}

// Case 1: normal phone JID as remoteJid
{
    const msg = fakeMsg({ remoteJid: '923001234567@s.whatsapp.net' });
    const id  = resolveSenderIdentity(null, msg, null);
    assert('Case 1 — phone JID: phoneVerified=true',   id.phoneVerified, true);
    assert('Case 1 — phone JID: phone correct',        id.phone,         '923001234567');
    assert('Case 1 — phone JID: whatsappPhone',        id.whatsappPhone, '923001234567');
    assert('Case 1 — phone JID: source=remote_jid',   id.phoneSource,   'remote_jid');
    assert('Case 1 — phone JID: senderJid set',        id.senderJid,     '923001234567@s.whatsapp.net');
    assert('Case 1 — phone JID: senderLid empty',      id.senderLid,     '');
}

// Case 2: senderPn provided (highest priority)
{
    const msg = fakeMsg({
        remoteJid: '86634523582505@lid',
        senderPn:  '923001234567@s.whatsapp.net',
        senderLid: '86634523582505@lid',
    });
    const id = resolveSenderIdentity(null, msg, null);
    assert('Case 2 — senderPn: phoneVerified=true',        id.phoneVerified, true);
    assert('Case 2 — senderPn: phone correct',             id.phone,         '923001234567');
    assert('Case 2 — senderPn: source=sender_pn',         id.phoneSource,   'sender_pn');
    assert('Case 2 — senderPn: senderJid=PN JID',         id.senderJid,     '923001234567@s.whatsapp.net');
    assert('Case 2 — senderPn: senderLid preserved',      id.senderLid,     '86634523582505@lid');
    assert('Case 2 — senderPn: chatId would stay as LID', id.rawRemoteJid,  '86634523582505@lid');
}

// Case 3: unresolved LID — no PN available
{
    const msg = fakeMsg({ remoteJid: '86634523582505@lid' });
    const id  = resolveSenderIdentity(null, msg, null);
    assert('Case 3 — unresolved LID: phoneVerified=false',         id.phoneVerified, false);
    assert('Case 3 — unresolved LID: phone=""',                    id.phone,         '');
    assert('Case 3 — unresolved LID: whatsappPhone=""',            id.whatsappPhone, '');
    assert('Case 3 — CRITICAL: LID digits NOT used as phone',      id.phone,         '');
    assert('Case 3 — unresolved LID: source=unresolved_lid',      id.phoneSource,   'unresolved_lid');
    assert('Case 3 — unresolved LID: senderJid=""',                id.senderJid,     '');
    assert('Case 3 — unresolved LID: senderLid set correctly',     id.senderLid,     '86634523582505@lid');
}

// Case 4: status@broadcast → should not be phone
{
    const msg = fakeMsg({ remoteJid: 'status@broadcast' });
    const id  = resolveSenderIdentity(null, msg, null);
    assert('Case 4 — broadcast: phoneVerified=false',  id.phoneVerified, false);
    assert('Case 4 — broadcast: phone=""',             id.phone,         '');
}

// Case 5: group JID as remoteJid, participant is phone
{
    const msg = fakeMsg({ remoteJid: '12345@g.us', participant: '923001234567@s.whatsapp.net' });
    const id  = resolveSenderIdentity(null, msg, null);
    assert('Case 5 — group, phone participant: phoneVerified=true', id.phoneVerified, true);
    assert('Case 5 — group, phone participant: phone correct',      id.phone,         '923001234567');
    assert('Case 5 — group, phone participant: source=participant', id.phoneSource,   'participant');
}

// Case 6: null msg → safe fallback, no throw
{
    const id = resolveSenderIdentity(null, null, null);
    assert('Case 6 — null msg: no crash',       typeof id === 'object', true);
    assert('Case 6 — null msg: phoneVerified',  id.phoneVerified,       false);
    assert('Case 6 — null msg: phone=""',       id.phone,               '');
}

// Case 7: undefined key fields → safe fallback
{
    const msg = fakeMsg({ remoteJid: undefined, participant: undefined });
    const id  = resolveSenderIdentity(null, msg, null);
    assert('Case 7 — undefined fields: no crash',      typeof id === 'object', true);
    assert('Case 7 — undefined fields: phoneVerified', id.phoneVerified,       false);
    assert('Case 7 — undefined fields: phone=""',      id.phone,               '');
}

// Case 8: participantPn provided
{
    const msg = fakeMsg({
        remoteJid:     '12345@g.us',
        participantPn: '923001234567@s.whatsapp.net',
    });
    const id = resolveSenderIdentity(null, msg, null);
    assert('Case 8 — participantPn: phoneVerified=true',       id.phoneVerified, true);
    assert('Case 8 — participantPn: source=participant_pn',   id.phoneSource,   'participant_pn');
    assert('Case 8 — participantPn: phone correct',            id.phone,         '923001234567');
}

// ─── Summary ─────────────────────────────────────────────
console.log(`\n${'═'.repeat(50)}`);
console.log(`Results: ${passed} passed, ${failed} failed`);
if (failed > 0) {
    console.error('❌ Some tests FAILED.');
    process.exit(1);
} else {
    console.log('✅ All tests passed.');
}

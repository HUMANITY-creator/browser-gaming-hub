const KIND_RESPONSES = [
  'That sounds lovely. Let’s plan something after your shift.',
  'I am glad you checked in. Get there safely, okay?',
];
const BOUNDARY_RESPONSE = 'I am not comfortable with that. Please keep this respectful.';

export function createSocialState() {
  return {
    contact: { name: 'Ari Sol', adult: true, relationship: 'dating', trust: 62, lastReply: 'Good luck on your airport run. Call when you are free.' },
    family: { name: 'Nia Vale', relation: 'sister', lastMessage: 'Mum says dinner is at 19:00. No pressure—just let us know.' },
    voice: { supported: false, listening: false, transcript: '' },
  };
}

export function respondToMessage(social, message) {
  const normalized = message.trim().toLowerCase();
  if (!normalized) return social.contact.lastReply;
  if (/\b(hate|stupid|shut up|send (?:me )?(?:a )?(?:nude|pic))\b/.test(normalized)) {
    social.contact.trust = Math.max(0, social.contact.trust - 8);
    social.contact.lastReply = BOUNDARY_RESPONSE;
    return social.contact.lastReply;
  }
  if (/\b(come to my house|come over|my place)\b/.test(normalized)) {
    social.contact.trust = Math.min(100, social.contact.trust + 1);
    social.contact.lastReply = 'I would like to see you. Let’s agree on a time, make a plan, and keep it comfortable for both of us.';
    return social.contact.lastReply;
  }
  if (/\b(date|dinner|coffee|miss you|love|how are you|hello|hi)\b/.test(normalized)) {
    social.contact.trust = Math.min(100, social.contact.trust + 3);
    social.contact.lastReply = KIND_RESPONSES[social.contact.trust % KIND_RESPONSES.length];
    return social.contact.lastReply;
  }
  social.contact.lastReply = 'I hear you. I am in the middle of my day, but I will reply properly later.';
  return social.contact.lastReply;
}

import type { OutreachContact, OutreachSnapshot } from "./types";

/*
 * Invented people and companies, used only by the "Preview with sample data" button so the
 * board can be seen before the first real send. Nothing here is a real contact.
 */

const day = 86_400_000;
const ago = (days: number, hour = 21) => {
  const d = new Date(Date.now() - days * day);
  d.setHours(hour, 12, 0, 0);
  return d.toISOString();
};
// a date that many working days ahead, the way the sender counts
const on = (workingDays: number) => {
  let t = Date.now();
  for (let n = workingDays; n > 0; ) {
    t += day;
    const d = new Date(t).getDay();
    if (d !== 0 && d !== 6) n--;
  }
  return new Date(t).toISOString().slice(0, 10);
};

const FOOT = "\n\nNot relevant? Reply 'no' and we won't write again.\nmade. by ac, NAD, Visakhapatnam 530027, India";

function person(
  i: number,
  firstName: string,
  lastName: string,
  title: string,
  company: string,
  country: string,
  rest: Partial<OutreachContact>
): OutreachContact {
  const slug = company.toLowerCase().replace(/[^a-z]/g, "");
  const first = {
    step: 1,
    subject: `A homepage idea for ${company}`,
    text: `${firstName},\n\nYour homepage opens on "Software that keeps small teams moving." It says who you are for in one line.\n\nOur studio would like to redesign that first screen for free. We would keep your headline and give the two things people come for their own clear paths.\n\nWe would make it and send it back as a link. No call, no access, nothing to sign. A reply of 'yes' is enough.\n\nAsrith\nmade. by ac\nhttps://made-by-ac.com${FOOT}`,
  };
  return {
    email: `${firstName.toLowerCase()}@${slug}.example`,
    firstName,
    lastName,
    title,
    company,
    industry: i % 2 ? "information technology & services" : "marketing & advertising",
    country,
    city: country === "United Kingdom" ? "London" : "Austin",
    website: `https://${slug}.example`,
    linkedin: `https://www.linkedin.com/in/sample-${i}`,
    variant: i % 2 ? "A" : "B",
    status: "queued",
    hold: null,
    paused: false,
    sent: [],
    reply: null,
    next: { ...first, dueOn: null },
    linkedinNote: `Hi ${firstName}, our studio spent some time on the ${company} site and liked how plainly it says who it is for. We design websites and product screens, and would be glad to connect.`,
    linkedinSentAt: null,
    handledAt: null,
    siteObservation: 'Headline "Software that keeps small teams moving."',
    screen: "Homepage first screen",
    ...rest,
  };
}

const followUp1 = (name: string, company: string) => ({
  step: 2,
  subject: `Re: A homepage idea for ${company}`,
  text: `${name},\n\nOne more idea for the same page. Your pricing sits three clicks deep. We would bring a short version of it onto the homepage, so people can tell early whether you fit their budget.\n\nThe free redesign offer still stands. A 'yes' is all it takes.\n\nAsrith${FOOT}`,
});
const followUp2 = (name: string, company: string) => ({
  step: 3,
  subject: `Re: A homepage idea for ${company}`,
  text: `${name},\n\nThis is our last note, so we will stop writing after this one. If a fresh take on the ${company} homepage is ever useful, reply 'yes' any time and we will make it.\n\nAsrith${FOOT}`,
});
const firstOf = (c: OutreachContact) => ({ step: 1, subject: c.next!.subject, text: c.next!.text });

export function sampleSnapshot(): OutreachSnapshot {
  const base: OutreachContact[] = [
    person(1, "Maya", "Lindqvist", "Founder & CEO", "Northbeam Studio", "United States", {}),
    person(2, "Oliver", "Hartwell", "Managing Director", "Fernside Digital", "United Kingdom", {}),
    person(3, "Priya", "Castellan", "Chief Marketing Officer", "Tallow & Wren", "United States", {}),
    person(4, "Jonas", "Meriweather", "CEO", "Kestrel Labs", "United States", {}),
    person(5, "Sofia", "Brandt", "Head of Marketing", "Quillmate", "United Kingdom", {}),
    person(6, "Daniel", "Okafor", "Co-Founder", "Paperboat Systems", "United States", {}),
    person(7, "Hannah", "Rhodes", "President", "Lumen Row", "United States", {}),
    person(8, "Theo", "Vanterpool", "Founder", "Saltmarsh Media", "United Kingdom", {}),
    person(9, "Amara", "Delacroix", "CEO", "Brightwater Analytics", "United States", {}),
    person(10, "Felix", "Nakamura", "Chief Executive Officer", "Orchard & Pine", "United States", {}),
    person(11, "Greta", "Solberg", "Owner", "Hollow Oak Creative", "United Kingdom", {}),
    person(12, "Marcus", "Ellery", "CEO", "Tidewater Cloud", "United States", {}),
  ];
  const c = base;
  // replied, waiting on us
  c[0] = { ...c[0], status: "replied", sent: [{ ...firstOf(c[0]), at: ago(2) }], next: null, reply: { at: ago(0, 3), text: "Yes, go on then. Curious what you would do with the hero. No promises." } };
  // replied and already handled
  c[1] = { ...c[1], status: "replied", sent: [{ ...firstOf(c[1]), at: ago(6) }, { ...followUp1("Oliver", c[1].company), at: ago(2) }], next: null, reply: { at: ago(1, 14), text: "Interesting. Send it over and I will take a look when I can." }, handledAt: ago(0, 9), linkedinSentAt: ago(5) };
  // follow-up due today
  c[2] = { ...c[2], status: "active", sent: [{ ...firstOf(c[2]), at: ago(5) }], next: { ...followUp1("Priya", c[2].company), dueOn: on(0) } };
  c[3] = { ...c[3], status: "active", sent: [{ ...firstOf(c[3]), at: ago(5) }], next: { ...followUp1("Jonas", c[3].company), dueOn: on(0) }, linkedinSentAt: ago(4) };
  // waiting
  c[4] = { ...c[4], status: "active", sent: [{ ...firstOf(c[4]), at: ago(1) }], next: { ...followUp1("Sofia", c[4].company), dueOn: on(2) } };
  c[5] = { ...c[5], status: "active", sent: [{ ...firstOf(c[5]), at: ago(8) }, { ...followUp1("Daniel", c[5].company), at: ago(3) }], next: { ...followUp2("Daniel", c[5].company), dueOn: on(4) } };
  // closed with no reply
  c[6] = { ...c[6], status: "done", sent: [{ ...firstOf(c[6]), at: ago(16) }, { ...followUp1("Hannah", c[6].company), at: ago(11) }, { ...followUp2("Hannah", c[6].company), at: ago(4) }], next: null };
  // held by the pre-send check
  c[7] = { ...c[7], status: "held", hold: 'quoted line is no longer on their homepage: "Software that keeps small teams moving."', next: null };
  // opted out, bounced, paused, queued
  c[8] = { ...c[8], status: "optout", sent: [{ ...firstOf(c[8]), at: ago(3) }], next: null, reply: { at: ago(2, 20), text: "No thanks." } };
  c[9] = { ...c[9], status: "bounced", sent: [{ ...firstOf(c[9]), at: ago(3) }], next: null };
  c[10] = { ...c[10], paused: true };

  const stamp = (d: number, h: number, m: string) => `${ago(d, h)}  ${m}`;
  return {
    updatedAt: new Date(Date.now() - 4 * 60_000).toISOString(),
    wave: "sample-wave",
    pitch: "made. studio: web, brand and AI builds",
    from: "asrith@made-by-ac.com",
    listTotal: 200,
    written: c.length,
    firstSendAt: ago(16),
    caps: {
      newToday: 10,
      sentFirstToday: 3,
      sentToday: 5,
      perRun: 3,
      followUpAfter: [3, 5],
      ramp: [[0, 5], [3, 10], [7, 15], [12, 20]],
      windows: { US: { tz: "America/New_York", from: 12, to: 16.5 }, UK: { tz: "Europe/London", from: 9, to: 16.5 } },
      onParentDomain: true,
    },
    contacts: c,
    log: [
      stamp(3, 21, "LIVE run: 4 due now, taking 3"),
      stamp(3, 21, "sent step 1 (version A) to amara@brightwateranalytics.example, Brightwater Analytics"),
      stamp(2, 20, "opted out: amara@brightwateranalytics.example (Brightwater Analytics): No thanks."),
      stamp(2, 21, "bounced: felix@orchardpine.example"),
      stamp(1, 21, "sent step 1 (version B) to sofia@quillmate.example, Quillmate"),
      stamp(1, 21, 'not sent, theo@saltmarshmedia.example (step 1): quoted line is no longer on their homepage: "Software that keeps small teams moving."'),
      stamp(0, 3, "REPLIED: maya@northbeamstudio.example (Northbeam Studio): Yes, go on then. Curious what you would do with the hero."),
    ],
  };
}

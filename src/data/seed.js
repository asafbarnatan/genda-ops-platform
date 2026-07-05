// Seed data for the Genda Ops platform.
// PROVENANCE: `provided` rows come from Buildots' portfolio_data_clean.csv (14 real projects, values untouched).
// `fictive` rows (technicians, candidates, scores, assignments) are ours, per 4_Data_Layer.md.
// This module is the initial seed; the store loads it into localStorage on first run.

export const SEED_VERSION = 'v7';
export const TODAY = '2026-07-01'; // the operation's "today" (matches the strategy docs)

// ---------------------------------------------------------------------------
// PROJECTS — 14 provided rows (portfolio_data_clean.csv). Values PROVIDED.
// Assigned techs / candidateScore / training / recruitmentStatus are FICTIVE
// (derived from the Data Layer assignment map §5).
// ---------------------------------------------------------------------------
const baseProjects = [
  { id: 'BBH', name: 'BBH', product: 'Genda Pro', stage: 'Commercials', type: 'Healthcare', account: 'XX Construction', country: 'United States', region: 'Texas', requestedDelivery: '2026-07-07', projectEnd: '2028-07-07', durationMo: 24, floors: 12, buildings: 2, owner: 'DF', channel: 'Craigslist', assignedTechs: ['T-101'], candidateScore: 4, training: 'Done', recruitmentStatus: 'Deployed', staffingOk: true, dataNote: '', provenance: 'provided' },
  { id: 'Buck D', name: 'Buck D', product: 'Genda Pro', stage: 'Paperwork', type: 'Residential', account: 'JJ Construction', country: 'United States', region: 'Southeast', requestedDelivery: '2027-05-11', projectEnd: '2029-01-01', durationMo: 18, floors: 14, buildings: 1, owner: 'LS', channel: 'Facebook', assignedTechs: ['T-104'], candidateScore: 3, training: 'Done', recruitmentStatus: 'Onboarded', dataNote: '', provenance: 'provided' },
  { id: 'Hub At', name: 'Hub At', product: 'Genda Pro', stage: 'Paperwork', type: 'Residential', account: 'JJ Construction', country: 'United States', region: 'Southeast', requestedDelivery: '2026-08-04', projectEnd: '2028-07-21', durationMo: 14, floors: 11, buildings: 1, owner: 'LS', channel: 'Craigslist', assignedTechs: ['T-102'], candidateScore: 4, training: 'Done', recruitmentStatus: 'Scheduled', dataNote: '', provenance: 'provided' },
  { id: 'JPSM', name: 'JPSM', product: 'Genda Pro', stage: 'Paperwork', type: 'Healthcare', account: 'JJ Construction', country: 'United States', region: 'Southeast', requestedDelivery: '2026-07-01', projectEnd: '2029-03-19', durationMo: 16, floors: 15, buildings: 2, owner: 'DF', channel: 'Craigslist', assignedTechs: ['T-102', 'T-104'], candidateScore: 4, training: 'Done', recruitmentStatus: 'Deployed', dataNote: '', provenance: 'provided' },
  { id: 'MTX', name: 'MTX', product: 'Genda Pro', stage: 'Qualification', type: 'Healthcare', account: 'RR Construction', country: 'United States', region: 'West', requestedDelivery: '2027-01-01', projectEnd: '2028-01-07', durationMo: 13, floors: 2, buildings: 1, owner: 'ZR', channel: 'Craigslist', assignedTechs: [], candidateScore: null, training: 'Not Done', recruitmentStatus: 'Pre-recruitment', dataNote: "buildings parsed from text '1 building, 2 floors'", provenance: 'provided' },
  { id: 'P Health', name: 'P Health', product: 'Genda Pro', stage: 'Alignment', type: 'Healthcare', account: 'RR Construction', country: 'United States', region: 'West', requestedDelivery: '2027-05-04', projectEnd: '2028-05-01', durationMo: 37, floors: 16, buildings: 1, owner: 'DF', channel: 'Craigslist', assignedTechs: [], candidateScore: null, training: 'Not Done', recruitmentStatus: 'Pre-recruitment', dataNote: '', provenance: 'provided' },
  { id: '27th Street', name: '27th Street', product: 'Genda Pro', stage: 'Alignment', type: 'Residential', account: 'JJ Construction', country: 'United States', region: 'Southeast', requestedDelivery: '2026-06-02', projectEnd: '2027-09-20', durationMo: 14, floors: 21, buildings: 1, owner: 'LS', channel: 'LinkedIn', assignedTechs: ['T-103', 'T-105'], candidateScore: 4, training: 'Done', recruitmentStatus: 'Deployed', dataNote: '', provenance: 'provided' },
  { id: 'RISE', name: 'RISE', product: 'Genda Pro', stage: 'Qualification', type: 'Residential', account: 'JJ Construction', country: 'United States', region: 'Southeast', requestedDelivery: '2026-10-01', projectEnd: '2028-08-02', durationMo: 18, floors: 11, buildings: 1, owner: 'LS', channel: 'Craigslist', assignedTechs: ['T-103'], candidateScore: 4, training: 'Done', recruitmentStatus: 'Scheduled', dataNote: '', provenance: 'provided' },
  { id: 'The WWE', name: 'The WWE', product: 'Genda Pro', stage: 'Qualification', type: 'Residential', account: 'JJ Construction', country: 'United States', region: 'Southeast', requestedDelivery: '2027-03-02', projectEnd: '2028-12-26', durationMo: 18, floors: 12, buildings: 1, owner: 'LS', channel: 'Facebook', assignedTechs: ['T-105'], candidateScore: 3, training: 'Done', recruitmentStatus: 'Onboarded', dataNote: '', provenance: 'provided' },
  { id: 'UGA', name: 'UGA', product: 'Genda Pro', stage: 'Qualification', type: 'Residential', account: 'JJ Construction', country: 'United States', region: 'Southeast', requestedDelivery: '2027-06-01', projectEnd: '2028-08-01', durationMo: 11, floors: 10, buildings: 1, owner: 'LS', channel: 'Other', assignedTechs: ['T-104'], candidateScore: 3, training: 'Done', recruitmentStatus: 'Onboarded', dataNote: '', provenance: 'provided' },
  { id: 'WAP', name: 'WAP', product: 'Genda Pro', stage: 'Qualification', type: 'Residential', account: 'JJ Construction', country: 'United States', region: 'Southeast', requestedDelivery: '2026-12-01', projectEnd: '2029-11-30', durationMo: 36, floors: 52, buildings: 1, owner: 'LS', channel: 'Other', assignedTechs: ['T-102', 'T-103', 'T-104'], candidateScore: 4, training: 'Done', recruitmentStatus: 'Scheduled', dataNote: '', provenance: 'provided' },
  { id: 'WRH', name: 'WRH', product: 'Genda Pro', stage: 'Qualification', type: 'Education', account: 'JJ Construction', country: 'United States', region: 'Southeast', requestedDelivery: '2026-08-06', projectEnd: '2027-12-01', durationMo: 15, floors: 4, buildings: 1, owner: 'LS', channel: 'Craigslist', assignedTechs: ['T-102'], candidateScore: 4, training: 'Done', recruitmentStatus: 'Scheduled', dataNote: '', provenance: 'provided' },
  { id: 'Z1', name: 'Z1', product: 'Genda Pro', stage: 'Alignment', type: 'Residential', account: 'JJ Construction', country: 'United States', region: 'Southeast', requestedDelivery: '2026-09-01', projectEnd: '2027-12-09', durationMo: 25, floors: 8, buildings: 1, owner: 'LS', channel: 'LinkedIn', assignedTechs: ['T-103'], candidateScore: 4, training: 'Done', recruitmentStatus: 'Scheduled', dataNote: '', provenance: 'provided' },
];

// ---------------------------------------------------------------------------
// The 24-step process template, flattened. `office` = office-owned; false = field (Regional Lead).
// Handoff to the Regional Lead sits before "Site Orientation" (step 14). Monthly Payment Approval is office.
// ---------------------------------------------------------------------------
export const STEPS = [
  { i: 0, phase: 'Pre-Signature', name: 'Installation Opportunity Created', office: true, info: 'Opening and registering a new installation opportunity in the operational workflow.' },
  { i: 1, phase: 'Pre-Signature', name: 'Installation Opportunity Tracker', office: true, info: 'Tracking all pre-launch activities, owners, milestones, and readiness status.' },
  { i: 2, phase: 'Pre-Signature', name: 'Service Source', office: true, info: 'Determining the delivery model and identifying the appropriate service source.' },
  { i: 3, phase: 'Signature', name: 'Sales HO (Handoff)', office: true, info: 'Conducting the internal sales handoff to transfer project knowledge into operations.' },
  { i: 4, phase: 'Signature', name: 'Contract', office: true, info: 'Finalizing the contract with the installer — the field technician / vendor engaged to run the installation.' },
  { i: 5, phase: 'Signature', name: 'Project Slide Deck', office: true, info: 'Preparing the project overview and operational briefing materials.' },
  { i: 6, phase: 'Signature', name: 'Project Installation Plan', office: true, info: 'Creating the installation strategy, logistics plan, and execution approach.' },
  { i: 7, phase: 'Buildots Training', name: 'BD System Permissions', office: true, info: 'Granting required access to Buildots systems and tools.' },
  { i: 8, phase: 'Buildots Training', name: 'Staffing Status', office: true, info: 'Confirming resource allocation and project staffing readiness.' },
  { i: 9, phase: 'Buildots Training', name: 'OSHA10', office: true, info: 'Verifying all required safety certifications are completed in advance.' },
  { i: 10, phase: 'Buildots Training', name: 'Buildots Training', office: true, info: 'Completing Buildots process, methodology, and platform training.' },
  { i: 11, phase: 'Equipment Setup', name: 'Installation Kits', office: true, info: 'Shipment of installation equipment for the project — sent for every project, including returning technicians.' },
  { i: 12, phase: 'Equipment Setup', name: 'PPE', office: true, info: 'Ensuring required personal protective equipment is available and compliant. Skipped on the returning-tech path.' },
  { i: 13, phase: 'First Installation', name: 'Site Orientation Info', office: true, info: 'Collecting site access, safety, and orientation requirements.' },
  { i: 14, phase: 'First Installation', name: 'Site Orientation', office: false, info: "Completing the client's site induction and onboarding process." },
  { i: 15, phase: 'First Installation', name: '0th Installation', office: false, info: 'Performing an initial validation installation to confirm site readiness and methodology.' },
  { i: 16, phase: 'First Installation', name: 'First Installation', office: false, info: 'Executing the first official project installation.' },
  { i: 17, phase: 'First Installation', name: 'First Upload', office: false, info: 'Uploading the first installation dataset to the Buildots platform.' },
  { i: 18, phase: 'First Installation', name: 'Location & Summary Received', office: false, info: "Receiving and validating the project's sensor location and summary of the first day." },
  { i: 19, phase: 'First Installation', name: 'First Installation Review', office: false, info: 'Reviewing the quality and completeness of the first installation.' },
  { i: 20, phase: 'First Installation', name: 'Review Sent to Technician', office: false, info: 'Providing structured feedback and approval status to the technicians.' },
  { i: 21, phase: 'Operational Delivery', name: 'Ongoing Installations', office: false, info: 'Executing recurring installations according to the agreed project schedule.' },
  { i: 22, phase: 'Operational Delivery', name: 'Ongoing Installation Reviews', office: false, info: 'Performing continuous quality assurance and performance monitoring.' },
  { i: 23, phase: 'Billing & Payments', name: 'Monthly Payment Approval', office: true, info: 'Reviewing and approving monthly vendor invoices for payment.' },
];
export const BOUNDARY_STEP = 14; // handoff to Regional Lead begins here
export const PHASES = [...new Set(STEPS.map((s) => s.phase))];

// where each project currently sits on the 24-step spine (from recruitment status)
const PROGRESS_BY_STATUS = { 'Pre-recruitment': 3, Onboarded: 12, Scheduled: 16, Deployed: 21 };
// Date-consistent current step per project, aligned to each project's own back-schedule
// (recruit-by → ready-by → delivery). Near-delivery projects sit at First Installation; the
// three converging there are the live bottleneck. Far-future projects (delivering 2027) are
// still in early sales — their build window hasn't opened, so they read "planning". 27th Street
// is deliberately behind: overdue and NOT yet installed (step 14), matching its critical status
// (its status said "not delivered", so it must sit before First Installation, step 16).
const PROGRESS_BY_ID = { '27th Street': 14, JPSM: 15, BBH: 15, 'Hub At': 9, WRH: 8, Z1: 4, RISE: 1, WAP: 2, MTX: 1, 'The WWE': 1, 'P Health': 2, 'Buck D': 3, UGA: 1 };
const statusForProgress = (pr) => (pr >= 21 ? 'Deployed' : pr >= 13 ? 'Scheduled' : pr >= 7 ? 'Onboarded' : 'Pre-recruitment');
// Returning-tech projects (fast path): skip Buildots Training + PPE
const RETURNING = new Set(['RISE', 'Z1']);
// seed change-log history for a few projects (FICTIVE) — cause taxonomy + acceleration + volatility
const CHANGE_LOGS = {
  JPSM: [
    { id: 'j1', ts: '2026-05-02', field: 'Requested Delivery', old: '2026-07-20', new: '2026-07-08', delta: -12, cause: 'Client update', by: 'DF', note: 'Client pulled the date forward' },
    { id: 'j2', ts: '2026-06-10', field: 'Requested Delivery', old: '2026-07-08', new: '2026-07-01', delta: -7, cause: 'Construction ahead', by: 'DF', note: 'Structure ready early — runway compressed' },
  ],
  WAP: [
    { id: 'w1', ts: '2026-06-15', field: 'Requested Delivery', old: '2026-12-20', new: '2026-12-01', delta: -19, cause: 'Construction ahead', by: 'LS', note: 'Acceleration — 52 floors need a 3-crew, watch the runway' },
  ],
  'Hub At': [
    { id: 'h1', ts: '2026-06-28', field: 'Requested Delivery', old: '2026-08-02', new: '2026-08-04', delta: 2, cause: 'Client update', by: 'LS', note: 'Routine 2-day slip' },
  ],
  '27th Street': [
    { id: 's1', ts: '2026-04-10', field: 'Requested Delivery', old: '2026-05-15', new: '2026-06-02', delta: 18, cause: 'Construction behind', by: 'LS', note: 'Slip; now overdue' },
  ],
};

export const seedProjects = baseProjects.map((p) => {
  const progress = p.junk ? 0 : (PROGRESS_BY_ID[p.id] ?? PROGRESS_BY_STATUS[p.recruitmentStatus] ?? 3);
  return {
    ...p,
    assignmentType: RETURNING.has(p.id) ? 'Returning' : 'New-hire',
    progress,
    recruitmentStatus: statusForProgress(progress), // keep the status label consistent with the step
    stepState: {}, // manual overrides: { [stepIndex]: 'done'|'doing'|'blocked'|'skipped' }
    changeLog: CHANGE_LOGS[p.id] || [],
    changeCount: (CHANGE_LOGS[p.id] || []).length,
  };
});

// ---------------------------------------------------------------------------
// TECHNICIANS — 7, all FICTIVE (technicians_fictive.csv). 5 active + 2 churned.
// metrics: coverage, reliability, ontime, upload, issues (each 1-5).
// ---------------------------------------------------------------------------
export const seedTechnicians = [
  { id: 'T-101', name: 'Marcus Bell', channel: 'Craigslist', region: 'Texas', lead: 'Gil', pool: 'Active', candidateScore: 4, metrics: { coverage: 5, reliability: 5, ontime: 4, upload: 4, issues: 5 }, installs: 4, projects: ['BBH'], provisional: false, note: 'Top Texas performer; covers BBH over 2 days. A strong Craigslist outcome.', provenance: 'fictive' },
  { id: 'T-102', name: 'Devin Carter', channel: 'Craigslist', region: 'Southeast', lead: 'Gil', pool: 'Active', candidateScore: 4, metrics: { coverage: 4, reliability: 5, ontime: 4, upload: 5, issues: 4 }, installs: 7, projects: ['JPSM', 'Hub At', 'WRH', 'WAP'], provisional: false, note: 'Most experienced SE tech.', provenance: 'fictive' },
  { id: 'T-103', name: 'Andre Foster', channel: 'LinkedIn', region: 'Southeast', lead: 'Gil', pool: 'Active', candidateScore: 4, metrics: { coverage: 4, reliability: 4, ontime: 5, upload: 4, issues: 4 }, installs: 5, projects: ['27th Street', 'Z1', 'RISE', 'WAP'], provisional: false, note: 'Reliable LinkedIn-sourced tech.', provenance: 'fictive' },
  { id: 'T-104', name: 'Tyler Nguyen', channel: 'Facebook', region: 'Southeast', lead: 'Gil', pool: 'Active', candidateScore: 3, metrics: { coverage: 4, reliability: 4, ontime: 3, upload: 4, issues: 3 }, installs: 3, projects: ['JPSM', 'UGA', 'Buck D', 'WAP'], provisional: false, note: 'Just cleared the 3-install provisional bar.', provenance: 'fictive' },
  { id: 'T-105', name: 'Jordan Reyes', channel: 'Other', region: 'Southeast', lead: 'Gil', pool: 'Active', candidateScore: 3, metrics: { coverage: 3, reliability: 4, ontime: 3, upload: 3, issues: 3 }, installs: 3, projects: ['27th Street', 'The WWE'], provisional: false, note: 'Meets the 3.0 bar but marginal; watch the trend.', provenance: 'fictive' },
  { id: 'T-106', name: 'Chris Dolan', channel: 'Craigslist', region: 'Southeast', lead: 'Gil', pool: 'Benched', candidateScore: 3, metrics: { coverage: 3, reliability: 2, ontime: 3, upload: 3, issues: 3 }, installs: 2, projects: [], provisional: true, note: 'Benched on the NO-SHOW HARD GATE (applies even while provisional); composite also < 3.0. In review.', noShows: [{ date: '2026-06-18', project: 'Hub At', region: 'Southeast', event: 'Scheduled deployment', note: 'Did not arrive and was unreachable; the site crew stood down and the day was lost. Covered next day by Devin Carter (RL flagged the hard gate).' }], provenance: 'fictive' },
  { id: 'T-107', name: 'Ray Mott', channel: 'Craigslist', region: 'Southeast', lead: 'Gil', pool: 'Removed', candidateScore: 3, metrics: { coverage: 2, reliability: 1, ontime: 2, upload: 2, issues: 2 }, installs: 3, projects: [], provisional: false, note: 'Removed: 2nd no-show + sustained < 2.0. Candidate Score 3 (optimistic) vs Quality 1.75 = the estimate-vs-reality gap.', noShows: [{ date: '2026-05-05', project: 'WRH', region: 'Southeast', event: 'First installation day', note: 'Cancelled the morning of the deployment; covered by a returning technician. First strike.' }, { date: '2026-06-10', project: 'Z1', region: 'Southeast', event: 'Deploy / 0th installation', note: 'No-show at deploy — second strike, which triggered removal under the 2nd-no-show hard gate.' }], provenance: 'fictive' },
];

// ---------------------------------------------------------------------------
// CANDIDATES — 2 in-flight, both Cloud Factory (the vendor pilot). FICTIVE.
// ---------------------------------------------------------------------------
export const seedCandidates = [
  { id: 'C-201', name: 'Priya Anand', channel: 'Vendor - Cloud Factory', region: 'Southeast', stage: 'Screened', daysInStage: 4, stageSla: 10, candidateScore: 4, nextAction: 'Onboarding', owner: 'OM', dropoff: '', note: 'Pre-vetted: entered at Screened (skips the Craigslist sourcing flood). Backfills churned SE capacity.', provenance: 'fictive' },
  { id: 'C-202', name: 'Omar Haddad', channel: 'Vendor - Cloud Factory', region: 'Texas', stage: 'Screened', daysInStage: 3, stageSla: 10, candidateScore: 4, nextAction: 'Onboarding', owner: 'OM', dropoff: '', note: 'Pre-vetted (Texas). Second vendor-pilot hire; no Quality Score - not deployed yet.', provenance: 'fictive' },
];

// The 24-step / 7-phase process template (process_template_clean.md). PROVIDED structure.
export const processTemplate = [
  { phase: 'Pre-Signature', office: true, steps: ['Installation Opportunity Created', 'Installation Opportunity Tracker', 'Service Source'] },
  { phase: 'Signature', office: true, steps: ['Sales HO (Handoff)', 'Contract', 'Project Slide Deck', 'Project Installation Plan'] },
  { phase: 'Buildots Training', office: true, steps: ['BD System Permissions', 'Staffing Status', 'OSHA10', 'Buildots Training'] },
  { phase: 'Equipment Setup', office: true, steps: ['Installation Kits', 'PPE'] },
  { phase: 'First Installation', office: false, steps: ['Site Orientation Info', 'Site Orientation', '0th Installation', 'First Installation', 'First Upload', 'Location & Summary Received', 'First Installation Review', 'Review Sent to Technician'] },
  { phase: 'Operational Delivery', office: false, steps: ['Ongoing Installations', 'Ongoing Installation Reviews'] },
  { phase: 'Billing & Payments', office: false, steps: ['Monthly Payment Approval'] },
];

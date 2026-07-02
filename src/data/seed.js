// Seed data for the Genda Ops platform.
// PROVENANCE: `provided` rows come from Buildots' portfolio_data_clean.csv (14 real projects, values untouched).
// `fictive` rows (technicians, candidates, scores, assignments) are ours, per 4_Data_Layer.md.
// This module is the initial seed; the store loads it into localStorage on first run.

export const SEED_VERSION = 'v1';
export const TODAY = '2026-07-01'; // the operation's "today" (matches the strategy docs)

// ---------------------------------------------------------------------------
// PROJECTS — 14 provided rows (portfolio_data_clean.csv). Values PROVIDED.
// Assigned techs / candidateScore / training / recruitmentStatus are FICTIVE
// (derived from the Data Layer assignment map §5).
// ---------------------------------------------------------------------------
export const seedProjects = [
  { id: 'BBH', name: 'BBH', product: 'Genda Pro', stage: 'Commercials', type: 'Healthcare', account: 'XX Construction', country: 'United States', region: 'Texas', requestedDelivery: '2026-07-07', projectEnd: '2028-07-07', durationMo: 24, floors: 12, buildings: 2, owner: 'DF', channel: 'Craigslist', assignedTechs: ['T-101'], candidateScore: 4, training: 'Done', recruitmentStatus: 'Deployed', dataNote: '', provenance: 'provided' },
  { id: 'Buck D', name: 'Buck D', product: 'Genda Pro', stage: 'Paperwork', type: 'Residential', account: 'JJ Construction', country: 'United States', region: 'Southeast', requestedDelivery: '2027-05-11', projectEnd: '2029-01-01', durationMo: 18, floors: 14, buildings: 1, owner: 'LS', channel: 'Facebook', assignedTechs: ['T-104'], candidateScore: 3, training: 'Done', recruitmentStatus: 'Onboarded', dataNote: '', provenance: 'provided' },
  { id: 'Hub At', name: 'Hub At', product: 'Genda Pro', stage: 'Paperwork', type: 'Residential', account: 'JJ Construction', country: 'United States', region: 'Southeast', requestedDelivery: '2026-08-04', projectEnd: '2028-07-21', durationMo: 14, floors: 11, buildings: 1, owner: 'LS', channel: 'Craigslist', assignedTechs: ['T-102'], candidateScore: 4, training: 'Done', recruitmentStatus: 'Scheduled', dataNote: '', provenance: 'provided' },
  { id: 'JPSM', name: 'JPSM', product: 'Genda Pro', stage: 'Paperwork', type: 'Healthcare', account: 'JJ Construction', country: 'United States', region: 'Southeast', requestedDelivery: '2026-07-01', projectEnd: '2029-03-19', durationMo: 16, floors: 15, buildings: 2, owner: 'DF', channel: 'Craigslist', assignedTechs: ['T-102', 'T-104'], candidateScore: 4, training: 'Done', recruitmentStatus: 'Deployed', dataNote: '', provenance: 'provided' },
  { id: 'MTX', name: 'MTX', product: 'Genda Pro', stage: 'Qualification', type: 'Healthcare', account: 'RR Construction', country: 'United States', region: 'West', requestedDelivery: '2027-01-01', projectEnd: '2028-01-07', durationMo: 13, floors: 2, buildings: 1, owner: 'ZR', channel: 'Craigslist', assignedTechs: [], candidateScore: null, training: 'Not Done', recruitmentStatus: 'Pre-recruitment', dataNote: "buildings parsed from text '1 building, 2 floors'", provenance: 'provided' },
  { id: 'P Health', name: 'P Health', product: 'Genda Pro', stage: 'Alignment', type: 'Healthcare', account: 'RR Construction', country: 'United States', region: 'West', requestedDelivery: '2027-05-04', projectEnd: '2028-05-01', durationMo: 37, floors: 16, buildings: 1, owner: 'DF', channel: 'Craigslist', assignedTechs: [], candidateScore: null, training: 'Not Done', recruitmentStatus: 'Pre-recruitment', dataNote: '', provenance: 'provided' },
  { id: '27th Street', name: '27th Street', product: 'Genda Pro', stage: 'Alignment', type: 'Residential', account: 'JJ Construction', country: 'United States', region: 'Southeast', requestedDelivery: '2026-06-02', projectEnd: '2027-09-20', durationMo: 14, floors: 21, buildings: 1, owner: 'LS', channel: 'LinkedIn', assignedTechs: ['T-103', 'T-105'], candidateScore: 4, training: 'Done', recruitmentStatus: 'Deployed', dataNote: '', provenance: 'provided' },
  { id: 'RISE', name: 'RISE', product: 'Genda Pro', stage: 'Qualification', type: 'Residential', account: 'JJ Construction', country: 'United States', region: 'Southeast', requestedDelivery: '2026-10-01', projectEnd: '2028-08-02', durationMo: 18, floors: 11, buildings: 1, owner: 'LS', channel: 'Craigslist', assignedTechs: ['T-103'], candidateScore: 4, training: 'Done', recruitmentStatus: 'Scheduled', dataNote: '', provenance: 'provided' },
  { id: 'qa', name: 'qa', product: 'Genda Pro', stage: 'Qualification', type: 'Commercial', account: 'RR Construction', country: 'United States', region: 'Texas', requestedDelivery: '2026-02-01', projectEnd: '', durationMo: 3, floors: null, buildings: null, owner: 'KC', channel: 'Craigslist', assignedTechs: [], candidateScore: null, training: '', recruitmentStatus: '', dataNote: 'SUSPECTED TEST/JUNK ROW - missing floors/buildings/end date; excluded from ops math', junk: true, provenance: 'provided' },
  { id: 'The WWE', name: 'The WWE', product: 'Genda Pro', stage: 'Qualification', type: 'Residential', account: 'JJ Construction', country: 'United States', region: 'Southeast', requestedDelivery: '2027-03-02', projectEnd: '2028-12-26', durationMo: 18, floors: 12, buildings: 1, owner: 'LS', channel: 'Facebook', assignedTechs: ['T-105'], candidateScore: 3, training: 'Done', recruitmentStatus: 'Onboarded', dataNote: '', provenance: 'provided' },
  { id: 'UGA', name: 'UGA', product: 'Genda Pro', stage: 'Qualification', type: 'Residential', account: 'JJ Construction', country: 'United States', region: 'Southeast', requestedDelivery: '2027-06-01', projectEnd: '2028-08-01', durationMo: 11, floors: 10, buildings: 1, owner: 'LS', channel: 'Other', assignedTechs: ['T-104'], candidateScore: 3, training: 'Done', recruitmentStatus: 'Onboarded', dataNote: '', provenance: 'provided' },
  { id: 'WAP', name: 'WAP', product: 'Genda Pro', stage: 'Qualification', type: 'Residential', account: 'JJ Construction', country: 'United States', region: 'Southeast', requestedDelivery: '2026-12-01', projectEnd: '2029-11-30', durationMo: 36, floors: 52, buildings: 1, owner: 'LS', channel: 'Other', assignedTechs: ['T-102', 'T-103', 'T-104'], candidateScore: 4, training: 'Done', recruitmentStatus: 'Scheduled', dataNote: '', provenance: 'provided' },
  { id: 'WRH', name: 'WRH', product: 'Genda Pro', stage: 'Qualification', type: 'Education', account: 'JJ Construction', country: 'United States', region: 'Southeast', requestedDelivery: '2026-08-06', projectEnd: '2027-12-01', durationMo: 15, floors: 4, buildings: 1, owner: 'LS', channel: 'Craigslist', assignedTechs: ['T-102'], candidateScore: 4, training: 'Done', recruitmentStatus: 'Scheduled', dataNote: '', provenance: 'provided' },
  { id: 'Z1', name: 'Z1', product: 'Genda Pro', stage: 'Alignment', type: 'Residential', account: 'JJ Construction', country: 'United States', region: 'Southeast', requestedDelivery: '2026-09-01', projectEnd: '2027-12-09', durationMo: 25, floors: 8, buildings: 1, owner: 'LS', channel: 'LinkedIn', assignedTechs: ['T-103'], candidateScore: 4, training: 'Done', recruitmentStatus: 'Scheduled', dataNote: '', provenance: 'provided' },
];

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
  { id: 'T-106', name: 'Chris Dolan', channel: 'Craigslist', region: 'Southeast', lead: 'Gil', pool: 'Benched', candidateScore: 3, metrics: { coverage: 3, reliability: 2, ontime: 3, upload: 3, issues: 3 }, installs: 2, projects: [], provisional: true, note: 'Benched on the NO-SHOW HARD GATE (applies even while provisional); composite also < 3.0. In review.', provenance: 'fictive' },
  { id: 'T-107', name: 'Ray Mott', channel: 'Craigslist', region: 'Southeast', lead: 'Gil', pool: 'Removed', candidateScore: 3, metrics: { coverage: 2, reliability: 1, ontime: 2, upload: 2, issues: 2 }, installs: 3, projects: [], provisional: false, note: 'Removed: 2nd no-show + sustained < 2.0. Candidate Score 3 (optimistic) vs Quality 1.75 = the estimate-vs-reality gap.', provenance: 'fictive' },
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

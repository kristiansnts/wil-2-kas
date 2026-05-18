-- Seed: Pertemuan Wilayah Maret 2026
-- Source: Laporan Maret 2026 - Revisi - MARET.csv
-- Only inserts PastorSubmission + WadahEntry (status=pending).
-- Approve through the admin UI to generate transactions and update balances.
-- Run: npx prisma db execute --file scripts/seed-march-2026.sql

BEGIN;

-- ─── CLEANUP (idempotent) ──────────────────────────────────────────────────
DELETE FROM "WadahEntry"       WHERE "submissionId" LIKE 'msub-march-%';
DELETE FROM "PastorSubmission" WHERE id              LIKE 'msub-march-%';

-- ─── PASTOR SUBMISSIONS (status=pending) ─────────────────────────────────
-- Skipped (persepuluhan=0): cmx008, cmx010, cmx034, cmx040, cmx052, cmx056, cmx063
INSERT INTO "PastorSubmission" (id, "meetingId", "pastorId", persepuluhan, bulan, status, "submittedAt") VALUES
('msub-march-cmx001','march-2026-meeting','cmx001',100000,2,'pending','2026-03-15 00:00:00+00'),
('msub-march-cmx002','march-2026-meeting','cmx002',100000,1,'pending','2026-03-15 00:00:00+00'),
('msub-march-cmx003','march-2026-meeting','cmx003',110000,1,'pending','2026-03-15 00:00:00+00'),
('msub-march-cmx004','march-2026-meeting','cmx004',100000,1,'pending','2026-03-15 00:00:00+00'),
('msub-march-cmx005','march-2026-meeting','cmx005',100000,1,'pending','2026-03-15 00:00:00+00'),
('msub-march-cmx006','march-2026-meeting','cmx006',100000,1,'pending','2026-03-15 00:00:00+00'),
('msub-march-cmx007','march-2026-meeting','cmx007',100000,1,'pending','2026-03-15 00:00:00+00'),
('msub-march-cmx009','march-2026-meeting','cmx009',300000,1,'pending','2026-03-15 00:00:00+00'),
('msub-march-cmx011','march-2026-meeting','cmx011',800000,1,'pending','2026-03-15 00:00:00+00'),
('msub-march-cmx012','march-2026-meeting','cmx012',50000, 1,'pending','2026-03-15 00:00:00+00'),
('msub-march-cmx013','march-2026-meeting','cmx013',100000,1,'pending','2026-03-15 00:00:00+00'),
('msub-march-cmx014','march-2026-meeting','cmx014',150000,1,'pending','2026-03-15 00:00:00+00'),
('msub-march-cmx015','march-2026-meeting','cmx015',215000,1,'pending','2026-03-15 00:00:00+00'),
('msub-march-cmx016','march-2026-meeting','cmx016',100000,1,'pending','2026-03-15 00:00:00+00'),
('msub-march-cmx017','march-2026-meeting','cmx017',200000,1,'pending','2026-03-15 00:00:00+00'),
('msub-march-cmx018','march-2026-meeting','cmx018',50000, 1,'pending','2026-03-15 00:00:00+00'),
('msub-march-cmx019','march-2026-meeting','cmx019',350000,2,'pending','2026-03-15 00:00:00+00'),
('msub-march-cmx020','march-2026-meeting','cmx020',150000,1,'pending','2026-03-15 00:00:00+00'),
('msub-march-cmx021','march-2026-meeting','cmx021',1000000,1,'pending','2026-03-15 00:00:00+00'),
('msub-march-cmx022','march-2026-meeting','cmx022',100000,1,'pending','2026-03-15 00:00:00+00'),
('msub-march-cmx023','march-2026-meeting','cmx023',75000, 1,'pending','2026-03-15 00:00:00+00'),
('msub-march-cmx024','march-2026-meeting','cmx024',150000,1,'pending','2026-03-15 00:00:00+00'),
('msub-march-cmx025','march-2026-meeting','cmx025',20000, 1,'pending','2026-03-15 00:00:00+00'),
('msub-march-cmx026','march-2026-meeting','cmx026',50000, 1,'pending','2026-03-15 00:00:00+00'),
('msub-march-cmx027','march-2026-meeting','cmx027',260000,1,'pending','2026-03-15 00:00:00+00'),
('msub-march-cmx028','march-2026-meeting','cmx028',100000,1,'pending','2026-03-15 00:00:00+00'),
('msub-march-cmx029','march-2026-meeting','cmx029',250000,1,'pending','2026-03-15 00:00:00+00'),
('msub-march-cmx030','march-2026-meeting','cmx030',100000,1,'pending','2026-03-15 00:00:00+00'),
('msub-march-cmx031','march-2026-meeting','cmx031',100000,1,'pending','2026-03-15 00:00:00+00'),
('msub-march-cmx032','march-2026-meeting','cmx032',125000,1,'pending','2026-03-15 00:00:00+00'),
('msub-march-cmx033','march-2026-meeting','cmx033',40000, 1,'pending','2026-03-15 00:00:00+00'),
('msub-march-cmx035','march-2026-meeting','cmx035',250000,1,'pending','2026-03-15 00:00:00+00'),
('msub-march-cmx036','march-2026-meeting','cmx036',75000, 1,'pending','2026-03-15 00:00:00+00'),
('msub-march-cmx037','march-2026-meeting','cmx037',200000,1,'pending','2026-03-15 00:00:00+00'),
('msub-march-cmx038','march-2026-meeting','cmx038',100000,1,'pending','2026-03-15 00:00:00+00'),
('msub-march-cmx039','march-2026-meeting','cmx039',50000, 1,'pending','2026-03-15 00:00:00+00'),
('msub-march-cmx041','march-2026-meeting','cmx041',100000,1,'pending','2026-03-15 00:00:00+00'),
('msub-march-cmx042','march-2026-meeting','cmx042',50000, 1,'pending','2026-03-15 00:00:00+00'),
('msub-march-cmx043','march-2026-meeting','cmx043',220000,1,'pending','2026-03-15 00:00:00+00'),
('msub-march-cmx044','march-2026-meeting','cmx044',40000, 1,'pending','2026-03-15 00:00:00+00'),
('msub-march-cmx045','march-2026-meeting','cmx045',50000, 1,'pending','2026-03-15 00:00:00+00'),
('msub-march-cmx046','march-2026-meeting','cmx046',100000,1,'pending','2026-03-15 00:00:00+00'),
('msub-march-cmx047','march-2026-meeting','cmx047',315000,1,'pending','2026-03-15 00:00:00+00'),
('msub-march-cmx048','march-2026-meeting','cmx048',100000,1,'pending','2026-03-15 00:00:00+00'),
('msub-march-cmx049','march-2026-meeting','cmx049',150000,1,'pending','2026-03-15 00:00:00+00'),
('msub-march-cmx050','march-2026-meeting','cmx050',75000, 1,'pending','2026-03-15 00:00:00+00'),
('msub-march-cmx051','march-2026-meeting','cmx051',500000,1,'pending','2026-03-15 00:00:00+00'),
('msub-march-cmx053','march-2026-meeting','cmx053',135000,1,'pending','2026-03-15 00:00:00+00'),
('msub-march-cmx054','march-2026-meeting','cmx054',100000,1,'pending','2026-03-15 00:00:00+00'),
('msub-march-cmx055','march-2026-meeting','cmx055',100000,1,'pending','2026-03-15 00:00:00+00'),
('msub-march-cmx057','march-2026-meeting','cmx057',200000,1,'pending','2026-03-15 00:00:00+00'),
('msub-march-cmx058','march-2026-meeting','cmx058',60000, 1,'pending','2026-03-15 00:00:00+00'),
('msub-march-cmx059','march-2026-meeting','cmx059',100000,1,'pending','2026-03-15 00:00:00+00'),
('msub-march-cmx060','march-2026-meeting','cmx060',200000,1,'pending','2026-03-15 00:00:00+00'),
('msub-march-cmx061','march-2026-meeting','cmx061',100000,1,'pending','2026-03-15 00:00:00+00'),
('msub-march-cmx062','march-2026-meeting','cmx062',325000,1,'pending','2026-03-15 00:00:00+00'),
('msub-march-cmx064','march-2026-meeting','cmx064',80000, 1,'pending','2026-03-15 00:00:00+00'),
('msub-march-cmx065','march-2026-meeting','cmx065',200000,1,'pending','2026-03-15 00:00:00+00'),
('msub-march-cmx066','march-2026-meeting','cmx066',750000,1,'pending','2026-03-15 00:00:00+00'),
('msub-march-cmx067','march-2026-meeting','cmx067',50000, 1,'pending','2026-03-15 00:00:00+00'),
('msub-march-cmx068','march-2026-meeting','cmx068',120000,1,'pending','2026-03-15 00:00:00+00'),
('msub-march-cmx069','march-2026-meeting','cmx069',400000,1,'pending','2026-03-15 00:00:00+00'),
('msub-march-cmx070','march-2026-meeting','cmx070',100000,1,'pending','2026-03-15 00:00:00+00')
ON CONFLICT (id) DO NOTHING;

-- ─── WADAH ENTRIES ────────────────────────────────────────────────────────
-- div IDs: PRIA=cmov0hbmq0000vl1u00wwlaie, WANITA=cmp2r1aee0008t21ulqx64huh,
--   PELPRAP=cmp2r1f54000at21uzn9l3t7a, PELNAP=cmp2r1lt4000ct21uqrw4tafk,
--   PELAHT=cmp2rfos9000ft21urzh13f8h, PENGINJILAN=cmp2rfylk000ht21urktu548u,
--   DIAKONIA=cmp2rg2ue000jt21uw5jro1wa, DANA KESEJAH=cmp2rgaa3000lt21u1qmyrtif
INSERT INTO "WadahEntry" (id, "submissionId", "divisionId", amount) VALUES
-- cmx001: DN.KESEJAH=50000
(gen_random_uuid(),'msub-march-cmx001','cmp2rgaa3000lt21u1qmyrtif',50000),
-- cmx002: WANITA=10000 PELNAP=10000 PELAHT=5000 DIAKONIA=5000 DANKESEJAH=25000
(gen_random_uuid(),'msub-march-cmx002','cmp2r1aee0008t21ulqx64huh',10000),
(gen_random_uuid(),'msub-march-cmx002','cmp2r1lt4000ct21uqrw4tafk',10000),
(gen_random_uuid(),'msub-march-cmx002','cmp2rfos9000ft21urzh13f8h',5000),
(gen_random_uuid(),'msub-march-cmx002','cmp2rg2ue000jt21uw5jro1wa',5000),
(gen_random_uuid(),'msub-march-cmx002','cmp2rgaa3000lt21u1qmyrtif',25000),
-- cmx003: PENGINJILAN=5000 DIAKONIA=10000 DANKESEJAH=25000
(gen_random_uuid(),'msub-march-cmx003','cmp2rfylk000ht21urktu548u',5000),
(gen_random_uuid(),'msub-march-cmx003','cmp2rg2ue000jt21uw5jro1wa',10000),
(gen_random_uuid(),'msub-march-cmx003','cmp2rgaa3000lt21u1qmyrtif',25000),
-- cmx004: PRIA=5000 WANITA=5000 PELPRAP=5000 PELNAP=5000 DIAKONIA=20000 DANKESEJAH=25000
(gen_random_uuid(),'msub-march-cmx004','cmov0hbmq0000vl1u00wwlaie',5000),
(gen_random_uuid(),'msub-march-cmx004','cmp2r1aee0008t21ulqx64huh',5000),
(gen_random_uuid(),'msub-march-cmx004','cmp2r1f54000at21uzn9l3t7a',5000),
(gen_random_uuid(),'msub-march-cmx004','cmp2r1lt4000ct21uqrw4tafk',5000),
(gen_random_uuid(),'msub-march-cmx004','cmp2rg2ue000jt21uw5jro1wa',20000),
(gen_random_uuid(),'msub-march-cmx004','cmp2rgaa3000lt21u1qmyrtif',25000),
-- cmx005: DIAKONIA=5000 DANKESEJAH=25000
(gen_random_uuid(),'msub-march-cmx005','cmp2rg2ue000jt21uw5jro1wa',5000),
(gen_random_uuid(),'msub-march-cmx005','cmp2rgaa3000lt21u1qmyrtif',25000),
-- cmx006: DIAKONIA=25000 DANKESEJAH=50000
(gen_random_uuid(),'msub-march-cmx006','cmp2rg2ue000jt21uw5jro1wa',25000),
(gen_random_uuid(),'msub-march-cmx006','cmp2rgaa3000lt21u1qmyrtif',50000),
-- cmx007: PELPRAP=5000 PELAHT=5000 PENGINJILAN=5000 DIAKONIA=10000 DANKESEJAH=25000
(gen_random_uuid(),'msub-march-cmx007','cmp2r1f54000at21uzn9l3t7a',5000),
(gen_random_uuid(),'msub-march-cmx007','cmp2rfos9000ft21urzh13f8h',5000),
(gen_random_uuid(),'msub-march-cmx007','cmp2rfylk000ht21urktu548u',5000),
(gen_random_uuid(),'msub-march-cmx007','cmp2rg2ue000jt21uw5jro1wa',10000),
(gen_random_uuid(),'msub-march-cmx007','cmp2rgaa3000lt21u1qmyrtif',25000),
-- cmx009: PRIA=3000 WANITA=3000 PELPRAP=3000 PELNAP=5000 PELAHT=3000 PENGINJILAN=3000 DIAKONIA=10000 DANKESEJAH=25000
(gen_random_uuid(),'msub-march-cmx009','cmov0hbmq0000vl1u00wwlaie',3000),
(gen_random_uuid(),'msub-march-cmx009','cmp2r1aee0008t21ulqx64huh',3000),
(gen_random_uuid(),'msub-march-cmx009','cmp2r1f54000at21uzn9l3t7a',3000),
(gen_random_uuid(),'msub-march-cmx009','cmp2r1lt4000ct21uqrw4tafk',5000),
(gen_random_uuid(),'msub-march-cmx009','cmp2rfos9000ft21urzh13f8h',3000),
(gen_random_uuid(),'msub-march-cmx009','cmp2rfylk000ht21urktu548u',3000),
(gen_random_uuid(),'msub-march-cmx009','cmp2rg2ue000jt21uw5jro1wa',10000),
(gen_random_uuid(),'msub-march-cmx009','cmp2rgaa3000lt21u1qmyrtif',25000),
-- cmx011: PRIA=10000 WANITA=10000 PELPRAP=10000 PELNAP=10000 PELAHT=10000 PENGINJILAN=10000 DIAKONIA=15000 DANKESEJAH=25000
(gen_random_uuid(),'msub-march-cmx011','cmov0hbmq0000vl1u00wwlaie',10000),
(gen_random_uuid(),'msub-march-cmx011','cmp2r1aee0008t21ulqx64huh',10000),
(gen_random_uuid(),'msub-march-cmx011','cmp2r1f54000at21uzn9l3t7a',10000),
(gen_random_uuid(),'msub-march-cmx011','cmp2r1lt4000ct21uqrw4tafk',10000),
(gen_random_uuid(),'msub-march-cmx011','cmp2rfos9000ft21urzh13f8h',10000),
(gen_random_uuid(),'msub-march-cmx011','cmp2rfylk000ht21urktu548u',10000),
(gen_random_uuid(),'msub-march-cmx011','cmp2rg2ue000jt21uw5jro1wa',15000),
(gen_random_uuid(),'msub-march-cmx011','cmp2rgaa3000lt21u1qmyrtif',25000),
-- cmx012: PELAHT=15000 DIAKONIA=10000 DANKESEJAH=25000
(gen_random_uuid(),'msub-march-cmx012','cmp2rfos9000ft21urzh13f8h',15000),
(gen_random_uuid(),'msub-march-cmx012','cmp2rg2ue000jt21uw5jro1wa',10000),
(gen_random_uuid(),'msub-march-cmx012','cmp2rgaa3000lt21u1qmyrtif',25000),
-- cmx013: PRIA=2000 WANITA=2000 PELPRAP=2000 PELNAP=2000 PELAHT=2000 PENGINJILAN=2000 DIAKONIA=13000 DANKESEJAH=25000
(gen_random_uuid(),'msub-march-cmx013','cmov0hbmq0000vl1u00wwlaie',2000),
(gen_random_uuid(),'msub-march-cmx013','cmp2r1aee0008t21ulqx64huh',2000),
(gen_random_uuid(),'msub-march-cmx013','cmp2r1f54000at21uzn9l3t7a',2000),
(gen_random_uuid(),'msub-march-cmx013','cmp2r1lt4000ct21uqrw4tafk',2000),
(gen_random_uuid(),'msub-march-cmx013','cmp2rfos9000ft21urzh13f8h',2000),
(gen_random_uuid(),'msub-march-cmx013','cmp2rfylk000ht21urktu548u',2000),
(gen_random_uuid(),'msub-march-cmx013','cmp2rg2ue000jt21uw5jro1wa',13000),
(gen_random_uuid(),'msub-march-cmx013','cmp2rgaa3000lt21u1qmyrtif',25000),
-- cmx014: PRIA=5000 WANITA=5000 PELPRAP=10000 PELNAP=10000 PELAHT=5000 PENGINJILAN=5000 DIAKONIA=10000 DANKESEJAH=25000
(gen_random_uuid(),'msub-march-cmx014','cmov0hbmq0000vl1u00wwlaie',5000),
(gen_random_uuid(),'msub-march-cmx014','cmp2r1aee0008t21ulqx64huh',5000),
(gen_random_uuid(),'msub-march-cmx014','cmp2r1f54000at21uzn9l3t7a',10000),
(gen_random_uuid(),'msub-march-cmx014','cmp2r1lt4000ct21uqrw4tafk',10000),
(gen_random_uuid(),'msub-march-cmx014','cmp2rfos9000ft21urzh13f8h',5000),
(gen_random_uuid(),'msub-march-cmx014','cmp2rfylk000ht21urktu548u',5000),
(gen_random_uuid(),'msub-march-cmx014','cmp2rg2ue000jt21uw5jro1wa',10000),
(gen_random_uuid(),'msub-march-cmx014','cmp2rgaa3000lt21u1qmyrtif',25000),
-- cmx015: PRIA=5000 WANITA=5000 PELPRAP=5000 PELNAP=5000 PELAHT=5000 PENGINJILAN=5000 DIAKONIA=5000 DANKESEJAH=25000
(gen_random_uuid(),'msub-march-cmx015','cmov0hbmq0000vl1u00wwlaie',5000),
(gen_random_uuid(),'msub-march-cmx015','cmp2r1aee0008t21ulqx64huh',5000),
(gen_random_uuid(),'msub-march-cmx015','cmp2r1f54000at21uzn9l3t7a',5000),
(gen_random_uuid(),'msub-march-cmx015','cmp2r1lt4000ct21uqrw4tafk',5000),
(gen_random_uuid(),'msub-march-cmx015','cmp2rfos9000ft21urzh13f8h',5000),
(gen_random_uuid(),'msub-march-cmx015','cmp2rfylk000ht21urktu548u',5000),
(gen_random_uuid(),'msub-march-cmx015','cmp2rg2ue000jt21uw5jro1wa',5000),
(gen_random_uuid(),'msub-march-cmx015','cmp2rgaa3000lt21u1qmyrtif',25000),
-- cmx016: PELAHT=5000 PENGINJILAN=5000 DIAKONIA=5000 DANKESEJAH=25000
(gen_random_uuid(),'msub-march-cmx016','cmp2rfos9000ft21urzh13f8h',5000),
(gen_random_uuid(),'msub-march-cmx016','cmp2rfylk000ht21urktu548u',5000),
(gen_random_uuid(),'msub-march-cmx016','cmp2rg2ue000jt21uw5jro1wa',5000),
(gen_random_uuid(),'msub-march-cmx016','cmp2rgaa3000lt21u1qmyrtif',25000),
-- cmx017: PRIA=5000 WANITA=5000 PELPRAP=5000 PELNAP=5000 PELAHT=5000 PENGINJILAN=5000 DIAKONIA=5000 DANKESEJAH=25000
(gen_random_uuid(),'msub-march-cmx017','cmov0hbmq0000vl1u00wwlaie',5000),
(gen_random_uuid(),'msub-march-cmx017','cmp2r1aee0008t21ulqx64huh',5000),
(gen_random_uuid(),'msub-march-cmx017','cmp2r1f54000at21uzn9l3t7a',5000),
(gen_random_uuid(),'msub-march-cmx017','cmp2r1lt4000ct21uqrw4tafk',5000),
(gen_random_uuid(),'msub-march-cmx017','cmp2rfos9000ft21urzh13f8h',5000),
(gen_random_uuid(),'msub-march-cmx017','cmp2rfylk000ht21urktu548u',5000),
(gen_random_uuid(),'msub-march-cmx017','cmp2rg2ue000jt21uw5jro1wa',5000),
(gen_random_uuid(),'msub-march-cmx017','cmp2rgaa3000lt21u1qmyrtif',25000),
-- cmx018: no wadah
-- cmx019: DANKESEJAH=50000
(gen_random_uuid(),'msub-march-cmx019','cmp2rgaa3000lt21u1qmyrtif',50000),
-- cmx020: PRIA=2000 WANITA=2000 PELPRAP=2000 PELNAP=2000 PELAHT=2000 PENGINJILAN=2000 DIAKONIA=10000 DANKESEJAH=25000
(gen_random_uuid(),'msub-march-cmx020','cmov0hbmq0000vl1u00wwlaie',2000),
(gen_random_uuid(),'msub-march-cmx020','cmp2r1aee0008t21ulqx64huh',2000),
(gen_random_uuid(),'msub-march-cmx020','cmp2r1f54000at21uzn9l3t7a',2000),
(gen_random_uuid(),'msub-march-cmx020','cmp2r1lt4000ct21uqrw4tafk',2000),
(gen_random_uuid(),'msub-march-cmx020','cmp2rfos9000ft21urzh13f8h',2000),
(gen_random_uuid(),'msub-march-cmx020','cmp2rfylk000ht21urktu548u',2000),
(gen_random_uuid(),'msub-march-cmx020','cmp2rg2ue000jt21uw5jro1wa',10000),
(gen_random_uuid(),'msub-march-cmx020','cmp2rgaa3000lt21u1qmyrtif',25000),
-- cmx021: DANKESEJAH=25000
(gen_random_uuid(),'msub-march-cmx021','cmp2rgaa3000lt21u1qmyrtif',25000),
-- cmx022: DIAKONIA=10000 DANKESEJAH=25000
(gen_random_uuid(),'msub-march-cmx022','cmp2rg2ue000jt21uw5jro1wa',10000),
(gen_random_uuid(),'msub-march-cmx022','cmp2rgaa3000lt21u1qmyrtif',25000),
-- cmx023: no wadah
-- cmx024: DANKESEJAH=25000
(gen_random_uuid(),'msub-march-cmx024','cmp2rgaa3000lt21u1qmyrtif',25000),
-- cmx025: no wadah
-- cmx026: PRIA=2000 WANITA=2000 PELPRAP=2000 PELNAP=2000 PELAHT=2000 PENGINJILAN=5000 DIAKONIA=5000 DANKESEJAH=25000
(gen_random_uuid(),'msub-march-cmx026','cmov0hbmq0000vl1u00wwlaie',2000),
(gen_random_uuid(),'msub-march-cmx026','cmp2r1aee0008t21ulqx64huh',2000),
(gen_random_uuid(),'msub-march-cmx026','cmp2r1f54000at21uzn9l3t7a',2000),
(gen_random_uuid(),'msub-march-cmx026','cmp2r1lt4000ct21uqrw4tafk',2000),
(gen_random_uuid(),'msub-march-cmx026','cmp2rfos9000ft21urzh13f8h',2000),
(gen_random_uuid(),'msub-march-cmx026','cmp2rfylk000ht21urktu548u',5000),
(gen_random_uuid(),'msub-march-cmx026','cmp2rg2ue000jt21uw5jro1wa',5000),
(gen_random_uuid(),'msub-march-cmx026','cmp2rgaa3000lt21u1qmyrtif',25000),
-- cmx027: PRIA=2000 WANITA=2000 PELPRAP=2000 PELNAP=2000 PELAHT=2000 PENGINJILAN=5000 DIAKONIA=5000 DANKESEJAH=25000
(gen_random_uuid(),'msub-march-cmx027','cmov0hbmq0000vl1u00wwlaie',2000),
(gen_random_uuid(),'msub-march-cmx027','cmp2r1aee0008t21ulqx64huh',2000),
(gen_random_uuid(),'msub-march-cmx027','cmp2r1f54000at21uzn9l3t7a',2000),
(gen_random_uuid(),'msub-march-cmx027','cmp2r1lt4000ct21uqrw4tafk',2000),
(gen_random_uuid(),'msub-march-cmx027','cmp2rfos9000ft21urzh13f8h',2000),
(gen_random_uuid(),'msub-march-cmx027','cmp2rfylk000ht21urktu548u',5000),
(gen_random_uuid(),'msub-march-cmx027','cmp2rg2ue000jt21uw5jro1wa',5000),
(gen_random_uuid(),'msub-march-cmx027','cmp2rgaa3000lt21u1qmyrtif',25000),
-- cmx028: DIAKONIA=15000 DANKESEJAH=25000
(gen_random_uuid(),'msub-march-cmx028','cmp2rg2ue000jt21uw5jro1wa',15000),
(gen_random_uuid(),'msub-march-cmx028','cmp2rgaa3000lt21u1qmyrtif',25000),
-- cmx029: DIAKONIA=20000 DANKESEJAH=25000
(gen_random_uuid(),'msub-march-cmx029','cmp2rg2ue000jt21uw5jro1wa',20000),
(gen_random_uuid(),'msub-march-cmx029','cmp2rgaa3000lt21u1qmyrtif',25000),
-- cmx030: DIAKONIA=10000 DANKESEJAH=25000
(gen_random_uuid(),'msub-march-cmx030','cmp2rg2ue000jt21uw5jro1wa',10000),
(gen_random_uuid(),'msub-march-cmx030','cmp2rgaa3000lt21u1qmyrtif',25000),
-- cmx031: DIAKONIA=5000 DANKESEJAH=25000
(gen_random_uuid(),'msub-march-cmx031','cmp2rg2ue000jt21uw5jro1wa',5000),
(gen_random_uuid(),'msub-march-cmx031','cmp2rgaa3000lt21u1qmyrtif',25000),
-- cmx032: PRIA=10000 WANITA=10000 PELPRAP=10000 PELNAP=10000 PELAHT=10000 PENGINJILAN=10000 DIAKONIA=40000 DANKESEJAH=25000
(gen_random_uuid(),'msub-march-cmx032','cmov0hbmq0000vl1u00wwlaie',10000),
(gen_random_uuid(),'msub-march-cmx032','cmp2r1aee0008t21ulqx64huh',10000),
(gen_random_uuid(),'msub-march-cmx032','cmp2r1f54000at21uzn9l3t7a',10000),
(gen_random_uuid(),'msub-march-cmx032','cmp2r1lt4000ct21uqrw4tafk',10000),
(gen_random_uuid(),'msub-march-cmx032','cmp2rfos9000ft21urzh13f8h',10000),
(gen_random_uuid(),'msub-march-cmx032','cmp2rfylk000ht21urktu548u',10000),
(gen_random_uuid(),'msub-march-cmx032','cmp2rg2ue000jt21uw5jro1wa',40000),
(gen_random_uuid(),'msub-march-cmx032','cmp2rgaa3000lt21u1qmyrtif',25000),
-- cmx033: DIAKONIA=5000
(gen_random_uuid(),'msub-march-cmx033','cmp2rg2ue000jt21uw5jro1wa',5000),
-- cmx035: PRIA=5000 WANITA=5000 PELPRAP=5000 PELNAP=5000 PELAHT=5000 PENGINJILAN=5000 DIAKONIA=10000 DANKESEJAH=25000
(gen_random_uuid(),'msub-march-cmx035','cmov0hbmq0000vl1u00wwlaie',5000),
(gen_random_uuid(),'msub-march-cmx035','cmp2r1aee0008t21ulqx64huh',5000),
(gen_random_uuid(),'msub-march-cmx035','cmp2r1f54000at21uzn9l3t7a',5000),
(gen_random_uuid(),'msub-march-cmx035','cmp2r1lt4000ct21uqrw4tafk',5000),
(gen_random_uuid(),'msub-march-cmx035','cmp2rfos9000ft21urzh13f8h',5000),
(gen_random_uuid(),'msub-march-cmx035','cmp2rfylk000ht21urktu548u',5000),
(gen_random_uuid(),'msub-march-cmx035','cmp2rg2ue000jt21uw5jro1wa',10000),
(gen_random_uuid(),'msub-march-cmx035','cmp2rgaa3000lt21u1qmyrtif',25000),
-- cmx036: DIAKONIA=10000 DANKESEJAH=25000
(gen_random_uuid(),'msub-march-cmx036','cmp2rg2ue000jt21uw5jro1wa',10000),
(gen_random_uuid(),'msub-march-cmx036','cmp2rgaa3000lt21u1qmyrtif',25000),
-- cmx037: PRIA=5000 WANITA=5000 PELPRAP=5000 PELNAP=5000 PELAHT=5000 PENGINJILAN=5000 DIAKONIA=10000 DANKESEJAH=25000
(gen_random_uuid(),'msub-march-cmx037','cmov0hbmq0000vl1u00wwlaie',5000),
(gen_random_uuid(),'msub-march-cmx037','cmp2r1aee0008t21ulqx64huh',5000),
(gen_random_uuid(),'msub-march-cmx037','cmp2r1f54000at21uzn9l3t7a',5000),
(gen_random_uuid(),'msub-march-cmx037','cmp2r1lt4000ct21uqrw4tafk',5000),
(gen_random_uuid(),'msub-march-cmx037','cmp2rfos9000ft21urzh13f8h',5000),
(gen_random_uuid(),'msub-march-cmx037','cmp2rfylk000ht21urktu548u',5000),
(gen_random_uuid(),'msub-march-cmx037','cmp2rg2ue000jt21uw5jro1wa',10000),
(gen_random_uuid(),'msub-march-cmx037','cmp2rgaa3000lt21u1qmyrtif',25000),
-- cmx038: DIAKONIA=10000
(gen_random_uuid(),'msub-march-cmx038','cmp2rg2ue000jt21uw5jro1wa',10000),
-- cmx039: PENGINJILAN=5000 DIAKONIA=5000 DANKESEJAH=25000
(gen_random_uuid(),'msub-march-cmx039','cmp2rfylk000ht21urktu548u',5000),
(gen_random_uuid(),'msub-march-cmx039','cmp2rg2ue000jt21uw5jro1wa',5000),
(gen_random_uuid(),'msub-march-cmx039','cmp2rgaa3000lt21u1qmyrtif',25000),
-- cmx041: PRIA=5000 WANITA=5000 PELPRAP=5000 PELNAP=5000 PELAHT=5000 PENGINJILAN=5000 DIAKONIA=5000 DANKESEJAH=25000
(gen_random_uuid(),'msub-march-cmx041','cmov0hbmq0000vl1u00wwlaie',5000),
(gen_random_uuid(),'msub-march-cmx041','cmp2r1aee0008t21ulqx64huh',5000),
(gen_random_uuid(),'msub-march-cmx041','cmp2r1f54000at21uzn9l3t7a',5000),
(gen_random_uuid(),'msub-march-cmx041','cmp2r1lt4000ct21uqrw4tafk',5000),
(gen_random_uuid(),'msub-march-cmx041','cmp2rfos9000ft21urzh13f8h',5000),
(gen_random_uuid(),'msub-march-cmx041','cmp2rfylk000ht21urktu548u',5000),
(gen_random_uuid(),'msub-march-cmx041','cmp2rg2ue000jt21uw5jro1wa',5000),
(gen_random_uuid(),'msub-march-cmx041','cmp2rgaa3000lt21u1qmyrtif',25000),
-- cmx042: no wadah
-- cmx043: PRIA=2500 WANITA=2500 PELPRAP=2500 PELNAP=5000 PELAHT=2500 PENGINJILAN=5000 DIAKONIA=5000 DANKESEJAH=25000
(gen_random_uuid(),'msub-march-cmx043','cmov0hbmq0000vl1u00wwlaie',2500),
(gen_random_uuid(),'msub-march-cmx043','cmp2r1aee0008t21ulqx64huh',2500),
(gen_random_uuid(),'msub-march-cmx043','cmp2r1f54000at21uzn9l3t7a',2500),
(gen_random_uuid(),'msub-march-cmx043','cmp2r1lt4000ct21uqrw4tafk',5000),
(gen_random_uuid(),'msub-march-cmx043','cmp2rfos9000ft21urzh13f8h',2500),
(gen_random_uuid(),'msub-march-cmx043','cmp2rfylk000ht21urktu548u',5000),
(gen_random_uuid(),'msub-march-cmx043','cmp2rg2ue000jt21uw5jro1wa',5000),
(gen_random_uuid(),'msub-march-cmx043','cmp2rgaa3000lt21u1qmyrtif',25000),
-- cmx044: DIAKONIA=10000 DANKESEJAH=25000
(gen_random_uuid(),'msub-march-cmx044','cmp2rg2ue000jt21uw5jro1wa',10000),
(gen_random_uuid(),'msub-march-cmx044','cmp2rgaa3000lt21u1qmyrtif',25000),
-- cmx045: DIAKONIA=10000 DANKESEJAH=25000
(gen_random_uuid(),'msub-march-cmx045','cmp2rg2ue000jt21uw5jro1wa',10000),
(gen_random_uuid(),'msub-march-cmx045','cmp2rgaa3000lt21u1qmyrtif',25000),
-- cmx046: DANKESEJAH=25000
(gen_random_uuid(),'msub-march-cmx046','cmp2rgaa3000lt21u1qmyrtif',25000),
-- cmx047: PRIA=4000 WANITA=4000 PELPRAP=4000 PELNAP=4000 PELAHT=5000 PENGINJILAN=4000 DIAKONIA=10000 DANKESEJAH=25000
(gen_random_uuid(),'msub-march-cmx047','cmov0hbmq0000vl1u00wwlaie',4000),
(gen_random_uuid(),'msub-march-cmx047','cmp2r1aee0008t21ulqx64huh',4000),
(gen_random_uuid(),'msub-march-cmx047','cmp2r1f54000at21uzn9l3t7a',4000),
(gen_random_uuid(),'msub-march-cmx047','cmp2r1lt4000ct21uqrw4tafk',4000),
(gen_random_uuid(),'msub-march-cmx047','cmp2rfos9000ft21urzh13f8h',5000),
(gen_random_uuid(),'msub-march-cmx047','cmp2rfylk000ht21urktu548u',4000),
(gen_random_uuid(),'msub-march-cmx047','cmp2rg2ue000jt21uw5jro1wa',10000),
(gen_random_uuid(),'msub-march-cmx047','cmp2rgaa3000lt21u1qmyrtif',25000),
-- cmx048: PRIA=2000 WANITA=2000 PELPRAP=2000 PELNAP=2000 PELAHT=5000 PENGINJILAN=2000 DIAKONIA=5000 DANKESEJAH=25000
(gen_random_uuid(),'msub-march-cmx048','cmov0hbmq0000vl1u00wwlaie',2000),
(gen_random_uuid(),'msub-march-cmx048','cmp2r1aee0008t21ulqx64huh',2000),
(gen_random_uuid(),'msub-march-cmx048','cmp2r1f54000at21uzn9l3t7a',2000),
(gen_random_uuid(),'msub-march-cmx048','cmp2r1lt4000ct21uqrw4tafk',2000),
(gen_random_uuid(),'msub-march-cmx048','cmp2rfos9000ft21urzh13f8h',5000),
(gen_random_uuid(),'msub-march-cmx048','cmp2rfylk000ht21urktu548u',2000),
(gen_random_uuid(),'msub-march-cmx048','cmp2rg2ue000jt21uw5jro1wa',5000),
(gen_random_uuid(),'msub-march-cmx048','cmp2rgaa3000lt21u1qmyrtif',25000),
-- cmx049: PRIA=3000 WANITA=3000 PELPRAP=3000 PELNAP=3000 PELAHT=3000 PENGINJILAN=3000 DIAKONIA=7000 DANKESEJAH=25000
(gen_random_uuid(),'msub-march-cmx049','cmov0hbmq0000vl1u00wwlaie',3000),
(gen_random_uuid(),'msub-march-cmx049','cmp2r1aee0008t21ulqx64huh',3000),
(gen_random_uuid(),'msub-march-cmx049','cmp2r1f54000at21uzn9l3t7a',3000),
(gen_random_uuid(),'msub-march-cmx049','cmp2r1lt4000ct21uqrw4tafk',3000),
(gen_random_uuid(),'msub-march-cmx049','cmp2rfos9000ft21urzh13f8h',3000),
(gen_random_uuid(),'msub-march-cmx049','cmp2rfylk000ht21urktu548u',3000),
(gen_random_uuid(),'msub-march-cmx049','cmp2rg2ue000jt21uw5jro1wa',7000),
(gen_random_uuid(),'msub-march-cmx049','cmp2rgaa3000lt21u1qmyrtif',25000),
-- cmx050: DIAKONIA=10000 DANKESEJAH=25000
(gen_random_uuid(),'msub-march-cmx050','cmp2rg2ue000jt21uw5jro1wa',10000),
(gen_random_uuid(),'msub-march-cmx050','cmp2rgaa3000lt21u1qmyrtif',25000),
-- cmx051: DANKESEJAH=25000
(gen_random_uuid(),'msub-march-cmx051','cmp2rgaa3000lt21u1qmyrtif',25000),
-- cmx053: DIAKONIA=10000 DANKESEJAH=25000
(gen_random_uuid(),'msub-march-cmx053','cmp2rg2ue000jt21uw5jro1wa',10000),
(gen_random_uuid(),'msub-march-cmx053','cmp2rgaa3000lt21u1qmyrtif',25000),
-- cmx054: DIAKONIA=15000 DANKESEJAH=25000
(gen_random_uuid(),'msub-march-cmx054','cmp2rg2ue000jt21uw5jro1wa',15000),
(gen_random_uuid(),'msub-march-cmx054','cmp2rgaa3000lt21u1qmyrtif',25000),
-- cmx055: DIAKONIA=5000 DANKESEJAH=50000
(gen_random_uuid(),'msub-march-cmx055','cmp2rg2ue000jt21uw5jro1wa',5000),
(gen_random_uuid(),'msub-march-cmx055','cmp2rgaa3000lt21u1qmyrtif',50000),
-- cmx057: PRIA=5000 WANITA=5000 PELPRAP=5000 PELNAP=5000 PELAHT=5000 PENGINJILAN=5000 DIAKONIA=10000 DANKESEJAH=25000
(gen_random_uuid(),'msub-march-cmx057','cmov0hbmq0000vl1u00wwlaie',5000),
(gen_random_uuid(),'msub-march-cmx057','cmp2r1aee0008t21ulqx64huh',5000),
(gen_random_uuid(),'msub-march-cmx057','cmp2r1f54000at21uzn9l3t7a',5000),
(gen_random_uuid(),'msub-march-cmx057','cmp2r1lt4000ct21uqrw4tafk',5000),
(gen_random_uuid(),'msub-march-cmx057','cmp2rfos9000ft21urzh13f8h',5000),
(gen_random_uuid(),'msub-march-cmx057','cmp2rfylk000ht21urktu548u',5000),
(gen_random_uuid(),'msub-march-cmx057','cmp2rg2ue000jt21uw5jro1wa',10000),
(gen_random_uuid(),'msub-march-cmx057','cmp2rgaa3000lt21u1qmyrtif',25000),
-- cmx058: no wadah
-- cmx059: PRIA=2000 WANITA=2000 PELPRAP=2000 PELNAP=2000 PELAHT=2000 PENGINJILAN=2000 DIAKONIA=5000 DANKESEJAH=25000
(gen_random_uuid(),'msub-march-cmx059','cmov0hbmq0000vl1u00wwlaie',2000),
(gen_random_uuid(),'msub-march-cmx059','cmp2r1aee0008t21ulqx64huh',2000),
(gen_random_uuid(),'msub-march-cmx059','cmp2r1f54000at21uzn9l3t7a',2000),
(gen_random_uuid(),'msub-march-cmx059','cmp2r1lt4000ct21uqrw4tafk',2000),
(gen_random_uuid(),'msub-march-cmx059','cmp2rfos9000ft21urzh13f8h',2000),
(gen_random_uuid(),'msub-march-cmx059','cmp2rfylk000ht21urktu548u',2000),
(gen_random_uuid(),'msub-march-cmx059','cmp2rg2ue000jt21uw5jro1wa',5000),
(gen_random_uuid(),'msub-march-cmx059','cmp2rgaa3000lt21u1qmyrtif',25000),
-- cmx060: PRIA=5000 PELNAP=5000 DIAKONIA=5000 DANKESEJAH=25000
(gen_random_uuid(),'msub-march-cmx060','cmov0hbmq0000vl1u00wwlaie',5000),
(gen_random_uuid(),'msub-march-cmx060','cmp2r1lt4000ct21uqrw4tafk',5000),
(gen_random_uuid(),'msub-march-cmx060','cmp2rg2ue000jt21uw5jro1wa',5000),
(gen_random_uuid(),'msub-march-cmx060','cmp2rgaa3000lt21u1qmyrtif',25000),
-- cmx061: DIAKONIA=25000
(gen_random_uuid(),'msub-march-cmx061','cmp2rg2ue000jt21uw5jro1wa',25000),
-- cmx062: DANKESEJAH=25000
(gen_random_uuid(),'msub-march-cmx062','cmp2rgaa3000lt21u1qmyrtif',25000),
-- cmx064: DIAKONIA=5000 DANKESEJAH=25000
(gen_random_uuid(),'msub-march-cmx064','cmp2rg2ue000jt21uw5jro1wa',5000),
(gen_random_uuid(),'msub-march-cmx064','cmp2rgaa3000lt21u1qmyrtif',25000),
-- cmx065: DIAKONIA=25000 DANKESEJAH=25000
(gen_random_uuid(),'msub-march-cmx065','cmp2rg2ue000jt21uw5jro1wa',25000),
(gen_random_uuid(),'msub-march-cmx065','cmp2rgaa3000lt21u1qmyrtif',25000),
-- cmx066: PRIA=30000 WANITA=30000 PELPRAP=30000 PELNAP=25000 PELAHT=20000 PENGINJILAN=30000 DIAKONIA=10000 DANKESEJAH=25000
(gen_random_uuid(),'msub-march-cmx066','cmov0hbmq0000vl1u00wwlaie',30000),
(gen_random_uuid(),'msub-march-cmx066','cmp2r1aee0008t21ulqx64huh',30000),
(gen_random_uuid(),'msub-march-cmx066','cmp2r1f54000at21uzn9l3t7a',30000),
(gen_random_uuid(),'msub-march-cmx066','cmp2r1lt4000ct21uqrw4tafk',25000),
(gen_random_uuid(),'msub-march-cmx066','cmp2rfos9000ft21urzh13f8h',20000),
(gen_random_uuid(),'msub-march-cmx066','cmp2rfylk000ht21urktu548u',30000),
(gen_random_uuid(),'msub-march-cmx066','cmp2rg2ue000jt21uw5jro1wa',10000),
(gen_random_uuid(),'msub-march-cmx066','cmp2rgaa3000lt21u1qmyrtif',25000),
-- cmx067: DANKESEJAH=25000
(gen_random_uuid(),'msub-march-cmx067','cmp2rgaa3000lt21u1qmyrtif',25000),
-- cmx068: PRIA=5000 WANITA=5000 PELPRAP=5000 PELNAP=5000 PELAHT=5000 PENGINJILAN=5000 DIAKONIA=50000
(gen_random_uuid(),'msub-march-cmx068','cmov0hbmq0000vl1u00wwlaie',5000),
(gen_random_uuid(),'msub-march-cmx068','cmp2r1aee0008t21ulqx64huh',5000),
(gen_random_uuid(),'msub-march-cmx068','cmp2r1f54000at21uzn9l3t7a',5000),
(gen_random_uuid(),'msub-march-cmx068','cmp2r1lt4000ct21uqrw4tafk',5000),
(gen_random_uuid(),'msub-march-cmx068','cmp2rfos9000ft21urzh13f8h',5000),
(gen_random_uuid(),'msub-march-cmx068','cmp2rfylk000ht21urktu548u',5000),
(gen_random_uuid(),'msub-march-cmx068','cmp2rg2ue000jt21uw5jro1wa',50000),
-- cmx069: DIAKONIA=10000 DANKESEJAH=25000
(gen_random_uuid(),'msub-march-cmx069','cmp2rg2ue000jt21uw5jro1wa',10000),
(gen_random_uuid(),'msub-march-cmx069','cmp2rgaa3000lt21u1qmyrtif',25000),
-- cmx070: DIAKONIA=5000
(gen_random_uuid(),'msub-march-cmx070','cmp2rg2ue000jt21uw5jro1wa',5000);

COMMIT;

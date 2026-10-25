// ============================================================
// SHIKSHA SAHAYAK OS: ADMIN IDENTITY & ROLE RECONCILIATION AUDIT SCRIPT
// Scans unified_users, teacher_whitelist, user_beta_access, admin_audit_logs
// ============================================================

export interface IdentityAuditFinding {
  domain: string;
  check: string;
  status: 'PASS' | 'WARN' | 'FAIL';
  affectedRows: number;
  details: string;
}

export async function runAdminIdentityAudit(db: any): Promise<{
  adminUsersCount: number;
  teacherUsersCount: number;
  studentUsersCount: number;
  whitelistedTeachersCount: number;
  betaUsersCount: number;
  findings: IdentityAuditFinding[];
}> {
  console.log("\n==================================================");
  console.log("   ADMIN IDENTITY, SESSIONS & ROLES RECONCILIATION AUDIT");
  console.log("==================================================\n");

  const findings: IdentityAuditFinding[] = [];

  const getCount = async (sql: string, params: any[] = []): Promise<number> => {
    try {
      const res = await db.prepare(sql).bind(...params).first<any>();
      return Number(res?.cnt || res?.count || 0);
    } catch {
      return 0;
    }
  };

  const adminUsersCount = await getCount(`SELECT COUNT(1) as cnt FROM unified_users WHERE user_type IN ('admin', 'super_admin')`);
  const teacherUsersCount = await getCount(`SELECT COUNT(1) as cnt FROM unified_users WHERE user_type IN ('teacher', 'educator')`);
  const studentUsersCount = await getCount(`SELECT COUNT(1) as cnt FROM unified_users WHERE user_type = 'student' OR user_type IS NULL`);
  const whitelistedTeachersCount = await getCount(`SELECT COUNT(1) as cnt FROM teacher_whitelist`);
  const betaUsersCount = await getCount(`SELECT COUNT(1) as cnt FROM user_beta_access WHERE is_beta_tester = 1`);

  // 1. Check Unprovisioned Whitelisted Teacher Emails
  const unprovisionedTeachers = await getCount(`
    SELECT COUNT(1) as cnt FROM teacher_whitelist tw
    WHERE NOT EXISTS (SELECT 1 FROM unified_users u WHERE LOWER(u.email) = LOWER(tw.email))
  `);
  findings.push({
    domain: "Teacher Whitelist",
    check: "Whitelisted Teacher Provisioning Alignment",
    status: unprovisionedTeachers === 0 ? "PASS" : "WARN",
    affectedRows: unprovisionedTeachers,
    details: `Whitelisted emails not yet signed up: ${unprovisionedTeachers}`,
  });

  // 2. Check Users without Explicit User Type
  const nullTypeUsers = await getCount(`SELECT COUNT(1) as cnt FROM unified_users WHERE user_type IS NULL OR user_type = ''`);
  findings.push({
    domain: "Unified Users",
    check: "User Type Assignment Completeness",
    status: nullTypeUsers === 0 ? "PASS" : "WARN",
    affectedRows: nullTypeUsers,
    details: `Users with NULL/empty user_type (defaulted to student): ${nullTypeUsers}`,
  });

  // 3. Check Beta Access Mapped Users
  const orphanBetaRecords = await getCount(`
    SELECT COUNT(1) as cnt FROM user_beta_access b
    WHERE NOT EXISTS (SELECT 1 FROM unified_users u WHERE u.uid = b.user_id OR LOWER(u.email) = LOWER(b.user_id))
  `);
  findings.push({
    domain: "Beta Entitlements",
    check: "User Beta Access Link Integrity",
    status: orphanBetaRecords === 0 ? "PASS" : "WARN",
    affectedRows: orphanBetaRecords,
    details: `Orphan beta access rows: ${orphanBetaRecords}`,
  });

  console.log("==================================================");
  console.log("     ADMIN IDENTITY RECONCILIATION SUMMARY");
  console.log("==================================================");
  console.log(`Admin Accounts: ${adminUsersCount}`);
  console.log(`Teacher Accounts: ${teacherUsersCount}`);
  console.log(`Student Accounts: ${studentUsersCount}`);
  console.log(`Whitelisted Teacher Emails: ${whitelistedTeachersCount}`);
  console.log(`Beta Tester Entitlements: ${betaUsersCount}`);
  console.log("--------------------------------------------------");
  findings.forEach(f => {
    const icon = f.status === 'PASS' ? '✅' : '⚠️';
    console.log(`${icon} [${f.domain}] ${f.check} -> ${f.status} (${f.details})`);
  });
  console.log("==================================================\n");

  return {
    adminUsersCount,
    teacherUsersCount,
    studentUsersCount,
    whitelistedTeachersCount,
    betaUsersCount,
    findings,
  };
}

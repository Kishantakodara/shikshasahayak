-- Migration 0005: Drop redundant student_academic_profiles table in favor of canonical student_profiles
-- All student personalizations now exclusively derive from student_profiles populated via /onboarding.
DROP TABLE IF EXISTS student_academic_profiles;

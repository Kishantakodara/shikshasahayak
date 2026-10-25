# Remote D1 Schema Inventory & Migration State

**Total Applied Migrations**: 74
**Latest Applied Migration**: `069_add_enrollment_number_to_academic_profiles.sql` (Applied at: 2026-08-22 20:49:26)

## High-Risk Tables Schema Inventory

### Table: `unified_users`
| CID | Name | Type | NotNull | Default | PK |
|---|---|---|---|---|---|
| 0 | `id` | `TEXT` | 0 | `null` | 1 |
| 1 | `uid` | `TEXT` | 1 | `null` | 0 |
| 2 | `email` | `TEXT` | 1 | `null` | 0 |
| 3 | `display_name` | `TEXT` | 0 | `null` | 0 |
| 4 | `user_type` | `TEXT` | 1 | `'student'` | 0 |
| 5 | `status` | `TEXT` | 1 | `'active'` | 0 |
| 6 | `created_at` | `TEXT` | 1 | `CURRENT_TIMESTAMP` | 0 |
| 7 | `updated_at` | `TEXT` | 1 | `CURRENT_TIMESTAMP` | 0 |
| 8 | `ai_beta_enabled` | `INTEGER` | 1 | `0` | 0 |

### Table: `academic_profiles`
| CID | Name | Type | NotNull | Default | PK |
|---|---|---|---|---|---|
| 0 | `user_id` | `TEXT` | 0 | `null` | 1 |
| 1 | `university_id` | `TEXT` | 0 | `null` | 0 |
| 2 | `college_name` | `TEXT` | 0 | `null` | 0 |
| 3 | `degree_id` | `TEXT` | 0 | `null` | 0 |
| 4 | `branch_id` | `TEXT` | 0 | `null` | 0 |
| 5 | `semester_id` | `TEXT` | 0 | `null` | 0 |
| 6 | `enrollment_year` | `INTEGER` | 0 | `null` | 0 |
| 7 | `graduation_year` | `INTEGER` | 0 | `null` | 0 |
| 8 | `created_at` | `TEXT` | 1 | `CURRENT_TIMESTAMP` | 0 |
| 9 | `updated_at` | `TEXT` | 1 | `CURRENT_TIMESTAMP` | 0 |
| 10 | `enrollment_number` | `TEXT` | 0 | `null` | 0 |

### Table: `student_academic_profiles`
| CID | Name | Type | NotNull | Default | PK |
|---|---|---|---|---|---|
| 0 | `user_id` | `TEXT` | 0 | `null` | 1 |
| 1 | `university_id` | `TEXT` | 1 | `'gtu'` | 0 |
| 2 | `university_name` | `TEXT` | 1 | `'Gujarat Technological University'` | 0 |
| 3 | `degree_id` | `TEXT` | 1 | `'btech'` | 0 |
| 4 | `degree_name` | `TEXT` | 1 | `'Bachelor of Technology'` | 0 |
| 5 | `branch_id` | `TEXT` | 1 | `'computer-engineering'` | 0 |
| 6 | `branch_name` | `TEXT` | 1 | `'Computer Engineering'` | 0 |
| 7 | `semester` | `INTEGER` | 1 | `1` | 0 |
| 8 | `academic_year` | `TEXT` | 1 | `'2026-2027'` | 0 |
| 9 | `enrollment_year` | `INTEGER` | 0 | `2024` | 0 |
| 10 | `expected_graduation_year` | `INTEGER` | 0 | `2028` | 0 |
| 11 | `preferred_language` | `TEXT` | 1 | `'en'` | 0 |
| 12 | `goals_json` | `TEXT` | 0 | `null` | 0 |
| 13 | `is_profile_complete` | `INTEGER` | 1 | `0` | 0 |
| 14 | `created_at` | `TEXT` | 1 | `CURRENT_TIMESTAMP` | 0 |
| 15 | `updated_at` | `TEXT` | 1 | `CURRENT_TIMESTAMP` | 0 |
| 16 | `career_interests_json` | `TEXT` | 0 | `'["Software Engineering", "AI & Data Science"]'` | 0 |
| 17 | `target_companies_json` | `TEXT` | 0 | `'["TCS", "Infosys", "Google", "Amazon"]'` | 0 |
| 18 | `placement_readiness_score` | `INTEGER` | 0 | `65` | 0 |
| 19 | `resume_status` | `TEXT` | 0 | `'draft'` | 0 |

### Table: `teacher_whitelist`
| CID | Name | Type | NotNull | Default | PK |
|---|---|---|---|---|---|
| 0 | `id` | `TEXT` | 0 | `null` | 1 |
| 1 | `email` | `TEXT` | 1 | `null` | 0 |
| 2 | `name` | `TEXT` | 0 | `null` | 0 |
| 3 | `department` | `TEXT` | 0 | `null` | 0 |
| 4 | `college` | `TEXT` | 0 | `null` | 0 |
| 5 | `status` | `TEXT` | 1 | `'approved'` | 0 |
| 6 | `added_by` | `TEXT` | 0 | `null` | 0 |
| 7 | `created_at` | `TEXT` | 1 | `CURRENT_TIMESTAMP` | 0 |
| 8 | `updated_at` | `TEXT` | 1 | `CURRENT_TIMESTAMP` | 0 |

### Table: `teacher_profiles`
| CID | Name | Type | NotNull | Default | PK |
|---|---|---|---|---|---|
| 0 | `user_id` | `TEXT` | 0 | `null` | 1 |
| 1 | `full_name` | `TEXT` | 1 | `null` | 0 |
| 2 | `institution` | `TEXT` | 0 | `null` | 0 |
| 3 | `department` | `TEXT` | 0 | `null` | 0 |
| 4 | `designation` | `TEXT` | 0 | `null` | 0 |
| 5 | `subjects_json` | `TEXT` | 0 | `null` | 0 |
| 6 | `branches_json` | `TEXT` | 0 | `null` | 0 |
| 7 | `semesters_json` | `TEXT` | 0 | `null` | 0 |
| 8 | `is_onboarded` | `INTEGER` | 1 | `0` | 0 |
| 9 | `created_at` | `TEXT` | 1 | `CURRENT_TIMESTAMP` | 0 |
| 10 | `updated_at` | `TEXT` | 1 | `CURRENT_TIMESTAMP` | 0 |
| 11 | `phone` | `TEXT` | 0 | `null` | 0 |
| 12 | `qualification` | `TEXT` | 0 | `null` | 0 |
| 13 | `experience` | `TEXT` | 0 | `null` | 0 |
| 14 | `bio` | `TEXT` | 0 | `null` | 0 |

### Table: `user_beta_access`
| CID | Name | Type | NotNull | Default | PK |
|---|---|---|---|---|---|
| 0 | `user_id` | `TEXT` | 0 | `null` | 1 |
| 1 | `is_beta_tester` | `INTEGER` | 1 | `1` | 0 |
| 2 | `custom_flags_json` | `TEXT` | 0 | `null` | 0 |
| 3 | `created_at` | `TEXT` | 1 | `CURRENT_TIMESTAMP` | 0 |
| 4 | `granted_at` | `TEXT` | 0 | `CURRENT_TIMESTAMP` | 0 |
| 5 | `granted_by` | `TEXT` | 0 | `null` | 0 |
| 6 | `last_active_at` | `TEXT` | 0 | `null` | 0 |
| 7 | `notes` | `TEXT` | 0 | `null` | 0 |

### Table: `user_entitlements`
| CID | Name | Type | NotNull | Default | PK |
|---|---|---|---|---|---|
| 0 | `user_id` | `TEXT` | 0 | `null` | 1 |
| 1 | `plan_id` | `TEXT` | 1 | `null` | 0 |
| 2 | `status` | `TEXT` | 0 | `'active'` | 0 |
| 3 | `expires_at` | `TEXT` | 0 | `null` | 0 |
| 4 | `updated_at` | `TEXT` | 0 | `datetime('now')` | 0 |

### Table: `universities`
| CID | Name | Type | NotNull | Default | PK |
|---|---|---|---|---|---|
| 0 | `id` | `TEXT` | 0 | `null` | 1 |
| 1 | `name` | `TEXT` | 1 | `null` | 0 |
| 2 | `short_name` | `TEXT` | 0 | `null` | 0 |
| 3 | `slug` | `TEXT` | 1 | `null` | 0 |
| 4 | `created_at` | `TEXT` | 1 | `CURRENT_TIMESTAMP` | 0 |
| 5 | `updated_at` | `TEXT` | 1 | `CURRENT_TIMESTAMP` | 0 |
| 6 | `is_active` | `INTEGER` | 0 | `1` | 0 |
| 7 | `country` | `TEXT` | 0 | `'India'` | 0 |
| 8 | `state` | `TEXT` | 0 | `'Gujarat'` | 0 |
| 9 | `grading_system_json` | `TEXT` | 0 | `'{"scale": 10, "type": "SPI/CPI"}'` | 0 |
| 10 | `passing_criteria_json` | `TEXT` | 0 | `'{"min_subject_marks": 35, "min_aggregate": 40}'` | 0 |
| 11 | `academic_calendar_json` | `TEXT` | 0 | `'{"odd_sem_start": "July", "even_sem_start": "January"}'` | 0 |

### Table: `branches`
| CID | Name | Type | NotNull | Default | PK |
|---|---|---|---|---|---|
| 0 | `id` | `TEXT` | 0 | `null` | 1 |
| 1 | `university_id` | `TEXT` | 1 | `null` | 0 |
| 2 | `name` | `TEXT` | 1 | `null` | 0 |
| 3 | `slug` | `TEXT` | 1 | `null` | 0 |
| 4 | `short_name` | `TEXT` | 0 | `null` | 0 |
| 5 | `created_at` | `TEXT` | 1 | `CURRENT_TIMESTAMP` | 0 |
| 6 | `updated_at` | `TEXT` | 1 | `CURRENT_TIMESTAMP` | 0 |
| 7 | `Code` | `INT` | 0 | `null` | 0 |
| 8 | `is_active` | `INTEGER` | 0 | `1` | 0 |

### Table: `subjects`
| CID | Name | Type | NotNull | Default | PK |
|---|---|---|---|---|---|
| 0 | `id` | `TEXT` | 0 | `null` | 1 |
| 1 | `university_id` | `TEXT` | 1 | `null` | 0 |
| 2 | `branch_id` | `TEXT` | 1 | `null` | 0 |
| 3 | `semester` | `INTEGER` | 1 | `null` | 0 |
| 4 | `name` | `TEXT` | 1 | `null` | 0 |
| 5 | `code` | `TEXT` | 0 | `null` | 0 |
| 6 | `slug` | `TEXT` | 1 | `null` | 0 |
| 7 | `created_at` | `TEXT` | 1 | `CURRENT_TIMESTAMP` | 0 |
| 8 | `updated_at` | `TEXT` | 1 | `CURRENT_TIMESTAMP` | 0 |
| 9 | `subject_group_id` | `TEXT` | 0 | `null` | 0 |
| 10 | `wef_year` | `INTEGER` | 0 | `null` | 0 |
| 11 | `is_active` | `INTEGER` | 0 | `1` | 0 |
| 12 | `credits` | `INTEGER` | 0 | `4` | 0 |
| 13 | `syllabus_url` | `TEXT` | 0 | `null` | 0 |
| 14 | `syllabus_link` | `TEXT` | 0 | `null` | 0 |

### Table: `curriculum_nodes`
| CID | Name | Type | NotNull | Default | PK |
|---|---|---|---|---|---|
| 0 | `id` | `TEXT` | 0 | `null` | 1 |
| 1 | `subject_id` | `TEXT` | 1 | `null` | 0 |
| 2 | `parent_id` | `TEXT` | 0 | `null` | 0 |
| 3 | `node_type` | `TEXT` | 1 | `null` | 0 |
| 4 | `node_number` | `REAL` | 0 | `null` | 0 |
| 5 | `title` | `TEXT` | 1 | `null` | 0 |
| 6 | `description` | `TEXT` | 0 | `null` | 0 |
| 7 | `sort_order` | `INTEGER` | 0 | `0` | 0 |
| 8 | `is_active` | `INTEGER` | 1 | `1` | 0 |
| 9 | `created_at` | `TEXT` | 1 | `CURRENT_TIMESTAMP` | 0 |
| 10 | `updated_at` | `TEXT` | 1 | `CURRENT_TIMESTAMP` | 0 |

### Table: `documents`
| CID | Name | Type | NotNull | Default | PK |
|---|---|---|---|---|---|
| 0 | `id` | `TEXT` | 0 | `null` | 1 |
| 1 | `document_type` | `TEXT` | 1 | `null` | 0 |
| 2 | `university_id` | `TEXT` | 1 | `null` | 0 |
| 3 | `branch_id` | `TEXT` | 1 | `null` | 0 |
| 4 | `semester` | `INTEGER` | 1 | `null` | 0 |
| 5 | `subject_id` | `TEXT` | 1 | `null` | 0 |
| 6 | `title` | `TEXT` | 1 | `null` | 0 |
| 7 | `description` | `TEXT` | 0 | `null` | 0 |
| 8 | `approval_status` | `TEXT` | 1 | `'pending'` | 0 |
| 9 | `uploaded_by` | `TEXT` | 0 | `null` | 0 |
| 10 | `approved_by` | `TEXT` | 0 | `null` | 0 |
| 11 | `approved_at` | `TEXT` | 0 | `null` | 0 |
| 12 | `blog_id` | `TEXT` | 0 | `null` | 0 |
| 13 | `parent_document_id` | `TEXT` | 0 | `null` | 0 |
| 14 | `created_at` | `TEXT` | 1 | `CURRENT_TIMESTAMP` | 0 |
| 15 | `updated_at` | `TEXT` | 1 | `CURRENT_TIMESTAMP` | 0 |
| 16 | `paper_year` | `INTEGER` | 0 | `null` | 0 |
| 17 | `season` | `TEXT` | 0 | `null` | 0 |
| 18 | `exam_label` | `TEXT` | 0 | `null` | 0 |
| 19 | `syllabus_year` | `INTEGER` | 0 | `null` | 0 |
| 20 | `regulation` | `TEXT` | 0 | `null` | 0 |
| 21 | `version_label` | `TEXT` | 0 | `null` | 0 |
| 22 | `material_kind` | `TEXT` | 0 | `'notes'` | 0 |
| 23 | `unit_no` | `INTEGER` | 0 | `null` | 0 |
| 24 | `chapter` | `TEXT` | 0 | `null` | 0 |
| 25 | `topic` | `TEXT` | 0 | `null` | 0 |
| 26 | `author` | `TEXT` | 0 | `null` | 0 |
| 27 | `views` | `INTEGER` | 1 | `0` | 0 |
| 28 | `likes` | `INTEGER` | 1 | `0` | 0 |
| 29 | `downloads` | `INTEGER` | 1 | `0` | 0 |
| 30 | `curriculum_node_id` | `TEXT` | 0 | `null` | 0 |
| 31 | `status` | `TEXT` | 0 | `'published'` | 0 |
| 32 | `created_by` | `TEXT` | 0 | `null` | 0 |
| 33 | `updated_by` | `TEXT` | 0 | `null` | 0 |

### Table: `pyq_metadata`
| CID | Name | Type | NotNull | Default | PK |
|---|---|---|---|---|---|
| 0 | `document_id` | `TEXT` | 0 | `null` | 1 |
| 1 | `exam_year` | `INTEGER` | 0 | `null` | 0 |
| 2 | `season` | `TEXT` | 0 | `null` | 0 |
| 3 | `exam_label` | `TEXT` | 0 | `null` | 0 |

### Table: `syllabus_metadata`
| CID | Name | Type | NotNull | Default | PK |
|---|---|---|---|---|---|
| 0 | `document_id` | `TEXT` | 0 | `null` | 1 |
| 1 | `effective_year` | `INTEGER` | 0 | `null` | 0 |
| 2 | `regulation` | `TEXT` | 0 | `null` | 0 |
| 3 | `version_label` | `TEXT` | 0 | `null` | 0 |

### Table: `material_metadata`
| CID | Name | Type | NotNull | Default | PK |
|---|---|---|---|---|---|
| 0 | `document_id` | `TEXT` | 0 | `null` | 1 |
| 1 | `material_kind` | `TEXT` | 0 | `'notes'` | 0 |
| 2 | `author` | `TEXT` | 0 | `null` | 0 |
| 3 | `publisher` | `TEXT` | 0 | `null` | 0 |

### Table: `document_files`
| CID | Name | Type | NotNull | Default | PK |
|---|---|---|---|---|---|
| 0 | `id` | `TEXT` | 0 | `null` | 1 |
| 1 | `document_id` | `TEXT` | 1 | `null` | 0 |
| 2 | `file_type` | `TEXT` | 1 | `null` | 0 |
| 3 | `storage_key` | `TEXT` | 0 | `null` | 0 |
| 4 | `file_url` | `TEXT` | 1 | `null` | 0 |
| 5 | `mime_type` | `TEXT` | 0 | `null` | 0 |
| 6 | `size_bytes` | `INTEGER` | 0 | `null` | 0 |
| 7 | `is_primary` | `INTEGER` | 1 | `0` | 0 |
| 8 | `created_at` | `TEXT` | 1 | `CURRENT_TIMESTAMP` | 0 |
| 9 | `file_asset_id` | `TEXT` | 0 | `null` | 0 |
| 10 | `original_filename` | `TEXT` | 0 | `null` | 0 |

### Table: `assets`
| CID | Name | Type | NotNull | Default | PK |
|---|---|---|---|---|---|
| 0 | `id` | `TEXT` | 0 | `null` | 1 |
| 1 | `content_hash` | `TEXT` | 1 | `null` | 0 |
| 2 | `storage_key` | `TEXT` | 1 | `null` | 0 |
| 3 | `original_filename` | `TEXT` | 1 | `null` | 0 |
| 4 | `mime_type` | `TEXT` | 0 | `null` | 0 |
| 5 | `size_bytes` | `INTEGER` | 0 | `null` | 0 |
| 6 | `created_at` | `TEXT` | 1 | `CURRENT_TIMESTAMP` | 0 |

### Table: `document_relations`
| CID | Name | Type | NotNull | Default | PK |
|---|---|---|---|---|---|
| 0 | `id` | `TEXT` | 0 | `null` | 1 |
| 1 | `source_document_id` | `TEXT` | 1 | `null` | 0 |
| 2 | `target_document_id` | `TEXT` | 1 | `null` | 0 |
| 3 | `relation_type` | `TEXT` | 1 | `null` | 0 |
| 4 | `created_at` | `TEXT` | 1 | `CURRENT_TIMESTAMP` | 0 |

### Table: `document_stats`
| CID | Name | Type | NotNull | Default | PK |
|---|---|---|---|---|---|
| 0 | `document_id` | `TEXT` | 0 | `null` | 1 |
| 1 | `views` | `INTEGER` | 1 | `0` | 0 |
| 2 | `likes` | `INTEGER` | 1 | `0` | 0 |
| 3 | `downloads` | `INTEGER` | 1 | `0` | 0 |
| 4 | `updated_at` | `TEXT` | 1 | `CURRENT_TIMESTAMP` | 0 |

### Table: `content_factory_jobs`
| CID | Name | Type | NotNull | Default | PK |
|---|---|---|---|---|---|
| 0 | `id` | `TEXT` | 0 | `null` | 1 |
| 1 | `university_id` | `TEXT` | 1 | `null` | 0 |
| 2 | `branch_id` | `TEXT` | 1 | `null` | 0 |
| 3 | `semester` | `INTEGER` | 1 | `null` | 0 |
| 4 | `subject_id` | `TEXT` | 1 | `null` | 0 |
| 5 | `unit_no` | `INTEGER` | 1 | `null` | 0 |
| 6 | `topics` | `TEXT` | 1 | `null` | 0 |
| 7 | `content_types` | `TEXT` | 1 | `null` | 0 |
| 8 | `status` | `TEXT` | 1 | `'pending'` | 0 |
| 9 | `total_topics` | `INTEGER` | 1 | `0` | 0 |
| 10 | `completed_topics` | `INTEGER` | 1 | `0` | 0 |
| 11 | `error_message` | `TEXT` | 0 | `null` | 0 |
| 12 | `created_by` | `TEXT` | 0 | `null` | 0 |
| 13 | `created_at` | `TEXT` | 1 | `CURRENT_TIMESTAMP` | 0 |
| 14 | `updated_at` | `TEXT` | 1 | `CURRENT_TIMESTAMP` | 0 |

### Table: `content_factory_items`
| CID | Name | Type | NotNull | Default | PK |
|---|---|---|---|---|---|
| 0 | `id` | `TEXT` | 0 | `null` | 1 |
| 1 | `job_id` | `TEXT` | 0 | `null` | 0 |
| 2 | `university_id` | `TEXT` | 1 | `null` | 0 |
| 3 | `branch_id` | `TEXT` | 1 | `null` | 0 |
| 4 | `semester` | `INTEGER` | 1 | `null` | 0 |
| 5 | `subject_id` | `TEXT` | 1 | `null` | 0 |
| 6 | `unit_no` | `INTEGER` | 1 | `null` | 0 |
| 7 | `unit_title` | `TEXT` | 0 | `null` | 0 |
| 8 | `topic` | `TEXT` | 1 | `null` | 0 |
| 9 | `content_type` | `TEXT` | 1 | `null` | 0 |
| 10 | `difficulty` | `TEXT` | 0 | `'medium'` | 0 |
| 11 | `structured_content` | `TEXT` | 1 | `null` | 0 |
| 12 | `raw_markdown` | `TEXT` | 0 | `null` | 0 |
| 13 | `status` | `TEXT` | 1 | `'DRAFT'` | 0 |
| 14 | `validation_status` | `TEXT` | 0 | `'valid'` | 0 |
| 15 | `validation_notes` | `TEXT` | 0 | `null` | 0 |
| 16 | `published_document_id` | `TEXT` | 0 | `null` | 0 |
| 17 | `created_at` | `TEXT` | 1 | `CURRENT_TIMESTAMP` | 0 |
| 18 | `updated_at` | `TEXT` | 1 | `CURRENT_TIMESTAMP` | 0 |

### Table: `blogs`
| CID | Name | Type | NotNull | Default | PK |
|---|---|---|---|---|---|
| 0 | `id` | `TEXT` | 0 | `null` | 1 |
| 1 | `related_document_id` | `TEXT` | 0 | `null` | 0 |
| 2 | `title` | `TEXT` | 1 | `null` | 0 |
| 3 | `content` | `TEXT` | 1 | `null` | 0 |
| 4 | `author` | `TEXT` | 0 | `'Admin'` | 0 |
| 5 | `category` | `TEXT` | 0 | `'Study Guides'` | 0 |
| 6 | `tags` | `TEXT` | 0 | `null` | 0 |
| 7 | `thumbnail` | `TEXT` | 0 | `null` | 0 |
| 8 | `status` | `TEXT` | 0 | `'draft'` | 0 |
| 9 | `views` | `INTEGER` | 0 | `0` | 0 |
| 10 | `created_at` | `TEXT` | 1 | `CURRENT_TIMESTAMP` | 0 |
| 11 | `updated_at` | `TEXT` | 1 | `CURRENT_TIMESTAMP` | 0 |

### Table: `announcements`
| CID | Name | Type | NotNull | Default | PK |
|---|---|---|---|---|---|
| 0 | `id` | `TEXT` | 0 | `null` | 1 |
| 1 | `text` | `TEXT` | 1 | `null` | 0 |
| 2 | `link` | `TEXT` | 0 | `null` | 0 |
| 3 | `created_at` | `TEXT` | 1 | `CURRENT_TIMESTAMP` | 0 |

### Table: `admin_audit_logs`
| CID | Name | Type | NotNull | Default | PK |
|---|---|---|---|---|---|
| 0 | `id` | `TEXT` | 0 | `null` | 1 |
| 1 | `admin_id` | `TEXT` | 1 | `null` | 0 |
| 2 | `action` | `TEXT` | 1 | `null` | 0 |
| 3 | `resource_type` | `TEXT` | 1 | `null` | 0 |
| 4 | `resource_id` | `TEXT` | 0 | `null` | 0 |
| 5 | `details` | `TEXT` | 0 | `null` | 0 |
| 6 | `ip_address` | `TEXT` | 0 | `null` | 0 |
| 7 | `created_at` | `TEXT` | 1 | `CURRENT_TIMESTAMP` | 0 |
| 8 | `details_json` | `TEXT` | 0 | `null` | 0 |


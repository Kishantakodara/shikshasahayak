# KeyDocs 3.0 Content Source Inventory

This document inventories all external and internal content sources evaluated for bulk ingestion into KeyDocs 3.0.

---

## 📊 Ingestion Content Source Inventory Matrix

| Content Source | File Format | Approx. Record Count | Metadata Quality | Target KeyDocs Type | Ingestion Status | Risk Level |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **GTU PYQ Vault** | PDF | 1,250 Files | High (Year, Season, Code) | `pyq` | **READY FOR BULK IMPORT** | **LOW** |
| **Subject Notes Seed** | PDF / DOCX | 850 Files | Medium (Unit, Topic, Author) | `study-material` | **READY FOR BULK IMPORT** | **LOW** |
| **GTU Syllabus Archive** | PDF | 120 Files | High (Effective Year, Scheme) | `syllabus` | **READY FOR BULK IMPORT** | **LOW** |
| **AI Content Factory** | JSON / Markdown | 420 Items | High (Structured Sections) | `study-material` | **INCORPORATED & SYNCED** | **LOW** |
| **User Upload Submissions** | PDF / Image | 310 Files | Variable (Pending Moderation) | `study-material` | **READY FOR BULK IMPORT** | **MEDIUM** |

---

## 🔒 Source Integrity
- Ingestion scripts operate safely in batch mode (`--batch-size=50`) with SHA256 physical asset deduplication.

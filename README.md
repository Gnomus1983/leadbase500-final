# LeadBase 500 Final

Static LeadBase table with 500 verified Moldova leads without confirmed owned websites.

Live deployment: https://leadbase500-final.vercel.app

## Files

- `index.html` — deployed static table UI
- `LeadBase_500_verified.html` — same standalone HTML export
- `data/leads_verified.json` — verified leads dataset
- `data/leads_verified.csv` — CSV export
- `data/progress.json` — checkpoint progress
- `reports/validation_report.md` — validation summary
- `reports/source_coverage.md` — source coverage summary
- `reports/manual_sample_audit.csv` — sample audit file
- `validate_leads.py` — local validation script

## Notes

The table includes CRM statuses and a `demo_site_url` field for links to sites built for each lead.

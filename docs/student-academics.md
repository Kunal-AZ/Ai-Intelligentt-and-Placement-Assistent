# Student academic details

Students select a university from the bundled worldwide catalog and select degree
and subject categories. University IDs are checked on the server, which saves the
canonical name and country. Catalog membership does not verify accreditation,
attendance, or that a particular program is offered.

Marks are self-reported. There is no administrator approval, result-card upload,
academic edit lock, or additional document-storage configuration.

The form offers CGPA scales of 4, 5, 7 and 10, percentage, and marks obtained out of
a custom maximum. Both form and API reject negative scores, scores above their
maximum, zero/negative maximums, text, and more than two decimal places. Custom
maximums may be up to 1,000,000. Stored examples: `7/10`, `3.5/4`, `85%`, `450/500`.
Legacy bare numbers continue to mean CGPA out of 10.

Range validation cannot distinguish a truthful 7/10 from a falsely reported 9/10.
The interface therefore labels marks as self-reported and never as verified.
Confirming actual results would require access to an academic record.

## Catalog provenance

Source: https://github.com/Hipo/university-domains-list
File: `world_universities_and_domains.json`, downloaded 2026-11-21.
MIT license is bundled with the data and copied to the backend build output.
The snapshot contains 10,272 institutions in 201 country entries. It is community
maintained, not an exhaustive official registry. Searches run within the backend.
Missing institutions or programs require a catalog update. Review renamed or removed
entries and migrate stored IDs before replacing the snapshot: IDs derive from
country code, name and domains.

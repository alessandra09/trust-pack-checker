# Limitations

- Not legal advice. The tool reports what is and is not found in the text provided. It never says a document is compliant.
- The Art. 28 rules have not yet been reviewed by a lawyer or DPO.
- English only in v1.
- Text-based PDFs only; scanned PDFs are not read.
- Client mode compares only what the checks look for (periods, sub-processor names, EU/EEA claims, audit rights, AI training statements, five security claims). A sub-processor named without a company form (for example "Cobalt Hosting" with no "BV") is matched only if the DPA lists it; a new name without a company form is not detected. Negation is read per sentence, so an unusual wording can flip the polarity check.
- Not checked: the text of Standard Contractual Clauses or other documents incorporated by reference, sub-processors' own DPAs, and whether security controls actually exist in practice.

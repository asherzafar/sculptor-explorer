# Self-hosted project fonts

These WOFF2 files are the variable Google Fonts web subsets used by Sculpture
in Data. They are committed so local, CI, and agent builds are deterministic
and do not need access to Google Fonts.

| Family | Files | Upstream |
|---|---|---|
| Fraunces | Latin, Latin Extended, Vietnamese variable subsets; weights 100–900 | Copyright 2018 The Fraunces Project Authors, [undercasetype/Fraunces](https://github.com/undercasetype/Fraunces) |
| DM Sans | Latin and Latin Extended variable subsets; weights 100–1000 | Copyright 2014 The DM Sans Project Authors, [googlefonts/dm-fonts](https://github.com/googlefonts/dm-fonts) |

Both families are redistributed under the SIL Open Font License 1.1 in
`OFL-1.1.txt`. The files were emitted by Next.js from the existing Google Fonts
configuration on 2026-08-02, then renamed descriptively without modification.
Their SHA-256 values are:

```text
88e17be075f1be50ab67b057b99e3701b828f44ed28f9452df6c02645bb0cba9  fraunces-latin-variable.woff2
f1451edd6434085c4f9f3a8b4a674182dd7d6acccf53bfced19fd167f0705a06  fraunces-latin-ext-variable.woff2
250cc2966c658fb6d336731de9d82a8129025e9839c20c253bbc477852f6cf4f  fraunces-vietnamese-variable.woff2
468d56b6b25b05b70190b6c233d773f6f1770e8579827ce022a57f03fa8002fb  dm-sans-latin-variable.woff2
219b02c7d8884817d3d6ad4c8771f2c000ce4c5669a67ef4e2e5617ffa25c4cc  dm-sans-latin-ext-variable.woff2
```

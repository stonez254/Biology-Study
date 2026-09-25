# Biology-Study question-bank ingestion

## MedMCQA

Biology-Study can ingest the original MedMCQA JSON dataset into the Render PostgreSQL database without bundling the full dataset into the web application.

MedMCQA provides question text, four options, a correct option index, explanations, subjects and topics. The original repository documents the dataset and its download location:
https://github.com/medmcqa/medmcqa

### 1. Obtain the dataset

Download the MedMCQA dataset from the original project and extract it locally. The importer expects files such as:

- `train.json`
- `dev.json`
- `test.json`

Do not commit the full dataset into this repository.

### 2. Set database access

Set `DATABASE_URL` to the same Render PostgreSQL connection string used by the Biology-Study API.

### 3. Import

From the repository root:

```bash
npm install
npm run import:medmcqa -- ./medmcqa_data
```

The importer:

- imports only single-answer questions;
- filters to biology/medical subjects relevant to Biology-Study;
- converts MedMCQA's 1-4 answer index to our 0-3 index;
- preserves the original subject/topic;
- stores explanations;
- adds source metadata;
- upserts by the original MedMCQA question ID;
- skips malformed questions;
- never exposes the correct answer through the public question-bank response.

### 4. Configure subjects

The default subjects are:

`Anatomy, Biochemistry, Microbiology, Pathology, Pharmacology, Physiology, Medicine, Pediatrics, Preventive & Social Medicine (PSM)`

To customize the filter:

```bash
MEDMCQA_SUBJECTS="Anatomy,Physiology,Microbiology" npm run import:medmcqa -- ./medmcqa_data
```

### 5. API

Authenticated clients can inspect the imported bank with:

- `GET /api/question-bank/stats`
- `GET /api/question-bank/questions?source=medmcqa&limit=20`
- optional filters: `subject` and `topic`

The question endpoint intentionally omits `correct_index`. Existing server-side assessment validation remains separate.

## Licensing and attribution

The original MedMCQA repository is publicly available and identifies its repository as MIT licensed, but the dataset contains examination-derived material. Before public redistribution or commercial use of imported question text, review the dataset's current terms and the provenance of the individual questions. Biology-Study stores source metadata so the origin is not lost.

Citation:

Pal, Ankit; Umapathi, Logesh Kumar; Sankarasubbu, Malaikannan. "MedMCQA: A Large-scale Multi-Subject Multi-Choice Dataset for Medical domain Question Answering." CHIL 2022.

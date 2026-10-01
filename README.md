# searchiz-geo-report/v1

An open format for AI search visibility reports. Any tool that asks AI
assistants questions about a business can write it; any tool can read it.

Most visibility numbers hide their sample. This format keeps every answer,
says how it was collected, and computes the summary only from answers that
were actually read:

- `status` is `ok`, `failed` or `unsupported`. A failed or unsupported answer
  carries no mention, recommendation, position or citations. It never counts
  as the business being absent.
- `kind` is `discovery` (the question does not name the business) or
  `branded`. Only discovery answers are counted, because a question that names
  the business always names it.
- `method` is `web` (the assistant's public interface) or `api` (a model API,
  a different measurement).
- `summary.rate` is `mentions / sample_size` over valid discovery answers, and
  the validator recomputes it.

See [`schema.json`](schema.json) and [`examples/valid.json`](examples/valid.json).

## Validate

```sh
npx searchiz-geo-report validate report.json
```

```js
import { validate, summarize } from "searchiz-geo-report";
const { valid, errors } = validate(report);
```

The validator checks the shape and the rules a JSON Schema cannot express:
failed answers saying nothing, and a summary that matches the answers.
No dependencies, no network.

## Who uses it

[Searchiz](https://searchiz.com) exports every brand's report in this format
and imports reports written by other tools.

## Scope

A format and a validator, not a product. No support promise; issues about the
format itself are welcome.

Open source tells you what could be wrong. Searchiz tells you whether AI
actually recommends you, and fixes it.

## License

MIT

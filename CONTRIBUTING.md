# Contributing to AIA

Thanks for helping improve AI Attribution. AIA is meant to be a shared, honest framework, so outside perspectives matter.

## Ways to contribute

- **Suggest a change to the labels:** a name, a definition, a missing case, or a scenario the system handles badly. [Open a label suggestion](https://github.com/timothyfcook/aia/issues/new?template=label-suggestion.md).
- **Report a problem with the badges:** rendering bugs, accessibility issues, broken files. [Open a bug report](https://github.com/timothyfcook/aia/issues/new?template=bug-report.md).
- **Share where you use it:** a link to a post with an AIA label helps show how it works in practice. [Start a discussion issue](https://github.com/timothyfcook/aia/issues/new).

For anything bigger than a small fix, please open an issue before a pull request, so we can agree on the direction first.

## The one rule: released files never change

Badges are hotlinked from `https://timothyfcook.com/aia/v1/...` on other people's sites. Editing anything in `assets/v1/`, or anything in `spec.json` that changes those files, would silently change every page that uses them.

Accepted changes to names, definitions or the design are collected for the next version (`v2`), which gets its own folder and URLs. Fixes that leave the published files byte-for-byte identical, like docs or the generator's internals, can land any time.

## Working on the generator

Everything in `assets/` is generated from `spec.json` by `scripts/build.mjs`.

```bash
npm install
npm run build
```

The build is deterministic. After a change that shouldn't affect output, `git status` should show no changes under `assets/v1/`.

## Licensing of contributions

By contributing, you agree that your contributions to the spec, badges and docs are licensed under [CC BY 4.0](LICENSE-CC-BY-4.0.txt), and your contributions to the code are licensed under the [MIT License](LICENSE).

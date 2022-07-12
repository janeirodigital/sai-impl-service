# SAI Authorization Agent Service

## Development

### Github packages

* generate [github token](https://github.com/settings/tokens) ( only `packages:read` scope)
* Modify `~/.npmrc` ([per-user config file](https://docs.npmjs.com/cli/v7/configuring-npm/npmrc#per-user-config-file))
  and add line `//npm.pkg.github.com/:_authToken=` and the generated token.

### Bootstrapping

```
yarn install
npx lerna bootstrap
npx lerna run build
npx lerna run test
```

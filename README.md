# SAI Authorization Agent Service

## Packages

### SAI Authorization Agent Service

[service](https://github.com/janeirodigital/sai-impl-service/tree/main/packages/service)

The main package includes a [Solid Application Interoperability](https://solid.github.io/data-interoperability-panel/specification/) compliant implementation of
the Authorization Agent.

### SAI API Messages

[api-messages](https://github.com/janeirodigital/sai-impl-service/tree/main/packages/api-messages)

Classes and Interfaces used by the API Handler in the service and a front end using it (e.g. [SAI Authorization Agent Web](https://github.com/janeirodigital/sai-impl-web)).

### CSS Storage Fixture

[css-storage-fixture](https://github.com/janeirodigital/sai-impl-service/tree/main/packages/css-storage-fixture)

Files, which are served with [Community Solid Server](https://communitysolidserver.github.io/CommunitySolidServer/)
and can be used for manual testing. It includes a couple of accounts and storage instances with some data.

### Interfaces

[interfaces](https://github.com/janeirodigital/sai-impl-service/tree/main/packages/interfaces)

A minimal set of interfaces, which are used by [Components.js](https://componentsjs.readthedocs.io/en/latest/).

### Mocks

[mocks](https://github.com/janeirodigital/sai-impl-service/tree/main/packages/mocks)

Jest mocks, which can be injected with [Components.js](https://componentsjs.readthedocs.io/en/latest/) for testing.

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

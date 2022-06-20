# SAI Authorization Agent Service

## Development

Modify `.npmrc`
* add your [github token](https://github.com/settings/tokens) ( only `packages:read` scope)
* do not commit the change with your personal token!

```
yarn install
npx lerna bootstrap
npx lerna run build
npx lerna run test
```

# Authorization Agent (service)

[![CI](https://github.com/janeirodigital/sai-impl-service/actions/workflows/ci.yml/badge.svg)](https://github.com/janeirodigital/sai-impl-service/actions/workflows/ci.yml)
[![codecov](https://codecov.io/gh/janeirodigital/sai-impl-service/branch/main/graph/badge.svg?flag=service)](https://codecov.io/gh/janeirodigital/sai-impl-service/tree/main/packages/service)
[![Gitter chat](https://badges.gitter.im/gitterHQ/gitter.png)](https://gitter.im/solid/data-interoperability-panel)
[![MIT license](https://img.shields.io/github/license/janeirodigital/sai-impl-service)](https://github.com/janeirodigital/sai-impl-service/blob/main/LICENSE)

# Push Notifications

## Handler

* receives push api subscriptions `push-subscriptions`
  * stores in storage
* behind authn context

## Service

* sends notifications
  * uses stored subscriptions

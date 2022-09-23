# Authorization Agent (service)

[![CI](https://github.com/janeirodigital/sai-impl-service/actions/workflows/ci.yml/badge.svg)](https://github.com/janeirodigital/sai-impl-service/actions/workflows/ci.yml)
[![codecov](https://codecov.io/gh/janeirodigital/sai-impl-service/branch/main/graph/badge.svg?flag=service)](https://codecov.io/gh/janeirodigital/sai-impl-service/tree/main/packages/service)
[![Gitter chat](https://badges.gitter.im/gitterHQ/gitter.png)](https://gitter.im/solid/data-interoperability-panel)
[![MIT license](https://img.shields.io/github/license/janeirodigital/sai-impl-service)](https://github.com/janeirodigital/sai-impl-service/blob/main/LICENSE)

## Webhook Notifications Subscription

1. Alice grants access to Bob
  * creates Social Agent Registration for Bob
  * adds Access Grant with Data Grants to it
2. Alice's AA sends Access Receipt to Bob's Authorization Inbox
3. Based on a received receipt Bob's AA
  * check if Alice wasn't already denied
    * prompts Bob to either accept it or deny it
4. If Bob accepts, their AA
  * creates Social Agent Registration for Alice
  * discovers Alice's Social Agent Registration from Bob
  * adds discovered registration as reciprocal
  * subscribes to the notifications for the discovered registration
5. When Social Agent Registration created by Bob for Alice changes
  * Alices' notifications publisher sends a notification based on an existing subscription
  * Bob's subscriber (here AA) receives the notification and triggers updates as needed

import { HandlerArgumentError } from "@digita-ai/handlersjs-core";
import { HttpHandler, HttpHandlerResponse } from "@digita-ai/handlersjs-http";
import { Observable, of } from "rxjs";
import { HttpContextHandler, HttpSequenceContextHandler, OidcContext } from "../../src";

interface TestHttpSolidContext extends OidcContext {
  first: boolean;
  second: boolean;
  throw: boolean;
}

abstract class Boilerplate implements HttpContextHandler {
  executed = false
  previousContext: TestHttpSolidContext = {} as TestHttpSolidContext
  handle(context: TestHttpSolidContext): Observable<TestHttpSolidContext> {
    this.executed = true
    this.previousContext = context
    return this.spy(context)
  }
  abstract spy(context: TestHttpSolidContext): Observable<TestHttpSolidContext>;
}

class FirstMiddleware extends Boilerplate {
  spy(context: TestHttpSolidContext): Observable<TestHttpSolidContext> {
    return new Observable<TestHttpSolidContext>(subscribe => {
      setTimeout(() => subscribe.next({ ...context, first: true }), 100)
    })
  }
}

class SecondMiddleware extends Boilerplate {
  spy(context: TestHttpSolidContext): Observable<TestHttpSolidContext> {
    return of({ ...context, second: true })
  }
}

class ThrowMiddleware extends Boilerplate {
  spy(context: TestHttpSolidContext): Observable<TestHttpSolidContext> {
    return new Observable<TestHttpSolidContext>(subscribe => {
      throw { status: 500, headers: {} }
    })
  }
}

class TestHandler extends HttpHandler<TestHttpSolidContext> {
  executed = false
  previousContext: TestHttpSolidContext = {} as TestHttpSolidContext
  handle(context: TestHttpSolidContext): Observable<HttpHandlerResponse> {
    this.executed = true
    this.previousContext = context
    return of ( { status: 200, body: {}, headers: {} } as HttpHandlerResponse)
  }
}

describe('constructor', () => {
  test('error is thrown when no middleware provided', (done) => {
    try {
      // @ts-ignore
      new HttpSequenceContextHandler(undefined, undefined)
    } catch(error) {
      expect(error).toBeInstanceOf(HandlerArgumentError)
       // @ts-ignore
      expect(error.message).toMatch('Argument handlers should be set.')
      done()
    }
  })
})

describe('handle', () => {
  test('executes middlewares sequentially passing modified context', (done) => {
    const firstMiddleware = new FirstMiddleware()
    const secondMiddleware = new SecondMiddleware()
    const middlewares = [firstMiddleware, secondMiddleware]
    const httpHandler = new TestHandler();
    const httpSequenceHandler = new HttpSequenceContextHandler<TestHttpSolidContext>(middlewares)

    httpSequenceHandler.handle({} as TestHttpSolidContext).subscribe(response => {
      expect(firstMiddleware.executed).toBeTruthy()
      expect(secondMiddleware.executed).toBeTruthy()
      expect(httpHandler.executed).toBeTruthy()

      expect(secondMiddleware.previousContext).toEqual({first: true})
      expect(httpHandler.previousContext).toEqual({first: true, second: true})
      expect(response).toEqual({ status: 200, body: {}, headers: {} })
      done()
    })
  })

  test('when previous middleware throws second is not executed', (done) => {
    const firstMiddleware = new FirstMiddleware()
    const throwMiddleware = new ThrowMiddleware()
    const secondMiddleware = new SecondMiddleware()
    const middlewares = [firstMiddleware, throwMiddleware, secondMiddleware]
    const httpHandler = new TestHandler();
    const httpSequenceHandler = new HttpSequenceContextHandler<TestHttpSolidContext>(middlewares)

    httpSequenceHandler.handle({} as TestHttpSolidContext).subscribe(response => {
      expect(firstMiddleware.executed).toBeTruthy()
      expect(throwMiddleware.executed).toBeTruthy()
      expect(secondMiddleware.executed).toBeFalsy()
      expect(httpHandler.executed).toBeFalsy()

      expect(throwMiddleware.previousContext).toEqual({first: true})

      expect(response).toEqual({ status: 500, headers: {} })
      done()
    })
  })
})

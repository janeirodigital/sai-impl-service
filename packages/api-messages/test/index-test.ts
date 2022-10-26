import { AccessAuthorization, AddSocialAgentRequest, Application, ApplicationAuthorizationRequest, ApplicationAuthorizationResponse, ApplicationsRequest, ApplicationsResponse, Authorization, AuthorizationData, DataRegistriesRequest, DataRegistriesResponse, DataRegistry, Description, DescriptionsRequest, DescriptionsResponse, RequestMessageTypes, ResponseMessageTypes, SocialAgent, SocialAgentResponse, SocialAgentsRequest, SocialAgentsResponse } from '../src/index';

describe('ApplicationsResponse', () => {
  test('correct', () => {
    const message = {
      type: ResponseMessageTypes.APPLICATIONS_RESPONSE,
      payload: [{} as Application]
    }

    const response = new ApplicationsResponse(message);
    expect(response.type).toEqual(ResponseMessageTypes.APPLICATIONS_RESPONSE)
    expect(response.payload).toBe(message.payload)
  })

  test('incorrect', () => {
    const message = {
      type: ResponseMessageTypes.APPLICATION_AUTHORIZATION_REGISTERED,
      payload: [{} as Application]
    }
    // @ts-ignore
    expect(() => new ApplicationsResponse(message)).toThrow('Invalid message type')
  })
})

describe('SocialAgentsResponse', () => {
  test('correct', () => {
    const message = {
      type: ResponseMessageTypes.SOCIAL_AGENTS_RESPONSE,
      payload: [{} as SocialAgent]
    }

    const response = new SocialAgentsResponse(message);
    expect(response.type).toEqual(ResponseMessageTypes.SOCIAL_AGENTS_RESPONSE)
    expect(response.payload).toBe(message.payload)
  })

  test('incorrect', () => {
    const message = {
      type: ResponseMessageTypes.APPLICATIONS_RESPONSE,
      payload: [{} as SocialAgent]
    }
    // @ts-ignore
    expect(() => new SocialAgentsResponse(message)).toThrow('Invalid message type')
  })
})

describe('SocialAgentResponse', () => {
  test('correct', () => {
    const message = {
      type: ResponseMessageTypes.SOCIAL_AGENT_RESPONSE,
      payload: {} as SocialAgent
    }

    const response = new SocialAgentResponse(message);
    expect(response.type).toEqual(ResponseMessageTypes.SOCIAL_AGENT_RESPONSE)
    expect(response.payload).toBe(message.payload)
  })

  test('incorrect', () => {
    const message = {
      type: ResponseMessageTypes.APPLICATIONS_RESPONSE,
      payload: {} as SocialAgent
    }
    // @ts-ignore
    expect(() => new SocialAgentResponse(message)).toThrow('Invalid message type')
  })
})

describe('DescriptionsResponse', () => {
  test('correct', () => {
    const message = {
      type: ResponseMessageTypes.DESCRIPTIONS_RESPONSE,
      payload: {} as AuthorizationData
    }

    const response = new DescriptionsResponse(message);
    expect(response.type).toEqual(ResponseMessageTypes.DESCRIPTIONS_RESPONSE)
    expect(response.payload).toBe(message.payload)
  })

  test('incorrect', () => {
    const message = {
      type: ResponseMessageTypes.APPLICATIONS_RESPONSE,
      payload: {} as SocialAgent
    }
    // @ts-ignore
    expect(() => new DescriptionsResponse(message)).toThrow('Invalid message type')
  })
})

describe('ApplicationAuthorizationResponse', () => {
  test('correct', () => {
    const message = {
      type: ResponseMessageTypes.APPLICATION_AUTHORIZATION_REGISTERED,
      payload: {} as AccessAuthorization
    }

    const response = new ApplicationAuthorizationResponse(message);
    expect(response.type).toEqual(ResponseMessageTypes.APPLICATION_AUTHORIZATION_REGISTERED)
    expect(response.payload).toBe(message.payload)
  })

  test('incorrect', () => {
    const message = {
      type: ResponseMessageTypes.APPLICATIONS_RESPONSE,
      payload: {} as AccessAuthorization
    }
    // @ts-ignore
    expect(() => new ApplicationAuthorizationResponse(message)).toThrow('Invalid message type')
  })
})

describe('DataRegistriesResponse', () => {
  test('correct', () => {
    const message = {
      type: ResponseMessageTypes.DATA_REGISTRIES_RESPONSE,
      payload: [{} as DataRegistry]
    }

    const response = new DataRegistriesResponse(message);
    expect(response.type).toEqual(ResponseMessageTypes.DATA_REGISTRIES_RESPONSE)
    expect(response.payload).toBe(message.payload)
  })

  test('incorrect', () => {
    const message = {
      type: ResponseMessageTypes.APPLICATIONS_RESPONSE,
      payload: {} as AccessAuthorization
    }
    // @ts-ignore
    expect(() => new DataRegistriesResponse(message)).toThrow('Invalid message type')
  })
})

describe('Request has proper message type', () => {
  test('ApplicationsRequest', () => {
    const request = new ApplicationsRequest();
    const expected = {
      type: RequestMessageTypes.APPLICATIONS_REQUEST
    }
    expect(JSON.parse(request.stringify())).toEqual(expected)
  })

  test('SocialAgentsRequest', () => {
    const request = new SocialAgentsRequest();
    const expected = {
      type: RequestMessageTypes.SOCIAL_AGENTS_REQUEST
    }
    expect(JSON.parse(request.stringify())).toEqual(expected)
  })


  test('AddSocialAgentRequest', () => {
    const webId = "https://bob.example"
    const label = "bob"
    const note = "bob note"
    const request = new AddSocialAgentRequest(webId, label, note);
    const expected = {
      type: RequestMessageTypes.ADD_SOCIAL_AGENT_REQUEST,
      webId,
      label,
      note
    };
    expect(JSON.parse(request.stringify())).toEqual(expected)
  })


  test('DataRegistriesRequest', () => {
    const lang = 'en'

    const request = new DataRegistriesRequest(lang);
    const expected = {
      type: RequestMessageTypes.DATA_REGISTRIES_REQUEST,
      lang,
    }
    expect(JSON.parse(request.stringify())).toEqual(expected)
  });

  test('DescriptionsRequest', () => {
    const lang = 'en'
    const applicationId = 'http://app.example'
    const request = new DescriptionsRequest(applicationId, lang);
    const expected = {
      type: RequestMessageTypes.DESCRIPTIONS_REQUEST,
      applicationId,
      lang
    }
    expect(JSON.parse(request.stringify())).toEqual(expected)
  });

  test('ApplicationAuthorizationRequest', () => {
    const authorization = {
      grantee: 'https://app.example',
      accessNeedGroup: 'https://app.example/access-needs#group',
      dataAuthorizations: [{
        accessNeed: 'https://app.example/access-needs#project',
        scope: 'Inherited',
      }]
    }
    const request = new ApplicationAuthorizationRequest(authorization);
    const expected = {
      type: RequestMessageTypes.APPLICATION_AUTHORIZATION,
      authorization
    }
    expect(JSON.parse(request.stringify())).toEqual(expected)
  });
})

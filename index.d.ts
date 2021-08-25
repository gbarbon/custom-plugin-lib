/*
 * Copyright 2018 Mia srl
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
*/

import * as fastify from 'fastify'
import * as http from 'http'
import {FastifySchema} from 'fastify/types/schema'

export = customPlugin

declare function customPlugin(envSchema?: customPlugin.environmentSchema): customPlugin.CustomService

declare namespace customPlugin {
  type CustomService = (asyncInitFunction: AsyncInitFunction) => any

  function getDirectServiceProxy(serviceNameOrURL: string, options?: InitServiceOptions): Service
  function getServiceProxy(microserviceGatewayServiceName: string, options?: InitServiceOptions): Service
  interface environmentSchema {
    type: 'object',
    required?: string[],
    properties: object
  }

  type AsyncInitFunction = (service: DecoratedFastify) => Promise<void>

  type RawCustomPluginAdvancedConfig = Pick<fastify.RouteShorthandOptions,
    'schema' |
    'attachValidation' |
    'validatorCompiler' |
    'bodyLimit' |
    'logLevel' |
    'config' |
    'prefixTrailingSlash'
  >

  type RawCustomPluginMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'HEAD'

  interface DecoratedFastify extends fastify.FastifyInstance {
    config: NodeJS.Dict<string>,
    addRawCustomPlugin(method: RawCustomPluginMethod, path: string, handler: AsyncHandler | Handler, schema?: InputOutputSchemas, advancedConfigs?: RawCustomPluginAdvancedConfig): DecoratedFastify,
    addPreDecorator(path: string, handler: preDecoratorHandler): DecoratedFastify
    addPostDecorator(path: string, handler: postDecoratorHandler): DecoratedFastify
    getDirectServiceProxy: (serviceNameOrURL: string, options?: InitServiceOptions) => Service,
    getServiceProxy: (options?: InitServiceOptions) => Service,
  }

  interface DecoratedRequest extends fastify.FastifyRequest {
    getUserId: () => string | null,
    getUserProperties: () => object | null,
    getGroups: () => string[],
    getClientType: () => string | null,
    isFromBackOffice: () => boolean,
    getDirectServiceProxy: (serviceNameOrURL: string, options?: InitServiceOptions) => Service,
    getServiceProxy: (options?: InitServiceOptions) => Service,
    USERID_HEADER_KEY: string,
    USER_PROPERTIES_HEADER_KEY: string,
    GROUPS_HEADER_KEY: string,
    CLIENTTYPE_HEADER_KEY: string,
    BACKOFFICE_HEADER_KEY: string,
    MICROSERVICE_GATEWAY_SERVICE_NAME: string,
    ADDITIONAL_HEADERS_TO_PROXY: string[]
  }

  //
  // CUSTOM PLUGIN
  //
  type BasicHandler<T> = (this: DecoratedFastify, request: DecoratedRequest, reply: fastify.FastifyReply) => T
  type Handler = BasicHandler<void>
  type AsyncHandler = BasicHandler<Promise<any>>

  //
  // SERVICE
  //
  interface InitServiceOptions {
    port?: number,
    protocol?: 'http' | 'https',
    headers?: object,
    prefix?: string,
  }
  type Certificate = string | Buffer
  type ServiceFormats = 'JSON' | 'BUFFER' | 'STREAM'
  interface ServiceOptions extends InitServiceOptions{
    returnAs?: ServiceFormats
    allowedStatusCodes?: number[]
    isMiaHeaderInjected?: boolean
    cert?: Certificate
    key?: Certificate
    ca?: Certificate
  }
  interface BaseServiceResponse extends http.ServerResponse {
    headers: http.IncomingHttpHeaders
  }
  interface StreamedServiceResponse extends BaseServiceResponse {
  }
  interface JSONServiceResponse extends BaseServiceResponse {
    payload: any
  }
  interface BufferServiceResponse extends BaseServiceResponse {
    payload: Buffer
  }
  type ServiceResponse = StreamedServiceResponse | JSONServiceResponse | BufferServiceResponse
  type QueryString = string | NodeJS.Dict<string | ReadonlyArray<string>> | Iterable<[string, string]> | ReadonlyArray<[string, string]>

  interface Service {
    get: (path: string, queryString?: QueryString, options?: ServiceOptions) => Promise<ServiceResponse>,
    post: (path: string, body: any | Buffer | ReadableStream, queryString?: QueryString, options?: ServiceOptions) => Promise<ServiceResponse>,
    put: (path: string, body: any | Buffer | ReadableStream, queryString?: QueryString, options?: ServiceOptions) => Promise<ServiceResponse>,
    patch: (path: string, body: any | Buffer | ReadableStream, queryString?: QueryString, options?: ServiceOptions) => Promise<ServiceResponse>,
    delete: (path: string, body: any | Buffer | ReadableStream, queryString?: QueryString, options?: ServiceOptions) => Promise<ServiceResponse>,
  }

  //
  // PRE DECORATOR
  //
  interface LeaveRequestUnchangedAction { }
  interface ChangeRequestAction {
    setBody: (newBody: any) => ChangeRequestAction,
    setQuery: (newQuery: QueryString) => ChangeRequestAction,
    setHeaders: (newHeaders: http.IncomingHttpHeaders) => ChangeRequestAction
  }
  interface AbortRequestAction { }
  type PreDecoratorAction = LeaveRequestUnchangedAction | ChangeRequestAction | AbortRequestAction;
  type preDecoratorHandler = (this: DecoratedFastify, request: PreDecoratorDecoratedRequest, reply: fastify.FastifyReply) => Promise<PreDecoratorAction>;

  interface OriginalRequest {
    method: string,
    path: string,
    query: QueryString,
    headers: http.IncomingHttpHeaders,
    body?: any
  }

  interface OriginalResponse {
    statusCode: number,
    headers: http.OutgoingHttpHeaders,
    body?: any
  }

  interface PreDecoratorDecoratedRequest extends DecoratedRequest {
    getOriginalRequest: () => OriginalRequest,
    getOriginalRequestMethod: () => string,
    getOriginalRequestPath: () => string,
    getOriginalRequestHeaders: () => http.IncomingHttpHeaders,
    getOriginalRequestQuery: () => QueryString
    getOriginalRequestBody: () => any,

    getMiaHeaders: () => NodeJS.Dict<string>,

    changeOriginalRequest: () => ChangeRequestAction,
    leaveOriginalRequestUnmodified: () => LeaveRequestUnchangedAction,
    abortChain: (statusCode: number, finalBody: any, headers?: http.IncomingHttpHeaders) => AbortRequestAction
  }

  //
  // POST DECORATOR
  //
  interface LeaveResponseUnchangedAction { }
  interface ChangeResponseAction {
    setBody: (newBody: any) => ChangeResponseAction,
    setStatusCode: (newStatusCode: number) => ChangeResponseAction,
    setHeaders: (newHeaders: http.IncomingHttpHeaders) => ChangeResponseAction
  }
  interface AbortResponseAction { }
  type PostDecoratorAction = LeaveResponseUnchangedAction | ChangeResponseAction | AbortResponseAction;
  type postDecoratorHandler = (this: DecoratedFastify, request: PostDecoratorDecoratedRequest, reply: fastify.FastifyReply) => Promise<PostDecoratorAction>;

  interface PostDecoratorDecoratedRequest extends DecoratedRequest {
    getOriginalRequest: () => OriginalRequest,
    getOriginalRequestMethod: () => string,
    getOriginalRequestPath: () => string,
    getOriginalRequestHeaders: () => http.IncomingHttpHeaders,
    getOriginalRequestQuery: () => QueryString
    getOriginalRequestBody: () => any,

    getOriginalResponse: () => OriginalResponse,
    getOriginalResponseHeaders: () => http.OutgoingHttpHeaders,
    getOriginalResponseBody: () => any,
    getOriginalResponseStatusCode: () => number,

    getMiaHeaders: () => NodeJS.Dict<string>,

    changeOriginalRequest: () => ChangeResponseAction,
    leaveOriginalResponseUnmodified: () => LeaveResponseUnchangedAction,
    abortChain: (statusCode: number, finalBody: any, headers?: object) => AbortResponseAction
  }

  // Utilities
  interface InputOutputSchemas extends FastifySchema{
    tags?: string[]
  }
}

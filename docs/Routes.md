# Declare routes

You can define the behaviour of the Custom Microservice in response to an HTTP request by declaring the routes. For this purpose, you can use the `addRawCustomPlugin` method:

```js
service.addRawCustomPlugin(httpVerb, path, handler, schema)
```

whose arguments are, in order

* `httpVerb` - the HTTP verb of the request (e.g.,` GET`).
* `path` - the route path (e.g.,` /status /alive`).
* `handler` - function that contains the actual behavior. It must respect the same interface defined in the
documentation of the handlers of [fastify](https://www.fastify.io/docs/latest/Routes/#async-await).
* `schema` - definition of the request and response data schema.
The format is the one accepted by [fastify](https://www.fastify.io/docs/latest/Validation-and-Serialization). To further detail see [`related section`](ApiDoc.md).

To get more info about how to declare a route can you look at the related [Fastify documentation](https://github.com/fastify/fastify/blob/master/docs/Routes.md).

## Example

```js
const customService = require('@mia-platform/custom-plugin-lib')()

module.exports = customService(async function handler(service) {
  service.addRawCustomPlugin('GET', '/hello', function helloHandler(request, reply) {
    const user = request.getUserId() || 'World'

    reply.send({
      hello: `${user}!`,
    })
  })
}) 
```

> **_More examples?_** Go [here](../examples/advanced/index.js#L86) to see another `addRawCustomPlugin` uses case.

* The first parameter of the handler function is [Request](https://www.fastify.io/docs/latest/Request/). The request is automatically decorated, indeed we can call `request.getUserId()`.

    The instance of `Request` is decorated with functions:

  * `getUserId()` - exposes the user's id, if logged in or `null`.
  * `getGroups()` - exposes an array containing strings that identify the groups to which the logged-in user belongs.
  * `getClientType()` - exposes the type of client that performed the HTTP request.
  * `isFromBackOffice()` - exposes a boolean to discriminate whether the HTTP request from the CMS.
  * `getMiaHeaders()` - exposes an object with all previous information.
     The set of this data is called `Mia headers` and getting the values from the following environment variables:
    * *USERID_HEADER_KEY*
    * *GROUPS_HEADER_KEY*
    * *CLIENTTYPE_HEADER_KEY*
    * *BACKOFFICE_HEADER_KEY*

* The second parameter is a [Reply instance](https://www.fastify.io/docs/latest/Reply/). Use this object to reply to the request. Its main methods are the following:
  * `headers(object)` - sets the headers of the response.
  * `code(statusCode)` - sets the HTTP status code of the response.
  * `send(data)` - sends the payload `data` to the end user.

* Inside the handler scope it's possible to access Fastify instance using `this`.

## Adding a shared schema

It is possible to add shared schema between routes. For this purpose, you can access to the `ajv` instance used to perform route validation. It is possible to add a schema to the `ajv` instance using the `addValidatorSchema` method. `addValidatorSchema` method also adds schema to fastify using *fastify.addSchema* function. It is also possible to get the added schema using the `getValidatorSchema` method.

```js
const customService = require('@mia-platform/custom-plugin-lib')()

module.exports = customService(async function handler(service) {
  service.addValidatorSchema({
    $id: 'example',
    type: 'object',
    properties: {
      foobar: {
        type: 'string',
      }
    }
  })

  const exampleSchema = service.getValidatorSchema('example')
  console.log('Log the example schema', exampleSchema)

  service.addRawCustomPlugin('GET', '/hello', function helloHandler(request, reply) {
    const user = request.getUserId() || 'World'

    reply.send({
      hello: `${user}!`,
    })
  }, {
    body: {
      ref: 'example#'
    }
  })
}) 
```

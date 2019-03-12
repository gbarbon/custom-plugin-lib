# Custom Plugin Node Library

[![Build Status][travis-svg]][travis-link]
[![Coverage Status][coverall-svg]][coverall-link]
[![Greenkeeper badge][greenkeeper-svg]][greenkeeper-link]

## Summary
This library helps you to implement the new platform custom plugins.
The most basic (and powerful) plugin is the rawCustomPlugin.

### `rawCustomPlugin`
Defining a custom plugin that uses the platform’s services is as simple as
in this [helloWorld](examples/basic/helloWorld.js) example.
This library exports a function that optionally takes a schema of the required environment variables
(you can find the reference [here][fastify-env]).
This function returns a `customService` function, that expects an async function to initialize and configure
the service (provided as the only argument). This service is a [fastify][fastify] instance,
that also contains the method `addRawCustomPlugin`, that allows you to add a route.
Multiple routes can be added in this way.  
For each route you have to specify an async handler. You should always return something (strings, objects, streams),
unless you set the response status code to 204. Please read [here][fastify-async] for further information
about async handlers.  
You must also specify the http method, and the path of the hander. Optionally you can indicate the JSONSchemas
to validate the querystring, the parameters, the payload, the response.  
In addition to validation, you will also have a swagger documentation available at the `/documentation/` path.

Thanks to TypeScript's type definitions, editors can actually provide autocompletion for the additional methods
of the request object such as `getUserId` or `getGroups`.

In the async initialization function you can also access the `fastify` instance, so you can register any plugin,
see [here][fastify-ecosystem] for a list of currently available plugins.  
In addition, you can register additional [`content-type` parsers][fastify-pasrers].

### Examples
Please see also a more [advanced example](examples/advanced/greetByGroup.js)
to see how to require more environment variables, and to specify schema definitions for
validation and swagger documentation.

To run this example, load the required variables with:
```
set -a && source examples/default.env
```

Then launch the service with:
```
./node_modules/.bin/fastify start examples/advanced/greetByGroup.js
```

Now you can consult the swagger documentation of the service at the
[http://localhost:3000/documentation/](http://localhost:3000/documentation/) address.

### Configuration
To use the library, you should specify the environment variables listed [here](index.js#L22),
other variables can be specified by setting your envSchema when calling the plugin.

## Local Development
To develop the service locally you need:
- Node 8+

To setup node, please if possible try to use [nvm][nvm], so you can manage multiple
versions easily. Once you have installed nvm, you can go inside the directory of the project and simply run
`nvm install`, the `.nvmrc` file will install and select the correct version if you don’t already have it.

Once you have all the dependency in place, you can launch:
```shell
npm i
npm run coverage
```

This two commands, will install the dependencies and run the tests with the coverage report that you can view as an HTML
page in `coverage/lcov-report/index.html`.

[travis-svg]: https://travis-ci.org/mia-platform/custom-plugin-lib.svg?branch=master
[travis-link]: https://travis-ci.org/mia-platform/custom-plugin-lib
[coverall-svg]: https://coveralls.io/repos/github/mia-platform/custom-plugin-lib/badge.svg?branch=master
[coverall-link]: https://coveralls.io/github/mia-platform/custom-plugin-lib?branch=master
[greenkeeper-svg]: https://badges.greenkeeper.io/mia-platform/custom-plugin-lib.svg
[greenkeeper-link]: https://greenkeeper.io/

[nvm]: https://github.com/creationix/nvm

[fastify]: https://www.fastify.io/
[fastify-env]: https://github.com/fastify/fastify-env
[fastify-async]: https://www.fastify.io/docs/latest/Routes/#async-await
[fastify-ecosystem]: https://www.fastify.io/ecosystem/
[fastify-parsers]: https://www.fastify.io/docs/latest/ContentTypeParser/
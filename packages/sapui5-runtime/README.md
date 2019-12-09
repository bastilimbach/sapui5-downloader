# SAPUI5 Runtime
A package which downloads the official SAPUI5 runtime from [https://tools.hana.ondemand.com/](https://tools.hana.ondemand.com/#sapui5) for local development.

## Installation
By using this npm package you agree to the EULA from SAP: [https://tools.hana.ondemand.com/developer-license-3_1.txt/](https://tools.hana.ondemand.com/developer-license-3_1.txt/)
```bash
npm install -D sapui5-runtime
```
or
```bash
yarn add -D sapui5-runtime
```
This will download and unzip the latest SAPUI5 runtime.

### Proxy support
It is possible to use this package behind a proxy by setting the environment variables `HTTP_PROXY` and `HTTPS_PROXY`.

###### Linux / macOS
```bash
export HTTP_PROXY http://hostname:port
export HTTPS_PROXY https://hostname:port
```

###### Windows
```bash
set HTTP_PROXY=http://hostname:port
set HTTPS_PROXY=https://hostname:port
```

> It is also possible to use proxy servers which require authentication: https://username:password@hostname:port

### Installing a specific version
In case you need a specific version of SAPUI5 you can specify it in your `package.json`.
Add the following line to your `package.json`:
```json
"sapui5-runtime": {
  "version": "X.Y.Z"
}
```
You need to replace `X.Y.Z` with a valid version from [https://tools.hana.ondemand.com/](https://tools.hana.ondemand.com/#sapui5).

**If you already added sapui5-runtime to your dependencies** you need to run `npm rebuild` after setting a specified version. If you added this setting to your `package.json` **before** installing the package, you can just install sapui5-runtime as usual.

## Get started
After a successful installation you can use a server to serve the runtime as static files.


### [Express](https://github.com/expressjs/express) example
```javascript
const express = require('express')
const sapui5 = require('sapui5-runtime')
const app = express()

app.use('/resources', express.static(sapui5))

app.listen(3000)
```

### [Hapi](https://github.com/hapijs/hapi) example
```javascript
const Hapi = require('hapi')
const inert = require('inert')
const sapui5 = require('sapui5-runtime')

const server = Hapi.server({
    port: 3000,
    host: 'localhost'
})

const init = async () => {
    await server.register(inert)
    server.route({
        method: 'GET',
        path: '/resources/{param*}',
        handler: {
            directory: {
                path: sapui5
            }
        }
    });
    await server.start()
}

init()
```

### [UI5 Tooling](https://github.com/SAP/ui5-tooling/) example
Add the custom UI5 middleware to serve static resources:
```bash
npm install -D ui5-middleware-servestatic
```
or
```bash
yarn add -D ui5-middleware-servestatic
```

Add the UI5 dependency declaration to `package.json`:
```json
"ui5": {
  "dependencies": [
    "ui5-middleware-servestatic"
  ]
}
```

Add the custom middleware configuration to `ui5.yaml`
```yaml
server:
  customMiddleware:
  - name: ui5-middleware-servestatic
    afterMiddleware: compression
    mountPath: /resources
    configuration:
      rootPath: "./node_modules/sapui5-runtime/lib/resources"
```

### [Grunt OpenUI5](https://github.com/SAP/grunt-openui5) example
```javascript
const sapui5 = require('sapui5-runtime')

module.exports = function (grunt) {
  grunt.initConfig({
    connect: {
      options: {
        port: 3000,
        hostname: '*'
      },
      src: {},
      dist: {}
    },
    openui5_connect: {
      options: {
        resources: [sapui5],
        cors: {
          origin: '*'
        }
      },
      src: {
        options: {
          appresources: 'webapp'
        }
      },
      dist: {
        options: {
          appresources: 'dist'
        }
      }
    },
    openui5_preload: {
      component: {
        options: {
          resources: {
            cwd: 'webapp',
            prefix: 'sap/ui/demo/todo',
            src: [
              '**/*.js',
              '**/*.fragment.html',
              '**/*.fragment.json',
              '**/*.fragment.xml',
              '**/*.view.html',
              '**/*.view.json',
              '**/*.view.xml',
              '**/*.properties',
              'manifest.json',
              '!test/**'
            ]
          },
          dest: 'dist'
        },
        components: true
      }
    },
    clean: {
      dist: 'dist',
    },
    copy: {
      dist: {
        files: [{
          expand: true,
          cwd: 'webapp',
          src: [
            '**',
            '!test/**'
          ],
          dest: 'dist'
        }]
      }
    },
  })

  grunt.loadNpmTasks('grunt-contrib-connect')
  grunt.loadNpmTasks('grunt-contrib-clean')
  grunt.loadNpmTasks('grunt-contrib-copy')
  grunt.loadNpmTasks('grunt-openui5')

  grunt.registerTask('serve', function (target) {
    grunt.task.run('openui5_connect:' + (target || 'src') + ':keepalive')
  })
  grunt.registerTask('build', ['clean:dist', 'openui5_preload', 'copy'])
  grunt.registerTask('default', ['serve'])
}
```

## Contribution
I'm happy to accept Pull Requests! Please note that this project is released with a [Contributor Code of Conduct](https://github.com/bastilimbach/sapui5-downloader/blob/master/CODE_OF_CONDUCT.md). By participating in this project you agree to abide by its terms.

## Credits
This project was heavily inspired by [openui5.runtime.downloader](https://github.com/maugenst/openui5.runtime.downloader) by [Marius Augenstein](https://github.com/maugenst).

## License
[MIT](https://github.com/bastilimbach/sapui5-downloader/blob/master/packages/sapui5-runtime/LICENSE) :heart:

'use strict'

/*
|--------------------------------------------------------------------------
| Routes
|--------------------------------------------------------------------------
|
| Http routes are entry points to your web application. You can create
| routes for different URL's and bind Controller actions to them.
|
| A complete guide on routing is available here.
| http://adonisjs.com/docs/4.0/routing
|
*/

/**
* @swagger
* definitions:
*   Login:
*     required:
*       - email
*       - password
*     properties:
*       email:
*         type: string
*       password:
*         type: string
*   Brand:
*     required:
*       - name
*       - source
*     properties:
*       name:
*         type: string
*       source:
*         type: string
*/

const Route = use('Route')

Route.on('/').render('welcome')

Route.group(() => {
  Route.get('/docs.json', () => {
    const swaggerJSDoc = require('swagger-jsdoc')

    const options = {
      swaggerDefinition: {
        info: {
          title: 'Katalog Gadget', // Title (required)
          version: '1.0.0', // Version (required)
          description: 'This is about documentation of Katalog Gadget.'
        },
        basePath: "/api/v1",
        schemes : [
          'http'
        ],
        securitySchemes: {
          bearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT'
          }
        }
      },
      apis: ['./start/routes.js'] // Path to the API docs
    }

    return swaggerJSDoc(options)
  }).as('swaggerSpec')

  Route.get('/docs', ({ view }) => {
    return view.render('swaggerUI')
  }).as('swaggerUI')

  /**
  * @swagger
  * /brand:
  *   get:
  *     tags:
  *       - Brand
  *     summary: Show All Brand
  *     produces:
  *      - application/json
  */
  Route.get('/brand', 'BrandController.index')

  /**
  * @swagger
  * /brand/{id}:
  *   get:
  *     tags:
  *       - Brand
  *     summary: Show Detail Brand
  *     produces:
  *      - application/json
  *     parameters:
  *      - name: id
  *        in: path
  *        description: ID Brand
  *        required: true
  *        type: integer
  *        format: "int32"
  */
  Route.get('/brand/:id', 'BrandController.show')

  /**
  * @swagger
  * /brand/{page}/{limit}:
  *   get:
  *     tags:
  *       - Brand
  *     summary: Show Pagination Brand
  *     produces:
  *      - application/json
  *     parameters:
  *      - name: page
  *        in: path
  *        description: Page
  *        required: true
  *        type: integer
  *        format: "int32"
  *      - name: limit
  *        in: path
  *        description: Limit item
  *        required: true
  *        type: integer
  *        format: "int32"
  */
  Route.get('/brand/:page/:limit', 'BrandController.paginate')

  /**
  * @swagger
  * /brand:
  *   post:
  *     tags:
  *       - Brand
  *     summary: Insert Brand
  *     produces:
  *      - application/json
  *     parameters:
  *       - name: body
  *         in: body
  *         description: Data object
  *         required: true
  *         schema:
  *           $ref: '#/definitions/Brand'
  */
  Route.post('/brand', 'BrandController.store').middleware('auth')

  /**
  * @swagger
  * /brand/{id}:
  *   put:
  *     tags:
  *       - Brand
  *     summary: Update Brand
  *     produces:
  *      - application/json
  *     parameters:
  *      - name: id
  *        in: path
  *        description: Id
  *        required: true
  *        type: integer
  *        format: "int32"
  *      - name: body
  *        in: body
  *        description: Data object
  *        required: true
  *        schema:
  *          $ref: '#/definitions/Brand'
  */
  Route.put('/brand/:id', 'BrandController.update').middleware('auth')

  /**
  * @swagger
  * /brand/{id}:
  *   delete:
  *     tags:
  *       - Brand
  *     summary: Delete Brand
  *     produces:
  *      - application/json
  *     parameters:
  *      - name: id
  *        in: path
  *        description: ID Brand
  *        required: true
  *        type: integer
  *        format: "int32"
  */
  Route.delete('/brand/:id', 'BrandController.destroy').middleware('auth')

  /**
  * @swagger
  * /user-login:
  *   post:
  *     tags:
  *       - User
  *     summary: Login User
  *     consumes:
  *       - application/x-www-form-urlencoded
  *     produces:
  *       - application/json
  *     parameters:
  *       - name: email
  *         in: formData
  *         description: Email
  *         required: true
  *         type: string
  *       - name: password
  *         in: formData
  *         description: Password
  *         required: true
  *         type: string
  *         format: password
  */
  Route.post('/user-login', 'UserController.login')

  /**
  * @swagger
  * /user-detail:
  *   get:
  *     tags:
  *       - User
  *     summary: Detail User
  *     produces:
  *      - application/json
  */
  Route.get('/user-detail', 'UserController.show').middleware('auth')

  /**
  * @swagger
  * /user-logout:
  *   get:
  *     tags:
  *       - User
  *     summary: Logout User
  *     produces:
  *      - application/json
  */
  Route.get('/user-logout', 'UserController.logout').middleware('auth')

  Route.get('/user-hash-password/:password', async ({ params }) => {
    const Hash = use('Hash')
    return await Hash.make(params.password)
  })
  
}).prefix('api/v1')
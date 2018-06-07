'use strict'

const Model = use('Model')

class User extends Model {
  static get createdAtColumn () {
      return ''
  }

  static get updatedAtColumn () {
      return ''
  }

  static get hidden () {
      return ['password', 'status']
  }
}

module.exports = User

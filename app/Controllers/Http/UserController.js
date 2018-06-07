'use strict'

class UserController {
    async show({auth}){
        return auth.getUser()
    }
    
    async login ({ request, auth }) {
        const { email, password } = request.all()
        return auth.attempt(email, password)
    }
    
    async logout ({auth}) {
        return auth.logout()
    }
}

module.exports = UserController

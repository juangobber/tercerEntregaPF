import { CartDao } from "../models/DAO/carts.dao.js"
import { UsersDAO } from "../models/DAO/users.dao.js"
import { HTTP_STATUS, hashPassword, httpError } from "../utils/api.utils.js"
import ENV from "../config/env.config.js"
import nodemailer from 'nodemailer'


const cartDao = new CartDao()
const usersDAO = new UsersDAO()

const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    secure: true,
    port: 465,
    auth: {
        user: ENV.MAIL,
        pass: ENV.GMAIL_PASS
    }
})

export class UsersService {

    async getUsers(){
        const users = await usersDAO.getUsers()
        const filteredUsers = users.map( user => {
            const {first_name, last_name, email, admin, role, _id} = user;
            return  {first_name, last_name, email, admin, role, _id}
        })
        return filteredUsers
    }

    async getUserById(id){
        const user = await usersDAO.getUserById(id)
        return user
    }

    async createUser(payload){
        const {email, first_name, last_name, age, password} = payload

        if(!email|| !first_name|| !last_name|| !age|| !password){
            throw new httpError("Missing fields", HTTP_STATUS.BAD_REQUESTED)
        }

        const newCart = await cartDao.createCart()

        const newUserPayload = {
            first_name: first_name,
            last_name: last_name,
            age: age,
            password: hashPassword(password),
            role: email.includes('@coder.com') ? 'ADMIN' : 'USER',
            email: email,
            cart: newCart._id
        }

        const newUser = await usersDAO.createUser(newUserPayload);
        return newUser
    }

    async createUserGithub(payload){
        const {email, first_name, last_name, age, password, githubLogin} = payload

        const newCart = await cartDao.createCart()

        const newUserPayload = {
            first_name: first_name,
            last_name: last_name,
            age: age,
            password: password,
            role: 'USER',
            email: email,
            cart: newCart._id,
            githubLogin: githubLogin

        }

        const newUser = await usersDAO.createUser(newUserPayload);
        return newUser
    }

    async findOne(filter){
        const user = await usersDAO.findOne(filter)
        return user
    }

    async deleteUsers(){
        const today = new Date()
        const twoDaysAgo = new Date(today.getTime() - (2 * 24 * 60 * 60 * 1000))
        
        const deleteUsers = await usersDAO.deleteMany(twoDaysAgo)

        const filteredUsersData = deleteUsers.map( user  => {
            const {first_name, last_name, email} = user;         
            return  {first_name, last_name, email }
        })

        if (filteredUsersData.length > 0 ) {
            const sentMails = deleteUsers.map (async user => {
                const {first_name, email} = user

                const mailParams = {
                    from: `Coder Test ${ENV.MAIL}`,
                    to: `${email}`,
                    subject: 'Test Email from node server',
                    html: `<h1>Hi ${first_name}! this is a test!</h1> <br> <p>Your account has been deleted because you haven't used it in 2 days</p>`
                }
        
                const mail = await transporter.sendMail(mailParams)
                return {user: email, mail: mail}
            })
        } else {}
        
        return filteredUsersData
        
    }

    async updateUser(uid, role){
        const payload = {"role": role}
        const updateUser = await usersDAO.updateUserById(uid, payload)
        return updateUser
    }

    async deleteUser(uid){
        const deleteUser = await usersDAO.deleteUser(uid)
        return deleteUser
    }
}


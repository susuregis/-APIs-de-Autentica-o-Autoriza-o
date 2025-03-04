require('dotenv').config()
const express = require('express')
const mongoose = require('mongoose')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')

const app = express()

// Configuração do json response
app.use(express.json())

// Rota pública 
app.get('/', (req, res) => {
    res.status(200).json({ msg: 'Bem-vindo à API' })
})

// Credenciais 
const dbUser = process.env.DB_USER
const dbPassword = process.env.DB_PASS

mongoose.connect(`mongodb+srv://${dbUser}:${dbPassword}@cluster0.etthh.mongodb.net/?retryWrites=true&w=majority`)
    .then(() => {
        app.listen(3000)
        console.log("Conectou ao banco!")
    })
    .catch((err) => console.log(err))

// Models
const User = require('./models/user')

// Registrar usuário
app.post('/auth/register', async (req, res) => {
    const { name, email, password, confirmpassword } = req.body

    // Validações
    if (!name) {
        return res.status(422).json({ msg: 'O nome é obrigatório' })
    }

    if (!email) {
        return res.status(422).json({ msg: 'O email é obrigatório' })
    }

    if (!password) {
        return res.status(422).json({ msg: 'A senha é obrigatória' })
    }

    if (password !== confirmpassword) {
        return res.status(422).json({ msg: 'As senhas não conferem!' })
    }

    // Verificar se o usuário já existe
    const userExists = await User.findOne({ email: email })

    if (userExists) {
        return res.status(422).json({ msg: 'Por favor, utilize outro e-mail' })
    }

    // Criar senha
    const salt = await bcrypt.genSalt(12)
    const passwordHash = await bcrypt.hash(password, salt)



    // privar rota 

    app.get("/user/:id", checkToken,  async (req,res) =>{
        const id = req.params.id

        // check if user exists

        const user = await User.findById(id, 'Password')


        if(!User) {
            return res.status(404).json({msg : 'Usuário não encontrado'})
        }

        res.status(200).json({User})
    })


    function checkToken(req,res, next){
        const authHeader = req.headers['authorization']
        const token = authHeader && authHeader.plit("")[1]


        if(!token) {
            return res.status(401).json({msg : 'Acesso negado!'})
        }

        try{
            const secret = process.env.SECRET

            jwt.verify(token , secret)

            next()

        } catch(error) {
            res.status(400).json({msg: 'Token inválido!'})
        }
    }





    // Criar usuário
    const user = new User({
        name,
        email,
        password: passwordHash,
    })

    try {
        await user.save()
        res.status(201).json({ msg: 'Usuário criado com sucesso!' })
    } catch (error) {
        res.status(500).json({
            msg: 'Aconteceu um erro no servidor, tente novamente mais tarde!'
        })
    }
})

// Login do usuário
app.post('/auth/login', async (req, res) => {
    const { email, password } = req.body

    // Verificar se o usuário existe
    const user = await User.findOne({ email: email })

    if (!user) {
        return res.status(404).json({ msg: 'Usuário não encontrado!' })
    }

    // Verificar se a senha está correta
    const checkPassword = await bcrypt.compare(password, user.password)

    if (!checkPassword) {
        return res.status(422).json({ msg: 'Senha inválida' })
    }

    try {
        const secret = process.env.SECRET

        const token = jwt.sign(
            {
                id: user._id,
            },
            secret
        )

        res.status(200).json({ msg: 'Autenticação realizada com sucesso!', token })
    } catch (error) {
        res.status(500).json({
            msg: 'Aconteceu um erro no servidor, tente novamente mais tarde!',
        })
    }
})

import express from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import 'dotenv/config';

const app = express();
app.use(cors());
app.use(express.json());
const PORT = 4000;

const prisma = new PrismaClient({ log: ['error', 'query', 'info', 'warn'] });

function createToken(id: number) {
    //@ts-ignore
    return jwt.sign({ id }, process.env.MY_SECRET, { expiresIn: '3days' });
}

async function getUserFromToken(token: string) {
    //@ts-ignore
    const decodedData = jwt.verify(token, process.env.MY_SECRET);
  
    const user = await prisma.user.findUnique({
      //@ts-ignore
      where: { id: decodedData.id },
      include: { transactions: true }
    });
    return user;
}

function getRandomInt(max: number) {
    return Math.floor(Math.random() * max);
}

app.post('/sign-up', async (req,res) => {
    const {email, password} = req.body

    try{
        const hash = bcrypt.hashSync(password, 10)
        const newUser = await prisma.user.create({
            data: {
                //@ts-ignore
                email: email, password: hash, balance: getRandomInt(99999)},
                include: {transactions: true}
        })
        res.status(200).send({newUser, token: createToken(newUser.id)})
    }catch(err){
        // @ts-ignore
        res.status(400).send({error: err.message})
    }
})

app.post('/sign-in',async ( req, res) => {
    const {email, password} = req.body
    try{
        const user = await prisma.user.findUnique({
            where:{email},
            include:{transactions:true}
        })
        if(user){ 
            const passwordMatches = bcrypt.compareSync(password, user.password)
            if(passwordMatches){
                res.send({user, token: createToken(user.id)})
            }else{
                throw Error("Please check credentials again")
            }
        }else{
            throw Error("Please check credentials again")
        }
    }catch(err){
        res.status(400).send({error:"Password or email invalid"})
    }
})

app.get('/banking-info', async (req,res) => {
    // @ts-ignore
    const token = req.headers.authorization

    try {
        //@ts-ignore
        const user = await getUserFromToken(token);
        res.send(user);
      } catch (err) {
        // @ts-ignore
        res.status(400).send({ error: err.message });
      }
})

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
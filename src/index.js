import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { MongoClient, ObjectId } from "mongodb";
import joi from "joi";
import dayjs from "dayjs";


let now = dayjs();

const userSchema = joi.object({
    name: joi.string().required()
});

const messageSchema = joi.object(
    {
        to: joi.string().required(),
        text: joi.string().required(),
        type: joi.string().valid("private_message", "message").required()
    }
);

const app = express();
dotenv.config();
app.use(cors());
app.use(express.json());

const mongoClient = new MongoClient(process.env.MONGO_URI);
let db;

try{
    await mongoClient.connect();
    console.log("Connected to MongoDB");
}catch(err){
    console.log(err);
}

db =  mongoClient.db("BatePapoUol");



app.post("/participants", async (req,res) => {
    const body = req.body;
    const validation =  userSchema.validate(body);
    if(validation.error){
        const errors = validation.error.details.map(detail => detail.message);
        res.status(500).send(errors);
        return;
    }
 
    const participants = await db.collection("participants");

    if(await db.collection("participants").findOne({name: body.name})){
        res.status(409).send("Nome já existe");
        return;
    }
    const newBody = {
        name: body.name,
        lastStatus: Date.now()
    };
    try{
        await participants.insertOne(newBody);
        res.status(201).send("Participante cadastrado com sucesso");

    } catch (err) {
        res.status(500).send("Erro ao cadastrar participante");
      }
    });


app.get("/participants", async (req,res) => {

    try {
        const receitas = await db
          .collection("participants")
          .find({}, { _id: 0 })
          .toArray();
    
        res.send(receitas);
      } catch (err) {
        console.log(err);
        res.sendStatus(500);
      }
    
})    

 
app.post("/messages", async (req,res) =>{
    const body = req.body;
    console.log(body);
    const user = req.headers.user;
    console.log(user);
    const validation = messageSchema.validate(body);
    if(validation.error){
        const errors = validation.error.details.map(detail => detail.message);
        res.status(500).send(errors);
        return;
    }
    console.log((await db.collection("participants").find({name : user}).toArray()));
 
    if(!await db.collection("participants").findOne({name:user})){
        res.status(400).send("Usuário não existe");
        return;
    }
    const newBody = {
        from: user,
        to: body.to,
        text: body.text, 
        type: body.type, 
        time: now.format("HH:mm:ss")
    }
    try{
        
        // await db.collection("messages").insertOne(newBody);
        res.status(201).send("Mensagem enviada com sucesso");
    } catch (err){
        res.status(500).send("Erro ao enviar mensagem");
    }
    

})


app.get("/messages", async (req,res) => {
    
 try{
   const messages =  await db.collection("messages").find({}).toArray();
    res.send(messages);
 } catch (err){
     res.status(500).send("Erro ao buscar mensagens");
 }
});

app.listen(5500);
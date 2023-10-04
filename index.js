const express = require('express');
const app=express()
const cors = require('cors');
const jwt=require('jsonwebtoken')
require('dotenv').config()
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const port=process.env.PORT||5000;

app.use(cors())
app.use(express.json())



const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.n3erbds.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});



const verifyJWT=(req,res,next)=>{
  console.log('hitting verifyJWT')
  console.log(req.headers.authorization);
  const authorization=req.headers.authorization;
  if(!authorization){
    return res.status(401).send({error:true,message:'unauthorized access'})
  }
  const token=authorization.split(' ')[1];
  console.log('token inside verify jwt',token);
  jwt.verify(token,process.env.JWT_TOKEN,(error,decoded)=>{
    if(error){
      return res.status(403).send({error:true,message:'unauthorized access'})
    }
    req.decoded=decoded;
    next()
  })
}

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();


    const database = client.db("carsDoctor");
    const carsCollect = database.collection("carsCollection");

    const data = client.db("carsBookings");
    const booking = data.collection("carsBooking");


//JWT USE
app.post('/jwt',(req,res)=>{
  const user=req.body;
  const token=jwt.sign(user,process.env.JWT_TOKEN,{expiresIn:'1h'})
  res.send({token})
})

                                                                                                                               

app.get('/bookings',verifyJWT,async(req,res)=>{
const decoded=req.decoded;
console.log('come back to my jwt',decoded)
if(decoded.email !==req.query.email){
  return res.status(403).send({error:1,message:'Forbidden access'})
}
  let query={}
  if(req.query?.email){
    query={email:req.query.email}
  }
  const cursor=booking.find(query)
  const result=await cursor.toArray()
  res.send(result)
})


    app.post('/bookings',async(req,res)=>{
      const book=req.body;
      console.log(book)
      const result=await booking.insertOne(book)
      res.send(result)
    })


    app.delete('/bookings/:id',async(req,res)=>{
      const id=req.params.id;
      const query={_id:new ObjectId(id)}
      const result=await booking.deleteOne(query)
      res.send(result)
    })

    app.put('/bookings/:id',async(req,res)=>{
      const updateBookings=req.params.id;
      const filter={_id:new ObjectId(updateBookings)}
      const options = { upsert: true };
      const update=req.body;
      const updatedBooking = {
        $set: {
         status:update.status
        },
      };
      // Update the first document that matches the filter
      const result = await booking.updateOne(filter, updatedBooking, options);
      res.send(result)
    })

    app.get('/carsCollection',async(req,res)=>{
const cursor=carsCollect.find()
const result=await cursor.toArray()
res.send(result)
    })



    app.get('/carsCollection/:id',async(req,res)=>{
        const id=req.params.id;
        const find={_id:new ObjectId(id)}
        const options = {
            // Sort matched documents in descending order by rating
          
            // Include only the `title` and `imdb` fields in the returned document
            projection: {title: 1, title: 1,price:1 ,img:1},
          };
        const result=await carsCollect.findOne(find,options)
        res.send(result)
    })
    // Send a ping to confirm a successful connection
    // await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);


app.get('/',(req,res)=>{
    res.send("Car Doctor is running")
})
app.listen(port,()=>{
    console.log(`Car Doctor is running Port:${port}`)
})
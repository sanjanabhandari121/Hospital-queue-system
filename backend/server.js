require('dotenv').config();
const express=require('express');
const http=require('http');
const mongoose=require('mongoose');
const cors=require('cors');
const {Server}=require('socket.io');

const authRoutes=require('./routes/authRoutes');
const adminRoutes=require('./routes/adminRoutes');
const patientRoutes=require('./routes/patientRoutes');
const doctorRoutes=require('./routes/doctorRoutes');
const receptionistRoutes=require('./routes/receptionistRoutes');

const queueService=require('./services/queueService');

const app=express();
const server=http.createServer(app);

app.use(cors({
    origin:[
        "http://localhost:5173",
        "https://hospital-queue-system-one.vercel.app"
    ],
    credentials:true
}));

app.use(express.json());

const io=new Server(server,{
    cors:{
        origin:[
            "http://localhost:5173",
            "https://hospital-queue-system-one.vercel.app"
        ],
        methods:["GET","POST","PUT","DELETE"],
        credentials:true
    }
});

queueService.setIoInstance(io);

app.use('/api/auth',authRoutes);
app.use('/api/admin',adminRoutes);
app.use('/api/patient',patientRoutes);
app.use('/api/doctor',doctorRoutes);
app.use('/api/receptionist',receptionistRoutes);

app.get('/',(req,res)=>{
    res.json({success:true,message:"Backend Running"});
});

app.use((err,req,res,next)=>{
    console.error(err.stack);
    res.status(500).json({
        success:false,
        error:"Internal Server Error"
    });
});

io.on('connection',(socket)=>{
    socket.on('joinDoctorRoom',(doctorId)=>{
        socket.join(`doctor:${doctorId}`);
    });

    socket.on('joinUserRoom',(userId)=>{
        socket.join(`user:${userId}`);
    });

    socket.on('disconnect',()=>{});
});

const PORT=process.env.PORT||5000;
const MONGODB_URI=process.env.MONGODB_URI;

mongoose.connect(MONGODB_URI)
.then(()=>{
    console.log("MongoDB Engine fully synchronized.");
    server.listen(PORT,()=>{
        console.log(`Engine active on port ${PORT}`);
    });
})
.catch(err=>{
    console.error("Database sync critical block error:",err);
});
const express = require('express')
const app = express()
require('dotenv').config()
const mongoose=require('mongoose')
const bodyParser=require('body-parser')
const moment=require('moment')
const Schema=mongoose.Schema
require('dotenv').config()


app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});
app.use(bodyParser.urlencoded({extended:false}));

//build mongoose schema and model
mongoose.connect(process.env.DB_URI,{ useNewUrlParser: true, useUnifiedTopology: true });
const userSchema=new Schema({
  username:{type:String,required:true},
  exercise:[{
    description:String,
    duration:Number,
    date:String,
  }]});
const User=mongoose.model('User',userSchema);


//build user
app.post('/api/users',function(req,res){
  const user=new User({username:req.body.username});
  user.save(function(err,data){
    res.json({username:data.username,_id:data.id});
  })
});
//get full list of users
app.get('/api/users',function(req,res){
  User.find({},function(err,data){
    if(err) throw err;
    res.json(data);
  })
});
//post w/ description+duration+date(no date=>now)
app.post('/api/users/:_id/exercises',function(req,res){
  let {description,duration,date}=req.body;
  let idd=req.params._id;
  if (date===undefined){
    date=new Date().toDateString();
  }else{
    date=new Date(date).toDateString();
  };
  User.findByIdAndUpdate(idd,{$push:{'exercise':{description:description,duration:duration,date:date}}},{new:true},function(err,data){
    if (err) throw err;
    res.json({username:data.username,description:data.exercise[0].description,duration:data.exercise[0].duration,date:data.exercise[0],date,_id:data.id})
  });

});

//filter date with from/to/limit then save log
app.get('/api/users/:_id/logs',function(req,res){
  let idd=req.params;
  let {from,to,limit}=req.query;
  if(from!=undefined&&to!=undefined){
    fromDate=new Date(from).getTime();
    toDate=new Date(to).getTime();
  }else{
    fromDate=new Date('1960-01-01').getTime();
    toDate=new Date().getTime();
  }

  User.findById(idd,function(err,data){
    if(idd&&idd!=undefined){
      let{username,_id,exercise}=data;
      log=[];
      for (let i=0;i<exercise.length;i++){
        comparedDate=new Date(exercise[i].date).getTime();
        if(fromDate<=comparedDate&&comparedDate<=toDate){
          log.push(exercise[i])
          };
      };
      if (limit!=undefined){
        log=log.slice(0,limit);
      };
      let count=0;
      if(log!=undefined){
        count=log.length;
      };
      res.json({username:username,count:count,_id:idd,log});
    }
  });

});








const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})

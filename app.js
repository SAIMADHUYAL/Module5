//load environment variables
require('dotenv').config()
const sgMail = require('@sendgrid/mail');
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const mongoose = require('mongoose')
//fix mongoose deprecation warnings
//mongoose.set('useNewUrlParser', true) 
mongoose.set('useFindAndModify', false)
mongoose.set('useCreateIndex', true)

const db = mongoose.connect('mongodb://127.0.0.1:27017/nodemodule5', { useNewUrlParser: true })
const orderlist = require('./models/order_model')

const express = require('express');
const app = express();
const port = 3000;

// For url encoding in utf-8
const bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({extended:true}));
app.use(bodyParser.json());

//Static file path
app.use(express.static(__dirname+'/public'));
//Html path
app.set('views', './views');
app.set('view engine', 'ejs');

//Post request to add new order
app.post('/newOrder', (req,res)=>{

    const order = Object.assign({}, req.body, {order_date: Date.now()})

    //console.log("order ==> ", order)
    
    orderlist.create(order, (err,data)=>{
        if(err){
            console.log(err)
            res.status(500).send(err)
        }
        else{
            //console.log(data)
            res.send(`Inserted ... ${data} `)
        }
    })

})

//Get request to render OrderForm.ejs
app.get('/', (req,res)=>{
    res.render('OrderForm')
})

app.get('/allOrders', (req,res)=>{
    
    orderlist.find({}, (err,data)=>{
        if(err) res.status(500).send(err)
        else{
            //console.log("data ==> ", data)
            const now = Date.now()
            let status
            let d0
            let sec
            const orders = data.map( order => {
                //console.log("order ** ", order)
                d0 = Number(order.order_date)
                sec = (now - d0)/1000
                if (sec<86400)        status = "In Progess"
                else if (sec>172800)  status = "Delivered"
                else                  status = "Dispatched"
                
                //console.log(d0)
                const d = new Date(d0).toLocaleDateString()
                console.log(d)
                order["order_date"] = d
                order["order_status"] = status
                return order
            })
            console.log("orders ==> ", orders)
            
            //binding result to data to be used in OrderStatus.ejs
            res.render('OrderStatus', {data: orders})
        }
    })
})

//Get request to retrieve order data from db
app.get('/getAllOrders', (req,res) => {

    orderlist.find({}, (err,data)=>{
        if(err)
            res.status(500).send(err)
        else
            res.json(data)
    })

})


app.get('/sendEmail/:email', (req,res)=>{
    const email = req.params.email
    console.log("email ==> ", email)
    orderlist.find({email}, (err,data)=>{
        if(err) res.status(500).send(err)
        else{
            console.log("data ==> ", data)
            const now = Date.now()
            let status
            let d0
            let sec
            const orders = data.map( order => {
                //console.log("order ** ", order)
                d0 = Number(order.order_date)
                sec = (now - d0)/1000
                if (sec<86400)        status = "In Progess"
                else if (sec>172800)  status = "Delivered"
                else                  status = "Dispatched"
                
                //console.log(d0)
                const d = new Date(d0).toLocaleDateString()
                //console.log(d)
                order["order_date"] = d
                order["order_status"] = status
                return order
            
            })
            console.log("orders ==> ", orders)
            const contentText = JSON.stringify(orders, null, 4)
            const contentHtml = "<div><h3>" + contentText + "</h3></div>"
            const msg = {
                to: email,
                from: 'sai@sai.com',
                subject: 'Your Order Status',
                text: contentText,
                html: contentHtml,
            };
            sgMail.send(msg);
            //console.log("msg ==> ", msg)
            res.send("Email sent to " + email)
        }
    })
})

app.listen(port, (err)=>{
    if(err) throw err;
    console.log("app is running on the port "+ port);
})
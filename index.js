const fetch = require('node-fetch');
const withQuery = require('with-query').default
const crypto = require('crypto-js');
const express = require('express');
const handlebars = require('express-handlebars');


const app = express();
app.engine('hbs',handlebars({defaultLayout: 'default.hbs'}));
app.set('view engine', 'hbs')

//configure the port
const PORT = parseInt(process.argv[2]) || parseInt(process.env.PORT) || 3000;
 

//Configure query
const ENDPOINT = "https://gateway.marvel.com/v1/public/characters"
const baseParams = {
    "apikey": '7b8eb208c84df68ac8bbeae90339c50f',
    "ts": 'test123456',
    "hash": crypto.MD5('test123456'+ '5662d90a1258f5eaae7b555d767cd585002f7699' + '7b8eb208c84df68ac8bbeae90339c50f').toString()
    //hash : md5(ts+privateKey+publicKey)
}
const allChars = (offset) => { 
    if(!!offset){
        baseParams.offset = offset 
    }
    return withQuery(ENDPOINT, baseParams) };

const charByID = (id) => { 
    
    const url = ENDPOINT+'/'+id
    return withQuery(url, baseParams) 

}


//Make requests
const reqAllChars = async (offset) => {

    const result = await fetch(allChars(offset));
    const resultJSON = await result.json();
    return resultJSON;
 
}

const reqCharById = async (charID) => {
    const result = await fetch(charByID(charID))
    const resultJSON = await result.json();
    return resultJSON;

}

//configure routes
app.use(express.static(__dirname + "/public"));

app.get('/character/:ir', async (req,res) => {

    let charDetails;

    try {
        const id = req.params.ir;
        const result = await reqCharById(id);
        charDetails = result.data.results[0] 
        //charDetails = { name:eew, description:sdfsdfsfs}
        console.log(charDetails.thumbnail);
        res.status(200);
        res.type('text/html');
        res.render('charPage',{charDetails})
    }
    catch{

    }


})

app.get('/', async (req,res) => {

    let allChars;
    const o = req.query.offset || 0;
    try{

        const result = await reqAllChars(o);
        const {offset,limit,total} = result.data;
        allChars = result['data']['results']
        //console.log(result)
        const imgVariant = '/portrait_fantastic'
        
        const char = allChars.map(char => { 
            return {thumbnail: char.thumbnail.path+imgVariant+'.'+char.thumbnail.extension, charID: char.id, name:char.name}
        })      

        res.status(200);
        res.type('text/html');
        res.render('index', {char, nextOffset: Math.min(offset+limit,limit), prevOffset: Math.max(offset-limit,0)})
        }
        catch(e){
            res.status(404);
            res.type('text/html');
            res.send(`Error 404: ${e}`)
        }
})



//Start app
app.listen(PORT, () => {console.info(`Your Marvel Universe has started on port ${PORT} at ${new Date()}`)})

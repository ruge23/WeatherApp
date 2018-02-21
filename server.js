const express =  require('express');
const bodyParser = require('body-parser');
const axios = require('axios')


const app = express();

const apikey = 'cacdf29dc2be47d484a105606152306'

app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: true}));
app.set('view engine', 'ejs')

app.get('/',(req, res) => {
    axios.get(`http://api.apixu.com/v1/current.json?key=${apikey}&q=Buenos%20Aires&lang=es`)
    .then((data) => {
        console.log(data);
        const obj = {
            temperatura: `${data.data.current.temp_c}°C Buenos Aires`,
            humedad: `Humedad: ${data.data.current.humidity}`,
            condicion: `Condicion: ${data.data.current.condition.text}`,
        };
        res.render('index',{weather_date: obj.temperatura, humidity: obj.humedad, condition: obj.condicion, minAndMaxTemp: null, weather: null, error: null})
    })
    .catch(err => console.log('Error', err));
});

app.get('/minandmax',(req, res) =>{
    const date = new Date();
    const previousDate = (data => new Date(data.setDate(data.getDate()-1)))(new Date);
    const today = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
    const yesterday = `${previousDate.getFullYear()}-${previousDate.getMonth() + 1}-${previousDate.getDate()}`;
    let max = 0;
    let min = 0;

    const minAndMaxTempToday = (arr, date) => {
        for (let i = date.getHours(); i < 24; i += 1) {
            const temp = arr[i].temp_c;

            if (!max && !min) max = temp, min = temp;
            if (temp > max) max = temp;
            if (temp < min) min = temp;
        }
        return (min, max);
    };

    const minAndMaxTempYesterday = (arr, date) => {
        for (let i = date.getHours(); i >= 0; i -= 1) {
            const temp = arr[i].temp_c;

            if (!max && !min) max = temp, min = temp;
            if (temp > max) max = temp;
            if (temp < min) min = temp;
        }
        return (min, max);
    };

    const promise1 = axios.get(`http://api.apixu.com/v1/history.json?key=${apikey}&q=Buenos%20Aires&lang=es&dt=${today}`)
        .then((data) => {
        const hours = data.data.forecast.forecastday[0].hour;
        minAndMaxTempToday(hours, date);
        })
        .catch(err => console.log('Error', err));
    const promise2 = axios.get(`http://api.apixu.com/v1/history.json?key=${apikey}&q=Buenos%20Aires&lang=es&dt=${yesterday}`)
        .then((data) => {
        const hours = data.data.forecast.forecastday[0].hour;
        minAndMaxTempYesterday(hours, previousDate);
        })
        .catch(err => console.log('Error', err));

    Promise.all([promise1, promise2])
        .then((data) => {
            const minAndMax = { min, max };
            res.render('index',{weather_date: null, humidity: null, condition: null,minAndMaxTemp:`Temperatura max: ${minAndMax.max}°C y min: ${minAndMax.min}°C de la ultimas 24 horas.`, weather: null, error: null})
        });
})

app.post('/', (req, res) =>{
    console.log(req.body)
    let city = req.body.city;
    axios.get(`http://api.apixu.com/v1/current.json?key=${apikey}&q=${city}&lang=es`)
        .then((data) =>{
            const city_temp = `${data.data.current.temp_c}°C en ${data.data.location.name}, ${data.data.location.region}`
            res.render('index', {weather_date: null, humidity: null, condition: null,minAndMaxTemp: null, weather: city_temp, error: null})
        })  
        .catch(err => console.log('Error', err))
})

app.listen(3000, () => {
    console.log("On port 3000!")
})
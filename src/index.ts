import express from 'express'

const app = express()

app.get('/', (req, res) => {
    res.send('Fudge!')
})

app.listen(3000, () => { console.log('The app is working') })
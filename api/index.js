const express = require('express');
const cors = require('cors');
const mongoose  = require('mongoose');
const User = require('./models/User');
const Post = require('./models/Post');
const bcrypt = require('bcryptjs');
const app = express();
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const multer = require('multer');
const uploadMiddleware = multer({ dest: 'uploads/' });
const fs = require('fs');
const path = require('path');

const salt = bcrypt.genSaltSync(10);
const secret = 'fdsajiofhjdsa0989085r342';

app.use(cors({credentials:true,origin:'http://localhost:3000'}));
app.use(express.json());
app.use(cookieParser());
app.use('/uploads', express.static(__dirname + '/uploads'));

mongoose.connect('mongodb+srv://institucionmalteria:400PEpqcSrJmnMXG@cluster0.css22m8.mongodb.net')

app.post('/register', async (req,res) =>{
    /* we want to grab username and password from the request body */
    const {username,password} = req.body;
    try{
        const userDoc = await User.create({
            username, 
            password:bcrypt.hashSync(password, salt),
        });
        res.json(userDoc);
    } catch(e) {
        res.status(400).json(e);
    }
    
})

app.post('/login', async (req,res) => {
    const {username,password} = req.body;
    const userDoc = await User.findOne({username});
    const passOk = bcrypt.compareSync(password, userDoc.password);
    if (passOk) {
        jwt.sign({username,id:userDoc._id}, secret, {}, (err,token) => {
            if(err) throw err;
            res.cookie('token', token).json({
                id:userDoc._id,
                username,
            });
        })
    } else {
        res.status(400).json('Credenciales Incorrectas');
    }
})

app.get('/profile', (req, res) => {
    const { token } = req.cookies;
    if (!token) {
        return res.status(401).json('Token missing');
    }
    jwt.verify(token, secret, (err, info) => {
        if (err) {
            return res.status(401).json('Invalid token');
        }
        res.json(info);
    });
});
app.post('/logout', (req,res) => {
    res.cookie('token', '').json('ok');
})

app.post('/post', uploadMiddleware.single('file'), async (req,res) => {
    const {originalname, path} = req.file;
    const parts = originalname.split('.');
    const ext = parts[parts.length - 1];
    const newPath = path+'.'+ext;
    fs.renameSync(path, newPath);

    const {token} = req.cookies;
    jwt.verify(token, secret, {}, async (err,info) => {
        if (err) throw err;
        const {title,summary,content} = req.body;
        const postDoc = await Post.create({
            title,
            summary,
            content,
            cover:newPath,
            author:info.id,
        });
        res.json(postDoc);
    });
});

app.put('/post', uploadMiddleware.single('file'), async (req,res) => {
    let newPath = null;
    if (req.file) {
        const {originalname, path} = req.file;
        const parts = originalname.split('.');
        const ext = parts[parts.length - 1];
        newPath = path+'.'+ext;
        fs.renameSync(path, newPath);
    }

    const {token} = req.cookies;
    jwt.verify(token, secret, {}, async (err,info) => {
        if (err) throw err;
        const {id,title,summary,content} = req.body;
        const postDoc = await Post.findById(id);
        const isAuthor = JSON.stringify(postDoc.author) === JSON.stringify(info.id);
        if (!isAuthor) {
            return res.status(400).json('Autor invalido');
        }
        
        await postDoc.updateOne({
            title,
            summary,
            content,
            cover: newPath ? newPath : postDoc.cover,
        });

        res.json(postDoc);
    });
});

app.get('/post', async (req,res) => {
    res.json(
        await Post.find()
        .populate('author', ['username'])
        .sort({createdAt: - 1})
        .limit(20)
    );
});

app.get('/post/:id', async (req,res) => {
    const {id} = req.params;
    const postDoc = await Post.findById(id).populate('author', ['username']);
    res.json(postDoc);
});

app.delete('/post/:id', async (req, res) => {
    const { id } = req.params;
    const { token } = req.cookies;
    
    jwt.verify(token, secret, {}, async (err, info) => {
        if (err) {
            return res.status(401).json('Unauthorized');
        }

        try {
            const postDoc = await Post.findById(id);
            if (!postDoc) {
                return res.status(404).json('Post not found');
            }

            const isAuthor = JSON.stringify(postDoc.author) === JSON.stringify(info.id);
            if (!isAuthor) {
                return res.status(403).json('Forbidden');
            }

            // Eliminar la imagen de la carpeta de uploads
            const imagePath = path.join(__dirname, postDoc.cover);
            if (fs.existsSync(imagePath)) {
                fs.unlinkSync(imagePath);
            }

            // Eliminar el post de la base de datos
            await Post.deleteOne({ _id: id });

            res.json('Post deleted successfully');
        } catch (error) {
            console.error('Error deleting post:', error);
            res.status(500).json('Server error');
        }
    });
});



app.listen(4000);
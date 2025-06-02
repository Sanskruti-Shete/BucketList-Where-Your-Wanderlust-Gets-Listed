const uuid = require('uuid/v4');
const {validationResult} = require('express-validator');

const HttpError = require('../models/http-error');
const User = require('../models/user');

const DUMMY_USERS = [
    {
        id:'u1',
        name:'Max Schwarz',
        email:'test@test.com',
        password:'testers'
    }
];

const getUsers = (req,res,next) =>{
    res.json({users:DUMMY_USERS});
};

const signup = async(req,res,next) =>{
    const errors=validationResult(req);
    if(!errors.isEmpty()){
        return next(new HttpError('Invalid inputs passed, please check your data',422));
    }
    const {name, email, password} = req.body;
    let existingUser;
    try{
        existingUser = User.findOne({email:email})
    }catch(err){
        const error=new HttpError('Signup failed, try aain later',500);
        return next(error);
    }
    if(existingUser){
        const error=new HttpError('User exists already, please login instead',422);
        return next(error);
    }
    const createdUser=new User({
        name:name,
        email:email,
        image:'https://www.google.com/url?sa=i&url=https%3A%2F%2Funsplash.com%2Fs%2Fphotos%2Fimage&psig=AOvVaw3L0desmYG1nxY3XD-hdE4g&ust=1748826172575000&source=images&cd=vfe&opi=89978449&ved=0CBEQjRxqFwoTCKCTjbeEz40DFQAAAAAdAAAAABAE',
        password:password,
        places:places
    });

    try{
        await createdUser.save();
    }catch(err){
        const error = new HttpError('Signup failed, try again',500);
        return next(error);
    }
    res.status(201).json({user:createdUser.toObject({getters:true})});
};

const login = (req,res,next) =>{
    const {email,password} = req.body;
    const identifiedUser = DUMMY_USERS.find(u=>u.email === email);
    if(!identifiedUser || identifiedUser.password!==password){
        throw new HttpError('Could not identify user, credentials seem to be wrong',401);
    }
    res.json({message:'Logged in!'});
};

exports.getUsers = getUsers;
exports.signup=signup;
exports.login=login;
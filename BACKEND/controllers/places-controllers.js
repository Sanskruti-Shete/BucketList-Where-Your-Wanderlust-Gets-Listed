const {validationResult} = require('express-validator');
const mongoose = require('mongoose');

const HttpError = require('../models/http-error');
const Place = require('../models/place');
const User = require('../models/user');

let DUMMY_PLACES = [
    {
        id: 'p1',
        title: 'Empire State Building',
        description: 'One of the most famous sky scrapers in the world!',
        location: {
            lat: 40.7484474,
            lng: -73.9871516
        },
        address: '20 W 34th St, New York, NY 10001',
        creator: 'u1'
    }
];


const getPlaceById = async (req,res,next)=>{
    const placeId = req.params.pid; // { pid: 'p1' }
    let place;
    try{
        place = await Place.findById(placeId);
    }catch(err){
        const error = new HttpError('Something went wrong, could not find a place',500);
        return next(error);
    }
    if (!place){
        const error = new HttpError('Could not find a place for the provided id',404);
        return next(error);
    }
    else{
        res.json({place: place.toObject({getters:true})});
    }
};

const getPlacesByUserId = async(req,res,next)=>{
    const userId = req.params.uid;
    let places;
    try{
        places = Place.find({creator: userId});
    }catch(err){
        const error=new HttpError('Fetching places failed, try again later',500);
        return next(error);
    }
    if (!places || places.length === 0){
        next(new HttpError('Could not find a place for the provided user id',404));
    }
    else{
        res.json({places: (await places).map(place=>place.toObject({getters:true}))});
    }
};

const createPlace = async (req,res,next)=>{
    const errors=validationResult(req);
    if(!errors.isEmpty()){
        return next(new HttpError('Invalid inputs passed, please check your data',422));
    }
    const {title,description,coordinates,address,creator} = req.body;
    const createdPlace = new Place({
        title:title,
        description:description,
        address:address,
        location:coordinates,
        image: 'https://www.google.com/url?sa=i&url=https%3A%2F%2Fen.wikipedia.org%2Fwiki%2FImage&psig=AOvVaw0ws7CqcKtKb_vE2bsLrB1p&ust=1748769210444000&source=images&cd=vfe&opi=89978449&ved=0CBQQjRxqFwoTCIjztZ2wzY0DFQAAAAAdAAAAABAE',
        creator:creator
    });

    let user;
    try{
        user= await User.findById(creator);
    }catch(err){
        const error=new HttpError('Create place failed',500);
        return next(error);
    }
    if(!user){
        const error=new HttpError('Could not find user for provided Id',404);
        return next(error);
    }

    console.log(user);

    try{
        const sess = await mongoose.startSession();
        sess.startTransaction();
        await createdPlace.save({session:sess});
        user.places.push(createdPlace);
        await user.save({session:sess});
        sess.commitTransaction();
    }catch(err){
        const error = new HttpError('Creating place failed, try again',500);
        return next(error);
    }
    
    res.status(201).json({place:createdPlace});
};

const updatePlaceById = async(req,res,next) =>{
    const errors=validationResult(req);
    if(!errors.isEmpty()){
        return next(new HttpError('Invalid inputs passed, please check your data',422)); 
    }
    const {title,description} = req.body;
    const placeId = req.params.pid;
    let place;
    try{
        place = await Place.findById(placeId);
    }catch(err){
        const error = new HttpError('Something went wrong, could not update place',500);
        return next(error);
    }
    place.title=title;
    place.description=description;

    try{
        await place.save();
    }catch(err){
        const error = new HttpError('Something went wrong, could not update place',500);
        return next(error);
    }

    res.status(200).json({place:place.toObject({getters:true})});
};

const deletePlace = async(req,res,next) =>{
    const placeId=req.params.pid;
    let place;
    try{
        place = await Place.findById(placeId).populate('creator');
    }catch(err){
        const error=new HttpError('Something went wrong, could not delete',500);
        return  next(error);
    }
    if(!place){
        const error = new HttpError('Could not find a place for this ID',404);
        return next(error);
    }
    try{
        const sess=await mongoose.startSession();
        sess.startTransaction();
        await place.remove({session:sess});
        place.creator.places.pull(place);
        await place.creator.save({session:sess});
        await sess.commitTransaction();
    }catch(err){
        const error=new HttpError('Something went wrong, could not delete',500);
        return  next(error);
    }
    res.status(200).json({message:'Deleted place'});
};

exports.getPlaceById = getPlaceById;
exports.getPlacesByUserId = getPlacesByUserId;
exports.createPlace = createPlace;
exports.updatePlaceById = updatePlaceById;
exports.deletePlace = deletePlace;
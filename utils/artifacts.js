const fs=require('fs-extra');
const path=require('path')
const config=require('../config/config');
const {log}=require('./logger');

exports.save= function(filename,content){
    const filepath=path.join(config.artifactsPath,filename);
    fs.outputFileSync(filepath,content,'utf-8');
    log(`Artifact save :${filepath}`);
};


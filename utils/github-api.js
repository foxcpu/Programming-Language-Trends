const assert=require('assert');
const axios=require('axios');
const axiosRetry=require('axios-retry');
const parseLinkHeader=require('parse-link-header');
const config=require('../config/config');
const {log}=require('../utils/logger');

assert(config.githubToken,'Empty Github token. Check env variables.');

const request=axios.create({
    baseURL:config.apiUrl,
    headers:{
        Accept:'application/vnd.github.v3+json',
        Authorization:`token ${config.githubToken}`,
    }
});
request.interceptors.request.use(config=>{
    log('请求拦截');
    return config;
},err=>{
    return Promise.reject(err);
});
request.interceptors.response.use(res=>{
    return res;
},err=>{
    log(err);
    return Promise.reject(err);
});


axiosRetry(request,{
    retries:3,
    retryDelay:retryNumber=>{
        log(`Request retry attempt:${retryNumber}`);
        return axiosRetry.exponentialDelay(retryNumber);
    }
});

exports.fetchJson=async function (method,url,data){
    method=method.toUpperCase();
    log(method,url);
    const response=await request({method,url,data});
    const pages=parseLinkHeader(response.headers.link);
    return {result:response.data,pages};
};
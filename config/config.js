require('dotenv').config();
const path=require('path');
const ms=require('ms');

const config={};
config.issuesLabel=process.env.TRENDING_LABEL;
config.lang=process.env.TRENDING_LANG||'';
config.dryRun=!process.env.TRENDING_NOT_DRY_RUN;
config.githubToken = process.env.GITHUB_TOKEN_VITALETS;
// : process.env.GITHUB_TOKEN_BOT;
// config.githubToken = process.env.privateKey  ? process.env.privateKey  : secrets.privateKey;
config.apiUrl = 'https://api.github.com/repos/foxcpu/Programming-Language-Trends';
config.trendingRetryOptions = {
    retries: 5,
    minTimeout: 5000,
  };
  config.artifactsPath = path.join('.artifacts', config.issuesLabel || '');
  config.isDaily = config.issuesLabel && config.issuesLabel.indexOf('daily') >= 0;
  config.noUpdatePeriodMs = config.isDaily ? ms('22h') : ms('6d');
  config.attentions=['javascript','java'];
  config.cycle='trending-weekly';//trending-daily
  module.exports = config;


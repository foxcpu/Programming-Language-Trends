const R = require('ramda');
const ms = require('ms');
const Timeout = require('await-timeout');
const config = require('../config/config');
const {log} = require('../utils/logger');
// const Translator = require('../utils/translator');
const Issues = require('./issues');
const Trends = require('./trends');
const Comments = require('./comments');

module.exports=class IssueUpdater{
    constructor(issue){
        this._issue=issue;
        this._commentsHelper=new Comments(this._issue);
        this._trendingRepos=[];
        this._knowRepos=[];
        this._newRepos=[];
        this._commentBody='';
        this._update=false;
    }
    get updated(){
        return this._update;
    }

    async update(){
        this._logHeader();
        await this._loadTrendingRepos();
        if(this._trendingRepos.length){
            await this._loadKnownRepos();
            this._detectNewRepos();
        }else{
            log('No Trending repos.Skipping.');
        }
        if(this._newRepos.length){
            await this._processNewRepos();
        }
    }

    async _processNewRepos(){
        await this._generateCommentBody();
        if(this._shouldUpdate()){
            await this._postComment();
            await Timeout.set(1000);
        }
    }

    async _loadTrendingRepos(){
        const trendingUrl=Issues.extractTrendingUrl(this._issue);
        this._trendingRepos=await new Trends(trendingUrl,config.trendingRetryOptions).getAll();
    }

    async _loadKnownRepos(){
        const comments=await this._commentsHelper.getAll();
        this._knowRepos=R.pipe(R.map(Comments.extractRepos),R.flatten)(comments);
        log(`Known repos:${this._loadKnownRepos.length}`);
    }

    async _postComment(){
        const result=await this._commentsHelper.post(this._commentBody);
        if(result.url){
            this._update=true;
            log(`Commented:${result.html_url}`);
        }else{
            throw new Error(JSON.stringify(result));
        }
    }

    _shouldUpdate(){
        if(config.dryRun){
            log(`DRY RUN! Skip posting comment.\nComment body:\n${this._commentBody}`);
            return false;
        }
        const timeSinceLastUpdate=Date.now()-this._commentsHelper.lastCommentTimestamp;
        if(timeSinceLastUpdate<config.noUpdatePeriodMs){
            log([
                `RECENTLY UPDATE(${timeSinceLastUpdate} ago)! Skip posting comment. `,
                `Comment body:\n${this._commentBody}`
            ].join('\n'));
            return false;
        }
        return true;
    }

    _detectNewRepos(){
        this._newRepos=R.differenceWith((a,b)=>a.url===b,this._loadTrendingRepos,this._knowRepos);
        log(`New repos:${this._newRepos.length}`);
    }

    _logHeader(){
        log(`\n==${this._issue.title.toUpperCase}==`);
    }
    async _generateCommentBody(){
        const since=this.issue.title.indexOf('daily')>=0?'today':'this week';
        const header=`**${this.issue.title}!**`;
        const commentItems=await Promise.all(this._newRepos.map(repo=>this._generateRepoMarkdown(repo,since)));
        this._commentBody=[header,...commentItems].join('\n\n');
    }
    async _generateRepoMarkdown(repo,since){
        const desc=IssueUpdater.stripMentionsFromRepoDesc(repo.description);
        // const translated=await new Translator(desc).toEn();
        return [
            `[${repo.name.replace('/',' / ')}](${repo.url})`,
            desc,
            // translated?`>${translated}\n`:'',
            repo.starsAdded?`***+${repo.starsAdded}** stars ${since}*`:'',
        ].filter(Boolean).join('\n');
    }

    static stripMentionsFromRepoDesc(desc){
        return (desc||'').replace(/\[maintainer=@.+\]/g,'').trim();
    }
};
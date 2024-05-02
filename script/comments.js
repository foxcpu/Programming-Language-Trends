const {log} =require('../utils/logger');
const githubApi=require('../utils/github-api');

const GITHUB_URL_REG=/https:\/\/github.com\/[^)]+/ig;

module.exports= class Comments{
    constructor(issue){
        this._issue=issue;
        this._url=`issues/${this._issue.number}/comments`;
        this._nextPageUrl=this._url;
        this._comments=[];
    }

    get lastCommentTimestamp(){
        const lastComment=this._comments&&this._comments[this._comments.length-1];
        return lastComment? new Date(lastComment.created_at).valueOf():0;
    }

    async getAll(){
        log(`Fetch comments...`);
        do{
            await this._loadCommetsPage();
        }while(this._nextPageUrl);
        log(`Fetch comments:${this._comments.length}`);
        return this._comments;
    }

    async post(body){
        return(await githubApi.fetchJson(`post`,this._url,{body})).result;
    }

    async addComment(body){
        return(await githubApi.fetchJson(`post`,this._url,{"body":body})).result;
    }

    async delete(comment){
        return (await githubApi.fetchJson(`delete`,comment.url)).result;
    }

    async _loadCommetsPage(){
        const {result,pages}=await githubApi.fetchJson('get',this._nextPageUrl);
        this._comments.push(...result);
        this._nextPageUrl=pages&&pages.next&&pages.next.url;
    }

    static extractRepos(comment){
        return comment.body.match(GITHUB_URL_REG)||[];
    }

    static getCommentAge(comment){
        return Date.now()-new Date(comment.created_at).valueOf();
    }

};

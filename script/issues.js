const assert=require('assert');
const config=require('../config/config');
const {log} =require('../utils/logger');
const githubApi=require('../utils/github-api');

const PER_PAGE=100;
const TRENDING_URL_REG=/https:\/\/github.com\/trending[^)]+/ig;

module.exports= class Issues{
    constructor(label,lang){
        assert(label,'You should provide label for issues.');
        this._label=label;
        this._lang=lang;
        this._issues=[];
    }
    static extractLang(issue){
        const matches=issue.title.match(/in\s+(.+)$/i);
        assert(matches,`Can't find lang in issue title:${issue.title}`);
        return matches[1];
    }

    async getAll(){
        await this._fetchIssues();
        this._filterByLang();
        return this._issues;
    }

    async _fetchIssues(){
        const url=`issues?labels=${this._label}&per_page=${PER_PAGE}`;
        this._issues=(await githubApi.fetchJson('get',url)).result;
        log(`Fetch issues:${this._issues.length}`);
    }

    _filterByLang(){
        if(this._lang){
            const langUrl=`${config.trendingUrl}/${this._lang}`;
            this._issues=this._issues.filter(issue=>issue.body.indexOf(langUrl)>=0);
            log(`Filtered issues by lang(${this._lang}):${this._issues.length}`);
        }
    }

    async addIssues(attention,body){
        const url=`issue/new`;
        const now = new Date();
        const options = {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        };
        const formatter = new Intl.DateTimeFormat('zh-CN', options);
        const formattedDate = formatter.format(now);
        return(await githubApi.fetchJson(`post`,_url,{"title":formattedDate+attention,"body":body})).result;
    }

};

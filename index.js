
const Trends=require('./script/trends');
const Issues=require('./script/issues');
const Comments=require('./script/comments');
const config=require('./config/config');
const {log} =require('./utils/logger');

const retryOptions = {
    retries: 2,
    minTimeout: 500,
  };
const attentions=config.attentions;

const run= async () => {
    attentions.map(async attention=>{
        const trendingUrl = "https://github.com/trending/"+attention+"?since=weekly";
        const repos = await new Trends(trendingUrl, retryOptions).getAll();
        const news=repos.map((repo,i)=>{
               const decription=repo.description.trim()===''?'':'\n'+repo.description.trim();
                return `${i+1}.**[${repo.name}](${repo.url})**+${decription}
                +${repo.starsAdded}stars this week<br>`;
        }).join('');
        const issues = await new Issues(config.cycle);
        issues.addIssues(attention,news);
    });
}    

run();

   

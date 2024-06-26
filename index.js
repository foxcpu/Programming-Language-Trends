
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
        const issues = await new Issues(config.cycle).getAll();// 找到这些issues
        const filter_issues=issues.filter(issue => {
                const str_label=issue.labels.some(label=>label.name===attention);
                if(str_label){
                    return true;
                }
        });
      filter_issues.forEach(async (issue)=>{
            const comments = new Comments(issue);
            const comment_array=comments.getAll();
            const add_comment=true;
            if(comment_array.length>0){
                const last_comment=comment_array.pop();
                if(last_comment.body===news){
                    add_comment=false;
                }
            }
            if(add_comment){
            const newComment = await comments.addComment(news);
            log(newComment);
            }
        });
    });
}    

run();

   

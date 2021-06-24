const github = require("@actions/github");
const core = require("@actions/core");

async function sprint() {
  const myToken = core.getInput("repo-token");
  const projectColumn = core.getInput("project-column");
  const octokit = new github.GitHub(myToken);
  const context = github.context;
  const repoName = context.payload.repository.name;
  const ownerName = context.payload.repository.owner.login;
  var issueNumber;

  if (context.payload.issue !== undefined) {
    issueNumber = context.payload.issue.number;
  } else if (context.payload.pull_request !== undefined) {
    issueNumber = context.payload.pull_request.number;
  } else if (
    context.payload.project_card !== undefined &&
    context.payload.project_card.content_url
  ) {
    issueNumber = context.payload.project_card.content_url.split("/").pop();
  }

  if (issueNumber === undefined) {
    return "No action being taken. Ignoring because issueNumber was not identified";
  }

  // query for the most recent information about the issue. Between the issue being created and
  // the action running, labels or asignees could have been added
  var updatedIssueInformation = await octokit.issues.get({
    owner: ownerName,
    repo: repoName,
    issue_number: issueNumber
  });
  
  var sprintListInformation = await octokit.request('GET /repos/{owner}/{repo}/milestones', {
    owner: ownerName,
    repo: repoName,
    state: "open"
  });

  // If in TODO, INPROGRESS or DONE columns
  if (projectColumn == '10215851' || projectColumn == '10215852' || projectColumn == '10215853') {
    sprint = sprintListInformation.data[0].number;
  }
   // If in BACKLOG column
  else {
    sprint = null;
  }

  await octokit.issues.update({
    owner: ownerName,
    repo: repoName,
    issue_number: issueNumber,
    milestone: sprint
  });
  return `Updated sprint ${sprint} in issue ${issueNumber}.`;
}

sprint()
  .then(
    result => {
      // eslint-disable-next-line no-console
      console.log(result);
    },
    err => {
      // eslint-disable-next-line no-console
      console.log(err);
    }
  )
  .then(() => {
    process.exit();
  });

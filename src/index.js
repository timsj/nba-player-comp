import axios from "axios";
import { createAutoComplete } from "./autoComplete";

//initialize autocomplete search options
const autoCompleteConfig = {
  renderOption(player) {
    return `
      ${player.first_name} ${player.last_name}
    `;
  },
  inputValue(player) {
    return `${player.first_name} ${player.last_name}`;
  },
  async fetchData(searchTerm) {
    //use balldontlie.io API search endpoint
    const response = await axios.get(
      "https://www.balldontlie.io/api/v1/players",
      {
        params: {
          search: searchTerm,
        },
      }
    );

    return response.data.data;
  },
};

//create autocomplete search form on left side
createAutoComplete({
  ...autoCompleteConfig,
  root: document.querySelector("#left-autocomplete"),
  onOptionSelect(player) {
    document.querySelector(".tutorial").classList.add("is-hidden");
    onPlayerSelect(player, document.querySelector("#left-summary"), "left");
  },
});

//create autocomplete search form on right side
createAutoComplete({
  ...autoCompleteConfig,
  root: document.querySelector("#right-autocomplete"),
  onOptionSelect(player) {
    document.querySelector(".tutorial").classList.add("is-hidden");
    onPlayerSelect(player, document.querySelector("#right-summary"), "right");
  },
});

//get current and last year for instructions and API requests
const date = new Date();
let currentYear = date.getFullYear(); //current calendar year; can be used from mid-April (end of NBA reg. season) thru Dec
if (date.getMonth() < 3 || (date.getMonth() === 3 && date.getDate() < 15))
  currentYear--; //use previous calendar year from Jan thru mid-April (end of NBA reg. season)
const lastYear = currentYear - 1;

//show instructions on initial page load
document.getElementById(
  "season"
).innerText = `to compare their latest complete regular season averages (${lastYear}-${currentYear} NBA season)`;

//initialize left and rightPlayer variables
let leftPlayer;
let rightPlayer;

//function to run when player is selected from dropdown
const onPlayerSelect = async (player, summaryElement, side) => {
  //retrieve balldontlie.io player info
  const bdlResponse = await axios.get(
    `https://www.balldontlie.io/api/v1/players/${player.id}`
  );

  //retrieve balldonlie.io player season averages (only returns stats on last full year)
  const bdlStatsResponse = await axios.get(
    `https://www.balldontlie.io/api/v1/season_averages?season=${lastYear}&player_ids[]=${player.id}`
  );

  //retrieve current list of NBA players from NBA API
  const nbaResponse = await axios.get(
    `https://data.nba.net/data/10s/prod/v1/${lastYear}/players.json`
  );

  //check for active player selection
  if (!bdlStatsResponse.data.data.length) {
    summaryElement.innerHTML = `
    <article class="notification is-danger">
      <p class="title">Uh oh!</p>
      <p class="subtitle">Please select a player who played in the ${lastYear}-${currentYear} NBA season.</p>
    </article>
    `;
  } else {
    //populate column with player info
    summaryElement.innerHTML = playerTemplate(
      bdlResponse.data,
      bdlStatsResponse.data.data[0],
      nbaResponse.data.league.standard
    );

    //choose which side the player appears on
    if (side === "left") {
      leftPlayer = bdlResponse.data;
    } else {
      rightPlayer = bdlResponse.data;
    }

    //run comparison only when two players are selected
    if (leftPlayer && rightPlayer) {
      runComparison();
    }
  }
};

const runComparison = () => {
  const leftSideStats = document.querySelectorAll(
    "#left-summary .notification"
  );
  const rightSideStats = document.querySelectorAll(
    "#right-summary .notification"
  );

  //perform float comparison on each stat between the two players
  leftSideStats?.forEach((leftStat, i) => {
    const rightStat = rightSideStats[i];
    const leftSideValue = parseFloat(leftStat.dataset.value);
    const rightSideValue = parseFloat(rightStat.dataset.value);

    if (isNaN(rightSideValue) || isNaN(leftSideValue)) {
      rightStat.classList.remove("is-success");
      rightStat.classList.remove("is-danger");
      leftStat.classList.remove("is-success");
      leftStat.classList.remove("is-danger");
    } else if (rightSideValue < leftSideValue) {
      rightStat.classList.remove("is-success");
      rightStat.classList.add("is-danger");
      leftStat.classList.add("is-success");
      leftStat.classList.remove("is-danger");
    } else if (leftSideValue < rightSideValue) {
      rightStat.classList.add("is-success");
      rightStat.classList.remove("is-danger");
      leftStat.classList.remove("is-success");
      leftStat.classList.add("is-danger");
    } else if (rightSideValue === leftSideValue) {
      rightStat.classList.remove("is-success");
      rightStat.classList.remove("is-danger");
      leftStat.classList.remove("is-success");
      leftStat.classList.remove("is-danger");
    }
  });
};

//initialize NBA API variables
let nbaID;
let nbaDOB;
let nbaJerseyNo;

const playerTemplate = (bdlPlayerDetail, bdlPlayerStats, nbaPlayerDetail) => {
  //use regex to convert mpg to float
  const mpg = parseFloat(bdlPlayerStats.min.replace(/:/g, "."));

  //search current list of NBA players from NBA API based on selected player
  for (let i = 0; i < nbaPlayerDetail.length; i++) {
    if (
      nbaPlayerDetail[i].firstName === bdlPlayerDetail.first_name &&
      nbaPlayerDetail[i].lastName === bdlPlayerDetail.last_name
    ) {
      nbaID = nbaPlayerDetail[i].personId;
      nbaDOB = nbaPlayerDetail[i].dateOfBirthUTC;
      nbaJerseyNo = nbaPlayerDetail[i].jersey;
    }
  }

  return `
    <article class="media">
      <figure class="media-left">
        <p class="image">
          <img src="https://ak-static.cms.nba.com/wp-content/uploads/headshots/nba/latest/260x190/${nbaID}.png"/>
        </p>
      </figure>
      <div class="media-content">
        <div class="content">
          <h4>${bdlPlayerDetail.first_name} ${bdlPlayerDetail.last_name}</h4>
          <p class="team">${bdlPlayerDetail.team.full_name} 
          <span class="icon is-medium">
            <img src="https://www.nba.com/.element/img/1.0/teamsites/logos/teamlogos_500x500/${bdlPlayerDetail.team.abbreviation.toLowerCase()}.png"></i>
          </span>
        </p>
          <p>#${nbaJerseyNo} | ${bdlPlayerDetail.position}</p>
          <p>${bdlPlayerDetail.height_feet}'-${bdlPlayerDetail.height_inches}",
          ${bdlPlayerDetail.weight_pounds} lbs</p>
          <p>DOB: ${nbaDOB}</>
        </div>
      </div>
      </article>
      <article data-value=${mpg} class="notification is-success">
        <p class="title">${bdlPlayerStats.min}</p>
        <p class="subtitle">Minutes Per Game</p>
      </article>
      <article data-value=${bdlPlayerStats.pts} class="notification is-success">
        <p class="title">${bdlPlayerStats.pts}</p>
        <p class="subtitle">Points Per Game</p>
      </article>
      <article data-value=${bdlPlayerStats.reb} class="notification is-success">
        <p class="title">${bdlPlayerStats.reb}</p>
        <p class="subtitle">Rebounds Per Game</p>
      </article>
      <article data-value=${bdlPlayerStats.ast} class="notification is-success">
        <p class="title">${bdlPlayerStats.ast}</p>
        <p class="subtitle">Assists Per Game</p>
      </article>
      <article data-value=${
        bdlPlayerStats.fg_pct
      } class="notification is-success">
        <p class="title">${bdlPlayerStats.fg_pct}</p>
        <p class="subtitle">FG%</p>
      </article>
      <article data-value=${
        bdlPlayerStats.fg3_pct
      } class="notification is-success">
        <p class="title">${bdlPlayerStats.fg3_pct}</p>
        <p class="subtitle">3PT%</p>
      </article>
      <article data-value=${
        bdlPlayerStats.ft_pct
      } class="notification is-success">
        <p class="title">${bdlPlayerStats.ft_pct}</p>
        <p class="subtitle">FT%</p>
      </article>
      <article data-value=${bdlPlayerStats.blk} class="notification is-success">
        <p class="title">${bdlPlayerStats.blk}</p>
        <p class="subtitle">Blocks Per Game</p>
      </article>
      <article data-value=${bdlPlayerStats.stl} class="notification is-success">
        <p class="title">${bdlPlayerStats.stl}</p>
        <p class="subtitle">Steals Per Game</p>
      </article>
  `;
};

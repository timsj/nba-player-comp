import { createAutoComplete } from "./autoComplete";
import {
  bdlPlayersFetch,
  bdlPlayerFetch,
  bdlStatsFetch,
  nbaPlayersFetch,
  nbaTeamsFetch,
} from "./apis";

//initialize autocomplete search options
const autoCompleteConfig = {
  renderOption(player) {
    if (player.error) {
      return `${player.error}`;
    } else {
      return `
      ${player.first_name} ${player.last_name}
    `;
    }
  },
  inputValue(player) {
    return `${player.first_name} ${player.last_name}`;
  },
  async fetchData(searchTerm) {
    //use balldontlie.io API search endpoint
    const results = await bdlPlayersFetch(searchTerm);
    return results;
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

//season select
//2016 is the earliest year in which complete and consistent data is found on from the data.nba.net API
const years = [
  { value: 2022, name: "2022 - 2023" },
  { value: 2021, name: "2021 - 2022" },
  { value: 2020, name: "2020 - 2021" },
  { value: 2019, name: "2019 - 2020" },
  { value: 2018, name: "2018 - 2019" },
  { value: 2017, name: "2017 - 2018" },
  { value: 2016, name: "2016 - 2017" },
];

//popular dropdown options
const dropdown = document.getElementById("years");
let str = "";
years.forEach((year) => {
  str += `<option value="${year.value}">${year.name}</option>`;
});
dropdown.innerHTML = str;

//initialize year variables
let firstYear;
let secondYear;

//add event listener for season change
dropdown.addEventListener("change", (e) => {
  firstYear = parseFloat(dropdown.value);
  secondYear = firstYear + 1;

  //update info banner
  document.getElementById(
    "season"
  ).innerHTML = `to compare their regular season averages <br/>(${firstYear}-${secondYear} NBA season)`;

  //show info banner
  document.querySelector(".tutorial").classList.remove("is-hidden");

  //clear selected players
  document.getElementById("left-summary").innerHTML = "";
  document.getElementById("right-summary").innerHTML = "";

  //for newly selected season, create autocomplete search form on right and left side
  createAutoComplete({
    ...autoCompleteConfig,
    root: document.querySelector("#left-autocomplete"),
    onOptionSelect(player) {
      document.querySelector(".tutorial").classList.add("is-hidden");
      onPlayerSelect(
        player,
        document.querySelector("#left-summary"),
        "left",
        firstYear,
        secondYear
      );
    },
  });

  createAutoComplete({
    ...autoCompleteConfig,
    root: document.querySelector("#right-autocomplete"),
    onOptionSelect(player) {
      document.querySelector(".tutorial").classList.add("is-hidden");
      onPlayerSelect(
        player,
        document.querySelector("#right-summary"),
        "right",
        firstYear,
        secondYear
      );
    },
  });
});

//show instructions on initial page load
document.getElementById(
  "season"
).innerHTML = `to compare their regular season averages <br/>(${years[0].name} NBA season)`;

//initialize left and rightPlayer variables
let leftPlayer;
let rightPlayer;

//function to run when player is selected from dropdown
const onPlayerSelect = async (
  player,
  summaryElement,
  side,
  firstYear = years[0].value,
  secondYear = years[0].value + 1
) => {
  //retrieve balldontlie.io player info
  const bdlPlayer = await bdlPlayerFetch(player.id);

  //retrieve balldonlie.io player season averages
  const bdlStats = await bdlStatsFetch(firstYear, player.id);

  //retrieve current list of NBA players from NBA API
  const nbaPlayer = await nbaPlayersFetch(firstYear);

  //retrieve current list of NBA teams from NBA API
  //year does not matter since team codes stay the same
  const nbaTeams = await nbaTeamsFetch();

  if (!bdlPlayer || !bdlStats) {
    //check if data from balldontlie.io is available
    summaryElement.innerHTML = `
    <article class="notification is-danger">
      <p class="title">Uh oh!</p>
      <p class="subtitle">There was an error retrieving player data from the balldontlie.io servers. Please try again later.</p>
    </article>
    `;
  } else if (!bdlStats.data.data.length) {
    //check if selected player was active during given season
    summaryElement.innerHTML = `
    <article class="notification is-danger">
      <p class="title">Uh oh!</p>
      <p class="subtitle">Please select a player who played in the ${firstYear}-${secondYear} NBA season.</p>
    </article>
    `;
  } else if (
    //check if data from NBA API is available (temp error handler for production CORS error)
    !nbaPlayer ||
    !nbaTeams
  ) {
    summaryElement.innerHTML = `
    <article class="notification is-danger">
      <p class="title">Uh oh!</p>
      <p class="subtitle">There was an error retrieving player data from the NBA servers. Please try selecting a different season and searching for a player, or try again later.</p>
    </article>
    `;
  } else {
    //populate column with player info
    summaryElement.innerHTML = playerTemplate(
      bdlPlayer.data,
      bdlStats.data.data[0],
      nbaPlayer.data.league.standard,
      nbaTeams.data.league.standard
    );

    //choose which side the player appears on
    if (side === "left") {
      leftPlayer = bdlPlayer.data;
    } else {
      rightPlayer = bdlPlayer.data;
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
  if (leftSideStats.length > 0 && rightSideStats.length > 0) {
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
  }
};

//initialize NBA API variables
let nbaID;
let nbaTeamID;
let nbaDOB;
let nbaJerseyNo;
let nbaHeightFt;
let nbaHeightIn;
let nbaWeight;
let nbaTeamName;
let nbaTeamAbbr;

const playerTemplate = (
  bdlPlayerDetail,
  bdlPlayerStats,
  nbaPlayerDetail,
  nbaTeamDetail
) => {
  //use regex to convert mpg to float
  const mpg = parseFloat(bdlPlayerStats.min.replace(/:/g, "."));

  //search list of NBA players from NBA API based on selected player
  for (let i = 0; i < nbaPlayerDetail.length; i++) {
    if (
      nbaPlayerDetail[i].firstName === bdlPlayerDetail.first_name &&
      nbaPlayerDetail[i].lastName === bdlPlayerDetail.last_name
    ) {
      nbaID = nbaPlayerDetail[i].personId;
      nbaTeamID = nbaPlayerDetail[i].teamId.split(" ")[0];
      nbaDOB = nbaPlayerDetail[i].dateOfBirthUTC;
      nbaJerseyNo = nbaPlayerDetail[i].jersey;
      nbaHeightFt = nbaPlayerDetail[i].heightFeet;
      nbaHeightIn = nbaPlayerDetail[i].heightInches;
      nbaWeight = nbaPlayerDetail[i].weightPounds;
    }
  }

  //search list of NBA teams from NBA API based on selected player teamID
  for (let i = 0; i < nbaTeamDetail.length; i++) {
    if (nbaTeamDetail[i].teamId === nbaTeamID) {
      {
        nbaTeamName = nbaTeamDetail[i].fullName;
        nbaTeamAbbr = nbaTeamDetail[i].tricode;
      }
    }
  }

  //replace bio data if undefined in NBA API response (re. 2019 data)
  if (nbaHeightFt === "-" || nbaHeightIn === "-" || !nbaWeight || !nbaDOB) {
    nbaHeightFt = bdlPlayerDetail.height_feet;
    nbaHeightIn = bdlPlayerDetail.height_inches;
    nbaWeight = bdlPlayerDetail.weight_pounds;
    nbaDOB = "Not listed this year";
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
          <p class="team">${nbaTeamName} 
          <span class="icon is-medium">
            <img src="https://www.nba.com/.element/img/1.0/teamsites/logos/teamlogos_500x500/${nbaTeamAbbr.toLowerCase()}.png"></i>
          </span>
        </p>
          <p>#${nbaJerseyNo} | ${bdlPlayerDetail.position}</p>
          <p>${nbaHeightFt}'-${nbaHeightIn}",
          ${nbaWeight} lbs</p>
          <p>DOB: ${nbaDOB}</>
        </div>
      </div>
      </article>
      <article data-value=${
        bdlPlayerStats.games_played
      } class="notification is-success">
        <p class="title">${bdlPlayerStats.games_played}</p>
        <p class="subtitle">Games Played</p>
      </article>
      <article data-value=${mpg} class="notification is-success">
        <p class="title">${bdlPlayerStats.min}</p>
        <p class="subtitle">Minutes Per Game</p>
      </article>
      <article data-value=${bdlPlayerStats.pts} class="notification is-success">
        <p class="title">${bdlPlayerStats.pts.toFixed(2)}</p>
        <p class="subtitle">Points Per Game</p>
      </article>
      <article data-value=${bdlPlayerStats.reb} class="notification is-success">
        <p class="title">${bdlPlayerStats.reb.toFixed(2)}</p>
        <p class="subtitle">Rebounds Per Game</p>
      </article>
      <article data-value=${bdlPlayerStats.ast} class="notification is-success">
        <p class="title">${bdlPlayerStats.ast.toFixed(2)}</p>
        <p class="subtitle">Assists Per Game</p>
      </article>
      <article data-value=${
        bdlPlayerStats.fg_pct
      } class="notification is-success">
        <p class="title">${bdlPlayerStats.fg_pct.toFixed(3)}</p>
        <p class="subtitle">FG%</p>
      </article>
      <article data-value=${
        bdlPlayerStats.fg3_pct
      } class="notification is-success">
        <p class="title">${bdlPlayerStats.fg3_pct.toFixed(3)}</p>
        <p class="subtitle">3PT%</p>
      </article>
      <article data-value=${
        bdlPlayerStats.ft_pct
      } class="notification is-success">
        <p class="title">${bdlPlayerStats.ft_pct.toFixed(3)}</p>
        <p class="subtitle">FT%</p>
      </article>
      <article data-value=${bdlPlayerStats.blk} class="notification is-success">
        <p class="title">${bdlPlayerStats.blk.toFixed(2)}</p>
        <p class="subtitle">Blocks Per Game</p>
      </article>
      <article data-value=${bdlPlayerStats.stl} class="notification is-success">
        <p class="title">${bdlPlayerStats.stl.toFixed(2)}</p>
        <p class="subtitle">Steals Per Game</p>
      </article>
  `;
};

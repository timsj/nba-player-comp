import axios from "axios";
import teamData from "../data/teams.json";

const bdl = axios.create({
  baseURL: "https://www.balldontlie.io/api/v1/",
});

const nba = axios.create({
  baseURL: "https://data.nba.net/data/10s/prod/v1/",
});

const errorHandler = (error, apiProvider) => {
  if (error.response) {
    console.log(
      `The request was made to ${apiProvider}, but the server responded with a status code ${error.response.status}.`
    );
    console.log("Response data: ", error.response.data);
    console.log("Response headers: ", error.response.headers);
  } else if (error.request) {
    console.log(
      `The request was made to ${apiProvider}, but no response was received. The following is the XHR instance: `,
      error.request
    );
  } else {
    // Something happened in setting up the request that triggered an Error
    console.log("Error: ", error.message);
  }
};

export const bdlPlayersFetch = async (query) => {
  try {
    const response = await bdl.get("/players", { params: { search: query } });
    return response.data.data;
  } catch (error) {
    errorHandler(error, "balldontlie.io");
    return [
      {
        error:
          "&#9888;&#65039;&nbsp;There was an error retrieving data from the balldontlie.io servers. Please try again later.",
      },
    ];
  }
};

export const bdlPlayerFetch = async (playerID) => {
  try {
    const response = await bdl.get(`players/${playerID}`);
    return response;
  } catch (error) {
    errorHandler(error, "balldontlie.io");
  }
};

export const bdlStatsFetch = async (firstYear, playerID) => {
  try {
    const response = await bdl.get(
      `season_averages?season=${firstYear}&player_ids[]=${playerID}`
    );
    return response;
  } catch (error) {
    errorHandler(error, "balldontlie.io");
  }
};

export const nbaPlayersFetch = async (selectedYear) => {
  // try {
  //   const response = await nba.get(`${selectedYear}/players.json`);
  //   return response;
  // } catch (error) {
  //   errorHandler(error, "data.nba.net");
  // }

  let playerData;

  let { p2016, p2017, p2018, p2019, p2020, p2021, p2022 } = await import(
    "../data/players"
  );

  const obj = {
    p2016,
    p2017,
    p2018,
    p2019,
    p2020,
    p2021,
    p2022,
  };

  playerData = obj[`p${selectedYear}`];
  return playerData;
};

export const nbaTeamsFetch = async () => {
  // try {
  //   const response = await nba.get("2022/teams.json");
  //   return response;
  // } catch (error) {
  //   errorHandler(error, "data.nba.net");
  // }
  return teamData;
};
